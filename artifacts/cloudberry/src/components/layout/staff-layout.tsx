import { Link, useLocation } from "wouter";
import { Users, LayoutDashboard, LogOut, BarChart3, Settings, ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";

export function StaffLayout({ children, type }: { children: React.ReactNode, type: "coach" | "ops" }) {
  const [location, setLocation] = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("cloudberry_token");
    if (!token) {
      setLocation(`/${type}/signin`);
    }
  }, [location, setLocation, type]);

  const handleLogout = () => {
    localStorage.removeItem("cloudberry_token");
    localStorage.removeItem("cloudberry_role");
    localStorage.removeItem("cloudberry_name");
    setLocation(`/${type}/signin`);
  };

  const navItems = type === "coach"
    ? [{ name: "My Patients", href: "/coach/patients", icon: Users }]
    : [
        { name: "Command Center", href: "/ops/dashboard", icon: LayoutDashboard },
        { name: "Analytics", href: "/ops/analytics", icon: BarChart3 },
        { name: "Settings", href: "/ops/settings", icon: Settings },
      ];

  return (
    <div className="min-h-screen flex flex-col font-sans bg-gradient-to-br from-amber-50/40 via-white to-blue-50/40">
      <header className="border-b sticky top-0 z-20 px-4 py-3 flex items-center justify-between bg-white/90 backdrop-blur-sm border-border/60 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-sans text-xl font-bold tracking-tight text-foreground">
              Cloudberry
            </span>
          </Link>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">
            {type === "ops" ? "Operations" : "Coach Portal"}
          </Badge>
        </div>

        <div className="flex items-center gap-6">
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
