import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { submitArtistApplication } from "@/lib/artist-applications.functions";

export const Route = createFileRoute("/apply-artist")({
  head: () => ({
    meta: [
      { title: "Apply as Artist — GlowMe" },
      { name: "description", content: "Join GlowMe — apply as a verified makeup artist or studio. Keep 85% of every booking with 48-hour payouts." },
      { property: "og:title", content: "Apply as Artist — GlowMe" },
      { property: "og:description", content: "Become a GlowMe verified artist. List your portfolio, set your prices, get bookings." },
    ],
  }),
  component: ApplyArtistPage,
});

const SPECIALITIES = ["Bridal", "Party", "HD-Airbrush", "Nail Extensions"] as const;

function ApplyArtistPage() {
  const submit = useServerFn(submitArtistApplication);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [specs, setSpecs] = useState<string[]>([]);

  function toggleSpec(s: string) {
    setSpecs((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const data = {
      full_name: String(fd.get("full_name") || ""),
      whatsapp: String(fd.get("whatsapp") || ""),
      email: String(fd.get("email") || ""),
      city: String(fd.get("city") || ""),
      area: String(fd.get("area") || ""),
      studio_address: String(fd.get("studio_address") || ""),
      pincode: String(fd.get("pincode") || ""),
      years_experience: Number(fd.get("years_experience") || 0),
      specialities: specs,
      services_pricing: String(fd.get("services_pricing") || ""),
      working_days: String(fd.get("working_days") || ""),
      working_hours: String(fd.get("working_hours") || ""),
      studio_photos: String(fd.get("studio_photos") || ""),
      aadhaar_number: String(fd.get("aadhaar_number") || ""),
      address_proof: String(fd.get("address_proof") || ""),
      portfolio_link: String(fd.get("portfolio_link") || ""),
      work_photos: String(fd.get("work_photos") || ""),
      bank_account: String(fd.get("bank_account") || ""),
      ifsc: String(fd.get("ifsc") || ""),
      upi_id: String(fd.get("upi_id") || ""),
    };
    try {
      if (specs.length === 0) throw new Error("Select at least one speciality");
      await submit({ data });
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.topbar}>
        <Link to="/" style={styles.brand}>
          Glow<span style={{ color: GOLD }}>Me</span>
        </Link>
        <Link to="/" style={styles.backLink}>
          ← Back to home
        </Link>
      </div>

      <div style={styles.container}>
        <div style={styles.label}>Join the platform</div>
        <h1 style={styles.title}>
          Apply as <em style={{ color: GOLD, fontStyle: "italic" }}>Artist</em>
        </h1>
        <div style={styles.divider} />
        <p style={styles.lede}>
          List your portfolio, set your own prices, and receive bookings directly. GlowMe handles payments, disputes and
          client management. Keep 85% of every booking with payouts within 48 hours.
        </p>

        {done ? (
          <div style={styles.success}>
            <div style={styles.successTitle}>Application received</div>
            <p style={styles.successBody}>
              Thank you. Our partnerships team will review your application and reach out on WhatsApp within 48 hours.
            </p>
            <Link to="/" style={{ ...styles.btnGold, display: "inline-block", marginTop: 24 }}>
              Return home
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} style={styles.form}>
            <Section title="Basic Information">
              <Field label="Full legal name" name="full_name" required />
              <Row>
                <Field label="WhatsApp number" name="whatsapp" required placeholder="+91 98765 43210" />
                <Field label="Email address" name="email" type="email" required />
              </Row>
              <Row>
                <Field label="City" name="city" required />
                <Field label="Area" name="area" required />
              </Row>
              <Field label="Full studio / salon address" name="studio_address" required textarea />
              <Field label="Pin code" name="pincode" required />
            </Section>

            <Section title="Professional Information">
              <Row>
                <Field label="Years of experience" name="years_experience" type="number" required />
                <div style={styles.fieldWrap}>
                  <label style={styles.fieldLabel}>Speciality</label>
                  <div style={styles.chipRow}>
                    {SPECIALITIES.map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => toggleSpec(s)}
                        style={{
                          ...styles.chip,
                          ...(specs.includes(s) ? styles.chipActive : null),
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </Row>
              <Field
                label="Services offered with prices"
                name="services_pricing"
                required
                textarea
                placeholder="Bridal makeup — ₹15,000 · Party makeup — ₹4,000 · HD airbrush — ₹8,000"
              />
              <Field
                label="2–3 clear photos of the studio interior (links)"
                name="studio_photos"
                placeholder="Paste image URLs separated by commas"
                textarea
              />
              <Row>
                <Field label="Working days" name="working_days" required placeholder="Mon – Sat" />
                <Field label="Working hours" name="working_hours" required placeholder="10:00 AM – 8:00 PM" />
              </Row>
            </Section>

            <Section title="Verification Documents">
              <Field label="Aadhaar number (kept private)" name="aadhaar_number" required />
              <Field
                label="Studio address proof (link — rent agreement, electricity bill, shop reg.)"
                name="address_proof"
                placeholder="Drive / Dropbox link"
              />
              <Field
                label="Portfolio link (Instagram or Google Drive)"
                name="portfolio_link"
                required
                placeholder="https://instagram.com/yourhandle"
              />
              <Field
                label="5 genuine work photos (links)"
                name="work_photos"
                textarea
                placeholder="Paste image URLs separated by commas"
              />
            </Section>

            <Section title="Payment Details">
              <Row>
                <Field label="Bank account number" name="bank_account" required />
                <Field label="IFSC code" name="ifsc" required />
              </Row>
              <Field label="UPI ID" name="upi_id" required placeholder="yourname@upi" />
            </Section>

            {error && <div style={styles.error}>{error}</div>}

            <button type="submit" disabled={busy} style={styles.btnGold}>
              {busy ? "Submitting…" : "Submit application"}
            </button>
            <p style={styles.fineprint}>
              By submitting you agree to GlowMe's artist terms. Our team verifies every applicant before listing.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={styles.section}>
      <h2 style={styles.sectionTitle}>{title}</h2>
      <div style={styles.sectionGoldLine} />
      <div style={styles.sectionBody}>{children}</div>
    </section>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div style={styles.row}>{children}</div>;
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
  textarea,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  textarea?: boolean;
}) {
  return (
    <div style={styles.fieldWrap}>
      <label style={styles.fieldLabel}>
        {label}
        {required && <span style={{ color: GOLD, marginLeft: 4 }}>*</span>}
      </label>
      {textarea ? (
        <textarea name={name} required={required} placeholder={placeholder} style={{ ...styles.input, minHeight: 90, resize: "vertical" }} />
      ) : (
        <input name={name} type={type} required={required} placeholder={placeholder} style={styles.input} />
      )}
    </div>
  );
}

const BLACK = "#0A0908";
const SURFACE = "#15110D";
const GOLD = "#C9A96E";
const CREAM = "#F5F0E8";
const MUTED = "rgba(245,240,232,0.6)";
const BORDER = "rgba(201,169,110,0.25)";

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: BLACK,
    color: CREAM,
    fontFamily: "'Jost', system-ui, sans-serif",
    paddingBottom: 80,
  },
  topbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "22px 32px",
    borderBottom: `1px solid ${BORDER}`,
  },
  brand: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 24,
    color: CREAM,
    textDecoration: "none",
    letterSpacing: "0.04em",
  },
  backLink: {
    color: GOLD,
    textDecoration: "none",
    fontSize: 12,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
  },
  container: {
    maxWidth: 820,
    margin: "0 auto",
    padding: "60px 24px 0",
  },
  label: {
    fontSize: 11,
    letterSpacing: "0.28em",
    textTransform: "uppercase",
    color: GOLD,
    marginBottom: 18,
  },
  title: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 52,
    fontWeight: 400,
    lineHeight: 1.05,
    margin: 0,
    color: CREAM,
  },
  divider: {
    width: 60,
    height: 1,
    background: GOLD,
    margin: "28px 0 22px",
  },
  lede: {
    color: MUTED,
    fontSize: 15,
    lineHeight: 1.7,
    maxWidth: 640,
    marginBottom: 56,
  },
  form: { display: "flex", flexDirection: "column", gap: 52 },
  section: {
    background: SURFACE,
    border: `1px solid ${BORDER}`,
    padding: "36px 32px",
  },
  sectionTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 22,
    fontWeight: 400,
    margin: 0,
    color: CREAM,
    letterSpacing: "0.02em",
  },
  sectionGoldLine: { width: 40, height: 1, background: GOLD, margin: "16px 0 28px" },
  sectionBody: { display: "flex", flexDirection: "column", gap: 22 },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 },
  fieldWrap: { display: "flex", flexDirection: "column", gap: 8 },
  fieldLabel: {
    fontSize: 11,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: MUTED,
  },
  input: {
    background: BLACK,
    border: `1px solid ${BORDER}`,
    color: CREAM,
    padding: "14px 16px",
    fontFamily: "inherit",
    fontSize: 14,
    outline: "none",
  },
  chipRow: { display: "flex", flexWrap: "wrap", gap: 8 },
  chip: {
    background: "transparent",
    border: `1px solid ${BORDER}`,
    color: CREAM,
    padding: "10px 16px",
    fontSize: 12,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  chipActive: { background: GOLD, color: BLACK, borderColor: GOLD },
  btnGold: {
    background: GOLD,
    color: BLACK,
    border: 0,
    padding: "18px 36px",
    fontFamily: "inherit",
    fontSize: 13,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    cursor: "pointer",
    textDecoration: "none",
    textAlign: "center",
  },
  fineprint: { color: MUTED, fontSize: 12, marginTop: 6 },
  error: {
    border: `1px solid #c85050`,
    color: "#ffb3b3",
    padding: "12px 16px",
    fontSize: 13,
    background: "rgba(200,80,80,0.08)",
  },
  success: {
    background: SURFACE,
    border: `1px solid ${BORDER}`,
    padding: "48px 36px",
    textAlign: "center",
  },
  successTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 32,
    color: GOLD,
    marginBottom: 16,
  },
  successBody: { color: MUTED, fontSize: 15, lineHeight: 1.7 },
};
