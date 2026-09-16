import { createFileRoute, Link, notFound, redirect } from "@tanstack/react-router";
import { ThemeToggle } from "../components/ThemeToggle";
import { TypeSettingsPanel } from "../components/TypeSettingsPanel";
import { EditorToolbar } from "../components/EditorToolbar";
import { Canvas, CanvasBlock } from "../components/Canvas";
import { EditableMedia } from "../components/EditableMedia";
import { FragmentName } from "../components/FragmentName";
import { getProject, projects } from "../data/projects";
import groceryCarrots from "../assets/projects/grocery-carrots.jpg";
import groceryOranges from "../assets/projects/grocery-oranges.jpg";
import groceryBlueberries from "../assets/projects/grocery-blueberries.jpg";
import groceryTomatoes from "../assets/projects/grocery-tomatoes.jpg";
import groceryEggs from "../assets/projects/grocery-eggs.jpg";
import groceryCampaign from "../assets/projects/grocery-campaign.jpg";

/** Next-project thumbnails reuse the Work page's saved media-library images. */
const NEXT_PROJECT_THUMBS: Record<string, string> = {
  "uber-credit-card": "/api/public/media/fac95b94-956f-49fd-bf54-2cac01af6a6f",
  "grocery-fresh": "/api/public/media/29ca994b-8b87-4fb1-805d-1c68f877172c",
  "carbon-health-rebrand": "/api/public/media/1d705643-4a57-4c63-963b-c680fdc88255",
  "uber-photography-guidelines": "/api/public/media/9bcd0f00-aabb-4446-8e5c-96239b103943",
};


export const Route = createFileRoute("/work/$slug")({
  loader: ({ params }) => {
    const project = getProject(params.slug);
    if (!project) {
      const renamed = OLD_SLUG_REDIRECTS[params.slug];
      if (renamed) {
        throw redirect({ to: "/work/$slug", params: { slug: renamed } });
      }
      throw notFound();
    }
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
            <EditorToolbar page={page} />
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
            <Link
              to="/resume"
              className="font-medium text-[var(--color-foreground-muted)] transition-colors hover:text-foreground"
            >
              Resume
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
      <main className="px-8 pb-32 pt-0 md:px-16">
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

  if (project.slug === "grocery-fresh") {
    return <GroceryFreshPage />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased">
      <Header page={`project:${project.slug}`} />

      <main className="px-4 pb-32 pt-0 sm:px-8 md:px-16">
        <Canvas page={`project:${project.slug}`}>
          <ProjectHeader project={project} />

          <CanvasBlock id={`project-${project.slug}-overview`} label="Overview" autoHeight>
            <div className="max-w-2xl space-y-6">
              {project.overview.map((paragraph) => (
                <p key={paragraph} className="type-body text-[var(--color-foreground-muted)]">
                  {paragraph}
                </p>
              ))}
            </div>
          </CanvasBlock>

          <CanvasBlock id="project-next" label="Next project">
            <div className="border-t border-[var(--color-border)] pt-8">
          <div className="type-label text-[var(--color-foreground-subtle)]">
            Next project
          </div>
          <Link
            to="/work/$slug"
            params={{ slug: next.slug }}
            className="group mt-6 grid grid-cols-1 gap-6 md:grid-cols-12 md:gap-12"
          >
            {NEXT_PROJECT_THUMBS[next.slug] ? (
              <div className="md:col-span-5 lg:col-span-4">
                <EditableMedia
                  id={`project-thumb:${next.slug}`}
                  src={NEXT_PROJECT_THUMBS[next.slug]}
                  alt={next.title}
                  className="aspect-[3/2] w-full rounded-sm object-cover"
                />
              </div>
            ) : null}
            <div className="md:col-span-7">
              <h2 className="type-heading transition-colors group-hover:text-[var(--color-foreground-muted)]">
                {next.title}
              </h2>
              <p className="mt-2 max-w-md type-body text-[var(--color-foreground-muted)]">
                {next.description}
              </p>
            </div>
          </Link>
            </div>
          </CanvasBlock>
        </Canvas>
      </main>
    </div>
  );
}

function GroceryFreshPage() {
  const page = "project:grocery-fresh";
  const project = getProject("grocery-fresh");
  if (!project) return null;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased">
      <Header page={page} />

      <main className="px-4 pb-32 pt-0 sm:px-8 md:px-16">
        <Canvas page={page}>
          <ProjectHeader project={project} />

          <CanvasBlock id="grocery-fresh-hero" label="Carrot photograph">
            <EditableMedia
              id="grocery-fresh:carrots"
              src={groceryCarrots}
              alt="Bundles of multicolored heirloom carrots with leafy tops"
              width={1600}
              height={1008}
              eager
              placeholder
              className="aspect-[16/10] w-full object-cover"
            />
          </CanvasBlock>

          <CanvasBlock id="grocery-fresh-story-title" label="Image library title" autoHeight>
            <h2 className="type-subhead text-center">
              Global Image Library
            </h2>
          </CanvasBlock>

          <CanvasBlock id="grocery-fresh-story-intro" label="Image library introduction" autoHeight>
            <p className="type-body text-center">
              We partnered with photographers to shoot in four different grocery stores
              across Los Angeles, each representing a different region of the world.
            </p>
          </CanvasBlock>

          <CanvasBlock id="grocery-fresh-story-detail" label="Image library details" autoHeight>
            <p className="type-body text-center">
              It was important for us to shoot in real Eats grocery locations with real
              Eats couriers. We wanted to give our audience an authentic look into who
              is behind their shopping and how they do it—while also making each produce
              item shine like the delicious heroes they are.
            </p>
          </CanvasBlock>

          <CanvasBlock id="grocery-fresh-oranges" label="Oranges image">
            <EditableMedia
              id="grocery-fresh:oranges"
              src={groceryOranges}
              alt="A shopper selecting a mandarin from a market display"
              width={1008}
              height={1200}
              placeholder
              className="aspect-[5/6] w-full object-cover"
            />
          </CanvasBlock>

          <CanvasBlock id="grocery-fresh-blueberries" label="Blueberries image">
            <EditableMedia
              id="grocery-fresh:blueberries"
              src={groceryBlueberries}
              alt="Four blueberries casting shadows on a pale blue background"
              width={1008}
              height={1200}
              placeholder
              className="aspect-[5/6] w-full object-cover"
            />
          </CanvasBlock>

          <CanvasBlock id="grocery-fresh-tomatoes" label="Tomatoes image">
            <EditableMedia
              id="grocery-fresh:tomatoes"
              src={groceryTomatoes}
              alt="A hand holding two heirloom tomatoes against deep red"
              width={1008}
              height={1200}
              placeholder
              className="aspect-[5/6] w-full object-cover"
            />
          </CanvasBlock>

          <CanvasBlock id="grocery-fresh-eggs" label="Eggs image">
            <EditableMedia
              id="grocery-fresh:eggs"
              src={groceryEggs}
              alt="Stacks of yellow egg cartons on green grocery crates"
              width={1008}
              height={1200}
              placeholder
              className="aspect-[5/6] w-full object-cover"
            />
          </CanvasBlock>

          <CanvasBlock id="grocery-fresh-campaign" label="Campaign artwork">
            <div className="-mx-4 overflow-hidden sm:-mx-8 md:-mx-16">
              <EditableMedia
                id="grocery-fresh:campaign"
                src={groceryCampaign}
                alt="A colorful series of produce-led grocery campaign artworks"
                width={1920}
                height={912}
                placeholder
                className="h-auto min-h-72 w-full object-cover"
              />
            </div>
          </CanvasBlock>
        </Canvas>
      </main>
    </div>
  );
}

/** Placeholder slugs from before the projects were renamed; old links redirect. */
const OLD_SLUG_REDIRECTS: Record<string, string> = {
  lunethra: "uber-credit-card",
  driftwell: "grocery-fresh",
  clyra: "uber-color-system",
  forgekind: "carbon-health-rebrand",
  nestive: "uber-photography-guidelines",
};

function ProjectHeader({ project }: { project: (typeof projects)[number] }) {
  const id = (slot: string) => `project-${project.slug}-${slot}`;
  return (
    <>
      <CanvasBlock id={id("title")} label="Project title" autoHeight>
        <h1 className="type-display text-foreground">{project.title}</h1>
      </CanvasBlock>
      <CanvasBlock id={id("client")} label="Client details" autoHeight>
        <dl>
          <dt className="type-label text-[var(--color-foreground-subtle)]">Client</dt>
          <dd className="mt-1 type-body text-foreground">{project.client}</dd>
        </dl>
      </CanvasBlock>
      <CanvasBlock id={id("role")} label="Role details" autoHeight>
        <dl>
          <dt className="type-label text-[var(--color-foreground-subtle)]">Role</dt>
          <dd className="mt-1 whitespace-pre-line type-body text-foreground">{project.role}</dd>
        </dl>
      </CanvasBlock>
      <CanvasBlock id={id("summary")} label="Project summary" autoHeight>
        <p className="max-w-xl type-body text-foreground">
          {project.description || project.overview[0]}
        </p>
      </CanvasBlock>
    </>
  );
}
