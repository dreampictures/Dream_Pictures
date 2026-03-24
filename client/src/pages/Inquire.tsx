import { motion } from "framer-motion";
import { CheckCircle, Camera, Video, Sparkles, Heart, CalendarCheck, ImageIcon } from "lucide-react";
import ContactForm from "@/components/ContactForm";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
};

const steps = [
  {
    num: "01",
    title: "Submit Your Inquiry",
    desc: "Fill in the form below with your event details. We'll review your vision and get back to you within 24 hours.",
  },
  {
    num: "02",
    title: "Discovery Call",
    desc: "We'll have a short call to understand your story, style preferences, and expectations. No pressure — just a conversation.",
  },
  {
    num: "03",
    title: "Confirm & Book",
    desc: "Once we're aligned, we send a formal quote. A ₹10,000 advance secures your date and we begin planning together.",
  },
  {
    num: "04",
    title: "We Capture Your Story",
    desc: "On your day, we are fully present — anticipating moments, chasing light, and preserving every emotion beautifully.",
  },
];

const packages = [
  {
    icon: Camera,
    name: "Photography",
    items: ["Wedding Photography", "Pre-Wedding Shoot", "Portrait & Editorial", "Passport & Formal Photos"],
  },
  {
    icon: Video,
    name: "Cinematography",
    items: ["Cinematic Wedding Film", "Same Day Edit (SDE)", "Highlight Reel", "Documentary Coverage"],
  },
  {
    icon: Sparkles,
    name: "Complete Package",
    items: ["Photo + Video Bundle", "Album Design & Print", "Digital Delivery (Google Drive)", "Premium Hard Drive Delivery"],
  },
];

export default function Inquire() {
  return (
    <div className="bg-noise min-h-screen">

      {/* PAGE HEADER */}
      <section className="pt-40 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/80 to-background -z-10" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-primary/8 rounded-full blur-[140px] -z-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-primary uppercase tracking-[0.3em] text-xs mb-5"
          >
            Book Your Session
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-serif text-5xl md:text-7xl mb-6 leading-tight"
          >
            Begin Your<br />
            <span className="italic text-primary/90">Dream Story</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed"
          >
            We take on a limited number of commissions each year to ensure every couple receives the artistic devotion their story deserves. Inquire early to check your date.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-6 mt-10"
          >
            {["Limited Dates Available", "₹10,000 Advance to Book", "Response Within 24 Hours"].map((badge) => (
              <span key={badge} className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-white/50 border border-white/10 px-4 py-2">
                <CheckCircle className="w-3 h-3 text-primary/70" />
                {badge}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* OUR PROCESS */}
      <section className="py-20 border-y border-white/5 bg-[#080808]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <p className="text-primary tracking-[0.2em] uppercase text-xs mb-4">How It Works</p>
            <h2 className="font-serif text-3xl md:text-4xl">From Inquiry to <span className="italic text-white/60">Forever</span></h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {steps.map((step) => (
              <motion.div key={step.num} variants={fadeInUp} className="relative group">
                <div className="mb-5">
                  <span className="font-serif text-5xl text-primary/20 group-hover:text-primary/40 transition-colors duration-500">{step.num}</span>
                </div>
                <div className="w-8 h-[1px] bg-primary/40 mb-5" />
                <h3 className="font-serif text-lg mb-3 text-white">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* SERVICES WE OFFER */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <p className="text-primary tracking-[0.2em] uppercase text-xs mb-4">Our Services</p>
            <h2 className="font-serif text-3xl md:text-4xl">What We <span className="italic text-white/60">Offer</span></h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12"
          >
            {packages.map((pkg) => (
              <motion.div
                key={pkg.name}
                variants={fadeInUp}
                className="group p-8 border border-white/5 bg-background/40 hover:bg-white/[0.02] hover:border-primary/20 transition-all duration-500"
              >
                <pkg.icon className="w-8 h-8 text-primary/60 group-hover:text-primary transition-colors mb-5" strokeWidth={1.5} />
                <h3 className="font-serif text-xl mb-5 text-white">{pkg.name}</h3>
                <ul className="space-y-3">
                  {pkg.items.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-muted-foreground text-sm">
                      <Heart className="w-3 h-3 text-primary/50 mt-1 shrink-0" strokeWidth={2} />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <motion.div variants={fadeInUp} className="flex items-start gap-5 p-6 border border-white/5 bg-background/40">
              <CalendarCheck className="w-6 h-6 text-primary/60 shrink-0 mt-1" strokeWidth={1.5} />
              <div>
                <p className="text-white font-medium mb-1">Delivery Timeline</p>
                <p className="text-muted-foreground text-sm leading-relaxed">Edited photos & videos delivered in 30–45 days after your event. Albums dispatched after design approval.</p>
              </div>
            </motion.div>
            <motion.div variants={fadeInUp} className="flex items-start gap-5 p-6 border border-white/5 bg-background/40">
              <ImageIcon className="w-6 h-6 text-primary/60 shrink-0 mt-1" strokeWidth={1.5} />
              <div>
                <p className="text-white font-medium mb-1">File Delivery</p>
                <p className="text-muted-foreground text-sm leading-relaxed">Google Drive link for digital files. Physical Pendrive or Hard Drive options also available depending on package.</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* INQUIRY FORM */}
      <section className="py-24 bg-[#050505] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-primary/5 rounded-full blur-[140px] -z-10 translate-x-1/3 -translate-y-1/3" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-16">

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={stagger}
              className="lg:col-span-2 space-y-8"
            >
              <motion.div variants={fadeInUp}>
                <p className="text-primary tracking-[0.2em] uppercase text-xs mb-4">Booking Inquiry</p>
                <h2 className="font-serif text-3xl md:text-4xl leading-snug">
                  Reserve Your<br />
                  <span className="italic text-white/60">Date Today</span>
                </h2>
              </motion.div>

              <motion.p variants={fadeInUp} className="text-muted-foreground font-light leading-relaxed">
                Dates fill up fast — especially for wedding season. Submit your inquiry now and we'll confirm availability within 24 hours.
              </motion.p>

              <motion.div variants={fadeInUp} className="space-y-4 pt-2">
                {[
                  "Non-refundable ₹10,000 advance to confirm booking",
                  "Full package pricing shared after initial discussion",
                  "Outstation events welcome — travel costs applicable",
                  "Rescheduling available subject to availability",
                ].map((point) => (
                  <div key={point} className="flex items-start gap-3 text-sm text-white/60">
                    <CheckCircle className="w-4 h-4 text-primary/60 shrink-0 mt-0.5" strokeWidth={1.5} />
                    <span>{point}</span>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="lg:col-span-3 bg-background border border-white/5 p-8 md:p-12 shadow-2xl"
            >
              <h3 className="font-serif text-2xl mb-2">Booking Inquiry Form</h3>
              <p className="text-muted-foreground text-sm mb-8">Tell us about your event and we'll get back to you with availability and pricing.</p>
              <ContactForm />
            </motion.div>

          </div>
        </div>
      </section>

    </div>
  );
}
