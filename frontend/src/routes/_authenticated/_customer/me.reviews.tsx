import { createFileRoute } from "@tanstack/react-router";
import { CustomerShell } from "@/components/customer/customer-shell";
import { Star } from "lucide-react";

export const Route = createFileRoute("/_authenticated/_customer/me/reviews")({
  head: () => ({ meta: [{ title: "My reviews — GlowMe" }] }),
  component: () => (
    <CustomerShell title="Reviews & Ratings">
      <div className="rounded-2xl border border-primary/15 bg-card/60 p-8 text-center backdrop-blur-xl">
        <Star className="mx-auto h-8 w-8 text-primary" />
        <h2 className="mt-3 font-serif text-2xl">Your reviews</h2>
        <p className="mt-2 text-sm text-muted-foreground">Reviews you've left appear here after each completed booking.</p>
      </div>
    </CustomerShell>
  ),
});