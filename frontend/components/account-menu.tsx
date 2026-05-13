"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LogOut, LogIn, User, Mail, 
  Settings, ChevronRight, Sparkles,
  Lock, Eye, EyeOff
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@/lib/user-context";
import { 
  Dialog, DialogContent, DialogHeader, 
  DialogTitle, DialogDescription 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function AccountMenu() {
  const { user, isLoggedIn, logout } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const initials = isLoggedIn && user 
    ? user.name.split(" ").map(n => n[0]).join("").toUpperCase() 
    : "GU";

  return (
    <div className="relative">
      {/* --- TRIGGER --- */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 pl-1 pr-1 sm:pr-3 py-1 bg-card border border-border rounded-full hover:shadow-md transition-all group outline-none focus:ring-2 focus:ring-primary/20",
          isOpen && "ring-2 ring-primary/20 shadow-md"
        )}
      >
        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-[10px] font-bold text-white uppercase shrink-0 group-hover:scale-110 transition-transform shadow-inner">
          {initials}
        </div>
        <span className="text-sm font-semibold hidden md:inline truncate max-w-[80px]">
          {isLoggedIn && user ? user.name.split(" ")[0] : "Guest"}
        </span>
      </button>

      {/* --- DROPDOWN --- */}
      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-[100]" 
              onClick={() => setIsOpen(false)} 
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-3 w-[240px] bg-card border border-border rounded-2xl shadow-2xl z-[101] overflow-hidden"
            >
              {isLoggedIn && user ? (
                <>
                  {/* Logged In State */}
                  <div className="p-4 bg-muted/30 border-b border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-sm font-bold text-white uppercase shadow-lg shrink-0">
                        {initials}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold truncate leading-tight">{user.name}</span>
                        <span className="text-[10px] text-muted-foreground truncate leading-tight mt-0.5">{user.email}</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-1.5">
                    <button 
                      onClick={() => {
                        logout();
                        setIsOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/5 transition-all group"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log out</span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Logged Out State */}
                  <div className="p-4 bg-muted/30 border-b border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground shrink-0 border border-border">
                        <User className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold leading-tight">Guest User</span>
                        <span className="text-[10px] text-muted-foreground leading-tight mt-0.5">Please sign in</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-1.5">
                    <button 
                      onClick={() => {
                        setIsLoginModalOpen(true);
                        setIsOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-bold text-primary hover:bg-primary/5 transition-all group"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Sign In</span>
                    </button>
                  </div>
                </>
              )}

              {/* Version Footer */}
              <div className="px-4 py-2 bg-muted/5 border-t border-border flex items-center justify-center">
                <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">v2.5.0 Terminal</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* --- LOGIN MODAL --- */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
    </div>
  );
}

function LoginModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { login } = useUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate auth
    setTimeout(() => {
      const extractedName = email.split('@')[0];
      const formattedName = extractedName.charAt(0).toUpperCase() + extractedName.slice(1);
      login(email, formattedName);
      setIsLoading(false);
      onClose();
    }, 1200);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] bg-card border-border shadow-2xl p-0 overflow-hidden">
        <div className="p-8 space-y-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-xl">
              <Sparkles className="w-8 h-8 text-white animate-pulse" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black tracking-tight">Welcome Back</DialogTitle>
              <DialogDescription className="text-sm mt-1">Sign in to your research workspace</DialogDescription>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/90 ml-1">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@company.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 h-12 rounded-xl bg-muted/20 border-border focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/90 ml-1">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10 pr-10 h-12 rounded-xl bg-muted/20 border-border focus:ring-primary/20"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground/70 hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-3.5 h-3.5 rounded border-border bg-muted/20 text-primary focus:ring-primary/20" />
                <span className="text-[10px] font-bold text-muted-foreground group-hover:text-foreground transition-colors uppercase tracking-widest">Remember me</span>
              </label>
              <button type="button" className="text-[10px] font-bold text-primary hover:underline uppercase tracking-widest">Forgot password?</button>
            </div>

            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
            >
              {isLoading ? "Authenticating..." : "Sign In to Terminal"}
            </Button>
          </form>

          <div className="text-center">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Don't have an account? <button className="text-primary hover:underline">Sign up</button>
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
