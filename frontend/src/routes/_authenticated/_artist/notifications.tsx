import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ArtistShell } from "@/components/artist/artist-shell";
import { Card } from "@/components/ui/card";
import { Bell } from "lucide-react";
import { listRecentActivity } from "@/lib/artist-workspace.functions";

export const Route = createFileRoute("/_authenticated/_artist/notifications")({
  component: NotificationsPage,
});

function NotificationsPage() {
  const fetchAct = useServerFn(listRecentActivity);
  const { data } = useQuery({ queryKey: ["artist-activity"], queryFn: () => fetchAct() });
  const items = data?.items ?? [];

  return (
    <ArtistShell title="Notifications">
      <Card className="p-5">
        {items.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <Bell className="mx-auto h-8 w-8" />
            <p className="mt-2">No notifications yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((i: any) => (
              <li key={`${i.kind}-${i.id}`} className="py-3">
                <div className="text-sm">{i.text}</div>
                <div className="text-xs text-muted-foreground">{new Date(i.at).toLocaleString()}</div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </ArtistShell>
  );
}
