import { useEffect, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";

export function SplashScreen() {
  const [show, setShow] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("gm_splash_done") === "1") {
      setShow(false);
      return;
    }
    const leaveT = window.setTimeout(() => setLeaving(true), 3200);
    const hideT = window.setTimeout(() => {
      setShow(false);
      sessionStorage.setItem("gm_splash_done", "1");
      if (pathname === "/") navigate({ to: "/welcome" });
    }, 3900);
    return () => {
      window.clearTimeout(leaveT);
      window.clearTimeout(hideT);
    };
  }, [navigate, pathname]);

  if (!show) return null;

  const sparkles = Array.from({ length: 22 });

  return (
    <div className={`gm-splash${leaving ? " gm-splash-out" : ""}`} aria-hidden>
      <style>{`
        .gm-splash{
          position:fixed;inset:0;z-index:9999;
          background:radial-gradient(ellipse at center,#1a1410 0%,#0a0807 50%,#050403 100%);
          display:flex;flex-direction:column;align-items:center;justify-content:center;gap:36px;
          overflow:hidden;opacity:1;transition:opacity .7s ease;
          font-family:'Playfair Display',serif;
        }
        .gm-splash-out{opacity:0;pointer-events:none;}
        .gm-splash::before{
          content:'';position:absolute;inset:-20%;
          background:radial-gradient(circle at center,rgba(201,169,110,0.18),transparent 55%);
          filter:blur(40px);animation:gmGlow 2.6s ease-in-out infinite alternate;
        }
        @keyframes gmGlow{from{opacity:.55;transform:scale(.95)}to{opacity:1;transform:scale(1.08)}}
        .gm-logo-text{
          position:relative;z-index:2;
          font-family:'Playfair Display',serif;
          font-size:clamp(56px,10vw,120px);
          font-weight:700;letter-spacing:.02em;line-height:1;
          color:#F5F0E8;opacity:0;transform:translateY(8px);
          animation:gmReveal 1.1s cubic-bezier(.2,.7,.2,1) .2s forwards;
          text-shadow:0 0 40px rgba(201,169,110,.35);
        }
        .gm-logo-text em{
          font-style:italic;
          background:linear-gradient(90deg,#9A7A45 0%,#E8D5A3 45%,#C9A96E 60%,#E8D5A3 80%,#9A7A45 100%);
          background-size:200% 100%;
          -webkit-background-clip:text;background-clip:text;color:transparent;
          animation:gmSweep 2.6s linear .9s infinite;
        }
        .gm-logo-sub{
          position:relative;z-index:2;font-family:'Cormorant Garamond',serif;font-style:italic;
          color:rgba(232,213,163,.7);font-size:13px;letter-spacing:.45em;text-transform:uppercase;
          opacity:0;animation:gmFade .9s ease 1.0s forwards;margin-top:-22px;
        }
        @keyframes gmReveal{to{opacity:1;transform:translateY(0)}}
        @keyframes gmSweep{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes gmFade{to{opacity:1}}
        .gm-sparkle{
          position:absolute;border-radius:50%;
          background:#E8D5A3;box-shadow:0 0 8px rgba(232,213,163,.9),0 0 14px rgba(201,169,110,.6);
          opacity:0;
        }
        @keyframes gmFloat{0%{transform:translate(0,0) scale(.4);opacity:0}25%{opacity:1}100%{transform:translate(var(--dx),var(--dy)) scale(1);opacity:0}}
      `}</style>
      {sparkles.map((_, i) => {
        const left = Math.random() * 100;
        const top = 20 + Math.random() * 60;
        const dx = (Math.random() - 0.5) * 140;
        const dy = -(40 + Math.random() * 140);
        const delay = Math.random() * 1.8;
        const dur = 2.6 + Math.random() * 1.8;
        const size = 2 + Math.random() * 4;
        return (
          <span
            key={i}
            className="gm-sparkle"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              width: `${size}px`,
              height: `${size}px`,
              ["--dx" as never]: `${dx}px`,
              ["--dy" as never]: `${dy}px`,
              animation: `gmFloat ${dur}s ease-out ${delay}s infinite`,
            }}
          />
        );
      })}
      <div className="gm-logo-text">Glow<em>Me</em></div>
      <div className="gm-logo-sub">Beauty Marketplace</div>
    </div>
  );
}