import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export const VIDEO_BUCKET = "interview-videos";

/** URLs firmadas (1 hora) para los videos subidos. Respeta las políticas de Storage del usuario. */
export async function signVideoUrls(
  supabase: SupabaseClient,
  videos: { storage_path: string | null }[],
): Promise<Record<string, string>> {
  const paths = videos.map((v) => v.storage_path).filter((p): p is string => !!p);
  if (!paths.length) return {};
  const { data } = await supabase.storage.from(VIDEO_BUCKET).createSignedUrls(paths, 60 * 60);
  const out: Record<string, string> = {};
  for (const item of data ?? []) if (item.path && item.signedUrl) out[item.path] = item.signedUrl;
  return out;
}
