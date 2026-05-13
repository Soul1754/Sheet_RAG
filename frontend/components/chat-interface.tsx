"use client";

import { useState, useRef, useEffect } from 'react';
import { api, Citation, SheetRAGSource } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, ThumbsUp, ThumbsDown, Download, Layers, Zap, RefreshCw, Sparkles, ExternalLink } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
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
    const [placeholder, setPlaceholder] = useState("Ask intelligence terminal...");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const suggestions = [
        "Synthesize current LLM agent methodologies",
        "Summarize core findings from the library",
        "What are the Graph RAG limitations?",
        "Compare datasets across all papers"
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
            "Ask intelligence terminal...",
            "Synthesize knowledge units...",
            "Analyze graph relationships...",
            "Discover academic insights..."
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

            if (!response.ok) throw new Error('Failed to send message');
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
            setMessages(prev => [...prev, { role: 'assistant', content: 'Neural synthesis failed. Please retry.' }]);
        }
        setLoading(false);
    };

    return (
        <div className="flex flex-col flex-1 w-full relative min-h-0">
            {/* --- CHAT MESSAGES AREA --- */}
            <div className="flex-1 overflow-y-auto custom-scrollbar overscroll-contain px-4 sm:px-6 lg:px-8 py-8 momentum-scroll">
                <div className="max-w-4xl mx-auto w-full space-y-12 pb-12">
                    {messages.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col items-center justify-center py-12 sm:py-24 text-center"
                        >
                            <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-[2rem] sm:rounded-[2.5rem] bg-secondary flex items-center justify-center mb-8 sm:mb-10 shadow-inner border border-white/50 animate-in zoom-in duration-700">
                                <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 text-secondary-foreground" />
                            </div>
                            <h3 className="text-2xl sm:text-3xl font-black tracking-tight mb-4 px-4">Neural Intelligence Interface</h3>
                            <p className="text-muted-foreground/60 max-w-lg text-sm sm:text-base leading-relaxed tracking-tight font-medium mb-12 px-6">
                                Query your knowledge matrix. I will synthesize cross-document insights using hierarchical graph retrieval.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl px-4 sm:px-6">
                                {suggestions.map((s, si) => (
                                    <button
                                        key={si}
                                        onClick={() => handleSend(s)}
                                        className="p-4 rounded-2xl bg-white/50 border border-border hover:bg-white hover:shadow-lg hover:-translate-y-1 transition-all text-xs font-bold text-foreground/70 text-left flex items-center gap-3 group active-compress"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                                            <Zap className="w-4 h-4" />
                                        </div>
                                        <span className="line-clamp-2">{s}</span>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    <div className="space-y-8">
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
                                    "flex gap-3 sm:gap-4 max-w-[95%] sm:max-w-[85%]",
                                    msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                                )}>
                                    <div className={cn(
                                        "w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm border transition-all",
                                        msg.role === 'user'
                                            ? 'bg-secondary border-secondary-foreground/10 text-secondary-foreground'
                                            : 'bg-white border-border text-primary'
                                    )}>
                                        {msg.role === 'user' ? <User className="w-4 h-4 sm:w-5 sm:h-5" /> : <Bot className="w-4 h-4 sm:w-5 sm:h-5" />}
                                    </div>

                                    <div className={cn(
                                        "flex flex-col gap-2 min-w-0",
                                        msg.role === 'user' ? 'items-end' : 'items-start'
                                    )}>
                                        <div className={cn(
                                            "px-4 sm:px-6 py-3 sm:py-4 rounded-2xl sm:rounded-3xl shadow-sm overflow-hidden break-words",
                                            msg.role === 'user'
                                                ? 'bg-primary text-white'
                                                : 'bg-white border border-border text-foreground'
                                        )}>
                                            <div className={cn(
                                                "prose prose-sm max-w-none leading-relaxed overflow-x-auto custom-scrollbar prose-pre:bg-black/5 prose-pre:p-4 prose-pre:rounded-xl prose-pre:overflow-x-auto",
                                                msg.role === 'user' ? "prose-p:text-white prose-headings:text-white" : "prose-p:text-foreground/80 prose-headings:text-foreground"
                                            )}>
                                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                                            </div>
                                        </div>

                                        {msg.role === 'assistant' && msg.content && (
                                            <div className="flex gap-2 opacity-0 group-hover/msg:opacity-100 transition-all ml-2">
                                                <button className="p-1.5 hover:bg-black/5 rounded-lg text-muted-foreground transition-all"><ThumbsUp className="w-3.5 h-3.5" /></button>
                                                <button className="p-1.5 hover:bg-black/5 rounded-lg text-muted-foreground transition-all"><ThumbsDown className="w-3.5 h-3.5" /></button>
                                                <button className="p-1.5 hover:bg-black/5 rounded-lg text-muted-foreground transition-all"><Download className="w-3.5 h-3.5" /></button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {msg.role === 'assistant' && msg.citations && msg.citations.length > 0 && (
                                    <div className="ml-12 sm:ml-14 w-full max-w-[90%] sm:max-w-[80%] space-y-4">
                                        {msg.engine === 'sheet_rag' && msg.validation && (
                                            <div className="flex flex-wrap items-center gap-4 bg-primary/5 border border-primary/10 rounded-xl px-4 py-3">
                                                <Layers className="w-4 h-4 text-primary shrink-0" />
                                                <div className="flex gap-4 sm:gap-6 overflow-hidden">
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-primary/60">Confidence</span>
                                                        <span className="text-xs font-bold text-primary">{((msg.validation.avg_confidence || 0) * 100).toFixed(0)}% SYNTHESIZED</span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-primary/60">Logic Context</span>
                                                        <span className="text-xs font-bold text-primary">{msg.validation.count || 0} Nodes</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {msg.citations.slice(0, 4).map((cit, cIdx) => (
                                                <div key={cIdx} className="group/cit p-3 sm:p-4 rounded-2xl bg-white/50 border border-border hover:bg-white hover:shadow-md transition-all">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-[8px] font-black uppercase tracking-widest text-primary/60 bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">
                                                            Source ID: {cit.metadata?.arxiv_id || 'LOCAL'}
                                                        </span>
                                                        <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover/cit:opacity-100 transition-opacity" />
                                                    </div>
                                                    <p className="text-[10px] font-bold text-foreground mb-1 line-clamp-1">{cit.metadata?.title || 'Synthesis Node'}</p>
                                                    <p className="text-[10px] text-muted-foreground/60 leading-relaxed line-clamp-2 italic">&quot;{cit.text}&quot;</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>

                    {loading && (
                        <div className="flex gap-3 sm:gap-4 items-center">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-primary/10 flex items-center justify-center animate-pulse border border-primary/20">
                                <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                            </div>
                            <div className="flex gap-1.5 p-3 px-5 rounded-2xl bg-white border border-border shadow-sm">
                                <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                                <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                                <div className="w-1.5 h-1.5 bg-primary/80 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} className="h-4" />
                </div>
            </div>

            {/* --- INPUT DOCK --- */}
            <div className="shrink-0 p-4 sm:p-6 lg:p-8 border-t border-border bg-white/50 backdrop-blur-md sticky bottom-0 z-30 safe-scroll">
                <div className="max-w-4xl mx-auto w-full">
                    <div className="relative surface-panel rounded-2xl sm:rounded-[2rem] p-1.5 sm:p-2 border-border shadow-xl focus-within:border-primary/30 transition-all">
                        <div className="flex items-end gap-2 sm:gap-3">
                            <div className="flex-1 flex flex-col min-w-0">
                                <textarea
                                    ref={textareaRef}
                                    rows={1}
                                    placeholder={placeholder}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend();
                                        }
                                    }}
                                    disabled={loading}
                                    className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-sm sm:text-base py-3 px-3 sm:px-4 resize-none placeholder:text-muted-foreground/30 font-medium max-h-[200px] overflow-y-auto custom-scrollbar"
                                />
                                <div className="flex items-center gap-3 px-3 sm:px-4 pb-2">
                                    <button
                                        onClick={() => setUseSheetRAG(!useSheetRAG)}
                                        className={cn(
                                            "flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider transition-all",
                                            useSheetRAG ? "bg-primary/10 text-primary border border-primary/20" : "bg-black/5 text-muted-foreground border border-transparent"
                                        )}
                                    >
                                        <Layers className="w-3 h-3" />
                                        {useSheetRAG ? "Hierarchical RAG" : "Standard RAG"}
                                    </button>
                                    <div className="h-3 w-px bg-border" />
                                    <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest hidden sm:inline">
                                        Shift + Enter for newline
                                    </span>
                                </div>
                            </div>

                            <Button
                                onClick={() => handleSend()}
                                disabled={loading || !input.trim()}
                                className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-primary hover:bg-primary/90 text-white shadow-lg shrink-0 mb-1"
                            >
                                {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                            </Button>
                        </div>
                    </div>
                    <p className="mt-3 text-center text-[9px] font-bold text-muted-foreground/30 uppercase tracking-[0.3em]">
                        AI may synthesize hallucinatory units. Verify with source ID.
                    </p>
                </div>
            </div>
        </div>
    );
}
