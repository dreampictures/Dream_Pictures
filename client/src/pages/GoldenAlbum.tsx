import { useParams, Link } from "wouter";
import { useAlbum } from "@/hooks/use-album";
import { LoadingScreen } from "@/components/LoadingScreen";
import { FlipbookViewer } from "@/components/FlipbookViewer";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

export default function Album() {
  const params = useParams<{ code: string }>();
  const code = params.code || null;

  const { data: album, isLoading, error } = useAlbum(code);

  if (isLoading) {
    return <LoadingScreen />;
  }

  // Handle errors gracefully (e.g. 404 Not Found)
  if (error || !album || album.pages.length === 0) {
    const isNotFound = error?.message === "ALBUM_NOT_FOUND";

    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center p-6 text-center overflow-hidden">
        {/* Cinematic Background elements for consistency even on error */}
        <img
          src="https://images.unsplash.com/photo-1519741497674-611481863552?w=1920&h=1080&fit=crop&q=80"
          alt=""
          className="cinematic-bg"
        />
        <div className="cinematic-overlay" />
        <div className="vignette" />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-md glass-panel p-10"
        >
          <h2 className="text-3xl font-display text-gold-gradient mb-4">
            {isNotFound ? "Album Not Found" : "Loading Error"}
          </h2>
          <p className="text-white/60 mb-8 font-sans leading-relaxed">
            {isNotFound
              ? "Your album is being prepared. Please contact Dream Pictures Photography for access."
              : "We encountered an issue loading your memories. Please try again."}
          </p>

          <Link href="/">
            <a className="inline-flex items-center gap-2 px-6 py-3 border border-primary/40 text-primary hover:bg-primary hover:text-black rounded-full transition-all duration-300 font-sans tracking-wider text-sm uppercase">
              <ArrowLeft className="w-4 h-4" />
              Return Home
            </a>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-black overflow-x-hidden">
      {/* Cinematic Background Layer */}
      <div className="fixed inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1519741497674-611481863552?w=1920&h=1080&fit=crop&q=80"
          alt=""
          className="cinematic-bg md:blur-[24px] blur-none"
        />
        <div className="cinematic-overlay" />
        <div className="vignette" />
        <div className="light-rays" />

        {/* Subtle Particles */}
        <div className="particles-container hidden md:block">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="particle"
              style={
                {
                  left: `${Math.random() * 100}%`,
                  "--duration": `${20 + Math.random() * 20}s`,
                  "--drift": `${(Math.random() - 0.5) * 200}px`,
                  animationDelay: `${-Math.random() * 20}s`,
                  width: `${2 + Math.random() * 3}px`,
                  height: `${2 + Math.random() * 3}px`,
                } as any
              }
            />
          ))}
        </div>
        {/* Reduced particles for mobile */}
        <div className="particles-container md:hidden">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="particle"
              style={
                {
                  left: `${Math.random() * 100}%`,
                  "--duration": `${25 + Math.random() * 15}s`,
                  "--drift": `${(Math.random() - 0.5) * 100}px`,
                  animationDelay: `${-Math.random() * 25}s`,
                  width: `${2 + Math.random() * 2}px`,
                  height: `${2 + Math.random() * 2}px`,
                } as any
              }
            />
          ))}
        </div>
      </div>

      {/* Content Layer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="relative z-10 w-full min-h-screen py-12 px-4 md:px-8 flex flex-col items-center"
      >
        <div className="w-full max-w-7xl">
          {/* Header */}
          <div className="flex justify-between items-center mb-12">
            <Link href="/">
              <a className="group flex items-center gap-2 text-white/50 hover:text-primary transition-all">
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span className="text-xs uppercase tracking-[0.2em]">
                  Exit Gallery
                </span>
              </a>
            </Link>

            <div className="text-right">
              <h1 className="text-3xl md:text-4xl text-gold-gradient mb-1">
                {album.code.charAt(0).toUpperCase() + album.code.slice(1)}
              </h1>
              <div className="flex flex-col items-end opacity-40">
                <p className="text-[10px] md:text-xs uppercase tracking-[0.4em] font-medium font-sans">
                  Dream Pictures
                </p>
                <p className="text-[8px] md:text-[10px] uppercase tracking-[0.2em] font-light font-sans">
                  Photography & Films
                </p>
              </div>
            </div>
          </div>

          {/* Main Flipbook Area */}
          <div className="flex-1 flex items-center justify-center p-4 md:p-8">
            <div className="w-full max-w-7xl h-full flex items-center justify-center">
              <FlipbookViewer pages={album.pages} albumName={album.code} />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
