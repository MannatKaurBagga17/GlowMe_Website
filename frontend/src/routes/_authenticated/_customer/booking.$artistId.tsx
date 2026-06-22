import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useSuspenseQuery, queryOptions, useMutation, useQuery } from "@tanstack/react-query";
import { getArtistAvailability, createBooking } from "@/lib/glowme.functions";
import { SiteHeader } from "@/components/site-header";
import { formatINR, formatDate, formatTime } from "@/lib/format";
import { z } from "zod";
import { Lock, Building2, ShieldCheck } from "lucide-react";

const searchSchema = z.object({
  services: z.string().optional().default(""),
  mode: z.enum(["studio"]).optional(),
});

export const Route = createFileRoute("/_authenticated/_customer/booking/$artistId")({
  validateSearch: (input: Record<string, unknown>) => searchSchema.parse(input),
  head: () => ({ meta: [{ title: "Book — GlowMe" }] }),
  errorComponent: ({ error }) => <div className="p-8 text-destructive">{String(error?.message ?? error)}</div>,
  notFoundComponent: () => <div className="p-8">Not found</div>,
  component: BookingPage,
});

const slotsQO = (artistId: string) =>
  queryOptions({ queryKey: ["slots", artistId], queryFn: () => getArtistAvailability({ data: { artistId, days: 60 } }) });

function BookingPage() {
  const { artistId } = Route.useParams();
  const { services: serviceCsv } = Route.useSearch();
  const navigate = useNavigate();
  const serviceIds = serviceCsv.split(",").filter(Boolean);

  const { data: slotData } = useSuspenseQuery(slotsQO(artistId));

  const artistQuery = useQuery({
    queryKey: ["artist-by-id", artistId, serviceIds.join(",")],
    queryFn: async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data: artist } = await supabase
        .from("artists")
        .select("id, slug, name, tagline, city, area, hero_image_url, avatar_url, base_price_paise, avg_rating, review_count, offers_at_home, offers_studio, verified, specialties, cancellation_policy")
        .eq("id", artistId)
        .maybeSingle();
      if (!artist) throw new Error("Artist not found");
      const { data: services } = await supabase.from("services").select("*").in("id", serviceIds);
      return { artist, services: services ?? [] };
    },
  });

  const [step, setStep] = useState<1 | 2>(1);
  const [slotId, setSlotId] = useState<string>("");
  const [selectedDay, setSelectedDay] = useState<string>("");
  const locationType = "studio" as const;
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const slotsByDay = useMemo(() => {
    const map = new Map<string, typeof slotData.slots>();
    for (const s of slotData.slots) {
      const d = new Date(s.starts_at).toISOString().slice(0, 10);
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(s);
    }
    return Array.from(map.entries()).slice(0, 45);
  }, [slotData.slots]);

  const selectedDaySlots = useMemo(() => slotsByDay.find(([day]) => day === selectedDay)?.[1] ?? [], [selectedDay, slotsByDay]);

  const total = (artistQuery.data?.services ?? []).reduce((sum, s) => sum + Number(s.price_paise), 0);
  const advanceAmount = Math.round(total * 0.5);
  const remainingAmount = total - advanceAmount;

  const bookMut = useMutation({
    mutationFn: async () => {
      setErr(null);
      const { bookingId } = await createBooking({
        data: {
          artistId,
          serviceIds,
          slotId,
          locationType,
          customerName: name,
          customerPhone: phone,
          notes: notes || undefined,
          isAdvance: true,
        },
      });
      return bookingId;
    },
    onSuccess: (id) => navigate({ to: `/booking/${id}/pay` as never }),
    onError: (e) => setErr(e instanceof Error ? e.message : "Failed"),
  });

  if (!artistQuery.data) return <div className="min-h-screen bg-background"><SiteHeader /><div className="p-8">Loading…</div></div>;
  const { artist, services } = artistQuery.data;
  const selectedSlot = slotData.slots.find((s) => s.id === slotId);

  const canProceed = !!slotId && !!name && !!phone;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-4 py-8">
        <ol className="mb-6 flex flex-wrap items-center gap-2 text-xs">
          {[
            { n: 1, label: "Date & details" },
            { n: 2, label: "Review deposit" },
            { n: 3, label: "Razorpay" },
          ].map((s, i) => {
            const active = (step === 1 && s.n <= 1) || (step === 2 && s.n <= 2);
            const done = (step === 2 && s.n < 2);
            return (
              <li key={s.n} className="flex items-center gap-2">
                <span className={`grid h-6 w-6 place-items-center rounded-full text-[10px] font-semibold ${done ? "bg-emerald-500 text-white" : active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {done ? "✓" : s.n}
                </span>
                <span className={active ? "font-medium" : "text-muted-foreground"}>{s.label}</span>
                {i < 2 && <span className="text-muted-foreground">›</span>}
              </li>
            );
          })}
        </ol>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div>
            <h1 className="font-serif text-3xl">Book {artist.name}</h1>
            <p className="text-muted-foreground">
              {services.length} service{services.length === 1 ? "" : "s"} ·{" "}
              <span className="inline-flex items-center gap-1 text-foreground">
                <Building2 className="h-3.5 w-3.5" />
                Studio service
              </span>
            </p>

            {step === 1 && (
              <div className="mt-6 space-y-6">
                <section className="rounded-xl border border-border bg-card p-4">
                  <h2 className="font-medium">Choose date</h2>
                  <p className="mt-1 text-xs text-muted-foreground">Every future date stays selectable until the artist reaches 10 bookings for that day.</p>
                  <div className="mt-3 grid max-h-72 gap-2 overflow-y-auto pr-2 sm:grid-cols-2 lg:grid-cols-3">
                    {slotsByDay.map(([day, slots]) => {
                      const best = slots.reduce((max, s) => Math.max(max, Number((s as any).remaining ?? 0)), 0);
                      const label = best <= 0 ? "Fully Booked" : best <= 3 ? "Limited Slots" : "Available";
                      return (
                        <button
                          key={day}
                          type="button"
                          disabled={best <= 0}
                          onClick={() => { setSelectedDay(day); setSlotId(""); }}
                          className={`rounded-lg border p-3 text-left transition disabled:opacity-55 ${selectedDay === day ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-accent"}`}
                        >
                          <span className="block text-sm font-medium">{formatDate(slots[0].starts_at)}</span>
                          <span className={`mt-1 block text-xs ${selectedDay === day ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{label} · {best} seats left</span>
                        </button>
                      );
                    })}
                  </div>
                  <h3 className="mt-5 text-sm font-medium">Choose time</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {!selectedDay && <p className="text-sm text-muted-foreground">Select a date to see this artist's working-hour slots.</p>}
                    {selectedDaySlots.filter((s) => (s as any).available).map((s) => {
                      const rem = Number((s as any).remaining ?? 10);
                      return (
                        <button key={s.id} type="button" onClick={() => setSlotId(s.id)} className={`rounded-md border px-3 py-2 text-sm transition ${slotId === s.id ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-accent"}`}>
                          {formatTime(s.starts_at)} <span className={slotId === s.id ? "text-primary-foreground/80" : "text-muted-foreground"}>· {rem} left</span>
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section className="rounded-xl border border-border bg-card p-4">
                  <h2 className="font-medium">Contact</h2>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <input required value={name} onChange={(e) => setName(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Your name" />
                    <input required value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Phone (WhatsApp)" />
                  </div>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Anything the artist should know? (allergies, theme, etc.)" rows={2} />
                </section>

                <button
                  onClick={() => setStep(2)}
                  disabled={!canProceed}
                  className="w-full rounded-md bg-primary py-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
                >
                  Review deposit →
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="mt-6 space-y-6">
                <section className="rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-500/5 via-transparent to-amber-500/5 p-6">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-amber-500">
                    <ShieldCheck className="h-4 w-4" /> Secure 50% deposit
                  </div>
                  <h2 className="mt-3 font-serif text-2xl">Reserve your slot with a 50% advance</h2>
                  <p className="mt-2 text-sm text-muted-foreground">Pay the remaining balance after your appointment. Cancellations follow the artist's policy below.</p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-border bg-card p-4">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Service price</div>
                      <div className="mt-1 text-xl font-semibold">{formatINR(total)}</div>
                    </div>
                    <div className="rounded-xl border border-primary bg-primary/5 p-4 ring-2 ring-primary/20">
                      <div className="text-[10px] uppercase tracking-wider text-primary">Pay now (50%)</div>
                      <div className="mt-1 text-xl font-semibold">{formatINR(advanceAmount)}</div>
                    </div>
                    <div className="rounded-xl border border-border bg-card p-4">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Due after service</div>
                      <div className="mt-1 text-xl font-semibold">{formatINR(remainingAmount)}</div>
                    </div>
                  </div>

                  <p className="mt-4 text-[11px] text-muted-foreground">{artist.cancellation_policy}</p>
                </section>

                {err && <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-600">{err}</div>}

                <div className="flex gap-2">
                  <button onClick={() => setStep(1)} className="rounded-md border border-border px-4 py-3 text-sm">← Back</button>
                  <button
                    onClick={() => bookMut.mutate()}
                    disabled={bookMut.isPending}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-gradient-to-r from-amber-500 to-amber-600 py-3 text-sm font-semibold text-black shadow-lg shadow-amber-500/20 disabled:opacity-50"
                  >
                    <Lock className="h-4 w-4" />
                    {bookMut.isPending ? "Opening Razorpay…" : `Proceed to Razorpay · ${formatINR(advanceAmount)}`}
                  </button>
                </div>
                <p className="text-center text-[11px] text-muted-foreground">You'll be redirected to a secure Razorpay-style payment page.</p>
              </div>
            )}
          </div>

          <aside className="lg:sticky lg:top-20 lg:self-start">
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-medium">Booking summary</h3>
              <div className="mt-3 space-y-2 text-sm">
                <Row label="Artist" value={artist.name} />
                <Row label="Mode" value={<span className="inline-flex items-center gap-1"><Building2 className="h-3 w-3" /> Studio</span>} />
                {selectedSlot && <Row label="When" value={`${formatDate(selectedSlot.starts_at)} · ${formatTime(selectedSlot.starts_at)}`} />}
                <Row label="Services" value={services.map((s) => s.title).join(", ") || "—"} />
              </div>
              <div className="my-3 h-px bg-border" />
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Service price</span><span>{formatINR(total)}</span></div>
                <div className="flex justify-between text-emerald-600"><span>Deposit (50%)</span><span>{formatINR(advanceAmount)}</span></div>
                <div className="flex justify-between text-muted-foreground"><span>Due after service</span><span>{formatINR(remainingAmount)}</span></div>
                <div className="flex justify-between border-t border-border pt-2 font-semibold"><span>Pay now</span><span className="text-lg">{formatINR(advanceAmount)}</span></div>
              </div>
              <p className="mt-3 text-[11px] text-muted-foreground">{artist.cancellation_policy}</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}
