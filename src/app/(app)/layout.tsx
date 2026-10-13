import { TopBar } from "@/components/TopBar";
import { requireProfile } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();
  return (
    <>
      <TopBar isAdmin={profile.role === "admin"} firstName={profile.full_name.split(" ")[0]} />
      <main className="wrap">{children}</main>
    </>
  );
}
