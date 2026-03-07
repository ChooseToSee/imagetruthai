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
            ImageTruth AI offers free and paid subscription plans. Paid plans are billed on a
            recurring monthly or annual basis through Stripe. You may cancel your subscription at
            any time.
          </p>

          <h2 className="text-lg font-semibold text-foreground">2. Cancellation</h2>
          <p>
            You may cancel your subscription at any time through your account settings or by
            contacting us. Upon cancellation, you will retain access to paid features until the end
            of your current billing period. No further charges will be made after cancellation.
          </p>

          <h2 className="text-lg font-semibold text-foreground">3. Refunds</h2>
          <p>
            We offer refunds under the following circumstances:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>Within 7 days of initial purchase:</strong> If you are unsatisfied with the
              Service, you may request a full refund within 7 days of your first subscription
              payment.
            </li>
            <li>
              <strong>Service outages:</strong> If the Service experiences significant downtime or
              is unavailable for an extended period, you may be eligible for a prorated refund or
              credit at our discretion.
            </li>
            <li>
              <strong>Billing errors:</strong> If you were charged in error (e.g., duplicate
              charges), we will issue a full refund for the erroneous charge.
            </li>
          </ul>

          <h2 className="text-lg font-semibold text-foreground">4. Non-Refundable Items</h2>
          <p>
            Refunds are generally not provided for:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Partial months of service after the 7-day refund window</li>
            <li>Dissatisfaction with AI analysis accuracy (see our{" "}
              <a href="/ai-disclaimer" className="text-primary hover:underline">AI Disclaimer</a>)
            </li>
            <li>Failure to cancel before a renewal date</li>
          </ul>

          <h2 className="text-lg font-semibold text-foreground">5. How to Request a Refund</h2>
          <p>
            To request a refund, please contact us through our{" "}
            <a href="/contact" className="text-primary hover:underline">Contact page</a>{" "}
            with your account email and a brief explanation. We aim to process refund requests
            within 5–10 business days.
          </p>

          <h2 className="text-lg font-semibold text-foreground">6. Changes to This Policy</h2>
          <p>
            We may update this Refund Policy from time to time. Changes will be posted on this page
            with a revised "Last updated" date.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default RefundPolicy;
