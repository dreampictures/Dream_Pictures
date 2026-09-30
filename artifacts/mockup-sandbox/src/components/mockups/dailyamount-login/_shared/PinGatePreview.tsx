import { useEffect, useState, type FormEvent } from "react";
import { Eye, EyeOff, Loader2, Lock } from "lucide-react";
import "../_group.css";

type PinGatePreviewProps = {
  variant: "current" | "reference";
};

export function PinGatePreview({ variant }: PinGatePreviewProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const [flareRun, setFlareRun] = useState(0);
  const isReference = variant === "reference";

  useEffect(() => {
    const replayOnRestore = (event: PageTransitionEvent) => {
      if (event.persisted) setFlareRun((run) => run + 1);
    };
    window.addEventListener("pageshow", replayOnRestore);
    return () => window.removeEventListener("pageshow", replayOnRestore);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    await new Promise((resolve) => window.setTimeout(resolve, 180));
    setError("Visual preview only — PIN verification is not connected.");
    setPin("");
    setLoading(false);
  }

  if (!isReference) {
    return (
      <div
        className="dailyamount-login-preview flex min-h-screen items-center justify-center"
        style={{
          backgroundColor: "#071226",
          backgroundImage: "url('/__mockup/images/login-background.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="mx-4 w-full max-w-sm">
          <div className="mb-8 text-center">
            <div
              className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{ background: "linear-gradient(135deg, #d4af37, #f0c040)" }}
            >
              <Lock size={28} className="text-black" />
            </div>
            <h1 className="text-2xl font-bold text-white">Daily Reconciliation</h1>
            <p className="mt-1 text-sm text-slate-400">Enter your PIN to continue</p>
          </div>
          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-2xl p-6"
            style={{
              background: "rgba(255,255,255,0.04)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <PinFields
              pin={pin}
              show={show}
              error={error}
              onPinChange={setPin}
              onToggleShow={() => setShow((visible) => !visible)}
            />
            <button
              type="submit"
              disabled={loading || !pin}
              className="w-full rounded-xl py-3 font-semibold text-black transition-all disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #d4af37, #f0c040)" }}
            >
              {loading ? <Loader2 size={18} className="mx-auto animate-spin" /> : "Unlock"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div
      className="dailyamount-login-preview relative flex min-h-screen items-center justify-center px-4 py-8"
      style={{
        minHeight: "100svh",
          backgroundColor: "#071226",
          backgroundImage: "url('/__mockup/images/login-background.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
      }}
    >
      <div className="da-pin-stage relative z-10 w-full max-w-[432px]">
        <div className="da-pin-heading-group relative z-10 mb-5 text-center">
          <div className="da-pin-lock-frame relative z-10 mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-300/[0.08]">
            <Lock size={34} strokeWidth={3} className="relative z-10 text-amber-300 drop-shadow-[0_0_8px_rgba(250,204,21,0.7)]" />
          </div>
          <h1 className="da-pin-heading relative z-10 text-[22px] leading-[28px] text-white">Daily Reconciliation</h1>
          <p className="da-pin-subtitle relative z-10 mt-[10px] text-xs leading-[18px] tracking-wide text-slate-300">Enter your PIN to continue</p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="da-pin-form flex flex-col gap-4 rounded-2xl px-[27px] py-[30px]"
          style={{
            background: "rgba(7,18,38,0.56)",
            backdropFilter: "blur(14px)",
            border: "1px solid rgba(148,163,184,0.20)",
            boxShadow: "0 18px 54px rgba(0,0,0,0.32), inset 0 1px rgba(255,255,255,0.055)",
          }}
        >
          <PinFields
            pin={pin}
            show={show}
            error={error}
            onPinChange={setPin}
            onToggleShow={() => setShow((visible) => !visible)}
            reference
          />
          <button
            type="submit"
            disabled={loading || !pin}
            className="da-pin-unlock flex h-[56px] w-full items-center justify-center rounded-[11px] font-extrabold text-[#15100a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#09172e] disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : "Unlock"}
          </button>
          <span key={`glass-${flareRun}`} aria-hidden="true" className="da-pin-glass-reflection" />
        </form>
        <span key={`beam-${flareRun}`} aria-hidden="true" className="da-pin-light-sweep" />
      </div>
    </div>
  );
}

function PinFields({
  pin,
  show,
  error,
  onPinChange,
  onToggleShow,
  reference = false,
}: {
  pin: string;
  show: boolean;
  error: string;
  onPinChange: (value: string) => void;
  onToggleShow: () => void;
  reference?: boolean;
}) {
  return (
    <>
      <div className="relative">
        <input
          data-testid="input-pin-preview"
          type={show ? "text" : "password"}
          value={pin}
          onChange={(event) => onPinChange(event.target.value)}
          placeholder="Enter PIN"
          aria-label="Enter PIN"
          aria-describedby={error ? "pin-preview-error" : undefined}
          className={
            reference
              ? "h-[60px] w-full rounded-xl bg-[#09172e]/75 px-4 pr-11 text-center text-sm font-semibold tracking-[0.32em] text-white outline-none transition placeholder:font-semibold placeholder:tracking-[0.28em] placeholder:text-slate-300 focus:ring-2 focus:ring-amber-300/50"
              : "w-full rounded-xl bg-transparent px-4 py-3 pr-10 text-center text-2xl tracking-widest text-white outline-none focus:ring-2 focus:ring-yellow-500"
          }
          autoFocus
          style={
            reference
              ? { border: "1px solid rgba(250,204,21,0.82)", letterSpacing: "0.32em", boxShadow: "0 0 15px rgba(250,204,21,0.08)" }
              : { border: "1px solid rgba(255,255,255,0.12)", letterSpacing: "0.4em" }
          }
        />
        <button
          type="button"
          onClick={onToggleShow}
          aria-label={show ? "Hide PIN" : "Show PIN"}
          aria-pressed={show}
          className={
            reference
              ? "absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-300 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
              : "absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
          }
        >
          {show ? <EyeOff size={reference ? 16 : 18} /> : <Eye size={reference ? 16 : 18} />}
        </button>
      </div>
      {error && (
        <p id="pin-preview-error" role="alert" className={`text-center ${reference ? "text-xs text-red-300" : "text-sm text-red-400"}`}>
          {error}
        </p>
      )}
    </>
  );
}