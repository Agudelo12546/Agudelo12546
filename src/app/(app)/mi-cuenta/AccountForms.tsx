"use client";

import { useActionState } from "react";
import { deleteAccount, updateProfile } from "./actions";
import { Field } from "@/components/Field";
import { FormMessage } from "@/components/FormMessage";
import { SubmitButton } from "@/components/SubmitButton";
import type { Profile } from "@/lib/auth";
import type { FormState } from "@/lib/form";
import { STAGES } from "@/lib/validation";

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, action] = useActionState(updateProfile, {} as FormState);
  const v = state.values ?? {};
  const e = state.errors ?? {};
  const val = (k: keyof Profile) => v[k] ?? String(profile[k] ?? "");
  return (
    <form className="card" action={action} noValidate>
      <h3 style={{ fontSize: 18, fontWeight: 800 }}>Tus datos</h3>
      <div className="grid2">
        <Field label="Nombre completo" name="full_name" defaultValue={val("full_name")} error={e.full_name} />
        <Field label="Correo" name="email_ro" defaultValue={profile.email} disabled hint="Para cambiarlo, escríbenos." />
        <Field label="Celular" name="phone" type="tel" defaultValue={val("phone")} error={e.phone} />
        <Field label="Edad" name="age" type="number" min={15} max={99} defaultValue={val("age")} error={e.age} hint="Privada." />
        <Field label="Ciudad" name="city" defaultValue={val("city")} error={e.city} />
        <div className="fld">
          <label htmlFor="f-stage">Situación actual</label>
          <select id="f-stage" name="stage" defaultValue={val("stage")}>
            {Object.entries(STAGES).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <Field label="Universidad" name="university" defaultValue={val("university")} error={e.university} />
        <Field label="Carrera" name="career" defaultValue={val("career")} error={e.career} />
      </div>
      <div className="row">
        <SubmitButton>Guardar cambios</SubmitButton>
        <FormMessage ok={state.ok} text={state.message} />
      </div>
    </form>
  );
}

export function DeleteAccountForm() {
  const [state, action] = useActionState(deleteAccount, {} as FormState);
  return (
    <form className="card" action={action}>
      <h3 style={{ fontSize: 18, fontWeight: 800 }}>Borrar mi cuenta</h3>
      <p className="msg">
        Se borran tu cuenta, tus datos y todo lo que hayas creado en Trabajo Ya. No se puede deshacer.
      </p>
      <Field label='Escribe BORRAR para confirmar' name="confirm" autoComplete="off" error={state.errors?.confirm} />
      <div className="row">
        <SubmitButton className="btn danger" pending="Borrando…">
          Borrar mi cuenta para siempre
        </SubmitButton>
        <FormMessage text={state.message} />
      </div>
    </form>
  );
}
