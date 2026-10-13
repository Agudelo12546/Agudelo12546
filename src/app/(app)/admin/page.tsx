import type { Metadata } from "next";
import Link from "next/link";
import { CompanyForm } from "./AdminForms";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Panel" };

export default async function AdminPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: companies } = await supabase
    .from("companies")
    .select("id, name, sector, city, published, is_sample, jobs(count), interview_videos(count)")
    .order("created_at", { ascending: false });

  return (
    <section className="view">
      <h2>Panel de Trabajo Ya</h2>
      <p className="sub">
        Registra las empresas a medida que haces las entrevistas, sube los videos y publica las vacantes. Solo tú ves este
        panel.
      </p>

      <div className="section-sep">
        <h3>Empresas</h3>
      </div>
      {companies?.length ? (
        <div className="card" style={{ gap: 0 }}>
          {companies.map((c) => {
            const jobs = (c.jobs as unknown as { count: number }[])[0]?.count ?? 0;
            const vids = (c.interview_videos as unknown as { count: number }[])[0]?.count ?? 0;
            return (
              <div className="app-row" key={c.id}>
                <div>
                  <Link className="who" href={`/admin/empresas/${c.id}`}>
                    {c.name}
                  </Link>
                  <div className="when">
                    {[c.sector, c.city, `${vids} ${vids === 1 ? "video" : "videos"}`, `${jobs} ${jobs === 1 ? "vacante" : "vacantes"}`]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                </div>
                <div className="row" style={{ gap: 6 }}>
                  {c.is_sample && <span className="pill sent">De ejemplo</span>}
                  <span className={c.published ? "pill yes" : "pill sent"}>{c.published ? "Publicada" : "Oculta"}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty">
          <b>Aún no hay empresas.</b>
          <span>Crea la primera con el formulario de abajo.</span>
        </div>
      )}

      <CompanyForm />
    </section>
  );
}
