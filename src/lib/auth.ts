import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Role = "candidate" | "company" | "university" | "admin";

export type Profile = {
  id: string;
  role: Role;
  full_name: string;
  email: string;
  phone: string;
  age: number;
  city: string;
  stage: "student" | "recent_graduate" | "professional";
  university: string | null;
  career: string | null;
};

/** Usuario y perfil de la sesión actual (una sola consulta por solicitud). */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("id, role, full_name, email, phone, age, city, stage, university, career")
    .eq("id", user.id)
    .single();
  return (data as Profile | null) ?? null;
});

export async function requireProfile(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/ingresar");
  return profile;
}

/** Para páginas y acciones del panel. La base de datos lo vuelve a verificar con RLS. */
export async function requireAdmin(): Promise<Profile> {
  const profile = await requireProfile();
  if (profile.role !== "admin") redirect("/empresas");
  return profile;
}
