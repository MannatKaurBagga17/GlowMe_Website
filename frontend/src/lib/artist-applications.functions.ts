import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

function client() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

type Input = {
  full_name: string;
  whatsapp: string;
  email: string;
  city: string;
  area: string;
  studio_address: string;
  pincode: string;
  years_experience: number;
  specialities: string[];
  services_pricing: string;
  working_days: string;
  working_hours: string;
  studio_photos?: string;
  aadhaar_number: string;
  address_proof?: string;
  portfolio_link: string;
  work_photos?: string;
  bank_account: string;
  ifsc: string;
  upi_id: string;
};

export const submitArtistApplication = createServerFn({ method: "POST" })
  .inputValidator((d: Input) => {
    const req = (v: unknown, name: string, max = 500) => {
      const s = String(v ?? "").trim();
      if (!s) throw new Error(`${name} is required`);
      return s.slice(0, max);
    };
    return {
      full_name: req(d.full_name, "Full name", 120),
      whatsapp: req(d.whatsapp, "WhatsApp number", 20),
      email: req(d.email, "Email", 200),
      city: req(d.city, "City", 80),
      area: req(d.area, "Area", 120),
      studio_address: req(d.studio_address, "Studio address", 500),
      pincode: req(d.pincode, "Pincode", 10),
      years_experience: Math.max(0, Math.min(80, Math.round(Number(d.years_experience) || 0))),
      specialities: (Array.isArray(d.specialities) ? d.specialities : []).map((s) => String(s).slice(0, 60)).slice(0, 10),
      services_pricing: req(d.services_pricing, "Services & pricing", 2000),
      working_days: req(d.working_days, "Working days", 120),
      working_hours: req(d.working_hours, "Working hours", 120),
      studio_photos: String(d.studio_photos ?? "").slice(0, 1000) || null,
      aadhaar_number: req(d.aadhaar_number, "Aadhaar number", 20),
      address_proof: String(d.address_proof ?? "").slice(0, 500) || null,
      portfolio_link: req(d.portfolio_link, "Portfolio link", 500),
      work_photos: String(d.work_photos ?? "").slice(0, 1000) || null,
      bank_account: req(d.bank_account, "Bank account", 40),
      ifsc: req(d.ifsc, "IFSC code", 20),
      upi_id: req(d.upi_id, "UPI ID", 80),
    };
  })
  .handler(async ({ data }) => {
    const supabase = client();
    const { error } = await supabase.from("artist_applications" as never).insert(data as never);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
