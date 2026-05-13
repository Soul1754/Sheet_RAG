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
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-[280px] bg-white border-r border-border z-[101] lg:hidden flex flex-col shadow-2xl h-screen h-[100dvh]"
            >
              <div className="p-6 border-b border-border flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-black tracking-tighter text-lg">ALPHA</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 hover:bg-black/5 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 overscroll-contain momentum-scroll">
                {sidebar}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* --- DESKTOP SIDEBAR --- */}
      <motion.aside
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className={cn(
          "hidden lg:flex flex-col bg-white/50 backdrop-blur-xl border-r border-border relative z-50 h-screen sticky top-0",
          !isSidebarOpen && "items-center"
        )}
      >
        <div className="p-6 flex items-center justify-between overflow-hidden whitespace-nowrap shrink-0">
          <AnimatePresence mode="wait">
            {isSidebarOpen ? (
              <motion.div
                key="full-logo"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="font-black tracking-tighter text-lg">RESEARCH OS</span>
              </motion.div>
            ) : (
              <motion.div
                key="mini-logo"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg"
              >
                <Sparkles className="w-6 h-6 text-white" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-2 space-y-1 overscroll-contain momentum-scroll">
          {sidebar}
        </div>

        <div className="p-4 border-t border-border shrink-0">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-full h-10 flex items-center justify-center rounded-lg hover:bg-black/5 transition-colors"
          >
            <ChevronRight className={cn("w-5 h-5 transition-transform duration-300", isSidebarOpen && "rotate-180")} />
          </button>
        </div>
      </motion.aside>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 flex flex-col relative min-w-0 min-h-screen">
        {/* --- HEADER --- */}
        <header 
          className={cn(
            "h-16 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-40 transition-all duration-300 shrink-0",
            scrolled ? "bg-white/80 backdrop-blur-md border-b border-border shadow-sm" : "bg-transparent"
          )}
        >
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 hover:bg-black/5 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-black/5 rounded-full border border-black/5 hover:bg-black/10 transition-all cursor-pointer group">
              <Search className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-xs text-muted-foreground font-medium">Search Intelligence Vault...</span>
              <div className="ml-2 flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-white text-[10px] font-bold border border-border shadow-sm">⌘</kbd>
                <kbd className="px-1.5 py-0.5 rounded bg-white text-[10px] font-bold border border-border shadow-sm">K</kbd>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-4">
            <div className="hidden md:flex items-center gap-1 mr-2">
              <button className="p-2 hover:bg-black/5 rounded-lg text-muted-foreground hover:text-primary transition-all">
                <Bell className="w-5 h-5" />
              </button>
              <button className="p-2 hover:bg-black/5 rounded-lg text-muted-foreground hover:text-primary transition-all">
                <Settings className="w-5 h-5" />
              </button>
            </div>
            <div className="h-8 w-px bg-border mx-1 hidden md:block" />
            <button className="flex items-center gap-2 pl-1 pr-3 py-1 bg-white border border-border rounded-full hover:shadow-md transition-all">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-[10px] font-bold text-white uppercase">
                JD
              </div>
              <span className="text-sm font-semibold hidden sm:inline">Research Lead</span>
            </button>
          </div>
        </header>

        {/* --- WORKSPACE --- */}
        <main className="flex-1 relative bg-noise/5 min-h-0 flex flex-col">
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
              <span className="font-bold uppercase tracking-widest text-[10px] text-muted-foreground">Context Intelligence</span>
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
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group relative",
        active 
          ? "bg-primary text-white shadow-lg shadow-primary/20" 
          : "text-muted-foreground hover:bg-black/5 hover:text-foreground"
      )}
    >
      <Icon className={cn("w-5 h-5", active ? "text-white" : "group-hover:text-primary transition-colors")} />
      {!collapsed && (
        <span className="text-sm font-semibold tracking-tight">{label}</span>
      )}
      {active && !collapsed && (
        <motion.div 
          layoutId="active-pill"
          className="ml-auto w-1.5 h-1.5 rounded-full bg-white/50"
        />
      )}
    </button>
  );
}
