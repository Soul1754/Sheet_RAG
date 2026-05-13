"use client";

import { useState, useRef } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Plus, Sparkles, RefreshCw, Layers, CheckCircle2, Upload, FileText, X, Terminal } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export function AdminPanel() {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [useSheetRAG, setUseSheetRAG] = useState(true);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files).filter(f => 
                f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
            );
            setSelectedFiles(prev => [...prev, ...files]);
        }
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleUpload = async () => {
        if (selectedFiles.length === 0) return;
        setLoading(true);
        setStatus(null);
        
        try {
            const res = await api.uploadPapers(selectedFiles);
            if (res.data.success) {
                setStatus({
                    type: 'success',
                    message: res.data.message || `Successfully synthesized ${selectedFiles.length} units.`
                });
                setSelectedFiles([]);
                window.dispatchEvent(new Event('paper-ingested'));
            } else {
                throw new Error(res.data.message || 'Matrix synthesis failed');
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'File synthesis failed.';
            setStatus({
                type: 'error',
                message: errorMessage
            });
        }
        setLoading(false);
    };

    return (
        <Sheet>
            <SheetTrigger asChild>
                <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:bg-black/5 hover:text-foreground transition-all w-full text-left">
                    <Plus className="w-5 h-5" />
                    <span className="text-sm font-semibold tracking-tight">Intelligence Ingest</span>
                </button>
            </SheetTrigger>
            <SheetContent 
                side="right" 
                className="w-full sm:max-w-xl md:max-w-2xl bg-white/95 backdrop-blur-xl border-l border-border p-0 flex flex-col shadow-2xl h-screen h-[100dvh]"
            >
                <div className="shrink-0 px-6 sm:px-10 py-8 border-b border-border flex items-center gap-5 safe-scroll">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg border border-primary/20 shrink-0">
                        <Plus className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    </div>
                    <div>
                        <SheetTitle className="text-2xl sm:text-3xl font-black tracking-tighter">Intelligence Ingest</SheetTitle>
                        <SheetDescription className="text-[10px] font-black text-primary/60 uppercase tracking-[0.2em] mt-1">Local Library Synthesis</SheetDescription>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar overscroll-contain p-6 sm:p-10 space-y-8 momentum-scroll min-h-0">
                    <div className="space-y-4">
                        <p className="text-sm sm:text-base font-medium text-muted-foreground/60 leading-relaxed">
                            Ingest your private research collection directly into the neural matrix for cross-document synthesis.
                        </p>

                        <div className="p-4 sm:p-5 bg-black/5 rounded-2xl border border-border flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Layers className="w-4 h-4 text-primary opacity-40" />
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 leading-none mb-1">Architecture</span>
                                    <span className="text-xs font-bold text-foreground">{useSheetRAG ? 'Hierarchical Graph' : 'Standard Vector'}</span>
                                </div>
                            </div>
                            <Switch
                                checked={useSheetRAG}
                                onCheckedChange={setUseSheetRAG}
                                className="data-[state=checked]:bg-primary"
                            />
                        </div>
                    </div>

                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex flex-col items-center justify-center p-8 sm:p-12 rounded-3xl border-2 border-dashed border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all cursor-pointer group"
                    >
                        <input 
                            type="file" 
                            multiple 
                            accept=".pdf" 
                            className="hidden" 
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                        />
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-all mb-6">
                            <Upload className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                        </div>
                        <h4 className="text-lg sm:text-xl font-black tracking-tight mb-1">Neural Binary Upload</h4>
                        <p className="text-xs font-medium text-muted-foreground/50">Drop PDFs or click to explore</p>
                    </div>

                    <AnimatePresence>
                        {selectedFiles.length > 0 && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-4 overflow-hidden"
                            >
                                <div className="flex items-center justify-between px-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">{selectedFiles.length} Units Staged</span>
                                    <button className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 hover:text-destructive transition-colors" onClick={() => setSelectedFiles([])}>Discard All</button>
                                </div>
                                
                                <div className="max-h-48 overflow-y-auto space-y-2 pr-2 custom-scrollbar overscroll-contain momentum-scroll">
                                    {selectedFiles.map((file, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-black/5 border border-transparent hover:border-border hover:bg-white transition-all">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <FileText className="w-4 h-4 text-primary shrink-0 opacity-40" />
                                                <span className="text-xs font-bold truncate text-foreground/70">{file.name}</span>
                                            </div>
                                            <button onClick={(e) => { e.stopPropagation(); removeFile(i); }} className="text-muted-foreground/30 hover:text-destructive transition-colors">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <Button 
                                    onClick={handleUpload}
                                    disabled={loading}
                                    className="w-full h-16 rounded-2xl bg-primary hover:bg-primary/90 text-white text-base font-black tracking-tight shadow-xl active-compress"
                                >
                                    {loading ? <RefreshCw className="w-5 h-5 animate-spin mr-3" /> : <Sparkles className="w-5 h-5 mr-3" />}
                                    {loading ? 'SYNTHESIZING...' : 'START LOCAL INGEST'}
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {status && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={cn(
                                    "p-5 rounded-2xl border flex items-center gap-4 shadow-lg pb-10",
                                    status.type === 'success' ? 'bg-primary/5 border-primary/20 text-primary' : 'bg-destructive/5 border-destructive/20 text-destructive'
                                )}
                            >
                                {status.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <Terminal className="w-5 h-5 shrink-0" />}
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black uppercase tracking-widest opacity-60">Matrix System Log</span>
                                    <p className="text-xs font-black tracking-tight leading-tight break-words">{status.message}</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </SheetContent>
        </Sheet>
    );
}
