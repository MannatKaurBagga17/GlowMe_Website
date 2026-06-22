import { createFileRoute, Link } from "@tanstack/react-router";
import { CustomerShell } from "@/components/customer/customer-shell";
import { MapPin } from "lucide-react";

const CITIES = ["Bengaluru", "Chandigarh", "Ludhiana"];

export const Route = createFileRoute("/_authenticated/_customer/me/near-me")({
  head: () => ({ meta: [{ title: "Near me — GlowMe" }] }),
  component: () => (
    <CustomerShell title="Near Me">
      <div className="grid gap-4 sm:grid-cols-3">
        {CITIES.map((c) => (
          <Link key={c} to="/search" search={{ city: c }} className="rounded-2xl border border-primary/15 bg-card/60 p-5 backdrop-blur-xl transition hover:border-primary/40">
            <MapPin className="h-6 w-6 text-primary" />
            <h3 className="mt-3 font-serif text-xl">{c}</h3>
            <p className="mt-1 text-xs text-muted-foreground">Discover top artists in {c}</p>
          </Link>
        ))}
      </div>
    </CustomerShell>
  ),
});