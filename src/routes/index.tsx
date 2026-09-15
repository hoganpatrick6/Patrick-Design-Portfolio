import { createFileRoute } from "@tanstack/react-router";
import { redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/work" });
  },
  head: () => ({
    meta: [
      { title: "Work — Patrick Hogan" },
    ],
  }),
  component: Index,
});

function Index() {
  return null;
}
