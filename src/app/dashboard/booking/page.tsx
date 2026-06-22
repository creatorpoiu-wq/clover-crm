"use client";
import { useState, useEffect } from "react";
import { Save, Plus, Trash2, Settings, Package, CreditCard, CheckCircle, Type, Mail, Camera, ArrowRight, FileText } from "lucide-react";
import ImageDropzone from "@/components/ui/ImageDropzone";

const TABS = [
  { id: "general", label: "General Intro", icon: Settings },
  { id: "style",   label: "Signature Style", icon: Camera },
  { id: "investment", label: "Investment", icon: Package },
  { id: "addons",  label: "Add-Ons",       icon: Package },
  { id: "forms",   label: "Forms",         icon: FileText },
  { id: "whatsnext", label: "What's Next", icon: ArrowRight },
  { id: "payment", label: "Payment",        icon: CreditCard },
  { id: "steps",   label: "Step Text",     icon: Type },
  { id: "confirm", label: "Confirmation",  icon: CheckCircle },
  { id: "email",   label: "Proposal Email", icon: Mail },
];

const DEFAULT_SETTINGS = {
  // General Intro
  welcomeHeroHeadline: "Welcome to the Experience.",
  welcomeHeroSubheadline: "We are thrilled to be part of your special day. Please proceed to select your package and secure your date.",
  coverImage: "",
  // Signature Style
  styleHeading: 'Candid. Timeless. Authentic.',
  styleDescription: 'We specialize in capturing raw, authentic moments rather than stiff poses. Our editing style relies on true-to-life colors with a subtle cinematic warmth, ensuring your portraits look beautiful decades from now.',
  styleBullets: ['Natural light prioritization', 'Guided, movement-based posing', 'True-to-color editing aesthetic', 'Focus on genuine emotion'],
  styleMediaType: 'image',
  stylePhotoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1887&auto=format&fit=crop',
  styleVideo1Url: '',
  styleVideo2Url: '',
  // Investment
  investmentHeadline: 'Transparent, all-inclusive pricing.',
  investmentDescription: 'No hidden fees. Select the collection that best suits your vision for the big day.',
  // What's Next
  whatsNextHeading: 'What happens next?',
  whatsNextSub: 'Booking your session is a seamless, 3-step process.',
  whatsNextSteps: [
    { title: 'Pick Your Date', description: 'View my real-time calendar and select the exact date and time that works for you.' },
    { title: 'Sign Digitally', description: 'Review and sign your digital contract instantly to secure the legalities.' },
    { title: 'Pay Retainer', description: 'Submit your non-refundable retainer securely. Your date is officially locked in!' },
  ],
  // Funnel Steps
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
  contractTemplateId: null as number | null,
  questionnaireTemplateId: null as number | null,
};

export default function BookingSettingsPage() {
  const [tab, setTab] = useState("steps");
  const [settings, setSettings] = useState<typeof DEFAULT_SETTINGS & { userId?: string }>(DEFAULT_SETTINGS);
  const [emailSettings, setEmailSettings] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [copied, setCopied] = useState(false);
  const [customDomain, setCustomDomain] = useState("");
  const [qTemplates, setQTemplates] = useState<any[]>([]);
  const [cTemplates, setCTemplates] = useState<any[]>([]);

  // Input states for list additions
  const [newAddon, setNewAddon] = useState({ name: "", desc: "", price: "" });
  const [newPayment, setNewPayment] = useState({ name: "", details: "", enabled: true });
  const [newStyleBullet, setNewStyleBullet] = useState("");

  const baseOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://clover-crm.vercel.app';
  const baseUrl = customDomain ? `https://${customDomain}` : baseOrigin;
  const publicLink = settings.userId ? (customDomain ? `${baseUrl}/booking` : `${baseUrl}/booking?userId=${settings.userId}`) : null;

  const copyLink = () => {
    if (!publicLink) return;
    navigator.clipboard.writeText(publicLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  useEffect(() => {
    fetch("/api/funnel-settings")
      .then(r => r.json())
      .then(d => { if (d.success) setSettings(d.settings); });
      
    fetch("/api/email-settings")
      .then(r => r.json())
      .then(d => { if (d.success) setEmailSettings(d.settings); });

    fetch("/api/settings")
      .then(r => r.json())
      .then(d => { if (d.success && d.config?.customDomain) setCustomDomain(d.config.customDomain); });
      
    fetch("/api/questionnaire?type=template")
      .then(r => r.json())
      .then(d => { if (d.success) setQTemplates(d.templates || []); });

    fetch("/api/contract-templates")
      .then(r => r.json())
      .then(d => { if (d.success) setCTemplates(d.templates || []); });
  }, []);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const save = async () => {
    setSaving(true);
    try {
      const p1 = fetch("/api/funnel-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const p2 = fetch("/api/email-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailSettings),
      });

      const [res1, res2] = await Promise.all([p1, p2]);
      const d1 = await res1.json();
      const d2 = await res2.json();

      if (d1.success && d2.success) showToast("Settings saved!", "success");
      else showToast(d1.error || d2.error || "Save failed.", "error");
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

  const updateEmail = (field: string, val: string) => {
    setEmailSettings((s: any) => ({
      ...s,
      proposal: {
        ...s?.proposal,
        [field]: val
      }
    }));
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

      {/* Public Link Banner */}
      {publicLink && (
        <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", borderRadius: 12, padding: "1.25rem 1.5rem", marginBottom: "2rem", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "#94a3b8", marginBottom: 4 }}>
              📎 Your Public Booking Page
            </div>
            <div style={{ fontFamily: "monospace", fontSize: 13, color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {publicLink}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={copyLink}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13, background: copied ? "#10b981" : "rgba(255,255,255,0.1)", color: "white", transition: "all 0.2s", whiteSpace: "nowrap" }}
            >
              {copied ? "✓ Copied!" : "Copy Link"}
            </button>
            <a
              href={publicLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13, background: "var(--primary)", color: "white", textDecoration: "none", whiteSpace: "nowrap" }}
            >
              Preview ↗
            </a>
          </div>
        </div>
      )}

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

      {/* GENERAL INTRO TAB */}
      {tab === "general" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="glass-panel" style={{ padding: "1.5rem" }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 12px" }}>Welcome Hero Section</h3>
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>This is the first screen clients see when opening the proposal or booking link.</p>
            
            <div style={{ display: "grid", gap: 16 }}>
              <div>
                <label style={labelCls}>Headline</label>
                <input style={inputCls} value={settings.welcomeHeroHeadline} onChange={e => setSettings(s => ({ ...s, welcomeHeroHeadline: e.target.value }))} />
              </div>
              <div>
                <label style={labelCls}>Subheadline</label>
                <textarea style={{ ...inputCls, resize: 'vertical' }} rows={3} value={settings.welcomeHeroSubheadline} onChange={e => setSettings(s => ({ ...s, welcomeHeroSubheadline: e.target.value }))} />
              </div>
              <div>
                <ImageDropzone 
                  label="Hero Cover Photo (Desktop / Landscape recommended)" 
                  value={settings.coverImage || ""} 
                  onChange={val => setSettings(s => ({ ...s, coverImage: val }))}
                  aspectRatio="auto"
                  maxDimension={2000}
                  quality={0.95}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STYLE TAB */}
      {tab === "style" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="glass-panel" style={{ padding: "1.5rem" }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 12px" }}>Signature Style Section</h3>
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>This section appears after the Hero to explain your photographic approach.</p>
            
            <div style={{ display: "grid", gap: 16 }}>
              <div>
                <label style={labelCls}>Heading</label>
                <input style={inputCls} value={settings.styleHeading} onChange={e => setSettings(s => ({ ...s, styleHeading: e.target.value }))} />
              </div>
              <div>
                <label style={labelCls}>Description</label>
                <textarea style={{ ...inputCls, resize: 'vertical' }} rows={4} value={settings.styleDescription} onChange={e => setSettings(s => ({ ...s, styleDescription: e.target.value }))} />
              </div>
              <div>
                <label style={labelCls}>Media Type</label>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="mediaType" 
                      value="image" 
                      checked={settings.styleMediaType !== 'video'} 
                      onChange={() => setSettings(s => ({ ...s, styleMediaType: 'image' }))} 
                    />
                    Signature Photo
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="mediaType" 
                      value="video" 
                      checked={settings.styleMediaType === 'video'} 
                      onChange={() => setSettings(s => ({ ...s, styleMediaType: 'video' }))} 
                    />
                    Featured Videos (2)
                  </label>
                </div>

                {settings.styleMediaType === 'video' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <label style={labelCls}>Video 1 URL (YouTube embed or .mp4)</label>
                      <input style={inputCls} placeholder="e.g. https://www.youtube.com/embed/..." value={settings.styleVideo1Url || ''} onChange={e => setSettings(s => ({ ...s, styleVideo1Url: e.target.value }))} />
                    </div>
                    <div>
                      <label style={labelCls}>Video 2 URL (YouTube embed or .mp4)</label>
                      <input style={inputCls} placeholder="e.g. https://www.youtube.com/embed/..." value={settings.styleVideo2Url || ''} onChange={e => setSettings(s => ({ ...s, styleVideo2Url: e.target.value }))} />
                    </div>
                  </div>
                ) : (
                  <div>
                    <ImageDropzone 
                      label="Style Photo" 
                      value={settings.stylePhotoUrl || ""} 
                      onChange={val => setSettings(s => ({ ...s, stylePhotoUrl: val }))}
                      aspectRatio="auto"
                      maxDimension={2000}
                      quality={0.95}
                    />
                    <div style={{ fontSize: 11, marginTop: 4, color: 'var(--muted)' }}>Recommended: portrait/vertical orientation</div>
                  </div>
                )}
              </div>
              <div>
                <label style={labelCls}>Style Bullets</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
                  {(settings.styleBullets || []).map((bullet: string, idx: number) => (
                    <div key={idx} style={{ display: 'flex', gap: 8 }}>
                      <input style={inputCls} value={bullet} onChange={e => {
                        const b = [...settings.styleBullets]; b[idx] = e.target.value; setSettings(s => ({ ...s, styleBullets: b }));
                      }} />
                      <button onClick={() => {
                        const b = [...settings.styleBullets]; b.splice(idx, 1); setSettings(s => ({ ...s, styleBullets: b }));
                      }} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 8, color: "#ef4444", cursor: "pointer", padding: "0 12px" }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                <button onClick={() => setSettings(s => ({ ...s, styleBullets: [...(s.styleBullets || []), 'New bullet point'] }))} style={{ background: "var(--background)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  + Add Bullet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INVESTMENT TAB */}
      {tab === "investment" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="glass-panel" style={{ padding: "1.5rem" }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 12px" }}>Investment Section</h3>
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>This text introduces your globally configured packages.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={labelCls}>Investment Headline</label>
                <input style={inputCls} value={settings.investmentHeadline || ''} onChange={e => setSettings(s => ({ ...s, investmentHeadline: e.target.value }))} placeholder="e.g. Transparent, all-inclusive pricing." />
              </div>
              <div>
                <label style={labelCls}>Investment Description</label>
                <textarea style={{ ...inputCls, resize: 'vertical' }} rows={3} value={settings.investmentDescription || ''} onChange={e => setSettings(s => ({ ...s, investmentDescription: e.target.value }))} placeholder="e.g. No hidden fees. Select the collection that best suits your vision." />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WHATS NEXT TAB */}
      {tab === "whatsnext" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="glass-panel" style={{ padding: "1.5rem" }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 12px" }}>What's Next Section</h3>
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>Configure the 3-step process shown at the end of the Welcome Guide.</p>
            
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={labelCls}>Section Heading</label>
                <input style={inputCls} value={settings.whatsNextHeading} onChange={e => setSettings(s => ({ ...s, whatsNextHeading: e.target.value }))} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelCls}>Section Subheading</label>
                <input style={inputCls} value={settings.whatsNextSub} onChange={e => setSettings(s => ({ ...s, whatsNextSub: e.target.value }))} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 16 }}>
              {(settings.whatsNextSteps || []).map((step: any, idx: number) => (
                <div key={idx} style={{ background: "var(--background)", border: "1px solid var(--border)", borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "var(--primary)", marginBottom: 12 }}>STEP {idx + 1}</div>
                  <div style={{ marginBottom: 12 }}>
                    <label style={labelCls}>Title</label>
                    <input style={inputCls} value={step.title} onChange={e => {
                      const ws = [...settings.whatsNextSteps]; ws[idx].title = e.target.value; setSettings(s => ({ ...s, whatsNextSteps: ws }));
                    }} />
                  </div>
                  <div>
                    <label style={labelCls}>Description</label>
                    <textarea style={{ ...inputCls, resize: 'vertical' }} rows={3} value={step.description} onChange={e => {
                      const ws = [...settings.whatsNextSteps]; ws[idx].description = e.target.value; setSettings(s => ({ ...s, whatsNextSteps: ws }));
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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

      {/* FORMS TAB */}
      {tab === "forms" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="glass-panel" style={{ padding: "1.5rem" }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 12px" }}>Forms Configuration</h3>
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>Select the default Questionnaire and Contract templates to be used in the wedding booking funnel.</p>
            
            <div style={{ display: "grid", gap: 16 }}>
              <div>
                <label style={labelCls}>Default Questionnaire Template (Step 2)</label>
                <select 
                  style={inputCls}
                  value={settings.questionnaireTemplateId || ""} 
                  onChange={e => setSettings(s => ({ ...s, questionnaireTemplateId: e.target.value ? parseInt(e.target.value) : null }))}
                >
                  <option value="">-- No Questionnaire Selected --</option>
                  {qTemplates.map(t => (
                    <option key={t.Template_ID} value={t.Template_ID}>{t.Name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelCls}>Default Contract Template (Step 3)</label>
                <select 
                  style={inputCls}
                  value={settings.contractTemplateId || ""} 
                  onChange={e => setSettings(s => ({ ...s, contractTemplateId: e.target.value ? parseInt(e.target.value) : null }))}
                >
                  <option value="">-- No Contract Selected --</option>
                  {cTemplates.map(t => (
                    <option key={t.Template_ID} value={t.Template_ID}>{t.Name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
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

      {/* EMAIL TAB */}
      {tab === "email" && (
        <div className="glass-panel" style={{ padding: "2rem" }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 24px" }}>Initial Proposal Email</h3>
          <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 24 }}>This email is sent automatically when you create a new public booking or send a proposal from the pipeline.</p>
          
          <div style={{ display: "grid", gap: 20 }}>
            <div>
              <label style={labelCls}>Email Subject Line</label>
              <input style={inputCls} value={emailSettings?.proposal?.subject || ""} onChange={e => updateEmail("subject", e.target.value)} placeholder="e.g. Your Booking Proposal is Ready" />
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>Use <code>[Name]</code> for client name, <code>[Company]</code> for your company name.</div>
            </div>

            <div>
              <label style={labelCls}>Greeting</label>
              <input style={inputCls} value={emailSettings?.proposal?.greeting || ""} onChange={e => updateEmail("greeting", e.target.value)} placeholder="e.g. Hello [Name]," />
            </div>

            <div>
              <label style={labelCls}>Email Body</label>
              <textarea
                value={emailSettings?.proposal?.body || ""}
                onChange={e => updateEmail("body", e.target.value)}
                rows={5}
                placeholder="We are excited to work with you!..."
                style={{ ...inputCls, resize: "vertical" }}
              />
            </div>
            
            <div style={{ padding: 16, background: "var(--muted-bg)", borderRadius: 8, fontSize: 13, color: "var(--muted)" }}>
              <Mail size={16} style={{ display: "inline", marginBottom: -3, marginRight: 6 }} />
              <strong>Note:</strong> To customize colors and branding, please visit the <a href="/dashboard/email-settings" style={{ color: "var(--primary)" }}>Email Settings</a> page.
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
