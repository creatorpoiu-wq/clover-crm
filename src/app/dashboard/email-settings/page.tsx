"use client";
import { useState, useEffect } from "react";
import { Save, Mail, FileSignature, ReceiptText, Eye, EyeOff } from "lucide-react";

type EmailType = "proposal" | "contract" | "invoice" | "reminder";

const TABS: { id: EmailType; label: string; icon: any; description: string }[] = [
  { id: "proposal", label: "Booking Proposal",  icon: Mail,           description: "Sent when you share a booking proposal link with a client." },
  { id: "contract", label: "Contract Email",     icon: FileSignature,  description: "Sent when a contract is emailed for digital signature." },
  { id: "invoice",  label: "Invoice Email",      icon: ReceiptText,    description: "Sent when an invoice is emailed to a client." },
  { id: "reminder", label: "Client Reminders",   icon: Mail,           description: "Automated event and follow-up reminders via Email & SMS." },
];

const DEFAULTS: Record<EmailType, any> = {
  proposal: {
    subject: "Your Booking Proposal is Ready",
    headerText: "Your booking proposal is ready for review.",
    greeting: "Hello [Name],",
    body: "We are excited to work with you! Your customised booking proposal is ready. Please click the button below to complete your questionnaire, sign your contract, and finalise your booking deposit.",
    ctaText: "View Booking Proposal",
    footerText: "Questions? Simply reply to this email and we'll be happy to help.",
    accentColor: "#0d9488",
  },
  contract: {
    subject: "Contract Ready for Your Signature",
    headerText: "Your contract is ready for review and signature.",
    greeting: "Hello [Name],",
    body: "Please review the agreement carefully. Click the button below to read the full contract and add your digital signature to finalise your booking.",
    ctaText: "Review & Sign Contract",
    footerText: "Digital signatures are legally binding under ESIGN and UETA. Reply to this email with any questions.",
    accentColor: "#0d9488",
  },
  invoice: {
    subject: "Invoice from [Company]",
    headerText: "You have received a new invoice.",
    greeting: "Hello [Name],",
    body: "Please find your invoice attached. Review the details below and use the payment options provided to complete your payment.",
    ctaText: "View Invoice",
    footerText: "Thank you for your business! Please contact us if you have any questions.",
    accentColor: "#1e40af",
  },
  reminder: {
    subject: "Friendly Reminder from [Company]",
    headerText: "You have an upcoming event or follow-up.",
    greeting: "Hello [Name],",
    body: "This is a quick reminder regarding your upcoming event or outstanding items. We look forward to working with you soon!",
    ctaText: "View Details",
    footerText: "If you have any questions, please reply to this email.",
    accentColor: "#0d9488",
    smsText: "Hi [Name]! Just a friendly reminder regarding your upcoming event with [Company]. Reply if you have questions!"
  },
};

function EmailPreview({ settings, companyName }: { settings: any; companyName: string }) {
  const ac = settings.accentColor || "#0d9488";
  return (
    <div style={{ fontFamily: "Arial, sans-serif", maxWidth: 560, margin: "0 auto", border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden", fontSize: 14, color: "#374151" }}>
      {/* Banner */}
      <div style={{ background: ac, padding: "28px 32px" }}>
        <div style={{ color: "#fff", fontWeight: 800, fontSize: 18, marginBottom: 6 }}>{companyName || "Your Studio"}</div>
        <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 14 }}>{settings.headerText}</div>
      </div>
      {/* Body */}
      <div style={{ padding: "32px", background: "#fff" }}>
        <p style={{ fontWeight: 700, fontSize: 15, margin: "0 0 16px" }}>{settings.greeting.replace("[Name]", "Jordan")}</p>
        <p style={{ margin: "0 0 28px", lineHeight: 1.6, color: "#4b5563" }}>{settings.body}</p>
        <div style={{ textAlign: "center", margin: "0 0 28px" }}>
          <span style={{ display: "inline-block", background: ac, color: "#fff", padding: "13px 28px", borderRadius: 8, fontWeight: 700, fontSize: 14 }}>
            {settings.ctaText}
          </span>
        </div>
        <hr style={{ border: "none", borderTop: "1px solid #e5e7eb", margin: "24px 0" }} />
        <p style={{ fontSize: 12, color: "#9ca3af", margin: 0, textAlign: "center" }}>{settings.footerText}</p>
      </div>
      {/* Footer bar */}
      <div style={{ background: "#f9fafb", padding: "14px 32px", textAlign: "center", borderTop: "1px solid #e5e7eb" }}>
        <span style={{ fontSize: 11, color: "#9ca3af" }}>Sent via {companyName || "Clover"}</span>
      </div>
    </div>
  );
}

export default function EmailSettingsPage() {
  const [tab, setTab] = useState<EmailType>("proposal");
  const [settings, setSettings] = useState<Record<EmailType, any>>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    fetch("/api/email-settings")
      .then(r => r.json())
      .then(d => { if (d.success) setSettings(d.settings); });
    // Load company name from settings API
    fetch("/api/settings")
      .then(r => r.json())
      .then(d => {
        const name = d.config?.Company_Name || d.Company_Name || '';
        if (name) setCompanyName(name);
      })
      .catch(() => {});
  }, []);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/email-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const d = await res.json();
      if (d.success) showToast("Email settings saved!", "success");
      else showToast(d.error || "Save failed.", "error");
    } catch {
      showToast("Network error.", "error");
    } finally {
      setSaving(false);
    }
  };

  const update = (field: string, val: string) => {
    setSettings(s => ({ ...s, [tab]: { ...s[tab], [field]: val } }));
  };

  const current = settings[tab];

  const inputCls: React.CSSProperties = {
    width: "100%", padding: "10px 14px",
    border: "1px solid var(--border)", borderRadius: 8,
    fontSize: 14, outline: "none",
    background: "var(--background)", color: "var(--foreground)",
    boxSizing: "border-box",
  };
  const labelCls: React.CSSProperties = {
    display: "block", fontSize: 12, fontWeight: 700,
    color: "var(--muted)", textTransform: "uppercase",
    letterSpacing: "0.05em", marginBottom: 6,
  };
  const fieldWrap: React.CSSProperties = { marginBottom: 20 };

  const tabInfo = TABS.find(t => t.id === tab)!;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2.5rem", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 className="page-title">Email Design Settings</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>
            Customise the text, buttons, and style for every email type sent from your CRM.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => setShowPreview(p => !p)}
            className="btn btn-outline"
            style={{ width: "auto", display: "flex", alignItems: "center", gap: 8 }}
          >
            {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
            {showPreview ? "Hide Preview" : "Preview Email"}
          </button>
          <button onClick={save} disabled={saving} className="btn btn-primary" style={{ width: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            <Save size={16} /> {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Tab Nav */}
      <div style={{ display: "flex", gap: 4, marginBottom: "2rem", borderBottom: "2px solid var(--border)" }}>
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: "10px 20px", border: "none", background: "transparent", cursor: "pointer",
              fontSize: 14, fontWeight: 700,
              color: tab === t.id ? "var(--primary)" : "var(--muted)",
              borderBottom: tab === t.id ? "2px solid var(--primary)" : "2px solid transparent",
              marginBottom: -2, display: "flex", alignItems: "center", gap: 7,
            }}>
              <Icon size={15} /> {t.label}
            </button>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: showPreview ? "1fr 1fr" : "1fr", gap: 32, alignItems: "flex-start" }}>
        {/* Left — Form */}
        <div>
          <div className="glass-panel" style={{ padding: "0.25rem 0 0", overflow: "hidden" }}>
            {/* Section label */}
            <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)", background: "var(--background)" }}>
              <div style={{ fontWeight: 800, fontSize: 13, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{tabInfo.label}</div>
              <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 3 }}>{tabInfo.description}</div>
            </div>

            <div style={{ padding: "24px" }}>
              {/* Subject */}
              <div style={fieldWrap}>
                <label style={labelCls}>Email Subject Line</label>
                <input style={inputCls} value={current.subject} onChange={e => update("subject", e.target.value)} placeholder="e.g. Your Proposal is Ready" />
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>Use <code>[Name]</code> for client name, <code>[Company]</code> for your company name.</div>
              </div>

              {/* Header text (banner subtitle) */}
              <div style={fieldWrap}>
                <label style={labelCls}>Banner Subtitle</label>
                <input style={inputCls} value={current.headerText} onChange={e => update("headerText", e.target.value)} placeholder="Short subtitle under your company name in the coloured banner" />
              </div>

              {/* Greeting */}
              <div style={fieldWrap}>
                <label style={labelCls}>Greeting / Salutation</label>
                <input style={inputCls} value={current.greeting} onChange={e => update("greeting", e.target.value)} placeholder="e.g. Hello [Name]," />
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}><code>[Name]</code> is replaced with the client's first name.</div>
              </div>

              {/* Body */}
              <div style={fieldWrap}>
                <label style={labelCls}>Email Body</label>
                <textarea
                  value={current.body}
                  onChange={e => update("body", e.target.value)}
                  rows={5}
                  style={{ ...inputCls, resize: "vertical" }}
                  placeholder="Main message body…"
                />
              </div>

              {/* CTA Button */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: 16, ...fieldWrap }}>
                <div>
                  <label style={labelCls}>Button Label</label>
                  <input style={inputCls} value={current.ctaText} onChange={e => update("ctaText", e.target.value)} placeholder="e.g. View Booking Proposal" />
                </div>
                <div>
                  <label style={labelCls}>Accent Colour</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <input
                      type="color"
                      value={current.accentColor}
                      onChange={e => update("accentColor", e.target.value)}
                      style={{ width: 44, height: 44, padding: 2, border: "1px solid var(--border)", borderRadius: 8, cursor: "pointer", background: "transparent" }}
                    />
                    <input
                      style={{ ...inputCls, flex: 1 }}
                      value={current.accentColor}
                      onChange={e => update("accentColor", e.target.value)}
                      placeholder="#0d9488"
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div style={fieldWrap}>
                <label style={labelCls}>Footer Text</label>
                <input style={inputCls} value={current.footerText} onChange={e => update("footerText", e.target.value)} placeholder="e.g. Questions? Reply to this email." />
              </div>

              {/* SMS Config (Only for Reminders) */}
              {tab === "reminder" && (
                <div style={fieldWrap}>
                  <label style={labelCls}>SMS Text Message</label>
                  <textarea
                    value={current.smsText || ""}
                    onChange={e => update("smsText", e.target.value)}
                    rows={3}
                    style={{ ...inputCls, resize: "vertical" }}
                    placeholder="Short text message..."
                    maxLength={160}
                  />
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4, display: "flex", justifyContent: "space-between" }}>
                    <span>Use <code>[Name]</code> and <code>[Company]</code></span>
                    <span>{(current.smsText || "").length} / 160 chars</span>
                  </div>
                </div>
              )}

              {/* Reset to defaults */}
              <div style={{ paddingTop: 8, borderTop: "1px solid var(--border)" }}>
                <button
                  onClick={() => setSettings(s => ({ ...s, [tab]: { ...DEFAULTS[tab] } }))}
                  style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 12, color: "var(--muted)", fontWeight: 700, padding: 0 }}
                >
                  ↺ Reset to defaults
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right — Live Preview */}
        {showPreview && (
          <div className="animate-fade-in">
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
              Live Preview
            </div>
            <EmailPreview settings={current} companyName={companyName} />
            <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 8, textAlign: "center" }}>
              [Name] shown as "Jordan" for preview purposes.
            </p>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
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
