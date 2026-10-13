"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { formValues, type FormState } from "@/lib/form";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { fieldErrors, profileSchema } from "@/lib/validation";

export async function updateProfile(_prev: FormState, fd: FormData): Promise<FormState> {
  const profile = await requireProfile();
  const parsed = profileSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: formValues(fd), message: "Revisa los campos marcados." };
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update(parsed.data).eq("id", profile.id);
  if (error) return { values: formValues(fd), message: "No pudimos guardar. Intenta de nuevo." };
  revalidatePath("/", "layout");
  return { ok: true, message: "Datos actualizados." };
}

/** Borra la cuenta y, en cascada, el perfil, los consentimientos y todo lo asociado. */
export async function deleteAccount(_prev: FormState, fd: FormData): Promise<FormState> {
  const profile = await requireProfile();
  if (String(fd.get("confirm") ?? "").trim().toUpperCase() !== "BORRAR") {
    return { errors: { confirm: 'Escribe BORRAR para confirmar.' } };
  }
  const supabase = await createClient();
  const { error } = await createAdminClient().auth.admin.deleteUser(profile.id);
  if (error) return { message: "No pudimos borrar tu cuenta. Escríbenos y lo hacemos por ti." };
  await supabase.auth.signOut();
  redirect("/?cuenta=borrada");
}
