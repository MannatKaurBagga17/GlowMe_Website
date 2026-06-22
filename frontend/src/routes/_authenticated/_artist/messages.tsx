import { createFileRoute } from "@tanstack/react-router";
import { ArtistShell } from "@/components/artist/artist-shell";
import { Card } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

export const Route = createFileRoute("/_authenticated/_artist/messages")({
  component: MessagesPage,
});

function MessagesPage() {
  return (
    <ArtistShell title="Messages">
      <Card className="p-8 text-center">
        <MessageSquare className="mx-auto h-10 w-10 text-muted-foreground" />
        <h2 className="mt-3 font-serif text-2xl">Customer messaging</h2>
        <p className="mt-2 text-muted-foreground">Direct messaging with customers is coming soon. For now, customer contact details appear with each booking.</p>
      </Card>
    </ArtistShell>
  );
}
