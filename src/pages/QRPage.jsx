import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import ThemeToggle from "../components/ThemeToggle";

const SIZES = [
  { id: "business", label: "Business Card", desc: "Wallet size · 3 per row", perRow: 3, qrSize: 70, pad: "8px" },
  { id: "small", label: "Small Card", desc: "A6 size · 2 per row", perRow: 2, qrSize: 100, pad: "12px" },
  { id: "half", label: "Half Page", desc: "A5 size · 2 per row", perRow: 2, qrSize: 140, pad: "16px" },
  { id: "full", label: "Full Page", desc: "A4 poster · 1 per page", perRow: 1, qrSize: 210, pad: "24px" },
];

export default function QRPage() {
  const reportUrl = `${window.location.origin}/report`;
  const [count, setCount] = useState(4);
  const [sizeId, setSizeId] = useState("small");
  const size = SIZES.find(s => s.id === sizeId);
  const isFullPage = sizeId === "full";
  const isBusiness = sizeId === "business";
  const cards = Array.from({ length: count }, (_, i) => i + 1);

  return (
    <div style={{
      minHeight: "100vh", background: "var(--bg)",
      display: "flex", flexDirection: "column",
      transition: "background 0.3s"
    }}>

      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 10mm; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-sizing: border-box !important; }
          html, body { width: 210mm; margin: 0 !important; padding: 0 !important; background: white !important; }
          .no-print  { display: none !important; }
          .print-only { display: block !important; }
          .print-grid {
            display: grid !important;
            width: 190mm !important;
            gap: 5mm !important;
            margin: 0 auto !important;
            grid-template-columns: repeat(${size.perRow}, 1fr) !important;
          }
          .print-card {
            border: 1.5px solid #E8473F !important;
            border-radius: 8px !important;
            padding: ${size.pad} !important;
            background: white !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            text-align: center !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            overflow: hidden !important;
          }
          .p-tag   { color: #E8473F !important; font-family: monospace; letter-spacing: 0.1em; }
          .p-title { color: #111 !important; font-weight: 700; }
          .p-sub   { color: #666 !important; }
          .p-qr    { background: white !important; border: 1px solid #ddd !important; border-radius: 6px; padding: 8px; }
          .p-row   { background: #f5f5f5 !important; border-radius: 4px; }
          .p-icon  { color: #E8473F !important; }
          .p-itext { color: #333 !important; }
          .p-ftxt  { color: #888 !important; }
          .p-fnum  { color: #E8473F !important; font-weight: 700; }
          .p-divider { border-color: #eee !important; }
          .full-card {
            width: 190mm !important;
            min-height: 267mm !important;
            border: none !important;
            border-radius: 0 !important;
            padding: 16mm !important;
            justify-content: space-between !important;
          }
          .full-bar { width: 100% !important; background: #E8473F !important; color: white !important; border-radius: 8px !important; padding: 14px !important; }
          .full-badge { border: 1.5px solid #E8473F !important; background: #fff3f3 !important; color: #E8473F !important; border-radius: 20px !important; padding: 6px 14px !important; }
          .full-qr-border { border: 3px solid #E8473F !important; border-radius: 12px !important; padding: 14px !important; background: white !important; }
        }
        @media screen { .print-only { display: none; } }
      `}</style>

      {/* Top bar */}
      <div className="no-print" style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center", padding: "14px 24px",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg2)"
      }}>
        <div>
          <span style={{
            fontFamily: "'DM Mono',monospace",
            fontWeight: 700, color: "var(--red)", fontSize: 15
          }}>NEXUS</span>
          <span style={{
            fontSize: 13, color: "var(--text2)", marginLeft: 10
          }}>Room QR Cards</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12, color: "var(--text3)" }}>
            Place in every room, lobby and elevator
          </span>
          <ThemeToggle />
        </div>
      </div>

      {/* Screen UI */}
      <div className="no-print" style={{
        flex: 1, display: "flex",
        flexDirection: "column", alignItems: "center",
        padding: "28px 24px"
      }}>
        <div style={{ width: "100%", maxWidth: 520 }}>

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <h2 style={{
              fontSize: 22, fontWeight: 800,
              color: "var(--text)", marginBottom: 6
            }}>Room QR Cards</h2>
            <p style={{ color: "var(--text2)", fontSize: 13 }}>
              Place in every room, lobby and elevator
            </p>
          </div>

          {/* QR Preview */}
          <div style={{
            background: "var(--bg2)", border: "1px solid var(--border)",
            borderRadius: 16, padding: 24, marginBottom: 20,
            display: "flex", flexDirection: "column",
            alignItems: "center", gap: 12,
            boxShadow: "var(--card-shadow)"
          }}>
            <div style={{
              background: "white", borderRadius: 10, padding: 14,
              boxShadow: "0 2px 12px #00000015"
            }}>
              <QRCodeSVG value={reportUrl} size={160} fgColor="#0a0a0f" bgColor="white" level="H" />
            </div>
            <div style={{ fontSize: 12, color: "var(--text2)" }}>
              Scan to open guest emergency page
            </div>
            <div style={{
              fontSize: 11, color: "var(--text3)",
              background: "var(--bg3)", borderRadius: 6,
              padding: "6px 14px", fontFamily: "'DM Mono',monospace",
              wordBreak: "break-all", textAlign: "center"
            }}>{reportUrl}</div>
          </div>

          {/* Size selector */}
          <div style={{
            background: "var(--bg2)", border: "1px solid var(--border)",
            borderRadius: 14, padding: 20, marginBottom: 16,
            boxShadow: "var(--card-shadow)"
          }}>
            <div style={{
              fontSize: 11, color: "var(--text3)",
              letterSpacing: "0.1em", marginBottom: 14,
              fontFamily: "'DM Mono',monospace"
            }}>CARD SIZE</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {SIZES.map(s => (
                <button key={s.id} onClick={() => {
                  setSizeId(s.id);
                  if (s.id === "full") setCount(1);
                }} style={{
                  padding: "12px 14px", borderRadius: 10,
                  cursor: "pointer", textAlign: "left",
                  border: `1.5px solid ${sizeId === s.id ? "var(--red)" : "var(--border2)"}`,
                  background: sizeId === s.id ? "var(--red-dim)" : "var(--bg3)",
                  transition: "all 0.15s", fontFamily: "'Syne',sans-serif"
                }}>
                  <div style={{
                    fontSize: 13, fontWeight: 600,
                    color: sizeId === s.id ? "var(--red)" : "var(--text)",
                    marginBottom: 3
                  }}>{s.label}</div>
                  <div style={{ fontSize: 11, color: "var(--text3)" }}>{s.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Count selector */}
          {!isFullPage && (
            <div style={{
              background: "var(--bg2)", border: "1px solid var(--border)",
              borderRadius: 14, padding: 20, marginBottom: 16,
              boxShadow: "var(--card-shadow)"
            }}>
              <div style={{
                fontSize: 11, color: "var(--text3)",
                letterSpacing: "0.1em", marginBottom: 14,
                fontFamily: "'DM Mono',monospace"
              }}>HOW MANY CARDS?</div>
              <div style={{
                display: "flex", gap: 8,
                justifyContent: "center", marginBottom: 14, flexWrap: "wrap"
              }}>
                {[1, 2, 4, 6, 8, 10, 12].map(n => (
                  <button key={n} onClick={() => setCount(n)} style={{
                    width: 40, height: 40, borderRadius: 8, cursor: "pointer",
                    border: `1.5px solid ${count === n ? "var(--red)" : "var(--border2)"}`,
                    background: count === n ? "var(--red-dim)" : "var(--bg3)",
                    color: count === n ? "var(--red)" : "var(--text2)",
                    fontSize: 14, fontWeight: count === n ? 700 : 400,
                    fontFamily: "'DM Mono',monospace", transition: "all 0.15s"
                  }}>{n}</button>
                ))}
              </div>
              <div style={{
                display: "flex", alignItems: "center",
                gap: 10, justifyContent: "center"
              }}>
                <span style={{ fontSize: 12, color: "var(--text3)" }}>Custom:</span>
                <input
                  type="number" min={1} max={50} value={count}
                  onChange={e => {
                    const v = parseInt(e.target.value);
                    if (!isNaN(v) && v >= 1 && v <= 50) setCount(v);
                  }}
                  style={{
                    width: 70, padding: "8px 12px",
                    background: "var(--bg3)",
                    border: "1px solid var(--border2)",
                    borderRadius: 8, color: "var(--text)",
                    fontSize: 15, textAlign: "center",
                    fontFamily: "'DM Mono',monospace", outline: "none"
                  }}
                />
                <span style={{ fontSize: 12, color: "var(--text3)" }}>cards</span>
              </div>
            </div>
          )}

          {/* Summary pill */}
          <div style={{
            display: "flex", alignItems: "center",
            justifyContent: "center", gap: 8,
            background: "var(--bg3)", border: "1px solid var(--border)",
            borderRadius: 20, padding: "8px 20px",
            marginBottom: 20, fontSize: 12, color: "var(--text2)"
          }}>
            <span style={{ color: "var(--red)" }}>◈</span>
            <span>
              {isFullPage
                ? "1 full A4 poster · 1 page"
                : `${count} × ${size.label}`}
            </span>
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={() => window.print()} style={{
              flex: 1, padding: "14px 0", background: "var(--red)",
              color: "#fff", border: "none", borderRadius: 12,
              fontSize: 15, fontWeight: 700, cursor: "pointer"
            }}>
              Print {isFullPage ? "Poster" : `${count} Card${count > 1 ? "s" : ""}`}
            </button>
            <button onClick={() => navigator.clipboard.writeText(reportUrl).then(() => alert("Copied!"))} style={{
              padding: "14px 20px", background: "var(--bg3)",
              color: "var(--text2)", border: "1px solid var(--border2)",
              borderRadius: 12, fontSize: 14, cursor: "pointer"
            }}>Copy Link</button>
          </div>
        </div>
      </div>

      {/* PRINT AREA */}
      <div className="print-only">
        {isFullPage && (
          <div className="print-card full-card" style={{
            display: "flex", flexDirection: "column",
            alignItems: "center", textAlign: "center"
          }}>
            <div className="full-bar">
              <div style={{ fontSize: 11, letterSpacing: "0.18em", opacity: 0.85 }}>BYTE CLUB PVT LTD</div>
              <div style={{ fontSize: 10, letterSpacing: "0.1em", opacity: 0.7, marginTop: 3 }}>NEXUS EMERGENCY RESPONSE SYSTEM</div>
            </div>
            <div style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 20, padding: "20px 0"
            }}>
              <div>
                <h1 className="p-title" style={{ fontSize: 38, lineHeight: 1.2, margin: 0 }}>
                  Need Help?<br /><span style={{ color: "#E8473F" }}>We're here.</span>
                </h1>
                <p className="p-sub" style={{ fontSize: 16, marginTop: 12, lineHeight: 1.6, maxWidth: 320 }}>
                  Scan to instantly alert our staff.<br />Works from any phone. No app needed.
                </p>
              </div>
              <div className="full-qr-border">
                <QRCodeSVG value={reportUrl} size={size.qrSize} fgColor="#0a0a0f" bgColor="white" level="H" />
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
                {[{ icon: "♥", text: "Medical" }, { icon: "▲", text: "Fire" }, { icon: "◉", text: "Security" }, { icon: "!", text: "Distress" }].map(item => (
                  <div key={item.text} className="full-badge" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 13 }}>{item.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-divider" style={{
              borderTop: "1px solid #eee", paddingTop: 14,
              width: "100%", display: "flex", justifyContent: "center", gap: 48
            }}>
              <span className="p-ftxt" style={{ fontSize: 14 }}>Reception: <span className="p-fnum">0</span></span>
              <span className="p-ftxt" style={{ fontSize: 14 }}>Emergency: <span className="p-fnum">112</span></span>
            </div>
          </div>
        )}

        {!isFullPage && (
          <div className="print-grid">
            {cards.map(n => (
              <div key={n} className="print-card">
                <div className="p-tag" style={{ fontSize: isBusiness ? 7 : 9, marginBottom: isBusiness ? 3 : 5 }}>
                  BYTE CLUB PVT LTD
                </div>
                <div className="p-title" style={{ fontSize: isBusiness ? 11 : 13, marginBottom: isBusiness ? 2 : 4 }}>
                  Emergency? We're here.
                </div>
                {!isBusiness && (
                  <div className="p-sub" style={{ fontSize: 9, marginBottom: 8, lineHeight: 1.4 }}>
                    Scan to alert staff instantly.<br />No app needed.
                  </div>
                )}
                <div className="p-qr" style={{ marginBottom: isBusiness ? 4 : 8 }}>
                  <QRCodeSVG value={reportUrl} size={size.qrSize} fgColor="#0a0a0f" bgColor="white" level="H" />
                </div>
                {!isBusiness && (
                  <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 3, marginBottom: 8 }}>
                    {[
                      { icon: "♥", text: "Medical Emergency" },
                      { icon: "▲", text: "Fire or Smoke" },
                      { icon: "◉", text: "Security Threat" },
                      { icon: "!", text: "Any Distress" },
                    ].map(item => (
                      <div key={item.text} className="p-row" style={{
                        display: "flex", alignItems: "center", gap: 6, padding: "3px 7px"
                      }}>
                        <span className="p-icon" style={{ fontSize: 9, width: 12, flexShrink: 0 }}>{item.icon}</span>
                        <span className="p-itext" style={{ fontSize: 8 }}>{item.text}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="p-divider" style={{
                  borderTop: "1px solid #eee", paddingTop: isBusiness ? 4 : 7,
                  width: "100%", display: "flex", justifyContent: "center", gap: 12
                }}>
                  <span className="p-ftxt" style={{ fontSize: 8 }}>Reception: <span className="p-fnum">0</span></span>
                  <span className="p-ftxt" style={{ fontSize: 8 }}>Emergency: <span className="p-fnum">112</span></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}