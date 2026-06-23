import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/welcome")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Welcome to GlowMe" },
      { name: "description", content: "Choose how you'd like to enter GlowMe — as a customer or as a beauty artist." },
    ],
    links: [
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,700;1,400&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=Jost:wght@200;300;400;500&display=swap" },
    ],
  }),
  component: WelcomePage,
});

function WelcomePage() {
  return (
    <div className="gm-welcome">
      <style>{`
        .gm-welcome{
          --black:#080808;--gold:#C9A96E;--gold-light:#E8D5A3;--gold-dark:#9A7A45;--cream:#F5F0E8;--muted:#8A7D70;
          min-height:100vh;background:radial-gradient(ellipse at center,#1a1410,#080808 70%);
          color:var(--cream);font-family:'Jost',sans-serif;font-weight:300;
          display:flex;flex-direction:column;align-items:center;justify-content:center;padding:48px 20px;position:relative;overflow:hidden;
        }
        .gm-welcome::before{content:'';position:absolute;inset:-20%;background:radial-gradient(circle at 50% 30%,rgba(201,169,110,0.14),transparent 55%);pointer-events:none;}
        .gm-w-logo{width:140px;height:auto;margin-bottom:28px;filter:drop-shadow(0 0 24px rgba(201,169,110,.35));position:relative;z-index:1;}
        .gm-w-title{font-family:'Playfair Display',serif;font-size:clamp(34px,5vw,52px);font-weight:400;text-align:center;margin:0 0 12px;letter-spacing:.02em;position:relative;z-index:1;}
        .gm-w-title em{font-style:italic;color:var(--gold);}
        .gm-w-sub{font-family:'Cormorant Garamond',serif;font-style:italic;color:rgba(245,240,232,.65);font-size:18px;margin-bottom:48px;text-align:center;max-width:520px;position:relative;z-index:1;}
        .gm-w-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px;max-width:880px;width:100%;position:relative;z-index:1;}
        .gm-w-card{
          display:flex;flex-direction:column;align-items:center;text-align:center;
          padding:48px 32px;border:0.5px solid rgba(201,169,110,.25);
          background:linear-gradient(180deg,rgba(26,23,20,.85),rgba(17,16,16,.95));
          text-decoration:none;color:var(--cream);transition:all .35s ease;cursor:pointer;
          position:relative;overflow:hidden;
        }
        .gm-w-card::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,var(--gold),transparent);opacity:.5;transition:opacity .35s;}
        .gm-w-card:hover{border-color:var(--gold);transform:translateY(-4px);box-shadow:0 30px 60px -20px rgba(0,0,0,.7),0 0 0 1px rgba(201,169,110,.15) inset;}
        .gm-w-card:hover::before{opacity:1;}
        .gm-w-icon{width:64px;height:64px;border:0.5px solid rgba(201,169,110,.5);display:flex;align-items:center;justify-content:center;border-radius:50%;color:var(--gold);font-size:28px;margin-bottom:24px;}
        .gm-w-h{font-family:'Playfair Display',serif;font-size:24px;font-weight:500;margin:0 0 8px;}
        .gm-w-h em{color:var(--gold);font-style:italic;}
        .gm-w-p{font-family:'Cormorant Garamond',serif;color:rgba(245,240,232,.55);font-size:15px;line-height:1.5;margin:0 0 24px;}
        .gm-w-btn{display:inline-block;padding:12px 28px;border:0.5px solid var(--gold);color:var(--gold);font-size:11px;letter-spacing:.22em;text-transform:uppercase;transition:all .3s;}
        .gm-w-card:hover .gm-w-btn{background:var(--gold);color:var(--black);}
        .gm-w-foot{margin-top:36px;font-size:12px;color:var(--muted);letter-spacing:.1em;position:relative;z-index:1;}
        .gm-w-foot a{color:var(--gold);text-decoration:none;}
      `}</style>
      <h1 className="gm-w-title" style={{fontSize:"clamp(48px,7vw,84px)",margin:"0 0 6px",letterSpacing:".02em"}}>
        Glow<em>Me</em>
      </h1>
      <p className="gm-w-sub">India's curated beauty marketplace. Choose how you'd like to enter.</p>
      <div style={{marginBottom:40}} />
      <div className="gm-w-grid">
        <Link to="/auth" className="gm-w-card">
          <div className="gm-w-icon">✦</div>
          <h2 className="gm-w-h">I'm a <em>Customer</em></h2>
          <p className="gm-w-p">Discover and book India's finest makeup, hair, and nail artists at top studios.</p>
          <span className="gm-w-btn">User Login / Register</span>
        </Link>
        <Link to="/artist/auth" className="gm-w-card">
          <div className="gm-w-icon">✧</div>
          <h2 className="gm-w-h">I'm a <em>Beauty Artist</em></h2>
          <p className="gm-w-p">Showcase your portfolio, manage bookings, and grow your business with GlowMe.</p>
          <span className="gm-w-btn">Artist Login / Register</span>
        </Link>
      </div>
      <p className="gm-w-foot">Already exploring? <Link to="/">Browse the marketplace →</Link></p>
    </div>
  );
}