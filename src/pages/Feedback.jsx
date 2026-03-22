import { useState } from "react";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useSearchParams } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";
import LanguageSelector from "../components/LanguageSelector";
import { useLanguage } from "../context/LanguageContext";

export default function Feedback() {
  const { t } = useLanguage();
  const [params]                  = useSearchParams();
  const incidentId                = params.get("id");
  const [rating, setRating]       = useState(0);
  const [hovered, setHovered]     = useState(0);
  const [comment, setComment]     = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]     = useState(false);

  const RATING_COLORS = ["", "#E8473F", "#F0A500", "#EF9F27", "#4B8FE2", "#4CAF7D"];
  const RATING_LABELS = ["", t.poor, t.fair, t.good, t.great, t.excellent];
  const QUICK_LABELS  = [t.staffFast, t.staffHelpful, t.feltSafe, t.clearComms];

  async function handleSubmit() {
    if (!rating) return alert("Please select a rating");
    setLoading(true);
    try {
      await addDoc(collection(db, "feedback"), {
        incidentId: incidentId || "unknown", rating, comment,
        timestamp: serverTimestamp()
      });
      setSubmitted(true);
    } catch (e) {
      alert("Error submitting feedback.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", transition: "background 0.3s" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
        <span onClick={() => window.location.href = "/"} style={{ fontFamily: "'DM Mono',monospace", fontWeight: 700, color: "var(--red)", fontSize: 15, cursor: "pointer" }}>NEXUS</span>
        <div style={{ display: "flex", gap: 8 }}><LanguageSelector /><ThemeToggle /></div>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#4CAF7D18", border: "2px solid #4CAF7D", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, marginBottom: 24 }}>★</div>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "var(--green)", marginBottom: 12 }}>{t.thankYou}</h2>
        <p style={{ color: "var(--text2)", fontSize: 15, maxWidth: 300, lineHeight: 1.7 }}>{t.feedbackHelps}</p>
      </div>
    </div>
  );

  const displayRating = hovered || rating;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", transition: "background 0.3s" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: "1px solid var(--border)", background: "var(--bg2)" }}>
        <span style={{ fontFamily: "'DM Mono',monospace", fontWeight: 700, color: "var(--red)", fontSize: 15, cursor: "pointer" }} onClick={() => window.location.href = "/"}>NEXUS</span>
        <div style={{ display: "flex", gap: 8 }}><LanguageSelector /><ThemeToggle /></div>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontSize: 10, color: "var(--red)", letterSpacing: "0.14em", fontFamily: "'DM Mono',monospace", marginBottom: 10 }}>BYTE CLUB PVT LTD</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>{t.howDidWeDo}</h2>
            <p style={{ color: "var(--text2)", fontSize: 14, lineHeight: 1.6 }}>{t.incidentResolved}</p>
          </div>

          <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 18, padding: 28, boxShadow: "var(--card-shadow)" }}>
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 11, color: "var(--text3)", letterSpacing: "0.1em", display: "block", marginBottom: 16, fontFamily: "'DM Mono',monospace" }}>
                {t.rateExperience}
              </label>
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                {[1, 2, 3, 4, 5].map(n => {
                  const isActive = displayRating >= n;
                  const c = RATING_COLORS[displayRating] || "var(--text3)";
                  return (
                    <button key={n}
                      onClick={() => setRating(n)}
                      onMouseEnter={() => setHovered(n)}
                      onMouseLeave={() => setHovered(0)}
                      style={{
                        width: 52, height: 52, borderRadius: 12, cursor: "pointer",
                        fontSize: 26, lineHeight: 1,
                        border: `1.5px solid ${isActive ? c : "var(--border2)"}`,
                        background: isActive ? c + "22" : "var(--bg3)",
                        color: isActive ? c : "var(--text3)",
                        transition: "all 0.15s",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transform: isActive ? "scale(1.08)" : "scale(1)"
                      }}>★</button>
                  );
                })}
              </div>
              {displayRating > 0 && (
                <div style={{ textAlign: "center", marginTop: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  {[...Array(displayRating)].map((_, i) => (
                    <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: RATING_COLORS[displayRating], animation: `fadeIn 0.2s ease ${i * 0.05}s both` }} />
                  ))}
                  <span style={{ fontSize: 14, fontWeight: 700, color: RATING_COLORS[displayRating] }}>{RATING_LABELS[displayRating]}</span>
                </div>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
              {QUICK_LABELS.map(label => {
                const active = comment.includes(label);
                return (
                  <button key={label} onClick={() => {
                    setComment(prev => prev.includes(label) ? prev.replace(label + ". ", "") : prev + label + ". ");
                  }} style={{
                    padding: "10px 12px", borderRadius: 10, cursor: "pointer", fontSize: 12, textAlign: "center",
                    border: `1px solid ${active ? "var(--red)" : "var(--border2)"}`,
                    background: active ? "var(--red-dim)" : "var(--bg3)",
                    color: active ? "var(--red)" : "var(--text2)",
                    transition: "all 0.15s", fontFamily: "'Syne',sans-serif"
                  }}>{label}</button>
                );
              })}
            </div>

            <div style={{ marginBottom: 22 }}>
              <label style={{ fontSize: 11, color: "var(--text3)", letterSpacing: "0.1em", display: "block", marginBottom: 8, fontFamily: "'DM Mono',monospace" }}>
                {t.additionalComments}
              </label>
              <textarea value={comment} onChange={e => setComment(e.target.value)}
                placeholder={t.commentsPlaceholder} rows={3} style={{
                  width: "100%", padding: "12px 14px", background: "var(--input-bg)",
                  border: "1px solid var(--border2)", borderRadius: 10,
                  color: "var(--text)", fontSize: 13, outline: "none", resize: "none", transition: "border-color 0.2s"
                }}
                onFocus={e => e.target.style.borderColor = "var(--red)"}
                onBlur={e => e.target.style.borderColor = "var(--border2)"}
              />
            </div>

            <button onClick={handleSubmit} disabled={loading || !rating} style={{
              width: "100%", padding: 14,
              background: !rating || loading ? "var(--bg3)" : "var(--red)",
              color: !rating || loading ? "var(--text3)" : "#fff",
              border: `1px solid ${!rating ? "var(--border)" : "transparent"}`,
              borderRadius: 10, fontSize: 15, fontWeight: 700,
              cursor: !rating || loading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.2s"
            }}>
              {loading ? <><div className="spinner" />{t.submitting}</> : t.submitFeedback}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}