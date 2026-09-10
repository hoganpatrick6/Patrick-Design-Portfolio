import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { ThemeProvider } from "../components/ThemeProvider";
import { TypeSettingsProvider } from "../components/TypeSettingsProvider";
import { CanvasProvider } from "../components/CanvasProvider";
import { BlockInspector } from "../components/BlockInspector";
import { SITE_TYPE_DEFAULTS, typeSettingsToCss } from "../config/type-defaults";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Patrick Hogan — Brand Designer / Art Director Portfolio" },
      { name: "description", content: "Portfolio of Patrick Hogan, a multidisciplinary designer working across brand, product, and editorial." },
      { property: "og:title", content: "Patrick Hogan — Brand Designer / Art Director Portfolio" },
      { property: "og:description", content: "Portfolio of Patrick Hogan, a multidisciplinary designer working across brand, product, and editorial." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600&display=swap",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600&family=Space+Mono:wght@400;700&family=Bebas+Neue&family=Caveat:wght@500;700&family=Instrument+Serif:ital@0;1&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
    scripts: [
      {
        // Apply saved theme before first paint to avoid a flash.
        src: `
          (function () {
            try {
              var theme = localStorage.getItem('theme');
              if (theme === 'light') {
                document.documentElement.classList.remove('dark');
              } else {
                document.documentElement.classList.add('dark');
              }
            } catch (e) {}
          })();
        `,
      },
      {
        // Apply locally saved type tweaks before first paint.
        src: `
          (function () {
            try {
              var raw = localStorage.getItem('type-settings');
              if (!raw) return;
              var s = JSON.parse(raw);
              var kebab = function (k) {
                return k.replace(/[A-Z]/g, function (m) { return '-' + m.toLowerCase(); });
              };
              Object.keys(s).forEach(function (role) {
                var r = s[role];
                if (!r || typeof r !== 'object') return;
                Object.keys(r).forEach(function (prop) {
                  var v = r[prop];
                  var out;
                  if (prop === 'italic') out = v ? 'italic' : 'normal';
                  else if (prop === 'tracking' || prop === 'wordSpacing' || prop === 'paraSpacing') out = v + 'em';
                  else if (prop === 'measure') out = Number(v) > 0 ? v + 'ch' : 'none';
                  else out = String(v);
                  document.documentElement.style.setProperty(
                    '--type-' + role + '-' + kebab(prop),
                    out
                  );
                });
              });
            } catch (e) {}
          })();
        `,
      },

    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        {/* Saved site-wide type defaults, applied server-side (no flash). */}
        <style
          dangerouslySetInnerHTML={{
            __html: `:root { ${typeSettingsToCss(SITE_TYPE_DEFAULTS)} }`,
          }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <ThemeProvider>
      <TypeSettingsProvider>
        <CanvasProvider>
          <QueryClientProvider client={queryClient}>
            {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
            <Outlet />
            <BlockInspector />
          </QueryClientProvider>
        </CanvasProvider>
      </TypeSettingsProvider>
    </ThemeProvider>
  );
}
