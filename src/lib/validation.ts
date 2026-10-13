import { z } from "zod";

/** Versión de la política de datos y los términos que acepta quien se registra. */
export const CONSENT_VERSION = "2026-10-borrador";

export const STAGES = {
  student: "Estudiante",
  recent_graduate: "Recién egresado",
  professional: "Profesional con experiencia",
} as const;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Máximo ${max} caracteres.`)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional()
    .transform((v) => v ?? null);

/** Normaliza un celular colombiano: quita espacios, guiones y el indicativo +57. */
export function normalizePhone(raw: string): string {
  let d = raw.replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("57")) d = d.slice(2);
  return d;
}

export const phoneSchema = z
  .string()
  .transform(normalizePhone)
  .pipe(z.string().regex(/^3\d{9}$/, "Escribe un celular colombiano de 10 dígitos que empiece por 3."));

export const profileSchema = z.object({
  full_name: z.string().trim().min(3, "Escribe tu nombre completo.").max(120),
  phone: phoneSchema,
  age: z.coerce
    .number({ error: "Escribe tu edad en números." })
    .int("Escribe tu edad en números.")
    .min(15, "Debes tener al menos 15 años.")
    .max(99, "Revisa tu edad."),
  city: z.string().trim().min(2, "Escribe tu ciudad.").max(80),
  stage: z.enum(Object.keys(STAGES) as [keyof typeof STAGES], { error: "Elige tu situación actual." }),
  university: optionalText(120),
  career: optionalText(120),
});

export const signupSchema = profileSchema.extend({
  email: z.string().trim().toLowerCase().email("Escribe un correo válido."),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres.").max(72),
  consent: z.literal("on", { error: "Debes aceptar la política de tratamiento de datos para registrarte." }),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Escribe un correo válido."),
  password: z.string().min(1, "Escribe tu contraseña."),
});

/** "Bancolombia S.A." → "bancolombia-s-a" */
export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

const httpsUrl = z
  .string()
  .trim()
  .url("Escribe un enlace válido.")
  .refine((u) => u.startsWith("https://"), "El enlace debe empezar por https://");

export const companySchema = z.object({
  name: z.string().trim().min(2, "Escribe el nombre de la empresa.").max(120),
  sector: optionalText(80),
  city: optionalText(80),
  website: z
    .union([z.literal(""), httpsUrl])
    .optional()
    .transform((v) => (v ? v : null)),
  description: optionalText(4000),
  published: z
    .union([z.literal("on"), z.literal("")])
    .optional()
    .transform((v) => v === "on"),
});

export const jobSchema = z.object({
  title: z.string().trim().min(2, "Escribe el cargo.").max(140),
  location: optionalText(120),
  looking_for: optionalText(4000),
  description: optionalText(10000),
  status: z.enum(["draft", "published", "closed"]),
});

export const videoLinkSchema = z.object({
  title: z.string().trim().min(2, "Escribe un título para el video.").max(160),
  recruiter_name: optionalText(120),
  recruiter_role: optionalText(120),
  job_id: z
    .string()
    .optional()
    .transform((v) => (v ? v : null))
    .pipe(z.string().uuid().nullable()),
  url: httpsUrl,
});

export const videoUploadSchema = videoLinkSchema.omit({ url: true }).extend({
  storage_path: z
    .string()
    .regex(/^[0-9a-f-]{36}\/[A-Za-z0-9._-]+\.(mp4|webm|mov)$/i, "Ruta de archivo inválida."),
});

export const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"] as const;
export const MAX_VIDEO_BYTES = 2 * 1024 * 1024 * 1024;

/** Nombre de archivo seguro para Storage: sin tildes, espacios ni símbolos. */
export function safeFileName(name: string): string {
  const dot = name.lastIndexOf(".");
  const ext = dot > -1 ? name.slice(dot + 1).toLowerCase() : "mp4";
  const base = slugify(dot > -1 ? name.slice(0, dot) : name) || "entrevista";
  return `${Date.now()}-${base}.${ext}`;
}

/** Devuelve el id de YouTube si el enlace es de YouTube; si no, null. */
export function youtubeId(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\.|^m\./, "");
    if (host === "youtu.be") return u.pathname.slice(1).split("/")[0] || null;
    if (host === "youtube.com" || host === "youtube-nocookie.com") {
      if (u.pathname === "/watch") return u.searchParams.get("v");
      const m = u.pathname.match(/^\/(embed|shorts|live)\/([^/?]+)/);
      if (m) return m[2];
    }
  } catch {
    // no es una URL válida
  }
  return null;
}

/** Primer mensaje de error de cada campo, para mostrar debajo del input. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
