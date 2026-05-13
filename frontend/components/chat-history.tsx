"use client";

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, Trash2, RefreshCw, User, Bot, MessageSquare, Clock, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

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
        const fetchHistory = async () => {
            await loadHistory();
        };
        fetchHistory();
    }, []);

    const handleClear = async () => {
        if (!confirm('Obliterate all transmission logs?')) return;
        try {
            await api.clearChatHistory(conversationId);
            setHistory([]);
        } catch (error) { console.error('Error clearing history:', error); }
    };

    return (
        <Sheet>
            <SheetTrigger asChild>
                <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:bg-black/5 hover:text-foreground transition-all w-full text-left">
                    <History className="w-5 h-5" />
                    <span className="text-sm font-semibold tracking-tight">Transmission Logs</span>
                </button>
            </SheetTrigger>
            <SheetContent 
                side="right" 
                className="w-full sm:max-w-xl md:max-w-2xl bg-white/95 backdrop-blur-xl border-l border-border p-0 flex flex-col shadow-2xl h-screen h-[100dvh]"
            >
                {/* Header */}
                <div className="shrink-0 px-6 sm:px-10 py-8 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-6 safe-scroll">
                    <div className="flex items-center gap-5">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-secondary flex items-center justify-center shadow-inner border border-white/50 shrink-0">
                            <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-secondary-foreground" />
                        </div>
                        <div>
                            <SheetTitle className="text-2xl sm:text-3xl font-black tracking-tighter">Transmission Archive</SheetTitle>
                            <SheetDescription className="text-[10px] font-black text-primary/60 uppercase tracking-[0.2em] mt-1">Neural Interaction Sequence</SheetDescription>
                        </div>
                    </div>
                </div>

                {/* Control Bar */}
                <div className="px-6 sm:px-10 py-4 border-b border-border flex items-center justify-between bg-black/5 shrink-0">
                    <div className="flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5 text-primary animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Integrity Active</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button 
                            onClick={loadHistory} 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 rounded-lg hover:bg-white text-[9px] font-black uppercase tracking-widest px-3"
                        >
                            <RefreshCw className={cn("w-3 h-3 mr-2", loading && "animate-spin")} />
                            Sync
                        </Button>
                        <Button 
                            onClick={handleClear} 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 rounded-lg hover:bg-destructive/5 hover:text-destructive text-[9px] font-black uppercase tracking-widest px-3"
                            disabled={history.length === 0}
                        >
                            <Trash2 className="w-3 h-3 mr-2" />
                            Purge
                        </Button>
                    </div>
                </div>

                {/* Timeline */}
                <ScrollArea className="flex-1 px-6 sm:px-10 custom-scrollbar overscroll-contain momentum-scroll min-h-0">
                    <div className="py-10 pb-20">
                        <AnimatePresence mode="popLayout">
                            {history.length === 0 ? (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex flex-col items-center justify-center py-20 text-center opacity-20"
                                >
                                    <MessageSquare className="w-16 h-16 mb-6" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">Vault Matrix Empty</p>
                                </motion.div>
                            ) : (
                                <div className="space-y-10 relative before:absolute before:left-[15px] sm:before:left-[19px] before:top-4 before:bottom-4 before:w-px before:bg-border">
                                    {history.map((msg, idx) => (
                                        <motion.div 
                                            key={idx}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="relative pl-10 sm:pl-16 group/log"
                                        >
                                            {/* Node Indicator */}
                                            <div className={cn(
                                                "absolute left-0 top-1 w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg border transition-all z-10",
                                                msg.role === 'user' 
                                                ? 'bg-secondary border-secondary-foreground/10 text-secondary-foreground' 
                                                : 'bg-white border-border text-primary'
                                            )}>
                                                {msg.role === 'user' ? <User className="w-4 h-4 sm:w-5 sm:h-5" /> : <Bot className="w-4 h-4 sm:w-5 sm:h-5" />}
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">{msg.role}</span>
                                                    <div className="h-px flex-1 bg-border/50" />
                                                    <span className="text-[8px] font-bold text-muted-foreground/30">
                                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <div className={cn(
                                                    "p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-border transition-all",
                                                    msg.role === 'user' ? 'bg-black/5' : 'bg-white shadow-sm'
                                                )}>
                                                    <p className="text-xs sm:text-sm font-medium leading-relaxed text-foreground/80 whitespace-pre-wrap tracking-tight break-words">
                                                        {msg.content}
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}

