"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CONSENT_VERSION, fieldErrors, loginSchema, signupSchema } from "@/lib/validation";
import { formValues, type FormState } from "@/lib/form";

function safeNext(next: FormDataEntryValue | null): string {
  const n = typeof next === "string" ? next : "";
  return n.startsWith("/") && !n.startsWith("//") ? n : "/empresas";
}

export async function signUp(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = signupSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error), values: formValues(fd), message: "Revisa los campos marcados." };
  }
  const { email, password, consent: _consent, ...profile } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { ...profile, age: String(profile.age), consent_version: CONSENT_VERSION },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/empresas`,
    },
  });
  if (error) {
    const taken = /already|registered|exists/i.test(error.message);
    return {
      values: formValues(fd),
      errors: taken ? { email: "Ya existe una cuenta con este correo. Inicia sesión." } : undefined,
      message: taken ? undefined : "No pudimos crear tu cuenta. Intenta de nuevo en un momento.",
    };
  }
  if (!data.session) {
    // Confirmación de correo activada (producción): pedir que revise su correo.
    return { ok: true, message: "Te enviamos un correo para confirmar tu cuenta. Ábrelo y vuelve aquí." };
  }
  redirect("/empresas");
}

export async function signIn(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: formValues(fd) };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { values: formValues(fd), message: "Correo o contraseña incorrectos." };
  }
  redirect(safeNext(fd.get("next")));
}
