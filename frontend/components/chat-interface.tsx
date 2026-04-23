"use client";

import { useState, useRef, useEffect } from 'react';
import { api, ChatResponse, Citation } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, FileText, ThumbsUp, ThumbsDown, Download, Layers, Zap, RefreshCw, Sparkles, ExternalLink } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import ReactMarkdown from 'react-markdown';
import { Recommendations } from './recommendations';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    citations?: Citation[];
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

    const suggestions = [
        "Synthesize the methodology of recent LLM agents",
        "Summarize the core findings of these papers",
        "What are the limitations mentioned in the graph RAG section?",
        "Compare the datasets used across the library"
    ];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

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
            let response;
            let retries = 0;
            const maxRetries = 2;
            
            while (retries <= maxRetries) {
                try {
                    response = await fetch(endpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            message: userMessage.content,
                            use_cross_validation: true,
                            top_k: 5
                        })
                    });
                    if (response.ok) break;
                    if (retries === maxRetries) throw new Error(`HTTP error! status: ${response.status}`);
                } catch (e) {
                    if (retries === maxRetries) throw e;
                    console.log(`Fetch retry ${retries + 1}/${maxRetries}...`);
                }
                retries++;
                await new Promise(resolve => setTimeout(resolve, 1000 * retries));
            }

            if (!response || !response.ok) throw new Error('Failed to send message after retries');
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
                        if (data === '[DONE]') break;
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
                            if (parsed.citations || parsed.sources) {
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
                        } catch (e) { console.error('Error parsing SSE:', e); }
                    }
                }
            }
        } catch (error) {
            console.error('Error sending message:', error);
            setMessages(prev => [...prev, { role: 'assistant', content: 'Neural synthesis failed. Please retry.' }]);
        }
        setLoading(false);
    };

    const handleFeedback = async (index: number, feedback: 'up' | 'down') => {
        const msg = messages[index];
        if (msg.role !== 'assistant' || !msg.content) return;
        setMessages(prev => {
            const newMessages = [...prev];
            newMessages[index].feedback = feedback;
            return newMessages;
        });
        try { if (msg.id) await api.submitFeedback(msg.id, feedback); } catch (error) {
            console.error('Error submitting feedback:', error);
            setMessages(prev => {
                const newMessages = [...prev];
                newMessages[index].feedback = undefined;
                return newMessages;
            });
        }
    };

    const handleExport = async () => {
        try { await api.exportChatMarkdown('default'); } catch (error) { console.error('Error exporting chat:', error); }
    };

    return (
        <div className="flex flex-col h-full w-full max-w-6xl mx-auto relative group">
            {/* Main Terminal Surface */}
            <div className="flex-1 min-h-0 mb-28 flex flex-col surface-floating rounded-[2.5rem] border-white/60 overflow-hidden physics-smooth">
                {/* Header Status Bar */}
                <div className="px-10 py-6 border-b border-foreground/5 bg-white/20 backdrop-blur-xl flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 animate-breathing opacity-60 absolute inset-0" />
                            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-premium border border-white/40 relative z-10">
                                <Bot className="w-6 h-6 text-primary" />
                            </div>
                        </div>
                        <div>
                            <h2 className="font-black text-xl tracking-tighter bg-gradient-to-br from-foreground to-foreground/50 bg-clip-text text-transparent uppercase">Intelligence Matrix</h2>
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                <span className="text-[10px] uppercase tracking-[0.25em] font-black text-muted-foreground/40">RAG Pipeline Active</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-8">
                        {/* RAG Mode Switch - Strictly Bound to use_sheet_rag logic */}
                        <div className="hidden lg:flex items-center gap-4 bg-foreground/5 p-1 rounded-full border border-foreground/5 surface-panel">
                            <div className={`p-1 px-4 rounded-full text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${!useSheetRAG ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground/40'}`} onClick={() => setUseSheetRAG(false)}>Standard</div>
                            <div className={`p-1 px-4 rounded-full text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${useSheetRAG ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground/40'}`} onClick={() => setUseSheetRAG(true)}>Hierarchical</div>
                        </div>
                        
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleExport}
                            className="w-12 h-12 rounded-2xl hover:bg-primary/10 text-muted-foreground/40 hover:text-primary transition-all active-compress"
                        >
                            <Download className="w-5 h-5" />
                        </Button>
                    </div>
                </div>

                <ScrollArea className="flex-1 p-8 md:p-12">
                    <div className="space-y-12 pb-12">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-20 text-center stagger-children">
                                <div className="w-28 h-28 rounded-[2.5rem] bg-secondary flex items-center justify-center mb-10 animate-float shadow-inner border border-white/50">
                                    <Sparkles className="w-12 h-12 text-secondary-foreground" />
                                </div>
                                <h3 className="text-3xl font-black tracking-tight mb-4">Neural Intelligence Interface</h3>
                                <p className="text-muted-foreground/50 max-w-lg text-base leading-relaxed tracking-tight font-medium mb-12">
                                    Query your knowledge matrix. I will synthesize cross-document insights using hierarchical graph retrieval.
                                </p>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl px-6">
                                    {suggestions.map((s, si) => (
                                        <button 
                                            key={si}
                                            onClick={() => handleSend(s)}
                                            className="p-4 rounded-2xl bg-white/40 border border-white hover:bg-white hover:shadow-premium hover:-translate-y-1 transition-all text-xs font-bold text-foreground/70 text-left flex items-center gap-3 active-compress focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        >
                                            <div className="w-6 h-6 rounded-lg bg-primary/5 flex items-center justify-center text-primary shrink-0">
                                                <Zap className="w-3.5 h-3.5" />
                                            </div>
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="max-w-4xl mx-auto space-y-10">
                            {messages.map((msg, idx) => (
                                <div 
                                    key={idx} 
                                    className={`flex flex-col gap-4 group/msg animate-slide-up ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                                >
                                    <div className={`flex gap-5 max-w-[90%] md:max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-premium border transition-all ${
                                            msg.role === 'user' 
                                            ? 'bg-secondary border-secondary-foreground/10 text-secondary-foreground' 
                                            : 'bg-white border-foreground/5 text-primary'
                                        }`}>
                                            {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                                        </div>

                                        <div className={`flex flex-col gap-3 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                            <div className={`px-8 py-5 shadow-premium surface-active rounded-[2rem] ${msg.role === 'user' ? 'chat-bubble-user animate-float' : 'chat-bubble-ai border-white/60'}`}>
                                                <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed prose-headings:font-black prose-p:font-medium prose-p:text-foreground/80 tracking-tight">
                                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                                </div>
                                            </div>

                                            {/* Feedback System - Strictly Bound to message ID */}
                                            {msg.role === 'assistant' && msg.content && (
                                                <div className="flex gap-2 opacity-0 group-hover/msg:opacity-100 transition-all">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className={`h-9 w-9 rounded-full ${msg.feedback === 'up' ? 'bg-primary/20 text-primary' : 'text-muted-foreground/30 hover:text-primary hover:bg-primary/10'}`}
                                                        onClick={() => handleFeedback(idx, 'up')}
                                                    >
                                                        <ThumbsUp className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className={`h-9 w-9 rounded-full ${msg.feedback === 'down' ? 'bg-destructive/20 text-destructive' : 'text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10'}`}
                                                        onClick={() => handleFeedback(idx, 'down')}
                                                    >
                                                        <ThumbsDown className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Data Visuals - Strictly Mapping returned citations/validation */}
                                    {msg.role === 'assistant' && msg.citations && msg.citations.length > 0 && (
                                        <div className="ml-16 w-full max-w-[85%] space-y-6 animate-slide-up">
                                            {msg.engine === 'sheet_rag' && msg.validation && (
                                                <div className="flex items-center gap-4 bg-primary/10 border border-primary/20 rounded-2xl px-6 py-4 surface-panel emerald-glow-primary">
                                                    <Layers className="w-5 h-5 text-primary" />
                                                    <div className="flex gap-8">
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">Confidence Level</span>
                                                            <span className="text-sm font-black text-primary">{((msg.validation.avg_confidence || 0) * 100).toFixed(0)}% SYNTHESIZED</span>
                                                        </div>
                                                        <div className="w-px h-8 bg-primary/10" />
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">Logic Context</span>
                                                            <span className="text-sm font-black text-primary">{msg.validation.count || 0} Hierarchy Nodes</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {msg.citations.slice(0, 4).map((cit: any, cIdx: number) => (
                                                    <div key={cIdx} className="group/cit p-5 rounded-3xl surface-panel border-white hover:bg-white hover:shadow-premium transition-all physics-spring">
                                                        <div className="flex items-center justify-between mb-4">
                                                            {cit.metadata?.arxiv_id && (
                                                                <span className="text-[10px] font-black uppercase tracking-widest text-primary/60 bg-primary/5 px-3 py-1 rounded-full border border-primary/10">
                                                                    Unit {cit.metadata.arxiv_id}
                                                                </span>
                                                            )}
                                                            <a href={`https://arxiv.org/abs/${cit.metadata?.arxiv_id}`} target="_blank" className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground opacity-0 group-hover/cit:opacity-100 transition-all hover:scale-110 shadow-sm">
                                                                <ExternalLink className="w-4 h-4" />
                                                            </a>
                                                        </div>
                                                        <p className="text-xs font-black text-foreground mb-2 line-clamp-1 tracking-tight">{cit.metadata?.title || 'System Context'}</p>
                                                        <p className="text-xs text-muted-foreground/60 leading-relaxed line-clamp-2 italic font-semibold">"{cit.text}"</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Discovery Matrix - Strictly Bound to query state */}
                                    {msg.role === 'assistant' && msg.content && idx === messages.length - 1 && !loading && (
                                        <div className="ml-16 w-full max-w-[85%] pt-10 border-t border-foreground/5 mt-6 stagger-children">
                                            <Recommendations query={messages[idx - 1]?.content} type="query" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        
                        {loading && (
                            <div className="max-w-4xl mx-auto flex gap-5 items-center animate-slide-up">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center animate-breathing border border-primary/20">
                                    <Bot className="w-6 h-6 text-primary" />
                                </div>
                                <div className="flex gap-2 p-5 px-8 rounded-full surface-active border border-white shadow-premium">
                                    <div className="w-2.5 h-2.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.32s]" />
                                    <div className="w-2.5 h-2.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.16s]" />
                                    <div className="w-2.5 h-2.5 bg-primary/80 rounded-full animate-bounce" />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </ScrollArea>
            </div>

            {/* Matrix Dock - Core Functional Input */}
            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-5xl px-8 z-[100]">
                <div className="surface-floating p-2.5 rounded-[3rem] shadow-[0_30px_100px_-20px_rgba(0,0,0,0.18)] flex items-center gap-4 border-white group/input focus-within:emerald-border-glow focus-within:bg-white transition-all duration-700 physics-spring">
                    <div className="w-12 h-12 rounded-full bg-foreground/5 flex items-center justify-center text-muted-foreground/20 transition-all group-focus-within/input:bg-primary/5 group-focus-within/input:text-primary">
                        <Zap className="w-5 h-5 transition-all group-focus-within/input:scale-110" />
                    </div>
                    
                    <textarea
                        rows={1}
                        placeholder={placeholder}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                        disabled={loading}
                        className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 text-lg py-4 resize-none placeholder:text-muted-foreground/20 placeholder:font-black tracking-tight leading-normal"
                        style={{ maxHeight: '200px', height: 'auto' }}
                    />
                    
                    <Button 
                        onClick={() => handleSend()} 
                        disabled={loading || !input.trim()}
                        className="h-14 w-14 rounded-full bg-primary hover:bg-primary opacity-100 disabled:opacity-30 disabled:scale-95 text-white shadow-premium scale-100 hover:scale-110 transition-all physics-spring emerald-glow-primary active-compress p-0"
                    >
                        {loading ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6 ml-0.5" />}
                    </Button>
                </div>
            </div>
        </div>
    );
}
