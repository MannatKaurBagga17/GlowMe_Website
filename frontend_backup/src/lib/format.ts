export const formatINR = (paise: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(
    (paise || 0) / 100,
  );

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

export const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });

export const formatDateTime = (iso: string) => `${formatDate(iso)} · ${formatTime(iso)}`;
