"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { formValues, type FormState } from "@/lib/form";
import { createClient } from "@/lib/supabase/server";
import { companySchema, fieldErrors, jobSchema, slugify, videoLinkSchema, videoUploadSchema } from "@/lib/validation";
import { VIDEO_BUCKET } from "@/lib/videos";

// Todas las acciones verifican el rol aquí y, de nuevo, la base de datos con RLS.

function refresh(companyId?: string) {
  revalidatePath("/admin");
  revalidatePath("/empresas");
  if (companyId) revalidatePath(`/admin/empresas/${companyId}`);
}

async function uniqueSlug(supabase: Awaited<ReturnType<typeof createClient>>, name: string, exceptId?: string) {
  const base = slugify(name) || "empresa";
  const { data } = await supabase.from("companies").select("id, slug").like("slug", `${base}%`);
  const taken = new Set((data ?? []).filter((r) => r.id !== exceptId).map((r) => r.slug));
  let slug = base;
  for (let i = 2; taken.has(slug); i++) slug = `${base}-${i}`;
  return slug;
}

export async function createCompany(_prev: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const parsed = companySchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: formValues(fd) };
  const supabase = await createClient();
  const slug = await uniqueSlug(supabase, parsed.data.name);
  const { data, error } = await supabase
    .from("companies")
    .insert({ ...parsed.data, slug, created_by: admin.id })
    .select("id")
    .single();
  if (error || !data) return { values: formValues(fd), message: "No se pudo crear la empresa." };
  refresh();
  redirect(`/admin/empresas/${data.id}`);
}

export async function updateCompany(companyId: string, _prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = companySchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: formValues(fd) };
  const supabase = await createClient();
  const slug = await uniqueSlug(supabase, parsed.data.name, companyId);
  const { error } = await supabase.from("companies").update({ ...parsed.data, slug }).eq("id", companyId);
  if (error) return { values: formValues(fd), message: "No se pudo guardar." };
  refresh(companyId);
  return { ok: true, message: parsed.data.published ? "Guardada y visible para los candidatos." : "Guardada (oculta)." };
}

export async function deleteCompany(companyId: string): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();
  const { data: files } = await supabase.storage.from(VIDEO_BUCKET).list(companyId, { limit: 1000 });
  if (files?.length) {
    await supabase.storage.from(VIDEO_BUCKET).remove(files.map((f) => `${companyId}/${f.name}`));
  }
  await supabase.from("companies").delete().eq("id", companyId);
  refresh();
  redirect("/admin");
}

export async function createJob(companyId: string, _prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = jobSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: formValues(fd) };
  const supabase = await createClient();
  const { error } = await supabase.from("jobs").insert({ ...parsed.data, company_id: companyId });
  if (error) return { values: formValues(fd), message: "No se pudo crear la vacante." };
  refresh(companyId);
  return { ok: true, message: "Vacante creada." };
}

export async function updateJob(jobId: string, companyId: string, _prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = jobSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: formValues(fd) };
  const supabase = await createClient();
  const { error } = await supabase.from("jobs").update(parsed.data).eq("id", jobId);
  if (error) return { values: formValues(fd), message: "No se pudo guardar." };
  refresh(companyId);
  return { ok: true, message: "Guardada." };
}

export async function deleteJob(jobId: string, companyId: string): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("jobs").delete().eq("id", jobId);
  refresh(companyId);
}

async function nextPosition(supabase: Awaited<ReturnType<typeof createClient>>, companyId: string) {
  const { data } = await supabase
    .from("interview_videos")
    .select("position")
    .eq("company_id", companyId)
    .order("position", { ascending: false })
    .limit(1);
  return (data?.[0]?.position ?? -1) + 1;
}

export async function addVideoLink(companyId: string, _prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = videoLinkSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: formValues(fd) };
  const supabase = await createClient();
  const { error } = await supabase.from("interview_videos").insert({
    ...parsed.data,
    company_id: companyId,
    kind: "link",
    position: await nextPosition(supabase, companyId),
  });
  if (error) return { values: formValues(fd), message: "No se pudo guardar el video." };
  refresh(companyId);
  return { ok: true, message: "Video agregado." };
}

/** Registra un video que el navegador ya subió a Storage. */
export async function registerUploadedVideo(
  companyId: string,
  input: { title: string; recruiter_name?: string; recruiter_role?: string; job_id?: string; storage_path: string },
): Promise<FormState> {
  await requireAdmin();
  const parsed = videoUploadSchema.safeParse(input);
  if (!parsed.success || !parsed.data.storage_path.startsWith(`${companyId}/`)) {
    return { errors: parsed.success ? {} : fieldErrors(parsed.error), message: "Datos del video inválidos." };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("interview_videos").insert({
    ...parsed.data,
    company_id: companyId,
    kind: "upload",
    position: await nextPosition(supabase, companyId),
  });
  if (error) {
    await supabase.storage.from(VIDEO_BUCKET).remove([parsed.data.storage_path]);
    return { message: "No se pudo guardar el video." };
  }
  refresh(companyId);
  return { ok: true, message: "Video subido y publicado en la empresa." };
}

export async function deleteVideo(videoId: string, companyId: string): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase.from("interview_videos").select("storage_path").eq("id", videoId).single();
  if (data?.storage_path) await supabase.storage.from(VIDEO_BUCKET).remove([data.storage_path]);
  await supabase.from("interview_videos").delete().eq("id", videoId);
  refresh(companyId);
}
