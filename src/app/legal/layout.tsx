import Link from "next/link";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="top">
        <div className="wrap" style={{ paddingBottom: 12 }}>
          <Link href="/" className="brand" style={{ color: "var(--ink)", textDecoration: "none" }}>
            Trabajo Ya
          </Link>
        </div>
      </div>
      <main className="wrap view">
        <p className="draft">BORRADOR · pendiente de revisión por un abogado. No es un texto legal definitivo.</p>
        <div className="prose-legal">{children}</div>
      </main>
    </>
  );
}
