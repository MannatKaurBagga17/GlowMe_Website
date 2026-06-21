import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useSuspenseQuery, queryOptions, useMutation, useQuery } from "@tanstack/react-query";
import { getArtistAvailability, createBooking, completeDemoPayment } from "@/lib/glowme.functions";
import { SiteHeader } from "@/components/site-header";
import { formatINR, formatDate, formatTime } from "@/lib/format";
import { z } from "zod";
import { CreditCard, Smartphone, Wallet, QrCode, Lock, CheckCircle2, Building2 } from "lucide-react";

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

type PayMethod = "upi" | "card" | "wallet" | "razorpay" | "paytm";
type UpiApp = "gpay" | "phonepe" | "manual";

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
        .select("id, slug, name, tagline, bio, city, area, hero_image_url, avatar_url, base_price_paise, avg_rating, review_count, offers_at_home, offers_studio, verified, specialties, years_experience, cancellation_policy, languages, service_radius_km")
        .eq("id", artistId)
        .maybeSingle();
      if (!artist) throw new Error("Artist not found");
      const { data: services } = await supabase.from("services").select("*").in("id", serviceIds);
      return { artist, services: services ?? [] };
    },
  });

  const [step, setStep] = useState<1 | 2>(1); // 1 = details, 2 = payment
  const [slotId, setSlotId] = useState<string>("");
  const [selectedDay, setSelectedDay] = useState<string>("");
  const locationType = "studio" as const;
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [isAdvance, setIsAdvance] = useState(true);

  // Payment state
  const [payMethod, setPayMethod] = useState<PayMethod>("upi");
  const [upiApp, setUpiApp] = useState<UpiApp>("gpay");
  const [upiId, setUpiId] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [payStatus, setPayStatus] = useState<"idle" | "processing" | "success" | "failed">("idle");
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
  const payAmount = isAdvance ? advanceAmount : total;
  const remainingAmount = isAdvance ? total - advanceAmount : 0;

  const bookMut = useMutation({
    mutationFn: async () => {
      setErr(null);
      setPayStatus("processing");
      // simulate gateway latency
      await new Promise((r) => setTimeout(r, 1400));
      const { bookingId } = await createBooking({
        data: {
          artistId,
          serviceIds,
          slotId,
          locationType,
          customerName: name,
          customerPhone: phone,
          notes: notes || undefined,
          isAdvance,
        },
      });
      await completeDemoPayment({ data: { bookingId } });
      setPayStatus("success");
      return bookingId;
    },
    onSuccess: (id) => setTimeout(() => navigate({ to: `/booking/${id}/confirm` as never }), 600),
    onError: (e) => {
      setPayStatus("failed");
      setErr(e instanceof Error ? e.message : "Failed");
    },
  });

  if (!artistQuery.data) return <div className="min-h-screen bg-background"><SiteHeader /><div className="p-8">Loading…</div></div>;
  const { artist, services } = artistQuery.data;
  const selectedSlot = slotData.slots.find((s) => s.id === slotId);

  const canProceed = !!slotId && !!name && !!phone;

  const formatCard = (v: string) => v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  const formatExpiry = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  };

  const cardValid =
    cardName.trim().length > 2 &&
    cardNumber.replace(/\s/g, "").length === 16 &&
    /^\d{2}\/\d{2}$/.test(cardExpiry) &&
    cardCvv.length >= 3;
  const upiValid = upiApp !== "manual" || /^[\w.\-]{2,}@[\w.\-]{2,}$/.test(upiId);
  const canPay = payMethod === "card" ? cardValid : payMethod === "upi" ? upiValid : true;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Stepper */}
        <ol className="mb-6 flex flex-wrap items-center gap-2 text-xs">
          {[
            { n: 1, label: "Date & time" },
            { n: 2, label: "Details" },
            { n: 3, label: "Payment" },
          ].map((s, i) => {
            const active = (step === 1 && s.n <= 2) || (step === 2 && s.n <= 3);
            const done = (step === 1 && s.n < 2) || (step === 2 && s.n < 3);
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
                {/* Date & slot */}
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

                {/* Contact */}
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
                  Continue to payment →
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="mt-6 space-y-6">
                {/* Pay full vs advance */}
                <section className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-50/40 to-transparent p-4 dark:from-amber-950/20">
                  <h2 className="font-medium">Payment plan</h2>
                  <div className="mt-3">
                    <div className="rounded-lg border border-primary ring-2 ring-primary/30 bg-primary/5 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs uppercase tracking-wider text-muted-foreground">Pay 50% advance</div>
                          <div className="mt-1 text-2xl font-semibold">{formatINR(advanceAmount)}</div>
                        </div>
                        <div className="text-right text-xs text-muted-foreground">
                          <div>Total {formatINR(total)}</div>
                          <div>Balance {formatINR(total - advanceAmount)} after service</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>


                {/* Payment method tabs */}
                <section className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-medium">Payment method</h2>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground"><Lock className="h-3 w-3" /> 256-bit SSL · PCI-DSS</span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {[
                      { id: "upi" as const, label: "UPI", icon: <Smartphone className="h-4 w-4" /> },
                      { id: "card" as const, label: "Card", icon: <CreditCard className="h-4 w-4" /> },
                      { id: "razorpay" as const, label: "Razorpay", icon: <Lock className="h-4 w-4" /> },
                    ].map((m) => (
                      <button key={m.id} type="button" onClick={() => setPayMethod(m.id)} className={`flex items-center justify-center gap-2 rounded-md border px-3 py-2.5 text-sm ${payMethod === m.id ? "border-primary bg-primary/5 font-medium" : "border-border hover:bg-accent"}`}>
                        {m.icon} {m.label}
                      </button>
                    ))}
                  </div>

                  {/* UPI */}
                  {payMethod === "upi" && (
                    <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_220px]">
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                          <button type="button" onClick={() => setUpiApp("gpay")} className={`flex flex-col items-center gap-1 rounded-md border p-2 ${upiApp === "gpay" ? "border-primary bg-primary/5" : "border-border"}`}>
                            <div className="grid h-9 w-9 place-items-center rounded-full bg-white text-xs font-bold text-blue-600 ring-1 ring-border">G</div>
                            <span className="text-xs">Google Pay</span>
                          </button>
                          <button type="button" onClick={() => setUpiApp("phonepe")} className={`flex flex-col items-center gap-1 rounded-md border p-2 ${upiApp === "phonepe" ? "border-primary bg-primary/5" : "border-border"}`}>
                            <div className="grid h-9 w-9 place-items-center rounded-full bg-purple-600 text-xs font-bold text-white">Pe</div>
                            <span className="text-xs">PhonePe</span>
                          </button>
                          <button type="button" onClick={() => setUpiApp("manual")} className={`flex flex-col items-center gap-1 rounded-md border p-2 ${upiApp === "manual" ? "border-primary bg-primary/5" : "border-border"}`}>
                            <div className="grid h-9 w-9 place-items-center rounded-full bg-zinc-900 text-xs font-bold text-amber-400">@</div>
                            <span className="text-xs">UPI ID</span>
                          </button>
                        </div>
                        {upiApp === "manual" && (
                          <input value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="yourname@upi" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                        )}
                        {upiApp !== "manual" && (
                          <p className="text-xs text-muted-foreground">You'll be redirected to {upiApp === "gpay" ? "Google Pay" : "PhonePe"} to confirm {formatINR(payAmount)}.</p>
                        )}
                      </div>
                      <div className="flex flex-col items-center gap-2 rounded-lg border border-border bg-white p-3">
                        <div className="flex items-center gap-1 text-xs text-zinc-700"><QrCode className="h-3 w-3" /> Scan to pay</div>
                        <img
                          alt="UPI QR"
                          className="h-40 w-40"
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=glowme@upi&pn=GlowMe&am=${(payAmount / 100).toFixed(2)}&cu=INR&tn=Booking-${artist.slug}`)}`}
                        />
                        <div className="text-sm font-semibold text-zinc-900">{formatINR(payAmount)}</div>
                      </div>
                    </div>
                  )}

                  {/* Card */}
                  {payMethod === "card" && (
                    <div className="mt-4 space-y-3">
                      <div className="rounded-xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-black p-5 text-white shadow-inner">
                        <div className="flex justify-between text-[10px] uppercase tracking-[0.3em] text-zinc-400"><span>GlowMe Pay</span><span>VISA</span></div>
                        <div className="mt-6 font-mono text-lg tracking-[0.2em]">{cardNumber || "•••• •••• •••• ••••"}</div>
                        <div className="mt-4 flex justify-between text-xs">
                          <div>
                            <div className="text-[9px] uppercase text-zinc-500">Holder</div>
                            <div className="mt-0.5">{cardName.toUpperCase() || "YOUR NAME"}</div>
                          </div>
                          <div>
                            <div className="text-[9px] uppercase text-zinc-500">Expires</div>
                            <div className="mt-0.5">{cardExpiry || "MM/YY"}</div>
                          </div>
                        </div>
                      </div>
                      <input value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="Cardholder name" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                      <input value={cardNumber} onChange={(e) => setCardNumber(formatCard(e.target.value))} inputMode="numeric" placeholder="1234 5678 9012 3456" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono tracking-wider" />
                      <div className="grid grid-cols-2 gap-2">
                        <input value={cardExpiry} onChange={(e) => setCardExpiry(formatExpiry(e.target.value))} placeholder="MM/YY" className="rounded-md border border-input bg-background px-3 py-2 text-sm" />
                        <input value={cardCvv} onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="CVV" type="password" className="rounded-md border border-input bg-background px-3 py-2 text-sm" />
                      </div>
                      {!cardValid && (cardNumber || cardName) && <p className="text-xs text-amber-600">Please complete the card details.</p>}
                    </div>
                  )}

                  {/* Wallet */}
                  {payMethod === "wallet" && (
                    <div className="mt-4 rounded-lg border border-border bg-gradient-to-br from-amber-50 to-transparent p-4 dark:from-amber-950/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs uppercase tracking-wider text-muted-foreground">GlowMe Wallet</div>
                          <div className="mt-1 text-2xl font-semibold">{formatINR(2500_00)}</div>
                          <div className="text-xs text-muted-foreground">Available balance (demo)</div>
                        </div>
                        <Wallet className="h-10 w-10 text-amber-500" />
                      </div>
                      <p className="mt-3 text-xs text-muted-foreground">{formatINR(payAmount)} will be debited from your wallet on confirmation.</p>
                    </div>
                  )}

                  {/* Razorpay */}
                  {payMethod === "razorpay" && (
                    <div className="mt-4 rounded-lg border border-border bg-gradient-to-br from-blue-50 to-transparent p-4 dark:from-blue-950/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs uppercase tracking-wider text-muted-foreground">Razorpay Checkout</div>
                          <div className="mt-1 text-lg font-semibold">Pay with cards, UPI, netbanking & wallets</div>
                          <div className="text-xs text-muted-foreground">Powered by Razorpay · 256-bit secure</div>
                        </div>
                        <Lock className="h-10 w-10 text-blue-500" />
                      </div>
                      <p className="mt-3 text-xs text-muted-foreground">On confirm, the Razorpay checkout will open to pay {formatINR(payAmount)}.</p>
                    </div>
                  )}

                  {/* Paytm */}
                  {payMethod === "paytm" && (
                    <div className="mt-4 rounded-lg border border-border bg-gradient-to-br from-cyan-50 to-transparent p-4 dark:from-cyan-950/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs uppercase tracking-wider text-muted-foreground">Paytm</div>
                          <div className="mt-1 text-lg font-semibold">Pay with Paytm wallet or UPI</div>
                          <div className="text-xs text-muted-foreground">You'll be redirected to Paytm to confirm.</div>
                        </div>
                        <Wallet className="h-10 w-10 text-cyan-500" />
                      </div>
                      <p className="mt-3 text-xs text-muted-foreground">{formatINR(payAmount)} will be charged on confirmation.</p>
                    </div>
                  )}
                </section>

                {/* Status banner */}
                {payStatus !== "idle" && (
                  <div className={`rounded-lg border p-3 text-sm ${payStatus === "success" ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700" : payStatus === "failed" ? "border-rose-500/40 bg-rose-500/10 text-rose-700" : "border-amber-500/40 bg-amber-500/10 text-amber-700"}`}>
                    {payStatus === "processing" && "Processing your payment…"}
                    {payStatus === "success" && <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Payment successful! Redirecting…</span>}
                    {payStatus === "failed" && (err ?? "Payment failed. Please try again.")}
                  </div>
                )}

                <div className="flex gap-2">
                  <button onClick={() => setStep(1)} className="rounded-md border border-border px-4 py-3 text-sm">← Back</button>
                  <button
                    onClick={() => bookMut.mutate()}
                    disabled={!canPay || bookMut.isPending || payStatus === "success"}
                    className="flex-1 rounded-md bg-gradient-to-r from-amber-500 to-amber-600 py-3 text-sm font-semibold text-black shadow-lg shadow-amber-500/20 disabled:opacity-50"
                  >
                    {bookMut.isPending ? "Processing…" : `Pay ${formatINR(payAmount)} securely`}
                  </button>
                </div>
                <p className="text-center text-[11px] text-muted-foreground">⚠ Demo mode: no real money is charged. Bookings are confirmed instantly.</p>
              </div>
            )}
          </div>

          {/* Sticky summary */}
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
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatINR(total)}</span></div>
                {isAdvance && (
                  <>
                    <div className="flex justify-between text-emerald-600"><span>Advance (50%)</span><span>{formatINR(advanceAmount)}</span></div>
                    <div className="flex justify-between text-muted-foreground"><span>Due after service</span><span>{formatINR(remainingAmount)}</span></div>
                  </>
                )}
                <div className="flex justify-between border-t border-border pt-2 font-semibold"><span>Pay now</span><span className="text-lg">{formatINR(payAmount)}</span></div>
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
