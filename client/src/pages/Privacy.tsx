import { motion } from "framer-motion";
import { Mail, Phone } from "lucide-react";

export default function Privacy() {
  const sections = [
    {
      num: "1",
      title: "Information We Collect",
      content: "Dream Pictures may collect the following personal information when you use our website or book our services:\n\n• Full Name\n• Phone Number\n• Email Address\n• Event Details (date, venue, type)\n\nThis information is collected when you fill out our contact or inquiry form."
    },
    {
      num: "2",
      title: "How We Use Your Information",
      content: "The information collected is used strictly for:\n\n• Booking confirmation and management\n• Communication regarding your event or service\n• Service delivery and coordination\n• Promotional updates (only with your consent)\n\nWe do not use your data for any purpose beyond what is stated above."
    },
    {
      num: "3",
      title: "Data Sharing",
      content: "Dream Pictures does not sell, trade, or share your personal data with any third parties without your explicit consent.\n\nYour information remains confidential and is only accessible to our internal team for service delivery purposes."
    },
    {
      num: "4",
      title: "Data Retention",
      content: "We retain your personal data only as long as necessary to fulfill the purpose for which it was collected, or as required by applicable laws.\n\nAfter your service is complete and the retention period has passed, your data will be securely deleted."
    },
    {
      num: "5",
      title: "Your Rights",
      content: "You have the right to:\n\n• Access the personal data we hold about you\n• Request correction of inaccurate data\n• Request deletion of your data at any time\n• Withdraw consent for promotional communications\n\nTo exercise any of these rights, please contact us using the details below."
    },
    {
      num: "6",
      title: "Cookies & Website Usage",
      content: "Our website may use cookies to improve your browsing experience. Cookies are small files stored on your device that help us understand how visitors use the site.\n\nYou may disable cookies through your browser settings, though some features of the website may be affected."
    },
    {
      num: "7",
      title: "Security",
      content: "We take reasonable measures to protect your personal information from unauthorized access, disclosure, or loss. However, no method of transmission over the internet is 100% secure.\n\nWe encourage you to contact us immediately if you believe your information has been compromised."
    },
    {
      num: "8",
      title: "Changes to This Policy",
      content: "Dream Pictures reserves the right to update this Privacy Policy at any time. Changes will be reflected on this page with an updated date.\n\nWe encourage you to review this page periodically to stay informed about how we protect your data."
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
          <h1 className="font-serif text-5xl mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground text-lg uppercase tracking-widest">Dream Pictures</p>
          <p className="text-muted-foreground mt-4">Last Updated: 24-03-2026</p>
        </div>

        <div className="prose prose-invert max-w-none mb-16">
          <p className="text-white/80 leading-relaxed text-lg">
            Dream Pictures respects your privacy and is committed to protecting your personal data. This Privacy Policy explains what information we collect, how we use it, and the rights you have over your data.
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
          <p className="text-white/70 mb-6">If you have any questions about this Privacy Policy or wish to request data deletion, please contact us:</p>
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
