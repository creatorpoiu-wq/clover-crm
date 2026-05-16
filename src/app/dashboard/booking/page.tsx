"use client";
import { useState, useEffect } from "react";
import { Save, Plus, Trash2, Settings, Package, CreditCard, CheckCircle, Type } from "lucide-react";

const TABS = [
  { id: "steps",   label: "Step Text",     icon: Type },
  { id: "addons",  label: "Add-Ons",       icon: Package },
  { id: "payment", label: "Payment",        icon: CreditCard },
  { id: "confirm", label: "Confirmation",  icon: CheckCircle },
];

const DEFAULT_SETTINGS = {
  steps: [
    { title: "Choose Your Experience", subtitle: "Select the collection that perfectly fits your day. All packages include a pre-wedding consultation and timeline planning." },
    { title: "Tell Us About Your Day", subtitle: "Help us prepare the perfect agreement for your event." },
    { title: "Review & Sign Your Contract", subtitle: "Please fill out any required fields and sign the agreement below." },
    { title: "Complete Your Booking", subtitle: "Secure your date by submitting the 50% retainer." },
  ],
  addons: [] as any[],
  paymentMethods: [] as any[],
  confirmationTitle: "Booking Confirmed!",
  confirmationMessage: "Your deposit has been received and your contract is securely signed. We are officially locked in!",
};

export default function BookingSettingsPage() {
  const [tab, setTab] = useState("steps");
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // New addon form
  const [newAddon, setNewAddon] = useState({ name: "", desc: "", price: "" });
  // New payment method form
  const [newPayment, setNewPayment] = useState({ name: "", details: "", enabled: true });

  useEffect(() => {
    fetch("/api/funnel-settings")
      .then(r => r.json())
      .then(d => { if (d.success) setSettings(d.settings); });
  }, []);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/funnel-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const d = await res.json();
      if (d.success) showToast("Funnel settings saved!", "success");
      else showToast(d.error || "Save failed.", "error");
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

  const addAddon = () => {
    if (!newAddon.name || !newAddon.price) return;
    const addon = { id: `a${Date.now()}`, name: newAddon.name, desc: newAddon.desc, price: parseFloat(newAddon.price) || 0 };
    setSettings(s => ({ ...s, addons: [...s.addons, addon] }));
    setNewAddon({ name: "", desc: "", price: "" });
  };

  const removeAddon = (id: string) => {
    setSettings(s => ({ ...s, addons: s.addons.filter((a: any) => a.id !== id) }));
  };

  const addPayment = () => {
    if (!newPayment.name) return;
    const pm = { id: `pm${Date.now()}`, name: newPayment.name, details: newPayment.details, enabled: true };
    setSettings(s => ({ ...s, paymentMethods: [...s.paymentMethods, pm] }));
    setNewPayment({ name: "", details: "", enabled: true });
  };

  const removePayment = (id: string) => {
    setSettings(s => ({ ...s, paymentMethods: s.paymentMethods.filter((p: any) => p.id !== id) }));
  };

  const togglePayment = (id: string) => {
    setSettings(s => ({ ...s, paymentMethods: s.paymentMethods.map((p: any) => p.id === id ? { ...p, enabled: !p.enabled } : p) }));
  };

  const inputCls = { width: "100%", padding: "10px 14px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 14, outline: "none", background: "var(--background)", color: "var(--foreground)", boxSizing: "border-box" as const };
  const labelCls = { display: "block", fontSize: 12, fontWeight: 700 as const, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 6 };

  const STEP_LABELS = ["Step 1 — Packages", "Step 2 — Questionnaire", "Step 3 — Contract", "Step 4 — Payment"];

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2.5rem" }}>
        <div>
          <h1 className="page-title">Booking Funnel Settings</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>Customise every step of the client-facing booking experience.</p>
        </div>
        <button onClick={save} disabled={saving} className="btn btn-primary" style={{ width: "auto", display: "flex", alignItems: "center", gap: 8 }}>
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
            <div key={i} className="glass-panel" style={{ padding: "1.5rem" }}>
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

      {/* ADD-ONS TAB */}
      {tab === "addons" && (
        <div>
          <div className="glass-panel" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 16px" }}>Add New Add-On</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 100px auto", gap: 12, alignItems: "flex-end" }}>
              <div>
                <label style={labelCls}>Name</label>
                <input style={inputCls} value={newAddon.name} onChange={e => setNewAddon(a => ({ ...a, name: e.target.value }))} placeholder="e.g. Drone Footage" />
              </div>
              <div>
                <label style={labelCls}>Description</label>
                <input style={inputCls} value={newAddon.desc} onChange={e => setNewAddon(a => ({ ...a, desc: e.target.value }))} placeholder="Short description..." />
              </div>
              <div>
                <label style={labelCls}>Price ($)</label>
                <input style={inputCls} type="number" value={newAddon.price} onChange={e => setNewAddon(a => ({ ...a, price: e.target.value }))} placeholder="300" />
              </div>
              <button onClick={addAddon} className="btn btn-primary" style={{ width: "auto", padding: "10px 16px", display: "flex", alignItems: "center", gap: 6 }}>
                <Plus size={16} /> Add
              </button>
            </div>
          </div>

          {settings.addons.length === 0 ? (
            <div className="empty-state">No add-ons configured yet. Add your first above.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {settings.addons.map((a: any) => (
                <div key={a.id} className="glass-panel" style={{ padding: "1rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 15 }}>{a.name} <span style={{ fontWeight: 700, color: "var(--primary)", fontSize: 14 }}>+${a.price}</span></div>
                    <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>{a.desc}</div>
                  </div>
                  <button onClick={() => removeAddon(a.id)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--status-red-fg)", padding: 8 }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PAYMENT TAB */}
      {tab === "payment" && (
        <div>
          <div className="glass-panel" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 16px" }}>Add Payment Method</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr auto", gap: 12, alignItems: "flex-end" }}>
              <div>
                <label style={labelCls}>Method Name</label>
                <input style={inputCls} value={newPayment.name} onChange={e => setNewPayment(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Zelle, Credit Card" />
              </div>
              <div>
                <label style={labelCls}>Instructions / Details</label>
                <input style={inputCls} value={newPayment.details} onChange={e => setNewPayment(p => ({ ...p, details: e.target.value }))} placeholder="e.g. payments@studio.com or bank account..." />
              </div>
              <button onClick={addPayment} className="btn btn-primary" style={{ width: "auto", padding: "10px 16px", display: "flex", alignItems: "center", gap: 6 }}>
                <Plus size={16} /> Add
              </button>
            </div>
          </div>

          {settings.paymentMethods.length === 0 ? (
            <div className="empty-state">No payment methods configured. The booking funnel will show default options.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {settings.paymentMethods.map((pm: any) => (
                <div key={pm.id} className="glass-panel" style={{ padding: "1rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                      <input type="checkbox" checked={pm.enabled} onChange={() => togglePayment(pm.id)} style={{ width: 16, height: 16 }} />
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 15 }}>{pm.name}</div>
                        <div style={{ fontSize: 13, color: "var(--muted)" }}>{pm.details}</div>
                      </div>
                    </label>
                  </div>
                  <button onClick={() => removePayment(pm.id)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--status-red-fg)", padding: 8 }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CONFIRMATION TAB */}
      {tab === "confirm" && (
        <div className="glass-panel" style={{ padding: "2rem" }}>
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
