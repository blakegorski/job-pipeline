import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { generateFollowUp, generateInterviewPrep } from "./claude";

const COLORS = {
  Applied:        { bar: "#4a9eff", badge: "rgba(74,158,255,0.15)", text: "#4a9eff" },
  "Phone Screen": { bar: "#a78bfa", badge: "rgba(167,139,250,0.15)", text: "#a78bfa" },
  Interview:      { bar: "#f59e0b", badge: "rgba(245,158,11,0.15)", text: "#f59e0b" },
  Offer:          { bar: "#c9f564", badge: "rgba(201,245,100,0.15)", text: "#c9f564" },
  Rejected:       { bar: "#ff5f57", badge: "rgba(255,95,87,0.15)", text: "#ff5f57" },
};

const STAGES = ["All", "Applied", "Phone Screen", "Interview", "Offer", "Rejected"];
const PIPELINE_STAGES = ["Applied", "Phone Screen", "Interview", "Offer"];

export default function App() {
  const [apps, setApps] = useState([]);
  const [filter, setFilter] = useState("All");
  const [view, setView] = useState("tracker");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ company: "", role: "", status: "Applied", date_applied: new Date().toISOString().split("T")[0] });
  const [aiModal, setAiModal] = useState(null);
  const [aiOutput, setAiOutput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => { fetchApps(); }, []);

  async function fetchApps() {
    setLoading(true);
    const { data } = await supabase.from("applications").select("*").order("created_at", { ascending: false });
    setApps(data || []);
    setLoading(false);
  }

  async function addApp() {
    if (!form.company || !form.role || !form.date_applied) return;
    await supabase.from("applications").insert([form]);
    setShowModal(false);
    setForm({ company: "", role: "", status: "Applied", date_applied: new Date().toISOString().split("T")[0] });
    fetchApps();
  }

  async function updateStatus(id, status) {
    await supabase.from("applications").update({ status }).eq("id", id);
    fetchApps();
  }

  async function deleteApp(id) {
    await supabase.from("applications").delete().eq("id", id);
    fetchApps();
  }

  async function runAI(type, app) {
    setAiModal({ type, app });
    setAiOutput("");
    setAiLoading(true);
    const result = type === "followup"
      ? await generateFollowUp(app.company, app.role)
      : await generateInterviewPrep(app.company, app.role);
    setAiOutput(result);
    setAiLoading(false);
  }

  function daysSince(dateStr) {
    return Math.floor((new Date() - new Date(dateStr)) / 86400000);
  }

  const visible = filter === "All" ? apps : apps.filter(a => a.status === filter);
  const counts = {};
  STAGES.slice(1).forEach(s => counts[s] = apps.filter(a => a.status === s).length);
  const responded = (counts["Phone Screen"] || 0) + (counts["Interview"] || 0) + (counts["Offer"] || 0) + (counts["Rejected"] || 0);
  const rate = apps.length ? Math.round((responded / apps.length) * 100) : 0;

  const byDate = {};
  apps.forEach(a => {
    const d = a.date_applied?.slice(0, 7);
    if (d) byDate[d] = (byDate[d] || 0) + 1;
  });
  const dateLabels = Object.keys(byDate).sort();
  const dateCounts = dateLabels.map(d => byDate[d]);
  const maxDateCount = Math.max(...dateCounts, 1);
  const funnelMax = Math.max(...PIPELINE_STAGES.map(st => counts[st] || 0), 1);

  const s = { bg: "#0e0e0f", surface: "#17171a", surface2: "#1e1e22", border: "rgba(255,255,255,0.07)", border2: "rgba(255,255,255,0.12)", text: "#f0ede8", muted: "#7a7875", accent: "#c9f564" };

  const navBtn = (label, target) => (
    <button onClick={() => setView(target)} style={{ background: view === target ? "rgba(201,245,100,0.12)" : "transparent", border: view === target ? `0.5px solid ${s.accent}` : `0.5px solid ${s.border2}`, borderRadius: 4, padding: "6px 16px", fontFamily: "DM Mono, monospace", fontSize: 11, color: view === target ? s.accent : s.muted, cursor: "pointer", letterSpacing: "0.04em" }}>
      {label}
    </button>
  );

  return (
    <div style={{ background: s.bg, minHeight: "100vh", color: s.text, fontFamily: "'DM Mono', monospace", padding: "2rem 1.5rem" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Fraunces:ital,opsz,wght@0,9..144,300;1,9..144,300&display=swap" rel="stylesheet" />
      <div style={{ maxWidth: 960, margin: "0 auto" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: `0.5px solid ${s.border2}`, paddingBottom: "1.25rem", marginBottom: "2rem" }}>
          <div>
            <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 28, fontWeight: 300, fontStyle: "italic", letterSpacing: "-0.02em" }}>Pipeline</h1>
            <p style={{ fontSize: 11, color: s.muted, marginTop: 2, letterSpacing: "0.08em", textTransform: "uppercase" }}>Job Search Tracker</p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {navBtn("Tracker", "tracker")}
            {navBtn("Analytics", "analytics")}
            {view === "tracker" && (
              <button onClick={() => setShowModal(true)} style={{ background: s.accent, color: s.bg, border: "none", padding: "8px 18px", borderRadius: 4, fontFamily: "DM Mono, monospace", fontSize: 12, fontWeight: 500, cursor: "pointer", letterSpacing: "0.04em" }}>
                + Add
              </button>
            )}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: "1.5rem" }}>
          {STAGES.slice(1).map(s2 => (
            <div key={s2} style={{ background: s.surface, border: `0.5px solid ${s.border}`, borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 22, fontWeight: 500, fontFamily: "Fraunces, serif", color: COLORS[s2].text }}>{counts[s2] || 0}</div>
              <div style={{ fontSize: 10, color: s.muted, marginTop: 2, letterSpacing: "0.06em", textTransform: "uppercase" }}>{s2}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "2rem", fontSize: 12, color: s.muted }}>
          <span>Response rate</span>
          <div style={{ flex: 1, height: 3, background: s.surface2, borderRadius: 2 }}>
            <div style={{ height: 3, background: s.accent, borderRadius: 2, width: rate + "%" }} />
          </div>
          <span style={{ color: s.text }}>{rate}%</span>
        </div>

        {view === "tracker" && (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: "1.5rem", flexWrap: "wrap" }}>
              {STAGES.map(st => (
                <button key={st} onClick={() => setFilter(st)} style={{ background: filter === st ? "rgba(201,245,100,0.12)" : s.surface, border: filter === st ? `0.5px solid ${s.accent}` : `0.5px solid ${s.border}`, borderRadius: 4, padding: "5px 14px", fontFamily: "DM Mono, monospace", fontSize: 11, color: filter === st ? s.accent : s.muted, cursor: "pointer", letterSpacing: "0.04em" }}>
                  {st} ({st === "All" ? apps.length : counts[st] || 0})
                </button>
              ))}
            </div>

            {loading ? (
              <div style={{ textAlign: "center", padding: "3rem", color: s.muted, fontSize: 13 }}>Loading...</div>
            ) : visible.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem", color: s.muted, fontSize: 13 }}>No applications in this stage.</div>
            ) : visible.map(a => {
              const days = daysSince(a.date_applied);
              const needsFollowup = days >= 7 && a.status === "Applied";
              const c = COLORS[a.status];
              return (
                <div key={a.id} style={{ background: s.surface, border: `0.5px solid ${s.border}`, borderRadius: 8, padding: "14px 16px", display: "grid", gridTemplateColumns: "3px 1fr auto auto auto", alignItems: "center", gap: 14, marginBottom: 8 }}>
                  <div style={{ width: 3, height: 36, borderRadius: 2, background: c.bar }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.company}</div>
                    <div style={{ fontSize: 12, color: s.muted, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.role}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: s.muted }}>{days}d ago</div>
                    {needsFollowup && <div style={{ fontSize: 10, color: "#ff5f57" }}>follow up</div>}
                  </div>
                  <select onChange={e => updateStatus(a.id, e.target.value)} value={a.status} style={{ background: c.badge, border: "none", borderRadius: 3, padding: "3px 8px", fontFamily: "DM Mono, monospace", fontSize: 10, fontWeight: 500, color: c.text, cursor: "pointer", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    {STAGES.slice(1).map(st => <option key={st} value={st}>{st}</option>)}
                  </select>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => runAI("followup", a)} style={{ background: "transparent", border: `0.5px solid ${s.border2}`, borderRadius: 3, padding: "3px 8px", fontFamily: "DM Mono, monospace", fontSize: 10, color: s.muted, cursor: "pointer" }}>follow up</button>
                    {a.status === "Interview" && (
                      <button onClick={() => runAI("prep", a)} style={{ background: "transparent", border: "0.5px solid #f59e0b", borderRadius: 3, padding: "3px 8px", fontFamily: "DM Mono, monospace", fontSize: 10, color: "#f59e0b", cursor: "pointer" }}>prep</button>
                    )}
                    <button onClick={() => deleteApp(a.id)} style={{ background: "transparent", border: "none", color: s.muted, cursor: "pointer", fontSize: 16, padding: "0 4px" }}>×</button>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {view === "analytics" && (
          <div>
            <div style={{ background: s.surface, border: `0.5px solid ${s.border}`, borderRadius: 8, padding: "1.25rem", marginBottom: 16 }}>
              <p style={{ fontSize: 11, color: s.muted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "1.25rem" }}>Applications by month</p>
              {dateLabels.length === 0 ? (
                <p style={{ color: s.muted, fontSize: 13 }}>No data yet.</p>
              ) : (
                <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 120 }}>
                  {dateLabels.map((d, i) => (
                    <div key={d} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 11, color: s.text }}>{dateCounts[i]}</span>
                      <div style={{ width: "100%", background: s.accent, borderRadius: "3px 3px 0 0", height: Math.round((dateCounts[i] / maxDateCount) * 80) + "px", opacity: 0.85 }} />
                      <span style={{ fontSize: 10, color: s.muted }}>{d.slice(5)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ background: s.surface, border: `0.5px solid ${s.border}`, borderRadius: 8, padding: "1.25rem", marginBottom: 16 }}>
              <p style={{ fontSize: 11, color: s.muted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "1.25rem" }}>Pipeline funnel</p>
              {PIPELINE_STAGES.map(st => {
                const count = counts[st] || 0;
                const pct = Math.round((count / funnelMax) * 100);
                const c = COLORS[st];
                return (
                  <div key={st} style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                      <span style={{ color: c.text }}>{st}</span>
                      <span style={{ color: s.muted }}>{count} — {pct}%</span>
                    </div>
                    <div style={{ height: 6, background: s.surface2, borderRadius: 3 }}>
                      <div style={{ height: 6, background: c.bar, borderRadius: 3, width: pct + "%" }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ background: s.surface, border: `0.5px solid ${s.border}`, borderRadius: 8, padding: "1.25rem" }}>
                <p style={{ fontSize: 11, color: s.muted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>Total applications</p>
                <p style={{ fontSize: 32, fontFamily: "Fraunces, serif", fontWeight: 300, color: s.accent }}>{apps.length}</p>
              </div>
              <div style={{ background: s.surface, border: `0.5px solid ${s.border}`, borderRadius: 8, padding: "1.25rem" }}>
                <p style={{ fontSize: 11, color: s.muted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>Response rate</p>
                <p style={{ fontSize: 32, fontFamily: "Fraunces, serif", fontWeight: 300, color: s.accent }}>{rate}%</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {aiModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: s.surface2, border: `0.5px solid ${s.border2}`, borderRadius: 12, padding: "1.5rem", width: 520, maxWidth: "95vw" }}>
            <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 20, fontWeight: 300, fontStyle: "italic", marginBottom: 4 }}>
              {aiModal.type === "followup" ? "Follow-up email" : "Interview prep"}
            </h2>
            <p style={{ fontSize: 12, color: s.muted, marginBottom: "1.25rem" }}>{aiModal.app.company} — {aiModal.app.role}</p>
            {aiLoading ? (
              <div style={{ textAlign: "center", padding: "2rem", color: s.muted, fontSize: 13 }}>Generating...</div>
            ) : (
              <div style={{ background: s.bg, border: `0.5px solid ${s.border}`, borderRadius: 8, padding: "1rem", fontSize: 13, lineHeight: 1.7, color: s.text, whiteSpace: "pre-wrap", maxHeight: 300, overflowY: "auto" }}>
                {aiOutput}
              </div>
            )}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: "1.25rem" }}>
              {!aiLoading && (
                <button onClick={() => navigator.clipboard.writeText(aiOutput)} style={{ background: "transparent", border: `0.5px solid ${s.border2}`, borderRadius: 4, padding: "7px 16px", fontFamily: "DM Mono, monospace", fontSize: 12, color: s.muted, cursor: "pointer" }}>Copy</button>
              )}
              <button onClick={() => { setAiModal(null); setAiOutput(""); }} style={{ background: s.accent, color: s.bg, border: "none", padding: "7px 16px", borderRadius: 4, fontFamily: "DM Mono, monospace", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: s.surface2, border: `0.5px solid ${s.border2}`, borderRadius: 12, padding: "1.5rem", width: 420, maxWidth: "95vw" }}>
            <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 20, fontWeight: 300, fontStyle: "italic", marginBottom: "1.25rem" }}>New Application</h2>
            {["company", "role"].map(field => (
              <div key={field} style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: 11, color: s.muted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>{field}</label>
                <input value={form[field]} onChange={e => setForm({ ...form, [field]: e.target.value })} style={{ width: "100%", background: s.bg, border: `0.5px solid ${s.border2}`, borderRadius: 6, padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 13, color: s.text, outline: "none" }} />
              </div>
            ))}
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: 11, color: s.muted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={{ width: "100%", background: s.bg, border: `0.5px solid ${s.border2}`, borderRadius: 6, padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 13, color: s.text, outline: "none" }}>
                {STAGES.slice(1).map(st => <option key={st} value={st}>{st}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: 11, color: s.muted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>Date Applied</label>
              <input type="date" value={form.date_applied} onChange={e => setForm({ ...form, date_applied: e.target.value })} style={{ width: "100%", background: s.bg, border: `0.5px solid ${s.border2}`, borderRadius: 6, padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 13, color: s.text, outline: "none" }} />
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: "1.25rem" }}>
              <button onClick={() => setShowModal(false)} style={{ background: "transparent", border: `0.5px solid ${s.border2}`, borderRadius: 4, padding: "7px 16px", fontFamily: "DM Mono, monospace", fontSize: 12, color: s.muted, cursor: "pointer" }}>Cancel</button>
              <button onClick={addApp} style={{ background: s.accent, color: s.bg, border: "none", padding: "7px 16px", borderRadius: 4, fontFamily: "DM Mono, monospace", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}