import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth, ADMIN_EMAIL } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useTheme } from "./context/ThemeContext";
import { useLanguage } from "./context/LanguageContext";
import ThemeToggle from "./components/ThemeToggle";
import LanguageSelector from "./components/LanguageSelector";
import GuestReport from "./pages/GuestReport";
import Dashboard from "./pages/Dashboard";
import Landing from "./pages/Landing";
import QRPage from "./pages/QRPage";
import Responder from "./pages/Responder";
import Analytics from "./pages/Analytics";
import History from "./pages/History";
import Feedback from "./pages/Feedback";
import Login from "./pages/Login";
import AdminPanel from "./pages/AdminPanel";
import ProtectedRoute from "./components/ProtectedRoute";

function Nav() {
  const navigate = useNavigate();
  const loc = useLocation();
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => onAuthStateChanged(auth, setUser), []);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const hide = ["/", "/report", "/responder", "/login", "/feedback"].includes(loc.pathname);
  if (hide) return null;

  const isAdmin = user?.email === ADMIN_EMAIL;

  const links = isAdmin ? [
    { path: "/admin", label: "👑 Admin" },
    { path: "/dashboard", label: t.dashboard },
    { path: "/analytics", label: t.analytics },
    { path: "/history", label: t.history },
    { path: "/qr", label: t.qrCodes },
  ] : [
    { path: "/dashboard", label: t.dashboard },
    { path: "/analytics", label: t.analytics },
    { path: "/history", label: t.history },
    { path: "/qr", label: t.qrCodes },
  ];

  return (
    <div className="no-print" style={{
      borderBottom: "1px solid var(--border)",
      background: "var(--bg2)",
      position: "sticky", top: 0, zIndex: 100,
      transition: "background 0.3s"
    }}>
      <div style={{
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        padding: isMobile ? "12px 16px" : "10px 24px",
      }}>
        <span onClick={() => navigate("/")} style={{
          fontFamily: "'DM Mono',monospace", fontWeight: 700,
          color: "var(--red)", fontSize: 16, cursor: "pointer",
          letterSpacing: "0.06em"
        }}>NEXUS</span>

        {!isMobile && (
          <div style={{ display: "flex", gap: 4 }}>
            {links.map(item => (
              <button key={item.path} onClick={() => navigate(item.path)} style={{
                padding: "6px 14px", border: "none", cursor: "pointer",
                fontSize: 13, borderRadius: 8, fontFamily: "'Syne',sans-serif",
                color: loc.pathname === item.path ? "var(--text)" : "var(--text2)",
                background: loc.pathname === item.path ? "var(--bg3)" : "transparent",
                transition: "all 0.15s"
              }}>{item.label}</button>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <LanguageSelector />
          <ThemeToggle />
          {!isMobile && (
            <>
              <button onClick={() => navigate("/responder")} style={{
                padding: "6px 14px", background: "var(--bg3)",
                border: "1px solid var(--border2)", borderRadius: 8,
                color: "var(--text2)", fontSize: 12, cursor: "pointer"
              }}>{t.staffView}</button>
              <button onClick={() => navigate("/report")} style={{
                padding: "6px 14px", background: "var(--red)",
                border: "none", borderRadius: 8,
                color: "#fff", fontSize: 12, cursor: "pointer", fontWeight: 600
              }}>{t.report}</button>
              {user && (
                <button onClick={() => signOut(auth).then(() => navigate("/login"))} style={{
                  padding: "6px 12px", background: "transparent",
                  border: "1px solid var(--border)", borderRadius: 8,
                  color: "var(--text3)", fontSize: 12, cursor: "pointer"
                }}>{t.signOut}</button>
              )}
            </>
          )}
          {isMobile && (
            <button onClick={() => setMenuOpen(!menuOpen)} style={{
              background: "var(--bg3)", border: "1px solid var(--border2)",
              borderRadius: 8, padding: "8px 10px", cursor: "pointer",
              color: "var(--text)", fontSize: 15, lineHeight: 1
            }}>{menuOpen ? "✕" : "☰"}</button>
          )}
        </div>
      </div>

      {isMobile && menuOpen && (
        <div style={{
          borderTop: "1px solid var(--border)",
          padding: "12px 16px",
          display: "flex", flexDirection: "column", gap: 6,
          background: "var(--bg2)",
          animation: "fadeIn 0.2s ease"
        }}>
          {links.map(item => (
            <button key={item.path} onClick={() => { navigate(item.path); setMenuOpen(false); }} style={{
              padding: "12px 16px",
              background: loc.pathname === item.path ? "var(--bg3)" : "transparent",
              border: "none", borderRadius: 10, cursor: "pointer",
              color: loc.pathname === item.path ? "var(--text)" : "var(--text2)",
              fontSize: 14, textAlign: "left", fontFamily: "'Syne',sans-serif",
              transition: "all 0.15s"
            }}>{item.label}</button>
          ))}
          <div style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />
          <button onClick={() => { navigate("/report"); setMenuOpen(false); }} style={{
            padding: "12px 16px", background: "var(--red)", border: "none",
            borderRadius: 10, color: "#fff", fontSize: 14,
            fontWeight: 700, cursor: "pointer"
          }}>{t.report}</button>
          <button onClick={() => { navigate("/responder"); setMenuOpen(false); }} style={{
            padding: "12px 16px", background: "var(--bg3)",
            border: "1px solid var(--border2)", borderRadius: 10,
            color: "var(--text2)", fontSize: 14, cursor: "pointer"
          }}>{t.staffView}</button>
          {user && (
            <button onClick={() => signOut(auth).then(() => navigate("/login"))} style={{
              padding: "12px 16px", background: "transparent",
              border: "1px solid var(--border)", borderRadius: 10,
              color: "var(--text3)", fontSize: 13, cursor: "pointer"
            }}>{t.signOut}</button>
          )}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Nav />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/report" element={<GuestReport />} />
        <Route path="/responder" element={<Responder />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
        <Route path="/qr" element={<ProtectedRoute><QRPage /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}