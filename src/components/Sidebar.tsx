"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, Kanban, Calendar, FileText, Database, Settings, LogOut, MailOpen, ExternalLink, DollarSign, Package, Zap, MessageCircle, PieChart } from "lucide-react";
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
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/login");
        return;
      }
      setUserId(user.id);
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
  const [emailExpanded, setEmailExpanded] = useState(false);

  const navItems = [
    { name: "Dashboard",          href: "/dashboard",                   icon: LayoutDashboard },
    { name: "Inbox & Hub",        href: "/dashboard/hub",               icon: MessageCircle },
    { name: "Projects",           href: "/dashboard/pipeline",          icon: Kanban },
    { name: "Calendar & Reminders", href: "/dashboard/calendar",        icon: Calendar },
    { name: "Contacts",           href: "/dashboard/contacts",          icon: Database },
    { name: "Documents",          href: "/dashboard/finance",           icon: FileText },
    { name: "Packages & Sessions",href: "/dashboard/packages",          icon: Package },
    { name: "Reports",            href: "/dashboard/reports",           icon: PieChart },
    { name: "Automations",        href: "/dashboard/automations",       icon: Zap },
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

        {/* Email Expandable */}
        <div style={{ marginTop: '4px' }}>
          <button 
            onClick={() => setEmailExpanded(!emailExpanded)} 
            className={`nav-item ${pathname.includes('templates') || pathname.includes('email-settings') ? "active" : ""}`}
            style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <MailOpen size={18} strokeWidth={2} />
              Email
            </div>
            <span style={{ fontSize: 12 }}>{emailExpanded ? '▼' : '▶'}</span>
          </button>
          
          {emailExpanded && (
            <div style={{ paddingLeft: 32, display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
              <Link href="/dashboard/templates" onClick={onClose} className={`nav-item ${pathname === '/dashboard/templates' ? 'active' : ''}`} style={{ padding: '8px 12px', fontSize: 13, minHeight: 'auto' }}>
                Email Templates
              </Link>
              <Link href="/dashboard/email-settings" onClick={onClose} className={`nav-item ${pathname === '/dashboard/email-settings' ? 'active' : ''}`} style={{ padding: '8px 12px', fontSize: 13, minHeight: 'auto' }}>
                Email Design
              </Link>
            </div>
          )}
        </div>

        {/* Booking Funnels Expandable */}
        <div style={{ marginTop: 'auto' }}>
          <button 
            onClick={() => setBookingExpanded(!bookingExpanded)} 
            className={`nav-item ${pathname.includes('booking') || pathname.includes('questionnaire') || pathname.includes('portrait') ? "active" : ""}`}
            style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <ExternalLink size={18} strokeWidth={2} />
              Booking Funnels
            </div>
            <span style={{ fontSize: 12 }}>{bookingExpanded ? '▼' : '▶'}</span>
          </button>
          
          {bookingExpanded && (
            <div style={{ paddingLeft: 32, display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
              <Link href="/dashboard/questionnaire" onClick={onClose} className={`nav-item ${pathname === '/dashboard/questionnaire' ? 'active' : ''}`} style={{ padding: '8px 12px', fontSize: 13, minHeight: 'auto' }}>
                Questionnaire Builder
              </Link>
              <Link href="/dashboard/portrait-settings" onClick={onClose} className={`nav-item ${pathname === '/dashboard/portrait-settings' ? 'active' : ''}`} style={{ padding: '8px 12px', fontSize: 13, minHeight: 'auto' }}>
                Portrait Funnel Settings
              </Link>
              <Link href="/dashboard/booking" onClick={onClose} className={`nav-item ${pathname === '/dashboard/booking' ? 'active' : ''}`} style={{ padding: '8px 12px', fontSize: 13, minHeight: 'auto' }}>
                Wedding Funnel Settings
              </Link>
              <Link href={userId ? `/booking?userId=${userId}` : '/booking'} onClick={onClose} target="_blank" className={`nav-item ${pathname === '/booking' ? 'active' : ''}`} style={{ padding: '8px 12px', fontSize: 13, minHeight: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Live Wedding Funnel</span>
                <ExternalLink size={14} style={{ opacity: 0.5 }} />
              </Link>
              <Link href={userId ? `/portrait/inquiry?userId=${userId}` : '/portrait/inquiry'} onClick={onClose} className={`nav-item ${pathname === '/portrait/inquiry' ? 'active' : ''}`} style={{ padding: '8px 12px', fontSize: 13, minHeight: 'auto' }}>
                Live Portrait Funnel
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
