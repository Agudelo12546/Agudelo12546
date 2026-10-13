import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = { title: "Mis postulaciones" };

export default function ApplicationsPage() {
  return (
    <ComingSoon
      title="Mis postulaciones"
      sub="Cuando una empresa revisa tu hoja de vida, el estado cambia aquí. Si le interesas, verás su mensaje."
      what={["Aplicar con un clic a las vacantes de Empresas.", "Ver si la empresa vio tu hoja de vida y su respuesta."]}
    />
  );
}
