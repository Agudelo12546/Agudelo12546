export function FormMessage({ ok, text }: { ok?: boolean; text?: string }) {
  if (!text) return null;
  return (
    <span className={ok ? "msg ok" : "msg err"} role={ok ? "status" : "alert"}>
      {text}
    </span>
  );
}
