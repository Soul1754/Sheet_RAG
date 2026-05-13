"use client";

import { useState, useEffect, useMemo } from 'react';
import { api, IngestedPaper } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Trash2, RefreshCw, FileDown, Copy, Database, BookOpen, Clock, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export function PapersLibrary() {
    const [papers, setPapers] = useState<IngestedPaper[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState<Record<string, number> | null>(null);

    const loadPapers = async () => {
        setLoading(true);
        try {
            const res = await api.getPapers();
            setPapers(res.data.papers || []);
            setStats(res.data.stats || null);
        } catch (error) {
            console.error('Error loading papers:', error);
        }
        setLoading(false);
    };

    useEffect(() => {
        const fetchInitialPapers = async () => {
            await loadPapers();
        };
        fetchInitialPapers();
        window.addEventListener('paper-ingested', loadPapers);
        return () => window.removeEventListener('paper-ingested', loadPapers);
    }, []);

    const filteredPapers = useMemo(() => {
        if (!searchQuery.trim()) return papers;
        const query = searchQuery.toLowerCase();
        return papers.filter(paper => {
            const title = paper.title?.toLowerCase() || '';
            const authors = paper.authors?.map(a => a.toLowerCase()) || [];
            const arxivId = paper.arxiv_id?.toLowerCase() || '';
            
            return title.includes(query) || 
                   authors.some(a => a.includes(query)) || 
                   arxivId.includes(query);
        });
    }, [searchQuery, papers]);

    const handleDelete = async (arxivId: string) => {
        if (!confirm('Eliminate this intelligence unit from the vault?')) return;
        try {
            await api.deletePaper(arxivId);
            await loadPapers();
        } catch (error) { console.error('Error deleting paper:', error); }
    };

    const handleCopyBibtex = async (arxivId: string) => {
        try {
            const res = await api.getBibtex(arxivId);
            if (res.data.bibtex) {
                await navigator.clipboard.writeText(res.data.bibtex);
            }
        } catch (error) { console.error('Error copying BibTeX:', error); }
    };

    return (
        <Sheet>
            <SheetTrigger asChild>
                <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:bg-black/5 hover:text-foreground transition-all w-full text-left">
                    <Database className="w-5 h-5" />
                    <span className="text-sm font-semibold tracking-tight">Knowledge Vault</span>
                </button>
            </SheetTrigger>
            <SheetContent 
                side="right" 
                className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl bg-white/95 backdrop-blur-xl border-l border-border p-0 flex flex-col shadow-2xl h-screen h-[100dvh]"
            >
                {/* Header Section */}
                <div className="shrink-0 px-6 sm:px-10 py-8 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-6 safe-scroll">
                    <div className="flex items-center gap-5">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-secondary flex items-center justify-center shadow-inner border border-white/50 shrink-0">
                            <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-secondary-foreground" />
                        </div>
                        <div>
                            <SheetTitle className="text-2xl sm:text-3xl font-black tracking-tighter">Knowledge Vault</SheetTitle>
                            <SheetDescription className="text-[10px] font-black text-primary/60 uppercase tracking-[0.2em] mt-1">Core Logic Repository</SheetDescription>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl border-border bg-white hover:bg-black/5 font-bold text-[10px] uppercase tracking-widest px-4 h-11"
                        onClick={() => api.exportAllBibtex()}
                        disabled={papers.length === 0}
                    >
                        <FileDown className="w-4 h-4 mr-2 text-primary" />
                        Bulk Export
                    </Button>
                </div>

                {/* Content Section */}
                <div className="flex-1 overflow-hidden flex flex-col p-6 sm:p-10 space-y-8 min-h-0">
                    {/* Metrics Grid */}
                    <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
                        <div className="bg-black/5 p-4 sm:p-6 rounded-2xl border border-black/5 group hover:bg-white hover:shadow-lg transition-all">
                            <div className="flex items-center gap-2 mb-2">
                                <Activity className="w-3.5 h-3.5 text-primary opacity-40" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Total Units</span>
                            </div>
                            <div className="text-2xl sm:text-3xl font-black tracking-tighter">{stats?.total_papers ?? 0}</div>
                        </div>
                        <div className="bg-black/5 p-4 sm:p-6 rounded-2xl border border-black/5 group hover:bg-white hover:shadow-lg transition-all">
                            <div className="flex items-center gap-2 mb-2">
                                <Clock className="w-3.5 h-3.5 text-secondary-foreground opacity-40" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Intelligence Scale</span>
                            </div>
                            <div className="text-2xl sm:text-3xl font-black tracking-tighter">{stats?.total_pages ?? 0} <span className="text-sm">PGS</span></div>
                        </div>
                    </div>

                    {/* Search Interface */}
                    <div className="flex gap-2 sm:gap-3">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Query vault matrix..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-12 pl-11 rounded-xl bg-black/5 border-transparent focus:bg-white focus:border-primary/20 transition-all font-medium"
                            />
                        </div>
                        <Button 
                            onClick={loadPapers} 
                            variant="outline" 
                            className="h-12 w-12 rounded-xl border-border bg-white hover:bg-black/5 transition-all shrink-0"
                        >
                            <RefreshCw className={cn("w-5 h-5 text-primary", loading && "animate-spin")} />
                        </Button>
                    </div>

                    {/* Scrollable Library */}
                    <ScrollArea className="flex-1 -mx-2 px-2 custom-scrollbar overscroll-contain momentum-scroll">
                        <AnimatePresence mode="popLayout">
                            {filteredPapers.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-center">
                                    <Database className="w-12 h-12 text-muted-foreground/20 mb-4" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Vault Matrix Empty</p>
                                </div>
                            ) : (
                                <div className="space-y-4 pb-10">
                                    {filteredPapers.map((paper, idx) => (
                                        <motion.div 
                                            key={paper.arxiv_id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.03 }}
                                            className="group relative bg-white border border-border p-5 rounded-2xl hover:shadow-xl hover:border-primary/20 transition-all duration-300"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="text-[9px] font-black text-primary uppercase tracking-widest px-2 py-0.5 bg-primary/5 rounded">UNIT {paper.arxiv_id}</span>
                                                        <span className="text-[9px] font-bold text-muted-foreground/40">{new Date(paper.ingested_at).toLocaleDateString()}</span>
                                                    </div>
                                                    <h4 className="text-sm sm:text-base font-black text-foreground leading-tight tracking-tight group-hover:text-primary transition-colors line-clamp-2">
                                                        {paper.title}
                                                    </h4>
                                                    <p className="text-xs font-semibold text-muted-foreground/50 mt-2 line-clamp-1">
                                                        {paper.authors?.join(', ')}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => handleDelete(paper.arxiv_id)}
                                                    className="p-2 text-muted-foreground/20 hover:text-destructive hover:bg-destructive/5 rounded-lg transition-all shrink-0"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                            
                                            <div className="mt-6 flex items-center justify-between border-t border-border pt-4 flex-wrap gap-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">Density</span>
                                                        <span className="text-[10px] font-black">{paper.pages} PGS</span>
                                                    </div>
                                                    <div className="w-px h-6 bg-border" />
                                                    <div className="flex flex-col">
                                                        <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">Status</span>
                                                        <span className="text-[10px] font-black text-primary/60 tracking-wider">ACTIVE</span>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 rounded-lg hover:bg-primary/5 hover:text-primary text-[10px] font-black uppercase tracking-widest px-3"
                                                    onClick={() => handleCopyBibtex(paper.arxiv_id)}
                                                >
                                                    <Copy className="w-3 h-3 mr-2" />
                                                    Metadata
                                                </Button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </AnimatePresence>
                    </ScrollArea>
                </div>
            </SheetContent>
        </Sheet>
    );
}
