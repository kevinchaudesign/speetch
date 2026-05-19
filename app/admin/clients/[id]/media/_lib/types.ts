/**
 * Types locaux pour la médiathèque client (tables client_media_folders
 * et client_media — non encore régénérées dans types/database.ts).
 */

export type MediaFolderRow = {
  id: string;
  profile_id: string;
  name: string;
  position: number;
  created_at: string;
};

export type MediaRow = {
  id: string;
  profile_id: string;
  folder_id: string | null;
  /** FK vers client_personas.id — tag persona, optionnel. */
  persona_id: string | null;
  filename: string;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  duration_seconds: number | null;
  position: number;
  created_at: string;
};

export type MediaKind = "image" | "video";

export function mediaKindFromMime(mime: string): MediaKind | null {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  return null;
}
