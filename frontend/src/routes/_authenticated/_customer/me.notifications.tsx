import { createFileRoute } from "@tanstack/react-router";
import { CustomerShell } from "@/components/customer/customer-shell";
import { Bell } from "lucide-react";

export const Route = createFileRoute("/_authenticated/_customer/me/notifications")({
  head: () => ({ meta: [{ title: "Notifications — GlowMe" }] }),
  component: () => (
    <CustomerShell title="Notifications">
      <div className="rounded-2xl border border-primary/15 bg-card/60 p-8 text-center backdrop-blur-xl">
        <Bell className="mx-auto h-8 w-8 text-primary" />
        <h2 className="mt-3 font-serif text-2xl">You're all caught up</h2>
        <p className="mt-2 text-sm text-muted-foreground">Booking updates and offers will appear here.</p>
      </div>
    </CustomerShell>
  ),
});