import { createFileRoute } from "@tanstack/react-router";
import { redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/about" });
  },
  head: () => ({
    meta: [
      { title: "Patrick Hogan — Brand Designer / Art Director" },
    ],
  }),
  component: Index,
});

function Index() {
  return null;
}
