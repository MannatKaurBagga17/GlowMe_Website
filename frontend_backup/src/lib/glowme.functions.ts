import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// =========================================================================
// Public (no-auth) reads — discovery + artist profile + slot lookup
// Use service-role admin client because public routes have no bearer during
// SSR. RLS would block anon writes; reads are allowed by policy so this is
// a faster path and avoids creating an anonymous client per request.
// =========================================================================

const ListArtistsSchema = z.object({
  city: z.string().optional(),
  category: z.string().optional(),
  query: z.string().optional(),
  minRating: z.number().min(0).max(5).optional(),
  maxPrice: z.number().min(0).optional(),
  atHome: z.boolean().optional(),
  studio: z.boolean().optional(),
});

export const listArtists = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => ListArtistsSchema.parse(input ?? {}))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("artists")
      .select("id, slug, name, tagline, city, area, hero_image_url, avatar_url, base_price_paise, avg_rating, review_count, offers_at_home, offers_studio, verified, specialties")
      .order("avg_rating", { ascending: false })
      .limit(48);
    if (data.city) q = q.eq("city", data.city);
    if (data.minRating) q = q.gte("avg_rating", data.minRating);
    if (data.maxPrice) q = q.lte("base_price_paise", data.maxPrice);
    if (data.atHome) q = q.eq("offers_at_home", true);
    if (data.studio) q = q.eq("offers_studio", true);
    if (data.query) q = q.ilike("name", `%${data.query}%`);

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    let artists = rows ?? [];
    if (data.category) {
      // Filter to artists that offer a service of this category
      const { data: svcRows } = await supabaseAdmin
        .from("services")
        .select("artist_id")
        .eq("category", data.category as any)
        .eq("active", true);
      const allow = new Set((svcRows ?? []).map((r) => r.artist_id));
      artists = artists.filter((a) => allow.has(a.id));
    }
    return { artists };
  });

export const listCities = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("artists").select("city").order("city");
  const cities = Array.from(new Set((data ?? []).map((r) => r.city)));
  return { cities };
});

export const getArtistBySlug = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ slug: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: artist, error } = await supabaseAdmin
      .from("artists")
      .select("*")
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!artist) return { artist: null, services: [], portfolio: [], reviews: [] };

    const [{ data: services }, { data: portfolio }, { data: reviews }] = await Promise.all([
      supabaseAdmin.from("services").select("*").eq("artist_id", artist.id).eq("active", true).order("price_paise"),
      supabaseAdmin.from("portfolio_media").select("*").eq("artist_id", artist.id).order("sort_order"),
      supabaseAdmin
        .from("reviews")
        .select("id, rating, title, body, created_at, verified")
        .eq("artist_id", artist.id)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    return {
      artist,
      services: services ?? [],
      portfolio: portfolio ?? [],
      reviews: reviews ?? [],
    };
  });

export const getArtistAvailability = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ artistId: z.string().uuid(), days: z.number().min(1).max(90).default(60) }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const to = new Date();
    to.setDate(to.getDate() + data.days);
    const { data: slots, error } = await supabaseAdmin
      .from("availability_slots")
      .select("id, starts_at, ends_at, status, capacity, booked_count")
      .eq("artist_id", data.artistId)
      .gte("starts_at", new Date().toISOString())
      .lte("starts_at", to.toISOString())
      .order("starts_at");
    if (error) throw new Error(error.message);
    const enriched = (slots ?? []).map((s) => {
      const cap = Number((s as any).capacity ?? 10);
      const used = Number((s as any).booked_count ?? 0);
      const remaining = Math.max(0, cap - used);
      return { ...s, capacity: cap, booked_count: used, remaining, available: remaining > 0 && s.status !== "blocked" };
    });
    return { slots: enriched };
  });

// =========================================================================
// Authenticated writes — bookings, favourites, reviews, support
// =========================================================================

const CreateBookingSchema = z.object({
  artistId: z.string().uuid(),
  serviceIds: z.array(z.string().uuid()).min(1).max(8),
  slotId: z.string().uuid(),
  locationType: z.enum(["studio", "at_home"]),
  address: z.string().max(500).optional(),
  city: z.string().max(120).optional(),
  customerName: z.string().min(1).max(120),
  customerPhone: z.string().min(7).max(20),
  notes: z.string().max(500).optional(),
  isAdvance: z.boolean().default(false),
});

export const createBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CreateBookingSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    const { data: artist } = await supabaseAdmin
      .from("artists")
      .select("id, cancellation_policy")
      .eq("id", data.artistId)
      .maybeSingle();
    if (!artist) throw new Error("Artist not found");

    const { data: slot } = await supabaseAdmin
      .from("availability_slots")
      .select("id, artist_id, starts_at, ends_at, status")
      .eq("id", data.slotId)
      .maybeSingle();
    if (!slot || slot.artist_id !== data.artistId) throw new Error("Slot not found");
    const slotCap = Number((slot as any).capacity ?? 10);
    const slotUsed = Number((slot as any).booked_count ?? 0);
    if (slot.status === "blocked" || slotUsed >= slotCap) throw new Error("Slot fully booked");

    const { data: services } = await supabaseAdmin
      .from("services")
      .select("id, artist_id, title, price_paise, duration_minutes, available_at_home, available_at_studio")
      .in("id", data.serviceIds);
    if (!services || services.length !== data.serviceIds.length) throw new Error("Some services not found");
    for (const s of services) {
      if (s.artist_id !== data.artistId) throw new Error("Service not from this artist");
      if (data.locationType === "at_home" && !s.available_at_home) throw new Error(`${s.title} not available at home`);
      if (data.locationType === "studio" && !s.available_at_studio) throw new Error(`${s.title} not available at studio`);
    }

    const total = services.reduce((sum, s) => sum + Number(s.price_paise), 0);
    const duration = services.reduce((sum, s) => sum + s.duration_minutes, 0);
    const endsAt = new Date(new Date(slot.starts_at).getTime() + Math.max(duration, 60) * 60_000).toISOString();

    const { data: booking, error: insErr } = await supabaseAdmin
      .from("bookings")
      .insert({
        customer_id: userId,
        artist_id: data.artistId,
        starts_at: slot.starts_at,
        ends_at: endsAt,
        location_type: data.locationType,
        address: data.address ?? null,
        city: data.city ?? null,
        customer_name: data.customerName,
        customer_phone: data.customerPhone,
        total_paise: total,
        paid_paise: 0,
        is_advance: data.isAdvance,
        status: "pending_payment",
        cancellation_policy_snapshot: artist.cancellation_policy,
        notes: data.notes ?? null,
      })
      .select("id")
      .single();
    if (insErr || !booking) throw new Error(insErr?.message ?? "Booking failed");

    const items = services.map((s) => ({
      booking_id: booking.id,
      service_id: s.id,
      title_snapshot: s.title,
      price_paise: s.price_paise,
      duration_minutes: s.duration_minutes,
    }));
    await supabaseAdmin.from("booking_items").insert(items);

    // Increment slot capacity usage; only mark fully booked once capacity reached
    const newCount = slotUsed + 1;
    await supabaseAdmin
      .from("availability_slots")
      .update({
        booked_count: newCount,
        status: newCount >= slotCap ? "booked" : "open",
        booking_id: newCount >= slotCap ? booking.id : null,
      })
      .eq("id", slot.id);

    return { bookingId: booking.id };
  });

// "Pay" demo flow — until Razorpay keys are added, we mark the booking as paid
// and confirmed. Real flow will create a Razorpay order here and verify the
// signature inside /api/public/razorpay-webhook.
export const completeDemoPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ bookingId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: booking } = await supabaseAdmin
      .from("bookings")
      .select("*")
      .eq("id", data.bookingId)
      .maybeSingle();
    if (!booking || booking.customer_id !== context.userId) throw new Error("Booking not found");

    const amount = booking.is_advance ? Math.round(Number(booking.total_paise) * 0.25) : Number(booking.total_paise);

    await supabaseAdmin.from("payments").insert({
      booking_id: booking.id,
      customer_id: context.userId,
      kind: booking.is_advance ? "advance" : "full",
      amount_paise: amount,
      status: "paid",
      method: "demo",
    });

    await supabaseAdmin
      .from("bookings")
      .update({ paid_paise: amount, status: "confirmed" })
      .eq("id", booking.id);

    return { ok: true };
  });

export const listMyBookings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("bookings")
      .select("*, booking_items(*), artists:artist_id(name, slug, city, avatar_url, hero_image_url)")
      .order("starts_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { bookings: data ?? [] };
  });

export const getBooking = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: row, error } = await supabase
      .from("bookings")
      .select("*, booking_items(*), artists:artist_id(name, slug, city, avatar_url, cancellation_policy)")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { booking: row };
  });

export const cancelBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid(), reason: z.string().max(500).optional() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: booking } = await supabaseAdmin
      .from("bookings")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (!booking || booking.customer_id !== context.userId) throw new Error("Booking not found");
    if (["cancelled", "completed", "no_show"].includes(booking.status)) throw new Error("Cannot cancel this booking");

    // Refund policy: >24h = 100%, 4-24h = 50%, <4h = 0%
    const hoursToStart = (new Date(booking.starts_at).getTime() - Date.now()) / 3_600_000;
    let refundPct = 0;
    if (hoursToStart >= 24) refundPct = 1;
    else if (hoursToStart >= 4) refundPct = 0.5;
    const refund = Math.round(Number(booking.paid_paise) * refundPct);

    await supabaseAdmin
      .from("bookings")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        cancellation_reason: data.reason ?? null,
        refund_paise: refund,
      })
      .eq("id", booking.id);

    // Release one seat in the slot
    const { data: relSlots } = await supabaseAdmin
      .from("availability_slots")
      .select("id, booked_count, capacity")
      .or(`booking_id.eq.${booking.id},and(starts_at.eq.${booking.starts_at},artist_id.eq.${booking.artist_id})`);
    for (const rs of relSlots ?? []) {
      const nc = Math.max(0, Number((rs as any).booked_count ?? 1) - 1);
      await supabaseAdmin
        .from("availability_slots")
        .update({ booked_count: nc, status: "open", booking_id: null })
        .eq("id", rs.id);
    }

    if (refund > 0) {
      await supabaseAdmin.from("payments").insert({
        booking_id: booking.id,
        customer_id: context.userId,
        kind: "refund",
        amount_paise: refund,
        status: "paid",
        method: "demo",
      });
    }

    return { refundPaise: refund };
  });

// Reviews ------------------------------------------------------------------
export const createReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      bookingId: z.string().uuid(),
      rating: z.number().min(1).max(5),
      title: z.string().max(120).optional(),
      body: z.string().max(2000).optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: booking } = await supabase
      .from("bookings")
      .select("id, artist_id, status")
      .eq("id", data.bookingId)
      .maybeSingle();
    if (!booking) throw new Error("Booking not found");
    if (booking.status !== "completed") throw new Error("Can only review completed bookings");

    const { error } = await supabase.from("reviews").insert({
      booking_id: booking.id,
      artist_id: booking.artist_id,
      customer_id: context.userId,
      rating: data.rating,
      title: data.title ?? null,
      body: data.body ?? null,
      verified: true,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Favourites ---------------------------------------------------------------
export const toggleFavourite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ artistId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: existing } = await supabase
      .from("favourites")
      .select("id")
      .eq("artist_id", data.artistId)
      .eq("customer_id", context.userId)
      .maybeSingle();
    if (existing) {
      await supabase.from("favourites").delete().eq("id", existing.id);
      return { favourited: false };
    }
    await supabase.from("favourites").insert({ artist_id: data.artistId, customer_id: context.userId });
    return { favourited: true };
  });

export const listFavourites = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data } = await supabase
      .from("favourites")
      .select("artist_id, created_at, artists:artist_id(id, slug, name, tagline, city, hero_image_url, avatar_url, avg_rating, review_count, base_price_paise)")
      .order("created_at", { ascending: false });
    return { favourites: data ?? [] };
  });

// Support chat -------------------------------------------------------------
export const listSupportThreads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data } = await supabase
      .from("support_threads")
      .select("*")
      .order("updated_at", { ascending: false });
    return { threads: data ?? [] };
  });

export const createSupportThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      subject: z.string().min(1).max(200),
      message: z.string().min(1).max(4000),
      bookingId: z.string().uuid().optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: thread, error } = await supabase
      .from("support_threads")
      .insert({ customer_id: context.userId, subject: data.subject, booking_id: data.bookingId ?? null })
      .select("id")
      .single();
    if (error || !thread) throw new Error(error?.message ?? "Failed");
    await supabase.from("support_messages").insert({
      thread_id: thread.id,
      sender_id: context.userId,
      is_staff: false,
      body: data.message,
    });
    return { threadId: thread.id };
  });

export const getSupportThread = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const [{ data: thread }, { data: messages }] = await Promise.all([
      supabase.from("support_threads").select("*").eq("id", data.id).maybeSingle(),
      supabase.from("support_messages").select("*").eq("thread_id", data.id).order("created_at"),
    ]);
    return { thread, messages: messages ?? [] };
  });

export const replySupportThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ threadId: z.string().uuid(), body: z.string().min(1).max(4000) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    await supabase.from("support_messages").insert({
      thread_id: data.threadId,
      sender_id: context.userId,
      is_staff: false,
      body: data.body,
    });
    return { ok: true };
  });
