import React, { useRef, useState, useEffect, useCallback } from "react";
import HTMLFlipBook from "react-pageflip";
import { ChevronLeft, ChevronRight, Maximize, Minimize, ZoomIn, X } from "lucide-react";

interface FlipbookViewerProps {
  pages: string[];
  albumName: string;
}

const Page = React.forwardRef<
  HTMLDivElement,
  { imageUrl: string; index: number; loaded: boolean; onLoad: () => void }
>((props, ref) => {
  return (
    <div
      className="page w-full h-full flex items-center justify-center bg-black"
      ref={ref}
    >
      {props.loaded ? (
        <img
          src={props.imageUrl}
          alt={`Page ${props.index + 1}`}
          className="max-w-full max-h-full object-contain select-none"
          onContextMenu={(e) => e.preventDefault()}
          draggable={false}
          onLoad={props.onLoad}
        />
      ) : (
        <div className="w-full h-full bg-black" />
      )}
    </div>
  );
});

Page.displayName = "Page";

export function FlipbookViewer({ pages, albumName }: FlipbookViewerProps) {
  const flipBookRef = useRef<any>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomPage, setZoomPage] = useState<number | null>(null);
  const [loadedSet, setLoadedSet] = useState<Set<number>>(new Set([0, 1]));
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const preloadAround = useCallback(
    (page: number) => {
      const radius = 4;
      setLoadedSet((prev) => {
        const next = new Set(prev);
        for (let i = Math.max(0, page - radius); i <= Math.min(pages.length - 1, page + radius); i++) {
          next.add(i);
        }
        return next;
      });
    },
    [pages.length]
  );

  useEffect(() => {
    preloadAround(0);
  }, [preloadAround]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (zoomPage !== null) {
        if (e.key === "Escape") setZoomPage(null);
        return;
      }
      if (e.key === "ArrowRight") nextPage();
      if (e.key === "ArrowLeft") prevPage();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [zoomPage]);

  const nextPage = () => {
    if (flipBookRef.current) flipBookRef.current.pageFlip().flipNext();
  };

  const prevPage = () => {
    if (flipBookRef.current) flipBookRef.current.pageFlip().flipPrev();
  };

  const onPage = (e: { data: number }) => {
    setCurrentPage(e.data);
    preloadAround(e.data);
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onFsChange = () => {
      if (!document.fullscreenElement) setIsFullscreen(false);
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const isFirst = currentPage === 0;
  const isLast = currentPage >= pages.length - (isMobile ? 1 : pages.length % 2 === 0 ? 2 : 1);
  const displayPage = isMobile ? currentPage + 1 : currentPage + 1;
  const displayTotal = pages.length;

  return (
    <>
      {/* Zoom Modal */}
      {zoomPage !== null && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
          onClick={() => setZoomPage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/60 hover:text-primary transition-colors p-2"
            onClick={() => setZoomPage(null)}
            aria-label="Close zoom"
          >
            <X className="w-7 h-7" />
          </button>
          <img
            src={pages[zoomPage]}
            alt={`Page ${zoomPage + 1}`}
            className="max-w-[95vw] max-h-[95vh] object-contain select-none shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
            draggable={false}
          />
          <div className="absolute bottom-4 left-0 right-0 text-center text-white/30 text-xs tracking-widest uppercase">
            Page {zoomPage + 1} — {albumName}
          </div>
        </div>
      )}

      <div
        className="relative w-full flex items-center justify-center overflow-visible"
        style={{ minHeight: "60vh" }}
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* Controls Row */}
        <div className="absolute -top-10 left-0 right-0 flex items-center justify-end gap-2 z-20 px-1">
          <button
            onClick={() => setZoomPage(currentPage)}
            className="flex items-center gap-1.5 text-white/50 hover:text-primary transition-colors text-xs uppercase tracking-widest px-3 py-1.5 rounded-full border border-white/10 hover:border-primary/40 bg-black/30 backdrop-blur-sm"
            aria-label="Zoom current page"
            data-testid="button-zoom"
          >
            <ZoomIn className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Zoom</span>
          </button>
          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-1.5 text-white/50 hover:text-primary transition-colors text-xs uppercase tracking-widest px-3 py-1.5 rounded-full border border-white/10 hover:border-primary/40 bg-black/30 backdrop-blur-sm"
            aria-label="Toggle fullscreen"
            data-testid="button-fullscreen"
          >
            {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isFullscreen ? "Exit" : "Fullscreen"}</span>
          </button>
        </div>

        {/* Flipbook */}
        <div className="w-full flex items-center justify-center">
          <div
            className={`flex items-center justify-center ${
              isMobile ? "w-[95vw]" : "w-[90vw] md:w-[80vw] lg:w-[72vw]"
            }`}
          >
            {/* @ts-ignore */}
            <HTMLFlipBook
              width={1000}
              height={667}
              size="stretch"
              minWidth={280}
              maxWidth={2000}
              minHeight={187}
              maxHeight={1400}
              maxShadowOpacity={0.5}
              showCover={false}
              mobileScrollSupport={true}
              className="mx-auto"
              ref={flipBookRef}
              onFlip={onPage}
              drawShadow={true}
              flippingTime={900}
              usePortrait={isMobile}
              startPage={0}
              autoSize={true}
            >
              {pages.map((url, index) => (
                <Page
                  key={index}
                  imageUrl={url}
                  index={index}
                  loaded={loadedSet.has(index)}
                  onLoad={() => {}}
                />
              ))}
            </HTMLFlipBook>
          </div>
        </div>

        {/* Prev Button */}
        <button
          onClick={prevPage}
          disabled={isFirst}
          className="absolute -left-5 md:-left-14 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-black/30 backdrop-blur-md border border-white/10 text-white/60 hover:border-primary/60 hover:text-primary transition-all duration-300 z-20 disabled:opacity-0 disabled:pointer-events-none"
          data-testid="button-prev"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
        </button>

        {/* Next Button */}
        <button
          onClick={nextPage}
          disabled={isLast}
          className="absolute -right-5 md:-right-14 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-black/30 backdrop-blur-md border border-white/10 text-white/60 hover:border-primary/60 hover:text-primary transition-all duration-300 z-20 disabled:opacity-0 disabled:pointer-events-none"
          data-testid="button-next"
          aria-label="Next page"
        >
          <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
        </button>

        {/* Page Counter */}
        <div className="absolute -bottom-12 left-0 right-0 flex justify-center items-center z-20">
          <div className="px-6 py-2 rounded-full bg-black/40 backdrop-blur-md border border-primary/20 text-primary/70 tracking-widest text-xs uppercase font-medium">
            Page {displayPage}
            <span className="mx-2 text-white/20">/</span>
            {displayTotal}
          </div>
        </div>
      </div>
    </>
  );
}
