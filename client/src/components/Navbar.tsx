import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import logoImg from "@assets/DP_logo_2021_White_1772790737407.png";

export default function Navbar() {
  const [location] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentHash, setCurrentHash] = useState(window.location.hash);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleHashChange = () => setCurrentHash(window.location.hash);
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    setCurrentHash(window.location.hash);
  }, [location]);

  const isActive = (href: string) => {
    if (href.includes("#")) {
      return currentHash === `#${href.split("#")[1]}`;
    }
    return location === href && !currentHash;
  };

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Portfolio", href: "/portfolio" },
    { name: "Albums", href: "/golden-album" },
    { name: "About", href: "/about" },
    { name: "Terms", href: "/terms" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b ${
          isScrolled 
            ? "bg-background/90 backdrop-blur-md border-white/5 py-3 shadow-lg shadow-black/20" 
            : "bg-transparent border-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group z-50">
              <img 
                src={logoImg} 
                alt="Dream Pictures Logo" 
                className="h-10 md:h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-105" 
              />
              <div className="hidden sm:flex flex-col items-center gap-0.5">
                <span className="font-serif text-lg md:text-xl font-medium tracking-widest uppercase text-foreground">
                  Dream Pictures
                </span>
                <div className="w-full h-px bg-white/20" />
                <span className="text-[9px] tracking-[0.18em] uppercase text-white/50 font-light">
                  Photography &amp; Films
                </span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`text-sm tracking-widest uppercase transition-colors duration-300 ${
                    isActive(link.href) ? "text-primary font-medium" : "text-foreground/80 hover:text-primary"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <Link
                href="/inquire"
                className="px-6 py-2.5 border border-primary/50 text-primary text-xs uppercase tracking-widest hover:bg-primary hover:text-primary-foreground transition-all duration-300"
              >
                Inquire
              </Link>
            </nav>

            {/* Mobile Toggle */}
            <button
              className="md:hidden text-foreground z-50 p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-background/95 backdrop-blur-xl flex flex-col items-center justify-center gap-8 md:hidden"
          >
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-2xl font-serif tracking-widest uppercase text-foreground hover:text-primary transition-colors"
              >
                {link.name}
              </Link>
            ))}
            <Link
              href="/inquire"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-4 px-8 py-3 bg-primary text-primary-foreground text-sm uppercase tracking-widest"
            >
              Inquire Now
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
