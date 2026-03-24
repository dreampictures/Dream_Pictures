import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Instagram, Facebook, Youtube, Clock, MessageCircle } from "lucide-react";
import ContactForm from "@/components/ContactForm";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
};

export default function Contact() {
  return (
    <div className="bg-noise min-h-screen">

      {/* PAGE HEADER */}
      <section className="pt-40 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/80 to-background -z-10" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/8 rounded-full blur-[120px] -z-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-primary uppercase tracking-[0.3em] text-xs mb-5"
          >
            Reach Out
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-serif text-5xl md:text-7xl mb-6 leading-tight"
          >
            Let's Talk About<br />
            <span className="italic text-primary/90">Your Story</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed"
          >
            Whether you have questions, want to know about availability, or just want to say hello — we'd love to hear from you.
          </motion.p>
        </div>
      </section>

      {/* CONTACT INFO CARDS */}
      <section className="py-16 border-y border-white/5 bg-[#080808]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {/* Email */}
            <motion.a
              variants={fadeInUp}
              href="mailto:info@thedreampictures.com"
              className="group flex flex-col items-center text-center p-8 border border-white/5 bg-background/40 hover:bg-white/[0.03] hover:border-primary/30 transition-all duration-500"
            >
              <div className="w-12 h-12 flex items-center justify-center border border-primary/30 mb-5 group-hover:border-primary group-hover:bg-primary/10 transition-all duration-300">
                <Mail className="w-5 h-5 text-primary/70 group-hover:text-primary transition-colors" />
              </div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Email Us</p>
              <p className="text-white/80 text-sm group-hover:text-primary transition-colors break-all">info@thedreampictures.com</p>
            </motion.a>

            {/* Phone */}
            <motion.a
              variants={fadeInUp}
              href="tel:+918437566186"
              className="group flex flex-col items-center text-center p-8 border border-white/5 bg-background/40 hover:bg-white/[0.03] hover:border-primary/30 transition-all duration-500"
            >
              <div className="w-12 h-12 flex items-center justify-center border border-primary/30 mb-5 group-hover:border-primary group-hover:bg-primary/10 transition-all duration-300">
                <Phone className="w-5 h-5 text-primary/70 group-hover:text-primary transition-colors" />
              </div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Call Us</p>
              <p className="text-white/80 text-sm group-hover:text-primary transition-colors">+91 84375 66186</p>
            </motion.a>

            {/* Location */}
            <motion.div
              variants={fadeInUp}
              className="group flex flex-col items-center text-center p-8 border border-white/5 bg-background/40 hover:bg-white/[0.03] hover:border-primary/30 transition-all duration-500"
            >
              <div className="w-12 h-12 flex items-center justify-center border border-primary/30 mb-5 group-hover:border-primary group-hover:bg-primary/10 transition-all duration-300">
                <MapPin className="w-5 h-5 text-primary/70 group-hover:text-primary transition-colors" />
              </div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Find Us</p>
              <p className="text-white/80 text-sm leading-relaxed">Village Jogewala,<br />Ferozepur, Punjab 142044</p>
            </motion.div>

            {/* Working Hours */}
            <motion.div
              variants={fadeInUp}
              className="group flex flex-col items-center text-center p-8 border border-white/5 bg-background/40 hover:bg-white/[0.03] hover:border-primary/30 transition-all duration-500"
            >
              <div className="w-12 h-12 flex items-center justify-center border border-primary/30 mb-5 group-hover:border-primary group-hover:bg-primary/10 transition-all duration-300">
                <Clock className="w-5 h-5 text-primary/70 group-hover:text-primary transition-colors" />
              </div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Working Hours</p>
              <p className="text-white/80 text-sm leading-relaxed">Mon – Sat<br />10:00 AM – 7:00 PM</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* FORM + SIDEBAR */}
      <section className="py-24 md:py-32 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[140px] -z-10 translate-x-1/3 -translate-y-1/3" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-16">

            {/* Left: Info + Social */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={stagger}
              className="lg:col-span-2 space-y-10"
            >
              <motion.div variants={fadeInUp}>
                <p className="text-primary tracking-[0.2em] uppercase text-xs mb-4">Send a Message</p>
                <h2 className="font-serif text-3xl md:text-4xl leading-snug">
                  We reply within<br />
                  <span className="italic text-white/60">24 hours</span>
                </h2>
              </motion.div>

              <motion.p variants={fadeInUp} className="text-muted-foreground font-light leading-relaxed">
                Fill out the form and we'll get back to you as soon as possible. You can also reach us directly via phone or email — whichever you prefer.
              </motion.p>

              {/* WhatsApp CTA */}
              <motion.a
                variants={fadeInUp}
                href="https://wa.me/918437566186"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-6 py-4 border border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 text-sm uppercase tracking-widest group"
              >
                <MessageCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
                Chat on WhatsApp
              </motion.a>

              {/* Divider */}
              <motion.div variants={fadeInUp} className="border-t border-white/5 pt-10">
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-6">Follow Our Journey</p>
                <div className="flex items-center gap-6">
                  <a
                    href="https://www.instagram.com/its_bakhshish_singh"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-white/40 hover:text-primary transition-colors text-sm group"
                  >
                    <Instagram className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="hidden sm:inline">Instagram</span>
                  </a>
                  <a
                    href="https://www.facebook.com/itsbs.in/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-white/40 hover:text-primary transition-colors text-sm group"
                  >
                    <Facebook className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="hidden sm:inline">Facebook</span>
                  </a>
                  <a
                    href="https://www.youtube.com/@dreampicturess"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-white/40 hover:text-primary transition-colors text-sm group"
                  >
                    <Youtube className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="hidden sm:inline">YouTube</span>
                  </a>
                </div>
              </motion.div>
            </motion.div>

            {/* Right: Form */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="lg:col-span-3 bg-background border border-white/5 p-8 md:p-12 shadow-2xl"
            >
              <h3 className="font-serif text-2xl mb-2">Send Us a Message</h3>
              <p className="text-muted-foreground text-sm mb-8">All fields marked are required unless stated optional.</p>
              <ContactForm />
            </motion.div>

          </div>
        </div>
      </section>

    </div>
  );
}
