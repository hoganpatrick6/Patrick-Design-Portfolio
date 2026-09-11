import { createFileRoute, Link, notFound } from "@tanstack/react-router";
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

  if (project.slug === "driftwell") {
    return <GroceryFreshPage />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased">
      <Header page={`project:${project.slug}`} />

      <main className="px-8 pb-32 pt-16 md:px-16 md:pt-24">
        <Canvas page={`project:${project.slug}`}>
          <CanvasBlock id="project-header" label="Title">
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
          </CanvasBlock>


          <CanvasBlock id="project-details" label="Details">
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
          </CanvasBlock>

          <CanvasBlock id="project-overview" label="Overview">
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
          </CanvasBlock>
        </Canvas>
      </main>
    </div>
  );
}

function GroceryFreshPage() {
  const page = "project:driftwell";

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased">
      <Header page={page} />

      <main className="px-4 pb-32 pt-12 sm:px-8 md:px-16 md:pt-20">
        <Canvas page={page}>
          <CanvasBlock id="grocery-header" label="Project introduction">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:items-end md:gap-x-6">
              <h1 className="type-display md:col-span-12 text-foreground">
                Grocery Fresh
              </h1>
              <dl className="grid grid-cols-2 gap-5 md:col-span-4 md:max-w-xs">
                <div>
                  <dt className="type-label text-[var(--color-foreground-subtle)]">
                    Client
                  </dt>
                  <dd className="mt-1 type-label text-foreground">Uber</dd>
                </div>
                <div>
                  <dt className="type-label text-[var(--color-foreground-subtle)]">
                    Role
                  </dt>
                  <dd className="mt-1 type-label text-foreground">Art Direction</dd>
                </div>
              </dl>
              <p className="type-label md:col-span-6 md:col-start-6 md:max-w-xl">
                Why would anyone want a stranger to do their shopping for them? To
                build more trust and attract more attention to Uber Eats’ grocery
                business, we created a library of images focused specifically on
                produce and our courier’s process. After all, produce selection takes
                skill.
              </p>
            </div>
          </CanvasBlock>

          <CanvasBlock id="grocery-hero" label="Carrot photograph">
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

          <CanvasBlock id="grocery-story" label="Image library story">
            <div className="mx-auto max-w-xl text-center">
              <h2 className="fragment-name text-2xl leading-tight">Global Image Library</h2>
              <div className="mx-auto mt-7 max-w-md space-y-4">
                <p className="type-label">
                  We partnered with photographers to shoot in four different grocery
                  stores across Los Angeles, each representing a different region of
                  the world.
                </p>
                <p className="type-label">
                  It was important for us to shoot in real Eats grocery locations with
                  real Eats couriers. We wanted to give our audience an authentic look
                  into who is behind their shopping and how they do it—while also
                  making each produce item shine like the delicious heroes they are.
                </p>
              </div>
            </div>
          </CanvasBlock>

          <CanvasBlock id="grocery-gallery" label="Produce image library">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <EditableMedia
                id="grocery-fresh:oranges"
                src={groceryOranges}
                alt="A shopper selecting a mandarin from a market display"
                width={1008}
                height={1200}
                placeholder
                className="aspect-[5/6] w-full object-cover"
              />
              <EditableMedia
                id="grocery-fresh:blueberries"
                src={groceryBlueberries}
                alt="Four blueberries casting shadows on a pale blue background"
                width={1008}
                height={1200}
                placeholder
                className="aspect-[5/6] w-full object-cover"
              />
              <EditableMedia
                id="grocery-fresh:tomatoes"
                src={groceryTomatoes}
                alt="A hand holding two heirloom tomatoes against deep red"
                width={1008}
                height={1200}
                placeholder
                className="aspect-[5/6] w-full object-cover"
              />
              <EditableMedia
                id="grocery-fresh:eggs"
                src={groceryEggs}
                alt="Stacks of yellow egg cartons on green grocery crates"
                width={1008}
                height={1200}
                placeholder
                className="aspect-[5/6] w-full object-cover"
              />
            </div>
          </CanvasBlock>

          <CanvasBlock id="grocery-campaign" label="Campaign artwork">
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
