import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useSuspenseQuery, queryOptions, useMutation } from "@tanstack/react-query";
import { getBooking, completeDemoPayment } from "@/lib/glowme.functions";
import { formatINR } from "@/lib/format";
import { CreditCard, Smartphone, Building2, Wallet, Clock, Lock, ShieldCheck, ChevronRight, ArrowLeft, QrCode, CheckCircle2 } from "lucide-react";

const bookingQO = (id: string) => queryOptions({ queryKey: ["booking", id], queryFn: () => getBooking({ data: { id } }) });

export const Route = createFileRoute("/_authenticated/_customer/booking/$id/pay")({
  head: () => ({ meta: [{ title: "Secure payment — GlowMe" }] }),
  loader: ({ params, context }) => { context.queryClient.ensureQueryData(bookingQO(params.id)); },
  errorComponent: ({ error }) => <div className="p-8 text-destructive">{String(error?.message ?? error)}</div>,
  notFoundComponent: () => <div className="p-8">Not found</div>,
  component: PayPage,
});

type Method = "card" | "upi" | "netbanking" | "wallet" | "paylater";
type UpiView = "list" | "qr";

const METHODS: { id: Method; label: string; sub: string; icon: React.ReactNode }[] = [
  { id: "card", label: "Card", sub: "Visa, MasterCard, RuPay, Maestro", icon: <CreditCard className="h-5 w-5" /> },
  { id: "upi", label: "UPI", sub: "Google Pay, PhonePe, Paytm, BHIM", icon: <Smartphone className="h-5 w-5" /> },
  { id: "netbanking", label: "Net Banking", sub: "All major Indian banks", icon: <Building2 className="h-5 w-5" /> },
  { id: "wallet", label: "Wallet", sub: "Paytm, Amazon Pay, Mobikwik, Freecharge", icon: <Wallet className="h-5 w-5" /> },
  { id: "paylater", label: "Pay Later", sub: "LazyPay, Simpl, ICICI PayLater", icon: <Clock className="h-5 w-5" /> },
];

const UPI_APPS = [
  { id: "gpay", label: "Google Pay", color: "#4285F4", letter: "G" },
  { id: "phonepe", label: "PhonePe", color: "#5F259F", letter: "Pe" },
  { id: "paytm", label: "Paytm", color: "#00BAF2", letter: "Pa" },
  { id: "bhim", label: "BHIM", color: "#F58220", letter: "B" },
  { id: "other", label: "Other UPI", color: "#C9A96E", letter: "@" },
];

const BANKS = ["HDFC Bank", "State Bank of India", "ICICI Bank", "Axis Bank", "Kotak Mahindra", "Yes Bank"];
const WALLETS = ["Paytm", "Amazon Pay", "Mobikwik", "Freecharge", "Airtel Money"];
const PAYLATER = ["LazyPay", "Simpl", "ICICI PayLater", "Ola Postpaid"];

function PayPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data } = useSuspenseQuery(bookingQO(id));
  const b = data.booking;

  const [method, setMethod] = useState<Method>("card");
  const [upiView, setUpiView] = useState<UpiView>("list");
  const [selectedUpi, setSelectedUpi] = useState<string | null>(null);
  const [upiId, setUpiId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [bank, setBank] = useState(BANKS[0]);
  const [wallet, setWallet] = useState(WALLETS[0]);
  const [later, setLater] = useState(PAYLATER[0]);

  const payMut = useMutation({
    mutationFn: async () => {
      await new Promise((r) => setTimeout(r, 1400));
      await completeDemoPayment({ data: { bookingId: id } });
    },
    onSuccess: () => setTimeout(() => navigate({ to: `/booking/${id}/confirm` as never }), 700),
  });

  if (!b) return <div className="min-h-screen bg-[#0a0a0a] p-8 text-zinc-200">Booking not found.</div>;

  const amountPaise = Math.round(Number(b.total_paise) * 0.5);
  const fmtCard = (v: string) => v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  const fmtExp = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  };

  const cardValid = cardName.trim().length > 2 && cardNumber.replace(/\s/g, "").length >= 12 && /^\d{2}\/\d{2}$/.test(cardExpiry) && cardCvv.length >= 3;
  const upiValid = method !== "upi" || (selectedUpi && selectedUpi !== "other") || /^[\w.\-]{2,}@[\w.\-]{2,}$/.test(upiId);
  const canPay =
    payMut.isPending || payMut.isSuccess
      ? false
      : method === "card"
        ? cardValid
        : method === "upi"
          ? !!upiValid
          : true;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#111010] to-[#0a0a0a] text-zinc-100">
      {/* Razorpay-style top bar */}
      <header className="border-b border-amber-500/15 bg-[#080808]/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <button onClick={() => navigate({ to: "/me" as never })} className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-amber-400">
            <ArrowLeft className="h-3.5 w-3.5" /> Cancel
          </button>
          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-md bg-gradient-to-br from-amber-400 to-amber-600 text-xs font-bold text-black">R</div>
            <div className="text-sm font-semibold tracking-wide">
              Razor<span className="text-amber-400">pay</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-zinc-500">
            <Lock className="h-3 w-3" /> Secure
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-6">
        {/* Merchant / amount panel */}
        <div className="rounded-2xl border border-amber-500/25 bg-gradient-to-br from-[#161311] to-[#0c0b0a] p-5 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.7)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.28em] text-amber-400/80">Paying to</div>
              <div className="mt-1 font-serif text-xl">GlowMe · {b.artists?.name}</div>
              <div className="mt-1 text-xs text-zinc-400">Booking deposit · 50% advance</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-[0.28em] text-zinc-500">Amount</div>
              <div className="mt-1 font-serif text-3xl text-amber-300">{formatINR(amountPaise)}</div>
              <div className="text-[10px] text-zinc-500">of {formatINR(b.total_paise)} total</div>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[280px_1fr]">
          {/* Method list — NO QR here */}
          <aside className="rounded-2xl border border-zinc-800 bg-[#0e0d0c] p-2">
            <div className="px-3 py-2 text-[10px] uppercase tracking-[0.22em] text-zinc-500">Payment methods</div>
            <ul className="space-y-1">
              {METHODS.map((m) => {
                const active = method === m.id;
                return (
                  <li key={m.id}>
                    <button
                      onClick={() => { setMethod(m.id); setUpiView("list"); }}
                      className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-3 text-left transition ${active ? "bg-amber-500/10 ring-1 ring-amber-500/40" : "hover:bg-zinc-900"}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`grid h-9 w-9 place-items-center rounded-lg ${active ? "bg-amber-500/20 text-amber-300" : "bg-zinc-900 text-zinc-400"}`}>{m.icon}</span>
                        <div>
                          <div className="text-sm font-medium">{m.label}</div>
                          <div className="text-[10px] text-zinc-500">{m.sub}</div>
                        </div>
                      </div>
                      <ChevronRight className={`h-4 w-4 ${active ? "text-amber-400" : "text-zinc-600"}`} />
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          {/* Method body */}
          <section className="rounded-2xl border border-zinc-800 bg-[#0e0d0c] p-5">
            {method === "card" && (
              <div>
                <h3 className="text-sm font-semibold">Card details</h3>
                <p className="mt-1 text-xs text-zinc-500">We accept Visa, MasterCard, RuPay and Maestro.</p>
                <div className="mt-4 flex flex-wrap gap-2 text-[10px] uppercase tracking-wider">
                  {["Visa", "MasterCard", "RuPay", "Maestro"].map((n) => (
                    <span key={n} className="rounded-md border border-amber-500/30 px-2 py-1 text-amber-300/90">{n}</span>
                  ))}
                </div>
                <div className="mt-5 space-y-3">
                  <input value={cardNumber} onChange={(e) => setCardNumber(fmtCard(e.target.value))} inputMode="numeric" placeholder="Card number" className="w-full rounded-lg border border-zinc-800 bg-black/40 px-4 py-3 text-sm font-mono tracking-wider outline-none focus:border-amber-500/60" />
                  <input value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="Name on card" className="w-full rounded-lg border border-zinc-800 bg-black/40 px-4 py-3 text-sm outline-none focus:border-amber-500/60" />
                  <div className="grid grid-cols-2 gap-3">
                    <input value={cardExpiry} onChange={(e) => setCardExpiry(fmtExp(e.target.value))} placeholder="MM/YY" className="rounded-lg border border-zinc-800 bg-black/40 px-4 py-3 text-sm outline-none focus:border-amber-500/60" />
                    <input value={cardCvv} onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="CVV" type="password" className="rounded-lg border border-zinc-800 bg-black/40 px-4 py-3 text-sm outline-none focus:border-amber-500/60" />
                  </div>
                </div>
              </div>
            )}

            {method === "upi" && upiView === "list" && (
              <div>
                <h3 className="text-sm font-semibold">Choose a UPI app</h3>
                <p className="mt-1 text-xs text-zinc-500">Pay instantly from your bank account.</p>
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {UPI_APPS.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => setSelectedUpi(u.id)}
                      className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${selectedUpi === u.id ? "border-amber-500/60 bg-amber-500/10" : "border-zinc-800 hover:bg-zinc-900"}`}
                    >
                      <span className="grid h-9 w-9 place-items-center rounded-full text-xs font-bold text-white" style={{ background: u.color }}>{u.letter}</span>
                      <span className="text-sm">{u.label}</span>
                    </button>
                  ))}
                </div>
                {selectedUpi === "other" && (
                  <input value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="yourname@upi" className="mt-3 w-full rounded-lg border border-zinc-800 bg-black/40 px-4 py-3 text-sm outline-none focus:border-amber-500/60" />
                )}
                <button
                  onClick={() => setUpiView("qr")}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg border border-amber-500/40 px-3 py-2 text-xs text-amber-300 hover:bg-amber-500/10"
                >
                  <QrCode className="h-3.5 w-3.5" /> Pay using QR instead
                </button>
              </div>
            )}

            {method === "upi" && upiView === "qr" && (
              <div>
                <button onClick={() => setUpiView("list")} className="mb-3 inline-flex items-center gap-1 text-xs text-amber-400 hover:underline">
                  <ArrowLeft className="h-3 w-3" /> Back to UPI apps
                </button>
                <h3 className="text-sm font-semibold">Scan QR with any UPI app</h3>
                <p className="mt-1 text-xs text-zinc-500">QR integration coming soon. Reserved space below.</p>
                <div className="mt-4 grid place-items-center rounded-2xl border border-dashed border-amber-500/30 bg-black/40 p-8">
                  <div className="flex h-56 w-56 flex-col items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-600">
                    <QrCode className="h-10 w-10" />
                    <span className="text-[10px] uppercase tracking-[0.2em]">QR placeholder</span>
                  </div>
                  <div className="mt-3 text-xs text-zinc-500">Amount: <span className="text-amber-300">{formatINR(amountPaise)}</span></div>
                </div>
              </div>
            )}

            {method === "netbanking" && (
              <div>
                <h3 className="text-sm font-semibold">Select your bank</h3>
                <p className="mt-1 text-xs text-zinc-500">You'll be redirected to your bank's secure login.</p>
                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {BANKS.map((bk) => (
                    <button key={bk} onClick={() => setBank(bk)} className={`rounded-lg border px-4 py-3 text-left text-sm transition ${bank === bk ? "border-amber-500/60 bg-amber-500/10" : "border-zinc-800 hover:bg-zinc-900"}`}>
                      {bk}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {method === "wallet" && (
              <div>
                <h3 className="text-sm font-semibold">Choose wallet</h3>
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {WALLETS.map((w) => (
                    <button key={w} onClick={() => setWallet(w)} className={`rounded-lg border px-3 py-3 text-sm transition ${wallet === w ? "border-amber-500/60 bg-amber-500/10" : "border-zinc-800 hover:bg-zinc-900"}`}>
                      {w}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {method === "paylater" && (
              <div>
                <h3 className="text-sm font-semibold">Pay later providers</h3>
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {PAYLATER.map((p) => (
                    <button key={p} onClick={() => setLater(p)} className={`rounded-lg border px-3 py-3 text-sm transition ${later === p ? "border-amber-500/60 bg-amber-500/10" : "border-zinc-800 hover:bg-zinc-900"}`}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => payMut.mutate()}
              disabled={!canPay}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-600 px-5 py-3.5 text-sm font-semibold text-black shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              {payMut.isSuccess ? (
                <><CheckCircle2 className="h-4 w-4" /> Payment successful · Redirecting…</>
              ) : payMut.isPending ? (
                "Processing payment…"
              ) : (
                <><Lock className="h-4 w-4" /> Pay {formatINR(amountPaise)} securely</>
              )}
            </button>

            <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-zinc-500">
              <ShieldCheck className="h-3 w-3 text-amber-400" /> 256-bit SSL · PCI-DSS · Demo gateway, no real money charged
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
