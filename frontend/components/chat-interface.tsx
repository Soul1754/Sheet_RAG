"use client";

import { useState, useRef, useEffect } from 'react';
import { api, Citation, SheetRAGSource } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, ThumbsUp, ThumbsDown, Download, Layers, Zap, RefreshCw, Sparkles, ExternalLink, BookOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    citations?: (Citation | SheetRAGSource)[];
    id?: string;
    feedback?: 'up' | 'down';
    engine?: 'standard' | 'sheet_rag';
    validation?: {
        count?: number;
        avg_confidence?: number;
    };
}

export function ChatInterface() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [useSheetRAG, setUseSheetRAG] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [placeholder, setPlaceholder] = useState("Ask anything about your files...");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const suggestions = [
        "Explain current AI agent methods",
        "Summarize uploaded documents",
        "What are the limitations of Graph RAG?",
        "Compare information from all documents"
    ];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [input]);

    useEffect(() => {
        const placeholders = [
            "Ask anything about your files...",
            "Search for specific facts...",
            "Summarize your documents...",
            "Ask for a quick overview..."
        ];
        let i = 0;
        const interval = setInterval(() => {
            setPlaceholder(placeholders[(++i) % placeholders.length]);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    const handleSend = async (overrideInput?: string) => {
        const text = overrideInput || input;
        if (!text.trim()) return;

        const userMessage: Message = { role: 'user', content: text };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const endpoint = useSheetRAG ? '/api/chat-v2-stream' : '/api/chat-stream';
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage.content,
                    use_cross_validation: true,
                    top_k: 5
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
                console.error('Backend error:', response.status, errorData);
                throw new Error(errorData.detail || `Server error (${response.status})`);
            }
            const reader = response.body?.getReader();
            if (!reader) throw new Error('No reader available');

            const assistantMessage: Message = {
                role: 'assistant',
                content: '',
                citations: [],
                id: crypto.randomUUID(),
                engine: useSheetRAG ? 'sheet_rag' : 'standard'
            };
            setMessages(prev => [...prev, assistantMessage]);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const text = new TextDecoder().decode(value);
                const lines = text.split('\n');
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.token) {
                                setMessages(prev => {
                                    const newMessages = [...prev];
                                    const lastMsg = { ...newMessages[newMessages.length - 1] };
                                    lastMsg.content += parsed.token;
                                    newMessages[newMessages.length - 1] = lastMsg;
                                    return newMessages;
                                });
                            }
                            if (parsed.done) {
                                setMessages(prev => {
                                    const newMessages = [...prev];
                                    const lastMsg = { ...newMessages[newMessages.length - 1] };
                                    lastMsg.citations = parsed.citations || parsed.sources;
                                    if (parsed.validation) lastMsg.validation = parsed.validation;
                                    if (parsed.engine) lastMsg.engine = parsed.engine;
                                    newMessages[newMessages.length - 1] = lastMsg;
                                    return newMessages;
                                });
                            }
                        } catch (e) { /* ignore chunk errors */ }
                    }
                }
            }
        } catch (error) {
            console.error('Error sending message:', error);
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I couldn't process that. Please try again." }]);
        }
        setLoading(false);
    };

    return (
        <div className="flex flex-col flex-1 w-full relative min-h-0 bg-background">
            {/* --- CHAT MESSAGES AREA --- */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-4 sm:px-6 lg:px-8 py-2 sm:py-4">
                <div className="max-w-4xl mx-auto w-full h-full flex flex-col justify-center">
                    {messages.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col items-center justify-center py-4 sm:py-6 text-center"
                        >
                            <div className="relative mb-6 group">
                                <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full group-hover:bg-primary/30 transition-all duration-700" />
                                <div className="relative w-14 h-14 rounded-[1.5rem] bg-white flex items-center justify-center shadow-premium border border-white transition-transform duration-500 group-hover:scale-110">
                                    <Sparkles className="w-7 h-7 text-primary animate-pulse" />
                                </div>
                            </div>
                            
                            <h3 className="text-xl sm:text-2xl font-bold tracking-tight mb-2 text-foreground/90">AI Research Assistant</h3>
                            <p className="text-muted-foreground/50 max-w-md text-xs sm:text-sm leading-relaxed font-medium mb-8 px-6">
                                Ask questions about your uploaded files and get simple answers.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-3xl px-4">
                                {suggestions.map((s, si) => (
                                    <button
                                        key={si}
                                        onClick={() => handleSend(s)}
                                        className="p-3.5 rounded-xl bg-white border border-border/60 hover:border-primary/30 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300 text-[13px] font-semibold text-foreground/70 text-left flex items-center gap-3 group premium-button"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary shrink-0 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                            <Zap className="w-3 h-3" />
                                        </div>
                                        <span className="line-clamp-1 leading-snug">{s}</span>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        <div className="space-y-6 pb-20">
                            {messages.map((msg, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={cn(
                                        "flex flex-col gap-3 group/msg",
                                        msg.role === 'user' ? 'items-end' : 'items-start'
                                    )}
                                >
                                    <div className={cn(
                                        "flex gap-3 max-w-[95%] sm:max-w-[85%]",
                                        msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                                    )}>
                                        <div className={cn(
                                            "w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm border transition-all",
                                            msg.role === 'user'
                                                ? 'bg-secondary border-secondary-foreground/10 text-secondary-foreground'
                                                : 'bg-white border-border text-primary'
                                        )}>
                                            {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                        </div>

                                        <div className={cn(
                                            "flex flex-col gap-1.5 min-w-0",
                                            msg.role === 'user' ? 'items-end' : 'items-start'
                                        )}>
                                            <div className={cn(
                                                "px-4 sm:px-6 py-3.5 sm:py-4.5 rounded-2xl sm:rounded-[2rem] shadow-sm overflow-hidden break-words transition-all duration-300",
                                                msg.role === 'user'
                                                    ? 'bg-primary text-white shadow-lg shadow-primary/10'
                                                    : 'bg-white border border-border/60 text-foreground hover:border-primary/20'
                                            )}>
                                                <div className={cn(
                                                    "prose prose-sm sm:prose-base max-w-none leading-relaxed prose-pre:bg-black/5 prose-pre:p-3 prose-pre:rounded-lg prose-pre:overflow-x-auto custom-scrollbar",
                                                    msg.role === 'user' ? "prose-p:text-white prose-headings:text-white prose-strong:text-white prose-code:text-white" : "prose-p:text-foreground/80 prose-headings:text-foreground"
                                                )}>
                                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                                </div>
                                            </div>

                                            {msg.role === 'assistant' && msg.content && (
                                                <div className="flex gap-1 opacity-0 group-hover/msg:opacity-100 transition-all ml-1">
                                                    <button className="p-1.5 hover:bg-black/5 rounded-lg text-muted-foreground transition-all premium-button" aria-label="Helpful"><ThumbsUp className="w-3.5 h-3.5" /></button>
                                                    <button className="p-1.5 hover:bg-black/5 rounded-lg text-muted-foreground transition-all premium-button" aria-label="Not helpful"><ThumbsDown className="w-3.5 h-3.5" /></button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {msg.role === 'assistant' && msg.citations && msg.citations.length > 0 && (
                                        <div className="ml-11 sm:ml-12 w-full max-w-[92%] sm:max-w-[85%] space-y-3">
                                            {msg.engine === 'sheet_rag' && msg.validation && (
                                                <div className="flex flex-wrap items-center gap-4 bg-primary/5 border border-primary/10 rounded-xl px-4 py-2.5">
                                                    <Layers className="w-4 h-4 text-primary shrink-0" />
                                                    <div className="flex gap-6">
                                                        <div className="flex flex-col">
                                                            <span className="text-[9px] font-bold uppercase tracking-wider text-primary/60">Confidence</span>
                                                            <span className="text-xs font-bold text-primary">{((msg.validation.avg_confidence || 0) * 100).toFixed(0)}% Sure</span>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[9px] font-bold uppercase tracking-wider text-primary/60">Sources</span>
                                                            <span className="text-xs font-bold text-primary">{msg.validation.count || 0} Files</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                                {msg.citations.map((cite, ci) => {
                                                    const meta = cite.metadata as any;
                                                    const arxivId = meta?.arxiv_id;
                                                    const title = meta?.title || cite.text.slice(0, 60);
                                                    
                                                    return (
                                                        <div key={ci} className="p-3.5 rounded-xl bg-white border border-border/60 hover:shadow-md transition-all group/cite">
                                                            <div className="flex items-start justify-between gap-3 mb-1.5">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-5 h-5 rounded-lg bg-secondary/50 flex items-center justify-center text-secondary-foreground shrink-0">
                                                                        <BookOpen className="w-3 h-3" />
                                                                    </div>
                                                                    <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Source {ci + 1}</span>
                                                                </div>
                                                                {arxivId && (
                                                                    <a 
                                                                        href={`https://arxiv.org/abs/${arxivId}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="p-1 hover:bg-primary/5 rounded-lg text-primary opacity-0 group-hover/cite:opacity-100 transition-all premium-button"
                                                                        aria-label="View on ArXiv"
                                                                    >
                                                                        <ExternalLink className="w-3 h-3" />
                                                                    </a>
                                                                )}
                                                            </div>
                                                            <p className="text-xs font-bold text-foreground leading-snug line-clamp-2 mb-1.5">{title}</p>
                                                            <p className="text-[10px] text-muted-foreground/70 leading-relaxed line-clamp-2 italic">
                                                                &ldquo;{cite.text}&rdquo;
                                                            </p>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>
            </div>

            {/* --- INPUT AREA --- */}
            <div className="shrink-0 p-4 sm:p-6 lg:px-8 pb-4 pt-0">
                <div className="max-w-4xl mx-auto w-full relative">
                    <div className="absolute -top-10 left-0 right-0 flex justify-center pointer-events-none">
                        <AnimatePresence>
                            {loading && (
                                <motion.div
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 5 }}
                                    className="px-3 py-1.5 rounded-full bg-white border border-border shadow-md flex items-center gap-2.5"
                                >
                                    <RefreshCw className="w-3 h-3 text-primary animate-spin" />
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Synthesizing...</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="glass-card rounded-[2rem] p-2 flex flex-col gap-1 shadow-premium emerald-border-glow hover:shadow-input-focus transition-all duration-500">
                        <div className="flex items-center gap-2 px-4 py-2 border-b border-border/40">
                            <button 
                                onClick={() => setUseSheetRAG(!useSheetRAG)}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-300 premium-button",
                                    useSheetRAG ? "bg-primary/10 text-primary shadow-sm shadow-primary/5" : "text-muted-foreground/60 hover:bg-black/5"
                                )}
                            >
                                <Layers className="w-4 h-4" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Multi-Layer Mode</span>
                                <div className={cn(
                                    "w-1.5 h-1.5 rounded-full transition-all duration-500",
                                    useSheetRAG ? "bg-primary shadow-[0_0_8px_rgba(0,163,108,0.6)]" : "bg-muted-foreground/20"
                                )} />
                            </button>
                        </div>

                        <div className="flex items-end gap-2 px-2 pb-2">
                            <textarea
                                ref={textareaRef}
                                rows={1}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                                placeholder={placeholder}
                                className="flex-1 bg-transparent border-none focus:ring-0 text-sm sm:text-base font-medium p-4 sm:p-5 resize-none max-h-48 custom-scrollbar placeholder:text-muted-foreground/30 leading-relaxed"
                                disabled={loading}
                            />
                            <Button
                                onClick={() => handleSend()}
                                disabled={loading || !input.trim()}
                                className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl shrink-0 p-0 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-300 premium-button"
                                aria-label="Send message"
                            >
                                {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                            </Button>
                        </div>
                    </div>
                    
                    <p className="mt-3 text-center text-[9px] font-semibold text-muted-foreground/30 uppercase tracking-[0.2em]">
                        Powered by Graph-RAG Architecture
                    </p>
                </div>
            </div>
        </div>
    );
}
