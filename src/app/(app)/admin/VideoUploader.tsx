"use client";

import { useRef, useState } from "react";
import { Upload } from "tus-js-client";
import { registerUploadedVideo } from "./actions";
import { JobSelect, type JobRow } from "./AdminForms";
import { createClient } from "@/lib/supabase/client";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/env";
import { MAX_VIDEO_BYTES, safeFileName, VIDEO_TYPES } from "@/lib/validation";

type Phase = { kind: "idle" } | { kind: "uploading"; pct: number } | { kind: "saving" } | { kind: "done"; text: string } | { kind: "error"; text: string };

/**
 * Sube el video directo del navegador a Supabase Storage con subida reanudable (TUS),
 * así archivos de cientos de MB no pasan por el servidor y una caída de internet no obliga a empezar de cero.
 */
export function VideoUploader({ companyId, jobs }: { companyId: string; jobs: JobRow[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const uploadRef = useRef<Upload | null>(null);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const busy = phase.kind === "uploading" || phase.kind === "saving";

  async function onSubmit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const fd = new FormData(ev.currentTarget);
    const file = fd.get("file");
    const title = String(fd.get("title") ?? "").trim();
    if (!(file instanceof File) || !file.size) return setPhase({ kind: "error", text: "Elige un archivo de video." });
    if (title.length < 2) return setPhase({ kind: "error", text: "Escribe un título para el video." });
    const type = file.type || (/\.mov$/i.test(file.name) ? "video/quicktime" : "video/mp4");
    if (!(VIDEO_TYPES as readonly string[]).includes(type)) return setPhase({ kind: "error", text: "Formato no soportado. Usa MP4, WebM o MOV." });
    if (file.size > MAX_VIDEO_BYTES) return setPhase({ kind: "error", text: "El archivo pesa más de 2 GB. Comprímelo o súbelo a YouTube como oculto." });

    const { data } = await createClient().auth.getSession();
    const token = data.session?.access_token;
    if (!token) return setPhase({ kind: "error", text: "Tu sesión expiró. Vuelve a iniciar sesión." });

    const storagePath = `${companyId}/${safeFileName(file.name)}`;
    setPhase({ kind: "uploading", pct: 0 });

    const upload = new Upload(file, {
      endpoint: `${SUPABASE_URL}/storage/v1/upload/resumable`,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      headers: { authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY, "x-upsert": "false" },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      metadata: { bucketName: "interview-videos", objectName: storagePath, contentType: type, cacheControl: "3600" },
      chunkSize: 6 * 1024 * 1024, // Supabase exige bloques de 6 MB
      onProgress: (sent, total) => setPhase({ kind: "uploading", pct: Math.round((sent / total) * 100) }),
      onError: () => setPhase({ kind: "error", text: "Se cortó la subida. Revisa tu conexión e intenta de nuevo: continúa donde quedó." }),
      onSuccess: async () => {
        setPhase({ kind: "saving" });
        const res = await registerUploadedVideo(companyId, {
          title,
          recruiter_name: String(fd.get("recruiter_name") ?? ""),
          recruiter_role: String(fd.get("recruiter_role") ?? ""),
          job_id: String(fd.get("job_id") ?? ""),
          storage_path: storagePath,
        });
        if (res.ok) {
          formRef.current?.reset();
          setPhase({ kind: "done", text: res.message ?? "Listo." });
        } else {
          setPhase({ kind: "error", text: res.message ?? "No se pudo guardar el video." });
        }
      },
    });
    uploadRef.current = upload;
    const previous = await upload.findPreviousUploads();
    if (previous.length) upload.resumeFromPreviousUpload(previous[0]);
    upload.start();
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div className="grid2">
        <div className="fld">
          <label htmlFor="vu-file">Archivo de video *</label>
          <input id="vu-file" name="file" type="file" accept="video/mp4,video/webm,video/quicktime,.mov" disabled={busy} />
          <small>MP4, WebM o MOV (iPhone), hasta 2 GB.</small>
        </div>
        <div className="fld">
          <label htmlFor="vu-title">Título *</label>
          <input id="vu-title" name="title" type="text" placeholder="Qué busca Grupo X en un practicante" disabled={busy} />
        </div>
        <div className="fld">
          <label htmlFor="vu-rn">Reclutador</label>
          <input id="vu-rn" name="recruiter_name" type="text" disabled={busy} />
        </div>
        <div className="fld">
          <label htmlFor="vu-rr">Cargo del reclutador</label>
          <input id="vu-rr" name="recruiter_role" type="text" placeholder="Líder de talento humano" disabled={busy} />
        </div>
        <JobSelect id="vu-job" jobs={jobs} />
      </div>

      {phase.kind === "uploading" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={phase.pct} aria-label="Progreso de la subida">
            <i style={{ width: `${phase.pct}%` }} />
          </div>
          <span className="msg">Subiendo… {phase.pct} %. No cierres esta pestaña.</span>
        </div>
      )}

      <div className="row">
        <button className="btn hl sm" type="submit" disabled={busy}>
          {phase.kind === "saving" ? "Guardando…" : busy ? "Subiendo…" : "Subir video"}
        </button>
        {phase.kind === "uploading" && (
          <button
            className="btn ghost sm"
            type="button"
            onClick={() => {
              uploadRef.current?.abort();
              setPhase({ kind: "error", text: "Subida pausada. Vuelve a elegir el mismo archivo para continuar." });
            }}
          >
            Pausar
          </button>
        )}
        {phase.kind === "done" && <span className="msg ok" role="status">{phase.text}</span>}
        {phase.kind === "error" && <span className="msg err" role="alert">{phase.text}</span>}
      </div>
    </form>
  );
}
