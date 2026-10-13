"use client";

import { useActionState, useRef, useState } from "react";
import { addVideoLink, createCompany, createJob, updateCompany, updateJob } from "./actions";
import { Field, TextArea } from "@/components/Field";
import { FormMessage } from "@/components/FormMessage";
import { SubmitButton } from "@/components/SubmitButton";
import type { FormState } from "@/lib/form";

export type CompanyRow = {
  id: string;
  name: string;
  sector: string | null;
  city: string | null;
  website: string | null;
  description: string | null;
  published: boolean;
};

export type JobRow = {
  id: string;
  title: string;
  location: string | null;
  looking_for: string | null;
  description: string | null;
  status: "draft" | "published" | "closed";
};

export function CompanyForm({ company }: { company?: CompanyRow }) {
  const bound = company ? updateCompany.bind(null, company.id) : createCompany;
  const [state, action] = useActionState(bound, {} as FormState);
  const v = state.values;
  const e = state.errors ?? {};
  const val = (k: keyof CompanyRow) => (v ? v[k] : company ? String(company[k] ?? "") : "");
  const published = v ? v.published === "on" : (company?.published ?? false);
  return (
    <form className="card" action={action} noValidate>
      <h3 style={{ fontSize: 18, fontWeight: 800 }}>{company ? "Datos de la empresa" : "Nueva empresa"}</h3>
      <div className="grid2">
        <Field label="Empresa *" name="name" defaultValue={val("name")} error={e.name} />
        <Field label="Sector" name="sector" placeholder="Logística, banca, tecnología…" defaultValue={val("sector")} error={e.sector} />
        <Field label="Ciudad" name="city" placeholder="Medellín" defaultValue={val("city")} error={e.city} />
        <Field label="Sitio web" name="website" type="url" placeholder="https://" defaultValue={val("website")} error={e.website} />
      </div>
      <TextArea label="Descripción corta" name="description" defaultValue={val("description")} error={e.description} />
      <label className="consent">
        <input type="checkbox" name="published" defaultChecked={published} />
        <span>
          <b>Publicada:</b> los candidatos la ven en Empresas. Déjala sin marcar mientras preparas los videos.
        </span>
      </label>
      <div className="row">
        <SubmitButton>{company ? "Guardar empresa" : "Crear empresa"}</SubmitButton>
        <FormMessage ok={state.ok} text={state.message} />
      </div>
    </form>
  );
}

const STATUS = { draft: "Borrador", published: "Publicada", closed: "Cerrada" } as const;

export function JobForm({ companyId, job }: { companyId: string; job?: JobRow }) {
  const bound = job ? updateJob.bind(null, job.id, companyId) : createJob.bind(null, companyId);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action] = useActionState(async (prev: FormState, fd: FormData) => {
    const res = await bound(prev, fd);
    if (res.ok && !job) formRef.current?.reset();
    return res;
  }, {} as FormState);
  const v = state.ok && !job ? undefined : state.values;
  const e = state.errors ?? {};
  const val = (k: keyof JobRow) => (v ? v[k] : job ? String(job[k] ?? "") : "");
  const p = job ? `job-${job.id}` : "job-new";
  return (
    <form ref={formRef} action={action} noValidate style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div className="grid2">
        <Field id={`${p}-title`} label="Cargo *" name="title" placeholder="Practicante de comercio exterior" defaultValue={val("title")} error={e.title} />
        <Field id={`${p}-loc`} label="Ciudad y modalidad" name="location" placeholder="Medellín · híbrido" defaultValue={val("location")} error={e.location} />
        <div className="fld">
          <label htmlFor={`${p}-status`}>Estado</label>
          <select id={`${p}-status`} name="status" defaultValue={val("status") || "published"}>
            {Object.entries(STATUS).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <TextArea
        id={`${p}-lf`}
        label="Qué buscan (una idea por línea)"
        name="looking_for"
        placeholder={"Excel intermedio\nInglés para hablar con proveedores\nQue haya liderado un proyecto, aunque sea de la universidad"}
        hint="Sale de la entrevista con el reclutador. Es lo primero que lee el candidato."
        defaultValue={val("looking_for")}
        error={e.looking_for}
      />
      <TextArea id={`${p}-desc`} label="Descripción del cargo" name="description" defaultValue={val("description")} error={e.description} />
      <div className="row">
        <SubmitButton className="btn sm">{job ? "Guardar vacante" : "Agregar vacante"}</SubmitButton>
        <FormMessage ok={state.ok} text={state.message} />
      </div>
    </form>
  );
}

export function VideoLinkForm({ companyId, jobs }: { companyId: string; jobs: JobRow[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action] = useActionState(async (prev: FormState, fd: FormData) => {
    const res = await addVideoLink(companyId, prev, fd);
    if (res.ok) formRef.current?.reset();
    return res;
  }, {} as FormState);
  const e = state.errors ?? {};
  const v = state.ok ? {} : (state.values ?? {});
  return (
    <form ref={formRef} action={action} noValidate style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div className="grid2">
        <Field id="vl-title" label="Título *" name="title" placeholder="Qué busca Grupo X en un practicante" defaultValue={v.title} error={e.title} />
        <Field id="vl-url" label="Enlace *" name="url" type="url" placeholder="https://youtu.be/…" defaultValue={v.url} error={e.url} hint="YouTube (oculto) se ve dentro de la página." />
        <Field id="vl-rn" label="Reclutador" name="recruiter_name" defaultValue={v.recruiter_name} error={e.recruiter_name} />
        <Field id="vl-rr" label="Cargo del reclutador" name="recruiter_role" placeholder="Líder de talento humano" defaultValue={v.recruiter_role} error={e.recruiter_role} />
        <JobSelect id="vl-job" jobs={jobs} />
      </div>
      <div className="row">
        <SubmitButton className="btn sm">Agregar enlace</SubmitButton>
        <FormMessage ok={state.ok} text={state.message} />
      </div>
    </form>
  );
}

export function JobSelect({ id, jobs }: { id: string; jobs: JobRow[] }) {
  if (!jobs.length) return null;
  return (
    <div className="fld">
      <label htmlFor={id}>Vacante (opcional)</label>
      <select id={id} name="job_id" defaultValue="">
        <option value="">Toda la empresa</option>
        {jobs.map((j) => (
          <option key={j.id} value={j.id}>
            {j.title}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Botón de borrar con confirmación en dos pasos (como en el prototipo). */
export function ConfirmDelete({ action, label, confirm }: { action: () => Promise<void>; label: string; confirm: string }) {
  const [armed, setArmed] = useState(false);
  return (
    <form
      action={action}
      onSubmit={(ev) => {
        if (!armed) {
          ev.preventDefault();
          setArmed(true);
          setTimeout(() => setArmed(false), 4000);
        }
      }}
    >
      <button className="btn danger sm" type="submit">
        {armed ? confirm : label}
      </button>
    </form>
  );
}
