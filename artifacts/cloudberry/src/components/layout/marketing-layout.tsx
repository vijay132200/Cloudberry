import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowRight, UserRound, Stethoscope, LayoutDashboard } from "lucide-react";

export function MarketingLayout({ children }: { children: React.ReactNode }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
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
    { name: "Programs & Pricing", href: "/#pricing" },
    { name: "FAQs", href: "/#faqs" },
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
              <span className="text-[10px] text-muted-foreground leading-tight mt-0.5 font-normal">Doctor-Led Care for Long-Term Metabolic Health</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-5">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm font-medium transition-colors text-foreground/80 hover:text-primary"
              >
                {link.name}
              </a>
            ))}
            <Link href="/patient/signup">
              <Button variant="outline" className="rounded-full shadow-sm border-primary/40 text-primary hover:bg-primary hover:text-white">
                Get Started
              </Button>
            </Link>
            <Button
              onClick={() => setLoginOpen(true)}
              className="rounded-full shadow-sm"
            >
              Login
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

      {/* Mobile Nav */}
      <div
        className={`fixed inset-0 z-[9998] flex flex-col pt-24 px-6 transition-transform duration-300 ease-in-out lg:hidden ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ backgroundColor: "#ffffff" }}
      >
        <nav className="flex flex-col gap-6 text-lg">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="font-medium border-b pb-3 border-border/40 text-foreground"
            >
              {link.name}
            </a>
          ))}
          <Link href="/patient/signup" onClick={() => setMobileMenuOpen(false)}>
            <Button size="lg" className="mt-2 rounded-full w-full">
              Get Started
            </Button>
          </Link>
          <Button
            size="lg"
            variant="outline"
            className="rounded-full border-primary/40 text-primary"
            onClick={() => { setMobileMenuOpen(false); setLoginOpen(true); }}
          >
            Login
          </Button>
        </nav>
      </div>

      <main className="flex-grow flex flex-col w-full overflow-x-hidden pt-20">
        {children}
      </main>

      <footer className="bg-foreground text-background py-12 md:py-16 mt-auto">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-8 lg:gap-12 items-start border-b border-white/10 pb-10">
            <div className="flex flex-col gap-4">
              <Link href="/" className="flex items-center gap-2">
                <span className="font-sans text-xl font-bold tracking-tight leading-none text-background">Cloudberry</span>
              </Link>
              <p className="text-white/60 text-sm max-w-xs">
                Doctor-led metabolic care for sustainable health improvement.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="flex flex-col gap-3">
                <h4 className="font-semibold text-white/90">Platform</h4>
                <a href="/#pricing" className="text-white/60 hover:text-white text-sm transition-colors">Programs & Pricing</a>
                <a href="/#faqs" className="text-white/60 hover:text-white text-sm transition-colors">FAQs</a>
                <div className="flex flex-col gap-2 mt-1">
                  <Link href="/patient/signin" className="inline-flex items-center gap-1.5 bg-primary/80 hover:bg-primary text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors w-fit">Patient Portal →</Link>
                  <Link href="/physician/signin" className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors w-fit">Physician's Portal →</Link>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <h4 className="font-semibold text-white/90">Legal</h4>
                <Link href="/refund-policy" className="text-white/60 hover:text-white text-sm transition-colors">Refund Policy</Link>
                <Link href="/privacy-policy" className="text-white/60 hover:text-white text-sm transition-colors">Privacy Policy</Link>
                <Link href="/terms" className="text-white/60 hover:text-white text-sm transition-colors">Terms & Conditions</Link>
              </div>
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

      {/* Login Modal */}
      <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">Sign in to Cloudberry</DialogTitle>
            <p className="text-center text-sm text-muted-foreground mt-1">Choose your portal to continue</p>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            <Link href="/patient/signin" onClick={() => setLoginOpen(false)}>
              <div className="border rounded-2xl p-5 hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <UserRound className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-base">Patient Portal</span>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">Access your health dashboard, check-ins & progress</p>
                  </div>
                </div>
              </div>
            </Link>
            <Link href="/physician/signin" onClick={() => setLoginOpen(false)}>
              <div className="border rounded-2xl p-5 hover:border-sky-400 hover:bg-sky-50/60 transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center shrink-0">
                    <Stethoscope className="w-5 h-5 text-sky-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-base">Physician's Portal</span>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-sky-600 transition-colors" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">Physicians, dieticians & caretakers — manage patients & care plans</p>
                  </div>
                </div>
              </div>
            </Link>
            <Link href="/ops/signin" onClick={() => setLoginOpen(false)}>
              <div className="border rounded-2xl p-5 hover:border-slate-400 hover:bg-slate-50 transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <LayoutDashboard className="w-5 h-5 text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-base text-slate-700">Operations Portal</span>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-slate-700 transition-colors" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">Admin & operations command centre</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </DialogContent>
      </Dialog>

      {/* Floating Mobile CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent z-40 lg:hidden">
        <Link href="/patient/signup">
          <Button size="lg" className="w-full rounded-full shadow-lg text-md py-6">
            Get Started →
          </Button>
        </Link>
      </div>
    </div>
  );
}
