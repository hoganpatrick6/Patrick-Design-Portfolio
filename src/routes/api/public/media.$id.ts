import { createFileRoute } from "@tanstack/react-router";
import { readMediaFile } from "../../../lib/media.functions";

/**
 * Serves one file from the shared media library. Public and read-only: ids are
 * random uuids and only the gated upload function can create rows.
 */
export const Route = createFileRoute("/api/public/media/$id")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const id = params.id ?? "";
        if (!/^[0-9a-f-]{36}$/i.test(id)) {
          return new Response("Not found", { status: 404 });
        }
        const file = await readMediaFile(id).catch(() => null);
        if (!file) return new Response("Not found", { status: 404 });
        return new Response(file.body, {
          headers: {
            "content-type": file.content_type,
            "cache-control": "public, max-age=31536000, immutable",
          },
        });
      },
    },
  },
});
