import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ThemeToggle } from "../components/ThemeToggle";
import { TypeSettingsPanel } from "../components/TypeSettingsPanel";
import { LayoutEditorToggle } from "../components/LayoutEditorToggle";
import { GridBlock, PageGrid } from "../components/PageGrid";
import { MediaBlocks } from "../components/MediaBlocks";
import { EditableMedia } from "../components/EditableMedia";
import { MediaEditorToggle } from "../components/MediaEditorToggle";
import { FragmentName } from "../components/FragmentName";
import { getProject, projects } from "../data/projects";

export const Route = createFileRoute("/work/$slug")({
  loader: ({ params }) => {
    const project = getProject(params.slug);
    if (!project) throw notFound();
    return { project };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Project not found — Patrick Hogan" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const { project } = loaderData;
    const description = project.description;
    const title = `${project.title} — Patrick Hogan`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  notFoundComponent: ProjectNotFound,
  component: ProjectPage,
});

function Header({ page = "project" }: { page?: string }) {
  return (
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
            <TypeSettingsPanel page={page} />
              <LayoutEditorToggle />
            <MediaEditorToggle page={page} />
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
  );
}

function ProjectNotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased">
      <Header />
      <main className="px-8 pb-32 pt-16 md:px-16 md:pt-24">
        <h1 className="type-display">
          That project doesn’t exist.
        </h1>
        <Link
          to="/work"
          className="mt-8 inline-block type-body text-[var(--color-foreground-muted)] hover:text-foreground"
        >
          ← Back to all projects
        </Link>
      </main>
    </div>
  );
}

function ProjectPage() {
  const { project } = Route.useLoaderData();
  const index = projects.findIndex((p) => p.slug === project.slug);
  const next = projects[(index + 1) % projects.length];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased">
      <Header page={`project:${project.slug}`} />

      <main className="px-8 pb-32 pt-16 md:px-16 md:pt-24">
        <PageGrid>
          <GridBlock id="project-header" label="Title">
            <div className="border-t border-[var(--color-border)] pt-8">
              <Link
                to="/work"
                className="type-label tracking-wide text-[var(--color-foreground-subtle)] transition-colors hover:text-foreground"
              >
                ← Projects
              </Link>
              <h1
                className="mt-8 type-display text-foreground"
              >
                {project.title}
              </h1>
              <p className="mt-6 max-w-2xl type-body text-[var(--color-foreground-muted)]">
                {project.description}
              </p>
            </div>
          </GridBlock>


          <GridBlock id="project-details" label="Details">
            <dl className="space-y-8">
              <div>
                <dt className="type-label tracking-wide text-[var(--color-foreground-subtle)]">
                  Client
                </dt>
                <dd className="mt-2 type-body">{project.client}</dd>
              </div>
              <div>
                <dt className="type-label tracking-wide text-[var(--color-foreground-subtle)]">
                  Discipline
                </dt>
                <dd className="mt-2 type-body">{project.category}</dd>
              </div>
              <div>
                <dt className="type-label tracking-wide text-[var(--color-foreground-subtle)]">
                  Role
                </dt>
                <dd className="mt-2 type-body">{project.role}</dd>
              </div>
              <div>
                <dt className="type-label tracking-wide text-[var(--color-foreground-subtle)]">
                  Year
                </dt>
                <dd className="mt-2 type-body">{project.year}</dd>
              </div>
            </dl>
          </GridBlock>

          <GridBlock id="project-overview" label="Overview">
            <div className="max-w-2xl space-y-6">
              {project.overview.map((paragraph) => (
                <p key={paragraph} className="type-body text-[var(--color-foreground-muted)]">
                  {paragraph}
                </p>
              ))}
            </div>
          </GridBlock>

          <GridBlock id="project-next" label="Next project">
            <div className="border-t border-[var(--color-border)] pt-8">
          <div className="type-label tracking-wide text-[var(--color-foreground-subtle)]">
            Next project
          </div>
          <Link
            to="/work/$slug"
            params={{ slug: next.slug }}
            className="group mt-6 grid grid-cols-1 gap-6 md:grid-cols-12 md:gap-12"
          >
            <div className="md:col-span-5 lg:col-span-4">
              <EditableMedia
                id={`project-thumb:${next.slug}`}
                src={next.image}
                alt={next.title}
                className="aspect-[3/2] w-full rounded-sm object-cover"
              />
            </div>
            <div className="md:col-span-7">
              <h2 className="type-heading font-medium transition-colors group-hover:text-[var(--color-foreground-muted)]">
                {next.title}
              </h2>
              <p className="mt-2 max-w-md type-body text-[var(--color-foreground-muted)]">
                {next.description}
              </p>
            </div>
          </Link>
            </div>
          </GridBlock>

          <MediaBlocks page={`project:${project.slug}`} />
        </PageGrid>
      </main>
    </div>
  );
}
