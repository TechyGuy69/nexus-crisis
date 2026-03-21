import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import ThemeToggle from "../components/ThemeToggle";

const STATS = [
  { val: "<90s", label: "Avg response"    },
  { val: "AI",   label: "Gemini powered"  },
  { val: "24/7", label: "Monitoring"      },
  { val: "0",    label: "Info lost"       },
];

const FEATURES = [
  { icon: "◉", title: "Instant Detection",  color: "#E8473F",
    desc: "Guest scans QR, selects crisis. Gemini classifies severity and generates staff briefing in under 2 seconds." },
  { icon: "⬡", title: "Live Coordination",  color: "#4B8FE2",
    desc: "Real-time venue map with crisis pins. Auto-assigned responders. Every staff member sees the same picture." },
  { icon: "◈", title: "EMS Handoff",        color: "#F0A500",
    desc: "One tap sends a structured briefing to emergency services. No verbal relay. No information loss." },
  { icon: "▲", title: "Post-Incident AI",   color: "#4CAF7D",
    desc: "AI-generated reports. Analytics dashboard. Guest feedback. Every crisis makes the system smarter." },
];

export default function Landing() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => { clearTimeout(t); window.removeEventListener("resize", handler); };
  }, []);

  return (
    <div style={{
      minHeight: "100vh", background: "var(--bg)",
      overflow: "hidden", position: "relative",
      transition: "background 0.3s"
    }}>

      {/* Background glow */}
      <div style={{
        position: "fixed", top: "-10%", left: "50%",
        transform: "translateX(-50%)",
        width: isMobile ? 300 : 600,
        height: isMobile ? 300 : 600,
        borderRadius: "50%",
        background: isDark
          ? "radial-gradient(circle, #E8473F12 0%, transparent 70%)"
          : "radial-gradient(circle, #d63c3408 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0
      }} />

      {/* Grid lines */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        backgroundImage: isDark
          ? `linear-gradient(#ffffff04 1px, transparent 1px), linear-gradient(90deg, #ffffff04 1px, transparent 1px)`
          : `linear-gradient(#00000006 1px, transparent 1px), linear-gradient(90deg, #00000006 1px, transparent 1px)`,
        backgroundSize: isMobile ? "40px 40px" : "60px 60px"
      }} />

      {/* Nav */}
      <nav style={{
        position: "relative", zIndex: 10,
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        padding: isMobile ? "16px" : "20px 40px",
        borderBottom: "1px solid var(--border)"
      }}>
        <div style={{
          fontFamily: "'DM Mono',monospace",
          fontSize: 16, fontWeight: 500,
          color: "var(--red)", letterSpacing: "0.08em"
        }}>NEXUS</div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <ThemeToggle />
          {!isMobile && (
            <button onClick={() => navigate("/login")} style={{
              padding: "8px 20px", background: "transparent",
              border: "1px solid var(--border2)", borderRadius: 8,
              color: "var(--text2)", fontSize: 13, cursor: "pointer"
            }}>Staff Login</button>
          )}
          <button onClick={() => navigate("/report")} style={{
            padding: isMobile ? "8px 16px" : "8px 20px",
            background: "var(--red)", border: "none", borderRadius: 8,
            color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer"
          }}>
            {isMobile ? "SOS" : "Report Emergency"}
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{
        position: "relative", zIndex: 1,
        maxWidth: 900, margin: "0 auto",
        padding: isMobile ? "48px 20px 40px" : "80px 40px 60px",
        textAlign: "center"
      }}>

        {/* Badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "var(--red-dim)", border: "1px solid var(--red-border)",
          borderRadius: 20, padding: "6px 14px", marginBottom: 24,
          animation: mounted ? "fadeUp 0.5s ease both" : "none",
          opacity: mounted ? 1 : 0
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: "50%",
            background: "var(--red)", animation: "pulse 1.5s infinite"
          }} />
          <span style={{
            fontSize: isMobile ? 10 : 12, color: "var(--red)",
            fontFamily: "'DM Mono',monospace", letterSpacing: "0.08em"
          }}>
            {isMobile ? "BYTE CLUB · CRISIS RESPONSE" : "BYTE CLUB PVT LTD · CRISIS RESPONSE SYSTEM"}
          </span>
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: isMobile ? "clamp(34px,10vw,46px)" : "clamp(48px,7vw,80px)",
          fontWeight: 800, lineHeight: 1.05,
          letterSpacing: "-0.03em", marginBottom: 20,
          animation: mounted ? "fadeUp 0.5s 0.1s ease both" : "none",
          opacity: mounted ? 1 : 0,
          color: "var(--text)"
        }}>
          Every second<br />
          <span style={{ color: "transparent", WebkitTextStroke: `1px var(--red)` }}>counts.</span>
          <span style={{ color: "var(--red)" }}> Don't</span><br />
          waste any.
        </h1>

        <p style={{
          fontSize: isMobile ? 15 : 18, color: "var(--text2)",
          maxWidth: 520, margin: "0 auto 36px", lineHeight: 1.7,
          animation: mounted ? "fadeUp 0.5s 0.15s ease both" : "none",
          opacity: mounted ? 1 : 0
        }}>
          AI-powered crisis coordination that eliminates fragmented communication
          between guests, staff, and emergency services.
        </p>

        {/* CTAs */}
        <div style={{
          display: "flex", gap: 10, justifyContent: "center",
          flexWrap: "wrap", marginBottom: isMobile ? 40 : 64,
          animation: mounted ? "fadeUp 0.5s 0.2s ease both" : "none",
          opacity: mounted ? 1 : 0
        }}>
          <button onClick={() => navigate("/report")} style={{
            padding: isMobile ? "14px 28px" : "16px 36px",
            background: "var(--red)", color: "#fff",
            border: "none", borderRadius: 12,
            fontSize: isMobile ? 14 : 16, fontWeight: 700,
            cursor: "pointer", animation: "glow 3s ease-in-out infinite"
          }}>Report Emergency</button>
          <button onClick={() => navigate("/login")} style={{
            padding: isMobile ? "14px 24px" : "16px 36px",
            background: "transparent", color: "var(--text)",
            border: "1px solid var(--border2)", borderRadius: 12,
            fontSize: isMobile ? 14 : 16, fontWeight: 600, cursor: "pointer"
          }}>Staff Dashboard →</button>
        </div>

        {/* Stats */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(4,1fr)",
          gap: 1, background: "var(--border)",
          border: "1px solid var(--border)", borderRadius: 16,
          overflow: "hidden", maxWidth: 580,
          margin: "0 auto 60px",
          animation: mounted ? "fadeUp 0.5s 0.25s ease both" : "none",
          opacity: mounted ? 1 : 0,
          boxShadow: "var(--card-shadow)"
        }}>
          {STATS.map((s, i) => (
            <div key={i} style={{
              background: "var(--bg2)",
              padding: isMobile ? "14px 8px" : "20px 16px",
              textAlign: "center"
            }}>
              <div style={{
                fontSize: isMobile ? 20 : 26, fontWeight: 800,
                color: "var(--red)", fontFamily: "'DM Mono',monospace",
                marginBottom: 4
              }}>{s.val}</div>
              <div style={{
                fontSize: isMobile ? 9 : 11,
                color: "var(--text3)", letterSpacing: "0.04em"
              }}>{s.label.toUpperCase()}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div style={{
        position: "relative", zIndex: 1,
        maxWidth: 900, margin: "0 auto",
        padding: isMobile ? "0 16px 48px" : "0 40px 80px"
      }}>
        <div style={{ textAlign: "center", marginBottom: isMobile ? 28 : 48 }}>
          <div style={{
            fontSize: 10, color: "var(--text3)",
            letterSpacing: "0.14em", marginBottom: 10,
            fontFamily: "'DM Mono',monospace"
          }}>HOW IT WORKS</div>
          <h2 style={{
            fontSize: isMobile ? 24 : 32, fontWeight: 800,
            letterSpacing: "-0.02em", color: "var(--text)"
          }}>Built for the worst moments</h2>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(2,1fr)",
          gap: isMobile ? 10 : 16
        }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{
              background: "var(--bg2)",
              border: "1px solid var(--border)",
              borderRadius: 16,
              padding: isMobile ? 20 : 28,
              animation: `fadeUp 0.5s ease ${0.1 * i}s both`,
              transition: "border-color 0.2s, background 0.3s",
              boxShadow: "var(--card-shadow)"
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = f.color + "55"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: f.color + "18",
                border: "1px solid " + f.color + "33",
                display: "flex", alignItems: "center",
                justifyContent: "center",
                fontSize: 18, color: f.color, marginBottom: 16
              }}>{f.icon}</div>
              <h3 style={{
                fontSize: 16, fontWeight: 700,
                marginBottom: 8, color: "var(--text)"
              }}>{f.title}</h3>
              <p style={{
                fontSize: 13, color: "var(--text2)", lineHeight: 1.7
              }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div style={{
        position: "relative", zIndex: 1, textAlign: "center",
        padding: isMobile ? "40px 20px 60px" : "60px 40px 80px",
        borderTop: "1px solid var(--border)"
      }}>
        <h2 style={{
          fontSize: isMobile ? 26 : 36, fontWeight: 800,
          marginBottom: 14, letterSpacing: "-0.02em", color: "var(--text)"
        }}>Ready to respond faster?</h2>
        <p style={{ color: "var(--text2)", fontSize: isMobile ? 14 : 16, marginBottom: 28 }}>
          Demo the full system right now.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => navigate("/report")} style={{
            padding: isMobile ? "12px 24px" : "14px 32px",
            background: "var(--red)", color: "#fff", border: "none",
            borderRadius: 12, fontSize: isMobile ? 14 : 15,
            fontWeight: 700, cursor: "pointer"
          }}>Try Guest Panic Button</button>
          <button onClick={() => navigate("/login")} style={{
            padding: isMobile ? "12px 20px" : "14px 32px",
            background: "transparent", color: "var(--text)",
            border: "1px solid var(--border2)", borderRadius: 12,
            fontSize: isMobile ? 14 : 15, fontWeight: 600, cursor: "pointer"
          }}>Open Command Center</button>
        </div>
      </div>
    </div>
  );
}