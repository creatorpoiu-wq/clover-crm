"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { 
  LayoutDashboard, Kanban, Calendar, FileText, Database, Settings, LogOut, 
  MailOpen, ExternalLink, DollarSign, Package, Zap, MessageCircle, PieChart, 
  Clock, ChevronDown, ChevronUp, Users, PenTool, LayoutTemplate, HelpCircle, User, X, Image as ImageIcon
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

type NavItem = {
  name: string;
  href?: string;
  icon?: any;
  subItems?: { name: string; href: string; external?: boolean }[];
};

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [companyName, setCompanyName] = useState("Clover");
  const [businessLogo, setBusinessLogo] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  // Expanded states for accordions
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/login");
        return;
      }
      setUserId(user.id);
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

  const toggleExpand = (name: string) => {
    setExpanded(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const topGroup: NavItem[] = [
    { name: "Home", href: "/dashboard", icon: LayoutDashboard },
    { name: "Projects", href: "/dashboard/pipeline", icon: Kanban },
    { name: "Calendar", href: "/dashboard/calendar", icon: Calendar },
  ];

  const middleGroup: NavItem[] = [
    { name: "Contacts", href: "/dashboard/contacts", icon: Users },
    { name: "Galleries", href: "/dashboard/galleries", icon: ImageIcon },
    { 
      name: "Lead capture", icon: Zap,
      subItems: [
        { name: "Inbox & Hub", href: "/dashboard/hub" },
        { name: "Forms", href: "/dashboard/forms" },
        { name: "Email Campaigns", href: "/dashboard/marketing" },
      ]
    },
    { 
      name: "Files", icon: FileText,
      subItems: [
        { name: "Documents", href: "/dashboard/finance" },
      ]
    },
    { 
      name: "Booking", icon: Package,
      subItems: [
        { name: "Booking Submissions", href: "/dashboard/bookings" },
        { name: "Custom Proposals", href: "/dashboard/proposals" },
        { name: "Services", href: "/dashboard/services" },
        { name: "Portrait Funnel Settings", href: "/dashboard/portrait-settings" },
        { name: "Wedding Funnel Settings", href: "/dashboard/booking" },
        { name: "Questionnaire Builder", href: "/dashboard/questionnaire" },
        { name: "Live Wedding Funnel", href: userId ? `/booking?userId=${userId}` : '/booking', external: true },
        { name: "Live Portrait Funnel", href: userId ? `/portrait/inquiry?userId=${userId}` : '/portrait/inquiry', external: true }
      ]
    },
    { 
      name: "Templates", icon: LayoutTemplate,
      subItems: [
        { name: "Email Templates", href: "/dashboard/templates" },
        { name: "Email Design", href: "/dashboard/email-settings" },
      ]
    },
    { 
      name: "Finance", icon: DollarSign,
      subItems: [
        { name: "Overview & Invoices", href: "/dashboard/finance" }
      ]
    },
    { 
      name: "Tools", icon: PenTool,
      subItems: [
        { name: "Team", href: "/dashboard/agents" },
        { name: "Meetings", href: "/dashboard/meetings" },
        { name: "Availability", href: "/dashboard/settings/scheduling" }
      ]
    },
    { 
      name: "Automations", icon: Zap,
      subItems: [
        { name: "All", href: "/dashboard/automations" },
        { name: "Activity", href: "/dashboard/automations#activity" }
      ]
    },
    { name: "Reports", href: "/dashboard/reports", icon: PieChart },
  ];

  const renderNavGroup = (items: NavItem[]) => {
    return items.map((item) => {
      const Icon = item.icon;
      
      if (item.subItems) {
        // Accordion Item
        const isExpanded = expanded[item.name];
        const isChildActive = item.subItems.some(sub => pathname.startsWith(sub.href.split('?')[0]) && sub.href !== '/dashboard');
        
        // Auto-expand if a child is active and we haven't manually toggled it
        // (Just a UX nicety, but let's keep it simple with state)
        
        return (
          <div key={item.name} style={{ display: 'flex', flexDirection: 'column' }}>
            <button 
              onClick={() => toggleExpand(item.name)} 
              className={`nav-item ${isChildActive && !isExpanded ? "active" : ""}`}
              style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', padding: '10px 16px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {Icon && <Icon size={18} strokeWidth={2} />}
                {item.name}
              </div>
              <span style={{ display: 'flex', alignItems: 'center', opacity: 0.5 }}>
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </span>
            </button>
            
            {isExpanded && (
              <div style={{ display: 'flex', flexDirection: 'column', marginTop: '2px', marginBottom: '4px' }}>
                {item.subItems.map(sub => {
                  const isActive = pathname === sub.href.split('?')[0];
                  return (
                    <Link 
                      key={sub.name} 
                      href={sub.href} 
                      onClick={onClose}
                      target={sub.external ? "_blank" : undefined}
                      className={`sub-nav-item ${isActive ? 'active' : ''}`}
                    >
                      <span>{sub.name}</span>
                      {sub.external && <ExternalLink size={12} style={{ opacity: 0.4 }} />}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      }

      // Standard Item
      const isActive = item.href ? pathname === item.href.split('?')[0] : false;
      return (
        <Link
          key={item.name}
          href={item.href || '#'}
          onClick={onClose}
          className={`nav-item ${isActive ? "active" : ""}`}
          style={{ padding: '10px 16px' }}
        >
          {Icon && <Icon size={18} strokeWidth={2} />}
          {item.name}
        </Link>
      );
    });
  };

  return (
    <div className={`sidebar ${isOpen ? "open" : ""}`}>
      <div className="sidebar-header" style={{ padding: '24px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {businessLogo ? (
          <div style={{ display: 'flex', alignItems: 'center', height: '32px' }}>
            <img src={businessLogo} alt={companyName} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
          </div>
        ) : (
          <h1 className="sidebar-title" style={{ fontSize: '1.5rem', margin: 0 }}>
            {companyName.toLowerCase()}<span style={{ color: '#4da685' }}>.</span>
          </h1>
        )}
        <button onClick={onClose} className="mobile-only p-1 text-[var(--muted)] hover:text-[var(--foreground)] bg-transparent border-none cursor-pointer flex items-center justify-center">
          <X size={24} />
        </button>
      </div>

      <nav className="sidebar-nav" style={{ padding: '0 12px 24px', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
        {renderNavGroup(topGroup)}
        
        <hr style={{ margin: '12px 16px', border: 'none', borderTop: '1px solid var(--border)', opacity: 0.6 }} />
        
        {renderNavGroup(middleGroup)}
      </nav>

      <div className="sidebar-footer" style={{ padding: '12px', marginTop: 'auto', borderTop: 'none' }}>
        <Link href="#" onClick={onClose} className="sidebar-btn" style={{ textDecoration: "none", padding: '10px 16px' }}>
          <HelpCircle size={18} />
          Resources
        </Link>
        <Link href="/dashboard/settings" onClick={onClose} className="sidebar-btn" style={{ textDecoration: "none", padding: '10px 16px' }}>
          <Settings size={18} />
          Settings
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', marginTop: '8px', borderTop: '1px solid var(--border)' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', marginRight: '12px' }}>
            <User size={16} />
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>Admin</span>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Logout</span>
          </div>
          <button onClick={handleLogout} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: '4px' }}>
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
