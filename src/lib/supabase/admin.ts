import "server-only";

import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./env";

/**
 * Cliente con service role: salta RLS. Úsalo solo en el servidor y solo después de
 * verificar quién hace la acción (p. ej. borrar la cuenta propia).
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY");
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
