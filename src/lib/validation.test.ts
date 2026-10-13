import { describe, expect, it } from "vitest";
import {
  companySchema,
  normalizePhone,
  safeFileName,
  signupSchema,
  slugify,
  videoLinkSchema,
  videoUploadSchema,
  youtubeId,
} from "./validation";

const validSignup = {
  full_name: "Camila Restrepo",
  email: "Camila.Restrepo@Gmail.com ",
  password: "segura123",
  phone: "+57 300 123 4567",
  age: "21",
  city: "Medellín",
  stage: "student",
  university: "",
  career: "Negocios Internacionales",
  consent: "on",
};

describe("signupSchema", () => {
  it("acepta un registro válido y normaliza datos", () => {
    const r = signupSchema.parse(validSignup);
    expect(r.email).toBe("camila.restrepo@gmail.com");
    expect(r.phone).toBe("3001234567");
    expect(r.age).toBe(21);
    expect(r.university).toBeNull();
    expect(r.career).toBe("Negocios Internacionales");
  });

  it("exige consentimiento de datos (Ley 1581)", () => {
    const r = signupSchema.safeParse({ ...validSignup, consent: undefined });
    expect(r.success).toBe(false);
  });

  it.each([
    ["phone", "123"],
    ["phone", "6041234567"],
    ["age", "12"],
    ["age", "abc"],
    ["email", "no-es-correo"],
    ["password", "corta"],
    ["stage", "otro"],
    ["full_name", "A"],
  ])("rechaza %s inválido (%s)", (field, value) => {
    const r = signupSchema.safeParse({ ...validSignup, [field]: value });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].path[0]).toBe(field);
  });
});

describe("normalizePhone", () => {
  it.each([
    ["300 123 4567", "3001234567"],
    ["+57 310-987-6543", "3109876543"],
    ["573001112222", "3001112222"],
  ])("%s → %s", (input, out) => expect(normalizePhone(input)).toBe(out));
});

describe("slugify", () => {
  it("quita tildes y símbolos", () => {
    expect(slugify("Compañía Nacional de Chocolates S.A.S.")).toBe("compania-nacional-de-chocolates-s-a-s");
    expect(slugify("  Éxito  ")).toBe("exito");
  });
});

describe("companySchema", () => {
  it("convierte vacíos a null y la casilla publicada a booleano", () => {
    const r = companySchema.parse({ name: "Grupo Ejemplo", sector: "", city: "Bogotá", website: "", published: "on" });
    expect(r).toMatchObject({ sector: null, city: "Bogotá", website: null, published: true });
  });
  it("rechaza sitios sin https", () => {
    expect(companySchema.safeParse({ name: "X Y", website: "http://x.co" }).success).toBe(false);
  });
});

describe("videos", () => {
  it("exige https en los enlaces", () => {
    expect(videoLinkSchema.safeParse({ title: "Entrevista", url: "http://youtu.be/x" }).success).toBe(false);
    expect(videoLinkSchema.safeParse({ title: "Entrevista", url: "https://youtu.be/x", job_id: "" }).success).toBe(true);
  });
  it("valida la ruta del archivo subido", () => {
    const ok = { title: "Entrevista", storage_path: "10000000-0000-0000-0000-000000000001/1700-entrevista.mp4" };
    expect(videoUploadSchema.safeParse(ok).success).toBe(true);
    expect(videoUploadSchema.safeParse({ ...ok, storage_path: "../otra/x.mp4" }).success).toBe(false);
  });
  it("genera nombres de archivo seguros", () => {
    expect(safeFileName("Entrevista Reclutadora Ñandú.MP4")).toMatch(/^\d+-entrevista-reclutadora-nandu\.mp4$/);
  });
  it.each([
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://youtu.be/dQw4w9WgXcQ?t=3", "dQw4w9WgXcQ"],
    ["https://www.youtube.com/shorts/abc123", "abc123"],
    ["https://drive.google.com/file/d/x/view", null],
  ])("youtubeId(%s)", (url, id) => expect(youtubeId(url)).toBe(id));
});
