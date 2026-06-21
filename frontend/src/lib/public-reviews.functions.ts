import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

export const listPublicReviews = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const { data, error } = await supabase
    .from("public_reviews")
    .select("id, author_name, rating, body, created_at")
    .order("created_at", { ascending: false })
    .limit(24);
  if (error) return { reviews: [] as Array<{ id: string; author_name: string; rating: number; body: string; created_at: string }> };
  return { reviews: data ?? [] };
});

export const createPublicReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { author_name: string; rating: number; body: string }) => {
    const author_name = String(d.author_name ?? "").trim().slice(0, 80);
    const body = String(d.body ?? "").trim().slice(0, 1000);
    const rating = Math.max(1, Math.min(5, Math.round(Number(d.rating) || 0)));
    if (!author_name) throw new Error("Name is required");
    if (!body) throw new Error("Review text is required");
    return { author_name, rating, body };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("public_reviews")
      .insert({ ...data, author_id: userId })
      .select("id, author_name, rating, body, created_at")
      .single();
    if (error) throw new Error(error.message);
    return { review: row };
  });
