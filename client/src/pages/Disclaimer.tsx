import { motion } from "framer-motion";
import { Mail, Phone } from "lucide-react";

export default function Disclaimer() {
  const sections = [
    {
      num: "1",
      title: "Best-Effort Services",
      content: "All photography, videography, and related services provided by Dream Pictures are delivered on a best-effort basis.\n\nWhile we strive to deliver the highest quality of work, results may vary depending on conditions beyond our control such as lighting, venue, weather, and client cooperation."
    },
    {
      num: "2",
      title: "Technical Failures",
      content: "Dream Pictures is not responsible for any loss of data, footage, or deliverables arising from:\n\n• Camera or equipment malfunction\n• Memory card failures\n• Software or hardware crashes\n• Power outages or technical disruptions during an event\n\nWe use professional-grade equipment and take all reasonable precautions, but cannot guarantee against unforeseen technical failures."
    },
    {
      num: "3",
      title: "Data Loss",
      content: "Dream Pictures maintains backup copies of all project files during the active production period. However, we are not liable for permanent data loss caused by:\n\n• Storage media failure\n• Accidental deletion\n• Corruption of files beyond recovery\n• Events outside our reasonable control\n\nClients are encouraged to make their own copies of all delivered media immediately upon receipt."
    },
    {
      num: "4",
      title: "Third-Party Services",
      content: "Dream Pictures may use third-party platforms for delivery (e.g., Google Drive) or communication. We are not responsible for:\n\n• Downtime or outages of third-party platforms\n• Data breaches or failures on third-party systems\n• Changes in third-party terms or availability\n\nAny issues caused by third-party services are beyond the control of Dream Pictures."
    },
    {
      num: "5",
      title: "Website Disclaimer",
      content: "The Dream Pictures website is provided for informational purposes only. We make every effort to keep the information accurate and up to date, but we do not guarantee:\n\n• Uninterrupted website availability\n• Accuracy of all content at all times\n• Freedom from errors or technical issues\n\nDream Pictures is not liable for any loss or damage arising from the use of or inability to access the website."
    },
    {
      num: "6",
      title: "No Liability for Indirect Damages",
      content: "Dream Pictures shall not be liable for any indirect, incidental, consequential, or punitive damages arising from:\n\n• Use of our services or website\n• Failure to deliver services due to circumstances beyond our control\n• Any reliance placed on information provided on the website\n\nIn no event shall Dream Pictures' total liability exceed the amount paid by the client for the specific service in question."
    },
    {
      num: "7",
      title: "Content Accuracy",
      content: "Sample images and videos displayed on our website represent our portfolio. Final results for each client may vary based on event conditions, personal preferences, and package selected.\n\nPricing and package details shown on the website are indicative and subject to change. Confirmed pricing will be communicated directly during the booking process."
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
          <h1 className="font-serif text-5xl mb-4">Disclaimer</h1>
          <p className="text-muted-foreground text-lg uppercase tracking-widest">Dream Pictures</p>
          <p className="text-muted-foreground mt-4">Last Updated: 24-03-2026</p>
        </div>

        <div className="prose prose-invert max-w-none mb-16">
          <p className="text-white/80 leading-relaxed text-lg">
            The information and services provided by Dream Pictures are offered in good faith. Please read the following disclaimer carefully to understand the limitations of our liability and the basis on which our services are provided.
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
          <h3 className="font-serif text-2xl mb-8">Contact Us</h3>
          <p className="text-white/70 mb-6">If you have questions or concerns about this disclaimer, please get in touch:</p>
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
