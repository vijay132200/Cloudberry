import { MarketingLayout } from "@/components/layout/marketing-layout";

export default function PrivacyPolicyPage() {
  return (
    <MarketingLayout>
      <div className="py-16 md:py-24 bg-gradient-to-b from-blue-soft/20 to-background">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl">
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-foreground mb-3">Privacy Policy</h1>
            <p className="text-muted-foreground text-sm">Last updated: May 2026</p>
          </div>

          <div className="prose prose-slate max-w-none space-y-8 text-foreground/80 leading-relaxed">

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">1. Introduction</h2>
              <p>
                Cloudberry Health ("Cloudberry", "we", "us", or "our") is committed to protecting the privacy and confidentiality of all personal and health-related information shared with us. This Privacy Policy explains how we collect, use, store, disclose, and protect your information when you use our platform, website, and related services.
              </p>
              <p className="mt-3">
                By using Cloudberry's services, you consent to the collection and use of information in accordance with this policy. If you do not agree with this policy, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">2. Applicable Laws and Regulatory Framework</h2>
              <p>Our data practices are governed by and designed to comply with:</p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li><strong>The Information Technology Act, 2000 (India)</strong> and the IT (Amendment) Act, 2008</li>
                <li><strong>The Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011</strong> — which govern the collection, processing, storage, and transfer of sensitive personal data including health records</li>
                <li><strong>The Digital Personal Data Protection Act, 2023 (DPDP Act)</strong> — India's primary data protection legislation, which establishes rights of data principals and obligations of data fiduciaries</li>
                <li><strong>The National Digital Health Mission (NDHM) Framework</strong> — to the extent it applies to digital health platforms</li>
                <li>Applicable guidelines issued by the <strong>Indian Council of Medical Research (ICMR)</strong> regarding health data privacy</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">3. Information We Collect</h2>
              <p>We collect the following categories of information:</p>

              <h3 className="text-base font-semibold text-foreground mt-4 mb-2">3.1 Personal Information</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Full name, date of birth, gender</li>
                <li>Phone number and email address</li>
                <li>City and address details</li>
              </ul>

              <h3 className="text-base font-semibold text-foreground mt-4 mb-2">3.2 Sensitive Personal Data (Health Information)</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Medical history, current diagnoses, and treatment plans</li>
                <li>Weight, BMI, blood glucose levels, and metabolic indicators</li>
                <li>Nutrition and dietary information</li>
                <li>Physical activity and lifestyle data</li>
                <li>Medication information</li>
                <li>Glucose logs, progress notes, and coaching records</li>
              </ul>

              <h3 className="text-base font-semibold text-foreground mt-4 mb-2">3.3 Technical and Usage Data</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>IP address, browser type, and device information</li>
                <li>Pages visited, session duration, and interaction data</li>
                <li>Communication logs (WhatsApp messages, call records with consent)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">4. How We Use Your Information</h2>
              <p>Your information is used solely for the purposes for which it was collected, including:</p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>Delivering and personalizing your care program</li>
                <li>Coordinating communication among your care team (doctor, nutritionist, fitness coach, care coordinator)</li>
                <li>Monitoring and tracking health progress</li>
                <li>Sending reminders, follow-up messages, and educational resources</li>
                <li>Improving and developing our platform and services</li>
                <li>Complying with legal obligations and responding to lawful requests</li>
                <li>Billing and subscription management</li>
              </ul>
              <p className="mt-3">
                We do not use your health data for advertising, marketing to third parties, or any purpose unrelated to your care.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">5. Consent</h2>
              <p>
                Under the DPDP Act, 2023, we collect and process your personal data only with your free, informed, specific, and unambiguous consent. You provide this consent when you register on the platform and agree to these terms.
              </p>
              <p className="mt-3">
                You have the right to withdraw consent at any time by contacting us. However, withdrawal of consent may limit or prevent us from delivering certain services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">6. Data Sharing and Disclosure</h2>
              <p>We do not sell, rent, or trade your personal information. We may share your information only in the following limited circumstances:</p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li><strong>Within your care team:</strong> Physicians, nutritionists, fitness coaches, and care coordinators who are part of your program</li>
                <li><strong>Technology service providers:</strong> Cloud hosting, communication, and analytics providers operating under strict data processing agreements</li>
                <li><strong>Legal compliance:</strong> When required by law, court order, or a government authority acting under lawful authority</li>
                <li><strong>Emergency situations:</strong> To protect the vital interests of a patient or another person</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">7. Data Storage and Security</h2>
              <p>
                All data is stored on secure servers with industry-standard encryption. We implement appropriate technical and organizational security measures including:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>End-to-end encryption for sensitive health information</li>
                <li>Role-based access controls to limit who can view patient data</li>
                <li>Regular security audits and vulnerability assessments</li>
                <li>Secure communication channels for all patient-care team interactions</li>
              </ul>
              <p className="mt-3">
                Despite these measures, no data transmission over the internet can be guaranteed to be 100% secure. We encourage you to contact us immediately if you suspect any unauthorized access to your account.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">8. Data Retention</h2>
              <p>
                We retain your personal and health information for as long as you have an active account with us, and for a period thereafter as required by applicable law or as necessary for legitimate business purposes. Health records may be retained for a minimum of 3 years from the date of last service, in compliance with applicable Indian health regulations. Upon a valid deletion request, we will delete or anonymize your data within 30 days, subject to legal retention requirements.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">9. Your Rights as a Data Principal</h2>
              <p>Under the DPDP Act, 2023, and other applicable laws, you have the following rights:</p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li><strong>Right to access:</strong> Request a copy of your personal data held by us</li>
                <li><strong>Right to correction:</strong> Request correction of inaccurate or incomplete data</li>
                <li><strong>Right to erasure:</strong> Request deletion of your personal data, subject to legal obligations</li>
                <li><strong>Right to data portability:</strong> Receive your data in a structured, commonly used format</li>
                <li><strong>Right to grievance redressal:</strong> Lodge a complaint with our data protection officer or the Data Protection Board of India</li>
                <li><strong>Right to withdraw consent:</strong> Withdraw your consent to data processing at any time</li>
              </ul>
              <p className="mt-3">
                To exercise any of these rights, please contact us using the details below. We will respond within 30 days of receiving a verifiable request.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">10. Cookies and Tracking</h2>
              <p>
                Our website uses essential cookies required for the platform to function. We do not use third-party advertising or tracking cookies. Session data may be stored temporarily in your browser to maintain your login state. You may disable cookies in your browser settings, but this may affect the functionality of the platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">11. Children's Privacy</h2>
              <p>
                Cloudberry's services are not directed to individuals under the age of 18. We do not knowingly collect personal information from minors. If we become aware that a child under 18 has provided personal information without parental consent, we will take steps to delete such information promptly.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">12. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy periodically to reflect changes in our practices or applicable law. We will notify registered users of material changes via the contact information on file or by posting a prominent notice on our platform. Continued use of our services after such notice constitutes your acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">13. Grievance Officer and Contact</h2>
              <p>
                As required under the IT (SPDI) Rules, 2011, and the DPDP Act, 2023, we have designated a Grievance Officer for handling data-related complaints and requests.
              </p>
              <div className="mt-3 bg-muted/50 rounded-xl p-5 space-y-1">
                <p className="font-semibold text-foreground">Cloudberry Health — Grievance Officer</p>
                <p>Cloudberry Health Pvt. Ltd.</p>
                <p>Indore, Madhya Pradesh, India</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  To raise a grievance or exercise your data rights, please contact us via WhatsApp or through the contact information provided in the patient portal. We will acknowledge your request within 48 hours and resolve it within 30 days.
                </p>
              </div>
            </section>

          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
