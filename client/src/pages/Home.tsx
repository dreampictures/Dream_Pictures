import { useEffect } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, Camera, Video, Sparkles } from "lucide-react";
import ContactForm from "@/components/ContactForm";
import signatureImg from "@assets/image_1772788541421.png";
import veniceImg from "@/assets/images/venice.jpg";
import goldenHourImg from "@/assets/images/golden-hour.jpg";
import firstDanceImg from "@/assets/images/first-dance.jpg";
import urbanEditorialImg from "@/assets/images/urban-editorial.jpg";
import heroBgImg from "@/assets/images/hero-bg.jpg";
import aboutMeImg from "@/assets/images/about-me.jpg";

// Fallback high-quality cinematic imagery
const FALLBACK_PORTFOLIO = [
  { id: 1, title: "Elegance in Venice", img: veniceImg },
  { id: 2, title: "Golden Hour", img: goldenHourImg },
  { id: 3, title: "The First Dance", img: firstDanceImg },
  { id: 4, title: "Urban Editorial", img: urbanEditorialImg },
];

export default function Home() {
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
  };

  return (
    <div className="bg-noise">
      {/* HERO SECTION */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* landing page hero cinematic wedding couple */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroBgImg})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-background" />
        </div>

        <motion.div 
          className="relative z-10 text-center px-4 max-w-4xl mx-auto mt-20"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.p variants={fadeInUp} className="text-primary uppercase tracking-[0.3em] text-xs sm:text-sm mb-6 font-medium">
            Fine Art Photography & Cinematography
          </motion.p>
          <motion.h1 variants={fadeInUp} className="font-serif text-5xl md:text-7xl lg:text-8xl font-medium leading-tight mb-8 text-white drop-shadow-lg">
            Capturing the <span className="italic text-primary/90">Poetry</span><br/> of Your Moments
          </motion.h1>
          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-12">
            <Link href="/portfolio" className="px-10 py-4 bg-primary text-primary-foreground uppercase tracking-widest text-sm hover:bg-white transition-colors duration-500 w-full sm:w-auto">
              View Portfolio
            </Link>
            <Link href="/#contact" className="px-10 py-4 border border-white/30 text-white uppercase tracking-widest text-sm hover:border-primary hover:text-primary transition-colors duration-500 w-full sm:w-auto">
              Inquire Now
            </Link>
          </motion.div>
        </motion.div>
        
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-50 hidden md:block">
          <div className="w-[1px] h-16 bg-gradient-to-b from-primary to-transparent" />
        </div>
      </section>

      {/* ABOUT SECTION */}
      <section id="about" className="py-24 md:py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
              variants={fadeInUp}
              className="relative aspect-[4/5] lg:aspect-auto lg:h-[700px] overflow-hidden rounded-sm"
            >
              {/* about section cinematic photographer */}
              <img 
                src={aboutMeImg} 
                alt="Our Process" 
                className="w-full h-full object-cover filter brightness-90 hover:brightness-100 transition-all duration-700 hover:scale-105"
              />
              <div className="absolute inset-0 border border-white/10 m-4 z-10 pointer-events-none" />
            </motion.div>

            <motion.div 
              initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="space-y-8"
            >
              <motion.p variants={fadeInUp} className="text-primary tracking-[0.2em] uppercase text-sm">
                The Dream Pictures Ethos
              </motion.p>
              <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl font-serif text-balance leading-tight">
                We believe every love story is a masterpiece waiting to be told.
              </motion.h2>
              <motion.div variants={fadeInUp} className="space-y-6 text-muted-foreground font-light text-lg leading-relaxed">
                <p>
                  At Dream Pictures, we approach weddings not just as events, but as profound milestones in your human experience. Our aesthetic marries the timeless elegance of editorial photography with the raw emotion of cinematic documentary.
                </p>
                <p>
                  We are visual poets, chasing the golden light, the unscripted laughter, and the quiet glances that define your connection.
                </p>
              </motion.div>
              <motion.div variants={fadeInUp} className="pt-4">
                <img src={signatureImg} alt="Signature" className="h-12 opacity-50 grayscale contrast-200" />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SERVICES SECTION */}
      <section className="py-24 bg-[#080808] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
            className="text-center mb-20"
          >
            <p className="text-primary tracking-[0.2em] uppercase text-sm mb-4">Our Expertise</p>
            <h2 className="text-4xl md:text-5xl font-serif">Curated Services</h2>
          </motion.div>

          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              { icon: Camera, title: "Fine Art Photography", desc: "Timeless, editorial-style imagery capturing the exquisite details and profound emotions of your day." },
              { icon: Video, title: "Cinematography", desc: "Moving visual narratives crafted with cinematic precision, turning your memories into a timeless film." },
              { icon: Sparkles, title: "Portrait & Editorial", desc: "Bespoke pre-wedding and lifestyle shoots designed to highlight your unique connection and aesthetic." }
            ].map((service, idx) => (
              <motion.div key={idx} variants={fadeInUp} className="group p-10 border border-white/5 bg-background/50 hover:bg-white/[0.02] transition-all duration-500 hover:-translate-y-2 text-center">
                <service.icon className="w-10 h-10 mx-auto text-primary/70 mb-6 group-hover:text-primary transition-colors" strokeWidth={1} />
                <h3 className="text-xl font-serif mb-4">{service.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{service.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* SNEAK PEEK PORTFOLIO */}
      <section className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 flex flex-col md:flex-row justify-between items-end gap-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}>
            <p className="text-primary tracking-[0.2em] uppercase text-sm mb-4">Featured Work</p>
            <h2 className="text-4xl md:text-5xl font-serif">A Glimpse of the Dream</h2>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}>
            <Link href="/portfolio" className="group flex items-center gap-3 text-sm tracking-widest uppercase hover:text-primary transition-colors">
              Explore Gallery
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 w-full">
          {FALLBACK_PORTFOLIO.map((item, idx) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: idx * 0.1, duration: 0.8 }}
              viewport={{ once: true }}
              className="relative aspect-square group overflow-hidden bg-muted"
            >
              <img 
                src={item.img} 
                alt={item.title} 
                className="w-full h-full object-cover filter brightness-75 group-hover:scale-110 group-hover:brightness-50 transition-all duration-700"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10">
                <p className="text-white font-serif text-2xl tracking-wide text-center px-4">{item.title}</p>
                <div className="w-8 h-[1px] bg-primary mt-4" />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CONTACT SECTION */}
      <section id="contact" className="py-24 md:py-32 bg-[#050505] relative overflow-hidden">
        {/* Subtle decorative background element */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-16">
            <motion.div 
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}
              className="lg:col-span-2 space-y-8"
            >
              <motion.p variants={fadeInUp} className="text-primary tracking-[0.2em] uppercase text-sm">
                Get in Touch
              </motion.p>
              <motion.h2 variants={fadeInUp} className="text-4xl md:text-6xl font-serif leading-tight">
                Let's Create <br/><span className="italic text-white/70">Magic</span> Together.
              </motion.h2>
              <motion.p variants={fadeInUp} className="text-muted-foreground font-light leading-relaxed">
                We take on a limited number of commissions each year to ensure every couple receives the artistic devotion their story deserves. Tell us about your vision.
              </motion.p>
            </motion.div>
            
            <motion.div 
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
              className="lg:col-span-3 bg-background border border-white/5 p-8 md:p-12 shadow-2xl"
            >
              <ContactForm />
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
