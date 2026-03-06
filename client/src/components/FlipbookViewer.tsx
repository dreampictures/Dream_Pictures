import React, { useRef, useState, useEffect } from "react";
import HTMLFlipBook from "react-pageflip";
import { ChevronLeft, ChevronRight, Maximize, Minimize, Home, BookOpen } from "lucide-react";
import { Link } from "wouter";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

interface FlipbookViewerProps {
  pages: string[];
  albumName: string;
}

// Ensure the page component forwards its ref properly for HTMLFlipBook
const Page = React.forwardRef<HTMLDivElement, { imageUrl: string; index: number }>((props, ref) => {
  return (
    <div className="page st-page w-full h-full flex items-center justify-center bg-black" ref={ref}>
      <img
        src={props.imageUrl}
        alt={`Page ${props.index + 1}`}
        className="max-w-full max-h-full object-contain protect-img"
        onContextMenu={(e) => e.preventDefault()}
        draggable={false}
      />
    </div>
  );
});

Page.displayName = "Page";

export function FlipbookViewer({ pages, albumName }: FlipbookViewerProps) {
  const flipBookRef = useRef<any>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  
  // Auto-hide controls after a few seconds of inactivity
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const resetTimer = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setShowControls(false), 3000);
    };

    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("touchstart", resetTimer);
    resetTimer();

    return () => {
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("touchstart", resetTimer);
      clearTimeout(timeout);
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") nextButtonClick();
      if (e.key === "ArrowLeft") prevButtonClick();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const nextButtonClick = () => {
    if (flipBookRef.current) {
      flipBookRef.current.pageFlip().flipNext();
    }
  };

  const prevButtonClick = () => {
    if (flipBookRef.current) {
      flipBookRef.current.pageFlip().flipPrev();
    }
  };

  const onPage = (e: { data: number }) => {
    setCurrentPage(e.data);
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  return (
    <div 
      className="relative w-full h-[70vh] md:h-[80vh] bg-transparent flex items-center justify-center overflow-visible"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Main Flipbook */}
      <div className="w-full h-full flex items-center justify-center p-0 transition-transform duration-500 z-10 overflow-visible">
        <div className="w-[95vw] md:w-[85vw] lg:w-[75vw] aspect-[2/0.66] flex items-center justify-center">
          {/* @ts-ignore - react-pageflip types are sometimes incomplete/mismatched */}
          <HTMLFlipBook
            width={1000}
            height={666}
            size="stretch"
            minWidth={300}
            maxWidth={2000}
            minHeight={200}
            maxHeight={1500}
            maxShadowOpacity={0.6}
            showCover={false}
            mobileScrollSupport={true}
            className="mx-auto"
            ref={flipBookRef}
            onFlip={onPage}
            drawShadow={true}
            flippingTime={1000}
            usePortrait={false}
            startPage={0}
            autoSize={true}
          >
            {pages.map((url, index) => (
              <Page key={index} imageUrl={url} index={index} />
            ))}
          </HTMLFlipBook>
        </div>
      </div>

      {/* Side Navigation Buttons (Desktop) */}
      <button
        onClick={prevButtonClick}
        className="absolute -left-4 md:-left-12 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white hover:border-primary hover:text-primary transition-all duration-300 z-20 disabled:opacity-0 disabled:pointer-events-none"
        disabled={currentPage === 0}
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        onClick={nextButtonClick}
        className="absolute -right-4 md:-right-12 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white hover:border-primary hover:text-primary transition-all duration-300 z-20 disabled:opacity-0 disabled:pointer-events-none"
        disabled={currentPage >= pages.length - (pages.length % 2 === 0 ? 2 : 1)}
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Page Counter UI */}
      <div className="absolute -bottom-12 left-0 right-0 flex justify-center items-center z-20">
        <div className="px-6 py-2 rounded-full bg-black/40 backdrop-blur-md border border-primary/20 text-primary/80 tracking-widest text-xs uppercase font-medium">
          Page {currentPage + 1} <span className="mx-2 text-white/20">/</span> {pages.length}
        </div>
      </div>
      
      {/* Fullscreen control */}
      <button 
        onClick={toggleFullscreen}
        className="absolute -top-12 right-0 text-white/70 hover:text-primary transition-colors p-2 rounded-full hover:bg-white/5 z-20"
        aria-label="Toggle Fullscreen"
      >
        {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
      </button>
    </div>
  );
}
