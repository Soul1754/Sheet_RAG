"use client";

import { ChatInterface } from "@/components/chat-interface";
import { AdminPanel } from "@/components/admin-panel";
import { PapersLibrary } from "@/components/papers-library";
import { ChatHistory } from "@/components/chat-history";
import { Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-start py-12 px-6 md:px-12 overflow-x-hidden">
      
      {/* Dynamic Header System */}
      <header className="w-full max-w-6xl flex justify-between items-center mb-12 animate-in fade-in slide-in-from-top-4 duration-1000 physics-spring">
        <div className="flex items-center gap-4 group cursor-pointer">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-premium scale-100 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 physics-spring">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-black tracking-tighter leading-none">THE RESEARCH ASSISTANT</h1>
            <span className="text-[10px] uppercase tracking-[0.4em] font-black text-primary/40 mt-1">Research Engine Alpha</span>
          </div>
        </div>

        <nav className="flex items-center gap-3 bg-white/20 backdrop-blur-xl p-1.5 rounded-full border border-white/60 shadow-premium">
          <ChatHistory />
          <div className="w-px h-6 bg-foreground/10 mx-1" />
          <PapersLibrary />
          <AdminPanel />
        </nav>
      </header>

      {/* Main OS Surface */}
      <main className="w-full flex-1 flex flex-col items-center justify-center">
        <ChatInterface />
      </main>

      {/* Ambient Footer Detail */}
      <footer className="mt-20 py-8 text-center animate-in fade-in duration-1000">
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground/20">
          Powered by Hierarchical Graph Retrieval & Neural Synthesis
        </p>
      </footer>
    </div>
  );
}
