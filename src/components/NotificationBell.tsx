"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, X, User, Mail, FileText, DollarSign, CheckCircle, ClipboardList } from "lucide-react";
import Link from "next/link";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  return `${days}d ago`;
}

const iconMap: Record<string, React.ReactNode> = {
  user:    <User size={15} />,
  mail:    <Mail size={15} />,
  form:    <ClipboardList size={15} />,
  check:   <CheckCircle size={15} />,
  dollar:  <DollarSign size={15} />,
};

const colorMap: Record<string, string> = {
  contact:  "#4da685",
  email:    "#3b82f6",
  form:     "#8b5cf6",
  contract: "#0f766e",
  proposal: "#0f766e",
  payment:  "#16a34a",
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("dismissed_notifications");
        return new Set(saved ? JSON.parse(saved) : []);
      } catch { return new Set(); }
    }
    return new Set();
  });
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (data.success) setNotifications(data.notifications || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 2 minutes
    const interval = setInterval(fetchNotifications, 120000);
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const visible = notifications.filter(n => !dismissed.has(n.id));
  const unreadCount = visible.length;

  const dismiss = (id: string) => {
    const next = new Set(dismissed).add(id);
    setDismissed(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("dismissed_notifications", JSON.stringify([...next]));
    }
  };

  const dismissAll = () => {
    const next = new Set([...dismissed, ...notifications.map(n => n.id)]);
    setDismissed(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("dismissed_notifications", JSON.stringify([...next]));
    }
  };

  return (
    <div ref={ref} style={{ position: "relative", zIndex: 200 }}>
      {/* Bell button */}
      <button
        onClick={() => { setOpen(o => !o); if (!open) fetchNotifications(); }}
        style={{
          position: "relative",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: "8px",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--muted)",
          transition: "background 0.2s, color 0.2s",
        }}
        onMouseOver={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "var(--muted-bg)"; (e.currentTarget as HTMLElement).style.color = "var(--foreground)"; }}
        onMouseOut={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--muted)"; }}
        title="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span style={{
            position: "absolute",
            top: 4,
            right: 4,
            minWidth: 16,
            height: 16,
            borderRadius: "50%",
            backgroundColor: "#ef4444",
            color: "#fff",
            fontSize: 10,
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            lineHeight: 1,
            padding: "0 3px",
            boxShadow: "0 0 0 2px var(--background)",
          }}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 8px)",
          right: 0,
          width: 380,
          backgroundColor: "var(--background)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          boxShadow: "0 10px 40px rgba(0,0,0,0.12)",
          overflow: "hidden",
          animation: "fadeSlideIn 0.15s ease",
        }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ fontWeight: 800, fontSize: "0.9375rem" }}>Notifications</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {unreadCount > 0 && (
                <button onClick={dismissAll} style={{ fontSize: 12, color: "var(--primary)", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
                  Clear all
                </button>
              )}
              <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", display: "flex" }}>
                <X size={16} />
              </button>
            </div>
          </div>

          {/* List */}
          <div style={{ maxHeight: 440, overflowY: "auto" }}>
            {loading && visible.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "var(--muted)", fontSize: 14 }}>Loading...</div>
            ) : visible.length === 0 ? (
              <div style={{ padding: "3rem 1rem", textAlign: "center", color: "var(--muted)" }}>
                <Bell size={32} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
                <div style={{ fontWeight: 600, fontSize: 14 }}>All caught up!</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>No new notifications</div>
              </div>
            ) : (
              visible.map(n => (
                <div
                  key={n.id}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    padding: "12px 16px",
                    borderBottom: "1px solid var(--border)",
                    transition: "background 0.15s",
                  }}
                  onMouseOver={e => (e.currentTarget.style.backgroundColor = "var(--muted-bg)")}
                  onMouseOut={e => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  {/* Icon */}
                  <div style={{
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    backgroundColor: colorMap[n.type] + "18",
                    color: colorMap[n.type],
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    {iconMap[n.icon] || <Bell size={15} />}
                  </div>

                  {/* Text */}
                  <Link href={n.href} onClick={() => { dismiss(n.id); setOpen(false); }} style={{ flex: 1, textDecoration: "none", color: "inherit" }}>
                    <div style={{ fontWeight: 700, fontSize: "0.8125rem", color: "var(--foreground)", marginBottom: 2 }}>{n.title}</div>
                    <div style={{ fontSize: "0.8125rem", color: "var(--muted)", lineHeight: 1.4 }}>{n.subtitle}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: 4, opacity: 0.7 }}>{timeAgo(n.time)}</div>
                  </Link>

                  {/* Dismiss */}
                  <button
                    onClick={() => dismiss(n.id)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 4, flexShrink: 0, display: "flex", alignItems: "center" }}
                    title="Dismiss"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
