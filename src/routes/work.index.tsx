import { createFileRoute, Link } from "@tanstack/react-router";
import { ThemeToggle } from "../components/ThemeToggle";
import { TypeSettingsPanel } from "../components/TypeSettingsPanel";
import { LayoutEditorToggle } from "../components/LayoutEditorToggle";
import { GridBlock, PageGrid } from "../components/PageGrid";
import { MediaBlocks } from "../components/MediaBlocks";
import { EditableMedia } from "../components/EditableMedia";
import { MediaEditorToggle } from "../components/MediaEditorToggle";
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
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <TypeSettingsPanel page="work" />
              <LayoutEditorToggle />
              <MediaEditorToggle page="work" />
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
        <PageGrid>
          <GridBlock id="work-intro" label="Intro">
            <div className="border-t border-[var(--color-border)] pt-8">
              <p
                className="type-display text-foreground"
              >
                Patrick is a brand designer, art director and photographer who excels at bringing creativity to design systems thinking.
              </p>
            </div>
          </GridBlock>

          <GridBlock id="work-projects-rule" label="Projects rule">
            <div className="border-t border-[var(--color-border)]" />
          </GridBlock>

          <GridBlock id="work-projects-label" label="Projects label">
            <div className="type-label text-[var(--color-foreground-subtle)] tracking-wide">
              Projects
            </div>
          </GridBlock>

          <GridBlock id="work-projects" label="Project list">
            <div className="space-y-16">
              {projects.map((project) => (
                <div
                  key={project.slug}
                  data-page-grid=""
                  className="group grid grid-cols-1 items-start gap-4 border-b border-[var(--color-border)] pb-12 md:grid-cols-12 md:grid-rows-[auto_1fr] md:gap-x-8 md:gap-y-2"
                >
                  <GridBlock
                    id={`project-thumb-block:${project.slug}`}
                    label={`${project.title} image`}
                    className="md:row-start-1 md:row-span-2"
                  >
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
                  </GridBlock>
                  <GridBlock
                    id={`project-title-block:${project.slug}`}
                    label={`${project.title} title`}
                    className="md:row-start-1"
                  >
                    <h2 className="type-heading font-medium text-foreground">
                      <Link
                        to="/work/$slug"
                        params={{ slug: project.slug }}
                        className="transition-colors hover:text-[var(--color-foreground-muted)]"
                      >
                        {project.title}
                      </Link>
                    </h2>
                  </GridBlock>
                  <GridBlock
                    id={`project-description-block:${project.slug}`}
                    label={`${project.title} description`}
                    className="md:row-start-2 md:self-start"
                  >
                    <p className="max-w-md type-body text-[var(--color-foreground-muted)]">
                      {project.description}
                    </p>
                  </GridBlock>
                  <GridBlock
                    id={`project-category-block:${project.slug}`}
                    label={`${project.title} category`}
                    className="md:row-start-1"
                  >
                    <span className="block type-body text-[var(--color-foreground-muted)] md:text-right">
                      {project.category}
                    </span>
                  </GridBlock>
                  <GridBlock
                    id={`project-year-block:${project.slug}`}
                    label={`${project.title} year`}
                    className="md:row-start-2 md:self-end"
                  >
                    <span className="block type-body text-[var(--color-foreground-subtle)] md:text-right">
                      {project.year}
                    </span>
                  </GridBlock>
                </div>
              ))}
            </div>
          </GridBlock>

          <MediaBlocks page="work" />
        </PageGrid>
      </main>
    </div>
  );
}
