import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, FileWarning, ShieldAlert, HeartHandshake, Scale } from "lucide-react";

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { delay, duration: 0.4 },
});

const HowItWorksPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-20 max-w-3xl">
        <motion.h1 className="font-display text-3xl md:text-4xl font-bold mb-2" {...fade()}>
          How ImageTruth AI Works
        </motion.h1>
        <motion.p className="text-muted-foreground mb-12" {...fade(0.05)}>
          A transparent look at our AI image analysis process.
        </motion.p>

        {/* 1. Introduction */}
        <motion.section className="mb-12" {...fade(0.1)}>
          <h2 className="flex items-center gap-2 text-xl font-semibold mb-3">
            <Eye className="h-5 w-5 text-primary" />
            Understanding AI Image Analysis
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            ImageTruth AI provides automated analysis of digital images using artificial intelligence.
            The system evaluates visual signals and patterns to generate structured insights that may
            help users interpret images.
          </p>
        </motion.section>

        {/* 2. What the AI Looks For */}
        <motion.section className="mb-12" {...fade(0.15)}>
          <h2 className="flex items-center gap-2 text-xl font-semibold mb-3">
            <FileWarning className="h-5 w-5 text-primary" />
            What the AI Looks For
          </h2>
          <p className="text-muted-foreground mb-4">
            The system analyzes a range of factors, including:
          </p>
          <ul className="space-y-2 text-muted-foreground list-disc pl-6">
            <li>Visual inconsistencies in lighting, shadows, and edges</li>
            <li>Compression patterns and artifacts</li>
            <li>Possible manipulation or generation signals</li>
            <li>Metadata patterns embedded in the file</li>
            <li>Other image characteristics relevant to analysis</li>
          </ul>
          <p className="mt-4 text-sm text-muted-foreground/80 italic">
            All analysis is automated and probabilistic — it identifies patterns, not certainties.
          </p>
        </motion.section>

        {/* 3. What the Results Mean */}
        <motion.section className="mb-12" {...fade(0.2)}>
          <h2 className="flex items-center gap-2 text-xl font-semibold mb-3">
            <Scale className="h-5 w-5 text-primary" />
            What the Results Mean
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            The report provides observations and signals rather than definitive conclusions.
            A confidence score, a verdict, and supporting reasons are presented to help you
            form your own assessment. Users should interpret results carefully and consider
            the broader context of any image.
          </p>
        </motion.section>

        {/* 4. Limitations */}
        <motion.section className="mb-12" {...fade(0.25)}>
          <h2 className="flex items-center gap-2 text-xl font-semibold mb-3">
            <ShieldAlert className="h-5 w-5 text-warning" />
            Limitations of AI
          </h2>
          <ul className="space-y-2 text-muted-foreground list-disc pl-6">
            <li>AI systems can and do make mistakes — both false positives and false negatives occur.</li>
            <li>Image quality, resolution, and format can affect the accuracy of results.</li>
            <li>AI cannot guarantee the authenticity or truthfulness of any image.</li>
            <li>Results should always be independently verified before being relied upon.</li>
          </ul>
        </motion.section>

        {/* 5. Responsible Use */}
        <motion.section className="mb-12" {...fade(0.3)}>
          <h2 className="flex items-center gap-2 text-xl font-semibold mb-3">
            <HeartHandshake className="h-5 w-5 text-primary" />
            Responsible Use
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            We encourage all users to use ImageTruth AI responsibly. Automated analysis is a
            starting point — not a final answer. Consider using multiple sources and methods
            when evaluating the authenticity of digital images, and avoid drawing conclusions
            from a single automated report.
          </p>
        </motion.section>

        {/* 6. Legal Disclaimer */}
        <motion.section
          className="rounded-xl border border-border bg-card p-6 shadow-card"
          {...fade(0.35)}
        >
          <p className="text-sm text-muted-foreground leading-relaxed">
            ImageTruth AI provides automated software-based analysis generated by artificial
            intelligence. Results are informational only and may be inaccurate or incomplete.
            Users should independently verify all information before relying on the results.
          </p>
          <Link
            to="/ai-disclaimer"
            className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
          >
            Read the full AI Disclaimer →
          </Link>
        </motion.section>
      </main>
      <Footer />
    </div>
  );
};

export default HowItWorksPage;
