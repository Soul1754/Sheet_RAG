"use client";

import { ChatInterface } from "@/components/chat-interface";
import { AdminPanel } from "@/components/admin-panel";
import { PapersLibrary } from "@/components/papers-library";
import { ChatHistory } from "@/components/chat-history";
import { AppShell } from "@/components/app-shell";
import { 
  Sparkles, 
  MessageSquare
} from "lucide-react";

export default function Home() {
  const sidebarContent = (
    <div className="space-y-6">
      <div>
        <div className="px-3 mb-2">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Core Terminal</span>
        </div>
        <div className="space-y-1">
          <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-primary text-white shadow-lg shadow-primary/20 w-full text-left transition-all">
            <MessageSquare className="w-5 h-5" />
            <span className="text-sm font-semibold tracking-tight">Active Synthesis</span>
          </button>
          <ChatHistory />
        </div>
      </div>

      <div>
        <div className="px-3 mb-2">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Knowledge Matrix</span>
        </div>
        <div className="space-y-1">
          <PapersLibrary />
          <AdminPanel />
        </div>
      </div>

      <div className="pt-6 border-t border-border mt-auto">
        <div className="px-4 py-4 rounded-2xl bg-primary/5 border border-primary/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <span className="text-xs font-black tracking-tight">Pro Engine</span>
          </div>
          <p className="text-[10px] text-muted-foreground leading-relaxed font-medium">
            Graph-RAG active. 4.2k tokens processed in current session.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <AppShell sidebar={sidebarContent}>
      <div className="w-full h-full flex flex-col">
        <ChatInterface />
      </div>
    </AppShell>
  );
}

