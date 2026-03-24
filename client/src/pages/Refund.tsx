import { motion } from "framer-motion";
import { Mail, Phone } from "lucide-react";

export default function Refund() {
  const sections = [
    {
      num: "1",
      title: "Non-Refundable Advance",
      content: "The booking advance paid at the time of reservation is strictly non-refundable under all circumstances.\n\nThe advance is collected to secure the date and allocate resources for your event. Once paid, it cannot be returned regardless of any changes in the client's plans."
    },
    {
      num: "2",
      title: "Cancellation Charges",
      content: "If a booking is cancelled within 7 days of the scheduled event date, additional cancellation charges may apply.\n\nThe exact charges will depend on the work already completed, resources allocated, and the proximity to the event date. Dream Pictures will communicate the applicable charges on a case-by-case basis."
    },
    {
      num: "3",
      title: "Rescheduling Policy",
      content: "Rescheduling of an event or service is allowed subject to availability.\n\nTo reschedule:\n\n• The request must be submitted in advance (recommended: at least 14 days before the event)\n• A new date will be offered based on our schedule availability\n• The advance amount may be transferred to the new date\n\nDream Pictures cannot guarantee availability for all rescheduling requests."
    },
    {
      num: "4",
      title: "No Refund After Work Commences",
      content: "Once work on a project has begun — including but not limited to event coverage, editing, album design, or any production stage — no refund will be issued.\n\nThis applies regardless of the client's satisfaction with interim results. Dream Pictures commits to delivering the highest quality within the agreed scope of work."
    },
    {
      num: "5",
      title: "Partial Delivery & Disputes",
      content: "If a dispute arises regarding partial delivery or service quality:\n\n• The client must raise the concern in writing within 7 days of receiving the deliverables\n• Dream Pictures will review and respond within a reasonable time\n• Refunds, if any, will be evaluated on merit and are at the sole discretion of Dream Pictures management\n\nNo chargeback or payment reversal will be accepted without prior written communication."
    },
    {
      num: "6",
      title: "Force Majeure & Cancellation by Dream Pictures",
      content: "In rare cases where Dream Pictures must cancel due to force majeure (natural disaster, medical emergency, government restrictions, etc.):\n\n• The advance may be transferred to a new date, or\n• A partial or full refund may be issued at management's discretion\n\nDream Pictures will communicate promptly and work to find an equitable resolution."
    }
  ];

  return (
    <div className="pt-32 pb-24 px-4 bg-noise">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="mb-16 text-center">
          <h1 className="font-serif text-5xl mb-4">Refund & Cancellation Policy</h1>
          <p className="text-muted-foreground text-lg uppercase tracking-widest">Dream Pictures</p>
          <p className="text-muted-foreground mt-4">Last Updated: 24-03-2026</p>
        </div>

        <div className="prose prose-invert max-w-none mb-16">
          <p className="text-white/80 leading-relaxed text-lg">
            Please read this Refund & Cancellation Policy carefully before making a booking with Dream Pictures. By completing a booking, you agree to the terms outlined below.
          </p>
        </div>

        <div className="space-y-12">
          {sections.map((section, idx) => (
            <motion.section
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="border-l-2 border-primary/30 pl-6 py-2"
            >
              <div className="flex items-baseline gap-4 mb-3">
                <span className="text-primary font-serif text-2xl font-bold">{section.num}</span>
                <h2 className="font-serif text-xl text-white">{section.title}</h2>
              </div>
              <p className="text-white/70 whitespace-pre-line leading-relaxed">
                {section.content}
              </p>
            </motion.section>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="mt-20 pt-16 border-t border-white/5"
        >
          <h3 className="font-serif text-2xl mb-8">Questions About Refunds?</h3>
          <p className="text-white/70 mb-6">For any cancellation or refund inquiries, please reach out to us directly:</p>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-white/70 hover:text-primary transition-colors">
              <Mail className="w-5 h-5 text-primary/50" />
              <span>info@thedreampictures.com</span>
            </div>
            <div className="flex items-center gap-3 text-white/70 hover:text-primary transition-colors">
              <Phone className="w-5 h-5 text-primary/50" />
              <span>+91 84375 66186</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
