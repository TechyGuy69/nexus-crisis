import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const sevColor  = { P1: "#E8473F", P2: "#F0A500", P3: "#4B8FE2" };
const typeColor = { Medical: "#E8473F", Fire: "#F0A500", Security: "#4B8FE2", Flood: "#4CAF7D", Panic: "#D4537E", Other: "#7e7d8f" };

export default function Analytics() {
  const [incidents, setIncidents] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "incidents"), orderBy("timestamp", "desc"));
    return onSnapshot(q, snap => {
      setIncidents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const total      = incidents.length;
  const active     = incidents.filter(i => i.status === "active").length;
  const resolved   = incidents.filter(i => i.status === "resolved").length;
  const resolution = total > 0 ? Math.round((resolved / total) * 100) : 0;

  const byType = Object.entries(
    incidents.reduce((acc, i) => { acc[i.type] = (acc[i.type] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value }));

  const bySeverity = ["P1", "P2", "P3"].map(s => ({
    name: s, value: incidents.filter(i => i.severity === s).length, color: sevColor[s]
  })).filter(s => s.value > 0);

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const label = d.toLocaleDateString("en-IN", { weekday: "short" });
    const count = incidents.filter(inc => {
      if (!inc.timestamp) return false;
      return inc.timestamp.toDate().toDateString() === d.toDateString();
    }).length;
    return { label, count };
  });

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload?.length) return (
      <div style={{
        background: "var(--bg2)", border: "1px solid var(--border)",
        borderRadius: 8, padding: "8px 14px", fontSize: 13, color: "var(--text)"
      }}>
        {payload[0].value} incidents
      </div>
    );
    return null;
  };

  return (
    <div style={{
      minHeight: "100vh", background: "var(--bg)",
      padding: 24, transition: "background 0.3s"
    }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{
            fontSize: 11, color: "var(--red)", letterSpacing: "0.15em",
            fontFamily: "'DM Mono',monospace", marginBottom: 8
          }}>NEXUS · ANALYTICS</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--text)" }}>
            Crisis Intelligence
          </h1>
          <p style={{ color: "var(--text2)", fontSize: 13, marginTop: 4 }}>
            Byte Club Pvt Ltd · All time data
          </p>
        </div>

        {/* Stat cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 12, marginBottom: 20
        }}>
          {[
            { label: "Total Incidents",  val: total,        color: "var(--text)"   },
            { label: "Active Now",       val: active,       color: "var(--red)"    },
            { label: "Resolved",         val: resolved,     color: "var(--green)"  },
            { label: "Resolution Rate",  val: `${resolution}%`, color: "var(--purple)" },
          ].map(s => (
            <div key={s.label} style={{
              background: "var(--bg2)", border: "1px solid var(--border)",
              borderRadius: 14, padding: "18px 16px",
              boxShadow: "var(--card-shadow)",
              transition: "background 0.3s"
            }}>
              <div style={{
                fontSize: 10, color: "var(--text3)",
                letterSpacing: "0.1em", marginBottom: 10,
                fontFamily: "'DM Mono',monospace"
              }}>{s.label.toUpperCase()}</div>
              <div style={{
                fontSize: 30, fontWeight: 800, color: s.color,
                fontFamily: "'DM Mono',monospace"
              }}>{s.val}</div>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr",
          gap: 16, marginBottom: 16
        }}>

          {/* Bar chart */}
          <div style={{
            background: "var(--bg2)", border: "1px solid var(--border)",
            borderRadius: 14, padding: 20, boxShadow: "var(--card-shadow)",
            transition: "background 0.3s"
          }}>
            <div style={{
              fontSize: 10, color: "var(--text3)",
              letterSpacing: "0.1em", marginBottom: 20,
              fontFamily: "'DM Mono',monospace"
            }}>INCIDENTS · LAST 7 DAYS</div>
            {total === 0 ? (
              <div style={{
                textAlign: "center", color: "var(--text3)",
                padding: 40, fontSize: 13
              }}>No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={last7} barSize={24}>
                  <XAxis dataKey="label" tick={{ fill: "var(--text3)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "var(--text3)", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--border)" }} />
                  <Bar dataKey="count" fill="var(--red)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Pie chart */}
          <div style={{
            background: "var(--bg2)", border: "1px solid var(--border)",
            borderRadius: 14, padding: 20, boxShadow: "var(--card-shadow)",
            transition: "background 0.3s"
          }}>
            <div style={{
              fontSize: 10, color: "var(--text3)",
              letterSpacing: "0.1em", marginBottom: 20,
              fontFamily: "'DM Mono',monospace"
            }}>BREAKDOWN BY TYPE</div>
            {byType.length === 0 ? (
              <div style={{
                textAlign: "center", color: "var(--text3)",
                padding: 40, fontSize: 13
              }}>No data yet</div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <PieChart width={140} height={140}>
                  <Pie data={byType} cx={65} cy={65} innerRadius={40} outerRadius={65} dataKey="value" strokeWidth={0}>
                    {byType.map(entry => (
                      <Cell key={entry.name} fill={typeColor[entry.name] || "#888"} />
                    ))}
                  </Pie>
                </PieChart>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {byType.map(entry => (
                    <div key={entry.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{
                        width: 8, height: 8, borderRadius: "50%",
                        background: typeColor[entry.name] || "#888", flexShrink: 0
                      }} />
                      <span style={{ fontSize: 12, color: "var(--text2)" }}>{entry.name}</span>
                      <span style={{
                        fontSize: 12, color: "var(--text3)", marginLeft: "auto",
                        fontFamily: "'DM Mono',monospace"
                      }}>{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Severity breakdown */}
        <div style={{
          background: "var(--bg2)", border: "1px solid var(--border)",
          borderRadius: 14, padding: 20, boxShadow: "var(--card-shadow)",
          transition: "background 0.3s"
        }}>
          <div style={{
            fontSize: 10, color: "var(--text3)",
            letterSpacing: "0.1em", marginBottom: 18,
            fontFamily: "'DM Mono',monospace"
          }}>SEVERITY BREAKDOWN</div>
          {bySeverity.length === 0 ? (
            <div style={{
              textAlign: "center", color: "var(--text3)",
              padding: 20, fontSize: 13
            }}>No data yet</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {bySeverity.map(s => (
                <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <span style={{
                    width: 36, fontSize: 12, fontFamily: "'DM Mono',monospace",
                    color: s.color, fontWeight: 700
                  }}>{s.name}</span>
                  <div style={{
                    flex: 1, height: 8, background: "var(--bg3)",
                    borderRadius: 4, overflow: "hidden"
                  }}>
                    <div style={{
                      height: "100%", borderRadius: 4, background: s.color,
                      width: `${Math.round((s.value / total) * 100)}%`,
                      transition: "width 0.5s"
                    }} />
                  </div>
                  <span style={{
                    fontSize: 13, color: "var(--text2)",
                    fontFamily: "'DM Mono',monospace", width: 24, textAlign: "right"
                  }}>{s.value}</span>
                  <span style={{ fontSize: 12, color: "var(--text3)", width: 36 }}>
                    {Math.round((s.value / total) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}