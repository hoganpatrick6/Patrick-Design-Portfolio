import { createFileRoute, Link } from "@tanstack/react-router";
import { ThemeToggle } from "../components/ThemeToggle";
import { TypeSettingsPanel } from "../components/TypeSettingsPanel";
import { EditorToolbar } from "../components/EditorToolbar";
import { Canvas, CanvasBlock } from "../components/Canvas";
import { FragmentName } from "../components/FragmentName";

export const Route = createFileRoute("/work/")({
  head: () => ({
    meta: [
      { title: "Work — Patrick Hogan" },
      {
        name: "description",
        content:
          "Selected brand, product, and editorial design work by Patrick Hogan.",
      },
      { property: "og:title", content: "Work — Patrick Hogan" },
      {
        property: "og:description",
        content:
          "Selected brand, product, and editorial design work by Patrick Hogan.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WorkPage,
});

function WorkPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased">
      {/* Sticky top bar */}
      <header className="sticky top-0 z-50 border-b border-[var(--color-border)]/50 bg-background/55 px-8 py-5 backdrop-blur-2xl backdrop-saturate-150 md:px-16 md:py-6">
        <div className="flex items-start justify-between gap-4 md:grid md:grid-cols-12 md:gap-12">
          <div className="md:col-span-4 lg:col-span-3">
            <Link to="/about" className="block leading-tight">
              <div className="type-nav">
                <FragmentName text="Patrick Hogan" />
              </div>
              <div className="type-nav text-[var(--color-foreground-muted)]">
                Brand Designer / Art Director
              </div>
            </Link>
          </div>
          <div className="flex items-start justify-between md:col-span-8 md:col-start-5 lg:col-span-9 lg:col-start-4">
            <div className="flex flex-wrap items-center gap-2">
              <ThemeToggle />
              <TypeSettingsPanel />
              <EditorToolbar page="work" />
            </div>
            <nav className="flex gap-6 type-nav">
              <Link
                to="/work"
                className="text-foreground transition-colors hover:text-[var(--color-foreground-muted)]"
              >
                Work
              </Link>
              <Link
                to="/about"
                className="text-[var(--color-foreground-muted)] transition-colors hover:text-foreground"
              >
                About
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="px-8 pb-32 pt-16 md:px-16 md:pt-24">
        <Canvas page="work">
          <CanvasBlock id="work-intro" label="Intro" autoHeight>
            <div className="pt-8">
              <p className="type-display text-foreground">
                Patrick is a brand designer, art director and photographer who excels at
                bringing creativity to design systems thinking.
              </p>
            </div>
          </CanvasBlock>

          <CanvasBlock id="work-projects-label" label="Projects label" autoHeight>
            <div className="type-label text-[var(--color-foreground-subtle)]">
              Projects
            </div>
          </CanvasBlock>

        </Canvas>
      </main>
    </div>
  );
}
