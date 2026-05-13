"use client";

import { useState, useRef } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Plus, Sparkles, RefreshCw, Layers, CheckCircle2, Upload, FileText, X, Terminal } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/lib/sidebar-context';

export function AdminPanel() {
    const { isOpen } = useSidebar();
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
                    message: res.data.message || `Successfully uploaded ${selectedFiles.length} documents.`
                });
                setSelectedFiles([]);
                window.dispatchEvent(new Event('paper-ingested'));
            } else {
                throw new Error(res.data.message || 'Upload failed');
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Upload failed.';
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
                <button className={cn(
                    "flex items-center rounded-xl text-muted-foreground hover:bg-black/5 hover:text-foreground transition-all w-full text-left premium-button group",
                    isOpen ? "gap-3 px-3.5 py-2.5" : "justify-center p-2.5"
                )}>
                    <Plus className="w-5 h-5 group-hover:text-primary transition-colors shrink-0" />
                    {isOpen && <span className="text-sm font-semibold tracking-tight">Add Files</span>}
                </button>
            </SheetTrigger>
            <SheetContent 
                side="right" 
                className="w-full sm:max-w-xl md:max-w-2xl bg-card border-l border-border p-0 flex flex-col shadow-2xl h-screen h-[100dvh]"
            >
                <div className="shrink-0 px-5 sm:px-8 py-5 sm:py-6 border-b border-border flex items-center gap-4">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                        <Plus className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                    </div>
                    <div>
                        <SheetTitle className="text-xl sm:text-2xl font-bold tracking-tight">Add Files</SheetTitle>
                        <SheetDescription className="text-[9px] font-bold text-primary/60 uppercase tracking-[0.2em] mt-1">Upload PDF</SheetDescription>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-8 space-y-6 min-h-0">
                    <div className="space-y-3">
                        <p className="text-sm font-medium text-muted-foreground/60 leading-relaxed">
                            Add your PDFs here so the AI can read them.
                        </p>

                        <div className="p-4 sm:p-5 bg-muted/50 rounded-2xl border border-transparent hover:bg-card hover:border-border hover:shadow-premium transition-all flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                                <Layers className="w-4.5 h-4.5 text-primary opacity-40 group-hover:opacity-100 transition-opacity" />
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40 leading-none mb-1">Quality</span>
                                    <span className="text-xs font-bold text-foreground">{useSheetRAG ? 'Highest' : 'Normal'}</span>
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
                        className="flex flex-col items-center justify-center p-8 sm:p-10 rounded-3xl border-2 border-dashed border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/40 transition-all cursor-pointer group premium-button"
                    >
                        <input 
                            type="file" 
                            multiple 
                            accept=".pdf" 
                            className="hidden" 
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                        />
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-card flex items-center justify-center shadow-premium group-hover:scale-110 transition-all mb-4">
                            <Upload className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
                        </div>
                        <h4 className="text-base sm:text-lg font-bold tracking-tight mb-1">Upload PDF</h4>
                        <p className="text-xs font-medium text-muted-foreground/50">Drop PDFs here or click to choose</p>
                    </div>

                    <AnimatePresence>
                        {selectedFiles.length > 0 && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-4 overflow-hidden"
                            >
                                <div className="flex items-center justify-between px-1">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary/60">{selectedFiles.length} Files Selected</span>
                                    <button className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/40 hover:text-destructive transition-colors premium-button" onClick={() => setSelectedFiles([])}>Discard All</button>
                                </div>
                                
                                <div className="max-h-40 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                    {selectedFiles.map((file, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-transparent hover:border-border hover:bg-card transition-all group">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-7 h-7 rounded-lg bg-primary/5 flex items-center justify-center text-primary shrink-0 opacity-40 group-hover:opacity-100 transition-opacity">
                                                    <FileText className="w-3.5 h-3.5" />
                                                </div>
                                                <span className="text-xs font-bold truncate text-foreground/70">{file.name}</span>
                                            </div>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); removeFile(i); }} 
                                                className="p-1 text-muted-foreground/30 hover:text-destructive transition-colors premium-button"
                                                aria-label="Remove file"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <Button 
                                    onClick={handleUpload}
                                    disabled={loading}
                                    className="w-full h-14 rounded-2xl bg-primary hover:shadow-lg shadow-primary/20 text-white text-sm font-bold tracking-tight premium-button"
                                >
                                    {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2.5" /> : <Sparkles className="w-4 h-4 mr-2.5" />}
                                    {loading ? 'ADDING...' : 'ADD FILES'}
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
                                    "p-5 rounded-2xl border flex items-center gap-4 shadow-premium mb-8",
                                    status.type === 'success' ? 'bg-primary/5 border-primary/20 text-primary' : 'bg-destructive/5 border-destructive/20 text-destructive'
                                )}
                            >
                                <div className={cn(
                                    "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                                    status.type === 'success' ? 'bg-primary/10' : 'bg-destructive/10'
                                )}>
                                    {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <Terminal className="w-5 h-5" />}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">Status</span>
                                    <p className="text-xs font-bold tracking-tight leading-snug break-words">{status.message}</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </SheetContent>
        </Sheet>
    );
}
