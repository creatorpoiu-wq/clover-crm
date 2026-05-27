"use client";
import { useState, useEffect } from "react";
import { Save, Type, CheckCircle, FileText } from "lucide-react";

const TABS = [
  { id: "steps",   label: "Step Text",     icon: Type },
  { id: "contract", label: "Contract Template", icon: FileText },
  { id: "confirm", label: "Confirmation",  icon: CheckCircle },
];

const DEFAULT_SETTINGS = {
  steps: [
    { title: "Choose Your Experience", subtitle: "Select the date and time for your portrait session." },
    { title: "Review & Sign Your Contract", subtitle: "Please review and sign the agreement below." },
    { title: "Complete Your Booking", subtitle: "Secure your session by submitting the retainer." },
  ],
  contractTemplateId: null as number | null,
  confirmationTitle: "Booking Confirmed!",
  confirmationMessage: "Your deposit has been received and your session is securely booked. We look forward to working with you!",
};

export default function PortraitSettingsPage() {
  const [tab, setTab] = useState("steps");
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [cTemplates, setCTemplates] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    fetch("/api/portrait-settings")
      .then(r => r.json())
      .then(d => { if (d.success) setSettings(d.settings); });
      
    fetch("/api/contract-templates")
      .then(r => r.json())
      .then(d => { if (d.success) setCTemplates(d.templates); });
  }, []);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/portrait-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (data.success) showToast("Settings saved!", "success");
      else showToast(data.error || "Save failed.", "error");
    } catch {
      showToast("Network error.", "error");
    } finally {
      setSaving(false);
    }
  };

  const updateStep = (i: number, field: "title" | "subtitle", val: string) => {
    const steps = [...settings.steps];
    steps[i] = { ...steps[i], [field]: val };
    setSettings(s => ({ ...s, steps }));
  };

  const inputCls = { width: "100%", padding: "10px 14px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 14, outline: "none", background: "var(--background)", color: "var(--foreground)", boxSizing: "border-box" as const };
  const labelCls = { display: "block", fontSize: 12, fontWeight: 700 as const, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 6 };

  const STEP_LABELS = ["Step 1 — Date & Time", "Step 2 — Contract", "Step 3 — Payment"];

  return (
    <div className="animate-fade-in" style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto", paddingBottom: "100px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2.5rem" }}>
        <div>
          <h1 className="page-title" style={{ fontSize: "2rem", fontWeight: 900, marginBottom: "0.5rem" }}>Portrait Funnel Settings</h1>
          <p className="page-subtitle" style={{ color: "var(--muted)" }}>Customize the steps and contract for the Portrait Funnel.</p>
        </div>
        <button onClick={save} disabled={saving} className="btn btn-primary" style={{ width: "auto", display: "flex", alignItems: "center", gap: 8, padding: "12px 24px", borderRadius: "8px", fontWeight: 700, backgroundColor: "var(--primary)", color: "#fff", border: "none", cursor: "pointer" }}>
          <Save size={16} /> {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Tab Nav */}
      <div style={{ display: "flex", gap: 4, marginBottom: "2rem", borderBottom: "2px solid var(--border)", paddingBottom: 0 }}>
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: "10px 20px", border: "none", background: "transparent", cursor: "pointer",
              fontSize: 14, fontWeight: 700,
              color: tab === t.id ? "var(--primary)" : "var(--muted)",
              borderBottom: tab === t.id ? "2px solid var(--primary)" : "2px solid transparent",
              marginBottom: -2, display: "flex", alignItems: "center", gap: 6,
            }}>
              <Icon size={15} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* STEPS TAB */}
      {tab === "steps" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {settings.steps.map((step, i) => (
            <div key={i} className="glass-panel" style={{ padding: "1.5rem", background: "var(--card)", borderRadius: "12px", border: "1px solid var(--border)" }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: "var(--primary)", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {STEP_LABELS[i]}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 16 }}>
                <div>
                  <label style={labelCls}>Heading</label>
                  <input style={inputCls} value={step.title} onChange={e => updateStep(i, "title", e.target.value)} placeholder="Step heading..." />
                </div>
                <div>
                  <label style={labelCls}>Subheading</label>
                  <input style={inputCls} value={step.subtitle} onChange={e => updateStep(i, "subtitle", e.target.value)} placeholder="Step subheading..." />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CONTRACT TAB */}
      {tab === "contract" && (
        <div className="glass-panel" style={{ padding: "2rem", background: "var(--card)", borderRadius: "12px", border: "1px solid var(--border)" }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 24px" }}>Contract Template</h3>
          <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 24 }}>Select the contract template to be used in Step 2 of the Portrait Funnel. You can create new templates in the Contract Builder.</p>
          
          <div>
            <label style={labelCls}>Selected Contract Template</label>
            <select 
              value={settings.contractTemplateId || ""} 
              onChange={e => setSettings(s => ({ ...s, contractTemplateId: e.target.value ? parseInt(e.target.value) : null }))}
              style={{ ...inputCls, cursor: "pointer" }}
            >
              <option value="">-- No Contract Selected (Will use default text) --</option>
              {cTemplates.map(t => (
                <option key={t.Template_ID} value={t.Template_ID}>{t.Name}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* CONFIRMATION TAB */}
      {tab === "confirm" && (
        <div className="glass-panel" style={{ padding: "2rem", background: "var(--card)", borderRadius: "12px", border: "1px solid var(--border)" }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 24px" }}>Booking Confirmation Screen</h3>
          <div style={{ marginBottom: 20 }}>
            <label style={labelCls}>Confirmation Heading</label>
            <input style={inputCls} value={settings.confirmationTitle} onChange={e => setSettings(s => ({ ...s, confirmationTitle: e.target.value }))} placeholder="e.g. Booking Confirmed!" />
          </div>
          <div>
            <label style={labelCls}>Confirmation Message</label>
            <textarea
              value={settings.confirmationMessage}
              onChange={e => setSettings(s => ({ ...s, confirmationMessage: e.target.value }))}
              rows={5}
              placeholder="e.g. Thank you! Your deposit has been received..."
              style={{ ...inputCls, resize: "vertical" }}
            />
          </div>
          <div style={{ marginTop: 24, padding: 20, background: "var(--background)", border: "1px solid var(--border)", borderRadius: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: 12 }}>Preview</div>
            <div style={{ textAlign: "center", padding: 24 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: "var(--foreground)", margin: "0 0 8px" }}>{settings.confirmationTitle || "Booking Confirmed!"}</h2>
              <p style={{ fontSize: 14, color: "var(--muted)", maxWidth: 400, margin: "0 auto" }}>{settings.confirmationMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="animate-fade-in" style={{
          position: "fixed", bottom: 24, right: 24,
          background: toast.type === "success" ? "#10b981" : "#ef4444",
          color: "#fff", padding: "16px 24px", borderRadius: 8,
          boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
          display: "flex", alignItems: "center", gap: 12, zIndex: 1000, fontWeight: 700,
        }}>
          {toast.type === "success" ? "✓" : "✕"} {toast.msg}
        </div>
      )}
    </div>
  );
}
