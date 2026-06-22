import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { getMyArtist } from "@/lib/artist-dashboard.functions";
import {
  User,
  Heart,
  Calendar,
  MessageCircle,
  Search,
  LayoutDashboard,
  Mail,
  Settings,
  LogOut,
  UserCircle2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { User as SupabaseUser } from "@supabase/supabase-js";

function initialOf(u: SupabaseUser | null): string {
  const email = u?.email || "";
  return email.trim().charAt(0).toUpperCase() || "G";
}

function displayName(u: SupabaseUser | null): string {
  return (
    (u?.user_metadata?.full_name as string | undefined) ||
    (u?.user_metadata?.name as string | undefined) ||
    (u?.email ? u.email.split("@")[0] : "") ||
    "Guest"
  );
}

function GmailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V7.636l-6.545 5-6.545-5v13.364H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-1.164 1.348-1.822 2.268-1.116L12 10.545l9.732-6.204c.92-.706 2.268-.048 2.268 1.116z" />
    </svg>
  );
}

export function SiteHeader() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      setUser(session?.user ?? null),
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  const signedIn = !!user;
  const fetchMine = useServerFn(getMyArtist);
  const { data: mine } = useQuery({
    queryKey: ["my-artist-header"],
    queryFn: () => fetchMine(),
    enabled: signedIn,
    staleTime: 60_000,
  });
  const isArtist = !!mine?.artist;

  async function handleSignOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  async function handleGoogleSignIn() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      console.error("Google sign-in error:", result.error);
    }
    if (result.redirected) {
      return;
    }
  }

  return (
    <header className="gm-header">
      <style>{`
        .gm-header{
          --gold:#C9A96E;--cream:#F5F0E8;--muted:#8A7D70;
          position:sticky;top:0;z-index:40;
          background:rgba(8,8,8,0.85);backdrop-filter:blur(14px);
          border-bottom:0.5px solid rgba(201,169,110,0.18);
          font-family:'Jost',sans-serif;font-weight:300;
        }
        .gm-header-inner{max-width:1280px;margin:0 auto;padding:18px 24px;display:flex;align-items:center;justify-content:space-between;gap:24px;}
        .gm-brand{font-family:'Playfair Display',serif;font-size:24px;font-weight:700;letter-spacing:0.06em;color:var(--cream);text-decoration:none;}
        .gm-brand em{font-style:italic;color:var(--gold);font-weight:700;}
        .gm-nav{display:none;align-items:center;gap:28px;}
        @media(min-width:780px){.gm-nav{display:flex;}}
        .gm-nav a{display:inline-flex;align-items:center;gap:6px;color:rgba(245,240,232,0.6);text-decoration:none;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;transition:color .25s;}
        .gm-nav a:hover{color:var(--gold);}
        .gm-actions{display:flex;align-items:center;gap:14px;}
        .gm-heart{display:inline-flex;align-items:center;justify-content:center;width:38px;height:38px;border:0.5px solid rgba(201,169,110,0.4);color:var(--gold);text-decoration:none;transition:all .3s;border-radius:50%;}
        .gm-heart:hover{background:var(--gold);color:#080808;}
        .gm-cta{display:inline-flex;align-items:center;gap:8px;background:var(--gold);color:#080808;padding:10px 20px;font-size:10px;font-weight:500;letter-spacing:0.22em;text-transform:uppercase;text-decoration:none;transition:all .3s;}
        .gm-cta:hover{background:#E8D5A3;}
        .gm-gmail-btn{display:inline-flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:50%;border:0.5px solid rgba(201,169,110,0.4);background:rgba(8,8,8,0.6);color:var(--gold);cursor:pointer;transition:all .3s;}
        .gm-gmail-btn:hover{background:var(--gold);color:#080808;}
        .gm-avatar-btn{
          position:relative;display:inline-flex;align-items:center;justify-content:center;
          width:40px;height:40px;border-radius:50%;
          background:linear-gradient(135deg,#1A1714,#080808);
          color:var(--gold);font-family:'Playfair Display',serif;font-size:16px;font-weight:600;letter-spacing:0;
          border:1px solid rgba(201,169,110,0.55);
          box-shadow:0 0 0 1px rgba(201,169,110,0.15) inset, 0 4px 18px -4px rgba(201,169,110,0.35);
          cursor:pointer;transition:all .25s;outline:none;
        }
        .gm-avatar-btn:hover{border-color:var(--gold);box-shadow:0 0 0 1px rgba(201,169,110,0.4) inset, 0 6px 22px -4px rgba(201,169,110,0.55);}
        .gm-avatar-mail{
          position:absolute;right:-3px;bottom:-3px;width:16px;height:16px;border-radius:50%;
          background:#080808;border:0.5px solid rgba(201,169,110,0.6);
          display:flex;align-items:center;justify-content:center;color:var(--gold);
        }
        .gm-menu{
          background:linear-gradient(180deg,rgba(26,23,20,0.98),rgba(17,16,16,0.98)) !important;
          border:0.5px solid rgba(201,169,110,0.35) !important;color:var(--cream) !important;
          min-width:260px;padding:10px;font-family:'Jost',sans-serif;
        }
        .gm-menu [data-radix-collection-item]{color:var(--cream);}
        .gm-menu-head{padding:10px 10px 12px;}
        .gm-menu-name{font-family:'Playfair Display',serif;font-size:15px;color:var(--cream);}
        .gm-menu-email{font-size:11px;color:rgba(245,240,232,0.55);letter-spacing:0.04em;margin-top:2px;display:flex;align-items:center;gap:6px;}
      `}</style>
      <div className="gm-header-inner">
        <Link to="/" className="gm-brand">
          Glow<em>Me</em>
        </Link>
        <nav className="gm-nav">
          {!isArtist && (
            <Link to="/search">
              <Search className="h-3.5 w-3.5" /> Discover
            </Link>
          )}
          {signedIn && !isArtist && (
            <>
              <Link to="/account">
                <Calendar className="h-3.5 w-3.5" /> Bookings
              </Link>
              <Link to="/favourites">
                <Heart className="h-3.5 w-3.5" /> Saved
              </Link>
              <Link to="/support">
                <MessageCircle className="h-3.5 w-3.5" /> Support
              </Link>
            </>
          )}
          {signedIn && isArtist && (
            <Link to="/dashboard">
              <LayoutDashboard className="h-3.5 w-3.5" /> Artist Dashboard
            </Link>
          )}
        </nav>
        <div className="gm-actions">
          {signedIn && !isArtist && (
            <Link to="/favourites" className="gm-heart" aria-label="Saved artists">
              <Heart className="h-4 w-4" />
            </Link>
          )}
          {signedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="gm-avatar-btn"
                  aria-label={`Account menu for ${displayName(user)}`}
                >
                  {initialOf(user)}
                  <span className="gm-avatar-mail" aria-hidden>
                    <Mail style={{ width: 9, height: 9 }} />
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={10} className="gm-menu">
                <DropdownMenuLabel className="gm-menu-head">
                  <div className="gm-menu-name">{displayName(user)}</div>
                  <div className="gm-menu-email">
                    <Mail style={{ width: 11, height: 11 }} />
                    {user?.email ?? ""}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator
                  style={{ background: "rgba(201,169,110,0.2)" }}
                />
                <DropdownMenuItem
                  onSelect={() =>
                    navigate({ to: isArtist ? "/profile" : "/me/profile" })
                  }
                >
                  <UserCircle2 className="mr-2 h-4 w-4" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => navigate({ to: isArtist ? "/bookings" : "/account" })}
                >
                  <Calendar className="mr-2 h-4 w-4" /> My Bookings
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() =>
                    navigate({ to: isArtist ? "/settings" : "/me/profile" })
                  }
                >
                  <Settings className="mr-2 h-4 w-4" /> Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator
                  style={{ background: "rgba(201,169,110,0.2)" }}
                />
                {!isArtist && (
                  <DropdownMenuItem
                    onSelect={() => navigate({ to: "/artist/auth" })}
                    style={{ color: "#C9A96E" }}
                  >
                    <LayoutDashboard className="mr-2 h-4 w-4" /> Artist Portal
                  </DropdownMenuItem>
                )}
                {isArtist && (
                  <DropdownMenuItem
                    onSelect={() => navigate({ to: "/dashboard" })}
                    style={{ color: "#C9A96E" }}
                  >
                    <LayoutDashboard className="mr-2 h-4 w-4" /> Artist Dashboard
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onSelect={handleSignOut}
                  style={{ color: "#E89A8A" }}
                >
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <button
                className="gm-gmail-btn"
                onClick={handleGoogleSignIn}
                aria-label="Sign in with Gmail"
                title="Sign in with Gmail"
              >
                <GmailIcon className="h-4 w-4" />
              </button>
              <Link
                to="/artist/auth"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "10px 16px",
                  fontSize: 10,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: "#C9A96E",
                  border: "0.5px solid rgba(201,169,110,0.5)",
                  textDecoration: "none",
                }}
              >
                Artist Login
              </Link>
              <Link to="/auth" className="gm-cta">
                <User className="h-3.5 w-3.5" /> Sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
