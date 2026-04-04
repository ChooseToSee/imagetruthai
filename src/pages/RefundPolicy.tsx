import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const RefundPolicy = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="font-display text-3xl font-bold mb-8">Refund Policy</h1>

        <div className="prose prose-sm text-muted-foreground space-y-6">
          <p>Last updated: March 2026</p>

          <p>
            This Refund Policy applies to paid subscriptions purchased through ImageTruth AI,
            operated by Choose To See, LLC, a Colorado limited liability company.
          </p>

          <h2 className="text-lg font-semibold text-foreground">1. Subscription Plans</h2>
          <p>
            ImageTruth AI offers free and paid subscription plans billed on a recurring monthly or
            annual basis through Stripe. You may cancel your subscription at any time.
          </p>

          <h2 className="text-lg font-semibold text-foreground">2. Free Trial</h2>
          <p>
            New subscribers may receive a free trial period before their first charge. The 7-day
            refund window begins on the date of your first actual charge after any free trial period
            ends. No charge is made during the trial period and therefore no refund is applicable
            during the trial.
          </p>

          <h2 className="text-lg font-semibold text-foreground">3. Cancellation</h2>
          <p>
            You may cancel your subscription at any time through your account's Manage Subscription
            portal or by contacting us at{" "}
            <a href="mailto:support@imagetruthai.com" className="text-primary hover:underline">
              support@imagetruthai.com
            </a>
            . Upon cancellation, you will retain access to paid features until the end of your
            current billing period. No further charges will be made after cancellation.
          </p>

          <h2 className="text-lg font-semibold text-foreground">4. Refunds</h2>
          <p>We offer refunds under the following circumstances:</p>

          <p>
            <strong>Monthly subscriptions:</strong> If you are unsatisfied with the Service, you may
            request a full refund within 7 days of your first subscription payment. After 7 days,
            monthly subscription payments are non-refundable.
          </p>
          <p>
            <strong>Annual subscriptions:</strong> Refund requests made within 7 days of the annual
            charge are eligible for a full refund. After 7 days, annual subscriptions are
            non-refundable but you may cancel at any time to prevent future renewals.
          </p>
          <p>
            <strong>Service outages:</strong> If the Service is unavailable for more than 24
            consecutive hours due to issues on our end, you may be eligible for a prorated credit at
            our discretion.
          </p>
          <p>
            <strong>Billing errors:</strong> If you were charged in error (e.g., duplicate charges),
            we will issue a full refund for the erroneous charge.
          </p>
          <p>
            Approved refunds are returned to the original payment method used at purchase. Refund
            processing time depends on your payment provider and may take an additional 5–10 business
            days to appear on your statement.
          </p>

          <h2 className="text-lg font-semibold text-foreground">5. Non-Refundable Items</h2>
          <p>Refunds are not provided for:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Partial months of service after the 7-day refund window</li>
            <li>
              Dissatisfaction with AI analysis accuracy (see our{" "}
              <a href="/ai-disclaimer" className="text-primary hover:underline">
                AI Disclaimer
              </a>
              )
            </li>
            <li>Failure to cancel before a renewal date</li>
            <li>Accounts terminated due to violation of our{" "}
              <a href="/terms" className="text-primary hover:underline">
                Terms of Service
              </a>
            </li>
          </ul>

          <h2 className="text-lg font-semibold text-foreground">6. How to Request a Refund</h2>
          <p>
            To request a refund, contact us at{" "}
            <a href="mailto:support@imagetruthai.com" className="text-primary hover:underline">
              support@imagetruthai.com
            </a>{" "}
            or through our{" "}
            <a href="/contact" className="text-primary hover:underline">
              Contact page
            </a>{" "}
            with your account email and a brief explanation of your request. We aim to process refund
            requests within 5–10 business days of approval.
          </p>

          <h2 className="text-lg font-semibold text-foreground">7. Changes to This Policy</h2>
          <p>
            We may update this Refund Policy from time to time. We will notify users of material
            changes via email at least 7 days before changes take effect.
          </p>

          <h2 className="text-lg font-semibold text-foreground">8. Contact</h2>
          <p>
            Questions about refunds? Contact us at{" "}
            <a href="mailto:support@imagetruthai.com" className="text-primary hover:underline">
              support@imagetruthai.com
            </a>{" "}
            or visit our{" "}
            <a href="/contact" className="text-primary hover:underline">
              Contact page
            </a>
            .
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default RefundPolicy;
