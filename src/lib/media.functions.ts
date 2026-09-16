import { createServerFn } from "@tanstack/react-start";
import {
  editorEnvironmentUnlocked,
  editorSessionUnlocked,
} from "./editor-gate.server";

/** Bucket holding every uploaded image/video. Private: served via the
 *  /api/public/media/$id route so URLs stay stable and never expire. */
const BUCKET = "media";

const MAX_DATA_URL_LENGTH = 50 * 1024 * 1024; // ~36MB of binary

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/**
 * Stores one uploaded image/video in the shared media library and returns its
 * permanent URL. Files live in storage (not in the database), which keeps the
 * database small and responsive. Editor-only.
 */
export const uploadMediaFile = createServerFn({ method: "POST" })
  .inputValidator((data: { dataUrl: string }) => data)
  .handler(async ({ data }) => {
    if (!editorEnvironmentUnlocked() && !(await editorSessionUnlocked())) {
      throw new Response("Unauthorized", { status: 401 });
    }
    const match = /^data:([^;,]+);base64,(.+)$/s.exec(data.dataUrl ?? "");
    if (!match || data.dataUrl.length > MAX_DATA_URL_LENGTH) {
      return { url: null };
    }
    const contentType = match[1] ?? "application/octet-stream";
    const bytes = Buffer.from(match[2] ?? "", "base64");
    const db = await admin();

    // Keep one row per file so ids stay stable and referenced blocks keep
    // working; the bytes themselves go to storage under that id.
    const { data: row, error } = await (db.from("media_files") as any)
      .insert({ content_type: contentType, data: "" })
      .select("id")
      .single();
    if (error || !row) return { url: null };

    const upload = await db.storage
      .from(BUCKET)
      .upload(row.id, bytes, { contentType, upsert: true });
    if (upload.error) {
      await (db.from("media_files") as any).delete().eq("id", row.id);
      return { url: null };
    }
    return { url: `/api/public/media/${row.id}` };
  });

/** Fetches one stored media file. Used by the public media route. */
export async function readMediaFile(
  id: string,
): Promise<{ content_type: string; body: ArrayBuffer } | null> {
  const db = await admin();
  const { data: row } = await (db.from("media_files") as any)
    .select("content_type,data")
    .eq("id", id)
    .single();

  const stored = await db.storage.from(BUCKET).download(id);
  if (stored.data) {
    return {
      content_type: row?.content_type || stored.data.type || "application/octet-stream",
      body: await stored.data.arrayBuffer(),
    };
  }

  // Fallback for any file not yet copied into storage.
  if (row?.data) {
    const bytes = Buffer.from(row.data, "base64");
    return {
      content_type: row.content_type || "application/octet-stream",
      body: bytes.buffer.slice(
        bytes.byteOffset,
        bytes.byteOffset + bytes.byteLength,
      ) as ArrayBuffer,
    };
  }
  return null;
}
