import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import "@/styles/glowme.css";
import bodyHtml from "@/glowme.body.html?raw";
import inlineJs from "@/glowme.inline.js?raw";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GlowMe — Luxury Beauty Marketplace" },
      {
        name: "description",
        content:
          "India's luxury beauty marketplace. Book verified makeup artists, salons, and nail specialists with live calendars and AI-powered recommendations.",
      },
      { property: "og:title", content: "GlowMe — Luxury Beauty Marketplace" },
      {
        property: "og:description",
        content:
          "Discover and book India's finest makeup artists, curated salons, and nail specialists.",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,700;1,400;1,500&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Jost:wght@200;300;400;500&display=swap",
      },
    ],
  }),
  component: GlowMePage,
});

function GlowMePage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Load Razorpay checkout (external script in original <head>)
    const ensureRazorpay = () =>
      new Promise<void>((resolve) => {
        if (document.querySelector('script[data-glowme="razorpay"]')) {
          resolve();
          return;
        }
        const s = document.createElement("script");
        s.src = "https://checkout.razorpay.com/v1/checkout.js";
        s.async = true;
        s.dataset.glowme = "razorpay";
        s.onload = () => resolve();
        s.onerror = () => resolve();
        document.head.appendChild(s);
      });

    // 2. Inject all inline scripts as a single global script so the inline
    //    onclick="..." handlers in the markup can resolve to window globals.
    let injected: HTMLScriptElement | null = null;
    ensureRazorpay().then(() => {
      injected = document.createElement("script");
      injected.dataset.glowme = "inline";
      injected.text = inlineJs;
      document.body.appendChild(injected);

      // Manually fire DOMContentLoaded-style hooks (the document has already
      // finished parsing by the time React mounts this component).
      try {
        document.dispatchEvent(new Event("DOMContentLoaded"));
      } catch {}
    });

    return () => {
      if (injected && injected.parentNode) injected.parentNode.removeChild(injected);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      // The original page is a single, tightly-coupled document with inline
      // onclick handlers and DOM-id lookups. Rendering its body verbatim is
      // the only way to preserve the exact UI, animations and functionality
      // faithfully inside React.
      dangerouslySetInnerHTML={{ __html: bodyHtml }}
    />
  );
}
