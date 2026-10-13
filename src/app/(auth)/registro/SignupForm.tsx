"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUp } from "../actions";
import { Field } from "@/components/Field";
import { FormMessage } from "@/components/FormMessage";
import { SubmitButton } from "@/components/SubmitButton";
import { STAGES } from "@/lib/validation";
import type { FormState } from "@/lib/form";

export function SignupForm() {
  const [state, action] = useActionState(signUp, {} as FormState);
  const v = state.values ?? {};
  const e = state.errors ?? {};

  if (state.ok) {
    return (
      <div className="card">
        <p className="msg ok" role="status">
          {state.message}
        </p>
      </div>
    );
  }

  return (
    <form className="card" action={action} noValidate>
      <div className="stephead">
        <span className="k">1</span>
        <h3>Tus datos</h3>
      </div>
      <div className="grid2">
        <Field label="Nombre completo *" name="full_name" autoComplete="name" defaultValue={v.full_name} error={e.full_name} />
        <Field label="Correo *" name="email" type="email" autoComplete="email" placeholder="nombre.apellido@gmail.com" defaultValue={v.email} error={e.email} />
        <Field label="Celular *" name="phone" type="tel" autoComplete="tel" placeholder="300 123 4567" defaultValue={v.phone} error={e.phone} />
        <Field
          label="Edad *"
          name="age"
          type="number"
          inputMode="numeric"
          min={15}
          max={99}
          defaultValue={v.age}
          error={e.age}
          hint="Privada: no la ven las empresas ni sale en tu hoja de vida."
        />
        <Field label="Ciudad *" name="city" autoComplete="address-level2" placeholder="Medellín" defaultValue={v.city} error={e.city} />
        <div className="fld">
          <label htmlFor="f-stage">Situación actual *</label>
          <select id="f-stage" name="stage" defaultValue={v.stage ?? ""} aria-invalid={e.stage ? true : undefined}>
            <option value="" disabled>
              Selecciona
            </option>
            {Object.entries(STAGES).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
          {e.stage && <span className="err">{e.stage}</span>}
        </div>
      </div>

      <div className="stephead">
        <span className="k">2</span>
        <h3>Estudios (opcional)</h3>
      </div>
      <div className="grid2">
        <Field label="Universidad" name="university" placeholder="Universidad EAFIT" defaultValue={v.university} error={e.university} />
        <Field label="Carrera" name="career" placeholder="Negocios Internacionales" defaultValue={v.career} error={e.career} />
      </div>

      <div className="stephead">
        <span className="k">3</span>
        <h3>Tu contraseña</h3>
      </div>
      <Field label="Contraseña *" name="password" type="password" autoComplete="new-password" error={e.password} hint="Mínimo 8 caracteres." />

      <label className="consent">
        <input type="checkbox" name="consent" defaultChecked={v.consent === "on"} aria-invalid={e.consent ? true : undefined} />
        <span>
          Autorizo a Trabajo Ya a tratar mis datos personales según la{" "}
          <Link href="/legal/privacidad" target="_blank">
            política de tratamiento de datos
          </Link>{" "}
          y acepto los{" "}
          <Link href="/legal/terminos" target="_blank">
            términos de uso
          </Link>
          .
        </span>
      </label>
      {e.consent && <span className="msg err">{e.consent}</span>}

      <div className="row">
        <SubmitButton className="btn hl" pending="Creando tu cuenta…">
          Crear mi cuenta
        </SubmitButton>
        <FormMessage text={state.message} />
      </div>
      <p className="msg">
        ¿Ya tienes cuenta? <Link href="/ingresar">Inicia sesión</Link>
      </p>
    </form>
  );
}
