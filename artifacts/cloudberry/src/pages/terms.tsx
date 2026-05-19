import { MarketingLayout } from "@/components/layout/marketing-layout";
import { Link } from "wouter";

export default function TermsPage() {
  return (
    <MarketingLayout>
      <div className="container mx-auto px-4 md:px-6 py-16 max-w-3xl">
        <h1 className="text-3xl font-bold text-foreground mb-2">Terms & Conditions</h1>
        <p className="text-muted-foreground text-sm mb-10">Last updated: May 2026</p>

        <div className="prose prose-sm max-w-none space-y-8 text-foreground/80">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
            <p>By registering and using Cloudberry Health ("the Platform"), you agree to be bound by these Terms & Conditions. If you do not agree, please do not use the Platform.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">2. Nature of Service</h2>
            <p>Cloudberry is a digital health platform providing doctor-led metabolic care programs. Our services include personalised nutrition guidance, activity coaching, glucose tracking, and clinical oversight.</p>
            <p className="mt-2">Cloudberry is <strong>not</strong> an emergency medical service. In case of a medical emergency, please call your local emergency services immediately.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">3. Eligibility</h2>
            <p>You must be at least 18 years of age to use this Platform. By registering, you confirm that the information you provide is accurate and complete.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">4. Account Security</h2>
            <p>You are responsible for maintaining the confidentiality of your login credentials. You agree to notify us immediately at <a href="mailto:hello@cloudberry.health" className="text-primary underline">hello@cloudberry.health</a> if you suspect any unauthorised use of your account.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">5. Health Data & Privacy</h2>
            <p>We collect and process personal health information to deliver our services. This includes weight, glucose readings, dietary logs, and activity data. All data is handled in accordance with our <Link href="/privacy-policy" className="text-primary underline">Privacy Policy</Link> and applicable healthcare privacy standards.</p>
            <p className="mt-2">By using the Platform, you consent to the collection, use, and sharing of your health data with your assigned care team for the purpose of delivering clinical care.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">6. Medical Disclaimer</h2>
            <p>The content provided on this Platform, including dietary guidance and health tips, is for informational purposes and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult your physician before making significant changes to your diet or exercise routine.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">7. Program Plans & Payments</h2>
            <p>Cloudberry offers three program tiers: Basic, Comprehensive, and Premium. Subscription details, pricing, and refund terms are outlined in our <Link href="/refund-policy" className="text-primary underline">Refund Policy</Link>. Fees are billed monthly and are non-refundable after the first 7 days unless otherwise stated.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">8. Intellectual Property</h2>
            <p>All content, branding, and materials on the Platform are the exclusive property of Cloudberry Health. You may not reproduce, distribute, or use our content without prior written permission.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">9. Termination</h2>
            <p>We reserve the right to suspend or terminate your account at our discretion if you violate these terms or engage in conduct harmful to other users, our staff, or our platform.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">10. Contact</h2>
            <p>For questions about these Terms, please contact us at <a href="mailto:hello@cloudberry.health" className="text-primary underline">hello@cloudberry.health</a> or visit our <Link href="/connect" className="text-primary underline">Connect page</Link>.</p>
          </section>
        </div>
      </div>
    </MarketingLayout>
  );
}
