import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, User, Heart, Calendar, MessageCircle, Search } from "lucide-react";

export function SiteHeader() {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setSignedIn(!!session));
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link to="/search" className="flex items-center gap-2 font-serif text-xl tracking-wide">
          <Sparkles className="h-5 w-5 text-primary" />
          <span>GlowMe</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm md:flex">
          <Link to="/search" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground" activeProps={{ className: "text-foreground" }}>
            <Search className="h-4 w-4" /> Discover
          </Link>
          {signedIn && (
            <>
              <Link to="/account" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground" activeProps={{ className: "text-foreground" }}>
                <Calendar className="h-4 w-4" /> Bookings
              </Link>
              <Link to="/favourites" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground" activeProps={{ className: "text-foreground" }}>
                <Heart className="h-4 w-4" /> Saved
              </Link>
              <Link to="/support" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground" activeProps={{ className: "text-foreground" }}>
                <MessageCircle className="h-4 w-4" /> Support
              </Link>
            </>
          )}
        </nav>
        <div className="flex items-center gap-2">
          {signedIn ? (
            <Link to="/account" className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-sm hover:bg-accent">
              <User className="h-4 w-4" /> Account
            </Link>
          ) : (
            <Link to="/auth" className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
