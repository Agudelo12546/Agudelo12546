import type { Metadata } from "next";
import { DeleteAccountForm, ProfileForm } from "./AccountForms";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Mi cuenta" };

export default async function AccountPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data: consents } = await supabase
    .from("consents")
    .select("kind, version, accepted_at")
    .order("accepted_at", { ascending: false });

  return (
    <section className="view">
      <h2>Mi cuenta</h2>
      <p className="sub">Aquí puedes consultar, corregir o borrar tus datos cuando quieras.</p>
      <ProfileForm profile={profile} />
      <div className="card">
        <h3 style={{ fontSize: 18, fontWeight: 800 }}>Autorizaciones que diste</h3>
        {consents?.length ? (
          <ul style={{ margin: 0, paddingLeft: "1.2em" }}>
            {consents.map((c) => (
              <li key={c.kind + c.version}>
                {c.kind === "data_policy" ? "Tratamiento de datos personales" : "Términos de uso"} · versión {c.version} ·{" "}
                {new Date(c.accepted_at).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })}
              </li>
            ))}
          </ul>
        ) : (
          <p className="msg">No hay autorizaciones registradas.</p>
        )}
      </div>
      <DeleteAccountForm />
    </section>
  );
}
