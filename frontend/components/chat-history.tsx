"use client";

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, Trash2, RefreshCw, User, Bot, MessageSquare, Clock, ArrowRight, Zap } from 'lucide-react';

interface Message {
    role: string;
    content: string;
    timestamp: string;
}

export function ChatHistory() {
    const [history, setHistory] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const conversationId = 'default';

    const loadHistory = async () => {
        setLoading(true);
        try {
            const res = await api.getChatHistory(conversationId);
            setHistory(res.data.history || []);
        } catch (error) { console.error('Error loading history:', error); }
        setLoading(false);
    };

    useEffect(() => {
        loadHistory();
    }, []);

    const handleClear = async () => {
        if (!confirm('Obliterate all transmission logs from this terminal matrix?')) return;
        try {
            await api.clearChatHistory(conversationId);
            setHistory([]);
        } catch (error) { console.error('Error clearing history:', error); }
    };

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="w-12 h-12 rounded-full hover:bg-primary/10 text-muted-foreground/30 hover:text-primary transition-all active-compress">
                    <History className="w-6 h-6" />
                </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-3xl bg-background/80 backdrop-blur-3xl border-l border-white/40 p-0 physics-spring">
                <div className="h-full flex flex-col pt-16">
                    {/* Header */}
                    <div className="px-12 flex items-center justify-between gap-6 mb-12 stagger-children">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-[2rem] bg-secondary flex items-center justify-center shadow-premium border border-white/50">
                                <Clock className="w-8 h-8 text-secondary-foreground" />
                            </div>
                            <div>
                                <SheetTitle className="text-4xl font-black tracking-tighter">Transmission Archive</SheetTitle>
                                <SheetDescription className="text-base font-black text-primary/40 uppercase tracking-[0.2em] mt-1">Neural Interaction Sequence</SheetDescription>
                            </div>
                        </div>
                    </div>

                    <div className="px-12 space-y-10 flex-1 flex flex-col min-h-0 stagger-children">
                        {/* Matrix Control Bar */}
                        <div className="flex gap-4 justify-between items-center surface-panel p-3 rounded-[2rem] border-white/60 shadow-premium grow-0 stagger-1">
                            <div className="flex items-center gap-3 px-5">
                                <Zap className="w-4 h-4 text-primary opacity-40" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Log Integrity Active</span>
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={loadHistory} variant="ghost" className="h-12 rounded-[1.25rem] hover:bg-primary/10 text-primary font-black text-xs uppercase tracking-widest px-6 active-compress">
                                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                    SYNC
                                </Button>
                                <Button
                                    onClick={handleClear}
                                    variant="ghost"
                                    className="h-12 rounded-[1.25rem] hover:bg-destructive/10 text-destructive font-black text-xs uppercase tracking-widest px-6 active-compress"
                                    disabled={history.length === 0}
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    PURGE
                                </Button>
                            </div>
                        </div>

                        {/* Sequential Timeline */}
                        <ScrollArea className="flex-1 -mr-6 pr-6 pb-20 stagger-2">
                            {history.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-40 text-center opacity-10">
                                    <MessageSquare className="w-24 h-24 mb-8" />
                                    <p className="text-sm font-black uppercase tracking-[0.5em]">No Log Data</p>
                                </div>
                            ) : (
                                <div className="space-y-12 relative before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-px before:bg-foreground/5">
                                    {history.map((msg, idx) => (
                                        <div key={idx} className="relative pl-16 group/log animate-slide-up" style={{ animationDelay: `${idx * 60}ms` }}>
                                            {/* Node Indicator */}
                                            <div className={`absolute left-0 top-1 w-10 h-10 rounded-2xl flex items-center justify-center shadow-premium border transition-all z-10 scale-100 group-hover/log:scale-110 physics-spring ${
                                                msg.role === 'user' 
                                                ? 'bg-secondary border-secondary-foreground/10 text-secondary-foreground underline-offset-4' 
                                                : 'bg-white border-foreground/5 text-primary shadow-emerald-glow'
                                            }`}>
                                                {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex items-center gap-4">
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">{msg.role}</span>
                                                    <div className="h-px flex-1 bg-foreground/5" />
                                                    <span className="text-[10px] font-black text-muted-foreground/20 italic">
                                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                    </span>
                                                </div>
                                                <div className={`p-8 rounded-[2.5rem] border border-white/60 shadow-premium transition-all physics-spring group-hover/log:bg-white ${
                                                    msg.role === 'user' ? 'bg-secondary/20' : 'bg-white/40'
                                                }`}>
                                                    <p className="text-sm font-medium leading-relaxed text-foreground/80 whitespace-pre-wrap tracking-tight line-clamp-4 group-hover/log:line-clamp-none transition-all">
                                                        {msg.content}
                                                    </p>
                                                    <div className="mt-6 flex justify-end opacity-20 group-hover/log:opacity-100 transition-opacity">
                                                        <ArrowRight className="w-4 h-4 text-primary" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
