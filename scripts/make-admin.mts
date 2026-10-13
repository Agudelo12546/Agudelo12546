/**
 * Convierte una cuenta ya registrada en admin.
 * Uso: pnpm admin:make tu-correo@gmail.com
 */
import { createClient } from "@supabase/supabase-js";

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error("Uso: pnpm admin:make tu-correo@gmail.com");
  process.exit(1);
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});

const { data, error } = await supabase.from("profiles").update({ role: "admin" }).eq("email", email).select("full_name");
if (error) {
  console.error("Error:", error.message);
  process.exit(1);
}
if (!data?.length) {
  console.error(`No existe una cuenta con ${email}. Regístrate primero en /registro.`);
  process.exit(1);
}
console.log(`Listo: ${data[0].full_name} (${email}) ahora es admin. Recarga la página para ver el Panel.`);
