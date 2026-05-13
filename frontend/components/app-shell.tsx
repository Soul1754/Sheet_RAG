"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Menu, X,
  Sparkles, ChevronRight, Share, Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SidebarProvider, useSidebar } from "@/lib/sidebar-context";

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
  return (
    <SidebarProvider>
      <AppShellContent sidebar={sidebar} rightDrawer={rightDrawer}>
        {children}
      </AppShellContent>
    </SidebarProvider>
  );
}

import { SettingsPanel } from "./settings-panel";
import { AccountMenu } from "./account-menu";

function AppShellContent({ children, sidebar, rightDrawer }: AppShellProps) {
  const { isOpen, setIsOpen, toggle } = useSidebar();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isRightDrawerOpen, setIsRightDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isShared, setIsShared] = useState(false);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsShared(true);
    setTimeout(() => setIsShared(false), 2000);
  };

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
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
              className="fixed left-0 top-0 bottom-0 w-[280px] bg-card border-r border-border z-[101] lg:hidden flex flex-col shadow-2xl h-screen h-[100dvh]"
            >
              <div className="p-6 border-b border-border flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-black tracking-tighter text-lg uppercase">Assistant</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 hover:bg-muted rounded-lg">
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
        animate={{ width: isOpen ? 280 : 80 }}
        transition={{ type: "spring", damping: 20, stiffness: 100 }}
        className={cn(
          "hidden lg:flex flex-col bg-card/50 backdrop-blur-xl border-r border-border relative z-50 h-screen sticky top-0 transition-colors duration-500",
          !isOpen && "items-center"
        )}
      >
        <div className={cn(
          "p-6 flex items-center justify-between overflow-hidden whitespace-nowrap shrink-0 w-full",
          !isOpen && "justify-center px-0"
        )}>
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="full-logo"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="font-black tracking-tighter text-lg uppercase">AI Research</span>
              </motion.div>
            ) : (
              <motion.div
                key="mini-logo"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg hover:rotate-12 transition-transform cursor-pointer"
                onClick={toggle}
              >
                <Sparkles className="w-6 h-6 text-white" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className={cn(
          "flex-1 overflow-y-auto custom-scrollbar px-4 py-2 space-y-1 overscroll-contain momentum-scroll w-full",
          !isOpen && "px-2"
        )}>
          {sidebar}
        </div>

        <div className="p-4 border-t border-border shrink-0 w-full flex justify-center">
          <button 
            onClick={toggle}
            className="w-full h-10 flex items-center justify-center rounded-lg hover:bg-black/5 transition-colors group"
          >
            <ChevronRight className={cn("w-5 h-5 transition-transform duration-500 text-muted-foreground group-hover:text-primary", isOpen && "rotate-180")} />
          </button>
        </div>
      </motion.aside>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 flex flex-col relative min-w-0 h-screen h-[100dvh] overflow-hidden">
        {/* --- HEADER --- */}
        <header 
          className={cn(
            "h-16 flex items-center justify-between gap-2 px-2 sm:px-4 lg:px-8 sticky top-0 z-40 transition-all duration-300 shrink-0",
            scrolled ? "bg-card/80 backdrop-blur-md border-b border-border shadow-sm" : "bg-transparent"
          )}
        >
          <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 hover:bg-muted rounded-lg shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>
            
          </div>

          <div className="flex items-center gap-1 sm:gap-2 lg:gap-4 shrink-0">
            {/* --- ICONS --- */}
            <div className="flex items-center gap-0.5 sm:gap-1">
              <button 
                onClick={handleShare}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-muted rounded-xl text-muted-foreground hover:text-primary transition-all premium-button group relative"
              >
                {isShared ? (
                  <Check className="w-4.5 h-4.5 text-primary" />
                ) : (
                  <Share className="w-4.5 h-4.5 group-hover:scale-110 transition-transform" />
                )}
                <span className="text-[10px] font-bold uppercase tracking-widest hidden xs:block">
                  {isShared ? 'Copied!' : 'Share'}
                </span>
              </button>
              <SettingsPanel />
            </div>
            
            <div className="h-6 w-px bg-border mx-1 hidden sm:block" />
            
            {/* --- ACCOUNT SECTION --- */}
            <AccountMenu />
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
