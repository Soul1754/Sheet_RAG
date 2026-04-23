"use client";

import { useState, useRef } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Plus, Sparkles, RefreshCw, Layers, CheckCircle2, Upload, FileText, X, Terminal } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';

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
            console.log("📂 [CLIENT] Staging units for synthesis:", files.map(f => f.name));
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
        console.log("🧬 [CLIENT] Initiating synthesis for units:", selectedFiles.map(f => f.name));
        
        try {
            const res = await api.uploadPapers(selectedFiles);
            console.log("📡 [CLIENT] API Response received:", res.data);
            
            if (res.data.success) {
                setStatus({
                    type: 'success',
                    message: res.data.message || `Successfully synthesized ${selectedFiles.length} units.`
                });
                setSelectedFiles([]);
                
                // Trigger cross-component matrix refresh
                window.dispatchEvent(new Event('paper-ingested'));
            } else {
                throw new Error(res.data.message || 'Matrix synthesis failed');
            }
        } catch (error: any) {
            console.error("🚨 [CLIENT] Synthesis error details:", error.response?.data || error.message);
            setStatus({
                type: 'error',
                message: error.response?.data?.detail || error.message || 'File synthesis failed. Ensure they are valid PDFs.'
            });
        }
        setLoading(false);
    };

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="w-12 h-12 rounded-full bg-primary/5 hover:bg-primary/10 text-primary/40 hover:text-primary transition-all active-compress border border-primary/10">
                    <Plus className="w-6 h-6" />
                </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-2xl bg-background/80 backdrop-blur-3xl border-l border-white/40 p-0 physics-spring">
                <div className="h-full flex flex-col p-12 overflow-hidden stagger-children">
                    <SheetHeader className="mb-10">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 rounded-[2rem] bg-primary flex items-center justify-center shadow-premium border border-white/20">
                                <Plus className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <SheetTitle className="text-4xl font-black tracking-tighter uppercase transition-all duration-700">Intelligence Ingest</SheetTitle>
                                <SheetDescription className="text-base font-black text-primary/40 uppercase tracking-[0.2em] mt-1">Local Library Synthesis</SheetDescription>
                            </div>
                        </div>
                        <p className="text-lg font-medium text-muted-foreground/60 leading-relaxed max-w-sm stagger-1">
                            Ingest your private research collection directly into the neural matrix for cross-document synthesis.
                        </p>
                    </SheetHeader>

                    {/* RAG Architecture Sync */}
                    <div className="p-1 surface-panel rounded-3xl mb-8 flex items-center justify-between px-6 py-4 stagger-2">
                        <div className="flex items-center gap-4">
                            <Layers className="w-5 h-5 text-primary opacity-40" />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-widest text-foreground/40 leading-none">RAG Architecture</span>
                                <span className="text-sm font-black text-foreground/80">{useSheetRAG ? 'Hierarchical Graph' : 'Standard Vector'}</span>
                            </div>
                        </div>
                        <Switch
                            checked={useSheetRAG}
                            onCheckedChange={setUseSheetRAG}
                            className="data-[state=checked]:bg-primary h-7 w-12"
                        />
                    </div>

                    <div className="flex-1 flex flex-col min-h-0 space-y-8 stagger-3">
                        {/* Pure Local Upload Surface */}
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-1 flex flex-col items-center justify-center p-12 rounded-[2.5rem] border-2 border-dashed border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all cursor-pointer group animate-in zoom-in-95 duration-500"
                        >
                            <input 
                                type="file" 
                                multiple 
                                accept=".pdf" 
                                className="hidden" 
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                            />
                            <div className="w-24 h-24 rounded-[2.5rem] bg-white flex items-center justify-center shadow-premium group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 physics-spring mb-8">
                                <Upload className="w-12 h-12 text-primary" />
                            </div>
                            <h4 className="text-2xl font-black tracking-tight mb-2">Neural Binary Upload</h4>
                            <p className="text-sm font-medium text-muted-foreground/60">Drop multiple PDFs or click to explore</p>
                        </div>

                        {selectedFiles.length > 0 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                                <div className="flex items-center justify-between px-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">{selectedFiles.length} Units Staged</span>
                                    </div>
                                    <Button variant="ghost" className="h-8 px-3 text-[9px] font-black uppercase tracking-widest hover:text-destructive" onClick={() => setSelectedFiles([])}>Discard All</Button>
                                </div>
                                
                                <ScrollArea className="max-h-56 pr-4">
                                    <div className="space-y-2">
                                        {selectedFiles.map((file, i) => (
                                            <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/40 border border-white/60 group/file hover:bg-white transition-all">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <FileText className="w-4 h-4 text-primary shrink-0 opacity-40 group-hover/file:opacity-100" />
                                                    <span className="text-xs font-black truncate text-foreground/70">{file.name}</span>
                                                </div>
                                                <button onClick={(e) => { e.stopPropagation(); removeFile(i); }} className="text-muted-foreground/20 hover:text-destructive transition-colors">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>

                                <Button 
                                    onClick={handleUpload}
                                    disabled={loading}
                                    className="w-full h-20 rounded-[2rem] bg-primary hover:bg-primary text-white text-lg font-black tracking-tight shadow-premium emerald-glow-primary transition-all active-compress"
                                >
                                    {loading ? <RefreshCw className="w-6 h-6 animate-spin mr-3" /> : <Sparkles className="w-6 h-6 mr-3" />}
                                    {loading ? 'SYNTHESIZING...' : 'START LOCAL INGEST'}
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Status Feedback */}
                    {status && (
                        <div className={`mt-8 p-6 rounded-[2rem] border flex items-center gap-5 slide-in-from-bottom-4 animate-in duration-500 physics-spring shrink-0 ${status.type === 'success' ? 'bg-primary/5 border-primary/20 text-primary shadow-premium' : 'bg-destructive/5 border-destructive/20 text-destructive'}`}>
                            {status.type === 'success' ? <CheckCircle2 className="w-6 h-6 shrink-0" /> : <Terminal className="w-6 h-6 shrink-0" />}
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Matrix System Log</span>
                                <p className="text-sm font-black tracking-tight">{status.message}</p>
                            </div>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
