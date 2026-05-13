"use client";

import { useState, useEffect } from 'react';
import { api, IngestedPaper } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Trash2, RefreshCw, FileDown, Copy, Database, BookOpen, Clock, Activity, ExternalLink } from 'lucide-react';

export function PapersLibrary() {
    const [papers, setPapers] = useState<IngestedPaper[]>([]);
    const [filteredPapers, setFilteredPapers] = useState<IngestedPaper[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState<any>(null);

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
        loadPapers();
        window.addEventListener('paper-ingested', loadPapers);
        return () => window.removeEventListener('paper-ingested', loadPapers);
    }, []);

    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredPapers(papers);
            return;
        }
        const query = searchQuery.toLowerCase();
        const filtered = papers.filter(paper =>
            paper.title?.toLowerCase().includes(query) ||
            paper.authors?.some(author => author.toLowerCase().includes(query)) ||
            paper.arxiv_id?.toLowerCase().includes(query)
        );
        setFilteredPapers(filtered);
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
                alert('BibTeX metadata captured.');
            }
        } catch (error) { console.error('Error copying BibTeX:', error); }
    };

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="w-12 h-12 rounded-full hover:bg-primary/10 text-muted-foreground/30 hover:text-primary transition-all active-compress">
                    <Database className="w-6 h-6" />
                </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-3xl bg-background/80 backdrop-blur-3xl border-l border-white/40 p-0 physics-spring">
                <div className="h-full flex flex-col pt-16">
                    <div className="px-12 flex items-center justify-between gap-6 mb-12 stagger-children">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-[2rem] bg-secondary flex items-center justify-center shadow-premium border border-white/50">
                                <BookOpen className="w-8 h-8 text-secondary-foreground" />
                            </div>
                            <div>
                                <SheetTitle className="text-4xl font-black tracking-tighter">Knowledge Vault</SheetTitle>
                                <SheetDescription className="text-base font-black text-primary/40 uppercase tracking-[0.2em] mt-1">Core Logic Repository</SheetDescription>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            className="h-14 rounded-2xl border-foreground/5 bg-white/40 hover:bg-white font-black text-xs uppercase tracking-widest shadow-premium active-compress"
                            onClick={() => api.exportAllBibtex()}
                            disabled={papers.length === 0}
                        >
                            <FileDown className="w-5 h-5 mr-3 text-primary" />
                            Bulk Export
                        </Button>
                    </div>

                    <div className="px-12 space-y-10 flex-1 flex flex-col min-h-0 stagger-children">
                        {/* Metrics Dashboard - Functionally bound to stats endpoint response */}
                        {stats && (
                            <div className="grid grid-cols-2 gap-6 stagger-2">
                                <div className="surface-panel p-6 rounded-[2.5rem] border-white group hover:bg-white transition-all physics-spring hover:shadow-premium">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Activity className="w-4 h-4 text-primary opacity-40" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/40">Total Papers</span>
                                    </div>
                                    <div className="text-4xl font-black tracking-tighter text-foreground/80">{stats.total_papers || 0}</div>
                                </div>
                                <div className="surface-panel p-6 rounded-[2.5rem] border-white group hover:bg-white transition-all physics-spring hover:shadow-premium">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Clock className="w-4 h-4 text-secondary-foreground opacity-40" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary-foreground/40">Scale Node</span>
                                    </div>
                                    <div className="text-4xl font-black tracking-tighter text-foreground/80">{stats.total_pages || 0} Pages</div>
                                </div>
                            </div>
                        )}

                        {/* Search (Local Filtering - Functional) */}
                        <div className="flex gap-4 stagger-3">
                            <div className="relative flex-1 group">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/20 group-focus-within:text-primary transition-colors" />
                                <Input
                                    placeholder="Query vault matrix..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="h-16 pl-16 rounded-[2rem] bg-white/40 border-foreground/5 font-black text-lg tracking-tight placeholder:text-muted-foreground/20 focus-visible:ring-primary/20 focus-visible:bg-white shadow-inner"
                                />
                            </div>
                            <Button 
                                onClick={loadPapers} 
                                variant="outline" 
                                className="h-16 w-16 rounded-[2rem] border-foreground/5 bg-white/40 hover:bg-white hover:emerald-glow-primary transition-all active-compress"
                            >
                                <RefreshCw className={`w-6 h-6 text-primary ${loading ? 'animate-spin' : ''}`} />
                            </Button>
                        </div>

                        <ScrollArea className="flex-1 -mr-6 pr-6 pb-20 stagger-4">
                            {filteredPapers.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-32 text-center">
                                    <div className="w-24 h-24 rounded-[2.5rem] bg-foreground/5 flex items-center justify-center mb-8 border-2 border-dashed border-foreground/10 opacity-40">
                                        <Database className="w-10 h-10 text-foreground" />
                                    </div>
                                    <p className="text-sm font-black uppercase tracking-[0.4em] text-foreground/20 mb-2">Vault Matrix Empty</p>
                                    <p className="text-xs font-medium text-foreground/40 max-w-[200px] leading-relaxed mx-auto">
                                        Initialize the intelligence acquisition via the Terminal to populate your vault.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {filteredPapers.map((paper, idx) => (
                                        <div 
                                            key={paper.arxiv_id} 
                                            className="group/unit surface-panel p-8 rounded-[2.5rem] border-white/60 hover:bg-white hover:shadow-premium transition-all physics-spring animate-slide-up"
                                        >
                                            <div className="flex items-start justify-between gap-8">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span className="text-[10px] font-black text-primary/40 uppercase tracking-widest">UNIT ID: {paper.arxiv_id}</span>
                                                        {paper.ingested_at && (
                                                            <>
                                                                <div className="w-1 h-1 rounded-full bg-foreground/10" />
                                                                <span className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-widest">{new Date(paper.ingested_at).toLocaleDateString()}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                    <h4 className="text-xl font-black text-foreground leading-tight tracking-tighter group-hover/unit:text-primary transition-colors">
                                                        {paper.title}
                                                    </h4>
                                                    <p className="text-sm font-black text-muted-foreground/40 mt-3 tracking-tight">
                                                        {paper.authors?.join(', ')}
                                                    </p>
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-12 w-12 rounded-2xl bg-destructive/5 text-destructive opacity-0 group-hover/unit:opacity-100 transition-all hover:bg-destructive hover:text-white shadow-sm"
                                                        onClick={() => handleDelete(paper.arxiv_id)}
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </Button>
                                                </div>
                                            </div>
                                            
                                            <div className="mt-8 flex items-center justify-between gap-6">
                                                <div className="flex items-center gap-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-[8px] font-black uppercase tracking-widest text-primary/40">Density</span>
                                                        <span className="text-xs font-black">{paper.pages} Pages</span>
                                                    </div>
                                                    <div className="w-px h-6 bg-foreground/5" />
                                                    <div className="flex flex-col">
                                                        <span className="text-[8px] font-black uppercase tracking-widest text-primary/40">Status</span>
                                                        <span className="text-xs font-black text-primary/60">SYNTHESIZED</span>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-11 rounded-xl border-foreground/5 bg-white/40 hover:bg-primary hover:text-white transition-all px-6 text-[10px] font-black uppercase tracking-widest active-compress"
                                                    onClick={() => handleCopyBibtex(paper.arxiv_id)}
                                                >
                                                    <Copy className="w-3.5 h-3.5 mr-2" />
                                                    Metadata
                                                </Button>
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
