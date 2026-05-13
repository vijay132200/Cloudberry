import { MarketingLayout } from "@/components/layout/marketing-layout";

export default function RefundPolicyPage() {
  return (
    <MarketingLayout>
      <div className="py-16 md:py-24 bg-gradient-to-b from-blue-soft/20 to-background">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl">
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-foreground mb-3">Refund Policy</h1>
            <p className="text-muted-foreground text-sm">Last updated: May 2026</p>
          </div>

          <div className="prose prose-slate max-w-none space-y-8 text-foreground/80 leading-relaxed">

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">Overview</h2>
              <p>
                At Cloudberry Health, we are committed to providing a high-quality, doctor-led metabolic care program. We understand that circumstances change, and we want our refund policy to be fair, transparent, and easy to understand. This policy applies to all monthly subscription plans offered through the Cloudberry platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">Cancellation and Pro-Rated Refunds</h2>
              <p>
                You may cancel your Cloudberry subscription at any time. If you cancel your subscription mid-cycle, you are eligible for a pro-rated refund for the unused portion of your current billing period. The pro-rated amount is calculated based on the number of days remaining in your active subscription period at the time of cancellation.
              </p>
              <p className="mt-3">
                For example, if you are on a monthly plan and cancel 10 days into a 30-day cycle, you will receive a refund for the remaining 20 days, less any applicable processing fees.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">How to Request a Refund</h2>
              <p>
                To initiate a cancellation or refund request, please contact us via WhatsApp or phone during business hours. Provide your registered name, mobile number, and a brief reason for the refund. Our team will review your request and respond within 24 hours.
              </p>
              <p className="mt-3">
                Approved refunds are processed within 5–7 business days and returned to the original payment method.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">Contact Us</h2>
              <p>
                If you have questions about this refund policy or wish to discuss your specific situation, please reach out to us. We are committed to resolving any concerns fairly and promptly.
              </p>
              <p className="mt-3 font-medium text-foreground">Cloudberry Health — Indore, Madhya Pradesh, India</p>
            </section>

          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
