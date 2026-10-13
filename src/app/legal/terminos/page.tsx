import type { Metadata } from "next";
import { CONSENT_VERSION } from "@/lib/validation";

export const metadata: Metadata = { title: "Términos de uso" };

export default function TermsPage() {
  return (
    <>
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>Términos de uso</h1>
      <p className="msg">Versión {CONSENT_VERSION}.</p>
      <h2>1. Qué es Trabajo Ya</h2>
      <p>Una plataforma para crear tu hoja de vida, ver entrevistas con reclutadores y aplicar a empresas.</p>
      <h2>2. Tu cuenta</h2>
      <p>Debes dar información verdadera y cuidar tu contraseña. Puedes borrar tu cuenta cuando quieras.</p>
      <h2>3. Uso de la inteligencia artificial</h2>
      <p>
        Las sugerencias de la IA son una ayuda. Revisa todo antes de enviarlo: tú eres responsable de que tu hoja de vida
        diga la verdad.
      </p>
      <h2>4. Videos y contenido</h2>
      <p>Los videos de entrevistas son de uso personal dentro de la plataforma; no los descargues ni los redistribuyas.</p>
      <h2>5. Pendiente</h2>
      <p>[Por completar con el abogado: responsabilidad, propiedad intelectual, ley aplicable, cambios a los términos].</p>
    </>
  );
}
