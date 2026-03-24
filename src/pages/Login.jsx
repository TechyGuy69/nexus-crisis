import { useState } from "react";
import { auth, ADMIN_EMAIL } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";
import LanguageSelector from "../components/LanguageSelector";
import { useLanguage } from "../context/LanguageContext";

export default function Login() {
  const { t } = useLanguage();
  const [loginType, setLoginType] = useState(null); // null = choose, "admin" or "staff"
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);
  const navigate = useNavigate();

  const STAFF_EMAILS = [
    "sayan@byteclubhotel.com",
    "sohini@byteclubhotel.com",
    "debasmita@byteclubhotel.com",
    "usnish@byteclubhotel.com",
  ];

  async function handleLogin() {
    if (!email || !password) return setError(t.fillFields);
    setLoading(true);
    setError("");
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      if (cred.user.email === ADMIN_EMAIL) {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch (e) {
      setError(t.invalidCredentials);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh", background: "var(--bg)",
      display: "flex", flexDirection: "column",
      transition: "background 0.3s"
    }}>
      {/* Top bar */}
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center", padding: "14px 20px",
        borderBottom: "1px solid var(--border)", background: "var(--bg2)"
      }}>
        <span onClick={() => navigate("/")} style={{
          fontFamily: "'DM Mono',monospace", fontWeight: 700,
          color: "var(--red)", fontSize: 16, cursor: "pointer"
        }}>NEXUS</span>
        <div style={{ display: "flex", gap: 8 }}>
          <LanguageSelector />
          <ThemeToggle />
        </div>
      </div>

      <div style={{
        flex: 1, display: "flex",
        alignItems: "center", justifyContent: "center", padding: 24
      }}>
        <div style={{ width: "100%", maxWidth: 420 }}>

          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{
              fontSize: 36, fontWeight: 800, color: "var(--red)",
              fontFamily: "'DM Mono',monospace", letterSpacing: "0.06em", marginBottom: 6
            }}>NEXUS</div>
            <div style={{ fontSize: 12, color: "var(--text3)", letterSpacing: "0.12em" }}>
              BYTE CLUB PVT LTD · SECURE ACCESS
            </div>
          </div>

          {/* Choose login type */}
          {!loginType && (
            <div style={{ animation: "fadeUp 0.3s ease" }}>
              <p style={{ textAlign: "center", color: "var(--text2)", fontSize: 15, marginBottom: 24 }}>
                Select your role to continue
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

                {/* Admin */}
                <button onClick={() => { setLoginType("admin"); setEmail(ADMIN_EMAIL); }} style={{
                  padding: "20px 24px", background: "var(--bg2)",
                  border: "1.5px solid var(--red-border)", borderRadius: 16,
                  cursor: "pointer", textAlign: "left",
                  transition: "all 0.15s", boxShadow: "var(--card-shadow)"
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "var(--red)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "var(--red-border)"}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 12,
                      background: "var(--red-dim)", border: "1px solid var(--red-border)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 22, flexShrink: 0
                    }}>👑</div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 3 }}>
                        Admin Login
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text2)" }}>
                        Full control · Assign staff · View all incidents
                      </div>
                    </div>
                  </div>
                </button>

                {/* Staff */}
                <button onClick={() => { setLoginType("staff"); setEmail(""); }} style={{
                  padding: "20px 24px", background: "var(--bg2)",
                  border: "1.5px solid var(--border2)", borderRadius: 16,
                  cursor: "pointer", textAlign: "left",
                  transition: "all 0.15s", boxShadow: "var(--card-shadow)"
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "var(--blue)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border2)"}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 12,
                      background: "#4B8FE218", border: "1px solid #4B8FE233",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 22, flexShrink: 0
                    }}>👤</div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 3 }}>
                        Staff Login
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text2)" }}>
                        View assigned incidents · Update status
                      </div>
                    </div>
                  </div>
                </button>
              </div>

              {/* Demo hint */}
              <div style={{
                marginTop: 20, padding: "12px 16px",
                background: "var(--bg3)", borderRadius: 10,
                fontSize: 12, color: "var(--text3)", lineHeight: 1.8, textAlign: "center"
              }}>
                <div style={{ fontWeight: 600, color: "var(--text2)", marginBottom: 4 }}>Please Login</div>
                <div>Use Correct ID & Password</div>
              </div>
            </div>
          )}

          {/* Login form */}
          {loginType && (
            <div style={{ animation: "fadeUp 0.3s ease" }}>

              {/* Role badge */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                marginBottom: 20
              }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 14px", borderRadius: 20,
                  background: loginType === "admin" ? "var(--red-dim)" : "#4B8FE218",
                  border: `1px solid ${loginType === "admin" ? "var(--red-border)" : "#4B8FE233"}`
                }}>
                  <span style={{ fontSize: 16 }}>{loginType === "admin" ? "👑" : "👤"}</span>
                  <span style={{
                    fontSize: 13, fontWeight: 600,
                    color: loginType === "admin" ? "var(--red)" : "var(--blue)"
                  }}>
                    {loginType === "admin" ? "Admin Login" : "Staff Login"}
                  </span>
                </div>
                <button onClick={() => { setLoginType(null); setEmail(""); setPassword(""); setError(""); }} style={{
                  background: "transparent", border: "none", color: "var(--text3)",
                  fontSize: 13, cursor: "pointer", padding: "4px 8px"
                }}>← Back</button>
              </div>

              <div style={{
                background: "var(--bg2)", border: "1px solid var(--border)",
                borderRadius: 16, padding: 24, boxShadow: "var(--card-shadow)"
              }}>

                {/* Email */}
                {loginType === "staff" ? (
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 11, color: "var(--text3)", letterSpacing: "0.1em", display: "block", marginBottom: 7, fontFamily: "'DM Mono',monospace" }}>
                      SELECT ACCOUNT
                    </label>
                    <select
                      value={email} onChange={e => setEmail(e.target.value)}
                      style={{
                        width: "100%", padding: "12px 14px",
                        background: "var(--input-bg)", border: "1px solid var(--border2)",
                        borderRadius: 8, color: "var(--text)", fontSize: 14,
                        outline: "none", cursor: "pointer"
                      }}>
                      <option value="">Choose your account</option>
                      {STAFF_EMAILS.map(e => (
                        <option key={e} value={e}>{e}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 11, color: "var(--text3)", letterSpacing: "0.1em", display: "block", marginBottom: 7, fontFamily: "'DM Mono',monospace" }}>
                      EMAIL
                    </label>
                    <input
                      value={email} onChange={e => setEmail(e.target.value)}
                      type="email" placeholder="admin@byteclubhotel.com"
                      style={{
                        width: "100%", padding: "12px 14px",
                        background: "var(--input-bg)", border: "1px solid var(--border2)",
                        borderRadius: 8, color: "var(--text)", fontSize: 14, outline: "none"
                      }}
                      onFocus={e => e.target.style.borderColor = "var(--red)"}
                      onBlur={e => e.target.style.borderColor = "var(--border2)"}
                    />
                  </div>
                )}

                {/* Password */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 11, color: "var(--text3)", letterSpacing: "0.1em", display: "block", marginBottom: 7, fontFamily: "'DM Mono',monospace" }}>
                    PASSWORD
                  </label>
                  <input
                    value={password} onChange={e => setPassword(e.target.value)}
                    type="password" placeholder="••••••••"
                    onKeyDown={e => e.key === "Enter" && handleLogin()}
                    style={{
                      width: "100%", padding: "12px 14px",
                      background: "var(--input-bg)", border: "1px solid var(--border2)",
                      borderRadius: 8, color: "var(--text)", fontSize: 14, outline: "none"
                    }}
                    onFocus={e => e.target.style.borderColor = "var(--red)"}
                    onBlur={e => e.target.style.borderColor = "var(--border2)"}
                  />
                </div>

                {error && (
                  <div style={{
                    background: "var(--red-dim)", border: "1px solid var(--red-border)",
                    borderRadius: 8, padding: "10px 14px",
                    marginBottom: 16, fontSize: 13, color: "var(--red)"
                  }}>{error}</div>
                )}

                <button onClick={handleLogin} disabled={loading} style={{
                  width: "100%", padding: 14,
                  background: loading ? "var(--bg3)" : loginType === "admin" ? "var(--red)" : "var(--blue)",
                  color: loading ? "var(--text3)" : "#fff",
                  border: "none", borderRadius: 8, fontSize: 15, fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  transition: "all 0.2s"
                }}>
                  {loading ? <><div className="spinner" />Signing in...</> : `Sign In as ${loginType === "admin" ? "Admin 👑" : "Staff 👤"}`}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}