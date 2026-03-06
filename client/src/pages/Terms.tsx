import { motion } from "framer-motion";

export default function Terms() {
  return (
    <div className="pt-32 pb-24 px-4 bg-noise">
      <div className="max-w-3xl mx-auto prose prose-invert">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-serif text-4xl mb-8">Terms & Conditions</h1>
          <p className="text-muted-foreground mb-8">Last Updated: March 2026</p>
          
          <section className="mb-12">
            <h2 className="text-xl font-serif text-primary mb-4">1. Booking and Reservation</h2>
            <p>A non-refundable retainer fee and a signed contract are required to secure your date. No booking is confirmed until both are received.</p>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-serif text-primary mb-4">2. Creative Vision</h2>
            <p>The client grants Dream Pictures full artistic license in relation to the poses photographed and the locations used. Our editing style is consistent with our portfolio, and requests for raw unedited files will not be entertained.</p>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-serif text-primary mb-4">3. Delivery Timelines</h2>
            <p>Standard delivery for highlight films and photography galleries is 8-12 weeks from the event date, depending on the season and complexity of the project.</p>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-serif text-primary mb-4">4. Usage Rights</h2>
            <p>Dream Pictures retains the copyright to all images and films produced. Clients are granted a personal use license to print and share their media. Commercial use requires explicit written consent.</p>
          </section>
        </motion.div>
      </div>
    </div>
  );
}
