import { createFileRoute } from "@tanstack/react-router";
import { NotFoundPage } from "@/pages/NotFoundPage";

export const Route = createFileRoute("/$")({
  head: () => ({
    meta: [
      { title: "Page not found — ReachInbox" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NotFoundPage,
});
