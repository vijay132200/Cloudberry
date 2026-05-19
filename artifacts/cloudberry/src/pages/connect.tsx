import { MarketingLayout } from "@/components/layout/marketing-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { CheckCircle2, Mail, MapPin, Phone } from "lucide-react";

export default function ConnectPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <MarketingLayout>
      <section className="py-14 bg-gradient-to-br from-primary/5 via-blue-soft/20 to-warm-neutral/30">
        <div className="container mx-auto px-4 md:px-6 max-w-5xl">
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3">Connect with Us</h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Have a question, want to get started, or just want to learn more? Reach out — our team will get back to you shortly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
            {/* Contact Info */}
            <div className="flex flex-col gap-6">
              <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-6 flex flex-col gap-5">
                <h2 className="text-xl font-bold text-foreground">Get in Touch</h2>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">Email</p>
                    <a href="mailto:hello@cloudberry.health" className="text-sm text-muted-foreground hover:text-primary transition-colors">hello@cloudberry.health</a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">Phone / WhatsApp</p>
                    <p className="text-sm text-muted-foreground">Available on request</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">Location</p>
                    <p className="text-sm text-muted-foreground">Indore, Madhya Pradesh, India</p>
                  </div>
                </div>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
                <h3 className="font-bold text-foreground mb-2">What happens after you submit?</h3>
                <ul className="flex flex-col gap-2">
                  {[
                    "Our team reviews your message within 24 hours",
                    "We reach out to understand your needs better",
                    "You get onboarded to the right plan for you",
                  ].map((step, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Form */}
            <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-6">
              {submitted ? (
                <div className="flex flex-col items-center justify-center text-center py-10 gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">Thank you for contacting Cloudberry.</h3>
                  <p className="text-muted-foreground max-w-sm">
                    Your form has been submitted successfully. Our team will review your query and get in touch with you shortly to assist you further.
                  </p>
                  <p className="text-sm font-medium text-primary mt-2">Happy sustainable and metabolic living.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <h2 className="text-xl font-bold text-foreground mb-1">Send us a message</h2>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-foreground">Full Name <span className="text-destructive">*</span></label>
                    <Input
                      required
                      placeholder="Your name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-foreground">Email <span className="text-destructive">*</span></label>
                    <Input
                      required
                      type="email"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-foreground">Phone / WhatsApp</label>
                    <Input
                      type="tel"
                      placeholder="+91 00000 00000"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-foreground">Message <span className="text-destructive">*</span></label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Tell us what you're looking for or any questions you have..."
                      className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                    />
                  </div>
                  <Button type="submit" size="lg" className="w-full rounded-full mt-2">
                    Submit Message
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">We typically respond within 24 hours.</p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
