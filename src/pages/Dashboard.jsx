import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, orderBy, query, doc, updateDoc } from "firebase/firestore";
import { useIncidentAlert } from "../hooks/useIncidentAlert";

const GEMINI_KEY = import.meta.env.VITE_GEMINI_KEY || "AIzaSyCURZ8pc2rIDWuI0jORYQdBSLH-lZOg9-w";
const sevColor = { P1: "#E8473F", P2: "#F0A500", P3: "#4B8FE2" };
const sevBg    = { P1: "#E8473F18", P2: "#F0A50018", P3: "#4B8FE218" };
const typeIcon = { Medical: "♥", Fire: "▲", Security: "◉", Flood: "◈", Panic: "!", Other: "…" };

function timeAgo(ts) {
  if (!ts) return "just now";
  const diff = Math.floor((Date.now() - ts.toMillis()) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function Skeleton({ w = "100%", h = 14, r = 6 }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r,
      background: "var(--bg3)",
      backgroundImage: "linear-gradient(90deg, var(--bg3) 25%, var(--border2) 50%, var(--bg3) 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.5s infinite"
    }} />
  );
}

export default function Dashboard() {
  const [incidents, setIncidents]         = useState([]);
  const [selected, setSelected]           = useState(null);
  const [report, setReport]               = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const [filter, setFilter]               = useState("active");
  const [resolving, setResolving]         = useState(false);
  const [loaded, setLoaded]               = useState(false);
  const [showDetail, setShowDetail]       = useState(false);
  const [isMobile, setIsMobile]           = useState(window.innerWidth < 768);

  useIncidentAlert(incidents);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  useEffect(() => {
    const q = query(collection(db, "incidents"), orderBy("timestamp", "desc"));
    return onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setIncidents(data);
      setLoaded(true);
    });
  }, []);

  function selectIncident(inc) {
    setSelected(inc);
    setReport("");
    if (isMobile) setShowDetail(true);
  }

  function backToList() {
    setShowDetail(false);
    setSelected(null);
    setReport("");
  }

  async function resolve(id) {
    setResolving(true);
    await updateDoc(doc(db, "incidents", id), { status: "resolved" });
    const feedbackUrl = `${window.location.origin}/feedback?id=${id}`;
    await navigator.clipboard.writeText(feedbackUrl).catch(() => {});
    alert(`Resolved! Feedback link copied:\n${feedbackUrl}`);
    setSelected(null);
    setReport("");
    setResolving(false);
    if (isMobile) setShowDetail(false);
  }

  async function generateReport(inc) {
    setReportLoading(true);
    setReport("");
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Formal hotel incident report for Byte Club Pvt Ltd.
                Room ${inc.room}, Guest: ${inc.guestName}, Type: ${inc.type}, Severity: ${inc.severity}.
                Description: "${inc.message}". Briefing: "${inc.briefing}". Action: "${inc.action}".
                Write a professional 4-paragraph report: Summary, Timeline, Actions Taken, Recommendations.`
              }]
            }]
          })
        }
      );
      const data = await res.json();
      setReport(data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "Report unavailable.");
    } catch {
      setReport("Failed to generate report.");
    } finally {
      setReportLoading(false);
    }
  }

  const active    = incidents.filter(i => i.status === "active");
  const resolved  = incidents.filter(i => i.status === "resolved");
  const displayed = filter === "active" ? active : resolved;

  return (
    <div style={{
      height: "100dvh",
      display: "flex",
      flexDirection: "column",
      background: "var(--bg2)",
      overflow: "hidden",
      transition: "background 0.3s"
    }}>

      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(12px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>

      {/* ── TOP BAR ── */}
      <div style={{
        padding: isMobile ? "10px 16px" : "12px 24px",
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        background: "var(--bg2)", flexShrink: 0,
        transition: "background 0.3s"
      }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
            Command Center
          </div>
          <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 1 }}>
            Byte Club Pvt Ltd · Live
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {active.length > 0 && (
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "var(--red-dim)", border: "1px solid var(--red-border)",
              borderRadius: 20, padding: "5px 12px"
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: "50%",
                background: "var(--red)", animation: "pulse 1.2s infinite"
              }} />
              <span style={{
                fontSize: 11, color: "var(--red)",
                fontFamily: "'DM Mono',monospace"
              }}>{active.length} ACTIVE</span>
            </div>
          )}
          {!isMobile && (
            <div style={{
              fontSize: 11, color: "var(--text3)",
              fontFamily: "'DM Mono',monospace"
            }}>
              {new Date().toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>

      {/* ── BODY ── */}
      {isMobile ? (
        // MOBILE: full screen list OR full screen detail
        <div style={{
          flex: 1, minHeight: 0,
          display: "flex", flexDirection: "column",
          background: "var(--bg2)"
        }}>
          {!showDetail ? (
            /* MOBILE LIST */
            <div style={{
              flex: 1, minHeight: 0,
              display: "flex", flexDirection: "column",
              background: "var(--bg2)", overflowY: "auto"
            }}>
              {/* Stats */}
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
                borderBottom: "1px solid var(--border)", flexShrink: 0
              }}>
                {[
                  { label: "Active",   val: active.length,    color: "var(--red)"   },
                  { label: "Resolved", val: resolved.length,  color: "var(--green)" },
                  { label: "Total",    val: incidents.length, color: "var(--text2)" },
                ].map((s, i) => (
                  <div key={s.label} style={{
                    padding: "12px 8px", textAlign: "center",
                    borderRight: i < 2 ? "1px solid var(--border)" : "none",
                    background: "var(--bg2)"
                  }}>
                    <div style={{
                      fontSize: 20, fontWeight: 800, color: s.color,
                      fontFamily: "'DM Mono',monospace"
                    }}>
                      {loaded ? s.val : <Skeleton w={24} h={20} />}
                    </div>
                    <div style={{
                      fontSize: 9, color: "var(--text3)",
                      letterSpacing: "0.08em", marginTop: 3
                    }}>{s.label.toUpperCase()}</div>
                  </div>
                ))}
              </div>

              {/* Filter tabs */}
              <div style={{
                display: "flex",
                borderBottom: "1px solid var(--border)", flexShrink: 0,
                background: "var(--bg2)"
              }}>
                {["active", "resolved"].map(f => (
                  <button key={f} onClick={() => setFilter(f)} style={{
                    flex: 1, padding: "10px 0", background: "transparent",
                    border: "none", cursor: "pointer", fontSize: 11,
                    fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase",
                    color: filter === f ? "var(--text)" : "var(--text3)",
                    borderBottom: `2px solid ${filter === f ? "var(--red)" : "transparent"}`,
                    transition: "all 0.15s", fontFamily: "'Syne',sans-serif"
                  }}>{f}</button>
                ))}
              </div>

              {/* Incident list */}
              <div style={{ flex: 1, background: "var(--bg2)" }}>
                {!loaded ? (
                  <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
                    {[1, 2, 3].map(i => (
                      <div key={i} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <Skeleton h={12} w="60%" />
                        <Skeleton h={10} w="40%" />
                        <Skeleton h={10} w="80%" />
                      </div>
                    ))}
                  </div>
                ) : displayed.length === 0 ? (
                  <div style={{
                    padding: 40, textAlign: "center",
                    color: "var(--text3)", fontSize: 13,
                    background: "var(--bg2)"
                  }}>No {filter} incidents</div>
                ) : (
                  displayed.map(inc => (
                    <div key={inc.id} onClick={() => selectIncident(inc)} style={{
                      padding: "14px 16px",
                      borderBottom: "1px solid var(--border)",
                      cursor: "pointer", background: "var(--bg2)",
                      transition: "background 0.1s"
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = "var(--bg3)"}
                      onMouseLeave={e => e.currentTarget.style.background = "var(--bg2)"}
                    >
                      <div style={{
                        display: "flex", justifyContent: "space-between",
                        alignItems: "center", marginBottom: 5, gap: 8
                      }}>
                        <span style={{
                          fontWeight: 700, fontSize: 14, color: "var(--text)",
                          display: "flex", alignItems: "center", gap: 6, minWidth: 0
                        }}>
                          <span style={{ color: sevColor[inc.severity], flexShrink: 0 }}>
                            {typeIcon[inc.type] || "◉"}
                          </span>
                          <span style={{
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                          }}>
                            {inc.type} · Room {inc.room}
                          </span>
                        </span>
                        <span style={{
                          fontSize: 10, padding: "2px 7px", borderRadius: 20,
                          background: sevBg[inc.severity] || "#88888818",
                          color: sevColor[inc.severity] || "var(--text2)",
                          fontFamily: "'DM Mono',monospace", flexShrink: 0
                        }}>{inc.severity}</span>
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 5 }}>
                        {inc.guestName} · {timeAgo(inc.timestamp)}
                      </div>
                      <div style={{
                        fontSize: 12, color: "var(--text2)", lineHeight: 1.5,
                        overflow: "hidden", display: "-webkit-box",
                        WebkitLineClamp: 2, WebkitBoxOrient: "vertical"
                      }}>
                        {inc.briefing}
                      </div>
                      <div style={{
                        marginTop: 8, fontSize: 12,
                        color: "var(--red)", fontWeight: 600
                      }}>Tap to view details →</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            /* MOBILE DETAIL */
            <div style={{
              flex: 1, minHeight: 0,
              overflowY: "auto", background: "var(--bg2)",
              padding: "16px 16px 40px"
            }}>
              {/* Back button */}
              <button onClick={backToList} style={{
                background: "transparent", border: "none",
                color: "var(--text2)", fontSize: 14,
                cursor: "pointer", padding: "0 0 16px 0",
                fontFamily: "'Syne',sans-serif",
                display: "flex", alignItems: "center", gap: 6
              }}>← Back to list</button>

              {selected && (
                <div style={{ animation: "fadeUp 0.3s ease" }}>

                  {/* Header */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{
                      display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap"
                    }}>
                      <span style={{
                        padding: "4px 12px", borderRadius: 20, fontSize: 11,
                        background: sevBg[selected.severity],
                        color: sevColor[selected.severity],
                        fontFamily: "'DM Mono',monospace", fontWeight: 600
                      }}>{selected.severity}</span>
                      <span style={{
                        padding: "4px 12px", borderRadius: 20, fontSize: 11,
                        background: selected.status === "active" ? "var(--red-dim)" : "#4CAF7D18",
                        color: selected.status === "active" ? "var(--red)" : "var(--green)"
                      }}>{selected.status}</span>
                    </div>
                    <h2 style={{
                      fontSize: 22, fontWeight: 800,
                      color: "var(--text)", marginBottom: 6,
                      letterSpacing: "-0.02em"
                    }}>
                      {typeIcon[selected.type]} {selected.type} Emergency
                    </h2>
                    <div style={{ color: "var(--text2)", fontSize: 13 }}>
                      Room {selected.room} · {selected.guestName} · {timeAgo(selected.timestamp)}
                    </div>
                  </div>

                  {/* Resolve button */}
                  {selected.status === "active" && (
                    <button onClick={() => resolve(selected.id)} disabled={resolving} style={{
                      width: "100%", padding: "12px 0", marginBottom: 16,
                      background: resolving ? "var(--bg3)" : "var(--green)",
                      color: resolving ? "var(--text3)" : "#fff",
                      border: "none", borderRadius: 12,
                      fontSize: 14, fontWeight: 700,
                      cursor: resolving ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center",
                      justifyContent: "center", gap: 8
                    }}>
                      {resolving
                        ? <><div className="spinner" />Resolving...</>
                        : "Mark as Resolved ✓"}
                    </button>
                  )}

                  {/* AI Briefing */}
                  <div style={{
                    background: "#8B7FE810", border: "1px solid #8B7FE830",
                    borderRadius: 14, padding: 16, marginBottom: 12
                  }}>
                    <div style={{
                      fontSize: 10, color: "var(--purple)",
                      letterSpacing: "0.12em", marginBottom: 8,
                      fontFamily: "'DM Mono',monospace",
                      display: "flex", alignItems: "center", gap: 6
                    }}>
                      <div style={{
                        width: 5, height: 5, borderRadius: "50%",
                        background: "var(--purple)", animation: "pulse 2s infinite"
                      }} />
                      GEMINI AI BRIEFING
                    </div>
                    <div style={{
                      fontSize: 14, color: "var(--text)",
                      lineHeight: 1.7, marginBottom: 12, wordBreak: "break-word"
                    }}>{selected.briefing}</div>
                    <div style={{
                      display: "flex", alignItems: "flex-start", gap: 8,
                      background: "var(--red-dim)", border: "1px solid var(--red-border)",
                      borderRadius: 10, padding: "10px 12px"
                    }}>
                      <span style={{ color: "var(--red)", flexShrink: 0 }}>⚡</span>
                      <span style={{
                        fontSize: 13, color: "var(--text)",
                        fontWeight: 600, wordBreak: "break-word"
                      }}>{selected.action}</span>
                    </div>
                  </div>

                  {/* Info grid */}
                  <div style={{
                    display: "grid", gridTemplateColumns: "1fr 1fr",
                    gap: 10, marginBottom: 12
                  }}>
                    <div style={{
                      background: "var(--bg3)", border: "1px solid var(--border)",
                      borderRadius: 12, padding: 14
                    }}>
                      <div style={{
                        fontSize: 9, color: "var(--text3)",
                        letterSpacing: "0.1em", marginBottom: 8,
                        fontFamily: "'DM Mono',monospace"
                      }}>RESPONDERS</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {(selected.responders || ["Security"]).map(r => (
                          <span key={r} style={{
                            padding: "3px 8px", background: "#4B8FE218",
                            color: "var(--blue)", borderRadius: 20, fontSize: 11
                          }}>{r}</span>
                        ))}
                      </div>
                    </div>
                    <div style={{
                      background: "var(--bg3)", border: "1px solid var(--border)",
                      borderRadius: 12, padding: 14
                    }}>
                      <div style={{
                        fontSize: 9, color: "var(--text3)",
                        letterSpacing: "0.1em", marginBottom: 8,
                        fontFamily: "'DM Mono',monospace"
                      }}>RESPONSE ETA</div>
                      <div style={{
                        fontSize: 24, fontWeight: 800,
                        color: "var(--amber)", fontFamily: "'DM Mono',monospace"
                      }}>
                        {selected.estimatedMinutes || 5}
                        <span style={{ fontSize: 12, color: "var(--text3)" }}> min</span>
                      </div>
                    </div>
                  </div>

                  {/* Guest message */}
                  {selected.message && (
                    <div style={{
                      background: "var(--bg3)", border: "1px solid var(--border)",
                      borderRadius: 12, padding: 14, marginBottom: 12
                    }}>
                      <div style={{
                        fontSize: 9, color: "var(--text3)",
                        letterSpacing: "0.1em", marginBottom: 8,
                        fontFamily: "'DM Mono',monospace"
                      }}>GUEST MESSAGE</div>
                      <div style={{
                        fontSize: 13, color: "var(--text2)",
                        lineHeight: 1.7, fontStyle: "italic", wordBreak: "break-word"
                      }}>"{selected.message}"</div>
                    </div>
                  )}

                  {/* AI Report */}
                  <div style={{
                    background: "var(--bg3)", border: "1px solid var(--border)",
                    borderRadius: 12, padding: 14
                  }}>
                    <div style={{
                      display: "flex", justifyContent: "space-between",
                      alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8
                    }}>
                      <div style={{
                        fontSize: 9, color: "var(--text3)",
                        letterSpacing: "0.1em", fontFamily: "'DM Mono',monospace"
                      }}>AI INCIDENT REPORT</div>
                      <button onClick={() => generateReport(selected)} disabled={reportLoading} style={{
                        padding: "6px 12px", background: "transparent",
                        border: "1px solid var(--border2)", borderRadius: 8,
                        color: "var(--text2)", fontSize: 12, cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 6,
                        fontFamily: "'Syne',sans-serif"
                      }}>
                        {reportLoading
                          ? <><div className="spinner" style={{ width: 12, height: 12 }} />Generating...</>
                          : "Generate with AI ◆"}
                      </button>
                    </div>
                    {report ? (
                      <div style={{
                        fontSize: 13, color: "var(--text2)",
                        lineHeight: 1.9, whiteSpace: "pre-wrap", wordBreak: "break-word"
                      }}>{report}</div>
                    ) : (
                      <div style={{
                        textAlign: "center", color: "var(--text3)",
                        padding: "20px 0", fontSize: 13
                      }}>
                        Click "Generate with AI" to create a formal incident report
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        // ── DESKTOP: side by side ──
        <div style={{
          display: "flex", flex: 1,
          overflow: "hidden", minHeight: 0
        }}>

          {/* DESKTOP SIDEBAR */}
          <div style={{
            width: 300, flexShrink: 0,
            borderRight: "1px solid var(--border)",
            display: "flex", flexDirection: "column",
            background: "var(--bg2)", minHeight: 0,
            transition: "background 0.3s"
          }}>

            {/* Stats */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
              borderBottom: "1px solid var(--border)", flexShrink: 0
            }}>
              {[
                { label: "Active",   val: active.length,    color: "var(--red)"   },
                { label: "Resolved", val: resolved.length,  color: "var(--green)" },
                { label: "Total",    val: incidents.length, color: "var(--text2)" },
              ].map((s, i) => (
                <div key={s.label} style={{
                  padding: "14px 10px", textAlign: "center",
                  borderRight: i < 2 ? "1px solid var(--border)" : "none"
                }}>
                  <div style={{
                    fontSize: 22, fontWeight: 800, color: s.color,
                    fontFamily: "'DM Mono',monospace",
                    animation: loaded ? "fadeUp 0.4s ease" : "none"
                  }}>
                    {loaded ? s.val : <Skeleton w={24} h={20} />}
                  </div>
                  <div style={{
                    fontSize: 9, color: "var(--text3)",
                    letterSpacing: "0.1em", marginTop: 3
                  }}>{s.label.toUpperCase()}</div>
                </div>
              ))}
            </div>

            {/* Filter tabs */}
            <div style={{
              display: "flex", borderBottom: "1px solid var(--border)", flexShrink: 0
            }}>
              {["active", "resolved"].map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  flex: 1, padding: "10px 0", background: "transparent",
                  border: "none", cursor: "pointer", fontSize: 11,
                  fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase",
                  color: filter === f ? "var(--text)" : "var(--text3)",
                  borderBottom: `2px solid ${filter === f ? "var(--red)" : "transparent"}`,
                  transition: "all 0.15s", fontFamily: "'Syne',sans-serif"
                }}>{f}</button>
              ))}
            </div>

            {/* Incident list */}
            <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
              {!loaded ? (
                <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <Skeleton h={12} w="60%" />
                      <Skeleton h={10} w="40%" />
                      <Skeleton h={10} w="80%" />
                    </div>
                  ))}
                </div>
              ) : displayed.length === 0 ? (
                <div style={{
                  padding: 32, textAlign: "center",
                  color: "var(--text3)", fontSize: 13
                }}>No {filter} incidents</div>
              ) : (
                displayed.map(inc => (
                  <div key={inc.id} onClick={() => selectIncident(inc)} style={{
                    padding: "14px 16px",
                    borderBottom: "1px solid var(--border)",
                    cursor: "pointer", transition: "background 0.1s",
                    background: selected?.id === inc.id ? "var(--bg3)" : "transparent",
                    borderLeft: `3px solid ${selected?.id === inc.id
                      ? sevColor[inc.severity] || "var(--red)"
                      : "transparent"}`,
                  }}
                    onMouseEnter={e => {
                      if (selected?.id !== inc.id)
                        e.currentTarget.style.background = "var(--bg3)";
                    }}
                    onMouseLeave={e => {
                      if (selected?.id !== inc.id)
                        e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <div style={{
                      display: "flex", justifyContent: "space-between",
                      alignItems: "center", marginBottom: 5, gap: 8
                    }}>
                      <span style={{
                        fontWeight: 700, fontSize: 14, color: "var(--text)",
                        display: "flex", alignItems: "center", gap: 6, minWidth: 0
                      }}>
                        <span style={{ color: sevColor[inc.severity], flexShrink: 0 }}>
                          {typeIcon[inc.type] || "◉"}
                        </span>
                        <span style={{
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                        }}>
                          {inc.type} · {inc.room}
                        </span>
                      </span>
                      <span style={{
                        fontSize: 10, padding: "2px 7px", borderRadius: 20,
                        background: sevBg[inc.severity] || "#88888818",
                        color: sevColor[inc.severity] || "var(--text2)",
                        fontFamily: "'DM Mono',monospace", flexShrink: 0
                      }}>{inc.severity}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 5 }}>
                      {inc.guestName} · {timeAgo(inc.timestamp)}
                    </div>
                    <div style={{
                      fontSize: 12, color: "var(--text2)", lineHeight: 1.4,
                      overflow: "hidden", display: "-webkit-box",
                      WebkitLineClamp: 2, WebkitBoxOrient: "vertical"
                    }}>{inc.briefing}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* DESKTOP DETAIL PANEL */}
          <div style={{
            flex: 1, overflowY: "auto",
            background: "var(--bg)", padding: 28,
            minWidth: 0, transition: "background 0.3s"
          }}>
            {!selected ? (
              <div style={{
                height: "100%", display: "flex",
                flexDirection: "column", alignItems: "center",
                justifyContent: "center", gap: 12, opacity: 0.4
              }}>
                <div style={{ fontSize: 48, color: "var(--text3)" }}>◉</div>
                <div style={{ color: "var(--text3)", fontSize: 14 }}>
                  Select an incident to view details
                </div>
              </div>
            ) : (
              <div style={{ maxWidth: 680, animation: "fadeUp 0.3s ease" }}>

                {/* Header */}
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  alignItems: "flex-start", marginBottom: 24, gap: 16
                }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                      <span style={{
                        padding: "4px 12px", borderRadius: 20, fontSize: 11,
                        background: sevBg[selected.severity],
                        color: sevColor[selected.severity],
                        fontFamily: "'DM Mono',monospace", fontWeight: 600
                      }}>{selected.severity}</span>
                      <span style={{
                        padding: "4px 12px", borderRadius: 20, fontSize: 11,
                        background: selected.status === "active" ? "var(--red-dim)" : "#4CAF7D18",
                        color: selected.status === "active" ? "var(--red)" : "var(--green)"
                      }}>{selected.status}</span>
                    </div>
                    <h2 style={{
                      fontSize: 26, fontWeight: 800,
                      letterSpacing: "-0.02em", marginBottom: 6,
                      color: "var(--text)"
                    }}>
                      {typeIcon[selected.type]} {selected.type} Emergency
                    </h2>
                    <div style={{ color: "var(--text2)", fontSize: 14 }}>
                      Room {selected.room} · {selected.guestName} · {timeAgo(selected.timestamp)}
                    </div>
                  </div>
                  {selected.status === "active" && (
                    <button onClick={() => resolve(selected.id)} disabled={resolving} style={{
                      padding: "10px 22px",
                      background: resolving ? "var(--bg3)" : "var(--green)",
                      color: resolving ? "var(--text3)" : "#fff",
                      border: "none", borderRadius: 10,
                      fontSize: 13, fontWeight: 700,
                      cursor: resolving ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center",
                      gap: 8, flexShrink: 0, whiteSpace: "nowrap"
                    }}>
                      {resolving
                        ? <><div className="spinner" />Resolving...</>
                        : "Mark Resolved ✓"}
                    </button>
                  )}
                </div>

                {/* AI Briefing */}
                <div style={{
                  background: "#8B7FE810", border: "1px solid #8B7FE830",
                  borderRadius: 14, padding: 20, marginBottom: 16
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
                    GEMINI AI BRIEFING
                  </div>
                  <div style={{
                    fontSize: 15, color: "var(--text)",
                    lineHeight: 1.7, marginBottom: 14
                  }}>{selected.briefing}</div>
                  <div style={{
                    display: "flex", alignItems: "flex-start", gap: 10,
                    background: "var(--red-dim)", border: "1px solid var(--red-border)",
                    borderRadius: 10, padding: "10px 14px"
                  }}>
                    <span style={{ color: "var(--red)", fontSize: 16, flexShrink: 0 }}>⚡</span>
                    <span style={{
                      fontSize: 14, color: "var(--text)",
                      fontWeight: 600, wordBreak: "break-word"
                    }}>{selected.action}</span>
                  </div>
                </div>

                {/* Info grid */}
                <div style={{
                  display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 12, marginBottom: 16
                }}>
                  <div style={{
                    background: "var(--bg2)", border: "1px solid var(--border)",
                    borderRadius: 12, padding: 16, boxShadow: "var(--card-shadow)"
                  }}>
                    <div style={{
                      fontSize: 9, color: "var(--text3)",
                      letterSpacing: "0.1em", marginBottom: 10,
                      fontFamily: "'DM Mono',monospace"
                    }}>RESPONDERS</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {(selected.responders || ["Security"]).map(r => (
                        <span key={r} style={{
                          padding: "3px 10px", background: "#4B8FE218",
                          color: "var(--blue)", borderRadius: 20, fontSize: 12
                        }}>{r}</span>
                      ))}
                    </div>
                  </div>
                  <div style={{
                    background: "var(--bg2)", border: "1px solid var(--border)",
                    borderRadius: 12, padding: 16, boxShadow: "var(--card-shadow)"
                  }}>
                    <div style={{
                      fontSize: 9, color: "var(--text3)",
                      letterSpacing: "0.1em", marginBottom: 10,
                      fontFamily: "'DM Mono',monospace"
                    }}>RESPONSE ETA</div>
                    <div style={{
                      fontSize: 28, fontWeight: 800,
                      color: "var(--amber)", fontFamily: "'DM Mono',monospace"
                    }}>
                      {selected.estimatedMinutes || 5}
                      <span style={{ fontSize: 13, color: "var(--text3)" }}> min</span>
                    </div>
                  </div>
                  <div style={{
                    background: "var(--bg2)", border: "1px solid var(--border)",
                    borderRadius: 12, padding: 16, boxShadow: "var(--card-shadow)"
                  }}>
                    <div style={{
                      fontSize: 9, color: "var(--text3)",
                      letterSpacing: "0.1em", marginBottom: 10,
                      fontFamily: "'DM Mono',monospace"
                    }}>SEVERITY</div>
                    <div style={{
                      fontSize: 28, fontWeight: 800,
                      color: sevColor[selected.severity],
                      fontFamily: "'DM Mono',monospace"
                    }}>{selected.severity}</div>
                  </div>
                </div>

                {/* Guest message */}
                {selected.message && (
                  <div style={{
                    background: "var(--bg2)", border: "1px solid var(--border)",
                    borderRadius: 12, padding: 16, marginBottom: 16,
                    boxShadow: "var(--card-shadow)"
                  }}>
                    <div style={{
                      fontSize: 9, color: "var(--text3)",
                      letterSpacing: "0.1em", marginBottom: 10,
                      fontFamily: "'DM Mono',monospace"
                    }}>GUEST MESSAGE</div>
                    <div style={{
                      fontSize: 14, color: "var(--text2)",
                      lineHeight: 1.7, fontStyle: "italic", wordBreak: "break-word"
                    }}>"{selected.message}"</div>
                  </div>
                )}

                {/* AI Report */}
                <div style={{
                  background: "var(--bg2)", border: "1px solid var(--border)",
                  borderRadius: 12, padding: 20, boxShadow: "var(--card-shadow)"
                }}>
                  <div style={{
                    display: "flex", justifyContent: "space-between",
                    alignItems: "center", marginBottom: 14,
                    flexWrap: "wrap", gap: 10
                  }}>
                    <div style={{
                      fontSize: 9, color: "var(--text3)",
                      letterSpacing: "0.1em", fontFamily: "'DM Mono',monospace"
                    }}>AI INCIDENT REPORT</div>
                    <button onClick={() => generateReport(selected)} disabled={reportLoading} style={{
                      padding: "6px 14px", background: "transparent",
                      border: "1px solid var(--border2)", borderRadius: 8,
                      color: "var(--text2)", fontSize: 12, cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 6,
                      fontFamily: "'Syne',sans-serif"
                    }}>
                      {reportLoading
                        ? <><div className="spinner" style={{ width: 12, height: 12 }} />Generating...</>
                        : "Generate with AI ◆"}
                    </button>
                  </div>
                  {report ? (
                    <div style={{
                      fontSize: 13, color: "var(--text2)",
                      lineHeight: 1.9, whiteSpace: "pre-wrap", wordBreak: "break-word"
                    }}>{report}</div>
                  ) : (
                    <div style={{
                      textAlign: "center", color: "var(--text3)",
                      padding: "24px 0", fontSize: 13
                    }}>
                      Click "Generate with AI" to create a formal incident report
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}