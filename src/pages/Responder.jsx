import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, orderBy, query, doc, updateDoc } from "firebase/firestore";
import ThemeToggle from "../components/ThemeToggle";

const sevColor = { P1: "#E8473F", P2: "#F0A500", P3: "#4B8FE2" };

function timeAgo(ts) {
  if (!ts) return "just now";
  const diff = Math.floor((Date.now() - ts.toMillis()) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function Responder() {
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

  const active = incidents.filter(i => i.status === "active" || i.status === "responding");

  if (selected) return (
    <div style={{
      minHeight: "100vh", background: "var(--bg)",
      transition: "background 0.3s"
    }}>
      {/* Top bar */}
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center", padding: "14px 20px",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg2)"
      }}>
        <button onClick={() => setSelected(null)} style={{
          background: "transparent", border: "none",
          color: "var(--text2)", fontSize: 14,
          cursor: "pointer", padding: 0,
          fontFamily: "'Syne',sans-serif"
        }}>← Back</button>
        <span style={{
          fontFamily: "'DM Mono',monospace",
          fontWeight: 700, color: "var(--red)", fontSize: 15
        }}>NEXUS</span>
        <ThemeToggle />
      </div>

      <div style={{ padding: 20, maxWidth: 480, margin: "0 auto" }}>

        {/* Alert banner */}
        <div style={{
          background: sevColor[selected.severity] + "18",
          border: `1px solid ${sevColor[selected.severity]}44`,
          borderRadius: 14, padding: 16, marginBottom: 16,
          display: "flex", alignItems: "center", gap: 12
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%",
            background: sevColor[selected.severity] + "25",
            display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 22, flexShrink: 0
          }}>
            {selected.type === "Medical"  ? "♥" :
             selected.type === "Fire"     ? "▲" :
             selected.type === "Security" ? "◉" : "!"}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, color: "var(--text)" }}>
              {selected.type} Emergency
            </div>
            <div style={{ color: "var(--text2)", fontSize: 13, marginTop: 2 }}>
              Room {selected.room} · {timeAgo(selected.timestamp)}
            </div>
          </div>
        </div>

        {/* AI Briefing */}
        <div style={{
          background: "var(--bg2)", border: "1px solid var(--border)",
          borderRadius: 14, padding: 16, marginBottom: 14,
          boxShadow: "var(--card-shadow)"
        }}>
          <div style={{
            fontSize: 10, color: "var(--purple)",
            letterSpacing: "0.12em", marginBottom: 10,
            fontFamily: "'DM Mono',monospace",
            display: "flex", alignItems: "center", gap: 6
          }}>
            <div style={{
              width: 5, height: 5, borderRadius: "50%",
              background: "var(--purple)", animation: "pulse 2s infinite"
            }} />
            AI BRIEFING
          </div>
          <div style={{
            fontSize: 15, color: "var(--text)", lineHeight: 1.7
          }}>{selected.briefing}</div>
        </div>

        {/* Immediate action */}
        <div style={{
          background: "var(--red-dim)",
          border: "1px solid var(--red-border)",
          borderRadius: 14, padding: 16, marginBottom: 14
        }}>
          <div style={{
            fontSize: 10, color: "var(--red)",
            letterSpacing: "0.12em", marginBottom: 10,
            fontFamily: "'DM Mono',monospace"
          }}>⚡ YOUR IMMEDIATE ACTION</div>
          <div style={{
            fontSize: 16, color: "var(--text)",
            fontWeight: 700, lineHeight: 1.5
          }}>{selected.action}</div>
        </div>

        {/* Guest info */}
        <div style={{
          background: "var(--bg2)", border: "1px solid var(--border)",
          borderRadius: 14, padding: 16, marginBottom: 24,
          boxShadow: "var(--card-shadow)"
        }}>
          <div style={{
            fontSize: 10, color: "var(--text3)",
            letterSpacing: "0.1em", marginBottom: 14,
            fontFamily: "'DM Mono',monospace"
          }}>GUEST INFO</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {[
              { label: "Room",     val: selected.room },
              { label: "Guest",    val: selected.guestName || "Anonymous" },
              { label: "Severity", val: selected.severity },
              { label: "ETA",      val: `${selected.estimatedMinutes || 5} min` },
            ].map(item => (
              <div key={item.label}>
                <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 4 }}>
                  {item.label}
                </div>
                <div style={{
                  fontSize: 16, fontWeight: 700, color: "var(--text)"
                }}>{item.val}</div>
              </div>
            ))}
          </div>
          {selected.message && (
            <div style={{
              marginTop: 14, paddingTop: 14,
              borderTop: "1px solid var(--border)"
            }}>
              <div style={{
                fontSize: 11, color: "var(--text3)", marginBottom: 6
              }}>GUEST MESSAGE</div>
              <div style={{
                fontSize: 13, color: "var(--text2)",
                fontStyle: "italic", lineHeight: 1.6
              }}>"{selected.message}"</div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <a href="tel:112" style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 8, textAlign: "center", padding: 16,
          background: "var(--red)", color: "#fff", borderRadius: 14,
          fontSize: 16, fontWeight: 700, textDecoration: "none", marginBottom: 12
        }}>
          📞 Call 112 Emergency
        </a>

        <button onClick={() => resolve(selected.id)} style={{
          width: "100%", padding: 14, background: "var(--green)",
          color: "#fff", border: "none", borderRadius: 14,
          fontSize: 15, fontWeight: 700, cursor: "pointer"
        }}>
          Mark as Resolved ✓
        </button>
      </div>
    </div>
  );

  return (
    <div style={{
      minHeight: "100vh", background: "var(--bg)",
      transition: "background 0.3s"
    }}>
      {/* Top bar */}
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center", padding: "14px 20px",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg2)"
      }}>
        <div>
          <div style={{
            fontFamily: "'DM Mono',monospace",
            fontWeight: 700, color: "var(--red)", fontSize: 15
          }}>NEXUS</div>
          <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 1 }}>
            Responder View
          </div>
        </div>
        <ThemeToggle />
      </div>

      <div style={{ padding: 20, maxWidth: 480, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{
            fontSize: 24, fontWeight: 800,
            color: "var(--text)", marginBottom: 4
          }}>My Alerts</h1>
          <p style={{ color: "var(--text2)", fontSize: 13 }}>
            Byte Club Pvt Ltd · Live feed
          </p>
        </div>

        {/* Active banner */}
        {active.length > 0 && (
          <div style={{
            background: "var(--red-dim)",
            border: "1px solid var(--red-border)",
            borderRadius: 12, padding: "10px 16px", marginBottom: 20,
            display: "flex", alignItems: "center", gap: 10
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: "var(--red)", animation: "pulse 1s infinite",
              flexShrink: 0
            }} />
            <span style={{
              fontSize: 13, color: "var(--red)", fontWeight: 600
            }}>
              {active.length} incident{active.length > 1 ? "s" : ""} need{active.length === 1 ? "s" : ""} response
            </span>
          </div>
        )}

        {/* Incident list */}
        {active.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "60px 0",
            color: "var(--text3)"
          }}>
            <div style={{ fontSize: 48, marginBottom: 14 }}>✓</div>
            <div style={{ fontSize: 16, color: "var(--text2)", fontWeight: 600 }}>
              All clear
            </div>
            <div style={{ fontSize: 13, marginTop: 6 }}>No active incidents</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {active.map(inc => (
              <div key={inc.id} onClick={() => setSelected(inc)} style={{
                background: "var(--bg2)",
                border: `1px solid ${sevColor[inc.severity]}44`,
                borderLeft: `4px solid ${sevColor[inc.severity]}`,
                borderRadius: 14, padding: 16, cursor: "pointer",
                boxShadow: "var(--card-shadow)",
                transition: "transform 0.15s, box-shadow 0.15s"
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 8px 32px #00000020";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "var(--card-shadow)";
                }}
              >
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  alignItems: "center", marginBottom: 8
                }}>
                  <span style={{ fontWeight: 700, fontSize: 16, color: "var(--text)" }}>
                    {inc.type}
                  </span>
                  <span style={{
                    fontSize: 11, padding: "3px 10px", borderRadius: 20,
                    background: sevColor[inc.severity] + "20",
                    color: sevColor[inc.severity],
                    fontFamily: "'DM Mono',monospace", fontWeight: 600
                  }}>{inc.severity}</span>
                </div>
                <div style={{
                  fontSize: 13, color: "var(--text2)", marginBottom: 8
                }}>
                  Room {inc.room} · {inc.guestName || "Anonymous"} · {timeAgo(inc.timestamp)}
                </div>
                <div style={{
                  fontSize: 13, color: "var(--text2)",
                  lineHeight: 1.5, marginBottom: 12
                }}>
                  {inc.briefing?.slice(0, 90)}...
                </div>
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <span style={{
                    fontSize: 12, color: "var(--amber)", fontWeight: 600
                  }}>
                    ⚡ {inc.action?.slice(0, 45)}...
                  </span>
                  <span style={{
                    fontSize: 12, color: "var(--red)", fontWeight: 700
                  }}>Respond →</span>
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