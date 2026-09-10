import { createFileRoute, Link } from "@tanstack/react-router";
import { ThemeToggle } from "../components/ThemeToggle";
import { TypeSettingsPanel } from "../components/TypeSettingsPanel";
import { EditorToolbar } from "../components/EditorToolbar";
import { Canvas, CanvasBlock } from "../components/Canvas";
import { EditableMedia } from "../components/EditableMedia";
import { FragmentName } from "../components/FragmentName";
import { projects } from "../data/projects";

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
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-[var(--color-border)] px-8 py-5 md:px-16 md:py-6">
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
                className="font-medium text-foreground transition-colors hover:text-[var(--color-foreground-muted)]"
              >
                Work
              </Link>
              <Link
                to="/about"
                className="font-medium text-[var(--color-foreground-muted)] transition-colors hover:text-foreground"
              >
                About
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="px-8 pb-32 pt-16 md:px-16 md:pt-24">
        <Canvas page="work">
          <CanvasBlock id="work-intro" label="Intro">
            <div className="border-t border-[var(--color-border)] pt-8">
              <p className="type-display text-foreground">
                Patrick is a brand designer, art director and photographer who excels at
                bringing creativity to design systems thinking.
              </p>
            </div>
          </CanvasBlock>

          <CanvasBlock id="work-projects-label" label="Projects label">
            <div className="type-label tracking-wide text-[var(--color-foreground-subtle)]">
              Projects
            </div>
          </CanvasBlock>

          <CanvasBlock id="work-projects" label="Project list">
            <div className="space-y-16">
              {projects.map((project) => (
                <div
                  key={project.slug}
                  className="group grid grid-cols-1 items-start gap-4 border-b border-[var(--color-border)] pb-12 md:grid-cols-12 md:gap-x-8 md:gap-y-2"
                >
                  <div className="md:col-span-5">
                    <Link
                      to="/work/$slug"
                      params={{ slug: project.slug }}
                      aria-label={`View ${project.title}`}
                      className="block"
                    >
                      <EditableMedia
                        id={`project-thumb:${project.slug}`}
                        src={project.image}
                        alt={project.title}
                        className="aspect-[3/2] w-full rounded-sm object-cover transition-opacity group-hover:opacity-85"
                      />
                    </Link>
                  </div>
                  <div className="md:col-span-4">
                    <h2 className="type-heading font-medium text-foreground">
                      <Link
                        to="/work/$slug"
                        params={{ slug: project.slug }}
                        className="transition-colors hover:text-[var(--color-foreground-muted)]"
                      >
                        {project.title}
                      </Link>
                    </h2>
                    <p className="mt-2 max-w-md type-body text-[var(--color-foreground-muted)]">
                      {project.description}
                    </p>
                  </div>
                  <div className="md:col-span-3 md:text-right">
                    <span className="block type-body text-[var(--color-foreground-muted)]">
                      {project.category}
                    </span>
                    <span className="block type-body text-[var(--color-foreground-subtle)]">
                      {project.year}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CanvasBlock>
        </Canvas>
      </main>
    </div>
  );
}
