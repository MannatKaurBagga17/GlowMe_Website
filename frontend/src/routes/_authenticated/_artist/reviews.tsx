import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArtistShell } from "@/components/artist/artist-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { listMyReviews, replyToReview } from "@/lib/artist-workspace.functions";

export const Route = createFileRoute("/_authenticated/_artist/reviews")({
  component: ReviewsPage,
});

function ReviewsPage() {
  const qc = useQueryClient();
  const fetchReviews = useServerFn(listMyReviews);
  const reply = useServerFn(replyToReview);
  const { data } = useQuery({ queryKey: ["my-reviews"], queryFn: () => fetchReviews() });
  const reviews = data?.reviews ?? [];
  const [replyingFor, setReplyingFor] = useState<string | null>(null);
  const [text, setText] = useState("");

  const mut = useMutation({
    mutationFn: (id: string) => reply({ data: { id, response: text } }),
    onSuccess: () => { toast.success("Reply posted"); setReplyingFor(null); setText(""); qc.invalidateQueries({ queryKey: ["my-reviews"] }); },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  return (
    <ArtistShell title="Reviews & Ratings">
      <div className="space-y-3">
        {reviews.length === 0 && <Card className="p-5 text-muted-foreground">No reviews yet.</Card>}
        {reviews.map((r: any) => (
          <Card key={r.id} className="p-4 space-y-2">
            <div className="flex items-center gap-2">
              {[1,2,3,4,5].map(n => <Star key={n} className={`h-4 w-4 ${n <= r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />)}
              <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
            </div>
            {r.title && <div className="font-medium">{r.title}</div>}
            {r.body && <p className="text-sm text-muted-foreground">{r.body}</p>}
            {r.artist_reply && <div className="mt-2 rounded-md border-l-2 border-primary bg-muted/30 p-2 text-sm"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your reply</span><div>{r.artist_reply}</div></div>}
            {!r.artist_reply && replyingFor !== r.id && (
              <Button size="sm" variant="outline" onClick={() => { setReplyingFor(r.id); setText(""); }}>Reply</Button>
            )}
            {replyingFor === r.id && (
              <div className="space-y-2">
                <Textarea rows={2} value={text} onChange={e => setText(e.target.value)} placeholder="Thank you for your feedback…" />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => mut.mutate(r.id)} disabled={!text || mut.isPending}>Post reply</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setReplyingFor(null); setText(""); }}>Cancel</Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </ArtistShell>
  );
}
