"use client";

import { useState, useEffect, useCallback } from 'react';
import { api, RecommendedPaper } from '@/lib/api';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, RefreshCw, Activity, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface RecommendationsProps {
    query?: string;
    paperId?: string;
    type: 'query' | 'paper';
}

export function Recommendations({ query, paperId, type }: RecommendationsProps) {
    const [recommendations, setRecommendations] = useState<RecommendedPaper[]>([]);
    const [loading, setLoading] = useState(false);

    const loadRecommendations = useCallback(async () => {
        if (!query && !paperId) return;
        setLoading(true);
        try {
            const res = type === 'query'
                ? await api.getRecommendationsByQuery(query!)
                : await api.getRecommendationsByPaper(paperId!);
            setRecommendations(res.data.recommendations);
        } catch (error) { console.error('Error loading recommendations:', error); }
        setLoading(false);
    }, [query, paperId, type]);

    useEffect(() => {
        loadRecommendations();
    }, [loadRecommendations]);

    if (!loading && recommendations.length === 0) return null;

    return (
        <div className="space-y-6 sm:space-y-10">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-primary/5 flex items-center justify-center border border-primary/10 relative overflow-hidden group">
                        <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-primary relative z-10 group-hover:scale-110 transition-transform" />
                        <div className="absolute inset-0 bg-primary/10 animate-pulse" />
                    </div>
                    <div>
                        <h3 className="text-sm sm:text-base font-black uppercase tracking-widest text-foreground">Discovery Matrix</h3>
                        <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Synthesized Expansion Nodes</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-full hover:bg-primary/5 text-muted-foreground hover:text-primary transition-all px-4"
                        onClick={loadRecommendations}
                        disabled={loading}
                    >
                        <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Resynthesize</span>
                    </Button>
                </div>
            </div>

            {/* Grid Area */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 overflow-x-hidden no-x-scroll pb-10">
                <AnimatePresence mode="popLayout">
                    {loading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <div key={`skeleton-${i}`} className="h-[280px] rounded-3xl skeleton-pulse border border-border" />
                        ))
                    ) : (
                        recommendations.map((paper, idx) => (
                            <motion.div
                                key={paper.arxiv_id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="group relative"
                            >
                                <Card className="h-full surface-panel border-border rounded-3xl overflow-hidden hover:bg-white hover:shadow-xl hover:border-primary/20 transition-all duration-500 flex flex-col group/card min-h-[320px]">
                                    <div className="p-5 sm:p-6 flex-1 flex flex-col">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <Activity className="w-3 h-3 text-primary/40" />
                                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Unit {paper.arxiv_id}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/5 border border-primary/10">
                                                <div className="w-1 h-1 rounded-full bg-primary" />
                                                <span className="text-[9px] font-black text-primary">{(paper.score * 100).toFixed(0)}% MATCH</span>
                                            </div>
                                        </div>

                                        <CardTitle className="text-sm sm:text-base font-black leading-tight tracking-tight mb-3 group-hover/card:text-primary transition-colors line-clamp-2 break-words">
                                            {paper.title}
                                        </CardTitle>
                                        
                                        <p className="text-[11px] sm:text-xs text-muted-foreground/60 line-clamp-3 font-medium leading-relaxed mb-6 italic break-words">
                                            &quot;{paper.summary}&quot;
                                        </p>

                                        <div className="mt-auto flex items-center justify-between gap-4">
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/30">Intelligence Era</span>
                                                <span className="text-[10px] font-bold">{paper.year}</span>
                                            </div>
                                            <a 
                                                href={paper.url} 
                                                target="_blank" 
                                                className="w-8 h-8 rounded-full bg-black/5 hover:bg-primary hover:text-white flex items-center justify-center transition-all group/link shrink-0"
                                            >
                                                <ExternalLink className="w-3.5 h-3.5" />
                                            </a>
                                        </div>
                                    </div>
                                    
                                    {/* Interactive Progress Bar */}
                                    <div className="h-1 w-full bg-border mt-auto overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${paper.score * 100}%` }}
                                            transition={{ duration: 1, delay: 0.5 + idx * 0.1 }}
                                            className="h-full bg-primary/40 group-hover/card:bg-primary transition-colors" 
                                        />
                                    </div>
                                </Card>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
