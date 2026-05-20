"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, Kanban, Calendar, FileText, Database, Settings, LogOut, MailOpen, ExternalLink, DollarSign, Package } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [companyName, setCompanyName] = useState("Clover");
  const [businessLogo, setBusinessLogo] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/login");
        return;
      }
      // Load company name from API
      fetch('/api/settings').then(r => r.json()).then(data => {
        if (data.config?.companyName) setCompanyName(data.config.companyName);
        if (data.config?.businessLogo) setBusinessLogo(data.config.businessLogo);
      }).catch(() => {});
    });
  }, [router]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const [bookingExpanded, setBookingExpanded] = useState(false);

  const navItems = [
    { name: "Dashboard",          href: "/dashboard",                   icon: LayoutDashboard },
    { name: "Pipeline Board",     href: "/dashboard/pipeline",          icon: Kanban },
    { name: "Calendar & Reminders", href: "/dashboard/calendar",        icon: Calendar },
    { name: "Contacts",           href: "/dashboard/contacts",          icon: Database },
    { name: "Finance & Legal",    href: "/dashboard/finance",           icon: DollarSign },
    { name: "Packages & Sessions",href: "/dashboard/packages",          icon: Package },
    { name: "Email Templates",    href: "/dashboard/templates",         icon: MailOpen },
    { name: "Email Design",       href: "/dashboard/email-settings",    icon: MailOpen },
    { name: "Reports",            href: "/dashboard/reports",           icon: FileText },
  ];

  return (
    <div className={`sidebar ${isOpen ? "open" : ""}`}>
      <div className="sidebar-header">
        {businessLogo ? (
          <div style={{ display: 'flex', alignItems: 'center', height: '32px' }}>
            <img src={businessLogo} alt={companyName} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
          </div>
        ) : (
          <h1 className="sidebar-title">
            {companyName.toLowerCase()}<span style={{ color: '#4da685' }}>.</span>
          </h1>
        )}
      </div>

      <nav className="sidebar-nav">
        {navItems.slice(0, 4).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={`nav-item ${isActive ? "active" : ""}`}
            >
              <Icon size={18} strokeWidth={2} />
              {item.name}
            </Link>
          );
        })}

        <div style={{ marginTop: '1rem', marginBottom: '0.25rem', paddingLeft: '1rem', fontSize: '11px', fontWeight: 700, color: '#a0a0a0', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Tools
        </div>

        {navItems.slice(4).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={`nav-item ${isActive ? "active" : ""}`}
            >
              <Icon size={18} strokeWidth={2} />
              {item.name}
            </Link>
          );
        })}

        {/* Booking Proposal Expandable */}
        <div style={{ marginTop: 'auto' }}>
          <button 
            onClick={() => setBookingExpanded(!bookingExpanded)} 
            className={`nav-item ${pathname.includes('booking') || pathname.includes('questionnaire') ? "active" : ""}`}
            style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <ExternalLink size={18} strokeWidth={2} />
              Booking Proposal
            </div>
            <span style={{ fontSize: 12 }}>{bookingExpanded ? '▼' : '▶'}</span>
          </button>
          
          {bookingExpanded && (
            <div style={{ paddingLeft: 32, display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
              <Link href="/dashboard/questionnaire" onClick={onClose} className={`nav-item ${pathname === '/dashboard/questionnaire' ? 'active' : ''}`} style={{ padding: '8px 12px', fontSize: 13, minHeight: 'auto' }}>
                Questionnaire Builder
              </Link>
              <Link href="/dashboard/booking" onClick={onClose} className={`nav-item ${pathname === '/dashboard/booking' ? 'active' : ''}`} style={{ padding: '8px 12px', fontSize: 13, minHeight: 'auto' }}>
                Funnel Settings
              </Link>
              <Link href="/booking" onClick={onClose} className={`nav-item ${pathname === '/booking' ? 'active' : ''}`} style={{ padding: '8px 12px', fontSize: 13, minHeight: 'auto' }}>
                View Live Proposal
              </Link>
            </div>
          )}
        </div>
      </nav>

      <div className="sidebar-footer">
        <Link href="/dashboard/settings" onClick={onClose} className="sidebar-btn" style={{ textDecoration: "none" }}>
          <Settings size={18} />
          Settings
        </Link>
        <button 
          onClick={handleLogout}
          className="sidebar-btn btn-danger"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </div>
  );
}
