import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Menu, X, User, Home, Search, MapPin, Sparkles, Calendar, Heart,
  MessageCircle, Star, Gift, CreditCard, Bell, HelpCircle,
  Briefcase, DollarSign, Wrench, Image as ImageIcon, Users, Settings, LayoutDashboard,
} from "lucide-react";

type Item = { label: string; to: string; icon: React.ComponentType<{ className?: string }>; badge?: string | number };
type Section = { heading: string; items: Item[] };

const customerSections: Section[] = [
  { heading: "Main", items: [
    { label: "Dashboard", to: "/account", icon: Home },
    { label: "Search Artists", to: "/search", icon: Search },
    { label: "Near Me", to: "/search", icon: MapPin },
  ]},
  { heading: "Explore", items: [
    { label: "Browse Services", to: "/search", icon: Sparkles },
  ]},
  { heading: "My Account", items: [
    { label: "My Bookings", to: "/account", icon: Calendar },
    { label: "Saved Artists", to: "/favourites", icon: Heart },
    { label: "Messages", to: "/support", icon: MessageCircle },
    { label: "Reviews", to: "/account", icon: Star },
  ]},
  { heading: "Offers & Payments", items: [
    { label: "Offers & Coupons", to: "/account", icon: Gift },
    { label: "Payments", to: "/account", icon: CreditCard },
  ]},
  { heading: "Settings", items: [
    { label: "Profile", to: "/account", icon: User },
    { label: "Notifications", to: "/account", icon: Bell },
    { label: "Help & Support", to: "/support", icon: HelpCircle },
  ]},
];

const artistSections: Section[] = [
  { heading: "Dashboard", items: [
    { label: "Overview", to: "/dashboard", icon: Briefcase },
    { label: "Earnings Summary", to: "/dashboard", icon: DollarSign },
    { label: "My Rating", to: "/dashboard", icon: Star },
  ]},
  { heading: "Appointments", items: [
    { label: "Appointments", to: "/dashboard", icon: Calendar },
  ]},
  { heading: "My Services", items: [
    { label: "Services", to: "/dashboard", icon: Wrench },
    { label: "Portfolio", to: "/dashboard", icon: ImageIcon },
  ]},
  { heading: "Clients & Earnings", items: [
    { label: "Clients", to: "/dashboard", icon: Users },
    { label: "Earnings", to: "/dashboard", icon: DollarSign },
    { label: "Reviews", to: "/dashboard", icon: Star },
  ]},
  { heading: "Settings", items: [
    { label: "Settings", to: "/dashboard", icon: Settings },
    { label: "Help & Support", to: "/support", icon: HelpCircle },
  ]},
];

export function SiteHeader() {
  const [signedIn, setSignedIn] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"customer" | "artist">("customer");
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSignedIn(!!data.session);
      setEmail(data.session?.user?.email ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setSignedIn(!!session);
      setEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const sections = tab === "customer" ? customerSections : artistSections;
  const initial = (email?.[0] ?? "U").toUpperCase();

  async function signOut() {
    await supabase.auth.signOut();
    setOpen(false);
    navigate({ to: "/" });
  }

  return (
    <header className="gm-header">
      <style>{`
        .gm-header{position:sticky;top:0;z-index:40;background:rgba(8,8,8,0.9);backdrop-filter:blur(14px);border-bottom:0.5px solid rgba(201,169,110,0.18);font-family:'Jost',sans-serif;font-weight:300;}
        .gm-header-inner{max-width:1280px;margin:0 auto;padding:14px 18px;display:flex;align-items:center;justify-content:space-between;gap:12px;}
        .gm-left{display:flex;align-items:center;gap:10px;}
        .gm-menu-btn{display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border:0.5px solid rgba(201,169,110,0.35);background:transparent;color:#C9A96E;cursor:pointer;transition:all .25s;border-radius:4px;}
        .gm-menu-btn:hover{background:rgba(201,169,110,0.12);}
        .gm-brand{font-family:'Playfair Display',serif;font-size:22px;font-weight:700;letter-spacing:0.06em;color:#F5F0E8;text-decoration:none;}
        .gm-brand em{font-style:italic;color:#C9A96E;}
        .gm-cta{display:inline-flex;align-items:center;gap:8px;background:#C9A96E;color:#080808;padding:9px 16px;font-size:10px;font-weight:500;letter-spacing:0.22em;text-transform:uppercase;text-decoration:none;transition:all .3s;border-radius:2px;}
        .gm-cta:hover{background:#E8D5A3;}
        .gm-account{display:inline-flex;align-items:center;gap:8px;border:0.5px solid rgba(201,169,110,0.4);color:#C9A96E;padding:9px 14px;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;text-decoration:none;border-radius:2px;transition:all .3s;}
        .gm-account:hover{background:#C9A96E;color:#080808;}

        .gm-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.65);backdrop-filter:blur(4px);z-index:50;animation:gmFade .25s ease;}
        @keyframes gmFade{from{opacity:0}to{opacity:1}}
        .gm-drawer{position:fixed;top:0;left:0;bottom:0;width:min(360px,86vw);background:#0A0908;border-right:0.5px solid rgba(201,169,110,0.2);z-index:60;display:flex;flex-direction:column;animation:gmSlide .3s cubic-bezier(.2,.8,.2,1);box-shadow:0 0 60px rgba(0,0,0,0.6);}
        @keyframes gmSlide{from{transform:translateX(-100%)}to{transform:translateX(0)}}
        .gm-drawer-head{display:flex;align-items:center;justify-content:space-between;padding:22px 22px 18px;border-bottom:0.5px solid rgba(201,169,110,0.15);}
        .gm-drawer-brand{font-family:'Playfair Display',serif;font-size:26px;color:#F5F0E8;font-weight:700;letter-spacing:0.04em;}
        .gm-drawer-brand em{font-style:italic;color:#C9A96E;}
        .gm-close{width:34px;height:34px;display:inline-flex;align-items:center;justify-content:center;border:0.5px solid rgba(201,169,110,0.35);background:transparent;color:#C9A96E;cursor:pointer;border-radius:3px;}
        .gm-tabs{display:grid;grid-template-columns:1fr 1fr;border-bottom:0.5px solid rgba(201,169,110,0.15);}
        .gm-tab{padding:16px;font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:rgba(245,240,232,0.45);background:transparent;border:none;cursor:pointer;font-family:'Jost',sans-serif;border-bottom:2px solid transparent;transition:all .25s;}
        .gm-tab.active{color:#C9A96E;border-bottom-color:#C9A96E;}
        .gm-profile{display:flex;align-items:center;gap:14px;padding:18px 22px;border-bottom:0.5px solid rgba(201,169,110,0.1);}
        .gm-avatar{width:46px;height:46px;border-radius:50%;background:#C9A96E;color:#080808;display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-size:20px;font-weight:600;}
        .gm-profile-name{color:#F5F0E8;font-size:15px;font-weight:500;}
        .gm-profile-role{color:#C9A96E;font-size:10px;letter-spacing:0.24em;text-transform:uppercase;margin-top:2px;}
        .gm-scroll{flex:1;overflow-y:auto;padding:8px 0 20px;}
        .gm-section-heading{padding:18px 22px 8px;font-size:10px;letter-spacing:0.28em;text-transform:uppercase;color:#C9A96E;opacity:0.75;}
        .gm-item{display:flex;align-items:center;gap:14px;padding:13px 22px;color:#F5F0E8;text-decoration:none;font-size:15px;font-weight:300;transition:all .2s;border-left:2px solid transparent;}
        .gm-item:hover{background:rgba(201,169,110,0.08);border-left-color:#C9A96E;color:#C9A96E;}
        .gm-item-ico{width:20px;height:20px;color:#C9A96E;opacity:0.85;flex-shrink:0;}
        .gm-divider{height:0.5px;background:rgba(201,169,110,0.12);margin:6px 22px;}
        .gm-foot{padding:16px 22px 22px;border-top:0.5px solid rgba(201,169,110,0.15);display:flex;flex-direction:column;gap:10px;}
        .gm-book{display:inline-flex;align-items:center;justify-content:center;gap:8px;background:#C9A96E;color:#080808;padding:14px;font-size:11px;letter-spacing:0.28em;text-transform:uppercase;font-weight:500;text-decoration:none;border-radius:2px;border:none;cursor:pointer;font-family:'Jost',sans-serif;}
        .gm-book:hover{background:#E8D5A3;}
        .gm-signout{background:transparent;border:0.5px solid rgba(201,169,110,0.3);color:rgba(245,240,232,0.7);padding:12px;font-size:11px;letter-spacing:0.24em;text-transform:uppercase;cursor:pointer;border-radius:2px;font-family:'Jost',sans-serif;transition:all .25s;}
        .gm-signout:hover{color:#C9A96E;border-color:#C9A96E;}
      `}</style>

      <div className="gm-header-inner">
        <div className="gm-left">
          <button className="gm-menu-btn" aria-label="Open menu" onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <Link to="/" className="gm-brand">Glow<em>Me</em></Link>
        </div>
        <div>
          {signedIn ? (
            <Link to="/account" className="gm-account"><User className="h-3.5 w-3.5" /> Account</Link>
          ) : (
            <Link to="/auth" className="gm-cta">Sign in</Link>
          )}
        </div>
      </div>

      {open && (
        <>
          <div className="gm-overlay" onClick={() => setOpen(false)} />
          <aside className="gm-drawer" role="dialog" aria-label="GlowMe Menu">
            <div className="gm-drawer-head">
              <span className="gm-drawer-brand">Glow<em>Me</em></span>
              <button className="gm-close" aria-label="Close menu" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="gm-tabs">
              <button className={`gm-tab ${tab === "customer" ? "active" : ""}`} onClick={() => setTab("customer")}>Customer</button>
              <button className={`gm-tab ${tab === "artist" ? "active" : ""}`} onClick={() => setTab("artist")}>Artist</button>
            </div>

            <div className="gm-profile">
              <div className="gm-avatar">{tab === "artist" ? "A" : initial}</div>
              <div>
                <div className="gm-profile-name">{tab === "artist" ? "Artist Account" : (email ?? "Guest")}</div>
                <div className="gm-profile-role">{tab === "artist" ? "Makeup Artist" : "Customer"}</div>
              </div>
            </div>

            <div className="gm-scroll">
              {sections.map((sec, i) => (
                <div key={sec.heading}>
                  {i > 0 && <div className="gm-divider" />}
                  <div className="gm-section-heading">{sec.heading}</div>
                  {sec.items.map((it) => {
                    const Icon = it.icon;
                    return (
                      <Link key={it.label} to={it.to} className="gm-item" onClick={() => setOpen(false)}>
                        <Icon className="gm-item-ico" />
                        <span>{it.label}</span>
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="gm-foot">
              {tab === "artist" ? (
                <Link to="/dashboard" className="gm-book" onClick={() => setOpen(false)}>
                  <LayoutDashboard className="h-3.5 w-3.5" /> View Dashboard
                </Link>
              ) : (
                <Link to="/search" className="gm-book" onClick={() => setOpen(false)}>
                  <Sparkles className="h-3.5 w-3.5" /> Book Now
                </Link>
              )}
              {signedIn ? (
                <button className="gm-signout" onClick={signOut}>Sign out</button>
              ) : (
                <Link to="/auth" className="gm-signout" style={{ textAlign: "center", textDecoration: "none", display: "block" }} onClick={() => setOpen(false)}>Sign in</Link>
              )}
            </div>
          </aside>
        </>
      )}
    </header>
  );
}
