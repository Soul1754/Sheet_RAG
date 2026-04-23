"use client";

import { useState, useEffect } from 'react';
import { api, RecommendedPaper } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, BookOpen, RefreshCw, Sparkles, Activity, Zap } from 'lucide-react';

interface RecommendationsProps {
    query?: string;
    paperId?: string;
    type: 'query' | 'paper';
}

export function Recommendations({ query, paperId, type }: RecommendationsProps) {
    const [recommendations, setRecommendations] = useState<RecommendedPaper[]>([]);
    const [loading, setLoading] = useState(false);

    const loadRecommendations = async () => {
        if (!query && !paperId) return;
        setLoading(true);
        try {
            const res = type === 'query'
                ? await api.getRecommendationsByQuery(query!)
                : await api.getRecommendationsByPaper(paperId!);
            setRecommendations(res.data.recommendations);
        } catch (error) { console.error('Error loading recommendations:', error); }
        setLoading(false);
    };

    useEffect(() => {
        loadRecommendations();
    }, [query, paperId]);

    if (!loading && recommendations.length === 0) return null;

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-10 block physics-spring">
            <div className="flex items-center justify-between border-b border-foreground/5 pb-6">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 animate-pulse">
                        <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-[0.25em] text-foreground/80">Synthesized Discovery Matrix</h3>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/40 mt-0.5">Automated Intelligence expansion</p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full hover:bg-primary/10 text-primary/30 hover:text-primary transition-all active-compress"
                    onClick={loadRecommendations}
                    disabled={loading}
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    [1, 2, 3].map((i) => (
                        <div key={i} className="h-48 surface-panel rounded-[2.5rem] skeleton-pulse border-white/40" />
                    ))
                ) : (
                    recommendations.map((paper, idx) => (
                        <Card 
                            key={paper.arxiv_id} 
                            className="group/rec surface-panel rounded-[2.5rem] border-white/80 overflow-hidden relative physics-spring hover:bg-white hover:shadow-premium hover:-translate-y-2 animate-slide-up"
                            style={{ animationDelay: `${idx * 100}ms` }}
                        >
                            <div className="absolute top-6 right-6 z-20 translate-x-4 opacity-0 group-hover/rec:translate-x-0 group-hover/rec:opacity-100 transition-all duration-500 physics-spring">
                                <a
                                    href={paper.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white shadow-premium hover:shadow-emerald-glow active-compress"
                                >
                                    <ExternalLink className="w-5 h-5" />
                                </a>
                            </div>
                            
                            <CardHeader className="p-8 pb-4">
                                <div className="flex items-center gap-3 mb-3">
                                    <Activity className="w-3.5 h-3.5 text-primary opacity-40" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-primary/60">Node {paper.arxiv_id}</span>
                                </div>
                                <CardTitle className="text-base font-black leading-tight tracking-tighter text-foreground/80 group-hover/rec:text-primary transition-colors line-clamp-2 pr-10">
                                    {paper.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 pt-0">
                                <p className="text-xs text-muted-foreground/60 line-clamp-3 font-semibold leading-relaxed mb-8 tracking-tight italic">
                                    "{paper.summary}"
                                </p>
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-black uppercase tracking-widest text-foreground/20">Synthesized</span>
                                        <span className="text-[10px] font-black text-primary/60">{paper.year}</span>
                                    </div>
                                    <div className="w-px h-6 bg-foreground/5" />
                                    <div className="flex-1 flex flex-col items-end">
                                        <span className="text-[8px] font-black uppercase tracking-widest text-foreground/20">Relevance Matrix</span>
                                        <div className="flex items-center gap-2">
                                            <div className="h-1 w-16 bg-foreground/5 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-primary transition-all duration-1000 delay-500" 
                                                    style={{ width: `${paper.score * 100}%` }}
                                                />
                                            </div>
                                            <span className="text-[10px] font-black text-foreground/40">{(paper.score * 100).toFixed(0)}%</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
