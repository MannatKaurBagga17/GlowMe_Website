import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CustomerShell } from "@/components/customer/customer-shell";
import { supabase } from "@/integrations/supabase/client";
import { User } from "lucide-react";

export const Route = createFileRoute("/_authenticated/_customer/me/profile")({
  ssr: false,
  head: () => ({ meta: [{ title: "Profile — GlowMe" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? "");
      setName((data.user?.user_metadata as any)?.full_name ?? "");
    });
  }, []);
  return (
    <CustomerShell title="Profile">
      <div className="rounded-2xl border border-primary/15 bg-card/60 p-6 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-primary/15 text-primary"><User className="h-7 w-7" /></div>
          <div>
            <h2 className="font-serif text-2xl">{name || "Your profile"}</h2>
            <p className="text-sm text-muted-foreground">{email}</p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Full name" value={name} />
          <Field label="Email" value={email} />
          <Field label="Saved addresses" value="None saved yet" />
          <Field label="Payment methods" value="UPI / Card on booking" />
        </div>
      </div>
    </CustomerShell>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/40 p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm">{value || "—"}</div>
    </div>
  );
}