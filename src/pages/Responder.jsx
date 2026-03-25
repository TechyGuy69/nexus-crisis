import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, orderBy, query, doc, updateDoc } from "firebase/firestore";
import ThemeToggle from "../components/ThemeToggle";
import LanguageSelector from "../components/LanguageSelector";
import { useLanguage } from "../context/LanguageContext";
import { useNavigate } from "react-router-dom";

const sevColor = { P1: "#E8473F", P2: "#F0A500", P3: "#4B8FE2" };

function timeAgo(ts) {
  if (!ts) return "just now";
  const diff = Math.floor((Date.now() - ts.toMillis()) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

// Voice message block so responders can hear the audio
function VoiceMessageBlock({ inc }) {
  if (!inc.message) return null;
  return (
    <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 12, padding: 16, marginBottom: 14, boxShadow: "var(--card-shadow)" }}>
      <div style={{ fontSize: 9, color: "var(--text3)", letterSpacing: "0.1em", marginBottom: 10, fontFamily: "'DM Mono',monospace" }}>
        {inc.voiceReport ? "VOICE MESSAGE" : "GUEST MESSAGE"}
      </div>
      {inc.voiceReport ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--purple)" }}>
            <span>🎤</span><span>Guest reported via voice recording</span>
          </div>
          {inc.audioURL && (
            <div style={{ background: "var(--bg3)", borderRadius: 10, padding: "10px 14px", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 8, fontFamily: "'DM Mono',monospace" }}>PLAY GUEST VOICE</div>
              <audio key={inc.audioURL} controls src={inc.audioURL} style={{ width: "100%", height: 36 }} />
            </div>
          )}
          <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.7, fontStyle: "italic", wordBreak: "break-word", padding: "10px 14px", background: "var(--bg3)", borderRadius: 8, borderLeft: "3px solid var(--purple)" }}>
            "{inc.message}"
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 14, color: "var(--text2)", lineHeight: 1.7, fontStyle: "italic", wordBreak: "break-word" }}>
          "{inc.message}"
        </div>
      )}
    </div>
  );
}

export default function Responder() {
  const { t } = useLanguage();
  const navigate = useNavigate(); // Added navigation hook
  const [incidents, setIncidents] = useState([]);
  const [selected, setSelected]   = useState(null);

  useEffect(() => {
    const q = query(collection(db, "incidents"), orderBy("timestamp", "desc"));
    return onSnapshot(q, snap => {
      setIncidents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  async function resolve(id) {
    await updateDoc(doc(db, "incidents", id), { status: "resolved" });
    setSelected(null);
  }

  // Changed to include "inprogress" so it matches the dashboard
  const active = incidents.filter(i => i.status === "active" || i.status === "inprogress");

  if (selected) return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", transition: "background 0.3s" }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "14px 20px", borderBottom: "1px solid var(--border)", background: "var(--bg2)"
      }}>
        <button onClick={() => setSelected(null)} style={{
          background: "transparent", border: "none", color: "var(--text2)",
          fontSize: 14, cursor: "pointer", padding: 0, fontFamily: "'Syne',sans-serif",
          display: "flex", alignItems: "center", gap: 4
        }}>← {t.backToList}</button>
        {/* NEXUS logo routes back to Dashboard */}
        <span onClick={() => navigate("/dashboard")} style={{ fontFamily: "'DM Mono',monospace", fontWeight: 700, color: "var(--red)", fontSize: 15, cursor: "pointer" }}>NEXUS</span>
        <div style={{ display: "flex", gap: 8 }}><LanguageSelector /><ThemeToggle /></div>
      </div>

      <div style={{ padding: 20, maxWidth: 480, margin: "0 auto" }}>
        <div style={{
          background: sevColor[selected.severity] + "18",
          border: `1px solid ${sevColor[selected.severity]}44`,
          borderRadius: 14, padding: 16, marginBottom: 16,
          display: "flex", alignItems: "center", gap: 12
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%",
            background: sevColor[selected.severity] + "25",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, flexShrink: 0
          }}>
            {selected.type === "Medical" ? "♥" : selected.type === "Fire" ? "▲" : selected.type === "Security" ? "◉" : "!"}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, color: "var(--text)" }}>{selected.type} Emergency</div>
            <div style={{ color: "var(--text2)", fontSize: 13, marginTop: 2 }}>Room {selected.room} · {timeAgo(selected.timestamp)}</div>
          </div>
        </div>

        <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 14, padding: 16, marginBottom: 14, boxShadow: "var(--card-shadow)" }}>
          <div style={{ fontSize: 10, color: "var(--purple)", letterSpacing: "0.12em", marginBottom: 8, fontFamily: "'DM Mono',monospace", display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--purple)", animation: "pulse 2s infinite" }} />
            {t.aiBriefing}
          </div>
          <div style={{ fontSize: 15, color: "var(--text)", lineHeight: 1.7, wordBreak: "break-word" }}>{selected.briefing}</div>
        </div>

        <div style={{ background: "var(--red-dim)", border: "1px solid var(--red-border)", borderRadius: 14, padding: 16, marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: "var(--red)", letterSpacing: "0.12em", marginBottom: 8, fontFamily: "'DM Mono',monospace" }}>
            {t.immediateAction}
          </div>
          <div style={{ fontSize: 16, color: "var(--text)", fontWeight: 700, lineHeight: 1.5, wordBreak: "break-word" }}>{selected.action}</div>
        </div>

        <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 14, padding: 16, marginBottom: 24, boxShadow: "var(--card-shadow)" }}>
          <div style={{ fontSize: 10, color: "var(--text3)", letterSpacing: "0.1em", marginBottom: 14, fontFamily: "'DM Mono',monospace" }}>{t.guestInfo}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {[
              { label: t.room,     val: selected.room },
              { label: t.guest,    val: selected.guestName || "Anonymous" },
              { label: t.severity, val: selected.severity },
              { label: t.eta,      val: `${selected.estimatedMinutes || 5} ${t.min}` },
            ].map(item => (
              <div key={item.label}>
                <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>{item.val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Audio Player */}
        <VoiceMessageBlock inc={selected} />

        <a href="tel:112" style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          textAlign: "center", padding: 16, background: "var(--red)", color: "#fff",
          borderRadius: 14, fontSize: 16, fontWeight: 700, textDecoration: "none", marginBottom: 12
        }}>{t.callEmergency}</a>

        <button onClick={() => resolve(selected.id)} style={{
          width: "100%", padding: 14, background: "var(--green)",
          color: "#fff", border: "none", borderRadius: 14,
          fontSize: 15, fontWeight: 700, cursor: "pointer", marginBottom: 32
        }}>{t.markAsResolved}</button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", transition: "background 0.3s" }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "14px 20px", borderBottom: "1px solid var(--border)", background: "var(--bg2)"
      }}>
        {/* Added Dashboard Navigation Button to Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={() => navigate("/dashboard")} style={{
            background: "var(--bg3)", border: "1px solid var(--border2)", color: "var(--text2)",
            fontSize: 13, cursor: "pointer", padding: "6px 12px", borderRadius: 8, fontFamily: "'Syne',sans-serif",
            display: "flex", alignItems: "center", gap: 6
          }}>
            ← {t.dashboard || "Dashboard"}
          </button>
          <div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontWeight: 700, color: "var(--red)", fontSize: 15 }}>NEXUS</div>
            <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 1 }}>{t.responderView}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}><LanguageSelector /><ThemeToggle /></div>
      </div>

      <div style={{ padding: 20, maxWidth: 480, margin: "0 auto" }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>{t.myAlerts}</h1>
          <p style={{ color: "var(--text2)", fontSize: 13 }}>Byte Club Pvt Ltd · Live feed</p>
        </div>

        {active.length > 0 && (
          <div style={{
            background: "var(--red-dim)", border: "1px solid var(--red-border)",
            borderRadius: 12, padding: "10px 16px", marginBottom: 20,
            display: "flex", alignItems: "center", gap: 10
          }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--red)", animation: "pulse 1s infinite", flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: "var(--red)", fontWeight: 600 }}>
              {active.length} {active.length > 1 ? t.needResponsePlural : t.needResponse}
            </span>
          </div>
        )}

        {active.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text3)" }}>
            <div style={{ fontSize: 48, marginBottom: 14 }}>✓</div>
            <div style={{ fontSize: 16, color: "var(--text2)", fontWeight: 600 }}>{t.allClear}</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>{t.noActiveIncidents}</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {active.map(inc => (
              <div key={inc.id} onClick={() => setSelected(inc)} style={{
                background: "var(--bg2)",
                border: `1px solid ${sevColor[inc.severity]}44`,
                borderLeft: `4px solid ${sevColor[inc.severity]}`,
                borderRadius: 14, padding: 16, cursor: "pointer",
                boxShadow: "var(--card-shadow)", transition: "transform 0.15s"
              }}
                onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 16, color: "var(--text)" }}>{inc.type}</span>
                  <span style={{
                    fontSize: 11, padding: "3px 10px", borderRadius: 20,
                    background: sevColor[inc.severity] + "20", color: sevColor[inc.severity],
                    fontFamily: "'DM Mono',monospace", fontWeight: 600
                  }}>{inc.severity}</span>
                </div>
                <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 8 }}>
                  Room {inc.room} · {inc.guestName || "Anonymous"} · {timeAgo(inc.timestamp)}
                </div>
                <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.5, marginBottom: 12, wordBreak: "break-word" }}>
                  {inc.briefing?.slice(0, 90)}...
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "var(--amber)", fontWeight: 600 }}>
                    ⚡ {inc.action?.slice(0, 45)}...
                  </span>
                  <span style={{ fontSize: 12, color: "var(--red)", fontWeight: 700 }}>
                    {t.tapToView}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }`}</style>
    </div>
  );
}