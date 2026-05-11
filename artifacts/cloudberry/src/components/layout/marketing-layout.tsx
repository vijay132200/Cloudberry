import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

export function MarketingLayout({ children }: { children: React.ReactNode }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Programs & Pricing", href: "/#pricing" },
    { name: "Patient Portal", href: "/patient/signin" },
    { name: "Physician Portal", href: "/physician" },
    { name: "Blogs", href: "/blogs" },
    { name: "FAQs", href: "/faqs" },
    { name: "About Us", href: "/about" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <header
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          isScrolled ? "bg-white/90 backdrop-blur-md border-b shadow-sm py-3" : "bg-transparent py-5"
        }`}
      >
        <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 z-50">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-serif text-xl italic font-bold">C</div>
            <div className="flex flex-col">
              <span className="font-serif text-2xl tracking-tight leading-none text-foreground font-bold">Cloudberry</span>
              <span className="text-[10px] text-muted-foreground hidden md:block leading-tight mt-0.5">Doctor-Led Metabolic Care</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                href={link.href}
                className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
              >
                {link.name}
              </Link>
            ))}
            <Button asChild className="rounded-full shadow-sm" data-testid="btn-nav-get-started">
              <Link href="/patient/signup">Get Started</Link>
            </Button>
          </nav>

          {/* Mobile Menu Toggle */}
          <button 
            className="lg:hidden z-50 p-2 -mr-2 text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Mobile Nav */}
          <div className={`fixed inset-0 bg-background z-40 flex flex-col pt-24 px-6 transition-transform duration-300 ease-in-out lg:hidden ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <nav className="flex flex-col gap-6 text-lg">
              {navLinks.map((link) => (
                <Link 
                  key={link.name} 
                  href={link.href}
                  className="font-medium text-foreground border-b pb-2"
                >
                  {link.name}
                </Link>
              ))}
              <Button asChild size="lg" className="mt-4 rounded-full" data-testid="btn-mobile-nav-get-started">
                <Link href="/patient/signup">Get Started Today</Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-grow flex flex-col w-full overflow-x-hidden pt-20">
        {children}
      </main>

      <footer className="bg-foreground text-background py-12 md:py-16 mt-auto">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 lg:gap-12 items-start border-b border-white/10 pb-10">
            <div className="flex flex-col gap-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center text-foreground font-serif text-xl italic font-bold">C</div>
                <span className="font-serif text-2xl tracking-tight leading-none text-background font-bold">Cloudberry</span>
              </Link>
              <p className="text-white/60 text-sm max-w-xs">
                Personalized, doctor-led metabolic care. Sustainable weight and diabetes management.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-8 md:col-span-2 lg:col-span-1 justify-between md:justify-around">
              <div className="flex flex-col gap-3">
                <h4 className="font-semibold text-white/90">Platform</h4>
                <Link href="/about" className="text-white/60 hover:text-white text-sm transition-colors">About Us</Link>
                <Link href="/#pricing" className="text-white/60 hover:text-white text-sm transition-colors">Programs</Link>
                <Link href="/physician" className="text-white/60 hover:text-white text-sm transition-colors">For Physicians</Link>
                <Link href="/faqs" className="text-white/60 hover:text-white text-sm transition-colors">FAQs</Link>
              </div>
              <div className="flex flex-col gap-3">
                <h4 className="font-semibold text-white/90">Legal</h4>
                <Link href="#" className="text-white/60 hover:text-white text-sm transition-colors">Privacy Policy</Link>
                <Link href="#" className="text-white/60 hover:text-white text-sm transition-colors">Terms of Service</Link>
                <Link href="#" className="text-white/60 hover:text-white text-sm transition-colors">Refund Policy</Link>
                <Link href="#" className="text-white/60 hover:text-white text-sm transition-colors">Contact Us</Link>
              </div>
            </div>

            <div className="flex flex-col gap-4 lg:items-end">
              <h4 className="font-semibold text-white/90">Connect</h4>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary transition-colors text-white">IN</a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary transition-colors text-white">LI</a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary transition-colors text-white">FB</a>
              </div>
            </div>
          </div>
          
          <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/40">
            <p className="max-w-2xl text-center md:text-left">
              Cloudberry is a digital health platform providing evidence-based obesity and metabolic care. 
              All medical decisions are made by licensed doctors. This service is not a substitute for emergency medical care.
            </p>
            <p className="shrink-0">© Cloudberry Health 2026. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Floating CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent z-40 lg:hidden">
        <Button asChild size="lg" className="w-full rounded-full shadow-lg text-md py-6">
          <Link href="/patient/signup">Start Your Journey →</Link>
        </Button>
      </div>
    </div>
  );
}
