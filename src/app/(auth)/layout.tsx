import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="top">
        <div className="wrap" style={{ paddingBottom: 12 }}>
          <Link href="/" className="brand" style={{ color: "var(--ink)", textDecoration: "none" }}>
            Trabajo Ya
          </Link>
        </div>
      </div>
      <main className="wrap auth-wrap">{children}</main>
    </>
  );
}
