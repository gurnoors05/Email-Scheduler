import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { ListsPage } from "@/pages/ListsPage";

export const Route = createFileRoute("/lists")({
  head: () => ({
    meta: [
      { title: "Mailing Lists — ReachInbox Email Scheduler" },
      {
        name: "description",
        content: "Manage your mailing lists and contacts.",
      },
    ],
  }),
  component: ListsRoute,
});

function ListsRoute() {
  return (
    <ProtectedRoute>
      <ListsPage />
    </ProtectedRoute>
  );
}
