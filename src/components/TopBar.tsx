"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Tab = { href: string; label: string; n?: string };

const CANDIDATE_TABS: Tab[] = [
  { href: "/hoja-de-vida", label: "Mi hoja de vida", n: "1" },
  { href: "/empresas", label: "Empresas", n: "2" },
  { href: "/postulaciones", label: "Mis postulaciones", n: "3" },
  { href: "/linkedin", label: "LinkedIn" },
];

export function TopBar({ isAdmin, firstName }: { isAdmin: boolean; firstName: string }) {
  const pathname = usePathname();
  const tabs = isAdmin ? [...CANDIDATE_TABS, { href: "/admin", label: "Panel" }] : CANDIDATE_TABS;

  return (
    <div className="top">
      <div className="wrap">
        <div className="vac-h" style={{ alignItems: "center" }}>
          <Link href="/empresas" className="brand" style={{ color: "var(--ink)", textDecoration: "none" }}>
            Trabajo Ya
          </Link>
          <div className="row" style={{ gap: 6 }}>
            <Link href="/mi-cuenta" className="btn ghost sm" style={{ textDecoration: "none" }}>
              {firstName}
            </Link>
            <form action="/auth/salir" method="post">
              <button className="btn ghost sm" type="submit">
                Salir
              </button>
            </form>
          </div>
        </div>
        <nav className="tabs" aria-label="Secciones">
          {tabs.map((t) => {
            const active = pathname === t.href || pathname.startsWith(t.href + "/");
            return (
              <Link
                key={t.href}
                href={t.href}
                className="tab tab-link"
                aria-current={active ? "page" : undefined}
              >
                {t.n && <span className="n">{t.n}</span>}
                {t.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
