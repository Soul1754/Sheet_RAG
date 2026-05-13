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
import { useSidebar } from '@/lib/sidebar-context';

export function PapersLibrary() {
    const { isOpen } = useSidebar();
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
        if (!confirm('Remove this document from your library?')) return;
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
                <button className={cn(
                    "flex items-center rounded-xl text-muted-foreground hover:bg-black/5 hover:text-foreground transition-all w-full text-left premium-button group",
                    isOpen ? "gap-3 px-3.5 py-2.5" : "justify-center p-2.5"
                )}>
                    <Database className="w-5 h-5 group-hover:text-primary transition-colors shrink-0" />
                    {isOpen && <span className="text-sm font-semibold tracking-tight">Files</span>}
                </button>
            </SheetTrigger>
            <SheetContent 
                side="right" 
                className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl bg-card border-l border-border p-0 flex flex-col shadow-2xl h-screen h-[100dvh]"
            >
                {/* Header Section */}
                <div className="shrink-0 px-5 sm:px-8 py-5 sm:py-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-secondary flex items-center justify-center shadow-inner border border-white/50 shrink-0">
                            <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 text-secondary-foreground" />
                        </div>
                        <div>
                            <SheetTitle className="text-xl sm:text-2xl font-bold tracking-tight">Files</SheetTitle>
                            <SheetDescription className="text-[9px] font-bold text-primary/60 uppercase tracking-[0.2em] mt-1">Your uploaded files</SheetDescription>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl border-border bg-card hover:bg-muted font-bold text-[10px] uppercase tracking-wider px-4 h-10 premium-button"
                        onClick={() => api.exportAllBibtex()}
                        disabled={papers.length === 0}
                    >
                        <FileDown className="w-3.5 h-3.5 mr-2 text-primary" />
                        Bulk Export
                    </Button>
                </div>

                {/* Content Section */}
                <div className="flex-1 flex flex-col min-h-0 p-5 sm:p-8">
                    <div className="space-y-6 flex flex-col h-full">
                        {/* Metrics Grid */}
                        <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 shrink-0">
                            <div className="bg-muted/50 p-4 sm:p-5 rounded-2xl border border-transparent hover:bg-card hover:border-border hover:shadow-premium transition-all group">
                                <div className="flex items-center gap-2 mb-2">
                                    <Activity className="w-3.5 h-3.5 text-primary opacity-40 group-hover:opacity-100 transition-opacity" />
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60">Total Files</span>
                                </div>
                                <div className="text-xl sm:text-2xl font-bold tracking-tight">{stats?.total_papers ?? 0}</div>
                            </div>
                            <div className="bg-muted/50 p-4 sm:p-5 rounded-2xl border border-transparent hover:bg-card hover:border-border hover:shadow-premium transition-all group">
                                <div className="flex items-center gap-2 mb-2">
                                    <Clock className="w-3.5 h-3.5 text-secondary-foreground opacity-40 group-hover:opacity-100 transition-opacity" />
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60">Total Pages</span>
                                </div>
                                <div className="text-xl sm:text-2xl font-bold tracking-tight">{stats?.total_pages ?? 0} <span className="text-xs font-medium opacity-40 ml-0.5">PGS</span></div>
                            </div>
                        </div>

                        {/* Search Interface */}
                        <div className="flex gap-2 shrink-0">
                            <div className="relative flex-1 group">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
                                <Input
                                    placeholder="Search files..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="h-11 pl-10 rounded-xl bg-muted/50 border-transparent focus:bg-card focus:border-primary/20 transition-all font-medium input-glow"
                                />
                            </div>
                            <Button 
                                onClick={loadPapers} 
                                variant="outline" 
                                className="h-11 w-11 rounded-xl border-border bg-card hover:bg-muted transition-all shrink-0 premium-button"
                                aria-label="Refresh library"
                            >
                                <RefreshCw className={cn("w-4 h-4 text-primary", loading && "animate-spin")} />
                            </Button>
                        </div>

                        {/* Scrollable Library */}
                        <div className="flex-1 min-h-0 -mx-1 px-1">
                            <ScrollArea className="h-full w-full custom-scrollbar">
                                <AnimatePresence mode="popLayout">
                                    {filteredPapers.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-16 text-center">
                                            <div className="w-14 h-14 rounded-xl bg-muted/50 flex items-center justify-center mb-4">
                                                <Database className="w-7 h-7 text-muted-foreground/20" />
                                            </div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">No documents found</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3 pb-8 pr-3">
                                            {filteredPapers.map((paper, idx) => (
                                                <motion.div 
                                                    key={paper.arxiv_id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: idx * 0.03 }}
                                                    className="group relative bg-card border border-border p-4.5 rounded-xl hover:shadow-premium hover:border-primary/20 transition-all duration-300"
                                                >
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2.5 mb-2">
                                                                <span className="text-[9px] font-bold text-primary uppercase tracking-wider px-2 py-0.5 bg-primary/5 rounded-lg border border-primary/10">DOC {paper.arxiv_id}</span>
                                                                <span className="text-[9px] font-medium text-muted-foreground/40">{new Date(paper.ingested_at).toLocaleDateString()}</span>
                                                            </div>
                                                            <h4 className="text-sm sm:text-base font-bold text-foreground leading-tight tracking-tight group-hover:text-primary transition-colors line-clamp-2">
                                                                {paper.title}
                                                            </h4>
                                                            <p className="text-xs font-medium text-muted-foreground/50 mt-1.5 line-clamp-1">
                                                                {paper.authors?.join(', ')}
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() => handleDelete(paper.arxiv_id)}
                                                            className="p-2 text-muted-foreground/20 hover:text-destructive hover:bg-destructive/5 rounded-lg transition-all shrink-0 premium-button"
                                                            aria-label="Delete paper"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    
                                                    <div className="mt-5 flex items-center justify-between border-t border-border pt-4 flex-wrap gap-3">
                                                        <div className="flex items-center gap-4">
                                                            <div className="flex flex-col">
                                                                <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/40">Pages</span>
                                                                <span className="text-[10px] font-bold">{paper.pages} PGS</span>
                                                            </div>
                                                            <div className="w-px h-6 bg-border" />
                                                            <div className="flex flex-col">
                                                                <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/40">Status</span>
                                                                <span className="text-[10px] font-bold text-primary/70 tracking-wide">ACTIVE</span>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 rounded-lg hover:bg-primary/5 hover:text-primary text-[10px] font-bold uppercase tracking-wider px-3 premium-button"
                                                            onClick={() => handleCopyBibtex(paper.arxiv_id)}
                                                        >
                                                            <Copy className="w-3.5 h-3.5 mr-2" />
                                                            Copy Details
                                                        </Button>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}
                                </AnimatePresence>
                            </ScrollArea>
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
