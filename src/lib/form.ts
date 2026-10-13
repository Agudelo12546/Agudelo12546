/** Estado que devuelven las Server Actions de formularios. */
export type FormState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string>;
  values?: Record<string, string>;
};

export function formValues(fd: FormData, skip: string[] = ["password"]): Record<string, string> {
  const out: Record<string, string> = {};
  fd.forEach((v, k) => {
    if (typeof v === "string" && !k.startsWith("$") && !skip.includes(k)) out[k] = v;
  });
  return out;
}
