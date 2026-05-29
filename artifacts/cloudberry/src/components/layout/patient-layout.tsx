import { Link, useLocation } from "wouter";
import { LayoutDashboard, ClipboardCheck, LogOut, User, FileText } from "lucide-react";
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
    { name: "Dashboard", href: "/patient/dashboard", icon: LayoutDashboard },
    { name: "Daily Check-in", href: "/patient/checkin", icon: ClipboardCheck },
    { name: "Health Records", href: "/patient/records", icon: FileText },
    { name: "My Profile", href: "/patient/settings", icon: User },
  ];

  const handleLogout = () => {
    localStorage.removeItem("cloudberry_token");
    localStorage.removeItem("cloudberry_name");
    localStorage.removeItem("cloudberry_plan");
    setLocation("/patient/signin");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-slate-50/40 pb-20 md:pb-0 font-sans flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-48 bg-white border-r border-border/60 fixed h-screen top-0 left-0 z-20 shadow-sm">
        <div className="px-5 py-5 border-b border-border/60">
          <Link href="/">
            <span className="font-bold text-base tracking-tight text-foreground">Cloudberry</span>
          </Link>
          <span className="text-[10px] text-muted-foreground leading-tight mt-0.5 font-normal">Doctor-Led Care for Long-Term Metabolic Health</span>
          <p className="text-[10px] text-muted-foreground mt-0.5">Patient Portal</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm ${
                  isActive
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                }`}
              >
                <item.icon className={`w-4 h-4 shrink-0 ${isActive ? "text-primary" : ""}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="px-3 py-4 border-t border-border/60">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm text-muted-foreground hover:bg-destructive/8 hover:text-destructive transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-48 relative min-h-[100dvh]">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-border/60 sticky top-0 z-20 px-4 py-3 flex items-center justify-between">
          <div>
            <span className="font-bold text-base tracking-tight text-foreground">Cloudberry</span>
            <span className="text-[10px] text-muted-foreground leading-tight font-normal">Doctor-Led Care for Long-Term Metabolic Health</span>
          </div>
          <button onClick={handleLogout} className="text-muted-foreground hover:text-foreground p-1">
            <LogOut className="w-5 h-5" />
          </button>
        </header>

        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border/60 z-30 shadow-lg">
        <div className="flex items-center justify-around px-1 py-1.5">
          {navItems.slice(0, 5).map((item) => {
            const isActive = location.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-lg gap-0.5 min-w-[56px] ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <div className={`p-1.5 rounded-lg transition-colors ${isActive ? "bg-primary/10" : ""}`}>
                  <item.icon className="w-4 h-4" />
                </div>
                <span className="text-[9px] font-medium leading-none">{item.name.split(" ")[0]}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
