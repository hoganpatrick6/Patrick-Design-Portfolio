import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import type { LayoutMap, Placement } from "../config/layout-defaults";

type EditorSession = { editor?: boolean };

function sessionConfig() {
  return {
    password:
      process.env["SESSION_SECRET"] ??
      "dev-only-fallback-session-secret-value-32ch",
    name: "editor-gate",
    maxAge: 60 * 60 * 24 * 30,
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: "lax" as const,
      path: "/",
    },
  };
}

function serialize(layout: LayoutMap): string {
  const entries = Object.entries(layout)
    .map(([id, p]) => {
      const v = p as Placement;
      const order = typeof v.order === "number" ? `, order: ${v.order}` : "";
      return `  ${JSON.stringify(id)}: { colStart: ${v.colStart}, colSpan: ${v.colSpan}${order} },`;
    })
    .join("\n");
  return `export const SITE_LAYOUT_DEFAULTS: LayoutMap = {\n${entries}\n};`;
}


/**
 * Writes the current block positions into src/config/layout-defaults.ts so
 * every visitor sees them. Only available to an unlocked editor.
 */
export const saveCanvasDefaults = createServerFn({ method: "POST" })
  .validator((data: { layout: LayoutMap }) => data)
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
    const path = "src/config/layout-defaults.ts";
    const source = await readFile(path, "utf8");
    const updated = source.replace(
      /export const SITE_LAYOUT_DEFAULTS: LayoutMap = \{[\s\S]*?\n\};/,
      serialize(data.layout),
    );
    await writeFile(path, updated, "utf8");
    return { saved: true as const };
  });
