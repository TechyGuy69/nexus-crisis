import { useEffect, useState } from "react";
import { db, ADMIN_EMAIL, auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, orderBy, query, doc, updateDoc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const sevColor = { P1: "#E8473F", P2: "#F0A500", P3: "#4B8FE2" };
const sevBg = { P1: "#E8473F18", P2: "#F0A50018", P3: "#4B8FE218" };
const typeIcon = { Medical: "♥", Fire: "▲", Security: "◉", Flood: "◈", Panic: "!", Other: "…" };

const STAFF_LIST = [
  { id: "sayan@byteclubhotel.com", name: "Staff 1", role: "Security" },
  { id: "sohini@byteclubhotel.com", name: "Staff 2", role: "Medical" },
  { id: "debasmita@byteclubhotel.com", name: "Staff 3", role: "Reception" },
  { id: "usnish@byteclubhotel.com", name: "Staff 4", role: "Manager" },
];

const STATUS_CONFIG = {
  active: { label: "Pending", color: "#F0A500", bg: "#F0A50020", icon: "⏳" },
  inprogress: { label: "In Progress", color: "#4B8FE2", bg: "#4B8FE220", icon: "🔄" },
  resolved: { label: "Resolved", color: "#4CAF7D", bg: "#4CAF7D20", icon: "✓" },
};

function timeAgo(ts) {
  if (!ts) return "just now";
  const diff = Math.floor((Date.now() - ts.toMillis()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

// Added the VoiceMessageBlock from the Dashboard
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

function MobileIncidentDetail({ inc, staffStatus, STAFF_LIST, STATUS_CONFIG, typeIcon, sevBg, sevColor, timeAgo, unassignStaff, assignStaff, updateStatus, resolveIncident }) {
  if (!inc) return null;
  const sc = STATUS_CONFIG[inc.status] || STATUS_CONFIG.active;

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 11, background: sevBg[inc.severity], color: sevColor[inc.severity], fontFamily: "'DM Mono',monospace", fontWeight: 600 }}>{inc.severity}</span>
        <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 11, background: sc.bg, color: sc.color, fontWeight: 600 }}>{sc.icon} {sc.label}</span>
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", marginBottom: 6, wordBreak: "break-word" }}>
        {typeIcon[inc.type]} {inc.type} — Room {inc.room}
      </div>
      <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 14 }}>
        {inc.guestName} · {timeAgo(inc.timestamp)}
      </div>
      <div style={{ background: "#8B7FE810", border: "1px solid #8B7FE830", borderRadius: 12, padding: 14, marginBottom: 12 }}>
        <div style={{ fontSize: 10, color: "var(--purple)", letterSpacing: "0.1em", marginBottom: 8, fontFamily: "'DM Mono',monospace" }}>AI BRIEFING</div>
        <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.6, wordBreak: "break-word" }}>{inc.briefing}</div>
      </div>
      <div style={{ background: "var(--red-dim)", border: "1px solid var(--red-border)", borderRadius: 10, padding: 12, marginBottom: 14 }}>
        <span style={{ color: "var(--red)" }}>⚡ </span>
        <span style={{ fontSize: 13, color: "var(--text)", fontWeight: 600, wordBreak: "break-word" }}>{inc.action}</span>
      </div>

      {/* ADDED VOICE MESSAGE BLOCK HERE FOR MOBILE */}
      <VoiceMessageBlock inc={inc} />

      {inc.status !== "resolved" && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: "var(--text3)", letterSpacing: "0.1em", marginBottom: 10, fontFamily: "'DM Mono',monospace" }}>ASSIGN TO STAFF</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {STAFF_LIST.map(staff => {
              const isBusy = staffStatus[staff.id]?.status === "busy";
              const isAssigned = inc.assignedEmail === staff.id;
              return (
                <div key={staff.id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 12px", borderRadius: 8, flexWrap: "wrap", gap: 10,
                  background: isAssigned ? "#4B8FE215" : "var(--bg3)",
                  border: `1px solid ${isAssigned ? "#4B8FE244" : "var(--border)"}`
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: isBusy ? "#E8473F" : "#4CAF7D", flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{staff.name}</div>
                      <div style={{ fontSize: 11, color: "var(--text3)" }}>{staff.role} · {isBusy ? "BUSY" : "FREE"}</div>
                    </div>
                  </div>
                  {isAssigned ? (
                    <button onClick={() => unassignStaff(inc)} style={{ padding: "6px 12px", fontSize: 12, borderRadius: 6, border: "none", background: "#E8473F18", color: "#E8473F", cursor: "pointer", fontWeight: 600, flexGrow: 1, maxWidth: "100px" }}>Unassign</button>
                  ) : (
                    <button onClick={() => assignStaff(inc.id, staff.id, staff.name)} disabled={isBusy} style={{ padding: "6px 12px", fontSize: 12, borderRadius: 6, border: "none", background: isBusy ? "var(--bg4)" : "#4B8FE222", color: isBusy ? "var(--text3)" : "#4B8FE2", cursor: isBusy ? "not-allowed" : "pointer", fontWeight: 600, flexGrow: 1, maxWidth: "100px" }}>
                      {isBusy ? "Busy" : "Assign"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {inc.status !== "resolved" && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {inc.status === "active" && (
            <button onClick={() => updateStatus(inc.id, "inprogress")} style={{ flex: 1, minWidth: "120px", padding: 12, background: "#4B8FE222", color: "#4B8FE2", border: "1px solid #4B8FE244", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>🔄 In Progress</button>
          )}
          <button onClick={() => resolveIncident(inc)} style={{ flex: 1, minWidth: "120px", padding: 12, background: "#4CAF7D22", color: "#4CAF7D", border: "1px solid #4CAF7D44", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>✓ Resolve</button>
        </div>
      )}
    </div>
  );
}

export default function AdminPanel() {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState([]);
  const [staffStatus, setStaffStatus] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState("incidents");
  const [filter, setFilter] = useState("active");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [clock, setClock] = useState(new Date().toLocaleTimeString());
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    const timer = setInterval(() => setClock(new Date().toLocaleTimeString()), 1000);
    return () => { window.removeEventListener("resize", handler); clearInterval(timer); };
  }, []);

  useEffect(() => {
    return onAuthStateChanged(auth, u => {
      setCurrentUser(u);
      if (!u) {
        navigate("/login");
      } else if (u.email !== ADMIN_EMAIL) {
        navigate("/dashboard");
      }
    }); 
  }, []);

  useEffect(() => {
    const q = query(collection(db, "incidents"), orderBy("timestamp", "desc"));
    return onSnapshot(q, snap => setIncidents(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, []);

  useEffect(() => {
    return onSnapshot(collection(db, "staff_status"), snap => {
      const s = {};
      snap.docs.forEach(d => { s[d.id] = d.data(); });
      setStaffStatus(s);
    });
  }, []);

  async function assignStaff(incidentId, staffEmail, staffName) {
    await updateDoc(doc(db, "incidents", incidentId), {
      assignedTo: staffName,
      assignedEmail: staffEmail,
      status: "inprogress"
    });
    await setDoc(doc(db, "staff_status", staffEmail), {
      ...staffStatus[staffEmail],
      status: "busy",
      assignedIncident: incidentId
    }, { merge: true });
    setSelected(prev => prev ? { ...prev, assignedTo: staffName, assignedEmail: staffEmail, status: "inprogress" } : prev);
  }

  async function unassignStaff(inc, fallbackEmail = null) {
    await updateDoc(doc(db, "incidents", inc.id), {
      assignedTo: null, assignedEmail: null, status: "active"
    });
    const targetEmail = inc.assignedEmail || fallbackEmail;
    if (targetEmail) {
      await setDoc(doc(db, "staff_status", targetEmail), {
        status: "free", assignedIncident: null
      }, { merge: true });
    }
    setSelected(prev => prev ? { ...prev, assignedTo: null, assignedEmail: null, status: "active" } : prev);
  }

  async function resolveIncident(inc, fallbackEmail = null) {
    await updateDoc(doc(db, "incidents", inc.id), { status: "resolved" });
    const targetEmail = inc.assignedEmail || fallbackEmail;
    if (targetEmail) {
      await setDoc(doc(db, "staff_status", targetEmail), {
        status: "free", assignedIncident: null
      }, { merge: true });
    }
    setSelected(null);
    setShowDetail(false);
  }

  async function updateStatus(id, status) {
    await updateDoc(doc(db, "incidents", id), { status });
    setSelected(prev => prev ? { ...prev, status } : prev);
  }

  const active = incidents.filter(i => i.status !== "resolved");
  const resolved = incidents.filter(i => i.status === "resolved");
  const sortFn = arr => [...arr].sort((a, b) => ({ P1: 0, P2: 1, P3: 2 }[a.severity] ?? 3) - ({ P1: 0, P2: 1, P3: 2 }[b.severity] ?? 3));
  const displayed = sortFn(filter === "active" ? active : resolved);
  const freeStaff = STAFF_LIST.filter(s => !staffStatus[s.id] || staffStatus[s.id]?.status === "free");

  // Removed the 'Staff Control' tab completely
  const TABS = [
    { id: "incidents", label: isMobile ? "📋" : "📋 Incidents" },
    { id: "assign", label: isMobile ? "⚡" : "⚡ Quick Assign" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", transition: "background 0.3s" }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>

      {/* TOP BAR */}
      <div style={{
        padding: isMobile ? "10px 12px" : "12px 28px",
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10,
        background: "var(--bg2)", position: "sticky", top: 0, zIndex: 50,
        transition: "background 0.3s"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 12 }}>
          <div style={{
            background: "var(--red-dim)", border: "1px solid var(--red-border)",
            borderRadius: 8, padding: isMobile ? "4px 8px" : "4px 10px",
            fontSize: isMobile ? 10 : 11, color: "var(--red)",
            fontFamily: "'DM Mono',monospace", fontWeight: 700
          }}>👑 {isMobile ? "ADMIN" : "ADMIN PANEL"}</div>
          {!isMobile && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Admin Control Panel</div>
              <div style={{ fontSize: 11, color: "var(--text3)" }}>Byte Club Pvt Ltd · Full Access</div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {active.length > 0 && (
            <div style={{
              display: "flex", alignItems: "center", gap: 5,
              background: "var(--red-dim)", border: "1px solid var(--red-border)",
              borderRadius: 20, padding: "4px 10px"
            }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--red)", animation: "pulse 1.2s infinite" }} />
              <span style={{ fontSize: 11, color: "var(--red)", fontFamily: "'DM Mono',monospace" }}>
                {active.length} {isMobile ? "" : "ACTIVE"}
              </span>
            </div>
          )}
          {!isMobile && (
            <div style={{ fontSize: 11, color: "var(--text3)", fontFamily: "'DM Mono',monospace" }}>{clock}</div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: isMobile ? "12px" : "20px 24px" }}>

        {/* Summary cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)",
          gap: isMobile ? 8 : 12, marginBottom: isMobile ? 14 : 20
        }}>
          {[
            { label: "Active", val: active.length, color: "var(--red)" },
            { label: "P1 High", val: active.filter(i => i.severity === "P1").length, color: "#E8473F" },
            { label: "Unassigned", val: active.filter(i => !i.assignedTo).length, color: "var(--amber)" },
            { label: "Staff Free", val: freeStaff.length, color: "var(--green)" },
          ].map(s => (
            <div key={s.label} style={{
              background: "var(--bg2)", border: "1px solid var(--border)",
              borderRadius: 12, padding: isMobile ? "12px" : "16px 18px",
              boxShadow: "var(--card-shadow)"
            }}>
              <div style={{ fontSize: isMobile ? 8 : 9, color: "var(--text3)", letterSpacing: "0.1em", marginBottom: 6, fontFamily: "'DM Mono',monospace" }}>
                {s.label.toUpperCase()}
              </div>
              <div style={{ fontSize: isMobile ? 22 : 32, fontWeight: 800, color: s.color, fontFamily: "'DM Mono',monospace" }}>
                {s.val}
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex", gap: 4, marginBottom: isMobile ? 14 : 20,
          background: "var(--bg2)", border: "1px solid var(--border)",
          borderRadius: 12, padding: 4
        }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setSelected(null); setShowDetail(false); }} style={{
              flex: 1, padding: "10px 0",
              borderRadius: 8, border: "none",
              background: tab === t.id ? "var(--red)" : "transparent",
              color: tab === t.id ? "#fff" : "var(--text2)",
              fontSize: isMobile ? 20 : 13,
              display: "flex", justifyContent: "center", alignItems: "center",
              fontWeight: 600, cursor: "pointer",
              transition: "all 0.15s", fontFamily: "'Syne',sans-serif"
            }}>{t.label}</button>
          ))}
        </div>

        {/* INCIDENTS TAB */}
        {tab === "incidents" && (
          <div>
            {isMobile ? (
              !showDetail ? (
                <div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                    {["active", "resolved"].map(f => (
                      <button key={f} onClick={() => setFilter(f)} style={{
                        flex: 1, padding: "8px 0", borderRadius: 20,
                        background: filter === f ? "var(--red)" : "var(--bg2)",
                        color: filter === f ? "#fff" : "var(--text2)",
                        fontSize: 12, fontWeight: 600, cursor: "pointer",
                        border: `1px solid ${filter === f ? "var(--red)" : "var(--border)"}`,
                      }}>{f === "active" ? `Active (${active.length})` : `Resolved (${resolved.length})`}</button>
                    ))}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {displayed.length === 0 ? (
                      <div style={{ textAlign: "center", padding: 32, color: "var(--text3)" }}>No {filter} incidents</div>
                    ) : displayed.map(inc => {
                      const sc = STATUS_CONFIG[inc.status] || STATUS_CONFIG.active;
                      return (
                        <div key={inc.id} onClick={() => { setSelected(inc); setShowDetail(true); }} style={{
                          background: "var(--bg2)", border: "1px solid var(--border)",
                          borderLeft: `4px solid ${sevColor[inc.severity] || "var(--red)"}`,
                          borderRadius: 12, padding: 14, cursor: "pointer", boxShadow: "var(--card-shadow)"
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, flexWrap: "wrap", gap: 8 }}>
                            <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)", wordBreak: "break-word", flex: 1, minWidth: "150px" }}>
                              {typeIcon[inc.type]} {inc.type} · Room {inc.room}
                            </div>
                            <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: sevBg[inc.severity], color: sevColor[inc.severity], fontFamily: "'DM Mono',monospace", height: "fit-content" }}>
                              {inc.severity}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 8 }}>
                            {inc.guestName} · {timeAgo(inc.timestamp)}
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                            <span style={{ fontSize: 11, color: inc.assignedTo ? "var(--blue)" : "var(--amber)" }}>
                              {inc.assignedTo ? `👤 ${inc.assignedTo}` : "⚠️ Unassigned"}
                            </span>
                            <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: sc.bg, color: sc.color }}>
                              {sc.icon} {sc.label}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div>
                  <button onClick={() => setShowDetail(false)} style={{
                    background: "transparent", border: "none", color: "var(--text2)",
                    fontSize: 14, cursor: "pointer", padding: "0 0 14px 0",
                    fontFamily: "'Syne',sans-serif", display: "flex", alignItems: "center", gap: 4
                  }}>← Back</button>
                  {selected && (
                    <MobileIncidentDetail
                      inc={selected}
                      staffStatus={staffStatus}
                      STAFF_LIST={STAFF_LIST}
                      STATUS_CONFIG={STATUS_CONFIG}
                      typeIcon={typeIcon}
                      sevBg={sevBg}
                      sevColor={sevColor}
                      timeAgo={timeAgo}
                      unassignStaff={unassignStaff}
                      assignStaff={assignStaff}
                      updateStatus={updateStatus}
                      resolveIncident={resolveIncident}
                    />
                  )}
                </div>
              )
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 1fr" : "1fr", gap: 16 }}>
                <div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                    {["active", "resolved"].map(f => (
                      <button key={f} onClick={() => setFilter(f)} style={{
                        padding: "6px 20px", borderRadius: 20,
                        background: filter === f ? "var(--red)" : "var(--bg2)",
                        color: filter === f ? "#fff" : "var(--text2)",
                        fontSize: 12, fontWeight: 600, cursor: "pointer",
                        border: `1px solid ${filter === f ? "var(--red)" : "var(--border)"}`,
                      }}>{f === "active" ? `Active (${active.length})` : `Resolved (${resolved.length})`}</button>
                    ))}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {displayed.length === 0 ? (
                      <div style={{ textAlign: "center", padding: 40, color: "var(--text3)" }}>No {filter} incidents</div>
                    ) : displayed.map(inc => {
                      const sc = STATUS_CONFIG[inc.status] || STATUS_CONFIG.active;
                      return (
                        <div key={inc.id} onClick={() => setSelected(selected?.id === inc.id ? null : inc)} style={{
                          background: "var(--bg2)",
                          border: `1px solid ${selected?.id === inc.id ? sevColor[inc.severity] : "var(--border)"}`,
                          borderLeft: `4px solid ${sevColor[inc.severity] || "var(--red)"}`,
                          borderRadius: 12, padding: 14, cursor: "pointer",
                          boxShadow: "var(--card-shadow)", transition: "all 0.15s"
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
                            <div style={{ flex: 1, minWidth: "150px" }}>
                              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text)", marginBottom: 3, wordBreak: "break-word" }}>
                                {typeIcon[inc.type]} {inc.type} · Room {inc.room}
                              </div>
                              <div style={{ fontSize: 12, color: "var(--text3)" }}>
                                {inc.guestName} · {timeAgo(inc.timestamp)}{inc.voiceReport && " · 🎤"}
                              </div>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                              <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: sevBg[inc.severity], color: sevColor[inc.severity], fontFamily: "'DM Mono',monospace", fontWeight: 700 }}>
                                {inc.severity === "P1" ? "HIGH" : inc.severity === "P2" ? "MED" : "LOW"} · {inc.severity}
                              </span>
                              <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: sc.bg, color: sc.color, fontWeight: 600 }}>
                                {sc.icon} {sc.label}
                              </span>
                            </div>
                          </div>
                          {inc.assignedTo ? (
                            <div style={{ fontSize: 12, color: "var(--blue)", marginBottom: 6 }}>👤 {inc.assignedTo}</div>
                          ) : (
                            <div style={{ fontSize: 12, color: "var(--amber)", marginBottom: 6 }}>⚠️ Unassigned</div>
                          )}
                          <div style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.4, marginBottom: 10, wordBreak: "break-word" }}>
                            {inc.briefing?.slice(0, 80)}...
                          </div>
                          {inc.status !== "resolved" && (
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }} onClick={e => e.stopPropagation()}>
                              {!inc.assignedTo && freeStaff.length > 0 && (
                                <button onClick={() => assignStaff(inc.id, freeStaff[0].id, freeStaff[0].name)} style={{ padding: "5px 12px", fontSize: 11, borderRadius: 8, border: "none", background: "#4B8FE222", color: "#4B8FE2", cursor: "pointer", fontWeight: 600 }}>⚡ Auto Assign</button>
                              )}
                              {inc.status === "active" && (
                                <button onClick={() => updateStatus(inc.id, "inprogress")} style={{ padding: "5px 12px", fontSize: 11, borderRadius: 8, border: "none", background: "#4B8FE222", color: "#4B8FE2", cursor: "pointer", fontWeight: 600 }}>🔄 In Progress</button>
                              )}
                              <button onClick={() => resolveIncident(inc)} style={{ padding: "5px 12px", fontSize: 11, borderRadius: 8, border: "none", background: "#4CAF7D22", color: "#4CAF7D", cursor: "pointer", fontWeight: 600 }}>✓ Resolve</button>
                              {inc.assignedTo && (
                                <button onClick={() => unassignStaff(inc)} style={{ padding: "5px 12px", fontSize: 11, borderRadius: 8, border: "none", background: "#E8473F18", color: "#E8473F", cursor: "pointer", fontWeight: 600 }}>✕ Unassign</button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {selected && (
                  <div style={{
                    background: "var(--bg2)", border: "1px solid var(--border)",
                    borderRadius: 16, padding: 20, boxShadow: "var(--card-shadow)",
                    height: "fit-content", position: "sticky", top: 80
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                      <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--text)" }}>Incident Details</h3>
                      <button onClick={() => setSelected(null)} style={{ background: "transparent", border: "none", color: "var(--text3)", cursor: "pointer", fontSize: 18 }}>✕</button>
                    </div>

                    <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
                      <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 11, background: sevBg[selected.severity], color: sevColor[selected.severity], fontFamily: "'DM Mono',monospace", fontWeight: 600 }}>{selected.severity}</span>
                      <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 11, background: STATUS_CONFIG[selected.status]?.bg, color: STATUS_CONFIG[selected.status]?.color, fontWeight: 600 }}>
                        {STATUS_CONFIG[selected.status]?.icon} {STATUS_CONFIG[selected.status]?.label}
                      </span>
                    </div>

                    <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", marginBottom: 6 }}>
                      {typeIcon[selected.type]} {selected.type} — Room {selected.room}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 14 }}>
                      {selected.guestName} · {timeAgo(selected.timestamp)}
                    </div>

                    <div style={{ background: "#8B7FE810", border: "1px solid #8B7FE830", borderRadius: 10, padding: 14, marginBottom: 14 }}>
                      <div style={{ fontSize: 10, color: "var(--purple)", letterSpacing: "0.1em", marginBottom: 8, fontFamily: "'DM Mono',monospace" }}>AI BRIEFING</div>
                      <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.6 }}>{selected.briefing}</div>
                    </div>

                    <div style={{ background: "var(--red-dim)", border: "1px solid var(--red-border)", borderRadius: 10, padding: 12, marginBottom: 14 }}>
                      <span style={{ color: "var(--red)" }}>⚡ </span>
                      <span style={{ fontSize: 13, color: "var(--text)", fontWeight: 600 }}>{selected.action}</span>
                    </div>

                    {/* ADDED VOICE MESSAGE BLOCK HERE FOR DESKTOP */}
                    <VoiceMessageBlock inc={selected} />

                    {/* Assign staff */}
                    {selected.status !== "resolved" && (
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 11, color: "var(--text3)", letterSpacing: "0.1em", marginBottom: 10, fontFamily: "'DM Mono',monospace" }}>ASSIGN TO STAFF</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {STAFF_LIST.map(staff => {
                            const isBusy = staffStatus[staff.id]?.status === "busy";
                            const isAssigned = selected.assignedEmail === staff.id;
                            return (
                              <div key={staff.id} style={{
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                padding: "8px 12px", borderRadius: 8,
                                background: isAssigned ? "#4B8FE215" : "var(--bg3)",
                                border: `1px solid ${isAssigned ? "#4B8FE244" : "var(--border)"}`
                              }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: isBusy ? "#E8473F" : "#4CAF7D" }} />
                                  <div>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{staff.name}</div>
                                    <div style={{ fontSize: 10, color: "var(--text3)" }}>{staff.role} · {isBusy ? "BUSY" : "FREE"}</div>
                                  </div>
                                </div>
                                {isAssigned ? (
                                  <button onClick={() => unassignStaff(selected)} style={{ padding: "4px 12px", fontSize: 11, borderRadius: 6, border: "none", background: "#E8473F18", color: "#E8473F", cursor: "pointer", fontWeight: 600 }}>Unassign</button>
                                ) : (
                                  <button onClick={() => assignStaff(selected.id, staff.id, staff.name)} disabled={isBusy} style={{ padding: "4px 12px", fontSize: 11, borderRadius: 6, border: "none", background: isBusy ? "var(--bg4)" : "#4B8FE222", color: isBusy ? "var(--text3)" : "#4B8FE2", cursor: isBusy ? "not-allowed" : "pointer", fontWeight: 600 }}>
                                    {isBusy ? "Busy" : "Assign"}
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {selected.status !== "resolved" && (
                      <div style={{ display: "flex", gap: 8 }}>
                        {selected.status === "active" && (
                          <button onClick={() => updateStatus(selected.id, "inprogress")} style={{ flex: 1, padding: 10, background: "#4B8FE222", color: "#4B8FE2", border: "1px solid #4B8FE244", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>🔄 In Progress</button>
                        )}
                        <button onClick={() => resolveIncident(selected)} style={{ flex: 1, padding: 10, background: "#4CAF7D22", color: "#4CAF7D", border: "1px solid #4CAF7D44", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>✓ Resolve</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* QUICK ASSIGN TAB */}
        {tab === "assign" && (
          <div>
            <div style={{ marginBottom: 14, padding: 14, background: "var(--red-dim)", border: "1px solid var(--red-border)", borderRadius: 12, fontSize: 13, color: "var(--red)" }}>
              ⚠️ {active.filter(i => !i.assignedTo).length} unassigned · {freeStaff.length} staff free
            </div>

            {active.filter(i => !i.assignedTo).length === 0 ? (
              <div style={{ textAlign: "center", padding: 32, color: "var(--text3)", background: "var(--bg2)", borderRadius: 12, border: "1px solid var(--border)" }}>
                ✓ All incidents are assigned
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {active.filter(i => !i.assignedTo)
                  .sort((a, b) => ({ P1: 0, P2: 1, P3: 2 }[a.severity] ?? 3) - ({ P1: 0, P2: 1, P3: 2 }[b.severity] ?? 3))
                  .map(inc => (
                    <div key={inc.id} style={{
                      background: "var(--bg2)", border: "1px solid var(--border)",
                      borderLeft: `4px solid ${sevColor[inc.severity]}`,
                      borderRadius: 12, padding: 14, boxShadow: "var(--card-shadow)"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)", wordBreak: "break-word", flex: 1, minWidth: "150px" }}>
                          {typeIcon[inc.type]} {inc.type} · Room {inc.room}
                        </div>
                        <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: sevBg[inc.severity], color: sevColor[inc.severity], fontFamily: "'DM Mono',monospace" }}>
                          {inc.severity}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 10, wordBreak: "break-word" }}>{inc.briefing?.slice(0, 80)}...</div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {freeStaff.length === 0 ? (
                          <span style={{ fontSize: 12, color: "var(--amber)" }}>⚠️ No free staff</span>
                        ) : freeStaff.map(staff => (
                          <button key={staff.id} onClick={() => assignStaff(inc.id, staff.id, staff.name)} style={{
                            padding: "6px 14px", fontSize: 12, borderRadius: 8, border: "none",
                            background: "#4B8FE222", color: "#4B8FE2", cursor: "pointer", fontWeight: 600, flexGrow: 1
                          }}>
                            → {staff.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {active.filter(i => !i.assignedTo).length > 0 && freeStaff.length > 0 && (
              <button onClick={async () => {
                const unassigned = active.filter(i => !i.assignedTo);
                for (let i = 0; i < Math.min(unassigned.length, freeStaff.length); i++) {
                  await assignStaff(unassigned[i].id, freeStaff[i].id, freeStaff[i].name);
                }
              }} style={{
                width: "100%", padding: 14, marginTop: 14,
                background: "var(--red)", color: "#fff", border: "none",
                borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer"
              }}>⚡ Auto Assign All</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}