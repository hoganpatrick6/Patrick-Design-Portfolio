import { useSession, getRequestHost } from "@tanstack/react-start/server";

export type EditorSession = { editor?: boolean };

export function sessionConfig() {
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

/**
 * True for the Lovable preview hosts (ephemeral `id-preview--*.lovable.app`
 * and stable `project--*-dev.lovable.app`). The published site and custom
 * domains are never preview hosts, so public visitors stay locked out.
 */
function isLovablePreviewHost(host: string): boolean {
  const h = host.toLowerCase().split(":")[0];
  if (h.startsWith("id-preview--") && h.endsWith(".lovable.app")) return true;
  if (h.endsWith("-dev.lovable.app")) return true;
  return false;
}

/** True when the editor tools may be shown without any key. */
export function editorEnvironmentUnlocked(): boolean {
  if (process.env["NODE_ENV"] !== "production") return true;
  try {
    return isLovablePreviewHost(getRequestHost({ xForwardedHost: true }));
  } catch {
    return false;
  }
}

/** True when the editor session was unlocked with the private key. */
export async function editorSessionUnlocked(): Promise<boolean> {
  try {
    const session = await useSession<EditorSession>(sessionConfig());
    return Boolean(session.data.editor);
  } catch {
    // An unreadable or outdated unlock cookie simply means "not unlocked".
    return false;
  }
}
