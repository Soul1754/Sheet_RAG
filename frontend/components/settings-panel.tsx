"use client";

import { useState, useEffect } from "react";
import { 
  Settings, Moon, Sun, Monitor, 
  Trash2, Download, Shield, Info, 
  RefreshCw, Zap, Sparkles, ChevronRight
} from "lucide-react";
import { 
  Sheet, SheetContent, SheetDescription, 
  SheetHeader, SheetTitle, SheetTrigger 
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

import { useSettings } from "@/lib/settings-context";
import { api } from "@/lib/api";

export function SettingsPanel() {
  const { settings, updateSettings, resetSettings } = useSettings();
  const [isExporting, setIsExporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await api.getPapers();
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `research-index-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    } catch (e) {
      console.error("Export failed", e);
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearCache = async () => {
    if (!confirm("Are you sure? This will clear all local settings and reset the interface. Indexed files on the server will remain.")) return;
    setIsClearing(true);
    resetSettings();
    localStorage.clear();
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="hidden xs:block p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-primary transition-all premium-button">
          <Settings className="w-5 h-5" />
        </button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md bg-card border-l border-border p-0 flex flex-col shadow-2xl">
        <div className="p-6 border-b border-border bg-muted/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center shadow-inner border border-border/50">
              <Settings className="w-6 h-6 text-secondary-foreground" />
            </div>
            <div>
              <SheetTitle className="text-xl font-bold tracking-tight">System Settings</SheetTitle>
              <SheetDescription className="text-[9px] font-bold text-primary/60 uppercase tracking-[0.2em] mt-1">Configure your workspace</SheetDescription>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
          {/* --- APPEARANCE --- */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Monitor className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Appearance</h3>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'light', icon: Sun, label: 'Light' },
                { id: 'dark', icon: Moon, label: 'Dark' },
                { id: 'system', icon: Monitor, label: 'System' }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => updateSettings({ theme: item.id as any })}
                  aria-label={`Switch to ${item.label} theme`}
                  aria-pressed={settings.theme === item.id}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-300 premium-button outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-primary",
                    settings.theme === item.id 
                      ? "bg-primary/10 border-primary text-primary shadow-sm" 
                      : "bg-background border-border text-muted-foreground hover:bg-muted/50 hover:border-primary/30"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-wider">{item.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* --- DATA MANAGEMENT --- */}
          <section className="space-y-4 pt-4 border-t border-border/50">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Data & Security</h3>
            </div>
            <div className="space-y-2">
              <button 
                onClick={handleExport}
                disabled={isExporting}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-muted/60 border border-border/40 hover:bg-muted transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold">Export Workspace</span>
                    <span className="text-[10px] text-muted-foreground/60">Download all research data</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:translate-x-1 transition-transform" />
              </button>

              <button 
                onClick={handleClearCache}
                disabled={isClearing}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-destructive/5 border border-destructive/10 hover:bg-destructive/10 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive">
                    {isClearing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 group-hover:rotate-12 transition-transform" />}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-destructive">Clear Workspace Cache</span>
                    <span className="text-[10px] text-destructive/60">Permanently delete local research data</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-destructive/30 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </section>

          <div className="pt-8 flex flex-col items-center gap-3">
             <div className="flex items-center gap-2 px-3 py-1 bg-muted/5 rounded-full border border-border/40">
                <Info className="w-3 h-3 text-muted-foreground/40" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40">Research Assistant v2.5.0</span>
             </div>
             <p className="text-[9px] text-muted-foreground/30 font-medium">Graph-RAG Intelligence Terminal</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
