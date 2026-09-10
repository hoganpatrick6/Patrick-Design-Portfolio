import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import type { CanvasDefaults } from "../config/canvas-defaults";

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

function serialize(canvas: CanvasDefaults): string {
  const body = JSON.stringify(
    {
      placements: canvas.placements,
      blocks: canvas.blocks,
      styles: canvas.styles,
      hidden: canvas.hidden,
    },
    null,
    2,
  );
  return `export const SITE_CANVAS: CanvasDefaults = ${body};`;
}

/**
 * Writes the current canvas — positions, added blocks, per-block type styles
 * and hidden blocks — into src/config/canvas-defaults.ts so every visitor sees
 * them. Only available to an unlocked editor.
 */
export const saveCanvasDefaults = createServerFn({ method: "POST" })
  .validator((data: { canvas: CanvasDefaults }) => data)
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
    const path = "src/config/canvas-defaults.ts";
    const source = await readFile(path, "utf8");
    const updated = source.replace(
      /export const SITE_CANVAS: CanvasDefaults = \{[\s\S]*?\n\};/,
      serialize(data.canvas),
    );
    await writeFile(path, updated, "utf8");
    return { saved: true as const };
  });
