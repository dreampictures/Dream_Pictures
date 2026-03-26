import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";

export default function Home() {
  const [, setLocation] = useLocation();
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setIsSubmitting(true);
    // Add brief artificial delay for smooth cinematic effect
    setTimeout(() => {
      setLocation(`/golden-album/${code.trim().toLowerCase()}`);
    }, 600);
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-center items-center overflow-hidden bg-black">
      {/* Background Image with dark wash overlay */}
      {/* landing page hero cinematic elegant wedding dark */}
      <img
        src="https://images.unsplash.com/photo-1519741497674-611481863552?w=1920&h=1080&fit=crop&q=80"
        alt="Cinematic Wedding Background"
        className="absolute inset-0 w-full h-full object-cover object-center opacity-40 select-none pointer-events-none"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/90 pointer-events-none" />

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md px-6"
      >
        <div className="glass-panel rounded-2xl p-8 md:p-12 text-center relative overflow-hidden group">
          {/* Subtle hover glow effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/0 via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-5xl mb-3 text-gold-gradient font-medium tracking-wide">
              Client Album Access
            </h1>
            <p className="text-white/60 text-sm md:text-base font-sans tracking-wide leading-relaxed mb-8">
              Enter your exclusive album code to relive your timeless memories.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="relative">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. mr_singh"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-5 py-4 text-center text-white placeholder:text-white/30 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-sans text-lg tracking-wider gold-glow"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <button
                type="submit"
                disabled={!code.trim() || isSubmitting}
                className="w-full bg-gradient-to-r from-[#B38D2F] to-[#D4AF37] text-black font-semibold py-4 rounded-xl shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:shadow-[0_0_30px_rgba(212,175,55,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100 uppercase tracking-widest text-sm"
              >
                {isSubmitting ? "Unlocking..." : "Open Album"}
              </button>
            </form>
          </motion.div>
        </div>
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-8 left-0 right-0 text-center z-10"
      >
        <div className="flex flex-col items-center gap-1">
          <p className="text-white/80 uppercase tracking-[0.4em] text-sm font-medium font-sans">
            
          </p>
          <p className="text-white/40 uppercase tracking-[0.2em] text-xs font-light font-sans">
            
          </p>
        </div>
      </motion.div>
    </div>
  );
}
