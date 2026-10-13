"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn } from "../actions";
import { Field } from "@/components/Field";
import { FormMessage } from "@/components/FormMessage";
import { SubmitButton } from "@/components/SubmitButton";
import type { FormState } from "@/lib/form";

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState(signIn, {} as FormState);
  const e = state.errors ?? {};
  return (
    <form className="card" action={action} noValidate>
      <input type="hidden" name="next" value={next ?? ""} />
      <Field label="Correo" name="email" type="email" autoComplete="email" defaultValue={state.values?.email} error={e.email} />
      <Field label="Contraseña" name="password" type="password" autoComplete="current-password" error={e.password} />
      <div className="row">
        <SubmitButton pending="Entrando…">Entrar</SubmitButton>
        <FormMessage text={state.message} />
      </div>
      <p className="msg">
        ¿No tienes cuenta? <Link href="/registro">Regístrate gratis</Link>
      </p>
    </form>
  );
}
