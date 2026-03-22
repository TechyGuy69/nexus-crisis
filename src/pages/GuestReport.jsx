import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import ThemeToggle from "../components/ThemeToggle";
import LanguageSelector from "../components/LanguageSelector";
import { useLanguage } from "../context/LanguageContext";

export default function GuestReport() {
  const { t } = useLanguage();
  const [step, setStep]           = useState(1);
  const [type, setType]           = useState("");
  const [message, setMessage]     = useState("");
  const [room, setRoom]           = useState("");
  const [name, setName]           = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [mounted, setMounted]     = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const CRISIS_TYPES = [
    { id: "Medical",  icon: "♥", color: "#E8473F", label: t.medical,  desc: t.medicalDesc  },
    { id: "Fire",     icon: "▲", color: "#F0A500", label: t.fire,     desc: t.fireDesc     },
    { id: "Security", icon: "◉", color: "#4B8FE2", label: t.security, desc: t.securityDesc },
    { id: "Flood",    icon: "◈", color: "#4CAF7D", label: t.flood,    desc: t.floodDesc    },
    { id: "Panic",    icon: "!", color: "#D4537E", label: t.panic,    desc: t.panicDesc    },
    { id: "Other",    icon: "…", color: "#7e7d8f", label: t.other,    desc: t.otherDesc    },
  ];

  const selectedType = CRISIS_TYPES.find(ct => ct.id === type);

  async function handleSubmit() {
    if (!type || !room) return;
    setLoading(true);
    try {
      const GEMINI_KEY = import.meta.env.VITE_GEMINI_KEY;
      const aiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              role: "user",
              parts: [{
                text: `You are a hotel crisis response AI for Byte Club Pvt Ltd. Guest name: ${name || "Unknown"}. Room: ${room}. Crisis type: ${type}. Message: "${message}". Return ONLY a raw JSON object with no markdown, no backticks, no explanation. Exactly this format: {"severity":"P1","briefing":"one sentence for staff","action":"single immediate action","responders":["role1","role2"],"estimated_minutes":5}`
              }]
            }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 256 }
          })
        }
      );
      if (!aiRes.ok) throw new Error("API error");
      const aiData  = await aiRes.json();
      const rawText = aiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      const cleaned = rawText.replace(/```json|```/g, "").trim();
      let aiJson = { severity: "P2", briefing: "Staff alerted.", action: "Respond immediately.", responders: ["Security"], estimated_minutes: 5 };
      try { aiJson = JSON.parse(cleaned); } catch (e) {}

      await addDoc(collection(db, "incidents"), {
        room, type, message,
        guestName: name || "Anonymous",
        severity: aiJson.severity || "P2",
        briefing: aiJson.briefing || "Staff alerted.",
        action: aiJson.action || "Respond immediately.",
        responders: aiJson.responders || ["Security"],
        estimatedMinutes: aiJson.estimated_minutes || 5,
        status: "active",
        timestamp: serverTimestamp()
      });
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      alert("Error sending alert. Please call 112 directly.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) return (
    <div style={{
      minHeight: "100vh", background: "var(--bg)",
      display: "flex", flexDirection: "column",
      transition: "background 0.3s"
    }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "14px 20px", borderBottom: "1px solid var(--border)"
      }}>
        <span onClick={() => window.location.href = "/"} style={{ fontFamily: "'DM Mono',monospace", fontWeight: 700, color: "var(--red)", fontSize: 15, cursor: "pointer" }}>NEXUS</span>
        <div style={{ display: "flex", gap: 8 }}>
          <LanguageSelector />
          <ThemeToggle />
        </div>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
        <div style={{
          width: 80, height: 80, borderRadius: "50%",
          background: "#4CAF7D18", border: "2px solid #4CAF7D",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 32, marginBottom: 24, animation: "fadeIn 0.4s ease"
        }}>✓</div>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: "var(--green)", marginBottom: 10 }}>{t.helpOnWay}</h2>
        <p style={{ color: "var(--text2)", fontSize: 15, maxWidth: 300, lineHeight: 1.7, marginBottom: 32 }}>
          {t.staffNotified}
        </p>
        <div style={{
          background: "var(--bg2)", border: "1px solid var(--border)",
          borderRadius: 16, padding: 20, maxWidth: 300, width: "100%",
          boxShadow: "var(--card-shadow)"
        }}>
          <div style={{ fontSize: 10, color: "var(--text3)", letterSpacing: "0.1em", marginBottom: 12, fontFamily: "'DM Mono',monospace" }}>
            {t.emergencyContacts}
          </div>
          {[
            { label: t.reception, val: "0" },
            { label: t.nationalEmergency, val: "112" },
          ].map(c => (
            <div key={c.label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
              <span style={{ fontSize: 14, color: "var(--text2)" }}>{c.label}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--red)", fontFamily: "'DM Mono',monospace" }}>{c.val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", transition: "background 0.3s" }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "14px 20px", borderBottom: "1px solid var(--border)"
      }}>
        <span style={{ fontFamily: "'DM Mono',monospace", fontWeight: 700, color: "var(--red)", fontSize: 15, cursor: "pointer" }} onClick={() => window.location.href = "/"}>NEXUS</span>
        <div style={{ display: "flex", gap: 8 }}>
          <LanguageSelector />
          <ThemeToggle />
        </div>
      </div>

      {selectedType && (
        <div style={{
          position: "fixed", top: "30%", left: "50%", transform: "translate(-50%,-50%)",
          width: 400, height: 400, borderRadius: "50%", pointerEvents: "none",
          background: `radial-gradient(circle, ${selectedType.color}10 0%, transparent 70%)`,
          transition: "background 0.5s", zIndex: 0
        }} />
      )}

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 20px", position: "relative", zIndex: 1 }}>
        <div style={{ width: "100%", maxWidth: 420 }}>

          <div style={{
            textAlign: "center", marginBottom: 28,
            opacity: mounted ? 1 : 0,
            animation: mounted ? "fadeUp 0.4s ease both" : "none"
          }}>
            <div style={{
              display: "inline-block", background: "var(--red-dim)",
              border: "1px solid var(--red-border)", borderRadius: 6,
              padding: "4px 12px", fontSize: 10, color: "var(--red)",
              letterSpacing: "0.14em", marginBottom: 12, fontFamily: "'DM Mono',monospace"
            }}>{t.hotelTag}</div>
            <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text)" }}>
              {step === 1 ? t.whoAreYou : t.whatsHappening}
            </h1>
            <p style={{ color: "var(--text2)", fontSize: 14, marginTop: 8 }}>
              {step === 1 ? t.helpUsFindYou : t.chooseEmergency}
            </p>
          </div>

          <div style={{ height: 3, background: "var(--border)", borderRadius: 2, marginBottom: 28, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 2, background: "var(--red)",
              width: step === 1 ? "50%" : "100%", transition: "width 0.4s ease"
            }} />
          </div>

          {step === 1 && (
            <div style={{ animation: "fadeUp 0.35s ease" }}>
              {[
                { label: t.yourName,    placeholder: t.namePlaceholder, val: name, set: setName },
                { label: t.roomNumber,  placeholder: t.roomPlaceholder, val: room, set: setRoom },
              ].map(f => (
                <div key={f.label} style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 11, color: "var(--text3)", letterSpacing: "0.1em", display: "block", marginBottom: 7, fontFamily: "'DM Mono',monospace" }}>
                    {f.label}
                  </label>
                  <input
                    value={f.val} onChange={e => f.set(e.target.value)}
                    placeholder={f.placeholder}
                    style={{
                      width: "100%", padding: "14px 16px", background: "var(--input-bg)",
                      border: "1px solid var(--border2)", borderRadius: 12,
                      color: "var(--text)", fontSize: 15, outline: "none", transition: "border-color 0.2s"
                    }}
                    onFocus={e => e.target.style.borderColor = "var(--red)"}
                    onBlur={e => e.target.style.borderColor = "var(--border2)"}
                  />
                </div>
              ))}
              <button
                onClick={() => { if (!room.trim()) return alert("Please enter your room number"); setStep(2); }}
                style={{
                  width: "100%", padding: 15, background: "var(--red)", color: "#fff",
                  border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer", marginTop: 8
                }}>{t.continue}</button>
            </div>
          )}

          {step === 2 && (
            <div style={{ animation: "fadeUp 0.35s ease" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
                {CRISIS_TYPES.map(ct => (
                  <button key={ct.id} onClick={() => setType(ct.id)} style={{
                    padding: "16px 12px", borderRadius: 12, cursor: "pointer", textAlign: "left",
                    border: `1.5px solid ${type === ct.id ? ct.color : "var(--border)"}`,
                    background: type === ct.id ? ct.color + "15" : "var(--input-bg)",
                    transition: "all 0.15s", position: "relative", overflow: "hidden"
                  }}>
                    {type === ct.id && (
                      <div style={{ position: "absolute", top: 8, right: 8, width: 7, height: 7, borderRadius: "50%", background: ct.color, animation: "pulse 1.5s infinite" }} />
                    )}
                    <div style={{ fontSize: 22, marginBottom: 6, color: ct.color }}>{ct.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: type === ct.id ? ct.color : "var(--text)", marginBottom: 2 }}>{ct.label}</div>
                    <div style={{ fontSize: 11, color: "var(--text3)" }}>{ct.desc}</div>
                  </button>
                ))}
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 11, color: "var(--text3)", letterSpacing: "0.1em", display: "block", marginBottom: 7, fontFamily: "'DM Mono',monospace" }}>
                  {t.describeSituation}
                </label>
                <textarea
                  value={message} onChange={e => setMessage(e.target.value)}
                  placeholder={t.describePlaceholder}
                  rows={3} style={{
                    width: "100%", padding: "12px 16px", background: "var(--input-bg)",
                    border: "1px solid var(--border2)", borderRadius: 12,
                    color: "var(--text)", fontSize: 14, outline: "none", resize: "none", transition: "border-color 0.2s"
                  }}
                  onFocus={e => e.target.style.borderColor = selectedType?.color || "var(--red)"}
                  onBlur={e => e.target.style.borderColor = "var(--border2)"}
                />
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setStep(1)} style={{
                  padding: "14px 20px", background: "var(--bg3)", color: "var(--text2)",
                  border: "1px solid var(--border)", borderRadius: 12, fontSize: 14, cursor: "pointer"
                }}>{t.back}</button>
                <button onClick={handleSubmit} disabled={loading || !type} style={{
                  flex: 1, padding: 14,
                  background: !type ? "var(--bg3)" : selectedType?.color || "var(--red)",
                  color: !type || loading ? "var(--text3)" : "#fff",
                  border: `1px solid ${!type ? "var(--border)" : "transparent"}`,
                  borderRadius: 12, fontSize: 16, fontWeight: 700,
                  cursor: !type || loading ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10, transition: "all 0.2s"
                }}>
                  {loading ? <><div className="spinner" />{t.alertingStaff}</> : t.sendAlert}
                </button>
              </div>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 24 }}>
            {[1, 2].map(s => (
              <div key={s} style={{
                height: 4, borderRadius: 2,
                width: s === step ? 24 : 8,
                background: s === step ? "var(--red)" : "var(--border2)",
                transition: "all 0.3s ease"
              }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}