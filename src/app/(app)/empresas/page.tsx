import type { Metadata } from "next";
import { VideoCard, type Video } from "@/components/VideoCard";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { signVideoUrls } from "@/lib/videos";

export const metadata: Metadata = { title: "Empresas" };

type Job = { id: string; title: string; location: string | null; looking_for: string | null; description: string | null };
type Company = {
  id: string;
  name: string;
  sector: string | null;
  city: string | null;
  website: string | null;
  description: string | null;
  is_sample: boolean;
  jobs: Job[];
  interview_videos: (Video & { job_id: string | null; position: number })[];
};

function lines(text: string | null) {
  return (text ?? "")
    .split(/\n+/)
    .map((l) => l.replace(/^[\s•\-*·]+/, "").trim())
    .filter(Boolean);
}

export default async function CompaniesPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const { data, error } = await supabase
    .from("companies")
    .select(
      "id, name, sector, city, website, description, is_sample, jobs(id, title, location, looking_for, description), interview_videos(id, title, recruiter_name, recruiter_role, kind, storage_path, url, job_id, position)",
    )
    .eq("published", true)
    .eq("jobs.status", "published")
    .order("name")
    .order("position", { referencedTable: "interview_videos" })
    .order("created_at", { referencedTable: "jobs", ascending: false });

  const companies = (data ?? []) as Company[];
  const signed = await signVideoUrls(supabase, companies.flatMap((c) => c.interview_videos));

  return (
    <section className="view">
      <h2>Empresas</h2>
      <p className="sub">
        Mira las entrevistas antes de aplicar: ahí los reclutadores cuentan qué buscan y cómo eligen. Usa esas palabras en
        tu hoja de vida.
      </p>

      {error && <p className="notice">No pudimos cargar las empresas. Recarga la página.</p>}

      {!error && companies.length === 0 && (
        <div className="empty">
          <b>Todavía no hay empresas publicadas.</b>
          <span>
            {profile?.role === "admin"
              ? "Agrega la primera desde el Panel."
              : "Vuelve pronto: estamos grabando las entrevistas con reclutadores."}
          </span>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {companies.map((c) => (
          <article className="card" key={c.id} aria-labelledby={`c-${c.id}`}>
            <div className="vac-h">
              <div>
                <h3 id={`c-${c.id}`}>{c.name}</h3>
                <p className="meta">{[c.sector, c.city].filter(Boolean).join(" · ")}</p>
              </div>
              {c.is_sample && <span className="pill sent">De ejemplo</span>}
            </div>

            {c.description && <p style={{ whiteSpace: "pre-wrap" }}>{c.description}</p>}

            {c.interview_videos.length > 0 && (
              <div className="buscan">
                <span className="label">Entrevistas</span>
                <div className="videos">
                  {c.interview_videos.map((v) => (
                    <VideoCard key={v.id} video={v} signedUrl={v.storage_path ? signed[v.storage_path] : undefined} />
                  ))}
                </div>
              </div>
            )}

            {c.jobs.map((j) => {
              const buscan = lines(j.looking_for);
              return (
                <div key={j.id} className="expblock">
                  <div className="vac-h">
                    <div>
                      <b style={{ fontSize: 17 }}>{j.title}</b>
                      {j.location && <p className="meta msg">{j.location}</p>}
                    </div>
                  </div>
                  {buscan.length > 0 && (
                    <div className="buscan">
                      <span className="label">Qué buscan</span>
                      <ul>
                        {buscan.map((l) => (
                          <li key={l}>{l}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {j.description && (
                    <details className="tips">
                      <summary>Descripción del cargo</summary>
                      <p style={{ whiteSpace: "pre-wrap", marginTop: 8 }}>{j.description}</p>
                    </details>
                  )}
                  <div className="row">
                    <button className="btn hl" type="button" disabled>
                      Aplicar con mi hoja de vida
                    </button>
                    <span className="msg">Muy pronto podrás aplicar desde aquí.</span>
                  </div>
                </div>
              );
            })}
          </article>
        ))}
      </div>
    </section>
  );
}
