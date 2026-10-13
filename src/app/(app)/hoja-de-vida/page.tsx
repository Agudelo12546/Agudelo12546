import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = { title: "Mi hoja de vida" };

export default function ResumePage() {
  return (
    <ComingSoon
      title="Mi hoja de vida"
      sub="Escribe tu información como te salga. Te damos un puntaje, la IA la convierte en una hoja de vida profesional y la descargas en PDF."
      what={[
        "Llenar tu hoja de vida por pasos y ver tu puntaje de 0 a 100.",
        "Convertir lo que hiciste en logros con verbo y cifra usando IA.",
        "Descargarla en PDF lista para enviar.",
      ]}
    />
  );
}
