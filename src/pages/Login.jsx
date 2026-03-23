import { useState } from "react";
import { auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";
import LanguageSelector from "../components/LanguageSelector";
import { useLanguage } from "../context/LanguageContext";

export default function Login() {
  const { t } = useLanguage();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();

  async function handleLogin() {
    if (!email || !password) return setError(t.fillFields);
    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/dashboard");
    } catch (e) {
      setError(t.invalidCredentials);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", transition: "background 0.3s" }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "16px 24px", borderBottom: "1px solid var(--border)"
      }}>
        <span onClick={() => window.location.href = "/"} style={{ fontFamily: "'DM Mono',monospace", fontWeight: 700, color: "var(--red)", fontSize: 15, cursor: "pointer" }}>NEXUS</span>
        <div style={{ display: "flex", gap: 8 }}>
          <LanguageSelector />
          <ThemeToggle />
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ width: "100%", maxWidth: 380 }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: "var(--red)", fontFamily: "'DM Mono',monospace", letterSpacing: "0.06em", marginBottom: 6 }}>NEXUS</div>
            <div style={{ fontSize: 11, color: "var(--text3)", letterSpacing: "0.12em" }}>{t.staffAccess}</div>
          </div>

          <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 16, padding: 28, boxShadow: "var(--card-shadow)" }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6, color: "var(--text)" }}>{t.staffLogin2}</h2>
            <p style={{ color: "var(--text3)", fontSize: 13, marginBottom: 24 }}>{t.accessCrisis}</p>

            {[
              { label: t.email,    val: email,    set: setEmail,    type: "email",    placeholder: "yourname@byteclubhotel.com" },
              { label: t.password, val: password, set: setPassword, type: "password", placeholder: "••••••••" },
            ].map(f => (
              <div key={f.label} style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, color: "var(--text3)", letterSpacing: "0.1em", display: "block", marginBottom: 7, fontFamily: "'DM Mono',monospace" }}>
                  {f.label}
                </label>
                <input
                  value={f.val} onChange={e => f.set(e.target.value)}
                  type={f.type} placeholder={f.placeholder}
                  onKeyDown={e => e.key === "Enter" && handleLogin()}
                  style={{
                    width: "100%", padding: "12px 14px", background: "var(--input-bg)",
                    border: "1px solid var(--border2)", borderRadius: 8, color: "var(--text)",
                    fontSize: 14, outline: "none", transition: "border-color 0.2s"
                  }}
                  onFocus={e => e.target.style.borderColor = "var(--red)"}
                  onBlur={e => e.target.style.borderColor = "var(--border2)"}
                />
              </div>
            ))}

            {error && (
              <div style={{ background: "var(--red-dim)", border: "1px solid var(--red-border)", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "var(--red)" }}>
                {error}
              </div>
            )}

            <button onClick={handleLogin} disabled={loading} style={{
              width: "100%", padding: 14,
              background: loading ? "var(--bg3)" : "var(--red)",
              color: loading ? "var(--text3)" : "#fff",
              border: "none", borderRadius: 8, fontSize: 15, fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "all 0.2s"
            }}>
              {loading ? <><div className="spinner" />{t.signingIn}</> : t.signIn}
            </button>

            <div style={{ marginTop: 20, padding: "10px 14px", background: "var(--bg3)", borderRadius: 8, fontSize: 12, color: "var(--text3)", textAlign: "center", lineHeight: 1.8 }}>
              User Id & Password Are Given To The Staffs
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}