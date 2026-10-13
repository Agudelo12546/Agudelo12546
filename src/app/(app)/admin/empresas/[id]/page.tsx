import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteCompany, deleteJob, deleteVideo } from "../../actions";
import { CompanyForm, ConfirmDelete, JobForm, VideoLinkForm, type CompanyRow, type JobRow } from "../../AdminForms";
import { VideoUploader } from "../../VideoUploader";
import { VideoCard, type Video } from "@/components/VideoCard";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { signVideoUrls } from "@/lib/videos";

export const metadata: Metadata = { title: "Editar empresa" };

const STATUS_PILL = { draft: ["sent", "Borrador"], published: ["yes", "Publicada"], closed: ["no", "Cerrada"] } as const;

export default async function AdminCompanyPage({ params }: PageProps<"/admin/empresas/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("companies")
    .select(
      "id, name, sector, city, website, description, published, jobs(id, title, location, looking_for, description, status, created_at), interview_videos(id, title, recruiter_name, recruiter_role, kind, storage_path, url, job_id, position)",
    )
    .eq("id", id)
    .order("position", { referencedTable: "interview_videos" })
    .order("created_at", { referencedTable: "jobs", ascending: false })
    .maybeSingle();
  if (!data) notFound();

  const company = data as CompanyRow & { jobs: JobRow[]; interview_videos: (Video & { job_id: string | null })[] };
  const signed = await signVideoUrls(supabase, company.interview_videos);
  const jobTitle = Object.fromEntries(company.jobs.map((j) => [j.id, j.title]));

  return (
    <section className="view">
      <p className="msg">
        <Link href="/admin">← Panel</Link>
      </p>
      <div className="vac-h">
        <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-.02em" }}>{company.name}</h2>
        <span className={company.published ? "pill yes" : "pill sent"}>{company.published ? "Publicada" : "Oculta"}</span>
      </div>

      <CompanyForm company={company} />

      <div className="section-sep">
        <h3>Entrevistas en video</h3>
      </div>
      <div className="card">
        {company.interview_videos.length ? (
          <div className="videos">
            {company.interview_videos.map((v) => (
              <VideoCard key={v.id} video={v} signedUrl={v.storage_path ? signed[v.storage_path] : undefined}>
                {v.job_id && jobTitle[v.job_id] && <span className="msg" style={{ fontSize: 13 }}>Vacante: {jobTitle[v.job_id]}</span>}
                <ConfirmDelete action={deleteVideo.bind(null, v.id, company.id)} label="Quitar video" confirm="Confirmar: quitar" />
              </VideoCard>
            ))}
          </div>
        ) : (
          <p className="msg">Sin videos todavía.</p>
        )}
      </div>
      <div className="card">
        <h3 style={{ fontSize: 18, fontWeight: 800 }}>Subir un video desde tu computador</h3>
        <VideoUploader companyId={company.id} jobs={company.jobs} />
      </div>
      <details className="card">
        <summary style={{ cursor: "pointer", fontWeight: 700 }}>…o agregar un enlace de YouTube o Drive</summary>
        <VideoLinkForm companyId={company.id} jobs={company.jobs} />
      </details>

      <div className="section-sep">
        <h3>Vacantes</h3>
      </div>
      {company.jobs.map((j) => (
        <details className="card" key={j.id}>
          <summary className="vac-h" style={{ cursor: "pointer", listStyle: "none" }}>
            <b>{j.title}</b>
            <span className={`pill ${STATUS_PILL[j.status][0]}`}>{STATUS_PILL[j.status][1]}</span>
          </summary>
          <JobForm companyId={company.id} job={j} />
          <ConfirmDelete action={deleteJob.bind(null, j.id, company.id)} label="Borrar vacante" confirm={`Confirmar: borrar ${j.title}`} />
        </details>
      ))}
      <div className="card">
        <h3 style={{ fontSize: 18, fontWeight: 800 }}>Nueva vacante</h3>
        <JobForm companyId={company.id} />
      </div>

      <div className="section-sep">
        <h3>Zona de peligro</h3>
      </div>
      <div className="card">
        <p className="msg">Borra la empresa, sus vacantes y sus videos (también los archivos subidos).</p>
        <ConfirmDelete action={deleteCompany.bind(null, company.id)} label="Borrar empresa" confirm={`Confirmar: borrar ${company.name}`} />
      </div>
    </section>
  );
}
