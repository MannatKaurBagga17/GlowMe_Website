import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function ownArtist(supabase: any, userId: string) {
  void supabase;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("artists")
    .select("*")
    .eq("owner_id", userId)
    .maybeSingle();
  return data ?? null;
}

export const getArtistOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const artist = await ownArtist(context.supabase, context.userId);
    if (!artist) return { artist: null };
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const [{ data: bookings }, { data: payments }] = await Promise.all([
      context.supabase.from("bookings")
        .select("id, status, starts_at, customer_name, total_paise, artist_response")
        .eq("artist_id", artist.id),
      context.supabase.from("payments")
        .select("amount_paise, status, created_at, booking_id")
        .gte("created_at", monthStart),
    ]);
    const all = bookings ?? [];
    const upcoming = all
      .filter((b: any) => new Date(b.starts_at) >= now && (b.status === "confirmed" || b.status === "pending_payment"))
      .sort((a: any, b: any) => +new Date(a.starts_at) - +new Date(b.starts_at))
      .slice(0, 5);
    const pending = all.filter((b: any) => b.status === "pending_payment" || (b.status === "confirmed" && !b.artist_response)).length;
    const monthEarnings = (payments ?? [])
      .filter((p: any) => p.status === "paid")
      .reduce((s: number, p: any) => s + Number(p.amount_paise || 0), 0);
    return {
      artist,
      totals: {
        bookings: all.length,
        upcoming: upcoming.length,
        pending,
        earningsPaise: monthEarnings,
        avgRating: Number(artist.avg_rating ?? 0),
        reviewCount: Number(artist.review_count ?? 0),
      },
      upcoming,
    };
  });

export const getEarningsBreakdown = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const artist = await ownArtist(context.supabase, context.userId);
    if (!artist) return { rows: [], total: 0 };
    const { data: bookings } = await context.supabase
      .from("bookings").select("id").eq("artist_id", artist.id);
    const ids = (bookings ?? []).map((b: any) => b.id);
    if (ids.length === 0) return { rows: [], total: 0 };
    const { data: payments } = await context.supabase
      .from("payments").select("amount_paise, status, created_at, booking_id")
      .in("booking_id", ids).eq("status", "paid").order("created_at", { ascending: false });
    const byMonth = new Map<string, number>();
    let total = 0;
    for (const p of payments ?? []) {
      const k = String(p.created_at).slice(0, 7);
      byMonth.set(k, (byMonth.get(k) ?? 0) + Number(p.amount_paise || 0));
      total += Number(p.amount_paise || 0);
    }
    return { rows: Array.from(byMonth.entries()).map(([month, paise]) => ({ month, paise })), total };
  });

export const listMyReviews = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const artist = await ownArtist(context.supabase, context.userId);
    if (!artist) return { reviews: [] };
    const { data } = await context.supabase.from("reviews")
      .select("id, rating, title, body, created_at, artist_reply, customer_id")
      .eq("artist_id", artist.id).order("created_at", { ascending: false });
    return { reviews: data ?? [] };
  });

export const replyToReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid(), response: z.string().min(1).max(2000) }).parse(i))
  .handler(async ({ data, context }) => {
    const artist = await ownArtist(context.supabase, context.userId);
    if (!artist) throw new Error("No artist profile");
    const { error } = await context.supabase.from("reviews")
      .update({ artist_reply: data.response }).eq("id", data.id).eq("artist_id", artist.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listAvailability = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const artist = await ownArtist(context.supabase, context.userId);
    if (!artist) return { slots: [] };
    const { data } = await context.supabase.from("availability_slots")
      .select("*").eq("artist_id", artist.id)
      .gte("starts_at", new Date().toISOString())
      .order("starts_at").limit(200);
    return { slots: data ?? [] };
  });

export const addAvailabilitySlot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    starts_at: z.string(),
    ends_at: z.string(),
    capacity: z.number().int().min(1).max(50).default(1),
  }).parse(i))
  .handler(async ({ data, context }) => {
    const artist = await ownArtist(context.supabase, context.userId);
    if (!artist) throw new Error("No artist profile");
    const { error } = await context.supabase.from("availability_slots").insert({
      artist_id: artist.id, starts_at: data.starts_at, ends_at: data.ends_at,
      capacity: data.capacity, status: "open",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteAvailabilitySlot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("availability_slots").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateServiceAreas = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    city: z.string().min(1).max(120),
    area: z.string().max(200).optional().nullable(),
    service_radius_km: z.number().int().min(1).max(200),
    offers_at_home: z.boolean(),
    offers_studio: z.boolean(),
  }).parse(i))
  .handler(async ({ data, context }) => {
    const artist = await ownArtist(context.supabase, context.userId);
    if (!artist) throw new Error("Create your artist profile first");
    const { error } = await context.supabase.from("artists").update(data).eq("id", artist.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listRecentActivity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const artist = await ownArtist(context.supabase, context.userId);
    if (!artist) return { items: [] };
    const [{ data: bk }, { data: rv }] = await Promise.all([
      context.supabase.from("bookings")
        .select("id, customer_name, starts_at, status, created_at")
        .eq("artist_id", artist.id).order("created_at", { ascending: false }).limit(10),
      context.supabase.from("reviews")
        .select("id, rating, title, created_at")
        .eq("artist_id", artist.id).order("created_at", { ascending: false }).limit(10),
    ]);
    const items = [
      ...(bk ?? []).map((b: any) => ({ kind: "booking" as const, id: b.id, at: b.created_at,
        text: `New booking from ${b.customer_name ?? "customer"} (${b.status})` })),
      ...(rv ?? []).map((r: any) => ({ kind: "review" as const, id: r.id, at: r.created_at,
        text: `${r.rating}★ review: ${r.title ?? ""}` })),
    ].sort((a, b) => +new Date(b.at) - +new Date(a.at)).slice(0, 20);
    return { items };
  });
