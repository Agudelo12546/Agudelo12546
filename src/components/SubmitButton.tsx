"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  pending,
  className = "btn",
}: {
  children: React.ReactNode;
  pending?: string;
  className?: string;
}) {
  const { pending: isPending } = useFormStatus();
  return (
    <button className={className} type="submit" disabled={isPending}>
      {isPending ? (pending ?? "Guardando…") : children}
    </button>
  );
}
