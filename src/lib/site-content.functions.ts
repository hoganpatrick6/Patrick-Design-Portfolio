import { createServerFn } from "@tanstack/react-start";
import {
  editorEnvironmentUnlocked,
  editorSessionUnlocked,
} from "./editor-gate.server";

type Row = { key: string; value: unknown };

/** Minimal typed view of the shared content table (generated types lag behind). */
type ContentTable = {
  from(table: string): {
    select(columns: string): Promise<{ data: Row[] | null; error: unknown }>;
    upsert(
      values: { key: string; value: unknown; updated_at: string },
      options: { onConflict: string },
    ): Promise<{ error: unknown }>;
  };
};

async function db(): Promise<ContentTable> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as unknown as ContentTable;
}

/**
 * Reads every saved site edit (layout, type, media, copy) so all visitors see
 * the same page, on any browser or device.
 */
export const loadSiteContent = createServerFn({ method: "GET" }).handler(
  async () => {
    try {
      const { data } = await (await db()).from("site_content").select("key,value");
      const values: Record<string, unknown> = {};
      (data ?? []).forEach((row) => {
        values[row.key] = row.value;
      });
      // Sent as JSON text so any shape of saved value survives the trip.
      return { json: JSON.stringify(values) };
    } catch {
      return { json: "{}" };
    }
  },
);

/**
 * Saves one edited value for the whole site. Only the private editor (unlocked
 * session, or local development) may write.
 */
export const saveSiteContentValue = createServerFn({ method: "POST" })
  .inputValidator((data: { key: string; value: unknown }) => data)
  .handler(async ({ data }) => {
    if (!editorEnvironmentUnlocked() && !(await editorSessionUnlocked())) {
      throw new Response("Unauthorized", { status: 401 });
    }
    if (!data.key) return { saved: false as const };

    const { error } = await (await db()).from("site_content").upsert(
      { key: data.key, value: data.value, updated_at: new Date().toISOString() },
      { onConflict: "key" },
    );
    if (error) return { saved: false as const };
    return { saved: true as const };
  });
