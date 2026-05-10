import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const AiDisclaimer = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="font-display text-3xl font-bold mb-8">AI Disclaimer</h1>

        <div className="prose prose-sm text-muted-foreground space-y-6">
          <p>Last updated: May 2026</p>

          <h2 className="text-lg font-semibold text-foreground">1. What ImageTruth AI Does</h2>
          <p>
            ImageTruth AI aggregates and presents findings from five independent AI models that
            analyze images for indicators of AI generation, deepfake signatures, and visual
            manipulation. ImageTruth AI does not make determinations about whether an image is
            authentic or AI-generated. Results show what each model found — not a verdict,
            conclusion, or definitive assessment.
          </p>

          <h2 className="text-lg font-semibold text-foreground">2. No Guarantee of Accuracy</h2>
          <p>
            No AI detection model is 100% accurate. Individual models may produce false positives
            (reporting indicators in authentic images) or false negatives (finding no indicators in
            AI-generated images). When models disagree, ImageTruth AI presents each model's
            findings transparently so users can evaluate the evidence themselves.
          </p>

          <h2 className="text-lg font-semibold text-foreground">3. Informational Purposes Only</h2>
          <p>
            All analysis results are provided for informational purposes only. Results should not
            be treated as definitive proof, legal evidence, or the sole basis for any consequential
            decision. Users should exercise independent judgment and, where appropriate, seek
            verification from qualified professionals such as forensic image analysts.
          </p>

          <h2 className="text-lg font-semibold text-foreground">4. Third-Party AI Models</h2>
          <p>
            ImageTruth AI uses third-party AI models and services as part of its analysis pipeline,
            including Winston AI, SightEngine, AI or Not, Hive, and Google Gemini. We do not
            control the underlying behavior, training data, or algorithms of these models. We
            cannot guarantee their outputs. Results reflect what each third-party model
            independently reported — not conclusions drawn by Choose To See, LLC.
          </p>

          <h2 className="text-lg font-semibold text-foreground">5. Evolving Technology</h2>
          <p>
            AI image generation and detection technologies are rapidly evolving. New AI generation
            techniques, generators, and styles may not be detectable by current models. Our model
            selection is regularly reviewed but inherent limitations always apply.
          </p>

          <h2 className="text-lg font-semibold text-foreground">6. No Liability</h2>
          <p>
            Choose To See, LLC is not liable for any damages, losses, or consequences arising from
            reliance on analysis results provided by ImageTruth AI. This includes but is not
            limited to decisions related to content moderation, legal proceedings, employment,
            academic integrity, journalism, insurance claims, or personal reputation. Results are
            presented as analytical findings from third-party models — not as determinations made
            by Choose To See, LLC.
          </p>

          <h2 className="text-lg font-semibold text-foreground">7. Recommended Use</h2>
          <p>
            ImageTruth AI is designed to be one input among several when evaluating an image. We
            recommend considering the full context of any image — its source, metadata, provenance,
            and the findings of multiple independent models — before drawing any conclusions.
            Reverse image search, source verification, and consultation with qualified
            professionals are valuable complements to automated analysis.
          </p>

          <h2 className="text-lg font-semibold text-foreground">8. Contact</h2>
          <p>
            If you have questions about this disclaimer or our analysis methods, please visit our{" "}
            <a href="/contact" className="text-primary hover:underline">Contact page</a> at
            imagetruthai.com/contact or email{" "}
            <a href="mailto:support@imagetruthai.com" className="text-primary hover:underline">support@imagetruthai.com</a>.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AiDisclaimer;
