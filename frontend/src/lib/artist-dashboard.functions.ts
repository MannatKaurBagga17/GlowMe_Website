import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "artist";
}

export const getMyArtist = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: artist } = await supabaseAdmin
      .from("artists")
      .select("*")
      .eq("owner_id", userId)
      .maybeSingle();
    if (!artist) return { artist: null, services: [], portfolio: [] };
    const [{ data: services }, { data: portfolio }] = await Promise.all([
      supabase.from("services").select("*").eq("artist_id", artist.id).order("created_at"),
      supabase.from("portfolio_media").select("*").eq("artist_id", artist.id).order("sort_order"),
    ]);
    return { artist, services: services ?? [], portfolio: portfolio ?? [] };
  });

const ArtistUpsertSchema = z.object({
  name: z.string().min(1).max(120),
  phone: z.string().min(7).max(20),
  email: z.string().email().max(200),
  city: z.string().min(1).max(120),
  area: z.string().max(200).optional().nullable(),
  tagline: z.string().max(200).optional().nullable(),
  bio: z.string().max(2000).optional().nullable(),
  years_experience: z.number().int().min(0).max(80).default(0),
  languages: z.array(z.string().max(40)).max(15).default([]),
  specialties: z.array(z.string().max(60)).max(20).default([]),
  base_price_paise: z.number().int().min(0).default(0),
  avatar_url: z.string().url().max(500).optional().nullable(),
  hero_image_url: z.string().url().max(500).optional().nullable(),
  offers_at_home: z.boolean().default(true),
  offers_studio: z.boolean().default(true),
  service_radius_km: z.number().int().min(1).max(200).default(15),
});

export const upsertMyArtist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ArtistUpsertSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: existing } = await supabase.from("artists").select("id, slug").eq("owner_id", userId).maybeSingle();
    if (existing) {
      const { error } = await supabase.from("artists").update(data).eq("id", existing.id);
      if (error) throw new Error(error.message);
      return { id: existing.id };
    }
    let slug = slugify(data.name);
    const { data: clash } = await supabase.from("artists").select("id").eq("slug", slug).maybeSingle();
    if (clash) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
    const { data: ins, error } = await supabase
      .from("artists")
      .insert({ ...data, slug, owner_id: userId })
      .select("id")
      .single();
    if (error || !ins) throw new Error(error?.message ?? "Create failed");
    return { id: ins.id };
  });

const ServiceSchema = z.object({
  id: z.string().uuid().optional(),
  category: z.enum(["hair", "makeup", "mehndi", "nails", "package", "skincare"]),
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(1000),
  duration_minutes: z.number().int().min(15).max(720),
  price_paise: z.number().int().min(0),
  inclusions: z.array(z.string().max(80)).max(20).default([]),
  available_at_home: z.boolean().default(true),
  available_at_studio: z.boolean().default(true),
  active: z.boolean().default(true),
});

async function getOwnedArtistId(supabase: any, userId: string) {
  const { data } = await supabase.from("artists").select("id").eq("owner_id", userId).maybeSingle();
  if (!data) throw new Error("Create your artist profile first");
  return data.id as string;
}

export const saveService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ServiceSchema.parse(i))
  .handler(async ({ data, context }) => {
    const artistId = await getOwnedArtistId(context.supabase, context.userId);
    if (data.id) {
      const { error } = await context.supabase.from("services").update({ ...data, artist_id: artistId }).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { id: _ignore, ...rest } = data;
    const { data: ins, error } = await context.supabase.from("services").insert({ ...rest, artist_id: artistId }).select("id").single();
    if (error || !ins) throw new Error(error?.message ?? "Save failed");
    return { id: ins.id };
  });

export const deleteService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("services").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const PortfolioSchema = z.object({
  kind: z.enum(["photo", "video"]),
  url: z.string().url().max(500),
  caption: z.string().max(200).optional().nullable(),
  sort_order: z.number().int().min(0).default(0),
});

export const addPortfolio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => PortfolioSchema.parse(i))
  .handler(async ({ data, context }) => {
    const artistId = await getOwnedArtistId(context.supabase, context.userId);
    const { data: ins, error } = await context.supabase.from("portfolio_media").insert({ ...data, artist_id: artistId }).select("id").single();
    if (error || !ins) throw new Error(error?.message ?? "Add failed");
    return { id: ins.id };
  });

export const deletePortfolio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("portfolio_media").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// =========================================================================
// Artist-side bookings: list, accept / reject
// =========================================================================

export const listArtistBookings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: artist } = await supabase
      .from("artists").select("id").eq("owner_id", userId).maybeSingle();
    if (!artist) return { bookings: [] };
    const { data, error } = await supabase
      .from("bookings")
      .select("id, starts_at, ends_at, status, location_type, address, city, customer_name, customer_phone, total_paise, notes, artist_response, artist_response_note, responded_at, created_at")
      .eq("artist_id", artist.id)
      .order("starts_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return { bookings: data ?? [] };
  });

export const respondToBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    id: z.string().uuid(),
    action: z.enum(["accepted", "rejected"]),
    note: z.string().max(500).optional(),
  }).parse(i))
  .handler(async ({ data, context }) => {
    const artistId = await getOwnedArtistId(context.supabase, context.userId);
    const newStatus = data.action === "accepted" ? "confirmed" : "cancelled";
    const patch = {
      artist_response: data.action,
      artist_response_note: data.note ?? null,
      responded_at: new Date().toISOString(),
      status: newStatus as "confirmed" | "cancelled",
      ...(data.action === "rejected"
        ? { cancelled_at: new Date().toISOString(), cancellation_reason: data.note ?? "Declined by artist" }
        : {}),
    };
    const { error } = await context.supabase
      .from("bookings").update(patch)
      .eq("id", data.id).eq("artist_id", artistId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
