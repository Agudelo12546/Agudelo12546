import type { Metadata } from "next";
import { SignupForm } from "./SignupForm";

export const metadata: Metadata = { title: "Crear cuenta" };

export default function SignupPage() {
  return (
    <div className="view">
      <h2>Crea tu cuenta</h2>
      <p className="sub">
        Con tu cuenta guardas tu hoja de vida, ves las entrevistas con reclutadores y aplicas a empresas con un clic.
      </p>
      <SignupForm />
    </div>
  );
}
