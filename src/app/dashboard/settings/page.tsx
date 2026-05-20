"use client";

import { useEffect, useState, Suspense } from "react";
import { Settings as SettingsIcon, Mail, Link as LinkIcon, CheckCircle2, RefreshCw, Eye, EyeOff, Send, ShieldCheck } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

function SettingsInner() {
  const [companyName, setCompanyName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [phone, setPhone] = useState("");
  const [timeZone, setTimeZone] = useState("(GMT-05:00) America, Jamaica");
  const [dateFormat, setDateFormat] = useState("dd/mm/yyyy");

  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [hasToken, setHasToken] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const tabs = ["General", "Security", "Integrations"];
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

  // Twilio state
  const [twilioSid, setTwilioSid] = useState("");
  const [twilioAuthToken, setTwilioAuthToken] = useState("");
  const [twilioPhone, setTwilioPhone] = useState("");
  const [testingSms, setTestingSms] = useState(false);

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
          
          setClientId(data.config.googleClientId || "");
          setClientSecret(data.config.googleClientSecret || "");
          setHasToken(data.config.hasRefreshToken || false);
          setEmailUser(data.config.emailUser || "");
          setHasEmailPass(data.config.hasEmailPass || false);
          setBusinessLogo(data.config.businessLogo || "");
          setBusinessAddress(data.config.businessAddress || "");
          setTwilioSid(data.config.twilioSid || "");
          setTwilioAuthToken(data.config.twilioAuthToken || "");
          setTwilioPhone(data.config.twilioPhone || "");
        }
      })
      .finally(() => setLoading(false));

    // Fetch user's current login email
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }: any) => {
      if (user?.email) setLoginEmail(user.email);
    });
  }, [searchParams]);

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
          googleClientId: clientId, googleClientSecret: clientSecret, businessLogo, businessAddress, twilioSid, twilioAuthToken, twilioPhone 
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
              <label style={labelStyle}>Business Logo</label>
              {businessLogo && (
                <div style={{ marginBottom: "0.75rem", padding: "0.75rem", border: "1px solid var(--border)", borderRadius: "0.5rem", background: "var(--muted-bg)", display: "flex", alignItems: "center", gap: "1rem" }}>
                  <img src={businessLogo} alt="Business logo" style={{ maxHeight: "60px", maxWidth: "180px", objectFit: "contain" }} />
                  <button type="button" onClick={() => setBusinessLogo("")} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: "0.75rem" }}>Remove</button>
                </div>
              )}
              <label style={{ display: "block", cursor: "pointer" }}>
                <div style={{ padding: "0.75rem 1rem", border: "1.5px dashed var(--border)", borderRadius: "0.5rem", textAlign: "center" as const, fontSize: "0.875rem", color: "var(--muted)" }}>
                  {businessLogo ? "Replace logo" : "Upload logo (PNG, JPG, SVG)"}
                </div>
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => setBusinessLogo(ev.target?.result as string);
                  reader.readAsDataURL(file);
                }}/>
              </label>
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

        {/* Gmail Integration */}
        {activeTab === 'integrations' && (
        <div className="glass-panel" style={{ padding: "2rem" }}>
          <div className="flex items-center gap-2 section-header">
            <Mail size={20} className="text-[var(--primary)]" />
            <h2>Gmail Integration</h2>
          </div>

          <p style={{ fontSize: "0.875rem", color: "var(--muted)", marginBottom: "1.5rem" }}>
            Connect your Gmail account via OAuth to automatically pull in replies from clients and log them in your Communications tab.
          </p>

          <form onSubmit={handleSave} className="space-y-4 mb-6">
            <div>
              <label style={labelStyle}>Google Client ID</label>
              <input type="text" className="input" style={inputStyle} value={clientId}
                onChange={e => setClientId(e.target.value)} placeholder="xxx.apps.googleusercontent.com" />
            </div>
            <div>
              <label style={labelStyle}>Google Client Secret</label>
              <input type="password" className="input" style={inputStyle} value={clientSecret}
                onChange={e => setClientSecret(e.target.value)} placeholder="GOCSPX-xxxxxx" />
            </div>
            <button type="submit" className="btn btn-outline" style={{ width: "auto" }}>Save API Keys</button>
          </form>

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
                <a href="/api/gmail/auth" className="btn btn-primary" style={{ width: "auto", textDecoration: "none" }}>
                  <LinkIcon size={16} /> Connect Account
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

      </div>
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
