import { createServerFn } from "@tanstack/react-start";
import {
  editorEnvironmentUnlocked,
  editorSessionUnlocked,
} from "./editor-gate.server";

type MediaTable = {
  from(table: string): {
    insert(values: { content_type: string; data: string }): {
      select(columns: string): {
        single(): Promise<{ data: { id: string } | null; error: unknown }>;
      };
    };
    select(columns: string): {
      eq(
        column: string,
        value: string,
      ): {
        single(): Promise<{
          data: { content_type: string; data: string } | null;
          error: unknown;
        }>;
      };
    };
  };
};

async function db(): Promise<MediaTable> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as unknown as MediaTable;
}

const MAX_DATA_URL_LENGTH = 14 * 1024 * 1024; // ~10MB of binary

/**
 * Stores one uploaded image/video in the shared media library and returns its
 * permanent URL. Keeping files here (instead of embedding them in the page
 * layout) keeps layout saves small enough that they never fail. Editor-only.
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
    const { data: row, error } = await (await db())
      .from("media_files")
      .insert({ content_type: match[1], data: match[2] })
      .select("id")
      .single();
    if (error || !row) return { url: null };
    return { url: `/api/public/media/${row.id}` };
  });

/** Fetches one stored media file. Used by the public media route. */
export async function readMediaFile(
  id: string,
): Promise<{ content_type: string; data: string } | null> {
  const { data } = await (await db())
    .from("media_files")
    .select("content_type,data")
    .eq("id", id)
    .single();
  return data;
}
