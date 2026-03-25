import { useEffect } from "react";
import { motion } from "framer-motion";
import { usePortfolio } from "@/hooks/use-portfolio";
import type { PortfolioItemResponse } from "@shared/routes";
import { Loader2, Image as ImageIcon } from "lucide-react";

import veniceImg from "@/assets/images/venice.jpg";
import goldenHourImg from "@/assets/images/golden-hour.jpg";
import firstDanceImg from "@/assets/images/first-dance.jpg";
import urbanEditorialImg from "@/assets/images/urban-editorial.jpg";
import promisesImg from "@/assets/images/promises.jpg";
import cinematicEscapesImg from "@/assets/images/cinematic-escapes.jpg";

// Stunning Unsplash fallback if DB is empty
const MOCK_GALLERY = [
  { id: "m1", title: "Elegance in Venice", category: "Wedding", img: veniceImg, span: "md:col-span-2 md:row-span-2" },
  { id: "m2", title: "Golden Hour", category: "Pre-Wedding", img: goldenHourImg, span: "md:col-span-1 md:row-span-1" },
  { id: "m3", title: "The First Dance", category: "Cinematography", img: firstDanceImg, span: "md:col-span-1 md:row-span-2" },
  { id: "m4", title: "Urban Editorial", category: "Portrait", img: urbanEditorialImg, span: "md:col-span-1 md:row-span-1" },
  { id: "m5", title: "Promises", category: "Wedding", img: promisesImg, span: "md:col-span-2 md:row-span-1" },
  { id: "m6", title: "Cinematic Escapes", category: "Cinematography", img: cinematicEscapesImg, span: "md:col-span-1 md:row-span-1" },
];

export default function Portfolio() {
  const { data: portfolioItems, isLoading, error } = usePortfolio();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  // Determine what to render (DB data or MOCK data if empty/loading fails)
  const hasDbData = portfolioItems && portfolioItems.length > 0;
  
  return (
    <div className="bg-noise min-h-screen pt-32 pb-24">
      {/* HEADER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 text-center">
        <motion.p 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}
          className="text-primary tracking-[0.3em] uppercase text-sm mb-6"
        >
          Curated Gallery
        </motion.p>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.2 }}
          className="font-serif text-5xl md:text-7xl font-medium leading-tight text-white mb-6"
        >
          A Legacy of Love
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.4 }}
          className="max-w-2xl mx-auto text-muted-foreground text-lg font-light leading-relaxed"
        >
          Explore a selection of our most cherished moments, crafted with cinematic precision and an editorial eye.
        </motion.p>
      </div>

      {/* GALLERY GRID */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-muted-foreground tracking-widest uppercase text-sm">Curating Portfolio...</p>
          </div>
        ) : error && !hasDbData ? (
          <div className="text-center py-32 space-y-4 border border-white/5 bg-white/[0.02]">
            <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground/30" />
            <p className="text-muted-foreground tracking-widest uppercase">Unable to load gallery</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 md:auto-rows-[300px] gap-4 md:gap-6">
            {hasDbData ? (
              // Map DB Items
              (portfolioItems as PortfolioItemResponse).map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: (idx % 3) * 0.1 }}
                  viewport={{ once: true }}
                  className={`group relative overflow-hidden bg-muted aspect-square md:aspect-auto ${idx % 4 === 0 ? 'md:col-span-2 md:row-span-2' : 'md:col-span-1 md:row-span-1'}`}
                >
                  <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover filter brightness-90 group-hover:scale-105 group-hover:brightness-50 transition-all duration-700" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 bg-black/40">
                    <p className="text-primary text-xs uppercase tracking-[0.2em] mb-3">{item.category}</p>
                    <p className="text-white font-serif text-3xl tracking-wide text-center px-4">{item.title}</p>
                  </div>
                </motion.div>
              ))
            ) : (
              // Map Mock Items
              MOCK_GALLERY.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: (idx % 3) * 0.1 }}
                  viewport={{ once: true }}
                  className={`group relative overflow-hidden bg-muted aspect-square md:aspect-auto ${item.span}`}
                >
                  <img src={item.img} alt={item.title} className="w-full h-full object-cover filter brightness-90 group-hover:scale-105 group-hover:brightness-50 transition-all duration-700" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 bg-black/40">
                    <p className="text-primary text-xs uppercase tracking-[0.2em] mb-3">{item.category}</p>
                    <p className="text-white font-serif text-3xl tracking-wide text-center px-4">{item.title}</p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="mt-32 text-center border-t border-white/5 pt-24 px-4">
        <h2 className="font-serif text-4xl mb-8">Inspired by what you see?</h2>
        <a href="/#contact" className="inline-block px-12 py-5 border-2 border-primary text-primary uppercase tracking-widest text-sm hover:bg-primary hover:text-primary-foreground transition-all duration-500">
          Book Your Session
        </a>
      </div>
    </div>
  );
}
