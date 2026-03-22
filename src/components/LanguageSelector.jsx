import { useState } from "react";
import { useLanguage } from "../context/LanguageContext";

const LANGUAGES = [
  { code: "en", label: "EN",   name: "English" },
  { code: "hi", label: "हि",   name: "हिंदी"   },
  { code: "bn", label: "বাং",  name: "বাংলা"   },
  { code: "ta", label: "தமி",  name: "தமிழ்"  },
  { code: "te", label: "తెలు", name: "తెలుగు" },
];

export default function LanguageSelector({ style = {} }) {
  const { language, changeLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const current = LANGUAGES.find(l => l.code === language);

  return (
    <div style={{ position: "relative", ...style }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          height: 38, padding: "0 12px",
          borderRadius: 10,
          border: "1px solid var(--border2)",
          background: "var(--bg3)",
          cursor: "pointer",
          display: "flex", alignItems: "center", gap: 6,
          fontSize: 13, color: "var(--text2)",
          transition: "all 0.2s", flexShrink: 0
        }}
        onMouseEnter={e => e.currentTarget.style.background = "var(--bg4)"}
        onMouseLeave={e => e.currentTarget.style.background = "var(--bg3)"}
      >
        <span style={{ fontSize: 14 }}>🌐</span>
        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11 }}>
          {current?.label}
        </span>
        <span style={{ fontSize: 10, opacity: 0.5 }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <>
          {/* backdrop to close on outside click */}
          <div
            onClick={() => setOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 999 }}
          />
          <div style={{
            position: "absolute", top: "calc(100% + 6px)", right: 0,
            background: "var(--bg2)", border: "1px solid var(--border2)",
            borderRadius: 12, overflow: "hidden",
            boxShadow: "var(--card-shadow)", zIndex: 1000,
            minWidth: 140, animation: "fadeIn 0.15s ease"
          }}>
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => { changeLanguage(lang.code); setOpen(false); }}
                style={{
                  width: "100%", padding: "10px 16px",
                  background: language === lang.code ? "var(--red-dim)" : "transparent",
                  border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 10,
                  transition: "background 0.1s", fontFamily: "'Syne',sans-serif"
                }}
                onMouseEnter={e => {
                  if (language !== lang.code)
                    e.currentTarget.style.background = "var(--bg3)";
                }}
                onMouseLeave={e => {
                  if (language !== lang.code)
                    e.currentTarget.style.background = "transparent";
                }}
              >
                <span style={{
                  fontSize: 14, width: 28, textAlign: "center",
                  fontFamily: "'DM Mono',monospace",
                  color: language === lang.code ? "var(--red)" : "var(--text2)"
                }}>{lang.label}</span>
                <span style={{
                  fontSize: 13,
                  color: language === lang.code ? "var(--red)" : "var(--text)",
                  fontWeight: language === lang.code ? 600 : 400
                }}>{lang.name}</span>
                {language === lang.code && (
                  <span style={{ marginLeft: "auto", color: "var(--red)", fontSize: 12 }}>✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}