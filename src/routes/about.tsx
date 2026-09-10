import { createFileRoute, Link } from "@tanstack/react-router";
import { FragmentName } from "../components/FragmentName";
import { ThemeToggle } from "../components/ThemeToggle";
import { TypeSettingsPanel } from "../components/TypeSettingsPanel";
import { LayoutEditorToggle } from "../components/LayoutEditorToggle";
import { GridBlock, PageGrid } from "../components/PageGrid";
import { MediaBlocks } from "../components/MediaBlocks";
import { MediaEditorToggle } from "../components/MediaEditorToggle";
import { EditableBullets } from "../components/EditableBullets";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Patrick Hogan" },
      {
        name: "description",
        content:
          "About Patrick Hogan, a multidisciplinary designer with 10+ years leading brand, product, and editorial work from concept to launch.",
      },
      { property: "og:title", content: "About — Patrick Hogan" },
      {
        property: "og:description",
        content:
          "About Patrick Hogan, a multidisciplinary designer with 10+ years leading brand, product, and editorial work from concept to launch.",
      },
    ],
  }),
  component: AboutPage,
});

type Role = {
  title: string;
  company: string;
  url: string;
  dates: string;
  location: string;
  bullets: string[];
};

const experience: Role[] = [
  {
    title: "Senior Brand Designer",
    company: "Uber",
    url: "#",
    dates: "January 2023 – September 2026",
    location: "San Francisco, CA",
    bullets: [
      "Designed and scaled brand experiences across Uber’s global touchpoints—including digital, print, OOH, and product—ensuring consistency and impact across every channel.",
      "Led end-to-end execution of scalable, system-based design solutions, using Uber’s design language to drive clarity, cohesion, and global reach.",
    ],
  },
  {
    title: "Brand/Marketing Designer",
    company: "Carbon Health",
    url: "#",
    dates: "September 2020 – June 2022",
    location: "San Francisco, CA",
    bullets: [
      "Designed and shipped multi-platform marketing surfaces alongside engineering, balancing visual ambition with implementation realities.",
      "Owned design systems, component libraries, and brand alignment across web, mobile, and print collateral.",
      "Partnered with creative directors and producers to define visual strategy, talent direction, and production aesthetics within budget.",
      "Clients include: Nestive, Zentrox, Pollenate, Vireo and more.",
    ],
  },
  {
    title: "Visual Designer",
    company: "Creative Hub Studio",
    url: "#",
    dates: "October 2016 – March 2018",
    location: "Los Angeles, CA",
    bullets: [
      "Collaborated across Marketing, Brand, Creative, IT, and QA to ship cohesive, on-brand experiences from kickoff to launch.",
      "Identified emerging visual trends and integrated them into client work to keep brand expression current and culturally relevant.",
      "Clients include: Lunethra, Forgekind and more.",
    ],
  },
];

const skills: { heading: string; items: string[] }[] = [
  {
    heading: "Design Craft",
    items: ["Brand & Identity Systems", "Product & UI Design", "Editorial & Layout", "Typography"],
  },
  {
    heading: "Collaboration",
    items: ["Cross-Functional Leadership", "Client Relationships", "Stakeholder Communication"],
  },
  {
    heading: "Strategy & Direction",
    items: ["Creative Strategy", "Art Direction", "Design Systems Oversight", "Brand Alignment"],
  },
];

const recommendations = [
  {
    quote:
      "Patrick brings sunshine to creative teams. His optimism, problem-solving, and clear communication drive success.",
    attribution: "Client, Driftwell",
  },
  {
    quote:
      "Patrick is hungry to tackle new challenges. He’s delightful with clients and can diffuse a tense room with his laugh.",
    attribution: "Creative Director, Creative Agency XYZ",
  },
];

function Arrow() {
  return (
    <span aria-hidden className="ml-1 inline-block translate-y-[-1px] text-[0.85em]"></span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="type-label text-[var(--color-foreground-subtle)] tracking-wide">{children}</div>
  );
}

function Divider() {
  return <div className="h-px w-full bg-[var(--color-border)]" />;
}

function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased">
      {/* Sticky top bar */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-[var(--color-border)] px-8 py-5 md:px-16 md:py-6">
        <div className="flex items-start justify-between gap-4 md:grid md:grid-cols-12 md:gap-12">
          <div className="md:col-span-4 lg:col-span-3">
            <Link to="/about" className="block leading-tight">
              <div className="type-nav font-medium">
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
              <TypeSettingsPanel page="about" />
              <LayoutEditorToggle />
              <MediaEditorToggle page="about" />
            </div>
            <nav className="flex gap-6 type-nav">
              <Link
                to="/work"
                className="font-medium text-[var(--color-foreground-muted)] transition-colors hover:text-foreground"
              >
                Work
              </Link>
              <Link
                to="/about"
                className="font-medium text-foreground transition-colors hover:text-[var(--color-foreground-muted)]"
              >
                About
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main grid */}
      <main className="px-8 pb-32 pt-16 md:px-16 md:pt-24">
        <PageGrid>
          <GridBlock id="about-intro" label="Intro">
            <div className="border-t border-[var(--color-border)] pt-8">
              <p className="type-body text-foreground">
                A multidisciplinary designer with 10+ years of experience, I lead brand, product,
                and editorial work from concept to launch.
              </p>
            </div>
          </GridBlock>

          <GridBlock id="about-contact" label="Contact">
            <div className="space-y-3 border-t border-[var(--color-border)] pt-6">
              <a
                href="mailto:hello@patrickhogan.com"
                className="block type-body text-[var(--color-foreground-muted)] transition-colors hover:text-foreground"
              >
                hello@patrickhogan.com
                <Arrow />
              </a>
              <a
                href="tel:#"
                className="block type-body text-[var(--color-foreground-muted)] transition-colors hover:text-foreground"
              >
                {"\n"}
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="block type-body text-[var(--color-foreground-muted)] transition-colors hover:text-foreground"
              >
                LinkedIn
                <Arrow />
              </a>
            </div>
          </GridBlock>

          <GridBlock id="about-experience" label="Experience">
              <div className="border-t border-[var(--color-border)] pb-10 pt-8">
                <SectionLabel>Experience</SectionLabel>
              </div>
              <div className="space-y-16">
                {experience.map((role, i) => (
                  <div key={i}>
                    {i > 0 && (
                      <div className="-mt-8 mb-10">
                        <Divider />
                      </div>
                    )}
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-10">
                      <div className="space-y-1">
                        <h3 className="type-heading font-medium text-foreground">{role.title}</h3>
                        <a
                          href={role.url}
                          className="block type-body text-[var(--color-foreground-muted)] transition-colors hover:text-foreground"
                        >
                          {role.company}
                          <Arrow />
                        </a>
                        <div className="pt-3 type-body text-[var(--color-foreground-muted)]">
                          {role.dates}
                        </div>
                        <div className="type-body text-[var(--color-foreground-muted)]">
                          {role.location}
                        </div>
                      </div>
                      <EditableBullets id={`about-experience-${i}`} bullets={role.bullets} />
                    </div>
                  </div>
                ))}
              </div>
          </GridBlock>

          <GridBlock id="about-skills" label="Skills">
              <div className="border-t border-[var(--color-border)] pb-10 pt-8">
                <SectionLabel>Skills</SectionLabel>
              </div>
              <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
                {skills.map((group) => (
                  <div key={group.heading} className="space-y-4">
                    <h4 className="type-heading font-medium text-foreground">{group.heading}</h4>
                    <ul className="space-y-2">
                      {group.items.map((item) => (
                        <li
                          key={item}
                          className="type-body text-[var(--color-foreground-muted)]"
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
          </GridBlock>

          <GridBlock id="about-education" label="Education">
              <div className="border-t border-[var(--color-border)] pb-10 pt-8">
                <SectionLabel>Education</SectionLabel>
              </div>
              <div className="space-y-2">
                <h3 className="type-heading font-medium text-foreground">
                  University of California, Los Angeles (UCLA)
                </h3>
                <p className="type-body text-[var(--color-foreground-muted)]">
                  Bachelor of Fine Arts in Graphic Design
                </p>
                <p className="type-body text-[var(--color-foreground-muted)]">
                  Minor: Studio Photography
                </p>
              </div>
          </GridBlock>

          <GridBlock id="about-recommendations" label="Recommendations">
              <div className="border-t border-[var(--color-border)] pb-10 pt-8">
                <SectionLabel>Recommendations</SectionLabel>
              </div>
              <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
                {recommendations.map((r, i) => (
                  <figure key={i} className="space-y-4">
                    <blockquote className="type-body text-foreground">
                      “{r.quote}”
                    </blockquote>
                    <figcaption className="type-body text-[var(--color-foreground-muted)]">
                      {r.attribution}
                    </figcaption>
                  </figure>
                ))}
              </div>
          </GridBlock>

          <MediaBlocks page="about" />
        </PageGrid>
      </main>
    </div>
  );
}