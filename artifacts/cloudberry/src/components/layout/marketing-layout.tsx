import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowRight } from "lucide-react";

export function MarketingLayout({ children }: { children: React.ReactNode }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [getStartedOpen, setGetStartedOpen] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    setMobileMenuOpen(false);
  }, [location]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Programs & Pricing", href: "/programs" },
    { name: "Patient Portal", href: "/patient/signin" },
    { name: "Physician Portal", href: "/physician" },
    { name: "Operations Portal", href: "/ops/signin" },
    { name: "Blogs", href: "/blogs" },
    { name: "FAQs", href: "/faqs" },
    { name: "About Us", href: "/about" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <header
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          isScrolled ? "bg-white/95 backdrop-blur-md border-b shadow-sm py-3" : "bg-transparent py-5"
        }`}
      >
        <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 z-50 relative">
            <div className="flex flex-col">
              <span className="font-sans text-xl font-bold tracking-tight leading-none text-foreground">Cloudberry</span>
              <span className="text-[10px] text-muted-foreground hidden md:block leading-tight mt-0.5 font-normal">Doctor-Led Care for Long-Term Metabolic Health</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-5">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  link.name === "Operations Portal"
                    ? "text-slate-500 hover:text-slate-800"
                    : "text-foreground/80 hover:text-primary"
                }`}
              >
                {link.name}
              </Link>
            ))}
            <Button onClick={() => setGetStartedOpen(true)} className="rounded-full shadow-sm" data-testid="btn-nav-get-started">
              Get Started
            </Button>
          </nav>

          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden relative z-[9999] p-2 -mr-2 text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Nav — rendered outside header to avoid stacking context issues */}
      <div
        className={`fixed inset-0 z-[9998] flex flex-col pt-24 px-6 transition-transform duration-300 ease-in-out lg:hidden ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ backgroundColor: "#ffffff" }}
      >
        <nav className="flex flex-col gap-6 text-lg">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`font-medium border-b pb-3 border-border/40 ${link.name === "Operations Portal" ? "text-slate-500" : "text-foreground"}`}
            >
              {link.name}
            </Link>
          ))}
          <Button size="lg" className="mt-4 rounded-full" onClick={() => { setMobileMenuOpen(false); setGetStartedOpen(true); }} data-testid="btn-mobile-nav-get-started">
            Get Started
          </Button>
        </nav>
      </div>

      <main className="flex-grow flex flex-col w-full overflow-x-hidden pt-20">
        {children}
      </main>

      <footer className="bg-foreground text-background py-12 md:py-16 mt-auto">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 lg:gap-12 items-start border-b border-white/10 pb-10">
            <div className="flex flex-col gap-4">
              <Link href="/" className="flex items-center gap-2">
                <span className="font-sans text-xl font-bold tracking-tight leading-none text-background">Cloudberry</span>
              </Link>
              <p className="text-white/60 text-sm max-w-xs">
                Doctor-led metabolic care for sustainable health improvement.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-8 md:col-span-2 lg:col-span-1 justify-between md:justify-around">
              <div className="flex flex-col gap-3">
                <h4 className="font-semibold text-white/90">Platform</h4>
                <Link href="/about" className="text-white/60 hover:text-white text-sm transition-colors">About Us</Link>
                <Link href="/programs" className="text-white/60 hover:text-white text-sm transition-colors">Programs</Link>
                <Link href="/faqs" className="text-white/60 hover:text-white text-sm transition-colors">FAQs</Link>
                <Link href="/physician" className="text-white/60 hover:text-white text-sm transition-colors">For Physicians</Link>
                <Link href="/ops/signin" className="text-white/60 hover:text-white text-sm transition-colors">Operations Portal</Link>
              </div>
              <div className="flex flex-col gap-3">
                <h4 className="font-semibold text-white/90">Legal</h4>
                <Link href="#" className="text-white/60 hover:text-white text-sm transition-colors">Refund Policy</Link>
                <Link href="#" className="text-white/60 hover:text-white text-sm transition-colors">Privacy Policy</Link>
                <Link href="#" className="text-white/60 hover:text-white text-sm transition-colors">Contact</Link>
              </div>
            </div>

            <div className="flex flex-col gap-4 lg:items-end">
              <h4 className="font-semibold text-white/90">Connect</h4>
              <p className="text-white/40 text-xs">Social links coming soon.</p>
            </div>
          </div>

          <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/40">
            <p className="max-w-2xl text-center md:text-left">
              Cloudberry is a digital health platform providing doctor-led metabolic care. All medical decisions are made by licensed physicians. This service is not a substitute for emergency medical care.
            </p>
            <p className="shrink-0">© Cloudberry Health 2026. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Get Started Dialog */}
      <Dialog open={getStartedOpen} onOpenChange={setGetStartedOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">How can we help you?</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-4">
            <Link href="/patient/signup" onClick={() => setGetStartedOpen(false)}>
              <div className="border rounded-2xl p-6 hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-lg">I'm a Patient</span>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <p className="text-sm text-muted-foreground">Start Your Journey → Book a free consultation with the Cloudberry team.</p>
              </div>
            </Link>
            <Link href="/physician/signup" onClick={() => setGetStartedOpen(false)}>
              <div className="border rounded-2xl p-6 hover:border-secondary hover:bg-secondary/5 transition-all cursor-pointer group">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-lg">I'm a Physician</span>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-secondary transition-colors" />
                </div>
                <p className="text-sm text-muted-foreground">Explore Partnership → Learn how Cloudberry supports long-term patient adherence.</p>
              </div>
            </Link>
            <Link href="/ops/signin" onClick={() => setGetStartedOpen(false)}>
              <div className="border rounded-2xl p-6 hover:border-slate-400 hover:bg-slate-50 transition-all cursor-pointer group">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-lg text-slate-700">Operations Portal</span>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-slate-700 transition-colors" />
                </div>
                <p className="text-sm text-muted-foreground">Staff login → Access the operations command center.</p>
              </div>
            </Link>
          </div>
        </DialogContent>
      </Dialog>

      {/* Floating Mobile CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent z-40 lg:hidden">
        <Button size="lg" className="w-full rounded-full shadow-lg text-md py-6" onClick={() => setGetStartedOpen(true)}>
          Get Started →
        </Button>
      </div>
    </div>
  );
}
