import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Privacy = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="font-display text-3xl font-bold mb-8">Privacy Policy</h1>

        <div className="prose prose-sm text-muted-foreground space-y-6">
          <p>Last updated: February 2026</p>

          <h2 className="text-lg font-semibold text-foreground">1. Information We Collect</h2>
          <p>
            When you use ImageTruth AI, we may collect your email address and basic profile
            information if you create an account. Images you upload are processed for analysis
            and are not stored permanently unless you are a registered user viewing scan history.
          </p>

          <h2 className="text-lg font-semibold text-foreground">2. How We Use Your Information</h2>
          <p>
            We use your information to provide the image analysis service, maintain your account,
            and improve our detection models. We do not sell your personal data to third parties.
          </p>

          <h2 className="text-lg font-semibold text-foreground">3. Data Retention</h2>
          <p>
            Uploaded images for analysis are temporarily processed and not retained after analysis
            unless saved to your scan history. You can delete your scan history at any time.
          </p>

          <h2 className="text-lg font-semibold text-foreground">4. Cookies</h2>
          <p>
            We use essential cookies for authentication and session management. No third-party
            tracking cookies are used.
          </p>

          <h2 className="text-lg font-semibold text-foreground">5. Contact</h2>
          <p>
            If you have questions about this Privacy Policy, please visit our{" "}
            <a href="/contact" className="text-primary hover:underline">Contact page</a>.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Privacy;
