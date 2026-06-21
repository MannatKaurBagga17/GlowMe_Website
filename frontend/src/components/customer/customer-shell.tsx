import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu,
  SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, SidebarHeader,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard, Search, CalendarCheck, Heart, MessageSquare, Star,
  Gift, MapPin, User, CreditCard, Bell, HelpCircle, LogOut,
} from "lucide-react";
import type { ReactNode } from "react";

const NAV = [
  { url: "/me", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { url: "/search", label: "Explore Artists", icon: Search },
  { url: "/account", label: "My Bookings", icon: CalendarCheck },
  { url: "/favourites", label: "Favorites", icon: Heart },
  { url: "/support", label: "Messages", icon: MessageSquare },
  { url: "/me/reviews", label: "Reviews & Ratings", icon: Star },
  { url: "/me/offers", label: "Offers & Coupons", icon: Gift },
  { url: "/me/near-me", label: "Near Me", icon: MapPin },
  { url: "/me/profile", label: "Profile", icon: User },
  { url: "/me/payments", label: "Payments", icon: CreditCard },
  { url: "/me/notifications", label: "Notifications", icon: Bell },
  { url: "/support", label: "Help & Support", icon: HelpCircle },
] as const;

function CustomerSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const qc = useQueryClient();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-border px-4 py-4">
        <Link to="/" className="block">
          <div className="font-serif text-lg tracking-wide">
            Glow<span className="italic text-primary">Me</span>
          </div>
          <div className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Main Menu</div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map((item, idx) => {
                const active = (item as any).exact ? pathname === item.url : pathname === item.url || pathname.startsWith(item.url + "/");
                return (
                  <SidebarMenuItem key={`${item.url}-${idx}`}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
                      <Link to={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
              <SidebarMenuItem>
                <SidebarMenuButton onClick={signOut} tooltip="Logout">
                  <LogOut className="h-4 w-4" /><span>Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

export function CustomerShell({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <CustomerSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur">
            <SidebarTrigger />
            {title && <h1 className="font-serif text-lg">{title}</h1>}
          </header>
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}