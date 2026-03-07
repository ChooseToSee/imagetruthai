import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Terms = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="font-display text-3xl font-bold mb-8">Terms of Service</h1>

        <div className="prose prose-sm text-muted-foreground space-y-6">
          <p>Last updated: March 2026</p>

          <p>
            These Terms of Service ("Terms") govern your use of the ImageTruth AI website and
            services (the "Service") operated by Choose To See, LLC, a Colorado limited liability
            company ("we," "us," or "our").
          </p>

          <h2 className="text-lg font-semibold text-foreground">1. Acceptance of Terms</h2>
          <p>
            By accessing or using the Service, you agree to be bound by these Terms. If you do not
            agree, you may not use the Service.
          </p>

          <h2 className="text-lg font-semibold text-foreground">2. Service Description</h2>
          <p>
            ImageTruth AI provides AI-powered image analysis to detect AI-generated content and
            image manipulation. Results are provided as informational guidance only and should not be
            considered definitive proof of authenticity or manipulation.
          </p>

          <h2 className="text-lg font-semibold text-foreground">3. Accounts & Subscriptions</h2>
          <p>
            You may create an account to access additional features. You are responsible for
            maintaining the confidentiality of your account credentials. Paid subscriptions are
            billed through Stripe. See our{" "}
            <a href="/refund-policy" className="text-primary hover:underline">Refund Policy</a>{" "}
            for cancellation and refund details.
          </p>

          <h2 className="text-lg font-semibold text-foreground">4. Accuracy Disclaimer</h2>
          <p>
            No AI detection tool is 100% accurate. ImageTruth AI is designed as an assistive tool.
            We make no guarantees regarding the accuracy of results and are not liable for any
            decisions made based on our analysis. See our{" "}
            <a href="/ai-disclaimer" className="text-primary hover:underline">AI Disclaimer</a>{" "}
            for more details.
          </p>

          <h2 className="text-lg font-semibold text-foreground">5. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Upload illegal, obscene, or harmful content</li>
            <li>Attempt to reverse-engineer, decompile, or exploit the Service</li>
            <li>Use the Service for harassment, defamation, or fraud</li>
            <li>Circumvent usage limits or access restrictions</li>
            <li>Resell or redistribute analysis results commercially without permission</li>
          </ul>

          <h2 className="text-lg font-semibold text-foreground">6. Intellectual Property</h2>
          <p>
            All content, branding, and technology comprising the Service are owned by Choose To See,
            LLC. You retain ownership of images you upload but grant us a limited license to process
            them for analysis purposes.
          </p>

          <h2 className="text-lg font-semibold text-foreground">7. Limitation of Liability</h2>
          <p>
            The Service is provided "as is" without warranties of any kind, express or implied. To
            the fullest extent permitted by law, Choose To See, LLC shall not be liable for any
            indirect, incidental, special, consequential, or punitive damages arising from your use
            of the Service.
          </p>

          <h2 className="text-lg font-semibold text-foreground">8. Governing Law</h2>
          <p>
            These Terms are governed by the laws of the State of Colorado, United States, without
            regard to conflict of law principles. Any disputes shall be resolved in the courts
            located in Colorado.
          </p>

          <h2 className="text-lg font-semibold text-foreground">9. Changes to Terms</h2>
          <p>
            We may update these Terms from time to time. Continued use of the Service after changes
            constitutes acceptance of the revised Terms.
          </p>

          <h2 className="text-lg font-semibold text-foreground">10. Contact</h2>
          <p>
            Questions about these Terms? Visit our{" "}
            <a href="/contact" className="text-primary hover:underline">Contact page</a>.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Terms;
