import { motion } from "framer-motion";
import logoImg from "@assets/DP_logo_2021_White_1772790737407.png";

export default function About() {
  return (
    <div className="pt-32 pb-24 px-4 bg-noise">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <img src={logoImg} alt="Dream Pictures" className="h-20 mx-auto mb-8 opacity-80" />
          <h1 className="font-serif text-5xl md:text-6xl mb-6">About Dream Pictures</h1>
          <p className="text-primary tracking-[0.3em] uppercase text-sm mb-12">Artistry in Every Frame</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-24">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="aspect-[3/4] overflow-hidden rounded-sm"
          >
            <img 
              src="https://images.unsplash.com/photo-1554048612-b6a482bc67e5?auto=format&fit=crop&q=80&w=1000" 
              alt="The Photographer" 
              className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6 text-muted-foreground font-light text-lg leading-relaxed"
          >
            <p>
              Founded on the belief that life's most beautiful moments are often the most fleeting, Dream Pictures was born to turn those whispers of time into everlasting echoes.
            </p>
            <p>
              Based in the heart of artistry, our studio specializes in high-end wedding cinematography and fine-art photography. We don't just record events; we curate emotions, light, and soul into a cinematic narrative that feels like your very own masterpiece.
            </p>
            <p>
              Our team of dedicated visual storytellers combines technical precision with a deeply intuitive approach, ensuring that every glance, every tear, and every burst of laughter is preserved in its purest form.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
