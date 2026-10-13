import type { Metadata } from "next";
import { CONSENT_VERSION } from "@/lib/validation";

export const metadata: Metadata = { title: "Política de tratamiento de datos" };

export default function PrivacyPage() {
  return (
    <>
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>Política de tratamiento de datos personales</h1>
      <p className="msg">Versión {CONSENT_VERSION}. Ley 1581 de 2012 y Decreto 1377 de 2013 (Colombia).</p>

      <h2>1. Responsable</h2>
      <p>[Razón social, NIT, dirección y correo de contacto de Trabajo Ya — por completar].</p>

      <h2>2. Qué datos recogemos</h2>
      <ul>
        <li>Al registrarte: nombre, correo, celular, edad, ciudad, situación actual y, si quieres, universidad y carrera.</li>
        <li>Tu hoja de vida y tu información de LinkedIn, cuando las escribes en la plataforma.</li>
        <li>Tus postulaciones y las respuestas de las empresas.</li>
      </ul>
      <p>No pedimos cédula, estado civil ni foto obligatoria.</p>

      <h2>3. Para qué los usamos</h2>
      <ul>
        <li>Crear y mostrar tu hoja de vida, y enviarla a las empresas a las que decidas aplicar.</li>
        <li>Avisarte cuando una empresa responde.</li>
        <li>Mejorar el producto con estadísticas agregadas y anónimas.</li>
      </ul>
      <p>
        Tu edad es privada: solo se usa en estadísticas agregadas. Nunca la ven las empresas ni aparece en tu hoja de
        vida.
      </p>

      <h2>4. Con quién los compartimos</h2>
      <p>
        Solo con las empresas a las que aplicas, y solo después de que lo autorizas en cada postulación. Las universidades
        aliadas ven solo cifras agregadas, salvo que autorices compartir tu información.
      </p>

      <h2>5. Tus derechos</h2>
      <p>
        Puedes conocer, actualizar, rectificar y suprimir tus datos, y revocar esta autorización. Desde{" "}
        <b>Mi cuenta</b> puedes corregir tus datos o borrar tu cuenta con toda su información. También puedes escribir a
        [correo de contacto].
      </p>

      <h2>6. Seguridad y conservación</h2>
      <p>[Por completar con el abogado: medidas de seguridad, plazos de conservación, transferencia internacional a proveedores en la nube].</p>
    </>
  );
}
