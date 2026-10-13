import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default async function LoginPage({ searchParams }: PageProps<"/ingresar">) {
  const { next } = await searchParams;
  return (
    <div className="view">
      <h2>Inicia sesión</h2>
      <LoginForm next={typeof next === "string" ? next : undefined} />
    </div>
  );
}
