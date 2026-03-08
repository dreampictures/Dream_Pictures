import { useParams, Link } from "wouter";
import { useAlbum } from "@/hooks/use-album";
import { LoadingScreen } from "@/components/LoadingScreen";
import { FlipbookViewer } from "@/components/FlipbookViewer";
import { motion } from "framer-motion";
import { ArrowLeft, Lock } from "lucide-react";
import { useState, useEffect } from "react";

const CinematicBg = () => (
  <div className="fixed inset-0 z-0">
    <img
      src="https://images.unsplash.com/photo-1519741497674-611481863552?w=1920&h=1080&fit=crop&q=80"
      alt=""
      className="cinematic-bg md:blur-[24px] blur-none"
    />
    <div className="cinematic-overlay" />
    <div className="vignette" />
    <div className="light-rays" />
    <div className="particles-container hidden md:block">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="particle"
          style={{
            left: `${Math.random() * 100}%`,
            "--duration": `${20 + Math.random() * 20}s`,
            "--drift": `${(Math.random() - 0.5) * 200}px`,
            animationDelay: `${-Math.random() * 20}s`,
            width: `${2 + Math.random() * 3}px`,
            height: `${2 + Math.random() * 3}px`,
          } as any}
        />
      ))}
    </div>
    <div className="particles-container md:hidden">
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="particle"
          style={{
            left: `${Math.random() * 100}%`,
            "--duration": `${25 + Math.random() * 15}s`,
            "--drift": `${(Math.random() - 0.5) * 100}px`,
            animationDelay: `${-Math.random() * 25}s`,
            width: `${2 + Math.random() * 2}px`,
            height: `${2 + Math.random() * 2}px`,
          } as any}
        />
      ))}
    </div>
  </div>
);

function PasswordScreen({
  code,
  onSuccess,
}: {
  code: string;
  onSuccess: () => void;
}) {
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/albums/${code}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: input }),
      });
      const data = await res.json();
      if (data.valid) {
        sessionStorage.setItem(`album_auth_${code}`, "true");
        onSuccess();
      } else {
        setError(true);
        setShake(true);
        setTimeout(() => setShake(false), 600);
        setInput("");
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-black overflow-hidden flex items-center justify-center">
      <CinematicBg />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 w-full max-w-sm px-6"
      >
        <motion.div
          animate={shake ? { x: [-10, 10, -8, 8, -4, 4, 0] } : {}}
          transition={{ duration: 0.5 }}
          className="glass-panel rounded-2xl p-8 md:p-10 text-center"
        >
          <div className="w-14 h-14 rounded-full border border-primary/30 flex items-center justify-center mx-auto mb-6 bg-primary/10">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-3xl font-serif text-gold-gradient mb-2">
            {code.charAt(0).toUpperCase() + code.slice(1)}
          </h2>
          <p className="text-white/50 text-sm mb-8 tracking-wide">
            This album is private. Enter your password to continue.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter password"
              className={`w-full bg-black/50 border rounded-xl px-5 py-4 text-center text-white placeholder:text-white/30 outline-none transition-all font-sans text-lg tracking-wider ${
                error
                  ? "border-red-500/50 focus:border-red-500"
                  : "border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
              }`}
              required
              disabled={loading}
              data-testid="input-album-password"
              autoFocus
            />
            {error && (
              <p className="text-red-400 text-sm">Incorrect password. Please try again.</p>
            )}
            <button
              type="submit"
              disabled={loading || !input}
              className="w-full bg-gradient-to-r from-[#B38D2F] to-[#D4AF37] text-black font-semibold py-4 rounded-xl shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:shadow-[0_0_30px_rgba(212,175,55,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100 uppercase tracking-widest text-sm"
              data-testid="button-enter-album"
            >
              {loading ? "Verifying…" : "Enter Album"}
            </button>
          </form>
          <Link href="/" className="inline-flex items-center gap-2 mt-6 text-white/30 hover:text-white/60 text-xs uppercase tracking-widest transition-colors">
            <ArrowLeft className="w-3 h-3" /> Return Home
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function Album() {
  const params = useParams<{ code: string }>();
  const code = params.code?.toLowerCase() || null;

  const [authState, setAuthState] = useState<"checking" | "required" | "granted">("checking");

  useEffect(() => {
    if (!code) return;
    if (sessionStorage.getItem(`album_auth_${code}`) === "true") {
      setAuthState("granted");
      return;
    }
    fetch(`/api/albums/${code}/auth`)
      .then((r) => r.json())
      .then((data) => {
        if (data.required) {
          setAuthState("required");
        } else {
          setAuthState("granted");
        }
      })
      .catch(() => setAuthState("granted"));
  }, [code]);

  const { data: album, isLoading, error } = useAlbum(authState === "granted" ? code : null);

  if (!code || authState === "checking") {
    return <LoadingScreen />;
  }

  if (authState === "required") {
    return <PasswordScreen code={code} onSuccess={() => setAuthState("granted")} />;
  }

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error || !album || album.pages.length === 0) {
    const isNotFound = error?.message === "ALBUM_NOT_FOUND";
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center p-6 text-center overflow-hidden">
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
      <CinematicBg />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="relative z-10 w-full min-h-screen pt-20 md:pt-24 pb-12 px-4 md:px-8 flex flex-col items-center"
      >
        <div className="w-full max-w-7xl">
          <div className="flex justify-between items-center mb-12">
            <Link href="/">
              <a className="group flex items-center gap-2 text-white/50 hover:text-primary transition-all">
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span className="text-xs uppercase tracking-[0.2em]">Exit Gallery</span>
              </a>
            </Link>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="mt-10 mb-8 text-center"
            >
              <h1 className="text-4xl md:text-6xl text-gold-gradient font-serif tracking-tight">
                {album.code.charAt(0).toUpperCase() + album.code.slice(1)}
              </h1>
              <div className="flex flex-col items-center opacity-40 mt-2">
                <p className="text-[10px] md:text-xs uppercase tracking-[0.4em] font-medium font-sans">
                  Dream Pictures
                </p>
              </div>
            </motion.div>
            <div className="w-full max-w-7xl h-full flex items-center justify-center">
              <FlipbookViewer pages={album.pages} albumName={album.code} />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
