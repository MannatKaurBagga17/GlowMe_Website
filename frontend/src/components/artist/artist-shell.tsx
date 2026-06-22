import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider,
  SidebarTrigger, SidebarHeader, SidebarMenuSub, SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { ChevronRight, LogOut } from "lucide-react";
import type { ReactNode } from "react";

const GROUPS = [
  {
    icon: "💼",
    label: "Artist Dashboard",
    url: "/dashboard",
    items: [
      { label: "Booking Overview", url: "/bookings" },
      { label: "Earnings Summary", url: "/earnings" },
    ],
  },
  {
    icon: "📅",
    label: "Appointment Management",
    url: "/bookings",
    items: [
      { label: "Upcoming Appointments", url: "/bookings" },
      { label: "Calendar", url: "/availability" },
    ],
  },
  {
    icon: "🛠️",
    label: "Services",
    url: "/services",
    items: [
      { label: "Add/Edit Services", url: "/services" },
      { label: "Pricing", url: "/services" },
    ],
  },
  {
    icon: "🖼️",
    label: "Portfolio",
    url: "/portfolio",
    items: [
      { label: "Upload Makeup Looks", url: "/portfolio" },
      { label: "Before & After Photos", url: "/portfolio" },
    ],
  },
  {
    icon: "👥",
    label: "Clients",
    url: "/service-areas",
    items: [
      { label: "Customer List", url: "/service-areas" },
      { label: "Booking History", url: "/bookings" },
    ],
  },
  {
    icon: "💰",
    label: "Earnings",
    url: "/earnings",
    items: [
      { label: "Revenue", url: "/earnings" },
      { label: "Withdrawals", url: "/earnings" },
    ],
  },
  {
    icon: "⭐",
    label: "Reviews",
    url: "/reviews",
    items: [
      { label: "Customer Feedback", url: "/reviews" },
    ],
  },
  {
    icon: "⚙️",
    label: "Settings",
    url: "/settings",
    items: [
      { label: "Profile", url: "/profile" },
      { label: "Availability", url: "/availability" },
      { label: "Working Hours", url: "/availability" },
    ],
  },
] as const;

function ArtistSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const qc = useQueryClient();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/artist/auth", replace: true });
  }

  return (
    <Sidebar collapsible="icon" className="gm-artist-sidebar">
      <SidebarHeader className="border-b border-[rgba(201,169,110,0.2)] px-4 py-4 bg-[#080808]">
        <Link to="/dashboard" className="font-serif text-lg tracking-wide text-[#F5F0E8]">
          Glow<span className="italic text-[#C9A96E]">Me</span>{" "}
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#C9A96E]">Artist</span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="bg-[#0a0908]">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {GROUPS.map((group) => {
                const groupActive = pathname === group.url || pathname.startsWith(group.url);
                const anySubActive = group.items.some((item) => pathname === item.url);
                const isOpen = groupActive || anySubActive;

                return (
                  <Collapsible key={group.label} defaultOpen={isOpen} asChild>
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          tooltip={group.label}
                          isActive={groupActive}
                          className="text-[#F5F0E8]/70 hover:bg-[rgba(201,169,110,0.1)] hover:text-[#C9A96E] data-[active=true]:bg-[rgba(201,169,110,0.15)] data-[active=true]:text-[#C9A96E] data-[active=true]:border-l-2 data-[active=true]:border-[#C9A96E]"
                        >
                          <span className="text-base">{group.icon}</span>
                          <span className="flex-1">{group.label}</span>
                          <ChevronRight className="h-3.5 w-3.5 transition-transform group-data-[state=open]/collapsible:rotate-90 text-[#F5F0E8]/40" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub className="border-[rgba(201,169,110,0.15)]">
                          {group.items.map((item) => {
                            const active = pathname === item.url;
                            return (
                              <SidebarMenuSubButton
                                key={item.label}
                                asChild
                                isActive={active}
                                className="text-[#F5F0E8]/60 hover:bg-[rgba(201,169,110,0.08)] hover:text-[#C9A96E] data-[active=true]:bg-[rgba(201,169,110,0.12)] data-[active=true]:text-[#C9A96E]"
                              >
                                <Link to={item.url}>{item.label}</Link>
                              </SidebarMenuSubButton>
                            );
                          })}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                );
              })}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={signOut}
                  tooltip="Sign out"
                  className="text-[#E89A8A] hover:bg-[rgba(232,154,138,0.1)] hover:text-[#E89A8A]"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

export function ArtistShell({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <SidebarProvider>
      <style>{`
        .gm-artist-root{
          --gold:#C9A96E;--cream:#F5F0E8;--black:#080808;
          font-family:'Jost',sans-serif;
        }
        .gm-artist-root h1,.gm-artist-root h2,.gm-artist-root h3{font-family:'Playfair Display',serif;color:var(--cream);}
      `}</style>
      <div className="gm-artist-root flex min-h-screen w-full bg-[#080808] text-[#F5F0E8]">
        <ArtistSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-[rgba(201,169,110,0.2)] bg-[#080808]/95 px-4 backdrop-blur">
            <SidebarTrigger className="text-[#C9A96E] hover:bg-[rgba(201,169,110,0.1)]" />
            {title && (
              <h1 className="font-serif text-lg text-[#F5F0E8]">
                {title}
              </h1>
            )}
            <div className="ml-auto text-[10px] uppercase tracking-[0.25em] text-[#C9A96E]">Artist Portal</div>
          </header>
          <main className="flex-1 p-4 md:p-6 bg-gradient-to-br from-[#080808] via-[#0a0908] to-[#11100f]">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
