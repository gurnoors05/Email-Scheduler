import { createFileRoute } from "@tanstack/react-router";
import { LoginPage } from "@/pages/LoginPage";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — ReachInbox" },
      {
        name: "description",
        content: "Sign in to ReachInbox with Google to schedule email campaigns at scale.",
      },
      { property: "og:title", content: "Sign in — ReachInbox" },
      {
        property: "og:description",
        content: "Sign in to ReachInbox with Google to schedule email campaigns at scale.",
      },
    ],
  }),
  component: LoginPage,
});
