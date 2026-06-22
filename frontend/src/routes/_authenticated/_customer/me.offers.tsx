import { createFileRoute } from "@tanstack/react-router";
import { CustomerShell } from "@/components/customer/customer-shell";
import { Gift } from "lucide-react";

const OFFERS = [
  { code: "GLOW20", text: "20% off your first booking", expires: "Limited time" },
  { code: "BRIDE10", text: "₹1,000 off bridal packages", expires: "This month" },
  { code: "REFER100", text: "Refer a friend, both get ₹500", expires: "Ongoing" },
];

export const Route = createFileRoute("/_authenticated/_customer/me/offers")({
  head: () => ({ meta: [{ title: "Offers & coupons — GlowMe" }] }),
  component: () => (
    <CustomerShell title="Offers & Coupons">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {OFFERS.map((o) => (
          <div key={o.code} className="rounded-2xl border border-primary/20 bg-card/60 p-5 backdrop-blur-xl">
            <Gift className="h-6 w-6 text-primary" />
            <h3 className="mt-3 font-serif text-lg">{o.text}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{o.expires}</p>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-dashed border-primary/40 px-3 py-1 text-xs">
              <span className="text-muted-foreground">Code</span>
              <span className="font-mono text-primary">{o.code}</span>
            </div>
          </div>
        ))}
      </div>
    </CustomerShell>
  ),
});