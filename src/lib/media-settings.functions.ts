import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import type { MediaBlock } from "../config/media-defaults";

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

function serialize(blocks: MediaBlock[]): string {
  const body = blocks
    .map(
      (b) =>
        `  {\n` +
        `    id: ${JSON.stringify(b.id)},\n` +
        `    page: ${JSON.stringify(b.page)},\n` +
        `    kind: ${JSON.stringify(b.kind)},\n` +
        `    src: ${JSON.stringify(b.src)},\n` +
        `    alt: ${JSON.stringify(b.alt)},\n` +
        `    caption: ${JSON.stringify(b.caption)},\n` +
        `    aspect: ${JSON.stringify(b.aspect)},\n` +
        `  },`,
    )
    .join("\n");
  return blocks.length
    ? `export const SITE_MEDIA_BLOCKS: MediaBlock[] = [\n${body}\n];`
    : `export const SITE_MEDIA_BLOCKS: MediaBlock[] = [];`;
}

/**
 * Writes the current image / video blocks into src/config/media-defaults.ts so
 * every visitor sees them. Only available to an unlocked editor.
 */
export const saveMediaDefaults = createServerFn({ method: "POST" })
  .inputValidator((data: { blocks: MediaBlock[] }) => data)
  .handler(async ({ data }) => {
    const isDev = process.env["NODE_ENV"] !== "production";
    if (!isDev) {
      const session = await useSession<EditorSession>(sessionConfig());
      if (!session.data.editor) {
        throw new Response("Unauthorized", { status: 401 });
      }
      return { saved: false as const, reason: "read-only" as const };
    }

    const { readFile, writeFile } = await import("node:fs/promises");
    const path = "src/config/media-defaults.ts";
    const source = await readFile(path, "utf8");
    const updated = source.replace(
      /export const SITE_MEDIA_BLOCKS: MediaBlock\[\] = (?:\[\];|\[[\s\S]*?\n\];)/,
      serialize(data.blocks),
    );
    await writeFile(path, updated, "utf8");
    return { saved: true as const };
  });
