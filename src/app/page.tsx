import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth";

export default async function Home() {
  const profile = await getCurrentProfile();
  return (
    <>
      <div className="top">
        <div className="wrap vac-h" style={{ alignItems: "center", paddingBottom: 12 }}>
          <span className="brand">Trabajo Ya</span>
          {profile ? (
            <Link href="/empresas" className="btn sm" style={{ textDecoration: "none" }}>
              Entrar
            </Link>
          ) : (
            <Link href="/ingresar" className="btn ghost sm" style={{ textDecoration: "none" }}>
              Iniciar sesión
            </Link>
          )}
        </div>
      </div>
      <main className="wrap">
        <header className="intro">
          <h1>
            Mira qué buscan las empresas y <mark>aplica con un clic</mark>
          </h1>
          <div className="steps">
            <div className="step">
              <span className="k">1</span>
              <div>
                <b>Llena tu hoja de vida</b>Una sola vez. Sirve para todas tus postulaciones.
              </div>
            </div>
            <div className="step">
              <span className="k">2</span>
              <div>
                <b>Mira las entrevistas</b>Reclutadores cuentan qué buscan y cómo eligen.
              </div>
            </div>
            <div className="step">
              <span className="k">3</span>
              <div>
                <b>Aplica y espera respuesta</b>Tu hoja de vida llega a la empresa. Si le interesas, te escribe aquí.
              </div>
            </div>
          </div>
          {!profile && (
            <div className="row" style={{ marginTop: 8 }}>
              <Link href="/registro" className="btn hl" style={{ textDecoration: "none" }}>
                Crear mi cuenta gratis
              </Link>
              <Link href="/ingresar" className="btn ghost" style={{ textDecoration: "none" }}>
                Ya tengo cuenta
              </Link>
            </div>
          )}
        </header>
        <footer className="msg" style={{ marginTop: 48, fontSize: 13 }}>
          <Link href="/legal/privacidad">Política de tratamiento de datos</Link> ·{" "}
          <Link href="/legal/terminos">Términos de uso</Link>
        </footer>
      </main>
    </>
  );
}
