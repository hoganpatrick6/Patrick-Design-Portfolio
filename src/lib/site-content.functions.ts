import { createServerFn } from "@tanstack/react-start";
import {
  editorEnvironmentUnlocked,
  editorSessionUnlocked,
} from "./editor-gate.server";

type Row = { key: string; value: unknown; updated_at?: string };

/** Minimal typed view of the shared content table (generated types lag behind). */
type ContentTable = {
  from(table: string): {
    select(columns: string): Promise<{ data: Row[] | null; error: unknown }> & {
      eq(column: string, value: string): Promise<{ data: Row[] | null; error: unknown }>;
    };
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
 * the same page, on any browser or device. Each value carries the time it was
 * last saved, so a stale browser tab can tell it is behind.
 */
export const loadSiteContent = createServerFn({ method: "GET" }).handler(
  async () => {
    try {
      const { data } = await (await db())
        .from("site_content")
        .select("key,value,updated_at");
      const values: Record<string, unknown> = {};
      const stamps: Record<string, string> = {};
      (data ?? []).forEach((row) => {
        values[row.key] = row.value;
        if (row.updated_at) stamps[row.key] = row.updated_at;
      });
      // Sent as JSON text so any shape of saved value survives the trip.
      return { json: JSON.stringify(values), stamps: JSON.stringify(stamps) };
    } catch {
      return { json: "{}", stamps: "{}" };
    }
  },
);

/**
 * Saves one edited value for the whole site. Only the private editor (unlocked
 * session, or local development) may write.
 *
 * `baseStamp` is the time this browser last saw the value. If the stored value
 * has moved on since then, another tab or device saved something newer and the
 * write is refused instead of overwriting it.
 */
export const saveSiteContentValue = createServerFn({ method: "POST" })
  .inputValidator((data: { key: string; value: unknown; baseStamp?: string }) => data)
  .handler(async ({ data }) => {
    try {
      if (!editorEnvironmentUnlocked() && !(await editorSessionUnlocked())) {
        return { saved: false as const };
      }
      if (!data.key) return { saved: false as const };

      const client = await db();

      if (data.baseStamp) {
        const { data: rows } = await client
          .from("site_content")
          .select("key,updated_at")
          .eq("key", data.key);
        const current = rows?.[0]?.updated_at;
        if (current && current > data.baseStamp) {
          return { saved: false as const, stale: true as const };
        }
      }

      const stamp = new Date().toISOString();
      const { error } = await client.from("site_content").upsert(
        { key: data.key, value: data.value, updated_at: stamp },
        { onConflict: "key" },
      );
      if (error) return { saved: false as const };
      return { saved: true as const, stamp };
    } catch {
      // Never fail the page over a save; the editor reports an unsaved change.
      return { saved: false as const };
    }
  });
