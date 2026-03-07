import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const AiDisclaimer = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="font-display text-3xl font-bold mb-8">AI Disclaimer</h1>

        <div className="prose prose-sm text-muted-foreground space-y-6">
          <p>Last updated: March 2026</p>

          <p>
            This disclaimer applies to all AI-powered analysis and detection features provided by
            ImageTruth AI, operated by Choose To See, LLC, a Colorado limited liability company.
          </p>

          <h2 className="text-lg font-semibold text-foreground">1. No Guarantee of Accuracy</h2>
          <p>
            ImageTruth AI uses artificial intelligence models to analyze images for signs of AI
            generation or manipulation. <strong>No AI detection tool is 100% accurate.</strong>{" "}
            Results may contain false positives (flagging authentic images as AI-generated) or false
            negatives (failing to detect AI-generated images).
          </p>

          <h2 className="text-lg font-semibold text-foreground">2. Informational Purposes Only</h2>
          <p>
            All analysis results are provided for <strong>informational purposes only</strong> and
            should not be treated as definitive proof, legal evidence, or a basis for consequential
            decisions. Users should exercise their own judgment and, where appropriate, seek
            additional verification from qualified professionals.
          </p>

          <h2 className="text-lg font-semibold text-foreground">3. Evolving Technology</h2>
          <p>
            AI image generation and detection technologies are rapidly evolving. Our models are
            regularly updated to improve accuracy, but there will always be inherent limitations.
            New AI generation techniques may not be immediately detectable.
          </p>

          <h2 className="text-lg font-semibold text-foreground">4. Third-Party AI Models</h2>
          <p>
            ImageTruth AI may use third-party AI models and services as part of its analysis
            pipeline. We do not control the underlying behavior of these models and cannot guarantee
            their outputs. We select and configure models to provide the best results possible, but
            limitations of underlying models apply.
          </p>

          <h2 className="text-lg font-semibold text-foreground">5. No Liability</h2>
          <p>
            Choose To See, LLC is not liable for any damages, losses, or consequences arising from
            reliance on analysis results provided by ImageTruth AI. This includes but is not limited
            to decisions related to content moderation, legal proceedings, employment, academic
            integrity, or personal reputation.
          </p>

          <h2 className="text-lg font-semibold text-foreground">6. Recommended Use</h2>
          <p>
            We recommend using ImageTruth AI as <strong>one tool among several</strong> when
            evaluating image authenticity. Consider the context, source, and metadata of any image
            alongside automated analysis results.
          </p>

          <h2 className="text-lg font-semibold text-foreground">7. Contact</h2>
          <p>
            If you have questions about this disclaimer or our AI analysis methods, please visit
            our{" "}
            <a href="/contact" className="text-primary hover:underline">Contact page</a>.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AiDisclaimer;
