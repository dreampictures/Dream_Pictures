import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { motion } from "framer-motion";
import { Lock, Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Album, AlbumImage } from "@shared/schema";

export default function AlbumDetail() {
  const { id } = useParams();
  const { data, isLoading } = useQuery<{ album: Album; images: AlbumImage[] }>({
    queryKey: [`/api/albums/${id}`],
  });

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">
    <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>;

  if (!data) return <div className="min-h-screen pt-32 text-center font-serif text-3xl">Album not found</div>;

  const { album, images } = data;

  return (
    <div className="min-h-screen bg-noise">
      {/* Cinematic Header */}
      <div className="relative h-[60vh] flex items-end justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-fixed brightness-50"
          style={{ backgroundImage: `url(${album.coverImageUrl})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-black/30" />
        
        <div className="relative z-10 text-center pb-24 px-4">
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-primary uppercase tracking-[0.4em] text-xs mb-4"
          >
            Private Collection
          </motion.p>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-serif text-5xl md:text-7xl lg:text-8xl text-white mb-6"
          >
            {album.title}
          </motion.h1>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-8 text-white/50 uppercase tracking-widest text-[10px]"
          >
            <span>Client: {album.clientName}</span>
            <span className="w-1 h-1 bg-primary rounded-full" />
            <span>Date: {album.eventDate}</span>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-24">
        <div className="flex justify-between items-center mb-16 border-b border-white/5 pb-8">
          <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-widest">
            <Lock className="w-3 h-3" /> Secure Gallery
          </div>
          <div className="flex gap-4">
            <Button variant="outline" size="sm" className="gap-2 border-white/10 hover:bg-primary hover:text-primary-foreground">
              <Download className="w-4 h-4" /> Download All
            </Button>
            <Button variant="outline" size="sm" className="gap-2 border-white/10">
              <Share2 className="w-4 h-4" /> Share
            </Button>
          </div>
        </div>

        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
          {images.map((img, idx) => (
            <motion.div
              key={img.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: (idx % 3) * 0.1 }}
              viewport={{ once: true }}
              className="relative group cursor-zoom-in"
            >
              <img 
                src={img.imageUrl} 
                alt={`${album.title} - ${idx}`} 
                className="w-full h-auto rounded-sm hover:brightness-110 transition-all duration-500"
              />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
          ))}
        </div>
        
        {images.length === 0 && (
          <div className="text-center py-32 border border-dashed border-white/10 rounded-lg">
            <p className="text-muted-foreground font-light italic">Your digital memories are being curated. Please check back shortly.</p>
          </div>
        )}
      </div>
    </div>
  );
}
