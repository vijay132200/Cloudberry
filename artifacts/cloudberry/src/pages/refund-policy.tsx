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
              <h2 className="text-xl font-bold text-foreground mb-3">Onboarding and Consultation Fees</h2>
              <p>
                Free initial consultations are non-refundable as they involve time and resources from our clinical team. If a paid onboarding or assessment fee was charged as part of your enrollment, this fee is non-refundable once the onboarding session has taken place.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">Non-Refundable Circumstances</h2>
              <p>Refunds will not be issued in the following circumstances:</p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>The subscription period has already been fully consumed.</li>
                <li>Cancellation is requested after more than 28 days of the current billing cycle without prior written notice.</li>
                <li>The account has been suspended or terminated due to a violation of our Terms of Service.</li>
                <li>The refund request is made more than 60 days after the original charge date.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">How to Request a Refund</h2>
              <p>
                To initiate a cancellation or refund request, please contact us via WhatsApp or phone during business hours. Provide your registered name, mobile number, and a brief reason for the refund. Our team will review your request and respond within 2 business days.
              </p>
              <p className="mt-3">
                Approved refunds are processed within 5–7 business days and returned to the original payment method.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">Plan Changes and Downgrades</h2>
              <p>
                If you choose to downgrade your plan mid-cycle, the difference in cost will be applied as a credit toward your next billing period rather than issued as a cash refund. Upgrades take effect immediately and are billed on a pro-rated basis for the remainder of the current cycle.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">Service Disruptions</h2>
              <p>
                In the rare event that Cloudberry is unable to deliver the services included in your plan due to a failure on our part (such as an extended service outage or inability to assign a care team), you may be eligible for a full or partial refund for the affected period. Such cases are reviewed individually by our team.
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
