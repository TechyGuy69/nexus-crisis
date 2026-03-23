import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, orderBy, query, doc, updateDoc, setDoc, getDoc } from "firebase/firestore";
import { useIncidentAlert } from "../hooks/useIncidentAlert";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

const GEMINI_KEY    = import.meta.env.VITE_GEMINI_KEY;
const sevColor      = { P1: "#E8473F", P2: "#F0A500", P3: "#4B8FE2" };
const sevBg         = { P1: "#E8473F18", P2: "#F0A50018", P3: "#4B8FE218" };
const typeIcon      = { Medical: "♥", Fire: "▲", Security: "◉", Flood: "◈", Panic: "!", Other: "…" };
const priorityOrder = { P1: 0, P2: 1, P3: 2 };

const STAFF_LIST = [
  { id: "sayan@byteclubhotel.com", name: "Sayan", role: "Security"  },
  { id: "sohini@byteclubhotel.com", name: "Sohini", role: "Medical"   },
  { id: "debasmita@byteclubhotel.com", name: "Debasmita", role: "Reception" },
  { id: "usnish@byteclubhotel.com", name: "Usnish", role: "Manager"   },
];

const STATUS_CONFIG = {
  active:      { label: "Pending",     color: "#F0A500", bg: "#F0A50020", icon: "⏳" },
  inprogress:  { label: "In Progress", color: "#4B8FE2", bg: "#4B8FE220", icon: "🔄" },
  resolved:    { label: "Resolved",    color: "#4CAF7D", bg: "#4CAF7D20", icon: "✓"  },
};

function timeAgo(ts) {
  if (!ts) return "just now";
  const diff = Math.floor((Date.now() - ts.toMillis()) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function sortByPriority(list) {
  return [...list].sort((a, b) => {
    const pa = priorityOrder[a.severity] ?? 3;
    const pb = priorityOrder[b.severity] ?? 3;
    if (pa !== pb) return pa - pb;
    if (a.timestamp && b.timestamp) return b.timestamp.toMillis() - a.timestamp.toMillis();
    return 0;
  });
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
  const [clock, setClock]                 = useState(new Date().toLocaleTimeString());
  const [staffStatus, setStaffStatus]     = useState({});
  const [currentUser, setCurrentUser]     = useState(null);

  useIncidentAlert(incidents);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    return onAuthStateChanged(auth, u => setCurrentUser(u));
  }, []);

  // Listen to staff status in real time
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "staff_status"), snap => {
      const status = {};
      snap.docs.forEach(d => { status[d.id] = d.data(); });
      setStaffStatus(status);
    });
    return unsub;
  }, []);

  // Update own status on load
  useEffect(() => {
    if (!currentUser) return;
    const staffRef = doc(db, "staff_status", currentUser.email);
    getDoc(staffRef).then(d => {
      if (!d.exists()) {
        const staffInfo = STAFF_LIST.find(s => s.id === currentUser.email);
        setDoc(staffRef, {
          name:   staffInfo?.name || currentUser.email.split("@")[0],
          role:   staffInfo?.role || "Staff",
          status: "free",
          email:  currentUser.email
        });
      }
    });
  }, [currentUser]);

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

  // Find a free staff member and assign
  async function assignFreeStaff(incidentId) {
    const freeStaff = STAFF_LIST.find(s => {
      const status = staffStatus[s.id]?.status;
      return status === "free" || !status;
    });

    if (freeStaff) {
      await updateDoc(doc(db, "incidents", incidentId), {
        assignedTo: freeStaff.name,
        assignedEmail: freeStaff.id,
        status: "inprogress"
      });
      await setDoc(doc(db, "staff_status", freeStaff.id), {
        ...staffStatus[freeStaff.id],
        status: "busy",
        assignedIncident: incidentId
      }, { merge: true });

      // Update selected
      setSelected(prev => prev ? { ...prev, status: "inprogress", assignedTo: freeStaff.name } : prev);
    } else {
      alert("All staff are currently busy. Please assign manually.");
    }
  }

  async function updateIncidentStatus(id, newStatus) {
    await updateDoc(doc(db, "incidents", id), { status: newStatus });
    setSelected(prev => prev ? { ...prev, status: newStatus } : prev);

    // If resolved — free up assigned staff
    if (newStatus === "resolved") {
      const inc = incidents.find(i => i.id === id);
      if (inc?.assignedEmail) {
        await setDoc(doc(db, "staff_status", inc.assignedEmail), {
          status: "free", assignedIncident: null
        }, { merge: true });
      }
    }
  }

  async function resolve(id) {
    setResolving(true);
    await updateIncidentStatus(id, "resolved");
    const feedbackUrl = `${window.location.origin}/feedback?id=${id}`;
    await navigator.clipboard.writeText(feedbackUrl).catch(() => {});
    alert(`Resolved! Feedback link copied:\n${feedbackUrl}`);
    setSelected(null);
    setReport("");
    setResolving(false);
    if (isMobile) setShowDetail(false);
  }

  async function toggleMyStatus() {
    if (!currentUser) return;
    const current = staffStatus[currentUser.email]?.status || "free";
    const next    = current === "free" ? "busy" : "free";
    await setDoc(doc(db, "staff_status", currentUser.email), {
      status: next
    }, { merge: true });
  }

  async function generateReport(inc) {
    setReportLoading(true);
    setReport("");
    try {
      const now     = new Date();
      const dateStr = now.toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
      const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Write a formal hotel incident report for Byte Club Pvt Ltd.
Use these exact details:
- Date: ${dateStr}
- Time: ${timeStr}
- Room: ${inc.room}
- Guest Name: ${inc.guestName}
- Incident Type: ${inc.type}
- Severity: ${inc.severity}
- Assigned To: ${inc.assignedTo || "Unassigned"}
- Description: "${inc.message}"
- AI Briefing: "${inc.briefing}"
- Action Taken: "${inc.action}"
- Responders: ${(inc.responders || ["Staff"]).join(", ")}
- Estimated Response Time: ${inc.estimatedMinutes || 5} minutes
Write exactly 4 paragraphs: SUMMARY, TIMELINE, ACTIONS TAKEN, RECOMMENDATIONS.
Plain text only — no markdown, no asterisks, no hashtags.`
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

  const active    = incidents.filter(i => i.status !== "resolved");
  const resolved  = incidents.filter(i => i.status === "resolved");
  const displayed = sortByPriority(filter === "active" ? active : resolved);

  // Staff panel
  function StaffPanel() {
    return (
      <div style={{
        background: "var(--bg2)", border: "1px solid var(--border)",
        borderRadius: 12, padding: 14, marginBottom: 14,
        boxShadow: "var(--card-shadow)"
      }}>
        <div style={{
          fontSize: 9, color: "var(--text3)", letterSpacing: "0.1em",
          marginBottom: 12, fontFamily: "'DM Mono',monospace",
          display: "flex", justifyContent: "space-between", alignItems: "center"
        }}>
          <span>STAFF STATUS</span>
          {currentUser && (
            <button onClick={toggleMyStatus} style={{
              fontSize: 10, padding: "3px 10px",
              background: staffStatus[currentUser.email]?.status === "busy" ? "#E8473F22" : "#4CAF7D22",
              color: staffStatus[currentUser.email]?.status === "busy" ? "#E8473F" : "#4CAF7D",
              border: `1px solid ${staffStatus[currentUser.email]?.status === "busy" ? "#E8473F44" : "#4CAF7D44"}`,
              borderRadius: 20, cursor: "pointer", fontFamily: "'Syne',sans-serif"
            }}>
              Set me as {staffStatus[currentUser.email]?.status === "busy" ? "Free" : "Busy"}
            </button>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {STAFF_LIST.map(staff => {
            const s      = staffStatus[staff.id];
            const isBusy = s?.status === "busy";
            const isMe   = currentUser?.email === staff.id;
            return (
              <div key={staff.id} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "8px 10px", borderRadius: 8,
                background: isMe ? "var(--red-dim)" : "var(--bg3)",
                border: `1px solid ${isMe ? "var(--red-border)" : "var(--border)"}`
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: isBusy ? "#E8473F22" : "#4CAF7D22",
                  border: `2px solid ${isBusy ? "#E8473F" : "#4CAF7D"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700, color: isBusy ? "#E8473F" : "#4CAF7D",
                  flexShrink: 0
                }}>
                  {staff.name.charAt(staff.name.length - 1)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", display: "flex", alignItems: "center", gap: 4 }}>
                    {staff.name} {isMe && <span style={{ fontSize: 9, color: "var(--red)" }}>(you)</span>}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text3)" }}>{staff.role}</div>
                </div>
                <div style={{
                  fontSize: 10, padding: "2px 8px", borderRadius: 20,
                  background: isBusy ? "#E8473F18" : "#4CAF7D18",
                  color: isBusy ? "#E8473F" : "#4CAF7D",
                  fontWeight: 600, flexShrink: 0
                }}>
                  {isBusy ? "BUSY" : "FREE"}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function PriorityBanner() {
    if (filter !== "active" || displayed.length === 0) return null;
    return (
      <div style={{
        padding: "8px 16px", fontSize: 10,
        color: "var(--text3)", letterSpacing: "0.08em",
        fontFamily: "'DM Mono',monospace",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg3)",
        display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap"
      }}>
        <span>SORTED BY PRIORITY</span>
        <span style={{ color: "#E8473F" }}>● HIGH</span>
        <span style={{ color: "#F0A500" }}>● MED</span>
        <span style={{ color: "#4B8FE2" }}>● LOW</span>
      </div>
    );
  }

  function IncidentCard({ inc, isMobileView = false }) {
    const statusCfg = STATUS_CONFIG[inc.status] || STATUS_CONFIG.active;
    return (
      <div onClick={() => selectIncident(inc)} style={{
        padding: "14px 16px",
        borderBottom: "1px solid var(--border)",
        cursor: "pointer", transition: "background 0.1s",
        background: selected?.id === inc.id ? "var(--bg3)" : "transparent",
        borderLeft: `3px solid ${selected?.id === inc.id ? sevColor[inc.severity] || "var(--red)" : "transparent"}`,
      }}
        onMouseEnter={e => { if (selected?.id !== inc.id) e.currentTarget.style.background = "var(--bg3)"; }}
        onMouseLeave={e => { if (selected?.id !== inc.id) e.currentTarget.style.background = "transparent"; }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5, gap: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text)", display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
            <span style={{ color: sevColor[inc.severity], flexShrink: 0 }}>{typeIcon[inc.type] || "◉"}</span>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {inc.type} · {inc.room}
            </span>
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
            <span style={{
              fontSize: 9, padding: "2px 6px", borderRadius: 4,
              fontFamily: "'DM Mono',monospace", fontWeight: 700,
              background: sevBg[inc.severity] || "#88888818",
              color: sevColor[inc.severity] || "var(--text2)",
            }}>
              {inc.severity === "P1" ? "HIGH" : inc.severity === "P2" ? "MED" : "LOW"}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
          <span style={{ fontSize: 11, color: "var(--text3)" }}>
            {inc.voiceReport && "🎤 "}{inc.guestName} · {timeAgo(inc.timestamp)}
          </span>
          <span style={{
            fontSize: 10, padding: "2px 8px", borderRadius: 20,
            background: statusCfg.bg, color: statusCfg.color,
            fontWeight: 600
          }}>
            {statusCfg.icon} {statusCfg.label}
          </span>
        </div>

        {inc.assignedTo && (
          <div style={{ fontSize: 11, color: "var(--blue)", marginBottom: 4 }}>
            👤 Assigned to {inc.assignedTo}
          </div>
        )}

        <div style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
          {inc.briefing}
        </div>

        {isMobileView && (
          <div style={{ marginTop: 8, fontSize: 12, color: "var(--red)", fontWeight: 600 }}>
            Tap to view details →
          </div>
        )}
      </div>
    );
  }

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
                <audio controls src={inc.audioURL} style={{ width: "100%", height: 36 }} />
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

  function DetailContent({ inc, mobile = false }) {
    const statusCfg = STATUS_CONFIG[inc.status] || STATUS_CONFIG.active;
    return (
      <div>
        {mobile && (
          <button onClick={backToList} style={{ background: "transparent", border: "none", color: "var(--text2)", fontSize: 14, cursor: "pointer", padding: "0 0 16px 0", fontFamily: "'Syne',sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
            ← Back to list
          </button>
        )}

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: mobile ? 14 : 20, gap: 12, flexWrap: "wrap" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
              <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 11, background: sevBg[inc.severity], color: sevColor[inc.severity], fontFamily: "'DM Mono',monospace", fontWeight: 600 }}>
                {inc.severity}
              </span>
              <span style={{
                padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                background: inc.severity === "P1" ? "#E8473F22" : inc.severity === "P2" ? "#F0A50022" : "#4B8FE222",
                color: inc.severity === "P1" ? "#E8473F" : inc.severity === "P2" ? "#F0A500" : "#4B8FE2",
              }}>
                {inc.severity === "P1" ? "🔴 HIGH" : inc.severity === "P2" ? "🟡 MEDIUM" : "🔵 LOW"}
              </span>
              <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 11, background: statusCfg.bg, color: statusCfg.color, fontWeight: 600 }}>
                {statusCfg.icon} {statusCfg.label}
              </span>
              {inc.voiceReport && (
                <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 11, background: "#8B7FE818", color: "var(--purple)" }}>🎤 Voice</span>
              )}
            </div>
            <h2 style={{ fontSize: mobile ? 20 : 24, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 6, color: "var(--text)" }}>
              {typeIcon[inc.type]} {inc.type} Emergency
            </h2>
            <div style={{ color: "var(--text2)", fontSize: 13 }}>
              Room {inc.room} · {inc.guestName} · {timeAgo(inc.timestamp)}
            </div>
            {inc.assignedTo && (
              <div style={{ fontSize: 13, color: "var(--blue)", marginTop: 4 }}>
                👤 Assigned to {inc.assignedTo}
              </div>
            )}
          </div>
        </div>

        {/* Status action buttons */}
        {inc.status !== "resolved" && (
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {!inc.assignedTo && (
              <button onClick={() => assignFreeStaff(inc.id)} style={{
                padding: "9px 16px", background: "#4B8FE222",
                color: "#4B8FE2", border: "1px solid #4B8FE244",
                borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer"
              }}>
                👤 Auto Assign Staff
              </button>
            )}
            {inc.status === "active" && (
              <button onClick={() => updateIncidentStatus(inc.id, "inprogress")} style={{
                padding: "9px 16px", background: "#4B8FE222",
                color: "#4B8FE2", border: "1px solid #4B8FE244",
                borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer"
              }}>
                🔄 Mark In Progress
              </button>
            )}
            {inc.status === "inprogress" && (
              <button onClick={() => resolve(inc.id)} disabled={resolving} style={{
                padding: "9px 16px",
                background: resolving ? "var(--bg3)" : "#4CAF7D22",
                color: resolving ? "var(--text3)" : "#4CAF7D",
                border: "1px solid #4CAF7D44",
                borderRadius: 10, fontSize: 13, fontWeight: 600,
                cursor: resolving ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", gap: 6
              }}>
                {resolving ? <><div className="spinner" />Resolving...</> : "✓ Mark Resolved"}
              </button>
            )}
            {inc.status === "active" && (
              <button onClick={() => resolve(inc.id)} disabled={resolving} style={{
                padding: "9px 16px",
                background: resolving ? "var(--bg3)" : "#4CAF7D22",
                color: resolving ? "var(--text3)" : "#4CAF7D",
                border: "1px solid #4CAF7D44",
                borderRadius: 10, fontSize: 13, fontWeight: 600,
                cursor: resolving ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", gap: 6
              }}>
                {resolving ? <><div className="spinner" />Resolving...</> : "✓ Resolve Directly"}
              </button>
            )}
          </div>
        )}

        {/* AI Briefing */}
        <div style={{ background: "#8B7FE810", border: "1px solid #8B7FE830", borderRadius: 14, padding: mobile ? 14 : 18, marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: "var(--purple)", letterSpacing: "0.12em", marginBottom: 10, fontFamily: "'DM Mono',monospace", display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--purple)", animation: "pulse 2s infinite" }} />
            GEMINI AI BRIEFING
          </div>
          <div style={{ fontSize: mobile ? 14 : 15, color: "var(--text)", lineHeight: 1.7, marginBottom: 14, wordBreak: "break-word" }}>{inc.briefing}</div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, background: "var(--red-dim)", border: "1px solid var(--red-border)", borderRadius: 10, padding: "10px 14px" }}>
            <span style={{ color: "var(--red)", fontSize: 16, flexShrink: 0 }}>⚡</span>
            <span style={{ fontSize: mobile ? 13 : 14, color: "var(--text)", fontWeight: 600, wordBreak: "break-word" }}>{inc.action}</span>
          </div>
        </div>

        {/* Info grid */}
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 1fr" : "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
          <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 12, padding: 14, boxShadow: "var(--card-shadow)" }}>
            <div style={{ fontSize: 9, color: "var(--text3)", letterSpacing: "0.1em", marginBottom: 8, fontFamily: "'DM Mono',monospace" }}>RESPONDERS</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {(inc.responders || ["Security"]).map(r => (
                <span key={r} style={{ padding: "3px 8px", background: "#4B8FE218", color: "var(--blue)", borderRadius: 20, fontSize: 11 }}>{r}</span>
              ))}
            </div>
          </div>
          <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 12, padding: 14, boxShadow: "var(--card-shadow)" }}>
            <div style={{ fontSize: 9, color: "var(--text3)", letterSpacing: "0.1em", marginBottom: 8, fontFamily: "'DM Mono',monospace" }}>RESPONSE ETA</div>
            <div style={{ fontSize: mobile ? 22 : 28, fontWeight: 800, color: "var(--amber)", fontFamily: "'DM Mono',monospace" }}>
              {inc.estimatedMinutes || 5}<span style={{ fontSize: 12, color: "var(--text3)" }}> min</span>
            </div>
          </div>
          {!mobile && (
            <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 12, padding: 14, boxShadow: "var(--card-shadow)" }}>
              <div style={{ fontSize: 9, color: "var(--text3)", letterSpacing: "0.1em", marginBottom: 8, fontFamily: "'DM Mono',monospace" }}>SEVERITY</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: sevColor[inc.severity], fontFamily: "'DM Mono',monospace" }}>{inc.severity}</div>
            </div>
          )}
        </div>

        {/* Voice / Guest message */}
        <VoiceMessageBlock inc={inc} />

        {/* AI Report */}
        <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 12, padding: mobile ? 14 : 20, boxShadow: "var(--card-shadow)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
            <div style={{ fontSize: 9, color: "var(--text3)", letterSpacing: "0.1em", fontFamily: "'DM Mono',monospace" }}>AI INCIDENT REPORT</div>
            <button onClick={() => generateReport(inc)} disabled={reportLoading} style={{
              padding: "6px 14px", background: "transparent",
              border: "1px solid var(--border2)", borderRadius: 8,
              color: "var(--text2)", fontSize: 12, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6, fontFamily: "'Syne',sans-serif"
            }}>
              {reportLoading ? <><div className="spinner" style={{ width: 12, height: 12 }} />Generating...</> : "Generate with AI ◆"}
            </button>
          </div>
          {report ? (
            <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.9, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{report}</div>
          ) : (
            <div style={{ textAlign: "center", color: "var(--text3)", padding: "24px 0", fontSize: 13 }}>
              Click "Generate with AI" to create a formal incident report
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg2)", overflow: "hidden", transition: "background 0.3s" }}>

      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* TOP BAR */}
      <div style={{
        padding: isMobile ? "10px 16px" : "12px 24px",
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "var(--bg2)", flexShrink: 0, transition: "background 0.3s"
      }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>Command Center</div>
          <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 1 }}>Byte Club Pvt Ltd · Live</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {active.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--red-dim)", border: "1px solid var(--red-border)", borderRadius: 20, padding: "5px 12px" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--red)", animation: "pulse 1.2s infinite" }} />
              <span style={{ fontSize: 11, color: "var(--red)", fontFamily: "'DM Mono',monospace" }}>
                {active.length} ACTIVE
                {active.filter(i => i.severity === "P1").length > 0 && (
                  <span style={{ marginLeft: 6, fontWeight: 700 }}>· {active.filter(i => i.severity === "P1").length} P1</span>
                )}
              </span>
            </div>
          )}
          {!isMobile && (
            <div style={{ fontSize: 11, color: "var(--text3)", fontFamily: "'DM Mono',monospace" }}>{clock}</div>
          )}
        </div>
      </div>

      {/* BODY */}
      {isMobile ? (
        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", background: "var(--bg2)" }}>
          {!showDetail ? (
            <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", background: "var(--bg2)", overflowY: "auto" }}>

              {/* Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
                {[
                  { label: "Active",   val: active.length,    color: "var(--red)"   },
                  { label: "Resolved", val: resolved.length,  color: "var(--green)" },
                  { label: "Total",    val: incidents.length, color: "var(--text2)" },
                ].map((s, i) => (
                  <div key={s.label} style={{ padding: "12px 8px", textAlign: "center", borderRight: i < 2 ? "1px solid var(--border)" : "none", background: "var(--bg2)" }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: s.color, fontFamily: "'DM Mono',monospace" }}>
                      {loaded ? s.val : <Skeleton w={24} h={20} />}
                    </div>
                    <div style={{ fontSize: 9, color: "var(--text3)", letterSpacing: "0.08em", marginTop: 3 }}>{s.label.toUpperCase()}</div>
                  </div>
                ))}
              </div>

              {/* Filter tabs */}
              <div style={{ display: "flex", borderBottom: "1px solid var(--border)", flexShrink: 0, background: "var(--bg2)" }}>
                {["active", "resolved"].map(f => (
                  <button key={f} onClick={() => setFilter(f)} style={{
                    flex: 1, padding: "10px 0", background: "transparent", border: "none",
                    cursor: "pointer", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em",
                    textTransform: "uppercase",
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
                        <Skeleton h={12} w="60%" /><Skeleton h={10} w="40%" /><Skeleton h={10} w="80%" />
                      </div>
                    ))}
                  </div>
                ) : displayed.length === 0 ? (
                  <div style={{ padding: 40, textAlign: "center", color: "var(--text3)", fontSize: 13 }}>No {filter} incidents</div>
                ) : (
                  <><PriorityBanner />{displayed.map(inc => <IncidentCard key={inc.id} inc={inc} isMobileView={true} />)}</>
                )}
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, minHeight: 0, overflowY: "auto", background: "var(--bg2)", padding: "16px 16px 40px" }}>
              {selected && <DetailContent inc={selected} mobile={true} />}
            </div>
          )}
        </div>

      ) : (

        /* DESKTOP */
        <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>

          {/* SIDEBAR */}
          <div style={{ width: 300, flexShrink: 0, borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", background: "var(--bg2)", minHeight: 0, transition: "background 0.3s" }}>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
              {[
                { label: "Active",   val: active.length,    color: "var(--red)"   },
                { label: "Resolved", val: resolved.length,  color: "var(--green)" },
                { label: "Total",    val: incidents.length, color: "var(--text2)" },
              ].map((s, i) => (
                <div key={s.label} style={{ padding: "14px 10px", textAlign: "center", borderRight: i < 2 ? "1px solid var(--border)" : "none" }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: "'DM Mono',monospace" }}>
                    {loaded ? s.val : <Skeleton w={24} h={20} />}
                  </div>
                  <div style={{ fontSize: 9, color: "var(--text3)", letterSpacing: "0.1em", marginTop: 3 }}>{s.label.toUpperCase()}</div>
                </div>
              ))}
            </div>

            {/* Filter tabs */}
            <div style={{ display: "flex", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
              {["active", "resolved"].map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  flex: 1, padding: "10px 0", background: "transparent", border: "none",
                  cursor: "pointer", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em",
                  textTransform: "uppercase",
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
                      <Skeleton h={12} w="60%" /><Skeleton h={10} w="40%" /><Skeleton h={10} w="80%" />
                    </div>
                  ))}
                </div>
              ) : displayed.length === 0 ? (
                <div style={{ padding: 32, textAlign: "center", color: "var(--text3)", fontSize: 13 }}>No {filter} incidents</div>
              ) : (
                <><PriorityBanner />{displayed.map(inc => <IncidentCard key={inc.id} inc={inc} />)}</>
              )}
            </div>
          </div>

          {/* RIGHT PANEL — Staff + Detail */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>

            {/* Staff status panel — top right */}
            <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--border)", background: "var(--bg2)", flexShrink: 0 }}>
              <div style={{ fontSize: 9, color: "var(--text3)", letterSpacing: "0.1em", marginBottom: 10, fontFamily: "'DM Mono',monospace", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>STAFF STATUS</span>
                {currentUser && (
                  <button onClick={toggleMyStatus} style={{
                    fontSize: 10, padding: "3px 10px",
                    background: staffStatus[currentUser.email]?.status === "busy" ? "#E8473F22" : "#4CAF7D22",
                    color: staffStatus[currentUser.email]?.status === "busy" ? "#E8473F" : "#4CAF7D",
                    border: `1px solid ${staffStatus[currentUser.email]?.status === "busy" ? "#E8473F44" : "#4CAF7D44"}`,
                    borderRadius: 20, cursor: "pointer", fontFamily: "'Syne',sans-serif"
                  }}>
                    Set me as {staffStatus[currentUser.email]?.status === "busy" ? "Free" : "Busy"}
                  </button>
                )}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {STAFF_LIST.map(staff => {
                  const s      = staffStatus[staff.id];
                  const isBusy = s?.status === "busy";
                  const isMe   = currentUser?.email === staff.id;
                  return (
                    <div key={staff.id} style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "6px 12px", borderRadius: 20,
                      background: isMe ? "var(--red-dim)" : "var(--bg3)",
                      border: `1px solid ${isMe ? "var(--red-border)" : isBusy ? "#E8473F33" : "#4CAF7D33"}`
                    }}>
                      <div style={{
                        width: 8, height: 8, borderRadius: "50%",
                        background: isBusy ? "#E8473F" : "#4CAF7D",
                        animation: isBusy ? "pulse 1.5s infinite" : "none"
                      }} />
                      <span style={{ fontSize: 12, color: "var(--text)", fontWeight: isMe ? 700 : 400 }}>
                        {staff.name}
                      </span>
                      <span style={{ fontSize: 10, color: isBusy ? "#E8473F" : "#4CAF7D", fontWeight: 600 }}>
                        {isBusy ? "BUSY" : "FREE"}
                      </span>
                      {isMe && <span style={{ fontSize: 9, color: "var(--red)" }}>(you)</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Detail panel */}
            <div style={{ flex: 1, overflowY: "auto", background: "var(--bg)", padding: 24, minWidth: 0, transition: "background 0.3s" }}>
              {!selected ? (
                <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, opacity: 0.4 }}>
                  <div style={{ fontSize: 48, color: "var(--text3)" }}>◉</div>
                  <div style={{ color: "var(--text3)", fontSize: 14 }}>Select an incident to view details</div>
                </div>
              ) : (
                <div style={{ maxWidth: 680 }}>
                  <DetailContent inc={selected} mobile={false} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}