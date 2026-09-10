import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { createHash, timingSafeEqual } from "node:crypto";
import {
  editorEnvironmentUnlocked,
  sessionConfig,
  type EditorSession,
} from "./editor-gate.server";

function matches(input: string, expected: string): boolean {
  const a = createHash("sha256").update(input, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

/**
 * Unlocks the private editor panels in development, on the Lovable preview
 * domain, or when the supplied key matches EDITOR_KEY.
 */
export const checkEditorAccess = createServerFn({ method: "POST" })
  .inputValidator((data: { key?: string }) => data ?? {})
  .handler(async ({ data }) => {
    if (editorEnvironmentUnlocked()) {
      return { editor: true as const };
    }

    const session = await useSession<EditorSession>(sessionConfig());
    const expected = process.env["EDITOR_KEY"];

    if (data.key && expected && matches(data.key, expected)) {
      await session.update({ editor: true });
      return { editor: true as const };
    }

    return { editor: Boolean(session.data.editor) };
  });

/**
 * Writes the current values into src/config/type-defaults.ts so every visitor
 * sees them. Only available to an unlocked editor.
 */
export const saveTypeDefaults = createServerFn({ method: "POST" })
  .inputValidator((data: Record<string, Record<string, unknown>>) => data)
  .handler(async ({ data }) => {
    const isDev = process.env["NODE_ENV"] !== "production";
    if (!isDev) {
      const session = await useSession<EditorSession>(sessionConfig());
      if (!session.data.editor) {
        throw new Response("Unauthorized", { status: 401 });
      }
      // The published site is read-only; defaults are saved while editing.
      return { saved: false as const, reason: "read-only" as const };
    }

    const { readFile, writeFile } = await import("node:fs/promises");
    const path = "src/config/type-defaults.ts";
    const source = await readFile(path, "utf8");

    const roles = ["body", "label", "nav", "heading", "display"] as const;
    const props = [
      "family",
      "weight",
      "scale",
      "leading",
      "tracking",
      "wordSpacing",
      "transform",
      "italic",
      "align",
      "measure",
      "paraSpacing",
    ] as const;

    const body = roles
      .map((role) => {
        const entries = props
          .map((prop) => {
            const value = data?.[role]?.[prop];
            if (value === undefined) return null;
            const rendered =
              typeof value === "string" ? JSON.stringify(value) : String(value);
            return `    ${prop}: ${rendered},`;
          })
          .filter(Boolean)
          .join("\n");
        return `  ${role}: {\n${entries}\n  },`;
      })
      .join("\n");

    const block = `export const SITE_TYPE_DEFAULTS: TypeSettings = {\n${body}\n};`;

    const updated = source.replace(
      /export const SITE_TYPE_DEFAULTS: TypeSettings = \{[\s\S]*?\n\};/,
      block,
    );
    await writeFile(path, updated, "utf8");
    return { saved: true as const };
  });

