import { motion } from "framer-motion";
import { Mail, Phone, MapPin } from "lucide-react";

export default function Terms() {
  const sections = [
    {
      num: "1",
      title: "Acceptance of Terms",
      content: "By using this website or booking any service provided by Dream Pictures, you acknowledge that you have read, understood, and agree to be legally bound by these Terms & Conditions.\n\nIf you do not agree with these terms, you must refrain from using this website or booking our services."
    },
    {
      num: "2",
      title: "Services Provided",
      content: "Dream Pictures provides photography, videography, digital media services, and digital documentation services including but not limited to:\n\n• Wedding Photography & Videography\n• Cinematic Wedding Films\n• Pre-Wedding Shoots\n• Same Day Edit (SDE)\n• Album Design & Printing\n• Passport Photos\n• Digital Documentation & Online Services\n\nService availability may vary depending on location, schedule, and operational limitations."
    },
    {
      num: "3",
      title: "Booking & Contract Agreement",
      content: "A booking with Dream Pictures becomes valid only after the required booking advance is received.\n\n• Minimum booking advance: ₹10,000\n• Advance payment is non-refundable\n• Booking confirmation will be issued once payment is received\n\nDream Pictures reserves the right to decline bookings based on availability or operational considerations."
    },
    {
      num: "4",
      title: "Payment Policy",
      content: "The following payment structure applies unless otherwise agreed in writing:\n\n• 50% of the total payment must be made before the event date\n• Remaining payment must be completed before final delivery\n• Raw footage or final deliverables will not be provided until payment is fully cleared\n\nFailure to complete payment may result in delayed or cancelled delivery."
    },
    {
      num: "5",
      title: "Cancellation & Refund Policy",
      content: "In the event of cancellation:\n\n• Booking advance will not be refunded.\n• Cancellation within 7 days of the event may incur additional charges.\n\nIf the event is postponed:\n\n• The advance amount may be transferred to a new date subject to availability.\n\nDream Pictures reserves the right to cancel services in unforeseen circumstances including emergencies or force majeure events."
    },
    {
      num: "6",
      title: "Coverage Limitations",
      content: "Photography and videography coverage will be provided according to the selected package.\n\nDream Pictures is not responsible for missed moments caused by:\n\n• Venue restrictions\n• Crowd interference\n• Lack of lighting\n• Client delays or schedule changes\n\nAdditional hours of coverage may incur extra charges."
    },
    {
      num: "7",
      title: "Editing & Delivery",
      content: "Dream Pictures maintains professional editing standards and delivery timelines.\n\nTypical delivery time:\n\n• Photos & videos: 30–45 days after the event\n• Album printing: after design approval\n\nDelivery timelines may vary depending on workload, editing requirements, and seasonal demand."
    },
    {
      num: "8",
      title: "Same Day Edit & LED Wall Policy",
      content: "Same Day Edit services require proper event coordination.\n\n• LED Wall must be arranged by the client.\n• If Dream Pictures arranges LED display equipment, additional charges will apply.\n\nFailure to provide required setup may affect the delivery of Same Day Edit services."
    },
    {
      num: "9",
      title: "Data Storage & Delivery Policy",
      content: "Final data will be delivered via one of the following methods:\n\n• Google Drive download link\n• Client provided Pendrive\n• External Hard Drive (recommended for premium clients)\n\nFor lower budget packages, clients must provide their own Pendrive.\n\nDream Pictures retains project backup data for up to 30 days after final delivery. After this period, data may be permanently deleted."
    },
    {
      num: "10",
      title: "Travel & Accommodation",
      content: "For outstation events:\n\n• Travel expenses\n• Accommodation\n• Local transportation\n\nmust be arranged or covered by the client.\n\nFailure to arrange travel logistics may result in delayed or incomplete coverage."
    },
    {
      num: "11",
      title: "Copyright & Intellectual Property",
      content: "All photographs, videos, and creative content produced by Dream Pictures remain the intellectual property of the studio.\n\nDream Pictures retains the right to:\n\n• Display work on its website\n• Share images on social media\n• Use content for promotional or portfolio purposes\n\nClients may not reproduce, modify, or commercially distribute media without written consent."
    },
    {
      num: "12",
      title: "Privacy Policy",
      content: "Dream Pictures respects the privacy of its clients.\n\nPersonal information collected may include:\n\n• Name\n• Phone number\n• Email address\n• Event details\n\nThis information is used solely for:\n\n• Service communication\n• Booking management\n• Promotional updates (with consent)\n\nDream Pictures does not sell or share client data with third parties without permission."
    },
    {
      num: "13",
      title: "Website Usage",
      content: "Users of this website agree not to:\n\n• Use the website for illegal purposes\n• Attempt to hack, modify, or disrupt website functionality\n• Copy website content without permission\n\nAll website content including text, images, logos, and graphics are protected under copyright law."
    },
    {
      num: "14",
      title: "Limitation of Liability",
      content: "Dream Pictures will take all reasonable steps to provide high-quality services. However, the studio will not be held responsible for losses caused by:\n\n• Equipment failure\n• Weather conditions\n• Venue restrictions\n• Natural disasters\n• Uncontrollable circumstances\n\nIn any case, liability shall not exceed the amount paid by the client."
    },
    {
      num: "15",
      title: "Force Majeure",
      content: "Dream Pictures shall not be liable for failure to perform services due to events beyond its control including:\n\n• Natural disasters\n• Government restrictions\n• Pandemics\n• Technical disruptions\n\nIn such cases, services may be rescheduled where possible."
    },
    {
      num: "16",
      title: "Governing Law",
      content: "These Terms & Conditions shall be governed and interpreted under the laws of India.\n\nAny disputes arising shall be subject to the jurisdiction of the appropriate courts in India."
    },
    {
      num: "17",
      title: "Changes to Terms",
      content: "Dream Pictures reserves the right to update or modify these Terms & Conditions at any time without prior notice.\n\nUsers are encouraged to review this page periodically."
    }
  ];

  return (
    <div className="pt-32 pb-24 px-4 bg-noise">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="mb-16 text-center">
          <h1 className="font-serif text-5xl mb-4">Terms & Conditions</h1>
          <p className="text-muted-foreground text-lg uppercase tracking-widest">Dream Pictures</p>
          <p className="text-muted-foreground mt-4">Last Updated: 08-03-2026</p>
        </div>

        {/* Introduction */}
        <div className="prose prose-invert max-w-none mb-16">
          <p className="text-white/80 leading-relaxed text-lg">
            Welcome to Dream Pictures. By accessing our website, booking our services, or interacting with our digital platforms, you agree to comply with the following Terms and Conditions. These terms govern the relationship between Dream Pictures and its clients to ensure clarity, transparency, and professional service.
          </p>
        </div>

        {/* Sections */}
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

        {/* Contact Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="mt-20 pt-16 border-t border-white/5"
        >
          <h3 className="font-serif text-2xl mb-8">Contact Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <p className="text-white/80 text-lg mb-6 font-serif">Dream Pictures</p>
              <p className="text-muted-foreground">Jogewala</p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-white/70 hover:text-primary transition-colors">
                <Phone className="w-5 h-5 text-primary/50" />
                <span>+91 84375 66186</span>
              </div>
              <div className="flex items-center gap-3 text-white/70 hover:text-primary transition-colors">
                <Mail className="w-5 h-5 text-primary/50" />
                <span>hello@thedreampictures.com</span>
              </div>
              <div className="flex items-start gap-3 text-white/70">
                <MapPin className="w-5 h-5 text-primary/50 mt-0.5 flex-shrink-0" />
                <span>www.thedreampictures.com</span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
