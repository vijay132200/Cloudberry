import { Link, useLocation } from "wouter";
import { Home, ClipboardList, LifeBuoy, Settings, LogOut } from "lucide-react";
import { useEffect } from "react";

export function PatientLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("cloudberry_token");
    if (!token) {
      setLocation("/patient/signin");
    }
  }, [location, setLocation]);

  const navItems = [
    { name: "Home", href: "/patient/dashboard", icon: Home },
    { name: "Records", href: "/patient/records", icon: ClipboardList },
    { name: "Support", href: "/patient/support", icon: LifeBuoy },
    { name: "Settings", href: "/patient/settings", icon: Settings },
  ];

  const handleLogout = () => {
    localStorage.removeItem("cloudberry_token");
    setLocation("/patient/signin");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/40 via-white to-blue-50/40 pb-20 md:pb-0 font-sans flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white/80 backdrop-blur-sm border-r border-border/60 fixed h-screen top-0 left-0 z-20 shadow-sm">
        <div className="p-6 border-b border-border/60 bg-gradient-to-br from-primary/5 to-blue-100/30">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-sans text-xl font-bold tracking-tight text-foreground">Cloudberry</span>
          </Link>
          <p className="text-[11px] text-muted-foreground mt-1 leading-snug">Patient Portal</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-primary/15 to-blue-100/50 text-primary font-semibold shadow-sm border border-primary/15"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border/60">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 relative min-h-[100dvh]">
        {/* Mobile Header */}
        <header className="md:hidden bg-white/90 backdrop-blur-sm border-b border-border/60 sticky top-0 z-20 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-sans text-lg font-bold tracking-tight text-foreground">Cloudberry</span>
          </div>
          <button onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
            <LogOut className="w-5 h-5" />
          </button>
        </header>

        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-border/60 z-30 pb-safe shadow-lg">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center w-16 py-2 gap-1 rounded-lg ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <div className={`${isActive ? "bg-primary/10" : "bg-transparent"} p-1 rounded-full transition-colors`}>
                  <item.icon className={`w-5 h-5 ${isActive ? "fill-primary/20" : ""}`} />
                </div>
                <span className="text-[10px] font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
