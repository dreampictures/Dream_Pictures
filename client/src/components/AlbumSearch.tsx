import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Sparkles } from "lucide-react";

import albumPlaceholder from "@/assets/images/album-placeholder.jpg";

export default function AlbumSearch() {
  const [, setLocation] = useLocation();
  const [code, setCode] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLocation(`/albums/${code.trim()}`);
  };

  return (
    <div className="relative min-h-[80vh] w-full flex flex-col justify-center items-center overflow-hidden bg-black rounded-lg my-12">
      <img
        src={albumPlaceholder}
        alt="Cinematic Wedding Background"
        className="absolute inset-0 w-full h-full object-cover object-center opacity-40 select-none pointer-events-none"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/90 pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md px-6"
      >
        <Card className="bg-black/40 backdrop-blur-md border-white/10 rounded-2xl p-8 md:p-12 text-center relative overflow-hidden group shadow-2xl">
          <CardContent className="p-0 space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 mb-2">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h2 className="font-serif text-3xl md:text-4xl text-white tracking-tight">Access Your Album</h2>
              <p className="text-white/60 font-light text-sm tracking-widest uppercase">Enter your unique access code</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. SMITH-WED-2024"
                  className="bg-white/5 border-white/10 text-white text-center h-14 tracking-widest uppercase placeholder:text-white/20 focus:border-primary/50 transition-all"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full h-14 bg-primary hover:bg-white hover:text-black text-white transition-all duration-500 uppercase tracking-[0.2em] text-xs group"
              >
                Open Gallery
                <Search className="w-4 h-4 ml-2 group-hover:scale-110 transition-transform" />
              </Button>
            </form>

            <p className="text-[10px] text-white/30 uppercase tracking-[0.3em]">Secure • Private • Cinematic</p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
