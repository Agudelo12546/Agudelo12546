import { expect, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

export const service = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });

export function uniqueEmail(prefix: string) {
  return `${prefix}.${Date.now()}.${Math.floor(Math.random() * 1e4)}@prueba.trabajoya.co`;
}

export const PASSWORD = "clave-segura-123";

export async function signUp(page: Page, email: string, name = "Camila Restrepo") {
  await page.goto("/registro");
  await page.getByLabel("Nombre completo *").fill(name);
  await page.getByLabel("Correo *").fill(email);
  await page.getByLabel("Celular *").fill("300 123 4567");
  await page.getByLabel("Edad *").fill("21");
  await page.getByLabel("Ciudad *").fill("Medellín");
  await page.getByLabel("Situación actual *").selectOption("student");
  await page.getByLabel("Carrera").fill("Negocios Internacionales");
  await page.getByLabel("Contraseña *").fill(PASSWORD);
  await page.getByRole("checkbox", { name: /Autorizo a Trabajo Ya/ }).check();
  await page.getByRole("button", { name: "Crear mi cuenta" }).click();
  await expect(page).toHaveURL(/\/empresas$/);
}

export async function deleteUserByEmail(email: string) {
  const s = service();
  const { data } = await s.from("profiles").select("id").eq("email", email).maybeSingle();
  if (data) await s.auth.admin.deleteUser(data.id);
}
