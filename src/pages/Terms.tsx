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
            By accessing or using the Service, you agree to be bound by these Terms. You must be at
            least 13 years of age to use the Service. If you are under 18, you represent that you
            have parental or guardian consent. If you do not agree to these Terms, you may not use
            the Service.
          </p>

          <h2 className="text-lg font-semibold text-foreground">2. Service Description</h2>
          <p>
            ImageTruth AI provides AI-powered image analysis to help detect AI-generated content and
            image manipulation. Results are provided as informational guidance only and should not be
            considered definitive proof of authenticity or manipulation. No AI detection tool is 100%
            accurate and results may vary.
          </p>

          <h2 className="text-lg font-semibold text-foreground">3. Accounts and Subscriptions</h2>
          <p>
            You may create an account to access additional features. You are responsible for
            maintaining the confidentiality of your account credentials and for all activity that
            occurs under your account.
          </p>
          <p>
            Paid subscriptions are billed through Stripe and automatically renew unless cancelled
            before the renewal date. You may cancel at any time through your account's Manage
            Subscription portal. Cancellation takes effect at the end of the current billing period.
          </p>
          <p>
            New subscribers may be eligible for a free trial period. At the end of the trial, your
            payment method will be automatically charged the applicable subscription fee unless you
            cancel before the trial ends. See our{" "}
            <a href="/refund-policy" className="text-primary hover:underline">Refund Policy</a>{" "}
            for full cancellation and refund details.
          </p>

          <h2 className="text-lg font-semibold text-foreground">4. Accuracy Disclaimer</h2>
          <p>
            No AI detection tool is 100% accurate. ImageTruth AI is designed as an assistive tool to
            help evaluate images. We make no guarantees regarding the accuracy, completeness, or
            reliability of analysis results. We are not liable for any decisions, actions, or
            consequences arising from reliance on our analysis. Results should always be
            independently verified before being used for any consequential purpose. See our{" "}
            <a href="/ai-disclaimer" className="text-primary hover:underline">AI Disclaimer</a>{" "}
            for more details.
          </p>

          <h2 className="text-lg font-semibold text-foreground">5. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Upload illegal, obscene, or harmful content</li>
            <li>Upload images that infringe on the intellectual property, privacy, or other rights of any third party</li>
            <li>Upload abusive, exploitative, or sensitive images, including but not limited to content depicting minors in any inappropriate context, violence, or non-consensual intimate imagery</li>
            <li>Attempt to reverse-engineer, decompile, or exploit the Service</li>
            <li>Use the Service for harassment, defamation, or fraud</li>
            <li>Circumvent usage limits or access restrictions</li>
            <li>Resell or redistribute analysis results commercially without written permission</li>
            <li>Use automated tools, bots, or scripts to access the Service without prior written consent</li>
          </ul>
          <p className="mt-2">
            Violation of these restrictions may result in immediate account suspension or
            termination without prior notice. We reserve the right to review and remove any content
            that violates these Terms at our sole discretion.
          </p>

          <h2 className="text-lg font-semibold text-foreground">6. Intellectual Property and Data</h2>
          <p>
            All content, branding, and technology comprising the Service are owned by Choose To See,
            LLC and protected by applicable intellectual property laws. You retain full ownership of
            images you upload. By uploading images you grant us a limited, non-exclusive license
            solely to process them for analysis purposes.
          </p>
          <p>
            Images uploaded for analysis are processed and automatically deleted from temporary
            storage immediately after analysis is complete. Images associated with your saved scan
            history are retained until you delete them or close your account. We do not use your
            uploaded images to train AI models or share them with third parties except as required to
            perform the analysis.
          </p>

          <h2 className="text-lg font-semibold text-foreground">7. Copyright and DMCA</h2>
          <p>
            If you believe content on our Service infringes your copyright, please contact us at{" "}
            <a href="mailto:support@imagetruthai.com" className="text-primary hover:underline">support@imagetruthai.com</a>{" "}
            with a description of the allegedly infringing material, its location on our Service,
            and your contact information. We will respond promptly to valid takedown requests.
          </p>

          <h2 className="text-lg font-semibold text-foreground">8. Limitation of Liability</h2>
          <p>
            The Service is provided "as is" without warranties of any kind, express or implied,
            including but not limited to warranties of merchantability, fitness for a particular
            purpose, or non-infringement. To the fullest extent permitted by law, Choose To See, LLC
            shall not be liable for any indirect, incidental, special, consequential, or punitive
            damages arising from your use of the Service. In no event shall our total liability to
            you exceed the amount you paid us in the twelve months preceding the claim.
          </p>

          <h2 className="text-lg font-semibold text-foreground">9. Indemnification</h2>
          <p>
            You agree to indemnify, defend, and hold harmless Choose To See, LLC and its officers,
            directors, and agents from any claims, damages, losses, or expenses (including
            reasonable attorneys' fees) arising from your violation of these Terms or your misuse of
            the Service.
          </p>

          <h2 className="text-lg font-semibold text-foreground">10. Dispute Resolution</h2>
          <p>
            Before filing a claim in court, you agree to attempt to resolve any dispute informally
            by contacting us at{" "}
            <a href="mailto:support@imagetruthai.com" className="text-primary hover:underline">support@imagetruthai.com</a>.
            If the dispute is not resolved within 30 days, it shall be resolved by binding
            arbitration conducted in Colorado under the rules of the American Arbitration
            Association. You waive any right to a jury trial or class action proceeding.
          </p>

          <h2 className="text-lg font-semibold text-foreground">11. Governing Law</h2>
          <p>
            These Terms are governed by the laws of the State of Colorado, United States, without
            regard to conflict of law principles. Any disputes not subject to arbitration shall be
            resolved in the state or federal courts located in Douglas County, Colorado.
          </p>

          <h2 className="text-lg font-semibold text-foreground">12. Changes to Terms</h2>
          <p>
            We may update these Terms from time to time. We will notify users of material changes
            via email or a prominent notice on the Service at least 7 days before changes take
            effect. Continued use of the Service after changes constitutes acceptance of the revised
            Terms.
          </p>

          <h2 className="text-lg font-semibold text-foreground">13. Contact</h2>
          <p>
            Questions about these Terms? Contact us at{" "}
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

export default Terms;
