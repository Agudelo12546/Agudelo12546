import type { InputHTMLAttributes, ReactNode } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: ReactNode;
  name: string;
  error?: string;
  hint?: ReactNode;
};

/** Campo con etiqueta, ayuda y error accesible (aria-describedby). */
export function Field({ label, name, error, hint, id, type = "text", ...input }: Props) {
  const fid = id ?? `f-${name}`;
  const describedBy = [hint ? `${fid}-hint` : null, error ? `${fid}-err` : null].filter(Boolean).join(" ") || undefined;
  return (
    <div className="fld">
      <label htmlFor={fid}>{label}</label>
      <input id={fid} name={name} type={type} aria-invalid={error ? true : undefined} aria-describedby={describedBy} {...input} />
      {hint && <small id={`${fid}-hint`}>{hint}</small>}
      {error && (
        <span className="err" id={`${fid}-err`}>
          {error}
        </span>
      )}
    </div>
  );
}

type AreaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: ReactNode;
  name: string;
  error?: string;
  hint?: ReactNode;
};

export function TextArea({ label, name, error, hint, id, ...area }: AreaProps) {
  const fid = id ?? `f-${name}`;
  return (
    <div className="fld">
      <label htmlFor={fid}>{label}</label>
      <textarea id={fid} name={name} aria-invalid={error ? true : undefined} {...area} />
      {hint && <small>{hint}</small>}
      {error && <span className="err">{error}</span>}
    </div>
  );
}
