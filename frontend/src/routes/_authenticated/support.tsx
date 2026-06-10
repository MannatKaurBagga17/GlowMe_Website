import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useSuspenseQuery, queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listSupportThreads, createSupportThread, getSupportThread, replySupportThread } from "@/lib/glowme.functions";
import { SiteHeader } from "@/components/site-header";
import { MessageCircle, Phone } from "lucide-react";

const threadsQO = queryOptions({ queryKey: ["support-threads"], queryFn: () => listSupportThreads() });

export const Route = createFileRoute("/_authenticated/support")({
  head: () => ({ meta: [{ title: "Support — GlowMe" }] }),
  loader: ({ context }) => { context.queryClient.ensureQueryData(threadsQO); },
  errorComponent: ({ error }) => <div className="p-8 text-destructive">{String(error?.message ?? error)}</div>,
  notFoundComponent: () => <div className="p-8">Not found</div>,
  component: Support,
});

function Support() {
  const { data } = useSuspenseQuery(threadsQO);
  const qc = useQueryClient();
  const [active, setActive] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const createMut = useMutation({
    mutationFn: () => createSupportThread({ data: { subject, message } }),
    onSuccess: ({ threadId }) => {
      setSubject(""); setMessage("");
      qc.invalidateQueries({ queryKey: ["support-threads"] });
      setActive(threadId);
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="font-serif text-3xl">Support</h1>
        <p className="mt-1 text-muted-foreground">Chat with us in-app, or reach out on WhatsApp/phone.</p>

        <div className="mt-4 flex flex-wrap gap-2">
          <a href="https://wa.me/919999999999" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm"><MessageCircle className="h-4 w-4 text-emerald-600" /> WhatsApp</a>
          <a href="tel:+919999999999" className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm"><Phone className="h-4 w-4" /> Call</a>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-2">
            <div className="rounded-xl border border-border bg-card p-3">
              <h3 className="text-sm font-medium">Start a new chat</h3>
              <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject" className="mt-2 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm" />
              <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="How can we help?" rows={3} className="mt-2 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm" />
              <button onClick={() => createMut.mutate()} disabled={!subject || !message || createMut.isPending} className="mt-2 w-full rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-50">Send</button>
            </div>
            <h3 className="px-1 pt-3 text-xs uppercase tracking-wide text-muted-foreground">Your chats</h3>
            {data.threads.length === 0 && <p className="px-1 text-sm text-muted-foreground">No chats yet.</p>}
            {data.threads.map((t: any) => (
              <button key={t.id} onClick={() => setActive(t.id)} className={`block w-full rounded-md border border-border px-3 py-2 text-left text-sm ${active === t.id ? "bg-accent" : ""}`}>
                <div className="font-medium">{t.subject}</div>
                <div className="text-xs text-muted-foreground">{t.status}</div>
              </button>
            ))}
          </aside>
          <div>{active ? <Thread id={active} /> : <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">Pick a chat or start a new one.</div>}</div>
        </div>
      </div>
    </div>
  );
}

function Thread({ id }: { id: string }) {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["support-thread", id], queryFn: () => getSupportThread({ data: { id } }), refetchInterval: 5000 });
  const [body, setBody] = useState("");
  const reply = useMutation({
    mutationFn: () => replySupportThread({ data: { threadId: id, body } }),
    onSuccess: () => { setBody(""); qc.invalidateQueries({ queryKey: ["support-thread", id] }); },
  });
  return (
    <div className="flex h-[60vh] flex-col rounded-xl border border-border bg-card">
      <div className="border-b border-border p-3 font-medium">{data?.thread?.subject}</div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {(data?.messages ?? []).map((m: any) => (
          <div key={m.id} className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${m.is_staff ? "bg-secondary" : "ml-auto bg-primary text-primary-foreground"}`}>{m.body}</div>
        ))}
      </div>
      <div className="flex gap-2 border-t border-border p-3">
        <input value={body} onChange={e => setBody(e.target.value)} placeholder="Type a message" className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm" />
        <button onClick={() => reply.mutate()} disabled={!body || reply.isPending} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50">Send</button>
      </div>
    </div>
  );
}
