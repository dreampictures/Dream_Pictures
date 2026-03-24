import { motion } from "framer-motion";
import { Mail, Phone } from "lucide-react";

export default function Delivery() {
  const sections = [
    {
      num: "1",
      title: "Digital Delivery via Google Drive",
      content: "For most packages, final edited photos and videos are delivered digitally via a shared Google Drive link.\n\n• Delivery timeline: 30–45 days after the event date\n• The link will be sent to the email address provided at the time of booking\n• The link will remain active for a limited period; clients are advised to download and save their files immediately\n\nDream Pictures is not responsible for files not downloaded before the link expires."
    },
    {
      num: "2",
      title: "Physical Media Delivery",
      content: "For clients who prefer physical media:\n\n• Clients in basic packages must provide their own Pendrive for data transfer\n• Premium clients may receive delivery on an External Hard Drive (charges may apply)\n• Physical media must be handed over in person or couriered at the client's expense\n\nDream Pictures will not be responsible for damage or loss during physical media transit."
    },
    {
      num: "3",
      title: "Album Delivery",
      content: "Printed albums and photobooks are dispatched only after:\n\n• Final design has been approved by the client in writing\n• Full payment has been cleared\n\nAlbum delivery timeline will be communicated separately after design approval and depends on the printing vendor's schedule."
    },
    {
      num: "4",
      title: "Delivery Timelines & Delays",
      content: "Standard delivery timelines are:\n\n• Edited photos & videos: 30–45 days post-event\n• Album design proof: within 15 days of photos delivery\n• Printed album: after approval (vendor-dependent)\n\nDelays may occur due to:\n\n• High seasonal workload\n• Client-side delays in approvals or payments\n• Technical or third-party issues\n\nDream Pictures will proactively communicate any expected delays."
    },
    {
      num: "5",
      title: "Client Responsibilities",
      content: "To ensure smooth and timely delivery, clients are responsible for:\n\n• Providing a correct and active email address\n• Downloading files promptly once the Google Drive link is shared\n• Providing their own Pendrive (if applicable to the package)\n• Responding to design proofs or approval requests in a timely manner\n\nDelays caused by the client's failure to fulfill these responsibilities are not the liability of Dream Pictures."
    },
    {
      num: "6",
      title: "Re-Delivery Requests",
      content: "In case of failed delivery (e.g., expired link, lost Pendrive):\n\n• Re-delivery via Google Drive can be requested within the data backup period (90 days after delivery)\n• After the backup period, data may be permanently deleted and re-delivery may not be possible\n• A nominal re-delivery fee may apply for repeated re-delivery requests\n\nClients are strongly advised to maintain their own permanent backups of all received media."
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
          <h1 className="font-serif text-5xl mb-4">Delivery Policy</h1>
          <p className="text-muted-foreground text-lg uppercase tracking-widest">Dream Pictures</p>
          <p className="text-muted-foreground mt-4">Last Updated: 24-03-2026</p>
        </div>

        <div className="prose prose-invert max-w-none mb-16">
          <p className="text-white/80 leading-relaxed text-lg">
            This Delivery Policy outlines how Dream Pictures delivers your edited photos, videos, and other media. Please read carefully to understand timelines, methods, and your responsibilities as a client.
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
          <h3 className="font-serif text-2xl mb-8">Delivery Queries</h3>
          <p className="text-white/70 mb-6">For questions about your delivery status or to request re-delivery, contact us:</p>
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
