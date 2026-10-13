import { expect, test } from "@playwright/test";
import { deleteUserByEmail, service, signUp, uniqueEmail } from "./helpers";

test.describe("panel: registrar empresa y subir entrevistas", () => {
  const adminEmail = uniqueEmail("admin");
  const candidateEmail = uniqueEmail("candidato");
  const companyName = `Empresa Prueba E2E ${Date.now()}`;

  test.afterAll(async () => {
    const s = service();
    const { data } = await s.from("companies").select("id").eq("name", companyName).maybeSingle();
    if (data) {
      const { data: files } = await s.storage.from("interview-videos").list(data.id);
      if (files?.length) await s.storage.from("interview-videos").remove(files.map((f) => `${data.id}/${f.name}`));
      await s.from("companies").delete().eq("id", data.id);
    }
    await deleteUserByEmail(adminEmail);
    await deleteUserByEmail(candidateEmail);
  });

  test("el admin crea la empresa, sube un video y el candidato lo ve", async ({ page, browser }) => {
    await signUp(page, adminEmail, "Matías Admin");
    await service().from("profiles").update({ role: "admin" }).eq("email", adminEmail);
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "Panel de Trabajo Ya" })).toBeVisible();

    // Crear empresa (oculta)
    await page.getByLabel("Empresa *").fill(companyName);
    await page.getByLabel("Sector").fill("Logística");
    await page.getByLabel("Ciudad").fill("Medellín");
    await page.getByRole("button", { name: "Crear empresa" }).click();
    await expect(page).toHaveURL(/\/admin\/empresas\/[0-9a-f-]+$/);
    await expect(page.getByRole("heading", { name: companyName })).toBeVisible();

    // Vacante
    await page.getByLabel("Cargo *").fill("Practicante de compras");
    await page.getByLabel("Qué buscan (una idea por línea)").fill("Excel intermedio\nInglés B1");
    await page.getByRole("button", { name: "Agregar vacante" }).click();
    await expect(page.getByText("Vacante creada.")).toBeVisible();

    // Subir video desde el computador (subida reanudable a Storage)
    await page.locator("#vu-file").setInputFiles({
      name: "Entrevista reclutadora.mp4",
      mimeType: "video/mp4",
      buffer: Buffer.alloc(256 * 1024, 1),
    });
    await page.locator("#vu-title").fill("Qué buscamos en un practicante");
    await page.locator("#vu-rn").fill("Laura Pérez");
    await page.getByRole("button", { name: "Subir video" }).click();
    await expect(page.getByText("Video subido y publicado en la empresa.")).toBeVisible({ timeout: 30_000 });

    // Enlace de YouTube
    await page.getByText("…o agregar un enlace de YouTube o Drive").click();
    await page.locator("#vl-title").fill("Errores que descartan");
    await page.locator("#vl-url").fill("https://youtu.be/dQw4w9WgXcQ");
    await page.getByRole("button", { name: "Agregar enlace" }).click();
    await expect(page.getByText("Video agregado.")).toBeVisible();
    await expect(page.locator("video")).toHaveCount(1);
    await expect(page.locator("iframe[src*='youtube-nocookie.com/embed/dQw4w9WgXcQ']")).toHaveCount(1);

    // Un candidato no la ve mientras está oculta
    const ctx = await browser.newContext();
    const cand = await ctx.newPage();
    await signUp(cand, candidateEmail, "Juan Candidato");
    await expect(cand.getByText(companyName)).toHaveCount(0);

    // Publicar
    await page.getByRole("checkbox", { name: /Publicada/ }).check();
    await page.getByRole("button", { name: "Guardar empresa" }).click();
    await expect(page.getByText("Guardada y visible para los candidatos.")).toBeVisible();

    // Ahora sí la ve, con su video, la entrevista de YouTube y "Qué buscan"
    await cand.reload();
    const card = cand.locator("article", { hasText: companyName });
    await expect(card).toBeVisible();
    await expect(card.locator("video")).toHaveAttribute("src", /\/storage\/v1\/object\/sign\/interview-videos\//);
    await expect(card.getByText("Laura Pérez")).toBeVisible();
    await expect(card.locator("iframe")).toHaveCount(1);
    await expect(card.getByText("Inglés B1")).toBeVisible();
    await ctx.close();
  });
});
