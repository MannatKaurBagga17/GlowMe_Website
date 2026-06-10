import { Home, Building2, MapPin, X } from "lucide-react";
import { useState } from "react";

export type ServiceMode = "at_home" | "studio";

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (mode: ServiceMode) => void;
  artistName: string;
  studioAddress?: string | null;
  offersAtHome?: boolean;
  offersStudio?: boolean;
}

export function ServiceModeModal({ open, onClose, onSelect, artistName, studioAddress, offersAtHome = true, offersStudio = true }: Props) {
  const [picked, setPicked] = useState<ServiceMode | null>(null);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-2xl rounded-2xl border border-amber-500/30 bg-gradient-to-b from-zinc-950 to-black p-6 shadow-[0_20px_80px_rgba(212,175,55,0.15)] sm:p-8" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 rounded-full p-1.5 text-zinc-400 hover:bg-white/5 hover:text-white"><X className="h-5 w-5" /></button>
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-amber-400">Step 1 of 4</p>
          <h2 className="mt-2 font-serif text-3xl text-white">Choose your service mode</h2>
          <p className="mt-1 text-sm text-zinc-400">How would you like to be pampered by <span className="text-amber-300">{artistName}</span>?</p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            disabled={!offersAtHome}
            onClick={() => setPicked("at_home")}
            className={`group rounded-xl border p-5 text-left transition disabled:cursor-not-allowed disabled:opacity-40 ${picked === "at_home" ? "border-amber-400 bg-amber-500/10 ring-2 ring-amber-400/40" : "border-zinc-800 bg-zinc-900/40 hover:border-amber-500/50"}`}
          >
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-black">
                <Home className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-white">🏠 Home Service</h3>
                <p className="text-xs text-zinc-400">Artist comes to you</p>
              </div>
            </div>
            <ul className="mt-4 space-y-1 text-xs text-zinc-400">
              <li>· Relax in your own space</li>
              <li>· Perfect for bridal & groups</li>
              <li>· Provide your address at next step</li>
            </ul>
            {!offersAtHome && <p className="mt-2 text-xs text-rose-400">Not offered by this artist</p>}
          </button>

          <button
            type="button"
            disabled={!offersStudio}
            onClick={() => setPicked("studio")}
            className={`group rounded-xl border p-5 text-left transition disabled:cursor-not-allowed disabled:opacity-40 ${picked === "studio" ? "border-amber-400 bg-amber-500/10 ring-2 ring-amber-400/40" : "border-zinc-800 bg-zinc-900/40 hover:border-amber-500/50"}`}
          >
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-black">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-white">🏢 Studio Service</h3>
                <p className="text-xs text-zinc-400">Visit the artist's studio</p>
              </div>
            </div>
            <ul className="mt-4 space-y-1 text-xs text-zinc-400">
              <li>· Pro lighting & equipment</li>
              <li>· Curated luxury setting</li>
              {studioAddress && (
                <li className="flex items-start gap-1 pt-1 text-zinc-300"><MapPin className="mt-0.5 h-3 w-3 text-amber-400" /> {studioAddress}</li>
              )}
            </ul>
            {!offersStudio && <p className="mt-2 text-xs text-rose-400">Not offered by this artist</p>}
          </button>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <p className="text-xs text-zinc-500">Selection is required to proceed.</p>
          <button
            disabled={!picked}
            onClick={() => picked && onSelect(picked)}
            className="rounded-full bg-gradient-to-r from-amber-400 to-amber-600 px-6 py-2.5 text-sm font-semibold text-black shadow-lg shadow-amber-500/20 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Continue to date & time →
          </button>
        </div>
      </div>
    </div>
  );
}
