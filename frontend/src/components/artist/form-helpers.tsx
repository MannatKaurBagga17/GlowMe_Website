import { useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, Image as ImgIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

export async function uploadArtistFile(file: File, folder: "avatars" | "hero" | "portfolio") {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { toast.error("Sign in required"); return null; }
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${user.id}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("artist-media").upload(path, file, { upsert: true });
  if (error) { toast.error(error.message); return null; }
  const { data: pub } = supabase.storage.from("artist-media").getPublicUrl(path);
  return pub.publicUrl;
}

export function ImageUpload({ label, url, onChange, folder }: {
  label: string; url: string; onChange: (u: string) => void;
  folder: "avatars" | "hero" | "portfolio";
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-3">
        {url ? <img src={url} alt="" className="h-20 w-20 rounded-lg object-cover" /> :
          <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground">
            <ImgIcon className="h-6 w-6" />
          </div>}
        <div className="flex flex-col gap-2">
          <Button size="sm" variant="outline" type="button" onClick={() => ref.current?.click()} disabled={busy}>
            <Upload className="mr-1.5 h-4 w-4" />{busy ? "Uploading…" : "Upload"}
          </Button>
          {url && <Button size="sm" variant="ghost" type="button" onClick={() => onChange("")}>Remove</Button>}
        </div>
        <input ref={ref} type="file" accept="image/*" className="hidden" onChange={async (e) => {
          const f = e.target.files?.[0]; if (!f) return;
          setBusy(true); const u = await uploadArtistFile(f, folder); setBusy(false);
          if (u) onChange(u);
          if (ref.current) ref.current.value = "";
        }} />
      </div>
    </div>
  );
}
