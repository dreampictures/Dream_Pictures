import { Link } from "wouter";
import { Instagram, Facebook, Youtube, Mail, Phone, MapPin } from "lucide-react";
import logoImg from "@assets/DP_logo_2021_White_1772790737407.png";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-black border-t border-white/5 pt-24 pb-12 overflow-hidden relative text-center md:text-left">
      {/* Decorative wash */}
      <div className="absolute bottom-0 left-0 w-full h-[300px] bg-primary/5 blur-[120px] -z-10 translate-y-1/2" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">
          <div className="lg:col-span-1 space-y-8 flex flex-col items-center md:items-start">
            <Link href="/" className="flex items-center gap-3">
              <img src={logoImg} alt="Dream Pictures" className="h-12 w-auto" />
            </Link>
            <p className="text-muted-foreground font-light leading-relaxed max-w-sm">
              Crafting visual poems of your most profound human experiences. Cinematic storytelling for the discerning couple.
            </p>
            <div className="flex items-center gap-6">
              {[Instagram, Facebook, Youtube].map((Icon, i) => (
                <a key={i} href="#" className="text-white/40 hover:text-primary transition-colors">
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          <div className="space-y-8">
            <h4 className="font-serif text-xl">Navigation</h4>
            <nav className="flex flex-col gap-4 items-center md:items-start">
              <Link href="/portfolio" className="text-muted-foreground hover:text-primary transition-colors text-sm uppercase tracking-widest">Portfolio</Link>
              <Link href="/albums" className="text-muted-foreground hover:text-primary transition-colors text-sm uppercase tracking-widest">Digital Albums</Link>
              <Link href="/about" className="text-muted-foreground hover:text-primary transition-colors text-sm uppercase tracking-widest">About Studio</Link>
              <Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors text-sm uppercase tracking-widest">Terms & Conditions</Link>
            </nav>
          </div>

          <div className="space-y-8">
            <h4 className="font-serif text-xl">Contact</h4>
            <div className="space-y-4 flex flex-col items-center md:items-start">
              <div className="flex items-center gap-4 text-muted-foreground group">
                <Mail className="w-4 h-4 text-primary/50 group-hover:text-primary transition-colors" />
                <span className="text-sm">hello@thedreampictures.com</span>
              </div>
              <div className="flex items-center gap-4 text-muted-foreground group">
                <Phone className="w-4 h-4 text-primary/50 group-hover:text-primary transition-colors" />
                <span className="text-sm">+91 99999 99999</span>
              </div>
              <div className="flex items-center gap-4 text-muted-foreground group">
                <MapPin className="w-4 h-4 text-primary/50 group-hover:text-primary transition-colors" />
                <span className="text-sm">New Delhi, India</span>
              </div>
            </div>
          </div>

        </div>

        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-white/20 text-[10px] uppercase tracking-[0.3em]">
            © {year} Dream Pictures Photography & Films. All Rights Reserved.
          </p>
          <div className="flex gap-8">
            <Link href="/terms" className="text-white/20 text-[10px] uppercase tracking-[0.3em] hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="text-white/20 text-[10px] uppercase tracking-[0.3em] hover:text-white transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
