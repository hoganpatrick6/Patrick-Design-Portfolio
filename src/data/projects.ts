import lunethraThumb from "../assets/projects/lunethra.jpg";
import driftwellThumb from "../assets/projects/driftwell.jpg";
import clyraThumb from "../assets/projects/clyra.jpg";
import forgekindThumb from "../assets/projects/forgekind.jpg";
import nestiveThumb from "../assets/projects/nestive.jpg";
import pollenateThumb from "../assets/projects/pollenate.jpg";

export type Project = {
  slug: string;
  title: string;
  category: string;
  year: string;
  description: string;
  image: string;
  role: string;
  client: string;
  overview: string[];
};

export const projects: Project[] = [
  {
    slug: "lunethra",
    title: "Uber Credit Card",
    category: "Brand Identity\n2025",
    year: "2025",
    description: "Design and art direction for Uber’s first multi-market co-brand credit card",
    image: lunethraThumb,
    role: "Brand Design, Art Direction",
    client: "Lunethra",
    overview: [
      "Uber’s first multi-market co-brand credit card aimed to offer compelling cash back benefits and exclusive features to enhance the Uber and Uber Eats user experience.",
      "I led brand design efforts from concept through launch, designing both standard and limited edition cards, production QC, campaign art direction, and overseeing the Mexico City rollout.",
    ],
  },
  {
    slug: "driftwell",
    title: "Grocery Fresh",
    category: "Art Direction",
    year: "2023",
    description: "",
    image: driftwellThumb,
    role: "Art Direction, Editorial Design",
    client: "Driftwell",
    overview: [
      "Why would anyone want a stranger to do their shopping for them? To build more trust and attract more attention to Uber Eats’ grocery business we created a library of images focused specifically on produce and our courier’s process. After all, produce selection takes skill.",
      "",
    ],
  },
  {
    slug: "clyra",
    title: "Clyra",
    category: "Product Design",
    year: "2023",
    description: "UI system and marketing site for a B2B SaaS product.",
    image: clyraThumb,
    role: "Product Design, Web Design",
    client: "Clyra",
    overview: [
      "A component library and marketing site built on one shared type and spacing scale, so the product and the pitch look like the same company.",
      "Dense data views were simplified to a small set of predictable patterns.",
    ],
  },
  {
    slug: "forgekind",
    title: "Forgekind",
    category: "Brand & Web",
    year: "2022",
    description: "Identity, typography, and web experience for a creative studio.",
    image: forgekindThumb,
    role: "Identity, Web Design",
    client: "Forgekind",
    overview: [
      "A studio identity with a bold typographic center and deliberately plain supporting material, letting the work carry the personality.",
      "The site uses long scrolls and heavy rules to frame case studies.",
    ],
  },
  {
    slug: "nestive",
    title: "Nestive",
    category: "Editorial",
    year: "2022",
    description: "Magazine design and digital editorial direction.",
    image: nestiveThumb,
    role: "Editorial Design",
    client: "Nestive",
    overview: [
      "A print and digital editorial program with a consistent grid, a serif display voice, and photography-led openers.",
      "Templates were built so the in-house team could lay out an issue without design support.",
    ],
  },
  {
    slug: "pollenate",
    title: "Pollenate",
    category: "Art Direction",
    year: "2021",
    description: "Visual direction and packaging for a consumer goods launch.",
    image: pollenateThumb,
    role: "Art Direction, Packaging",
    client: "Pollenate",
    overview: [
      "Packaging and launch visuals for a debut consumer line, built to read clearly on a crowded shelf.",
      "A simple color-coded structure separates product families while keeping one recognizable face.",
    ],
  },
];

export function getProject(slug: string) {
  return projects.find((p) => p.slug === slug);
}
