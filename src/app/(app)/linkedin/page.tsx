import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = { title: "LinkedIn" };

export default function LinkedinPage() {
  return (
    <ComingSoon
      title="LinkedIn"
      sub="Aprende paso a paso a tener un perfil que los reclutadores encuentran y usa el optimizador con IA para hacerlo más rápido."
      what={["Seguir la ruta en 18 pasos.", "Medir tu perfil y reescribirlo con IA.", "Revisar tu foto de perfil."]}
    />
  );
}
