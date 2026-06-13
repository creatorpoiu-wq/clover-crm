"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import NotificationBell from "@/components/NotificationBell";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="dashboard-layout">
      {/* Mobile overlay */}
      <div 
        className={`mobile-overlay ${isSidebarOpen ? "open" : ""}`} 
        onClick={() => setIsSidebarOpen(false)}
      ></div>

      {/* Mobile toggle button */}
      <button 
        className="mobile-menu-btn"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        aria-label="Toggle Menu"
      >
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar with open state prop */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      {/* Top bar */}
      <header className="fixed top-0 right-0 h-14 bg-[var(--background)] border-b border-[var(--border)] flex items-center justify-end px-6 z-40 gap-2 left-0 lg:left-[260px] transition-all duration-300">
        <NotificationBell />
      </header>

      <main className="main-content" style={{ paddingTop: "calc(56px + 2rem)" }}>
        <div className="dashboard-container">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              style={{ minHeight: "100%" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
