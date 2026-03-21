import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";

const sevColor = { P1: "#E8473F", P2: "#F0A500", P3: "#4B8FE2" };
const sevBg    = { P1: "#E8473F18", P2: "#F0A50018", P3: "#4B8FE218" };

function timeAgo(ts) {
  if (!ts) return "—";
  const diff = Math.floor((Date.now() - ts.toMillis()) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return ts.toDate().toLocaleDateString("en-IN");
}

export default function History() {
  const [incidents, setIncidents]         = useState([]);
  const [search, setSearch]               = useState("");
  const [typeFilter, setTypeFilter]       = useState("All");
  const [sevFilter, setSevFilter]         = useState("All");
  const [statusFilter, setStatusFilter]   = useState("All");
  const [isMobile, setIsMobile]           = useState(window.innerWidth < 768);

  useEffect(() => {
    const q = query(collection(db, "incidents"), orderBy("timestamp", "desc"));
    const unsub = onSnapshot(q, snap => {
      setIncidents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => { unsub(); window.removeEventListener("resize", handler); };
  }, []);

  const types      = ["All", ...new Set(incidents.map(i => i.type).filter(Boolean))];
  const severities = ["All", "P1", "P2", "P3"];
  const statuses   = ["All", "active", "resolved"];

  const filtered = incidents.filter(i => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      i.room?.toLowerCase().includes(q) ||
      i.type?.toLowerCase().includes(q) ||
      i.guestName?.toLowerCase().includes(q) ||
      i.briefing?.toLowerCase().includes(q) ||
      i.message?.toLowerCase().includes(q);
    const matchType   = typeFilter   === "All" || i.type     === typeFilter;
    const matchSev    = sevFilter    === "All" || i.severity === sevFilter;
    const matchStatus = statusFilter === "All" || i.status   === statusFilter;
    return matchSearch && matchType && matchSev && matchStatus;
  });

  function Pill({ label, value, setter, current, color }) {
    const active = current === value;
    return (
      <button onClick={() => setter(value)} style={{
        padding: "5px 12px", borderRadius: 20, cursor: "pointer",
        fontSize: 12, border: `1px solid ${active ? (color || "var(--red)") : "var(--border2)"}`,
        background: active ? (color || "var(--red)") + "22" : "var(--bg3)",
        color: active ? (color || "var(--red)") : "var(--text2)",
        transition: "all 0.15s", fontFamily: "'Syne',sans-serif"
      }}>{label}</button>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", background: "var(--bg)",
      padding: 24, transition: "background 0.3s"
    }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{
            fontSize: 11, color: "var(--red)", letterSpacing: "0.15em",
            fontFamily: "'DM Mono',monospace", marginBottom: 8
          }}>NEXUS · HISTORY</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--text)" }}>
            Incident History
          </h1>
          <p style={{ color: "var(--text2)", fontSize: 13, marginTop: 4 }}>
            {filtered.length} of {incidents.length} incidents
          </p>
        </div>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: 14 }}>
          <span style={{
            position: "absolute", left: 14, top: "50%",
            transform: "translateY(-50%)", color: "var(--text3)", fontSize: 14
          }}>◎</span>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by room, type, guest name..."
            style={{
              width: "100%", padding: "12px 14px 12px 38px",
              background: "var(--bg2)", border: "1px solid var(--border)",
              borderRadius: 10, color: "var(--text)", fontSize: 14,
              outline: "none", transition: "border-color 0.2s, background 0.3s"
            }}
            onFocus={e => e.target.style.borderColor = "var(--red)"}
            onBlur={e => e.target.style.borderColor = "var(--border)"}
          />
        </div>

        {/* Filters */}
        <div style={{
          display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20
        }}>
          {statuses.map(s => (
            <Pill key={s}
              label={s === "All" ? "All Status" : s}
              value={s} setter={setStatusFilter} current={statusFilter}
              color={s === "active" ? "var(--red)" : s === "resolved" ? "var(--green)" : null}
            />
          ))}
          <div style={{ width: 1, background: "var(--border2)", margin: "0 4px" }} />
          {severities.map(s => (
            <Pill key={s}
              label={s === "All" ? "All Sev" : s}
              value={s} setter={setSevFilter} current={sevFilter}
              color={sevColor[s]}
            />
          ))}
          <div style={{ width: 1, background: "var(--border2)", margin: "0 4px" }} />
          {types.map(s => (
            <Pill key={s} label={s} value={s} setter={setTypeFilter} current={typeFilter} />
          ))}
        </div>

        {/* Table */}
        <div style={{
          background: "var(--bg2)", border: "1px solid var(--border)",
          borderRadius: 14, overflow: "hidden",
          boxShadow: "var(--card-shadow)", transition: "background 0.3s"
        }}>

          {/* Header row */}
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "70px 90px 1fr 65px" : "80px 110px 1fr 80px 110px 90px",
            padding: "10px 16px",
            borderBottom: "1px solid var(--border)",
            fontSize: 10, color: "var(--text3)", letterSpacing: "0.1em",
            fontFamily: "'DM Mono',monospace"
          }}>
            <span>ROOM</span>
            <span>TYPE</span>
            <span>BRIEFING</span>
            <span>SEV</span>
            {!isMobile && <span>STATUS</span>}
            {!isMobile && <span>TIME</span>}
          </div>

          {filtered.length === 0 ? (
            <div style={{
              padding: 40, textAlign: "center",
              color: "var(--text3)", fontSize: 13
            }}>No incidents match your search</div>
          ) : (
            filtered.map((inc, idx) => (
              <div key={inc.id} style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "70px 90px 1fr 65px" : "80px 110px 1fr 80px 110px 90px",
                padding: "13px 16px", alignItems: "center",
                borderBottom: idx < filtered.length - 1 ? "1px solid var(--border)" : "none",
                transition: "background 0.1s", cursor: "default"
              }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--bg3)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <span style={{
                  fontSize: 14, fontWeight: 700,
                  fontFamily: "'DM Mono',monospace", color: "var(--text)"
                }}>{inc.room}</span>

                <span style={{ fontSize: 13, color: "var(--text2)" }}>{inc.type}</span>

                <span style={{
                  fontSize: 12, color: "var(--text3)", lineHeight: 1.4
                }}>
                  {inc.briefing?.slice(0, isMobile ? 40 : 70)}...
                </span>

                <span style={{
                  fontSize: 11, padding: "2px 8px", borderRadius: 20,
                  display: "inline-block",
                  background: sevBg[inc.severity] || "#88888818",
                  color: sevColor[inc.severity] || "var(--text2)",
                  fontFamily: "'DM Mono',monospace"
                }}>{inc.severity}</span>

                {!isMobile && (
                  <span style={{
                    fontSize: 11, padding: "2px 8px", borderRadius: 20,
                    display: "inline-block",
                    background: inc.status === "active" ? "#E8473F18" : "#4CAF7D18",
                    color: inc.status === "active" ? "var(--red)" : "var(--green)"
                  }}>{inc.status}</span>
                )}

                {!isMobile && (
                  <span style={{
                    fontSize: 11, color: "var(--text3)",
                    fontFamily: "'DM Mono',monospace"
                  }}>{timeAgo(inc.timestamp)}</span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}