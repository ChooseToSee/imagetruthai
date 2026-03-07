import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Privacy = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="font-display text-3xl font-bold mb-8">Privacy Policy</h1>

        <div className="prose prose-sm text-muted-foreground space-y-6">
          <p>Last updated: March 2026</p>

          <p>
            This Privacy Policy describes how Choose To See, LLC, doing business as ImageTruth AI
            ("we," "us," or "our"), collects, uses, and shares information when you use our website
            and services (collectively, the "Service").
          </p>

          <h2 className="text-lg font-semibold text-foreground">1. Information We Collect</h2>
          <p>
            <strong>Account Information:</strong> When you create an account, we collect your email
            address and basic profile information. We use this to authenticate you and provide
            account-related features such as scan history.
          </p>
          <p>
            <strong>Uploaded Images:</strong> Images you upload are processed for AI analysis. Images
            are temporarily stored during processing and are not retained permanently unless you are
            a registered user viewing scan history. You may delete your scan history at any time.
          </p>
          <p>
            <strong>Usage Data:</strong> We automatically collect information about how you interact
            with the Service, including pages visited, features used, and scan counts. This data is
            used to improve the Service.
          </p>
          <p>
            <strong>Payment Information:</strong> If you subscribe to a paid plan, payment
            processing is handled by Stripe, Inc. We do not store your credit card details on our
            servers. Please refer to{" "}
            <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              Stripe's Privacy Policy
            </a>{" "}
            for details.
          </p>

          <h2 className="text-lg font-semibold text-foreground">2. How We Use Your Information</h2>
          <p>We use collected information to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Provide, maintain, and improve the Service</li>
            <li>Process your image analysis requests</li>
            <li>Manage your account and subscription</li>
            <li>Communicate with you about service updates</li>
            <li>Detect and prevent fraud or abuse</li>
          </ul>
          <p>We do not sell your personal data to third parties.</p>

          <h2 className="text-lg font-semibold text-foreground">3. Data Retention</h2>
          <p>
            Uploaded images for analysis are temporarily processed and deleted after analysis unless
            saved to your scan history. Account data is retained as long as your account is active.
            You may request deletion of your account and associated data by contacting us.
          </p>

          <h2 className="text-lg font-semibold text-foreground">4. Data Sharing</h2>
          <p>
            We may share your information with third-party service providers who assist us in
            operating the Service (e.g., hosting, payment processing, AI model providers). These
            providers are contractually obligated to protect your data and use it only for the
            purposes we specify.
          </p>

          <h2 className="text-lg font-semibold text-foreground">5. Cookies</h2>
          <p>
            We use essential cookies for authentication and session management. No third-party
            tracking cookies are used.
          </p>

          <h2 className="text-lg font-semibold text-foreground">6. Your Rights</h2>
          <p>
            Depending on your jurisdiction, you may have rights to access, correct, or delete your
            personal data. Colorado residents may have additional rights under the Colorado Privacy
            Act (CPA). To exercise any rights, please contact us via our{" "}
            <a href="/contact" className="text-primary hover:underline">Contact page</a>.
          </p>

          <h2 className="text-lg font-semibold text-foreground">7. Children's Privacy</h2>
          <p>
            The Service is not directed to children under 13. We do not knowingly collect personal
            information from children under 13.
          </p>

          <h2 className="text-lg font-semibold text-foreground">8. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of material
            changes by posting the updated policy on this page with a revised "Last updated" date.
          </p>

          <h2 className="text-lg font-semibold text-foreground">9. Contact</h2>
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
