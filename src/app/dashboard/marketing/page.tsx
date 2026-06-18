"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  Plus, Mail, Clock, CheckCircle2, Users, Download, Trash2,
  Search, X, UserPlus, LayoutGrid, Megaphone,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

type Tab = 'campaigns' | 'popups' | 'subscribers';

interface Subscriber {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  source?: string;
  status?: string;
  subscribed_at: string;
  tags?: string[];
}

export default function MarketingDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('campaigns');
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [popups, setPopups] = useState<any[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [customDomain, setCustomDomain] = useState("");
  const [userId, setUserId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [subSearch, setSubSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ email: "", first_name: "", last_name: "" });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [embedCopied, setEmbedCopied] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    setUserId(user.id);

    const [campaignRes, popupRes, settingsRes, subRes] = await Promise.all([
      supabase.from("Marketing_Campaigns").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("Marketing_Popups").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      fetch("/api/settings").then(r => r.json()),
      fetch("/api/newsletter-subscribers").then(r => r.json()),
    ]);

    if (!campaignRes.error && campaignRes.data) setCampaigns(campaignRes.data);
    if (!popupRes.error && popupRes.data) setPopups(popupRes.data);
    if (settingsRes.success && settingsRes.config?.customDomain) setCustomDomain(settingsRes.config.customDomain);
    if (subRes.success) setSubscribers(subRes.subscribers);
    setIsLoading(false);
  };

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Add subscriber ──────────────────────────────────────────────────────────
  const handleAddSubscriber = async () => {
    setAddError("");
    if (!addForm.email || !addForm.email.includes("@")) { setAddError("Please enter a valid email address."); return; }
    setAddLoading(true);
    const res = await fetch("/api/newsletter-subscribers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...addForm, source: "manual" }),
    }).then(r => r.json());
    setAddLoading(false);
    if (res.success) {
      setSubscribers(prev => [res.subscriber, ...prev.filter(s => s.id !== res.subscriber.id)]);
      setAddForm({ email: "", first_name: "", last_name: "" });
      setShowAddModal(false);
      showToast("Subscriber added!");
    } else {
      setAddError(res.error || "Failed to add subscriber.");
    }
  };

  // ── Delete subscriber ───────────────────────────────────────────────────────
  const handleDelete = async (id: number) => {
    if (!confirm("Remove this subscriber?")) return;
    const res = await fetch("/api/newsletter-subscribers", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).then(r => r.json());
    if (res.success) {
      setSubscribers(prev => prev.filter(s => s.id !== id));
      showToast("Subscriber removed.");
    }
  };

  // ── Export CSV ──────────────────────────────────────────────────────────────
  const exportCSV = () => {
    const header = "Email,First Name,Last Name,Source,Status,Subscribed At";
    const rows = subscribers.map(s =>
      [s.email, s.first_name || "", s.last_name || "", s.source || "manual", s.status || "active",
        new Date(s.subscribed_at).toLocaleDateString()].map(v => `"${v}"`).join(",")
    );
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "newsletter-subscribers.csv"; a.click();
  };

  const filteredSubs = subscribers.filter(s =>
    !subSearch || `${s.email} ${s.first_name ?? ""} ${s.last_name ?? ""}`.toLowerCase().includes(subSearch.toLowerCase())
  );

  const sourceColor: Record<string, string> = {
    manual: "#3b82f6", popup: "#8b5cf6", form: "#10b981", import: "#f59e0b",
  };

  const tabStyle = (t: Tab) => ({
    background: "none", border: "none", padding: "0.5rem 0", cursor: "pointer",
    fontSize: "1rem", fontWeight: 600 as const,
    color: activeTab === t ? "var(--foreground, #0f172a)" : "#64748b",
    borderBottom: activeTab === t ? "2px solid var(--primary, #0f172a)" : "2px solid transparent",
    display: "flex", alignItems: "center" as const, gap: "0.4rem",
  });

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto", paddingBottom: "6rem" }}>

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            style={{
              position: "fixed", top: "1.5rem", right: "1.5rem", zIndex: 9999,
              background: toast.ok ? "#10b981" : "#ef4444",
              color: "white", padding: "0.75rem 1.25rem", borderRadius: "0.75rem",
              fontWeight: 600, fontSize: "0.9rem", boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            }}
          >
            {toast.ok ? "✓" : "✕"} {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Add Subscriber Modal ── */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
            onClick={e => { if (e.target === e.currentTarget) setShowAddModal(false); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              style={{ background: "var(--card, white)", borderRadius: "1rem", padding: "2rem", width: "100%", maxWidth: "480px", boxShadow: "0 24px 64px rgba(0,0,0,0.2)" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>Add Subscriber</h2>
                <button onClick={() => setShowAddModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}><X size={20} /></button>
              </div>

              {addError && (
                <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", color: "#b91c1c", padding: "0.75rem 1rem", borderRadius: "0.5rem", fontSize: "0.875rem", marginBottom: "1rem" }}>
                  {addError}
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b", marginBottom: "0.4rem" }}>
                    Email Address *
                  </label>
                  <input
                    type="email" placeholder="jane@example.com"
                    value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))}
                    onKeyDown={e => e.key === "Enter" && handleAddSubscriber()}
                    style={{ width: "100%", padding: "0.625rem 0.875rem", border: "1px solid #e2e8f0", borderRadius: "0.5rem", fontSize: "0.9rem", outline: "none", background: "var(--background, #fff)", color: "var(--foreground, #0f172a)", boxSizing: "border-box" }}
                    autoFocus
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b", marginBottom: "0.4rem" }}>First Name</label>
                    <input
                      placeholder="Jane"
                      value={addForm.first_name} onChange={e => setAddForm(f => ({ ...f, first_name: e.target.value }))}
                      style={{ width: "100%", padding: "0.625rem 0.875rem", border: "1px solid #e2e8f0", borderRadius: "0.5rem", fontSize: "0.9rem", outline: "none", background: "var(--background, #fff)", color: "var(--foreground, #0f172a)", boxSizing: "border-box" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b", marginBottom: "0.4rem" }}>Last Name</label>
                    <input
                      placeholder="Doe"
                      value={addForm.last_name} onChange={e => setAddForm(f => ({ ...f, last_name: e.target.value }))}
                      style={{ width: "100%", padding: "0.625rem 0.875rem", border: "1px solid #e2e8f0", borderRadius: "0.5rem", fontSize: "0.9rem", outline: "none", background: "var(--background, #fff)", color: "var(--foreground, #0f172a)", boxSizing: "border-box" }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem", justifyContent: "flex-end" }}>
                <button onClick={() => setShowAddModal(false)} style={{ padding: "0.625rem 1.25rem", border: "1px solid #e2e8f0", borderRadius: "0.5rem", background: "transparent", cursor: "pointer", fontWeight: 600, color: "#64748b" }}>
                  Cancel
                </button>
                <button
                  onClick={handleAddSubscriber} disabled={addLoading}
                  style={{ padding: "0.625rem 1.5rem", borderRadius: "0.5rem", background: "var(--primary, #0f172a)", color: "white", border: "none", cursor: "pointer", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.4rem", opacity: addLoading ? 0.7 : 1 }}
                >
                  <UserPlus size={15} /> {addLoading ? "Adding…" : "Add Subscriber"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.875rem", fontWeight: "bold", color: "var(--foreground, #0f172a)", marginBottom: "0.5rem" }}>Marketing</h1>
          <p style={{ color: "#64748b" }}>Email campaigns, lead capture popups, and newsletter subscribers.</p>
        </div>

        {activeTab === "campaigns" && (
          <Link href="/dashboard/marketing/new" style={{ display: "flex", alignItems: "center", gap: "0.5rem", backgroundColor: "var(--primary, #0f172a)", color: "white", padding: "0.75rem 1.5rem", borderRadius: "0.5rem", fontWeight: 600, textDecoration: "none" }}>
            <Plus size={18} /> New Campaign
          </Link>
        )}
        {activeTab === "popups" && (
          <Link href="/dashboard/marketing/popups/new" style={{ display: "flex", alignItems: "center", gap: "0.5rem", backgroundColor: "var(--primary, #0f172a)", color: "white", padding: "0.75rem 1.5rem", borderRadius: "0.5rem", fontWeight: 600, textDecoration: "none" }}>
            <Plus size={18} /> New Popup
          </Link>
        )}
        {activeTab === "subscribers" && (
          <div style={{ display: "flex", gap: "0.75rem" }}>
            {subscribers.length > 0 && (
              <button onClick={exportCSV} style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.75rem 1.25rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0", background: "white", cursor: "pointer", fontWeight: 600, color: "#334155", fontSize: "0.875rem" }}>
                <Download size={16} /> Export CSV
              </button>
            )}
            <button onClick={() => setShowAddModal(true)} style={{ display: "flex", alignItems: "center", gap: "0.5rem", backgroundColor: "var(--primary, #0f172a)", color: "white", padding: "0.75rem 1.5rem", borderRadius: "0.5rem", fontWeight: 600, border: "none", cursor: "pointer" }}>
              <UserPlus size={18} /> Add Subscriber
            </button>
          </div>
        )}
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: "2rem", borderBottom: "1px solid #e2e8f0", marginBottom: "2rem" }}>
        <button onClick={() => setActiveTab("campaigns")} style={tabStyle("campaigns")}>
          <Megaphone size={15} /> Email Campaigns
        </button>
        <button onClick={() => setActiveTab("popups")} style={tabStyle("popups")}>
          <LayoutGrid size={15} /> Website Popups
        </button>
        <button onClick={() => setActiveTab("subscribers")} style={tabStyle("subscribers")}>
          <Users size={15} /> Newsletter
          {subscribers.length > 0 && (
            <span style={{ marginLeft: 4, background: "var(--primary, #0f172a)", color: "white", borderRadius: "9999px", fontSize: "0.7rem", fontWeight: 700, padding: "1px 7px" }}>
              {subscribers.length}
            </span>
          )}
        </button>
      </div>

      {/* ── Content ── */}
      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "4rem 0" }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid rgba(0,0,0,0.1)", borderLeftColor: "#0f172a", animation: "spin 0.9s linear infinite" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>

      ) : activeTab === "campaigns" && campaigns.length === 0 ? (
        <div style={{ textAlign: "center", padding: "5rem 2rem", backgroundColor: "#f8fafc", borderRadius: "1rem", border: "1px dashed #cbd5e1" }}>
          <Mail size={48} color="#94a3b8" style={{ margin: "0 auto 1.5rem" }} />
          <h3 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#334155", marginBottom: "0.5rem" }}>No campaigns yet</h3>
          <p style={{ color: "#64748b", maxWidth: "400px", margin: "0 auto 2rem" }}>
            Reach out to your entire contact list or specific segments with powerful, personalized email blasts.
          </p>
          <Link href="/dashboard/marketing/new" style={{ backgroundColor: "#3b82f6", color: "white", padding: "0.75rem 1.5rem", borderRadius: "0.5rem", fontWeight: 600, textDecoration: "none", display: "inline-block" }}>
            Create Your First Campaign
          </Link>
        </div>

      ) : activeTab === "campaigns" ? (
        <div style={{ display: "grid", gap: "1rem" }}>
          {campaigns.map((campaign, i) => (
            <motion.div key={campaign.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              style={{ backgroundColor: "white", borderRadius: "0.75rem", padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                  <h3 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#0f172a", margin: 0 }}>{campaign.name}</h3>
                  <span style={{ padding: "0.25rem 0.75rem", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 600, backgroundColor: campaign.status === "Sent" ? "#dcfce7" : "#f1f5f9", color: campaign.status === "Sent" ? "#166534" : "#475569", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    {campaign.status === "Sent" ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                    {campaign.status}
                  </span>
                </div>
                <p style={{ color: "#64748b", fontSize: "0.875rem", margin: "0 0 1rem 0" }}>Subject: "{campaign.subject}"</p>
                {campaign.status === "Sent" && (
                  <div style={{ display: "flex", gap: "2rem", borderTop: "1px solid #f1f5f9", paddingTop: "1rem" }}>
                    <div><p style={{ fontSize: "0.75rem", color: "#64748b", margin: "0 0 0.25rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Sent To</p><p style={{ fontSize: "1.125rem", fontWeight: 600, color: "#0f172a", margin: 0 }}>{campaign.sent_count} contacts</p></div>
                    <div><p style={{ fontSize: "0.75rem", color: "#64748b", margin: "0 0 0.25rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Opened</p><p style={{ fontSize: "1.125rem", fontWeight: 600, color: "#3b82f6", margin: 0 }}>{campaign.open_count}</p></div>
                    <div><p style={{ fontSize: "0.75rem", color: "#64748b", margin: "0 0 0.25rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Sent At</p><p style={{ fontSize: "0.875rem", color: "#334155", margin: 0, marginTop: "0.25rem" }}>{new Date(campaign.sent_at).toLocaleDateString()} {new Date(campaign.sent_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p></div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

      ) : activeTab === "popups" && popups.length === 0 ? (
        <div style={{ textAlign: "center", padding: "5rem 2rem", backgroundColor: "#f8fafc", borderRadius: "1rem", border: "1px dashed #cbd5e1" }}>
          <h3 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#334155", marginBottom: "0.5rem" }}>No popups yet</h3>
          <p style={{ color: "#64748b", maxWidth: "400px", margin: "0 auto 2rem" }}>Create embedded website popups to capture leads and grow your email list.</p>
          <Link href="/dashboard/marketing/popups/new" style={{ backgroundColor: "#3b82f6", color: "white", padding: "0.75rem 1.5rem", borderRadius: "0.5rem", fontWeight: 600, textDecoration: "none", display: "inline-block" }}>
            Create Your First Popup
          </Link>
        </div>

      ) : activeTab === "popups" ? (
        <div style={{ display: "grid", gap: "1rem" }}>
          {popups.map((popup, i) => (
            <motion.div key={popup.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              style={{ backgroundColor: "white", borderRadius: "0.75rem", padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                  <h3 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#0f172a", margin: 0 }}>{popup.internal_name}</h3>
                  <span style={{ padding: "0.25rem 0.75rem", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 600, backgroundColor: popup.active ? "#dcfce7" : "#f1f5f9", color: popup.active ? "#166534" : "#475569" }}>
                    {popup.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <p style={{ color: "#64748b", fontSize: "0.875rem", margin: "0 0 1rem 0" }}>Headline: "{popup.headline}"</p>
                <div style={{ display: "flex", gap: "2rem", borderTop: "1px solid #f1f5f9", paddingTop: "1rem" }}>
                  <div><p style={{ fontSize: "0.75rem", color: "#64748b", margin: "0 0 0.25rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Views</p><p style={{ fontSize: "1.125rem", fontWeight: 600, color: "#0f172a", margin: 0 }}>{popup.view_count}</p></div>
                  <div><p style={{ fontSize: "0.75rem", color: "#64748b", margin: "0 0 0.25rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Leads Captured</p><p style={{ fontSize: "1.125rem", fontWeight: 600, color: "#10b981", margin: 0 }}>{popup.conversion_count}</p></div>
                  <div>
                    <p style={{ fontSize: "0.75rem", color: "#64748b", margin: "0 0 0.25rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Embed Code</p>
                    <input readOnly value={`<script src="${customDomain ? `https://${customDomain}` : (process.env.NEXT_PUBLIC_SITE_URL || "https://clover-crm.vercel.app")}/api/popups/widget/${popup.id}"></script>`}
                      onClick={e => { (e.target as HTMLInputElement).select(); navigator.clipboard.writeText((e.target as HTMLInputElement).value); alert("Copied to clipboard!"); }}
                      style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem", borderRadius: "0.25rem", border: "1px solid #cbd5e1", width: "200px", cursor: "pointer", backgroundColor: "#f8fafc" }} title="Click to copy" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      ) : activeTab === "subscribers" ? (
        <div>
          {/* ── Embed snippet banner ── */}
          {userId && (() => {
            const siteBase = customDomain ? `https://${customDomain}` : (typeof window !== "undefined" ? window.location.origin : "https://clover-crm.vercel.app");
            const snippet = `<script src="${siteBase}/api/newsletter-widget/${userId}"></script>`;
            return (
              <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", borderRadius: "0.75rem", padding: "1.25rem 1.5rem", marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.75rem" }}>
                  <div>
                    <p style={{ fontSize: "0.7rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "#64748b", margin: "0 0 0.25rem" }}>📋 Website Footer Widget</p>
                    <p style={{ color: "#94a3b8", fontSize: "0.8rem", margin: 0 }}>Paste this into your website's HTML where you want the signup form to appear.</p>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(snippet);
                      setEmbedCopied(true);
                      setTimeout(() => setEmbedCopied(false), 2500);
                    }}
                    style={{ padding: "0.5rem 1rem", borderRadius: "0.5rem", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "0.8rem", background: embedCopied ? "#10b981" : "rgba(255,255,255,0.1)", color: "white", transition: "all 0.2s", whiteSpace: "nowrap" }}
                  >
                    {embedCopied ? "✓ Copied!" : "Copy Code"}
                  </button>
                </div>
                <div
                  onClick={() => { navigator.clipboard.writeText(snippet); setEmbedCopied(true); setTimeout(() => setEmbedCopied(false), 2500); }}
                  style={{ marginTop: "0.75rem", background: "rgba(0,0,0,0.3)", borderRadius: "0.5rem", padding: "0.75rem 1rem", fontFamily: "monospace", fontSize: "0.78rem", color: "#a5f3fc", wordBreak: "break-all", cursor: "pointer", lineHeight: 1.6 }}
                  title="Click to copy"
                >
                  {snippet}
                </div>
              </div>
            );
          })()}

          {/* ── Stats bar ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
            {[
              { label: "Total Subscribers", value: subscribers.length, color: "#3b82f6" },
              { label: "Active", value: subscribers.filter(s => s.status !== "unsubscribed").length, color: "#10b981" },
              { label: "From Popups", value: subscribers.filter(s => s.source === "popup").length, color: "#8b5cf6" },
              { label: "Added Manually", value: subscribers.filter(s => s.source === "manual").length, color: "#f59e0b" },
            ].map(stat => (
              <div key={stat.label} style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.75rem", padding: "1.25rem 1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                <p style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#94a3b8", margin: "0 0 0.4rem" }}>{stat.label}</p>
                <p style={{ fontSize: "1.75rem", fontWeight: 800, color: stat.color, margin: 0 }}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* ── Search bar ── */}
          {subscribers.length > 0 && (
            <div style={{ position: "relative", marginBottom: "1.25rem", maxWidth: 380 }}>
              <Search size={16} style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
              <input
                placeholder="Search by name or email…"
                value={subSearch} onChange={e => setSubSearch(e.target.value)}
                style={{ width: "100%", paddingLeft: "2.5rem", paddingRight: "0.875rem", paddingTop: "0.625rem", paddingBottom: "0.625rem", border: "1px solid #e2e8f0", borderRadius: "0.5rem", fontSize: "0.9rem", outline: "none", background: "white", boxSizing: "border-box" }}
              />
            </div>
          )}

          {/* ── Empty state ── */}
          {subscribers.length === 0 ? (
            <div style={{ textAlign: "center", padding: "5rem 2rem", backgroundColor: "#f8fafc", borderRadius: "1rem", border: "1px dashed #cbd5e1" }}>
              <Users size={48} color="#94a3b8" style={{ margin: "0 auto 1.5rem" }} />
              <h3 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#334155", marginBottom: "0.5rem" }}>No subscribers yet</h3>
              <p style={{ color: "#64748b", maxWidth: "400px", margin: "0 auto 2rem" }}>
                Manually add subscribers or connect a website popup to automatically grow your list.
              </p>
              <button onClick={() => setShowAddModal(true)} style={{ backgroundColor: "#3b82f6", color: "white", padding: "0.75rem 1.5rem", borderRadius: "0.5rem", fontWeight: 600, border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                <UserPlus size={18} /> Add Your First Subscriber
              </button>
            </div>

          ) : filteredSubs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
              No subscribers match "{subSearch}"
            </div>

          ) : (
            /* ── Subscriber table ── */
            <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.75rem", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              {/* Table header */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr 36px", padding: "0.75rem 1.25rem", borderBottom: "2px solid #f1f5f9", background: "#f8fafc" }}>
                {["Email", "Name", "Source", "Joined", ""].map(h => (
                  <span key={h} style={{ fontSize: "0.7rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em", color: "#94a3b8" }}>{h}</span>
                ))}
              </div>

              {filteredSubs.map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  style={{
                    display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr 36px",
                    padding: "0.875rem 1.25rem", alignItems: "center",
                    borderBottom: i < filteredSubs.length - 1 ? "1px solid #f1f5f9" : "none",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <span style={{ fontSize: "0.9rem", fontWeight: 500, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.email}</span>
                  <span style={{ fontSize: "0.875rem", color: "#334155" }}>
                    {s.first_name || s.last_name ? `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim() : <span style={{ color: "#cbd5e1" }}>—</span>}
                  </span>
                  <span>
                    <span style={{ fontSize: "0.75rem", fontWeight: 600, padding: "2px 10px", borderRadius: "9999px", background: `${sourceColor[s.source ?? "manual"] ?? "#3b82f6"}18`, color: sourceColor[s.source ?? "manual"] ?? "#3b82f6" }}>
                      {s.source ?? "manual"}
                    </span>
                  </span>
                  <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                    {new Date(s.subscribed_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                  <button onClick={() => handleDelete(s.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#cbd5e1", display: "flex", alignItems: "center", padding: "4px", borderRadius: "4px", transition: "color 0.15s" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
                    onMouseLeave={e => (e.currentTarget.style.color = "#cbd5e1")}
                  >
                    <Trash2 size={14} />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
