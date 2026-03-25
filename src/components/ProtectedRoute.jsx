import { useEffect, useState } from "react";
import { auth, ADMIN_EMAIL } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";

export default function ProtectedRoute({ children, adminOnly = false }) {
  const [checking, setChecking] = useState(true);
  const [user, setUser]         = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    return onAuthStateChanged(auth, u => {
      setUser(u);
      setChecking(false);
      if (!u) {
        navigate("/login");
      } else if (adminOnly && u.email !== ADMIN_EMAIL) {
        navigate("/dashboard");
      } else if (!adminOnly && u.email === ADMIN_EMAIL) {
        navigate("/admin");
      }
    });
  }, []);

  if (checking) return (
    <div style={{
      minHeight: "100vh", background: "var(--bg)",
      display: "flex", alignItems: "center", justifyContent: "center"
    }}>
      <div style={{
        color: "var(--text3)", fontFamily: "'DM Mono',monospace", fontSize: 13
      }}>Verifying access...</div>
    </div>
  );

  return user ? children : null;
}