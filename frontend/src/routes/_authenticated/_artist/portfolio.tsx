import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ArtistShell } from "@/components/artist/artist-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Image as ImgIcon, Video, Trash2 } from "lucide-react";
import { getMyArtist, addPortfolio, deletePortfolio } from "@/lib/artist-dashboard.functions";
import { uploadArtistFile } from "@/components/artist/form-helpers";

export const Route = createFileRoute("/_authenticated/_artist/portfolio")({
  component: PortfolioPage,
});

function PortfolioPage() {
  const qc = useQueryClient();
  const fetchMine = useServerFn(getMyArtist);
  const addPf = useServerFn(addPortfolio);
  const delPf = useServerFn(deletePortfolio);
  const { data } = useQuery({ queryKey: ["my-artist"], queryFn: () => fetchMine() });
  const items = data?.portfolio ?? [];
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleAdd(file: File) {
    setBusy(true);
    const url = await uploadArtistFile(file, "portfolio");
    if (url) {
      try {
        await addPf({ data: { kind: file.type.startsWith("video/") ? "video" : "photo", url, caption: null, sort_order: items.length } });
        toast.success("Added");
        qc.invalidateQueries({ queryKey: ["my-artist"] });
      } catch (e: any) { toast.error(e?.message ?? "Failed"); }
    }
    setBusy(false);
    if (ref.current) ref.current.value = "";
  }

  return (
    <ArtistShell title="Portfolio">
      <Card className="space-y-4 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Portfolio ({items.length})</h2>
          <Button size="sm" onClick={() => ref.current?.click()} disabled={busy}>
            <Upload className="mr-1 h-4 w-4" />{busy ? "Uploading…" : "Add photo / video"}
          </Button>
          <input ref={ref} type="file" accept="image/*,video/*" className="hidden" onChange={(e) => {
            const f = e.target.files?.[0]; if (f) handleAdd(f);
          }} />
        </div>
        {items.length === 0 && <p className="text-sm text-muted-foreground">No items yet.</p>}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {items.map((it: any) => (
            <div key={it.id} className="group relative overflow-hidden rounded-lg border border-border">
              {it.kind === "video"
                ? <video src={it.url} className="aspect-square w-full object-cover" muted playsInline />
                : <img src={it.url} alt={it.caption ?? ""} className="aspect-square w-full object-cover" />}
              <div className="absolute left-2 top-2 rounded bg-background/80 px-1.5 py-0.5 text-[10px] uppercase">
                {it.kind === "video" ? <Video className="inline h-3 w-3" /> : <ImgIcon className="inline h-3 w-3" />}
              </div>
              <button onClick={async () => {
                if (!confirm("Delete?")) return;
                await delPf({ data: { id: it.id } });
                toast.success("Removed");
                qc.invalidateQueries({ queryKey: ["my-artist"] });
              }} className="absolute right-2 top-2 rounded bg-destructive/90 p-1 text-destructive-foreground opacity-0 transition group-hover:opacity-100">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </Card>
    </ArtistShell>
  );
}
