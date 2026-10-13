/**
 * Carga empresas y vacantes DE EJEMPLO para desarrollo (marcadas con is_sample).
 * Nunca correr contra producción: se niega si la URL no es local.
 * Uso: pnpm seed:sample        (pnpm seed:sample --borrar para quitarlas)
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
if (!/127\.0\.0\.1|localhost/.test(url)) {
  console.error("Este script solo corre contra la base local.");
  process.exit(1);
}
const supabase = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

await supabase.from("companies").delete().eq("is_sample", true);
if (process.argv.includes("--borrar")) {
  console.log("Empresas de ejemplo borradas.");
  process.exit(0);
}

const samples = [
  {
    company: {
      name: "Logística Andina (ejemplo)",
      slug: "logistica-andina-ejemplo",
      sector: "Logística",
      city: "Medellín",
      description: "Empresa ficticia para probar la plataforma.",
    },
    jobs: [
      {
        title: "Practicante de comercio exterior",
        location: "Medellín · híbrido",
        looking_for: "Excel intermedio\nInglés para hablar con proveedores\nQue haya liderado un proyecto, aunque sea de la universidad",
        description: "Apoyo en importaciones, seguimiento de embarques y costos logísticos.",
      },
    ],
  },
  {
    company: {
      name: "Banco Pacífico (ejemplo)",
      slug: "banco-pacifico-ejemplo",
      sector: "Banca",
      city: "Bogotá",
      description: "Empresa ficticia para probar la plataforma.",
    },
    jobs: [
      {
        title: "Analista junior de datos",
        location: "Bogotá · presencial",
        looking_for: "SQL y Power BI\nCuriosidad por el negocio\nQue sepa explicar un hallazgo en una frase",
        description: "Reportes de clientes y tableros para el área comercial.",
      },
    ],
  },
];

for (const s of samples) {
  const { data, error } = await supabase
    .from("companies")
    .insert({ ...s.company, published: true, is_sample: true })
    .select("id")
    .single();
  if (error || !data) throw error;
  await supabase.from("jobs").insert(s.jobs.map((j) => ({ ...j, company_id: data.id, status: "published", is_sample: true })));
}
console.log(`Listo: ${samples.length} empresas de ejemplo cargadas.`);
