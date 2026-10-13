import { expect, test } from "@playwright/test";
import { deleteUserByEmail, PASSWORD, signUp, uniqueEmail } from "./helpers";

test.describe("registro y cuenta", () => {
  const email = uniqueEmail("candidata");
  test.afterAll(() => deleteUserByEmail(email));

  test("muestra errores claros si faltan datos o el consentimiento", async ({ page }) => {
    await page.goto("/registro");
    await page.getByLabel("Celular *").fill("123");
    await page.getByRole("button", { name: "Crear mi cuenta" }).click();
    await expect(page.getByText("Escribe tu nombre completo.")).toBeVisible();
    await expect(page.getByText(/celular colombiano de 10 dígitos/)).toBeVisible();
    await expect(page.getByText(/Debes aceptar la política de tratamiento de datos/)).toBeVisible();
    await expect(page).toHaveURL(/\/registro$/);
  });

  test("se registra, ve empresas, consulta sus datos y no entra al panel", async ({ page }) => {
    await signUp(page, email);
    await expect(page.getByRole("heading", { name: "Empresas", level: 2 })).toBeVisible();

    await page.goto("/admin");
    await expect(page).toHaveURL(/\/empresas$/);
    await expect(page.getByRole("link", { name: "Panel" })).toHaveCount(0);

    await page.goto("/mi-cuenta");
    await expect(page.getByLabel("Celular")).toHaveValue("3001234567");
    await expect(page.getByText(/Tratamiento de datos personales · versión/)).toBeVisible();

    await page.getByLabel("Ciudad").fill("Envigado");
    await page.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(page.getByText("Datos actualizados.")).toBeVisible();

    await page.getByRole("button", { name: "Salir" }).click();
    await expect(page).toHaveURL(/\/$/);
    await page.goto("/ingresar");
    await page.getByLabel("Correo").fill(email);
    await page.getByLabel("Contraseña").fill("incorrecta");
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByText("Correo o contraseña incorrectos.")).toBeVisible();
    await page.getByLabel("Contraseña").fill(PASSWORD);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/empresas$/);
  });

  test("borra su cuenta y sus datos", async ({ page }) => {
    const other = uniqueEmail("borrar");
    await signUp(page, other, "Persona Que Borra");
    await page.goto("/mi-cuenta");
    await page.getByLabel("Escribe BORRAR para confirmar").fill("BORRAR");
    await page.getByRole("button", { name: "Borrar mi cuenta para siempre" }).click();
    await expect(page).toHaveURL(/\/\?cuenta=borrada$/);
    await page.goto("/ingresar");
    await page.getByLabel("Correo").fill(other);
    await page.getByLabel("Contraseña").fill(PASSWORD);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByText("Correo o contraseña incorrectos.")).toBeVisible();
  });
});
