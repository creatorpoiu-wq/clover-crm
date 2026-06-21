"use client";

import { useEffect, useState, Suspense } from "react";
import { Settings as SettingsIcon, Mail, Link as LinkIcon, CheckCircle2, RefreshCw, Eye, EyeOff, Send, ShieldCheck } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import ImageDropzone from "@/components/ui/ImageDropzone";

function SettingsInner() {
  const [companyName, setCompanyName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [phone, setPhone] = useState("");
  const [timeZone, setTimeZone] = useState("(GMT-05:00) America, Jamaica");
  const [dateFormat, setDateFormat] = useState("dd/mm/yyyy");
  const [businessSlug, setBusinessSlug] = useState("");

  const [hasToken, setHasToken] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const tabs = ["General", "Security", "Integrations", "Domains"];
  const [customDomain, setCustomDomain] = useState("");
  const [domainStatus, setDomainStatus] = useState<any>(null);
  const [savingDomain, setSavingDomain] = useState(false);
  const [checkingDomain, setCheckingDomain] = useState(false);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [domainAvailable, setDomainAvailable] = useState<boolean | null>(null);
  const [message, setMessage] = useState<{type: "success" | "error", text: string} | null>(null);

  // Account Security state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [updatingAccount, setUpdatingAccount] = useState(false);
  const [accountMsg, setAccountMsg] = useState<{type: "success" | "error", text: string} | null>(null);

  // Email config state
  const [emailUser, setEmailUser] = useState("");
  const [emailPass, setEmailPass] = useState("");
  const [hasEmailPass, setHasEmailPass] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [emailMsg, setEmailMsg] = useState<{type: "success" | "error", text: string} | null>(null);

  // Business branding state
  const [businessLogo, setBusinessLogo] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [brandColor, setBrandColor] = useState("#0f172a");

  // Twilio state
  const [twilioSid, setTwilioSid] = useState("");
  const [twilioAuthToken, setTwilioAuthToken] = useState("");
  const [twilioPhone, setTwilioPhone] = useState("");
  const [testingSms, setTestingSms] = useState(false);

  // Payment Gateways
  const [paypalClientId, setPaypalClientId] = useState("");

  // Reset CRM state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("success") === "connected") {
      setMessage({ type: "success", text: "Successfully connected to Gmail!" });
    } else if (searchParams.get("error")) {
      setMessage({ type: "error", text: `Gmail Connection Error: ${searchParams.get("error")}` });
    }

    fetch("/api/settings")
      .then(res => res.json())
      .then(data => {
        if (data.success && data.config) {
          setCompanyName(data.config.companyName || "");
          setFirstName(data.config.firstName || "");
          setLastName(data.config.lastName || "");
          setContactEmail(data.config.contactEmail || "");
          setWebsite(data.config.website || "");
          setPhone(data.config.phone || "");
          if (data.config.timeZone) setTimeZone(data.config.timeZone);
          if (data.config.dateFormat) setDateFormat(data.config.dateFormat);
          
          setHasToken(data.config.hasRefreshToken || false);
          setEmailUser(data.config.emailUser || "");
          setHasEmailPass(data.config.hasEmailPass || false);
          setBusinessLogo(data.config.businessLogo || "");
          setBusinessAddress(data.config.businessAddress || "");
          setBrandColor(data.config.brandColor || "#0f172a");
          setTwilioSid(data.config.twilioSid || "");
          setTwilioAuthToken(data.config.twilioAuthToken || "");
          setTwilioPhone(data.config.twilioPhone || "");
          setBusinessSlug(data.config.businessSlug || "");
          setPaypalClientId(data.config.paypalClientId || "");
          if (data.config.customDomain) {
            setCustomDomain(data.config.customDomain);
            handleCheckDomain(data.config.customDomain);
          }
        }
      })
      .finally(() => setLoading(false));

    // Fetch user's current login email
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }: any) => {
      if (user?.email) setLoginEmail(user.email);
    });
  }, [searchParams]);

  useEffect(() => {
    if (!customDomain || !customDomain.includes('.')) {
      setDomainAvailable(null);
      return;
    }
    const timer = setTimeout(async () => {
      setIsCheckingAvailability(true);
      try {
        const res = await fetch(`/api/settings/domain/check?domain=${customDomain}`);
        if (res.ok) {
          const data = await res.json();
          setDomainAvailable(data.available);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsCheckingAvailability(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [customDomain]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName, firstName, lastName, contactEmail, website, phone, timeZone, dateFormat,
          emailUser,
          emailPass,
          businessLogo,
          businessAddress,
          brandColor,
          twilioSid,
          twilioAuthToken,
          twilioPhone,
          businessSlug,
          paypalClientId
        })
      });
      if (res.ok) setMessage({ type: "success", text: "Settings saved successfully!" });
      else setMessage({ type: "error", text: "Failed to save settings." });
    } catch {
      setMessage({ type: "error", text: "An error occurred." });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingAccount(true);
    setAccountMsg(null);
    const supabase = createClient();
    
    const updates: any = {};
    if (loginEmail) updates.email = loginEmail;
    if (loginPassword) updates.password = loginPassword;
    
    if (Object.keys(updates).length === 0) {
      setUpdatingAccount(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser(updates);
      if (error) {
        setAccountMsg({ type: "error", text: error.message });
      } else {
        setAccountMsg({ type: "success", text: "Account credentials updated successfully. You may need to verify your new email." });
        setLoginPassword("");
      }
    } catch (err: any) {
      setAccountMsg({ type: "error", text: "An error occurred updating account." });
    } finally {
      setUpdatingAccount(false);
    }
  };

  const handleSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailUser) { setEmailMsg({ type: "error", text: "Email address is required." }); return; }
    setSavingEmail(true);
    setEmailMsg(null);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailUser, emailPass: emailPass || undefined })
      });
      const data = await res.json();
      if (data.success) {
        setEmailMsg({ type: "success", text: "Email configuration saved!" });
        if (emailPass) setHasEmailPass(true);
        setEmailPass("");
      } else {
        setEmailMsg({ type: "error", text: data.error || "Failed to save." });
      }
    } catch {
      setEmailMsg({ type: "error", text: "An error occurred." });
    } finally {
      setSavingEmail(false);
    }
  };

  const handleTestEmail = async () => {
    if (!emailUser) { setEmailMsg({ type: "error", text: "Save your email configuration first." }); return; }
    setTestingEmail(true);
    setEmailMsg(null);
    try {
      const res = await fetch("/api/contract-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send_contract",
          title: "CRM Configuration Test Email",
          content: "<p>This is a test email to verify your email configuration is working correctly.</p>",
          signers: [{ name: "Test Recipient", email: emailUser, isOwner: false }],
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEmailMsg({ type: "success", text: `✓ Test email sent to ${emailUser}. Check your inbox!` });
      } else {
        setEmailMsg({ type: "error", text: data.error || "Failed to send test email." });
      }
    } catch {
      setEmailMsg({ type: "error", text: "An error occurred during test." });
    } finally {
      setTestingEmail(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setMessage(null);
    try {
      const res = await fetch("/api/gmail/sync", { method: "POST" });
      const data = await res.json();
      if (data.success) setMessage({ type: "success", text: `Successfully synced ${data.count} new emails!` });
      else setMessage({ type: "error", text: data.error || "Failed to sync emails." });
    } catch {
      setMessage({ type: "error", text: "An error occurred during sync." });
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    if (!confirm("Are you sure you want to disconnect your Google account?")) return;
    try {
      const res = await fetch("/api/gmail/auth", { method: "DELETE" });
      if (res.ok) {
        setHasToken(false);
        setMessage({ type: "success", text: "Google account disconnected successfully." });
      } else {
        setMessage({ type: "error", text: "Failed to disconnect account." });
      }
    } catch {
      setMessage({ type: "error", text: "An error occurred while disconnecting." });
    }
  };

  const handleTestSms = async () => {
    if (!twilioSid || !twilioAuthToken || !twilioPhone) {
      setMessage({ type: "error", text: "Please save your Twilio configuration first." });
      return;
    }
    setTestingSms(true);
    setMessage(null);
    try {
      const res = await fetch("/api/process-reminders?test=sms", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: "Test SMS sent successfully!" });
      } else {
        setMessage({ type: "error", text: data.error || "Failed to send test SMS." });
      }
    } catch {
      setMessage({ type: "error", text: "An error occurred during SMS test." });
    } finally {
      setTestingSms(false);
    }
  };

  const handleCheckDomain = async (domainToCheck: string) => {
    setCheckingDomain(true);
    try {
      const res = await fetch(`/api/settings/domain?domain=${domainToCheck}`);
      const data = await res.json();
      if (data.success) {
        setDomainStatus(data.status);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCheckingDomain(false);
    }
  };

  const handleSaveDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDomain || !customDomain.includes('.')) {
      setMessage({ type: "error", text: "Please enter a valid domain name." });
      return;
    }
    setSavingDomain(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings/domain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: customDomain.toLowerCase().trim() })
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: "Domain added successfully! Please configure your DNS settings." });
        handleCheckDomain(customDomain);
      } else {
        setMessage({ type: "error", text: data.error || "Failed to add domain." });
      }
    } catch {
      setMessage({ type: "error", text: "An error occurred." });
    } finally {
      setSavingDomain(false);
    }
  };

  const handleRemoveDomain = async () => {
    if (!confirm("Are you sure you want to remove this domain? Your clients will no longer be able to access the portal via this domain.")) return;
    setSavingDomain(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings/domain", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: customDomain })
      });
      if (res.ok) {
        setCustomDomain("");
        setDomainStatus(null);
        setMessage({ type: "success", text: "Domain removed successfully." });
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Failed to remove domain." });
      }
    } catch {
      setMessage({ type: "error", text: "An error occurred." });
    } finally {
      setSavingDomain(false);
    }
  };

  const handleResetCrm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetConfirmText !== "RESET") {
      setAccountMsg({ type: "error", text: "You must type exactly 'RESET' to confirm." });
      return;
    }
    if (!confirm("Are you absolutely sure? This action is permanent and will wipe all CRM data.")) {
      return;
    }

    setIsResetting(true);
    try {
      const res = await fetch("/api/settings/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmText: resetConfirmText })
      });
      const data = await res.json();
      
      if (data.success) {
        setAccountMsg({ type: "success", text: data.message });
        setShowResetModal(false);
        setResetConfirmText("");
        // Optionally trigger a page reload to clear cached client state
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setAccountMsg({ type: "error", text: data.error || "Failed to reset CRM." });
      }
    } catch (error) {
      setAccountMsg({ type: "error", text: "An error occurred during reset." });
    } finally {
      setIsResetting(false);
    }
  };

  if (loading) return <div className="empty-state">Loading settings...</div>;

  const inputStyle = { textAlign: "left" as const, letterSpacing: "normal", fontSize: "0.875rem", width: "100%", padding: "10px 14px", border: "1px solid var(--border)", borderRadius: 8, background: "var(--background)" };
  const labelStyle = { display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.875rem", color: "var(--foreground)" };

  return (
    <div className="animate-fade-in">
      <h1 className="page-title">Settings & Integrations</h1>
      <p className="page-subtitle">Configure your CRM, email sending, and external integrations.</p>

      {message && (
        <div style={{ marginBottom: "2rem", padding: "1rem", borderRadius: "0.5rem", fontWeight: 600,
          backgroundColor: message.type === "success" ? "var(--status-green)" : "var(--status-red)",
          color: message.type === "success" ? "var(--status-green-fg)" : "var(--status-red-fg)" }}>
          {message.text}
        </div>
      )}

      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '2rem', gap: '2rem' }}>
        {tabs.map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab.toLowerCase())}
            style={{ 
              background: 'none', border: 'none', padding: '0.5rem 0', cursor: 'pointer', 
              fontSize: '0.875rem', fontWeight: 600, 
              color: activeTab === tab.toLowerCase() ? 'var(--foreground)' : 'var(--muted)',
              borderBottom: activeTab === tab.toLowerCase() ? '2px solid var(--primary)' : '2px solid transparent',
              transition: 'all 0.2s'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Business Profile Settings */}
        {activeTab === 'general' && (
        <div className="glass-panel" style={{ padding: "2rem" }}>
          <div className="flex items-center gap-2 section-header" style={{ marginBottom: "0.5rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Business Profile</h2>
          </div>
          <p style={{ fontSize: "0.875rem", color: "var(--muted)", marginBottom: "2rem", lineHeight: 1.5 }}>
            Your business profile information will be visible in various places such as invoices, receipts, payment statements and more. This information is shared across all your <span style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}>Clover</span> applications.
          </p>
          <form onSubmit={handleSave} style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: "1.25rem", alignItems: "center" }}>
            
            <div style={{ color: "var(--muted)", fontSize: "0.875rem", fontWeight: 500 }}>Business name</div>
            <input type="text" style={inputStyle} value={companyName} onChange={e => setCompanyName(e.target.value)} />
            
            <div style={{ color: "var(--muted)", fontSize: "0.875rem", fontWeight: 500 }}>
              Business Slug
              <div style={{ fontSize: "0.75rem", fontWeight: 400, marginTop: "0.25rem" }}>Used in booking links. e.g. /book/<strong>your-slug</strong>/...</div>
            </div>
            <input 
              type="text" 
              style={inputStyle} 
              value={businessSlug} 
              onChange={e => setBusinessSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} 
              placeholder="e.g. acme-corp"
            />
            
            <div style={{ color: "var(--muted)", fontSize: "0.875rem", fontWeight: 500 }}>First name</div>
            <input type="text" style={inputStyle} value={firstName} onChange={e => setFirstName(e.target.value)} />
            
            <div style={{ color: "var(--muted)", fontSize: "0.875rem", fontWeight: 500 }}>Last name</div>
            <input type="text" style={inputStyle} value={lastName} onChange={e => setLastName(e.target.value)} />
            
            <div style={{ color: "var(--muted)", fontSize: "0.875rem", fontWeight: 500 }}>Email</div>
            <input type="email" style={inputStyle} value={contactEmail} onChange={e => setContactEmail(e.target.value)} />
            
            <div style={{ color: "var(--muted)", fontSize: "0.875rem", fontWeight: 500 }}>Website</div>
            <input type="url" style={inputStyle} value={website} onChange={e => setWebsite(e.target.value)} />
            
            <div style={{ color: "var(--muted)", fontSize: "0.875rem", fontWeight: 500 }}>Phone</div>
            <input type="tel" style={inputStyle} value={phone} onChange={e => setPhone(e.target.value)} />
            
            <div style={{ color: "var(--muted)", fontSize: "0.875rem", fontWeight: 500 }}>Address</div>
            <input type="text" style={inputStyle} value={businessAddress} onChange={e => setBusinessAddress(e.target.value)} />
            
            <div style={{ color: "var(--muted)", fontSize: "0.875rem", fontWeight: 500 }}>Time zone</div>
            <input type="text" style={inputStyle} value={timeZone} onChange={e => setTimeZone(e.target.value)} />
            
            <div style={{ color: "var(--muted)", fontSize: "0.875rem", fontWeight: 500 }}>Date format</div>
            <input type="text" style={inputStyle} value={dateFormat} onChange={e => setDateFormat(e.target.value)} />
            
            <div style={{ gridColumn: "1 / -1", borderTop: "1px solid var(--border)", margin: "1rem 0", paddingTop: "1rem" }}>
              <ImageDropzone 
                label="Business Logo" 
                value={businessLogo} 
                onChange={setBusinessLogo} 
                aspectRatio="auto"
                thumbnailMode={true}
              />
            </div>

            <div style={{ gridColumn: "1 / -1", borderTop: "1px solid var(--border)", margin: "1rem 0", paddingTop: "1rem" }}>
              <label style={labelStyle}>Brand Color (Hex)</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input type="color" value={brandColor} onChange={e => setBrandColor(e.target.value)} style={{ width: '40px', height: '40px', padding: 0, border: 'none', borderRadius: '4px', cursor: 'pointer' }} />
                <input type="text" style={inputStyle} value={brandColor} onChange={e => setBrandColor(e.target.value)} placeholder="#0f172a" />
              </div>
              <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>This color syncs directly to the Client Portal theme.</p>
            </div>


            <div style={{ gridColumn: "1 / -1", marginTop: "1rem" }}>
              <button type="submit" className="btn btn-primary" disabled={saving} style={{ width: "auto" }}>
                {saving ? "Saving..." : "Save Business Profile"}
              </button>
            </div>
          </form>
        </div>
        )}

        {/* Account Security */}
        {activeTab === 'security' && (
        <div className="glass-panel" style={{ padding: "2rem" }}>
          <div className="flex items-center gap-2 section-header">
            <ShieldCheck size={20} className="text-[var(--primary)]" />
            <h2>Account Security</h2>
          </div>
          <p style={{ fontSize: "0.875rem", color: "var(--muted)", marginBottom: "1.5rem" }}>
            Update your login credentials here. This is the email you use to sign into the CRM.
          </p>

          {accountMsg && (
            <div style={{ marginBottom: "1rem", padding: "0.75rem 1rem", borderRadius: "0.5rem", fontWeight: 600, fontSize: "0.875rem",
              backgroundColor: accountMsg.type === "success" ? "var(--status-green)" : "var(--status-red)",
              color: accountMsg.type === "success" ? "var(--status-green-fg)" : "var(--status-red-fg)" }}>
              {accountMsg.text}
            </div>
          )}

          <form onSubmit={handleUpdateAccount} className="space-y-4 mb-6">

            <div>
              <label style={labelStyle}>Login Email</label>
              <input type="email" style={inputStyle} value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>New Password <span style={{ color: "var(--muted)", fontWeight: 400 }}>(leave blank to keep current)</span></label>
              <input type="password" style={inputStyle} value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <button type="submit" className="btn btn-primary" disabled={updatingAccount} style={{ width: "auto" }}>
              {updatingAccount ? "Updating..." : "Update Credentials"}
            </button>
          </form>

          {/* Danger Zone */}
          <div style={{ marginTop: "3rem", borderTop: "1px solid var(--border)", paddingTop: "2rem" }}>
            <h3 style={{ color: "var(--status-red)", fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.5rem" }}>Danger Zone</h3>
            <p style={{ fontSize: "0.875rem", color: "var(--status-red)", fontWeight: 600, marginBottom: "1rem" }}>
              Permanently delete all CRM data including contacts, inquiries, communications, meetings, contracts, invoices, and expenses. Configuration settings and your account will remain.
            </p>
            <button 
              onClick={() => setShowResetModal(true)} 
              className="btn btn-outline" 
              style={{ width: "auto", borderColor: "var(--status-red)", color: "var(--status-red)" }}
            >
              Reset CRM Data
            </button>
          </div>

          {/* Reset Modal */}
          {showResetModal && (
            <div className="modal-overlay" onClick={() => setShowResetModal(false)}>
              <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: "450px" }}>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--status-red)", marginBottom: "1rem" }}>Factory Reset CRM</h2>
                <p style={{ fontSize: "0.875rem", marginBottom: "1.5rem", lineHeight: 1.5 }}>
                  This will permanently delete all client records, files, forms, contracts, emails, and history. <strong>This cannot be undone.</strong>
                </p>
                <form onSubmit={handleResetCrm}>
                  <label style={labelStyle}>
                    Type <strong style={{ color: "var(--status-red)" }}>RESET</strong> to confirm
                  </label>
                  <input 
                    type="text" 
                    style={inputStyle}
                    value={resetConfirmText}
                    onChange={e => setResetConfirmText(e.target.value)}
                    placeholder="RESET"
                    required
                  />
                  <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem", justifyContent: "flex-end" }}>
                    <button type="button" className="btn btn-outline" onClick={() => { setShowResetModal(false); setResetConfirmText(""); }}>
                      Cancel
                    </button>
                    <button type="submit" className="btn" disabled={isResetting || resetConfirmText !== "RESET"} style={{ backgroundColor: "var(--status-red)", color: "white", border: "none" }}>
                      {isResetting ? "Wiping..." : "Permanently Delete Data"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
        )}

        {/* Email Configuration */}
        {activeTab === 'integrations' && (
        <div className="glass-panel" style={{ padding: "2rem" }}>
          <div className="flex items-center gap-2 section-header">
            <Send size={20} className="text-[var(--primary)]" />
            <h2>Email Configuration</h2>
          </div>

          <p style={{ fontSize: "0.875rem", color: "var(--muted)", marginBottom: "1.5rem" }}>
            Used to send contracts to clients. Requires a Gmail address and a{" "}
            <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer"
              style={{ color: "var(--primary)", textDecoration: "underline" }}>
              Google App Password
            </a>{" "}
            (16-character password — requires 2FA enabled on your Google account).
          </p>

          {emailMsg && (
            <div style={{ marginBottom: "1rem", padding: "0.75rem 1rem", borderRadius: "0.5rem", fontWeight: 600, fontSize: "0.875rem",
              backgroundColor: emailMsg.type === "success" ? "var(--status-green)" : "var(--status-red)",
              color: emailMsg.type === "success" ? "var(--status-green-fg)" : "var(--status-red-fg)" }}>
              {emailMsg.text}
            </div>
          )}

          <form onSubmit={handleSaveEmail} className="space-y-4">
            {/* Status indicator */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0.6rem 1rem",
              background: hasEmailPass && emailUser ? "var(--status-green)" : "var(--muted-bg)",
              borderRadius: 8, border: "1px solid var(--border)", marginBottom: 4 }}>
              <ShieldCheck size={16} style={{ color: hasEmailPass && emailUser ? "var(--status-green-fg)" : "var(--muted)", flexShrink: 0 }} />
              <span style={{ fontSize: "0.8rem", fontWeight: 600,
                color: hasEmailPass && emailUser ? "var(--status-green-fg)" : "var(--muted)" }}>
                {hasEmailPass && emailUser ? `Configured — sending as ${emailUser}` : "Not configured"}
              </span>
            </div>

            <div>
              <label style={labelStyle}>Gmail Address</label>
              <input
                type="email" className="input" style={inputStyle}
                value={emailUser} onChange={e => setEmailUser(e.target.value)}
                placeholder="yourname@gmail.com"
              />
            </div>

            <div>
              <label style={labelStyle}>
                App Password {hasEmailPass && <span style={{ color: "var(--muted)", fontWeight: 400 }}>(leave blank to keep current)</span>}
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPass ? "text" : "password"}
                  className="input"
                  style={{ ...inputStyle, paddingRight: "3rem", letterSpacing: showPass ? "normal" : "0.2em" }}
                  value={emailPass}
                  onChange={e => setEmailPass(e.target.value)}
                  placeholder={hasEmailPass ? "••••••••••••••••" : "xxxx xxxx xxxx xxxx"}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    border: "none", background: "transparent", cursor: "pointer", color: "var(--muted)", padding: 2 }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.4rem" }}>
                Generate an App Password at Google Account → Security → 2-Step Verification → App passwords.
              </p>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button type="submit" className="btn btn-primary" disabled={savingEmail} style={{ width: "auto" }}>
                {savingEmail ? "Saving..." : "Save Email Config"}
              </button>
              <button type="button" onClick={handleTestEmail} disabled={testingEmail || !emailUser}
                className="btn btn-outline" style={{ width: "auto", display: "flex", alignItems: "center", gap: 6 }}>
                <Send size={14} /> {testingEmail ? "Sending..." : "Send Test Email"}
              </button>
            </div>
          </form>
        </div>
        )}

        {/* Google Integration */}
        {activeTab === 'integrations' && (
        <div className="glass-panel" style={{ padding: "2rem" }}>
          <div className="flex items-center gap-2 section-header">
            <Mail size={20} className="text-[var(--primary)]" />
            <h2>Google Account Integration</h2>
          </div>

          <p style={{ fontSize: "0.875rem", color: "var(--muted)", marginBottom: "1.5rem" }}>
            Connect your Google account via OAuth to enable <strong>Calendar Sync</strong> for meetings and automatically pull client <strong>Gmail</strong> replies into your Communications tab.
          </p>

          <div style={{ padding: "1.5rem", backgroundColor: "var(--muted-bg)", borderRadius: "0.5rem", border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: hasToken ? "1rem" : "0" }}>
              <div>
                <div style={{ fontWeight: 800 }}>Connection Status</div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", marginTop: "0.25rem",
                  color: hasToken ? "var(--status-green-fg)" : "var(--muted)" }}>
                  {hasToken ? <><CheckCircle2 size={16} /> Connected</> : "Not Connected"}
                </div>
              </div>
              {!hasToken ? (
                <a href="/api/gmail/auth" 
                  className="btn btn-primary" 
                  style={{ width: "auto", textDecoration: "none" }}
                >
                  <LinkIcon size={16} /> Sign in with Google
                </a>
              ) : (
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button onClick={handleSync} disabled={syncing} className="btn btn-primary" style={{ width: "auto" }}>
                    <RefreshCw size={16} className={syncing ? "animate-spin" : ""} />
                    {syncing ? "Syncing..." : "Sync Emails Now"}
                  </button>
                  <button onClick={handleDisconnectGoogle} className="btn btn-outline" style={{ width: "auto", color: "var(--status-red-fg)", borderColor: "var(--status-red-fg)" }}>
                    Disconnect
                  </button>
                </div>
              )}
            </div>
            {hasToken && (
              <p style={{ fontSize: "0.75rem", color: "var(--muted)", margin: 0 }}>
                Syncing will look for recent emails from addresses in your Contacts list and log them automatically.
              </p>
            )}
          </div>
        </div>
        )}

        {/* SMS Configuration */}
        {activeTab === 'integrations' && (
        <div className="glass-panel" style={{ padding: "2rem" }}>
          <div className="flex items-center gap-2 section-header">
            <ShieldCheck size={20} className="text-[var(--primary)]" />
            <h2>SMS Configuration</h2>
          </div>

          <p style={{ fontSize: "0.875rem", color: "var(--muted)", marginBottom: "1.5rem" }}>
            Connect your Twilio account to send automated text messages and reminders to clients.
          </p>

          <form onSubmit={handleSave} className="space-y-4 mb-6">
            <div>
              <label style={labelStyle}>Twilio Account SID</label>
              <input type="text" style={inputStyle} value={twilioSid}
                onChange={e => setTwilioSid(e.target.value)} placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
            </div>
            <div>
              <label style={labelStyle}>Twilio Auth Token</label>
              <input type="password" style={inputStyle} value={twilioAuthToken}
                onChange={e => setTwilioAuthToken(e.target.value)} placeholder="••••••••••••••••••••••••••••••••" />
            </div>
            <div>
              <label style={labelStyle}>Twilio Phone Number</label>
              <input type="text" style={inputStyle} value={twilioPhone}
                onChange={e => setTwilioPhone(e.target.value)} placeholder="+1234567890" />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button type="submit" className="btn btn-primary" style={{ width: "auto" }}>Save SMS Config</button>
              <button type="button" onClick={handleTestSms} disabled={testingSms} className="btn btn-outline" style={{ width: "auto" }}>
                {testingSms ? "Sending..." : "Send Test SMS"}
              </button>
            </div>
          </form>
        </div>
        )}

        {/* Payment Gateways */}
        {activeTab === 'integrations' && (
        <div className="glass-panel" style={{ padding: "2rem" }}>
          <div className="flex items-center gap-2 section-header">
            <ShieldCheck size={20} className="text-[var(--primary)]" />
            <h2>Payment Gateways</h2>
          </div>

          <p style={{ fontSize: "0.875rem", color: "var(--muted)", marginBottom: "1.5rem" }}>
            Connect your payment gateways to allow clients to pay invoices and retainers directly from their portal.
          </p>

          <form onSubmit={handleSave} className="space-y-4 mb-6">
            <div>
              <label style={labelStyle}>PayPal Client ID</label>
              <input type="text" style={inputStyle} value={paypalClientId}
                onChange={e => setPaypalClientId(e.target.value)} placeholder="AYxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
              <p style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.4rem" }}>
                Find this in your <a href="https://developer.paypal.com/dashboard/applications/live" target="_blank" rel="noreferrer" style={{ color: "var(--primary)", textDecoration: "underline" }}>PayPal Developer Dashboard</a>. Leave blank to disable PayPal checkout.
              </p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button type="submit" className="btn btn-primary" style={{ width: "auto" }} disabled={saving}>
                {saving ? "Saving..." : "Save Gateways"}
              </button>
            </div>
          </form>
        </div>
        )}
      </div>

        {/* Custom Domains */}
        {activeTab === 'domains' && (
        <div className="glass-panel" style={{ padding: "2rem", gridColumn: "1 / -1" }}>
          <div className="flex items-center gap-2 section-header">
            <h2>Custom Domain</h2>
          </div>

          <p style={{ fontSize: "0.875rem", color: "var(--muted)", marginBottom: "1.5rem" }}>
            Map your own custom domain (e.g., <code>portal.yourbusiness.com</code>) to your CRM to white-label your public links.
          </p>

          <form onSubmit={handleSaveDomain} className="space-y-4 mb-6" style={{ maxWidth: 500 }}>
            <div>
              <label style={labelStyle}>Your Custom Domain</label>
              <input type="text" style={inputStyle} value={customDomain}
                onChange={e => setCustomDomain(e.target.value)} placeholder="portal.yourdomain.com" />
              {isCheckingAvailability && (
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.25rem' }}>Checking availability...</div>
              )}
              {domainAvailable === false && !isCheckingAvailability && (
                <div style={{ fontSize: '0.75rem', color: 'var(--status-red)', marginTop: '0.25rem', fontWeight: 600 }}>
                  Not available or already taken
                </div>
              )}
              {domainAvailable === true && !isCheckingAvailability && customDomain.includes('.') && (
                <div style={{ fontSize: '0.75rem', color: 'var(--status-green)', marginTop: '0.25rem', fontWeight: 600 }}>
                  Domain is available!
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button type="submit" className="btn btn-primary" style={{ width: "auto" }} disabled={savingDomain || domainAvailable === false || isCheckingAvailability}>
                {savingDomain ? "Saving..." : "Add Domain"}
              </button>
              {customDomain && (
                <button type="button" onClick={handleRemoveDomain} disabled={savingDomain} className="btn btn-outline" style={{ width: "auto", color: "var(--status-red-fg)", borderColor: "var(--status-red-fg)" }}>
                  Remove Domain
                </button>
              )}
            </div>
          </form>

          {customDomain && (
            <div style={{ padding: "1.5rem", backgroundColor: "var(--muted-bg)", borderRadius: "0.5rem", border: "1px solid var(--border)" }}>
              <div style={{ fontWeight: 800, marginBottom: "0.5rem" }}>DNS Configuration</div>
              
              {domainStatus?.verified ? (
                <div style={{ color: "var(--status-green-fg)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <CheckCircle2 size={16} /> Domain Verified and Active
                </div>
              ) : (
                <>
                  <p style={{ fontSize: "0.875rem", marginBottom: "1rem" }}>
                    Please configure your DNS settings to point to Vercel:
                  </p>
                  <table style={{ width: "100%", fontSize: "0.875rem", textAlign: "left", borderCollapse: "collapse", marginBottom: "1rem" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border)" }}>
                        <th style={{ padding: "0.5rem" }}>Type</th>
                        <th style={{ padding: "0.5rem" }}>Name</th>
                        <th style={{ padding: "0.5rem" }}>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ padding: "0.5rem" }}>CNAME</td>
                        <td style={{ padding: "0.5rem" }}>{customDomain.split('.').slice(0, -2).join('.') || '@'}</td>
                        <td style={{ padding: "0.5rem", fontFamily: "monospace" }}>cname.vercel-dns.com</td>
                      </tr>
                      {customDomain.split('.').length === 2 && (
                        <tr>
                          <td style={{ padding: "0.5rem" }}>A</td>
                          <td style={{ padding: "0.5rem" }}>@</td>
                          <td style={{ padding: "0.5rem", fontFamily: "monospace" }}>76.76.21.21</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  <div style={{ display: "flex", gap: "1rem" }}>
                    <button onClick={() => handleCheckDomain(customDomain)} disabled={checkingDomain} className="btn btn-outline" style={{ width: "auto" }}>
                      {checkingDomain ? "Checking..." : "Refresh Status"}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

        </div>
        )}

    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="empty-state">Loading settings…</div>}>
      <SettingsInner />
    </Suspense>
  );
}
