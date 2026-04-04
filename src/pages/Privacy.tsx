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
            <strong className="text-foreground">Account Information:</strong> When you create an
            account, we collect your email address and basic profile information. We use this to
            authenticate you and provide account-related features such as scan history.
          </p>
          <p>
            <strong className="text-foreground">Uploaded Images:</strong> Images you upload are
            processed for AI analysis. Images are temporarily stored during processing and are
            automatically deleted immediately after analysis is complete, typically within seconds.
            Images are not retained permanently unless you are a registered user with scan history
            enabled. You may delete your scan history at any time from your account.
          </p>
          <p>
            <strong className="text-foreground">Usage Data:</strong> We automatically collect
            information about how you interact with the Service, including pages visited, features
            used, and scan counts. This data is used to improve the Service and prevent abuse.
          </p>
          <p>
            <strong className="text-foreground">Payment Information:</strong> If you subscribe to a
            paid plan, payment processing is handled entirely by Stripe, Inc. We do not store your
            credit card details on our servers. Please refer to{" "}
            <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Stripe's Privacy Policy</a>{" "}
            for details on how they handle your payment information.
          </p>

          <h2 className="text-lg font-semibold text-foreground">2. How We Use Your Information</h2>
          <p>We use collected information to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Provide, maintain, and improve the Service</li>
            <li>Process your image analysis requests</li>
            <li>Manage your account and subscription</li>
            <li>Communicate with you about service updates</li>
            <li>Detect and prevent fraud or abuse</li>
            <li>Comply with legal obligations</li>
          </ul>
          <p>
            We do not sell your personal data to third parties. We do not use your uploaded images
            to train AI models.
          </p>

          <h2 className="text-lg font-semibold text-foreground">3. Data Retention</h2>
          <p>
            Uploaded images for analysis are automatically deleted immediately after analysis is
            complete, typically within seconds of processing. Images associated with your saved scan
            history are retained until you delete them or close your account. Account data is
            retained as long as your account is active.
          </p>
          <p>
            To request deletion of your account and all associated data including scan history and
            uploaded images, contact us at{" "}
            <a href="mailto:support@imagetruthai.com" className="text-primary hover:underline">support@imagetruthai.com</a>{" "}
            or use the account settings in your dashboard.
          </p>

          <h2 className="text-lg font-semibold text-foreground">4. Data Sharing</h2>
          <p>
            We may share your information with the following third-party service providers who
            assist us in operating the Service:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong className="text-foreground">Supabase:</strong> database, authentication, and file storage</li>
            <li><strong className="text-foreground">Stripe:</strong> payment processing</li>
            <li><strong className="text-foreground">Winston AI:</strong> AI image analysis</li>
            <li><strong className="text-foreground">SightEngine:</strong> AI image analysis</li>
            <li><strong className="text-foreground">AI or Not:</strong> AI image analysis</li>
            <li><strong className="text-foreground">Google (Gemini):</strong> AI image analysis</li>
            <li><strong className="text-foreground">Hive:</strong> AI image analysis</li>
          </ul>
          <p>
            Each provider processes your data solely for the purposes we specify and is
            contractually obligated to protect your data. Your images may be transmitted to these
            providers for analysis purposes only.
          </p>
          <p>
            Your information may be transferred to and processed in countries other than your own.
            We ensure appropriate safeguards are in place for such transfers in accordance with
            applicable privacy laws.
          </p>

          <h2 className="text-lg font-semibold text-foreground">5. Cookies</h2>
          <p>
            We use essential cookies for authentication and session management via Supabase. These
            cookies are necessary for the Service to function. No advertising, analytics, or
            third-party tracking cookies are used.
          </p>

          <h2 className="text-lg font-semibold text-foreground">6. Your Rights</h2>
          <p>
            Depending on your jurisdiction, you may have the following rights regarding your
            personal data:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong className="text-foreground">Access:</strong> request a copy of your personal data</li>
            <li><strong className="text-foreground">Correction:</strong> request correction of inaccurate data</li>
            <li><strong className="text-foreground">Deletion:</strong> request deletion of your data</li>
            <li><strong className="text-foreground">Portability:</strong> request your data in a portable format</li>
            <li><strong className="text-foreground">Restriction:</strong> request we limit how we use your data</li>
          </ul>
          <p>
            Colorado residents may have additional rights under the Colorado Privacy Act (CPA).
          </p>
          <p>
            European Union residents have rights under the General Data Protection Regulation (GDPR)
            including the right to access, rectify, erase, restrict processing, and data
            portability.
          </p>
          <p>
            To exercise any of these rights, contact us at{" "}
            <a href="mailto:support@imagetruthai.com" className="text-primary hover:underline">support@imagetruthai.com</a>.
          </p>

          <h2 className="text-lg font-semibold text-foreground">7. Data Breach Notification</h2>
          <p>
            In the event of a data breach that affects your personal information, we will notify
            affected users within 72 hours of becoming aware of the breach, in accordance with
            applicable law.
          </p>

          <h2 className="text-lg font-semibold text-foreground">8. Children's Privacy</h2>
          <p>
            The Service is not directed to children under 13. We do not knowingly collect personal
            information from children under 13. If you believe a child under 13 has provided us with
            personal information, please contact us at{" "}
            <a href="mailto:support@imagetruthai.com" className="text-primary hover:underline">support@imagetruthai.com</a>{" "}
            and we will promptly delete it.
          </p>

          <h2 className="text-lg font-semibold text-foreground">9. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify users of material
            changes via email at least 7 days before changes take effect. Continued use of the
            Service after changes constitutes acceptance of the revised Policy.
          </p>

          <h2 className="text-lg font-semibold text-foreground">10. Contact</h2>
          <p>
            If you have questions about this Privacy Policy, contact us at{" "}
            <a href="mailto:support@imagetruthai.com" className="text-primary hover:underline">support@imagetruthai.com</a>{" "}
            or visit our{" "}
            <a href="/contact" className="text-primary hover:underline">Contact page</a>.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Privacy;
