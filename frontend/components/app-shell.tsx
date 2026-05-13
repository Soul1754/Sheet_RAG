"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Menu, X, Search, Settings,
  Sparkles, Bell, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  rightDrawer?: React.ReactNode;
  header?: React.ReactNode;
}

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick?: () => void;
  collapsed: boolean;
}

export function AppShell({ children, sidebar, rightDrawer }: AppShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isRightDrawerOpen, setIsRightDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle responsive sidebar defaults
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="relative min-h-screen bg-background flex flex-col lg:flex-row overflow-x-hidden no-x-scroll">
      {/* --- MOBILE SIDEBAR OVERLAY --- */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100] lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-[280px] bg-white z-[101] lg:hidden flex flex-col shadow-2xl h-screen h-[100dvh]"
            >
              <div className="h-14 px-5 border-b border-border flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full transition-all duration-500" />
                    <div className="relative w-7 h-7 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <span className="font-bold tracking-tight text-[13px] uppercase text-foreground/80">Research Assistant</span>
                </div>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)} 
                  className="p-2 hover:bg-black/5 rounded-xl transition-colors premium-button"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-3 min-h-0">
                {sidebar}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* --- DESKTOP SIDEBAR --- */}
      <motion.aside
        animate={{ width: isSidebarOpen ? 260 : 70 }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className={cn(
          "hidden lg:flex flex-col bg-white border-r border-border relative z-50 h-screen sticky top-0 shrink-0",
          !isSidebarOpen && "items-center"
        )}
      >
        <div className="h-14 flex items-center px-5 shrink-0 w-full border-b border-transparent">
          <AnimatePresence mode="wait">
            {isSidebarOpen ? (
              <motion.div
                key="full-logo"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                className="flex items-center gap-3"
              >
                <div className="relative group">
                  <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full group-hover:bg-primary/30 transition-all duration-500" />
                  <div className="relative w-7 h-7 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                </div>
                <span className="font-bold tracking-tight text-[13px] uppercase text-foreground/80 truncate">Research Assistant</span>
              </motion.div>
            ) : (
              <motion.div
                key="mini-logo"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="relative group mx-auto"
              >
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full group-hover:bg-primary/30 transition-all duration-500" />
                <div className="relative w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-4 w-full min-h-0">
          {sidebar}
        </div>

        <div className="p-3 border-t border-border shrink-0 w-full bg-white">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-full h-9 flex items-center justify-center rounded-lg hover:bg-black/5 transition-all premium-button group"
            aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            <ChevronRight className={cn("w-4 h-4 text-muted-foreground group-hover:text-primary transition-transform duration-300", isSidebarOpen && "rotate-180")} />
          </button>
        </div>
      </motion.aside>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 flex flex-col relative min-w-0 h-screen h-[100dvh] bg-background overflow-hidden">
        {/* --- HEADER --- */}
        <header 
          className={cn(
            "h-14 flex items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 sticky top-0 z-40 transition-all duration-300 shrink-0",
            scrolled ? "bg-white/80 backdrop-blur-md border-b border-border shadow-sm" : "bg-transparent"
          )}
        >
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 hover:bg-black/5 rounded-lg shrink-0 premium-button"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            {/* --- RESPONSIVE SEARCH BAR --- */}
            <div className="flex items-center gap-3 px-3.5 py-2 bg-black/5 rounded-xl border border-transparent hover:border-border/60 hover:bg-white hover:shadow-premium transition-all duration-300 cursor-pointer group flex-1 max-w-[40px] xs:max-w-[140px] sm:max-w-[220px] md:max-w-md min-w-0 overflow-hidden sm:overflow-visible emerald-border-glow">
              <Search className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary transition-all duration-300 shrink-0" />
              <span className="text-xs text-muted-foreground/50 font-semibold truncate hidden xs:inline">Search files...</span>
              <div className="ml-auto hidden md:flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-2 group-hover:translate-x-0">
                <kbd className="px-1.5 py-0.5 rounded bg-black/5 text-[9px] font-bold border border-border/50 text-muted-foreground/60">⌘</kbd>
                <kbd className="px-1.5 py-0.5 rounded bg-black/5 text-[9px] font-bold border border-border/50 text-muted-foreground/60">K</kbd>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="flex items-center gap-0.5">
              <button className="p-2 hover:bg-black/5 rounded-lg text-muted-foreground hover:text-primary transition-all premium-button" aria-label="Notifications">
                <Bell className="w-4.5 h-4.5" />
              </button>
              <button className="hidden sm:block p-2 hover:bg-black/5 rounded-lg text-muted-foreground hover:text-primary transition-all premium-button" aria-label="Settings">
                <Settings className="w-4.5 h-4.5" />
              </button>
            </div>
            
            <div className="h-5 w-px bg-border mx-1 hidden xs:block" />
            
            {/* --- ACCOUNT SECTION --- */}
            <button className="flex items-center gap-2 pl-1 pr-1 sm:pr-3 py-1 bg-white border border-border rounded-full hover:shadow-md hover:border-primary/20 transition-all premium-button">
              <div className="w-6.5 h-6.5 rounded-full bg-gradient-to-tr from-primary to-primary/60 flex items-center justify-center text-[10px] font-bold text-white uppercase shrink-0 shadow-sm">
                JD
              </div>
              <span className="text-xs font-semibold hidden md:inline truncate max-w-[80px]">Account</span>
            </button>
          </div>
        </header>

        {/* --- WORKSPACE --- */}
        <main className="flex-1 relative min-h-0 flex flex-col">
          {children}
        </main>
      </div>

      {/* --- RIGHT DRAWER --- */}
      <AnimatePresence>
        {isRightDrawerOpen && (
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed lg:sticky lg:top-0 right-0 bottom-0 w-full sm:w-[380px] lg:w-[420px] bg-white border-l border-border z-[102] lg:z-40 flex flex-col shadow-2xl lg:shadow-none h-screen h-[100dvh]"
          >
            <div className="h-16 flex items-center justify-between px-6 border-b border-border shrink-0">
              <span className="font-bold uppercase tracking-widest text-[10px] text-muted-foreground">Details</span>
              <button onClick={() => setIsRightDrawerOpen(false)} className="p-2 hover:bg-black/5 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 overscroll-contain momentum-scroll">
              {rightDrawer}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}

export function SidebarItem({ icon: Icon, label, active, onClick, collapsed }: { icon: React.ElementType, label: string, active?: boolean, onClick?: () => void, collapsed: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 group relative premium-button",
        active 
          ? "bg-primary/10 text-primary" 
          : "text-muted-foreground hover:bg-black/5 hover:text-foreground"
      )}
      aria-current={active ? "page" : undefined}
    >
      <Icon className={cn("w-5 h-5 shrink-0", active ? "text-primary" : "group-hover:text-primary transition-colors")} />
      {!collapsed && (
        <span className="text-sm font-semibold tracking-tight truncate">{label}</span>
      )}
      {active && !collapsed && (
        <motion.div 
          layoutId="active-indicator"
          className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(0,163,108,0.4)]"
        />
      )}
      {active && collapsed && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
      )}
    </button>
  );
}
