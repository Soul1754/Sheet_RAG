"use client";

import { ChatInterface } from "@/components/chat-interface";
import { AdminPanel } from "@/components/admin-panel";
import { PapersLibrary } from "@/components/papers-library";
import { AppShell } from "@/components/app-shell";
import { 
  Sparkles,
  MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";

import { useSidebar } from "@/lib/sidebar-context";

function SidebarContent() {
  const { isOpen } = useSidebar();
  
  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="space-y-6">
        <div>
          {isOpen && (
            <div className="px-3 mb-2">
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">Menu</span>
            </div>
          )}
          <div className="space-y-1">
            <button className={cn(
              "flex items-center px-3 py-2.5 rounded-xl bg-primary/10 text-primary shadow-sm w-full text-left transition-all premium-button group",
              isOpen ? "gap-2.5" : "justify-center"
            )}>
              <MessageSquare className="w-5 h-5 shrink-0" />
              {isOpen && (
                <>
                  <span className="text-sm font-semibold tracking-tight">Chat</span>
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(0,163,108,0.4)]" />
                </>
              )}
            </button>
          </div>
        </div>

        <div>
          {isOpen && (
            <div className="px-3 mb-2">
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">Files</span>
            </div>
          )}
          <div className="space-y-1">
            <PapersLibrary />
            <AdminPanel />
          </div>
        </div>
      </div>

      <div className="mt-auto pt-6">
        {isOpen ? (
          <div className="px-4 py-4 rounded-xl bg-primary/5 border border-primary/10 relative overflow-hidden group">
            <div className="absolute -right-3 -top-3 w-12 h-12 bg-primary/5 rounded-full blur-xl group-hover:bg-primary/10 transition-all" />
            <div className="flex items-center gap-2.5 mb-2 relative z-10">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="text-[11px] font-bold tracking-tight">Advanced Search On</span>
            </div>
            <p className="text-[10px] text-muted-foreground/60 leading-relaxed font-medium relative z-10">
              We&apos;re using extra layers to get you better answers.
            </p>
          </div>
        ) : (
          <div className="w-10 h-10 mx-auto rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center group hover:bg-primary/10 transition-all cursor-help relative">
             <Sparkles className="w-5 h-5 text-primary" />
             <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-primary shadow-[0_0_5px_rgba(0,163,108,0.5)]" />
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <AppShell sidebar={<SidebarContent />}>
      <div className="w-full h-full flex flex-col">
        <ChatInterface />
      </div>
    </AppShell>
  );
}

