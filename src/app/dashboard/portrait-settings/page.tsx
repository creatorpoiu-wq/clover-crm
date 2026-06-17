"use client";
import { useState, useEffect } from "react";
import { Save, Type, CheckCircle, FileText, Settings, Image as ImageIcon, DollarSign, HelpCircle, Camera, Package, ArrowRight, CreditCard, Plus, Trash2, GripVertical } from "lucide-react";
import ImageDropzone from "@/components/ui/ImageDropzone";

const TABS = [
  { id: "general", label: "General Intro", icon: Settings },
  { id: "questions", label: "Custom Questions", icon: HelpCircle },
  { id: "sessions", label: "Session Types", icon: ImageIcon },
  { id: "style", label: "Signature Style", icon: Camera },
  { id: "packages", label: "Investment", icon: Package },
  { id: "whatsnext", label: "What's Next", icon: ArrowRight },
  { id: "payment", label: "Payment Methods", icon: CreditCard },
  { id: "steps",   label: "Funnel Step Text", icon: Type },
  { id: "contract", label: "Contract Template", icon: FileText },
  { id: "confirm", label: "Confirmation",  icon: CheckCircle },
];

const DEFAULT_SETTINGS = {
  heroHeadline: "Let's plan your perfect session.",
  heroSubheadline: "Fill out the details below to start the booking process.",
  welcomeHeroHeadline: 'Welcome to the Experience.',
  welcomeHeroSubheadline: 'Thank you for inquiring! This guide outlines our signature style, transparent pricing, and the simple three-step process to secure your session.',
  welcomeHeroPhotoUrl: '',
  aboutText: "",
  sessionTypes: ["Family Portrait", "Maternity", "Newborn", "Couples/Engagement", "Senior Portraits", "Headshots/Branding"],
  retainerAmount: 100,
  customQuestions: [] as any[],
  budgetRanges: ['Under $500', '$500 - $1,000', '$1,000 - $2,000', '$2,000+'] as string[],
  styleHeading: 'Candid. Timeless. Authentic.',
  styleDescription: 'We specialize in capturing raw, authentic moments rather than stiff poses. Our editing style relies on true-to-life colors with a subtle cinematic warmth, ensuring your portraits look beautiful decades from now.',
  styleBullets: ['Natural light prioritization', 'Guided, movement-based posing', 'True-to-color editing aesthetic', 'Focus on genuine emotion'],
  stylePhotoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1887&auto=format&fit=crop',
  packages: [
    { name: 'The Mini', price: 350, description: 'Perfect for quick updates or headshots.', features: ['30 Minute Session', '15 Edited Images', '1 Location'], featured: false },
    { name: 'The Classic', price: 650, description: 'The ideal balance for families and couples.', features: ['60 Minute Session', '50+ Edited Images', 'Up to 2 Outfits'], featured: true },
    { name: 'The Extended', price: 950, description: 'For editorial or multi-location shoots.', features: ['2 Hour Session', '100+ Edited Images', 'Multiple Locations'], featured: false },
  ],
  whatsNextHeading: 'What happens next?',
  whatsNextSub: 'Booking your session is a seamless, 3-step process.',
  whatsNextSteps: [
    { title: 'Pick Your Date', description: 'View my real-time calendar and select the exact date and time that works for you.' },
    { title: 'Sign Digitally', description: 'Review and sign your digital contract instantly to secure the legalities.' },
    { title: 'Pay Retainer', description: 'Submit your non-refundable retainer securely. Your date is officially locked in!' },
  ],
  paymentMethods: [] as string[],
  paymentInstructions: 'Please send your retainer using one of the methods below. Your booking is not finalized until the retainer is received.',
  venmoHandle: '',
  paypalLink: '',
  zelleContact: '',
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
  const [tab, setTab] = useState("general");
  const [settings, setSettings] = useState<typeof DEFAULT_SETTINGS & { userId?: string }>(DEFAULT_SETTINGS);
  const [cTemplates, setCTemplates] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [copied, setCopied] = useState(false);
  const [customDomain, setCustomDomain] = useState("");

  // Input states for list additions
  const [newSessionType, setNewSessionType] = useState("");
  const [newStyleBullet, setNewStyleBullet] = useState("");
  const [newPaymentMethod, setNewPaymentMethod] = useState("");
  const [newPackageFeature, setNewPackageFeature] = useState("");

  const baseOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://clover-crm.vercel.app';
  const baseUrl = customDomain ? `https://${customDomain}` : baseOrigin;
  const publicLink = settings.userId ? (customDomain ? `${baseUrl}/portrait` : `${baseUrl}/portrait?userId=${settings.userId}`) : null;

  const copyLink = () => {
    if (!publicLink) return;
    navigator.clipboard.writeText(publicLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  useEffect(() => {
    fetch("/api/portrait-settings")
      .then(r => r.json())
      .then(d => { if (d.success) setSettings({ ...DEFAULT_SETTINGS, ...d.settings }); });
      
    fetch("/api/contract-templates")
      .then(r => r.json())
      .then(d => { if (d.success) setCTemplates(d.templates); });
      
    fetch("/api/settings")
      .then(r => r.json())
      .then(d => { if (d.success && d.config?.customDomain) setCustomDomain(d.config.customDomain); });
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

  const inputCls = { width: "100%", padding: "10px 14px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 14, outline: "none", background: "var(--background)", color: "var(--foreground)", boxSizing: "border-box" as const };
  const labelCls = { display: "block", fontSize: 12, fontWeight: 700 as const, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 6 };

  // Helper arrays
  const PAYMENT_OPTIONS = ['Venmo', 'PayPal', 'Zelle', 'Cash App', 'Credit Card (Stripe)', 'Bank Transfer', 'Cash'];

  return (
    <div className="animate-fade-in" style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto", paddingBottom: "100px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "1.5rem" }}>
        <div>
          <h1 className="page-title" style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 900, marginBottom: "0.5rem" }}>Portrait Funnel Settings</h1>
          <p className="page-subtitle" style={{ color: "var(--muted)" }}>Customize the design, steps, and flow for your public Portrait Booking Page.</p>
        </div>
        <button onClick={save} disabled={saving} className="btn btn-primary" style={{ width: "auto", display: "flex", alignItems: "center", gap: 8, padding: "12px 24px", borderRadius: "8px", fontWeight: 700, backgroundColor: "var(--primary)", color: "#fff", border: "none", cursor: "pointer" }}>
          <Save size={16} /> {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Public Link Banner */}
      {publicLink && (
        <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", borderRadius: 12, padding: "1.25rem 1.5rem", marginBottom: "2rem", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "#94a3b8", marginBottom: 4 }}>
              📎 Your Public Portrait Booking Page
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
      <div style={{ display: "flex", flexWrap: 'wrap', gap: 4, marginBottom: "2rem", borderBottom: "2px solid var(--border)", paddingBottom: 0 }}>
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: "10px 16px", border: "none", background: "transparent", cursor: "pointer",
              fontSize: 13, fontWeight: 700,
              color: tab === t.id ? "var(--primary)" : "var(--muted)",
              borderBottom: tab === t.id ? "2px solid var(--primary)" : "2px solid transparent",
              marginBottom: -2, display: "flex", alignItems: "center", gap: 6,
            }}>
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      <div className="glass-panel" style={{ padding: "2rem", background: "var(--card)", borderRadius: "12px", border: "1px solid var(--border)" }}>
        
        {/* GENERAL TAB */}
        {tab === "general" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 4px" }}>Welcome Page Hero</h3>
              <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 0 }}>The full-screen section at the top of your client's Welcome Guide page.</p>
            </div>

              <ImageDropzone 
                label="Hero Background Photo" 
                value={settings.welcomeHeroPhotoUrl} 
                onChange={val => setSettings(s => ({ ...s, welcomeHeroPhotoUrl: val }))}
                aspectRatio="video"
              />
              <p style={{ fontSize: 12, color: 'var(--muted)', margin: '8px 0 0 0' }}>If no photo is uploaded, a dark gradient will be displayed instead.</p>

            <div>
              <label style={labelCls}>Hero Headline</label>
              <input style={inputCls} value={settings.welcomeHeroHeadline} onChange={e => setSettings(s => ({ ...s, welcomeHeroHeadline: e.target.value }))} placeholder="e.g. Welcome to the Experience." />
            </div>
            <div>
              <label style={labelCls}>Hero Subheadline</label>
              <textarea style={{ ...inputCls, resize: 'vertical' }} rows={3} value={settings.welcomeHeroSubheadline} onChange={e => setSettings(s => ({ ...s, welcomeHeroSubheadline: e.target.value }))} />
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 4px" }}>Inquiry Form Text</h3>
              <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>Text shown above the initial inquiry form clients fill out.</p>
            </div>
            <div>
              <label style={labelCls}>Inquiry Headline</label>
              <input style={inputCls} value={settings.heroHeadline} onChange={e => setSettings(s => ({ ...s, heroHeadline: e.target.value }))} placeholder="e.g. Let's plan your perfect session." />
            </div>
            <div>
              <label style={labelCls}>Inquiry Subheadline</label>
              <input style={inputCls} value={settings.heroSubheadline} onChange={e => setSettings(s => ({ ...s, heroSubheadline: e.target.value }))} />
            </div>
            <div>
              <label style={labelCls}>About Text (Optional)</label>
              <textarea style={{ ...inputCls, resize: "vertical" }} rows={4} value={settings.aboutText} onChange={e => setSettings(s => ({ ...s, aboutText: e.target.value }))} />
            </div>
          </div>
        )}

        {/* CUSTOM QUESTIONS TAB */}
        {tab === "questions" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 4px" }}>Custom Inquiry Questions</h3>
                <p style={{ fontSize: 13, color: "var(--muted)" }}>Add custom questions to your initial inquiry form.</p>
              </div>
              <button 
                onClick={() => setSettings(s => ({ ...s, customQuestions: [...s.customQuestions, { label: 'New Question', type: 'text', options: [], required: false }] }))}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: "var(--primary)", color: "white", padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13 }}
              >
                <Plus size={14} /> Add Question
              </button>
            </div>
            
            {settings.customQuestions.map((q, idx) => (
              <div key={idx} style={{ background: "var(--background)", border: "1px solid var(--border)", borderRadius: 8, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelCls}>Question Label</label>
                    <input style={inputCls} value={q.label} onChange={e => {
                      const qs = [...settings.customQuestions]; qs[idx].label = e.target.value; setSettings(s => ({ ...s, customQuestions: qs }));
                    }} />
                  </div>
                  <div style={{ width: 150 }}>
                    <label style={labelCls}>Answer Type</label>
                    <select style={inputCls} value={q.type} onChange={e => {
                      const qs = [...settings.customQuestions]; qs[idx].type = e.target.value; setSettings(s => ({ ...s, customQuestions: qs }));
                    }}>
                      <option value="text">Short Text</option>
                      <option value="textarea">Long Text</option>
                      <option value="select">Dropdown</option>
                    </select>
                  </div>
                  <div style={{ width: 100, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: 24 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                      <input type="checkbox" checked={q.required} onChange={e => {
                        const qs = [...settings.customQuestions]; qs[idx].required = e.target.checked; setSettings(s => ({ ...s, customQuestions: qs }));
                      }} />
                      Required
                    </label>
                  </div>
                  <div style={{ paddingTop: 24 }}>
                    <button onClick={() => {
                      const qs = [...settings.customQuestions]; qs.splice(idx, 1); setSettings(s => ({ ...s, customQuestions: qs }));
                    }} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: 8 }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {q.type === 'select' && (
                  <div>
                    <label style={labelCls}>Dropdown Options (comma separated)</label>
                    <input 
                      style={inputCls} 
                      value={q.options?.join(', ') || ''} 
                      onChange={e => {
                        const qs = [...settings.customQuestions]; 
                        qs[idx].options = e.target.value.split(',').map(o => o.trim()).filter(Boolean); 
                        setSettings(s => ({ ...s, customQuestions: qs }));
                      }} 
                      placeholder="e.g. Yes, No, Maybe"
                    />
                  </div>
                )}
              </div>
            ))}
            {settings.customQuestions.length === 0 && (
              <div style={{ padding: 32, textAlign: 'center', background: 'var(--background)', borderRadius: 8, border: '1px dashed var(--border)', color: 'var(--muted)' }}>
                No custom questions added yet.
              </div>
            )}
          </div>
        )}

        {/* SESSIONS TAB */}
        {tab === "sessions" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 12px" }}>Session Types</h3>
              <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>Available session types for the client to choose from on the inquiry form.</p>
              
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
                {settings.sessionTypes.map(type => (
                  <div key={type} style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "var(--primary)", color: "white", padding: "6px 12px", borderRadius: "9999px", fontSize: 13, fontWeight: 600 }}>
                    {type}
                    <button onClick={() => setSettings(s => ({ ...s, sessionTypes: s.sessionTypes.filter(t => t !== type) }))} style={{ background: "none", border: "none", color: "white", cursor: "pointer", display: "flex", alignItems: "center", padding: 0, opacity: 0.7 }}>&times;</button>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input style={inputCls} value={newSessionType} onChange={e => setNewSessionType(e.target.value)} onKeyDown={(e) => {
                  if (e.key === 'Enter' && newSessionType.trim() && !settings.sessionTypes.includes(newSessionType.trim())) {
                    setSettings(s => ({ ...s, sessionTypes: [...s.sessionTypes, newSessionType.trim()] }));
                    setNewSessionType("");
                  }
                }} placeholder="Type a new session and press Enter" />
              </div>
            </div>

            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "2rem" }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 12px" }}>Budget Ranges</h3>
              <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>The dropdown options shown in the "Budget Range" question on the inquiry form.</p>
              
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
                {settings.budgetRanges.map((range, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "var(--background)", border: "1px solid var(--border)", padding: "6px 12px", borderRadius: "9999px", fontSize: 13, fontWeight: 600 }}>
                    {range}
                    <button onClick={() => setSettings(s => ({ ...s, budgetRanges: s.budgetRanges.filter(r => r !== range) }))} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", display: "flex", alignItems: "center", padding: 0, marginLeft: 2 }}>&times;</button>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  style={inputCls}
                  placeholder="e.g. $3,000 - $5,000 (press Enter to add)"
                  id="newBudgetRangeInput"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const val = (e.target as HTMLInputElement).value.trim();
                      if (val && !settings.budgetRanges.includes(val)) {
                        setSettings(s => ({ ...s, budgetRanges: [...s.budgetRanges, val] }));
                        (e.target as HTMLInputElement).value = '';
                      }
                    }
                  }}
                />
                <button
                  onClick={() => {
                    const input = document.getElementById('newBudgetRangeInput') as HTMLInputElement;
                    const val = input?.value.trim();
                    if (val && !settings.budgetRanges.includes(val)) {
                      setSettings(s => ({ ...s, budgetRanges: [...s.budgetRanges, val] }));
                      if (input) input.value = '';
                    }
                  }}
                  style={{ background: "var(--primary)", color: "white", border: "none", borderRadius: 8, padding: "0 1.5rem", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}
                >
                  Add
                </button>
              </div>
            </div>

            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "2rem" }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 12px" }}>Retainer Settings</h3>
              <div style={{ width: 200 }}>
                <label style={labelCls}>Retainer Amount ($)</label>
                <div style={{ position: "relative" }}>
                  <DollarSign size={16} style={{ position: "absolute", left: 14, top: 12, color: "var(--muted)" }} />
                  <input type="number" style={{ ...inputCls, paddingLeft: 36 }} value={settings.retainerAmount} onChange={e => setSettings(s => ({ ...s, retainerAmount: parseFloat(e.target.value) || 0 }))} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STYLE TAB */}
        {tab === "style" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 12px" }}>Signature Style Section</h3>
              <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>This section appears on the Welcome Guide to explain your photographic approach.</p>
            </div>
            <div>
              <label style={labelCls}>Heading</label>
              <input style={inputCls} value={settings.styleHeading} onChange={e => setSettings(s => ({ ...s, styleHeading: e.target.value }))} />
            </div>
            <div>
              <label style={labelCls}>Description</label>
              <textarea style={{ ...inputCls, resize: 'vertical' }} rows={4} value={settings.styleDescription} onChange={e => setSettings(s => ({ ...s, styleDescription: e.target.value }))} />
            </div>
            <div>
              <ImageDropzone 
                label="Style Photo" 
                value={settings.stylePhotoUrl} 
                onChange={val => setSettings(s => ({ ...s, stylePhotoUrl: val }))}
                aspectRatio="auto"
                maxDimension={800}
              />
              <div style={{ fontSize: 11, marginTop: 4, color: 'var(--muted)' }}>Recommended: portrait/vertical orientation</div>
            </div>
            <div>
              <label style={labelCls}>Style Bullets</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
                {settings.styleBullets.map((bullet, idx) => (
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
              <button onClick={() => setSettings(s => ({ ...s, styleBullets: [...s.styleBullets, 'New bullet point'] }))} style={{ background: "var(--background)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                + Add Bullet
              </button>
            </div>
          </div>
        )}

        {/* PACKAGES TAB */}
        {tab === "packages" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 4px" }}>Investment Packages</h3>
                <p style={{ fontSize: 13, color: "var(--muted)" }}>Configure the pricing packages shown on the Welcome Guide.</p>
              </div>
              <button 
                onClick={() => setSettings(s => ({ ...s, packages: [...s.packages, { name: 'New Package', price: 500, description: '...', features: [], featured: false }] }))}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: "var(--primary)", color: "white", padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13 }}
              >
                <Plus size={14} /> Add Package
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {settings.packages.map((pkg, idx) => (
                <div key={idx} style={{ background: "var(--background)", border: pkg.featured ? "2px solid var(--primary)" : "1px solid var(--border)", borderRadius: 12, padding: 20, position: 'relative' }}>
                  <button onClick={() => {
                    const p = [...settings.packages]; p.splice(idx, 1); setSettings(s => ({ ...s, packages: p }));
                  }} style={{ position: 'absolute', top: 16, right: 16, background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: 4 }}>
                    <Trash2 size={16} />
                  </button>
                  
                  <div style={{ marginBottom: 12 }}>
                    <label style={labelCls}>Package Name</label>
                    <input style={inputCls} value={pkg.name} onChange={e => {
                      const p = [...settings.packages]; p[idx].name = e.target.value; setSettings(s => ({ ...s, packages: p }));
                    }} />
                  </div>
                  
                  <div style={{ marginBottom: 12, display: 'flex', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <label style={labelCls}>Price</label>
                      <input type="number" style={inputCls} value={pkg.price} onChange={e => {
                        const p = [...settings.packages]; p[idx].price = parseFloat(e.target.value) || 0; setSettings(s => ({ ...s, packages: p }));
                      }} />
                    </div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', paddingBottom: 10 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                        <input type="checkbox" checked={pkg.featured} onChange={e => {
                          const p = [...settings.packages]; p[idx].featured = e.target.checked; setSettings(s => ({ ...s, packages: p }));
                        }} />
                        Featured / Popular
                      </label>
                    </div>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <label style={labelCls}>Description</label>
                    <textarea style={{ ...inputCls, resize: 'vertical' }} rows={2} value={pkg.description} onChange={e => {
                      const p = [...settings.packages]; p[idx].description = e.target.value; setSettings(s => ({ ...s, packages: p }));
                    }} />
                  </div>

                  <div>
                    <label style={labelCls}>Features (comma separated)</label>
                    <input 
                      style={inputCls} 
                      value={pkg.features.join(', ')} 
                      onChange={e => {
                        const p = [...settings.packages]; 
                        p[idx].features = e.target.value.split(',').map(f => f.trim()).filter(Boolean); 
                        setSettings(s => ({ ...s, packages: p }));
                      }} 
                      placeholder="e.g. 1 Hour, 50 Images, Online Gallery"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* WHATS NEXT TAB */}
        {tab === "whatsnext" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 12px" }}>What's Next Section</h3>
              <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>Configure the 3-step process shown at the end of the Welcome Guide.</p>
            </div>
            
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
              {settings.whatsNextSteps.map((step, idx) => (
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
        )}

        {/* PAYMENT TAB */}
        {tab === "payment" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 12px" }}>Accepted Payment Methods</h3>
              <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>Select which payment methods you accept for the retainer.</p>
              
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {PAYMENT_OPTIONS.map(opt => {
                  const active = settings.paymentMethods.includes(opt);
                  return (
                    <button 
                      key={opt}
                      onClick={() => {
                        const methods = active ? settings.paymentMethods.filter(m => m !== opt) : [...settings.paymentMethods, opt];
                        setSettings(s => ({ ...s, paymentMethods: methods }));
                      }}
                      style={{ 
                        padding: "8px 16px", borderRadius: "9999px", fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none",
                        background: active ? "var(--primary)" : "var(--background)", color: active ? "white" : "var(--foreground)",
                        boxShadow: active ? "0 4px 14px 0 rgba(0,0,0,0.1)" : "inset 0 0 0 1px var(--border)",
                      }}
                    >
                      {opt} {active && '✓'}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "2rem" }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 12px" }}>Payment Details</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={labelCls}>Payment Instructions (Shown to client)</label>
                  <textarea style={{ ...inputCls, resize: 'vertical' }} rows={3} value={settings.paymentInstructions} onChange={e => setSettings(s => ({ ...s, paymentInstructions: e.target.value }))} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={labelCls}>Venmo Handle</label>
                    <input style={inputCls} value={settings.venmoHandle} onChange={e => setSettings(s => ({ ...s, venmoHandle: e.target.value }))} placeholder="@username" />
                  </div>
                  <div>
                    <label style={labelCls}>PayPal.me Link</label>
                    <input style={inputCls} value={settings.paypalLink} onChange={e => setSettings(s => ({ ...s, paypalLink: e.target.value }))} placeholder="paypal.me/..." />
                  </div>
                  <div>
                    <label style={labelCls}>Zelle Phone/Email</label>
                    <input style={inputCls} value={settings.zelleContact} onChange={e => setSettings(s => ({ ...s, zelleContact: e.target.value }))} placeholder="email or phone" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FUNNEL STEPS TAB */}
        {tab === "steps" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 12px" }}>Booking Funnel Steps</h3>
              <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>These are the headings shown in the actual booking widget (Calendar, Contract, Payment).</p>
            </div>
            {settings.steps.map((step, i) => (
              <div key={i} style={{ padding: "1.5rem", background: "var(--background)", borderRadius: "12px", border: "1px solid var(--border)" }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: "var(--primary)", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {["Step 1 — Calendar", "Step 2 — Contract", "Step 3 — Payment"][i]}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 16 }}>
                  <div>
                    <label style={labelCls}>Heading</label>
                    <input style={inputCls} value={step.title} onChange={e => {
                      const s = [...settings.steps]; s[i].title = e.target.value; setSettings(prev => ({ ...prev, steps: s }));
                    }} />
                  </div>
                  <div>
                    <label style={labelCls}>Subheading</label>
                    <input style={inputCls} value={step.subtitle} onChange={e => {
                       const s = [...settings.steps]; s[i].subtitle = e.target.value; setSettings(prev => ({ ...prev, steps: s }));
                    }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CONTRACT TAB */}
        {tab === "contract" && (
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 12px" }}>Contract Template</h3>
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
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 12px" }}>Booking Confirmation Screen</h3>
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
      </div>

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
