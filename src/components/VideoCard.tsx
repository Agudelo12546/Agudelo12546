import { youtubeId } from "@/lib/validation";

export type Video = {
  id: string;
  title: string;
  recruiter_name: string | null;
  recruiter_role: string | null;
  kind: "upload" | "link";
  storage_path: string | null;
  url: string | null;
};

/** Muestra un video subido (con URL firmada), un YouTube embebido o un enlace externo. */
export function VideoCard({ video, signedUrl, children }: { video: Video; signedUrl?: string; children?: React.ReactNode }) {
  const who = [video.recruiter_name, video.recruiter_role].filter(Boolean).join(" · ");
  const yt = video.kind === "link" && video.url ? youtubeId(video.url) : null;
  return (
    <div className="vid">
      {video.kind === "upload" ? (
        signedUrl ? (
          <video controls preload="metadata" src={signedUrl} controlsList="nodownload" />
        ) : (
          <p className="msg err">No se pudo cargar este video.</p>
        )
      ) : yt ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${yt}`}
          title={video.title}
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      ) : (
        <a className="vlink" href={video.url ?? "#"} target="_blank" rel="noopener noreferrer">
          <span>{video.title}</span>
          <span>Ver ↗</span>
        </a>
      )}
      {(video.kind === "upload" || yt) && <span className="t">{video.title}</span>}
      {who && <span className="msg" style={{ fontSize: 13 }}>{who}</span>}
      {children}
    </div>
  );
}
