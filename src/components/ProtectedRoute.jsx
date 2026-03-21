import { useEffect, useState } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const [checking, setChecking] = useState(true);
  const [user, setUser]         = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    return onAuthStateChanged(auth, u => {
      setUser(u);
      setChecking(false);
      if (!u) navigate("/login");
    });
  }, []);

  if (checking) return (
    <div style={{
      minHeight: "100vh", background: "#0a0a0f",
      display: "flex", alignItems: "center", justifyContent: "center"
    }}>
      <div style={{ color: "#444", fontFamily: "'Space Mono',monospace", fontSize: 13 }}>
        Verifying access...
      </div>
    </div>
  );

  return user ? children : null;
}