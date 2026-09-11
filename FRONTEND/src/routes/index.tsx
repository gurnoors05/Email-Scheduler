import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { DashboardPage } from "@/pages/DashboardPage";

import { z } from "zod";

const searchSchema = z.object({
  tab: z.enum(["scheduled", "sent"]).optional(),
});

export const Route = createFileRoute("/")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Dashboard — ReachInbox Email Scheduler" },
      {
        name: "description",
        content:
          "Schedule and track email campaigns at scale: queue batches, pace sends, and monitor delivery.",
      },
      { property: "og:title", content: "Dashboard — ReachInbox Email Scheduler" },
      {
        property: "og:description",
        content: "Queue email batches, pace your sends, and track delivery in real time.",
      },
    ],
  }),
  component: DashboardRoute,
});

function DashboardRoute() {
  return (
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  );
}
