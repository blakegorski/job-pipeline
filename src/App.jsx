import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const COLORS = {
  Applied:      { bar: "#4a9eff", badge: "rgba(74,158,255,0.15)", text: "#4a9eff" },
  "Phone Screen": { bar: "#a78bfa", badge: "rgba(167,139,250,0.15)", text: "#a78bfa" },
  Interview:    { bar: "#f59e0b", badge: "rgba(245,158,11,0.15)", text: "#f59e0b" },
  Offer:        { bar: "#c9f564", badge: "rgba(201,245,100,0.15)", text: "#c9f564" },
  Rejected:     { bar: "#ff5f57", badge: "rgba(255,95,87,0.15)", text: "#ff5f57" },
};

const STAGES = ["All", "Applied", "Phone Screen", "Interview", "Offer", "Rejected"];

export default function App() {
  const [apps, setApps] = useState([]);
  const [filter, setFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ company: "", role: "", status: "Applied", date_applied: new Date().toISOString().split("T")[0] });

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

  function daysSince(dateStr) {
    return Math.floor((new Date() - new Date(dateStr)) / 86400000);
  }

  const visible = filter === "All" ? apps : apps.filter(a => a.status === filter);
  const counts = {};
  STAGES.slice(1).forEach(s => counts[s] = apps.filter(a => a.status === s).length);
  const responded = (counts["Phone Screen"] || 0) + (counts["Interview"] || 0) + (counts["Offer"] || 0) + (counts["Rejected"] || 0);
  const rate = apps.length ? Math.round((responded / apps.length) * 100) : 0;

  return (
    <div style={{ background: "#0e0e0f", minHeight: "100vh", color: "#f0ede8", fontFamily: "'DM Mono', monospace", padding: "2rem 1.5rem" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Fraunces:ital,opsz,wght@0,9..144,300;1,9..144,300&display=swap" rel="stylesheet" />
      <div style={{ maxWidth: 960, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "0.5px solid rgba(255,255,255,0.12)", paddingBottom: "1.25rem", marginBottom: "2rem" }}>
          <div>
            <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 28, fontWeight: 300, fontStyle: "italic", letterSpacing: "-0.02em" }}>Pipeline</h1>
            <p style={{ fontSize: 11, color: "#7a7875", marginTop: 2, letterSpacing: "0.08em", textTransform: "uppercase" }}>Job Search Tracker</p>
          </div>
          <button onClick={() => setShowModal(true)} style={{ background: "#c9f564", color: "#0e0e0f", border: "none", padding: "8px 18px", borderRadius: 4, fontFamily: "DM Mono, monospace", fontSize: 12, fontWeight: 500, cursor: "pointer", letterSpacing: "0.04em" }}>
            + Add Application
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: "1.5rem" }}>
          {STAGES.slice(1).map(s => (
            <div key={s} style={{ background: "#17171a", border: "0.5px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 22, fontWeight: 500, fontFamily: "Fraunces, serif", color: COLORS[s].text }}>{counts[s] || 0}</div>
              <div style={{ fontSize: 10, color: "#7a7875", marginTop: 2, letterSpacing: "0.06em", textTransform: "uppercase" }}>{s}</div>
            </div>
          ))}
        </div>

        {/* Response rate */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1.5rem", fontSize: 12, color: "#7a7875" }}>
          <span>Response rate</span>
          <div style={{ flex: 1, height: 3, background: "#1e1e22", borderRadius: 2 }}>
            <div style={{ height: 3, background: "#c9f564", borderRadius: 2, width: rate + "%" }} />
          </div>
          <span>{rate}%</span>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 8, marginBottom: "1.5rem", flexWrap: "wrap" }}>
          {STAGES.map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{ background: filter === s ? "rgba(201,245,100,0.12)" : "#17171a", border: filter === s ? "0.5px solid #c9f564" : "0.5px solid rgba(255,255,255,0.07)", borderRadius: 4, padding: "5px 14px", fontFamily: "DM Mono, monospace", fontSize: 11, color: filter === s ? "#c9f564" : "#7a7875", cursor: "pointer", letterSpacing: "0.04em" }}>
              {s} ({s === "All" ? apps.length : counts[s] || 0})
            </button>
          ))}
        </div>

        {/* Applications */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#7a7875", fontSize: 13 }}>Loading...</div>
        ) : visible.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#7a7875", fontSize: 13 }}>No applications in this stage.</div>
        ) : visible.map(a => {
          const days = daysSince(a.date_applied);
          const needsFollowup = days >= 7 && a.status === "Applied";
          const c = COLORS[a.status];
          return (
            <div key={a.id} style={{ background: "#17171a", border: "0.5px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "14px 16px", display: "grid", gridTemplateColumns: "3px 1fr auto auto auto", alignItems: "center", gap: 14, marginBottom: 8 }}>
              <div style={{ width: 3, height: 36, borderRadius: 2, background: c.bar }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.company}</div>
                <div style={{ fontSize: 12, color: "#7a7875", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.role}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "#7a7875" }}>{days}d ago</div>
                {needsFollowup && <div style={{ fontSize: 10, color: "#ff5f57" }}>follow up</div>}
              </div>
              <select onChange={e => updateStatus(a.id, e.target.value)} value={a.status} style={{ background: c.badge, border: "none", borderRadius: 3, padding: "3px 8px", fontFamily: "DM Mono, monospace", fontSize: 10, fontWeight: 500, color: c.text, cursor: "pointer", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {STAGES.slice(1).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button onClick={() => deleteApp(a.id)} style={{ background: "transparent", border: "none", color: "#7a7875", cursor: "pointer", fontSize: 16, padding: "0 4px" }}>×</button>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#1e1e22", border: "0.5px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: "1.5rem", width: 420, maxWidth: "95vw" }}>
            <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 20, fontWeight: 300, fontStyle: "italic", marginBottom: "1.25rem" }}>New Application</h2>
            {["company", "role"].map(field => (
              <div key={field} style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: 11, color: "#7a7875", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>{field}</label>
                <input value={form[field]} onChange={e => setForm({ ...form, [field]: e.target.value })} style={{ width: "100%", background: "#0e0e0f", border: "0.5px solid rgba(255,255,255,0.12)", borderRadius: 6, padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 13, color: "#f0ede8", outline: "none" }} />
              </div>
            ))}
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: 11, color: "#7a7875", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={{ width: "100%", background: "#0e0e0f", border: "0.5px solid rgba(255,255,255,0.12)", borderRadius: 6, padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 13, color: "#f0ede8", outline: "none" }}>
                {STAGES.slice(1).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: 11, color: "#7a7875", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>Date Applied</label>
              <input type="date" value={form.date_applied} onChange={e => setForm({ ...form, date_applied: e.target.value })} style={{ width: "100%", background: "#0e0e0f", border: "0.5px solid rgba(255,255,255,0.12)", borderRadius: 6, padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 13, color: "#f0ede8", outline: "none" }} />
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: "1.25rem" }}>
              <button onClick={() => setShowModal(false)} style={{ background: "transparent", border: "0.5px solid rgba(255,255,255,0.12)", borderRadius: 4, padding: "7px 16px", fontFamily: "DM Mono, monospace", fontSize: 12, color: "#7a7875", cursor: "pointer" }}>Cancel</button>
              <button onClick={addApp} style={{ background: "#c9f564", color: "#0e0e0f", border: "none", padding: "7px 16px", borderRadius: 4, fontFamily: "DM Mono, monospace", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}