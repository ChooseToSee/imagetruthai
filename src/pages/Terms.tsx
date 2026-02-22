import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Terms = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="font-display text-3xl font-bold mb-8">Terms of Service</h1>

        <div className="prose prose-sm text-muted-foreground space-y-6">
          <p>Last updated: February 2026</p>

          <h2 className="text-lg font-semibold text-foreground">1. Acceptance of Terms</h2>
          <p>
            By using ImageTruth AI, you agree to these Terms of Service. If you do not agree,
            please do not use the service.
          </p>

          <h2 className="text-lg font-semibold text-foreground">2. Service Description</h2>
          <p>
            ImageTruth AI provides AI-powered image analysis to detect AI-generated content and
            image manipulation. Results are provided as guidance only and should not be considered
            definitive proof.
          </p>

          <h2 className="text-lg font-semibold text-foreground">3. Accuracy Disclaimer</h2>
          <p>
            No detection tool is 100% accurate. ImageTruth AI is designed as an assistive tool.
            We make no guarantees regarding the accuracy of results and are not liable for
            decisions made based on our analysis.
          </p>

          <h2 className="text-lg font-semibold text-foreground">4. Acceptable Use</h2>
          <p>
            You agree not to upload illegal content, attempt to reverse-engineer the service,
            or use the service for harassment or defamation purposes.
          </p>

          <h2 className="text-lg font-semibold text-foreground">5. Limitation of Liability</h2>
          <p>
            ImageTruth AI is provided "as is" without warranties of any kind. We are not liable
            for any damages arising from your use of the service.
          </p>

          <h2 className="text-lg font-semibold text-foreground">6. Contact</h2>
          <p>
            Questions about these terms? Visit our{" "}
            <a href="/contact" className="text-primary hover:underline">Contact page</a>.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Terms;
