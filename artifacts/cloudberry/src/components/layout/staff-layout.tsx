import { Link, useLocation } from "wouter";
import { Users, LayoutDashboard, LogOut } from "lucide-react";
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
    setLocation(`/${type}/signin`);
  };

  const navItems = type === "coach" 
    ? [{ name: "My Patients", href: "/coach/patients", icon: Users }]
    : [{ name: "Command Center", href: "/ops/dashboard", icon: LayoutDashboard }];

  return (
    <div className={`min-h-screen ${type === 'ops' ? 'bg-slate-950 text-slate-200' : 'bg-muted/30'} flex flex-col font-sans`}>
      <header className={`border-b sticky top-0 z-20 px-4 py-3 flex items-center justify-between ${type === 'ops' ? 'bg-slate-900 border-slate-800' : 'bg-card'}`}>
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-md flex items-center justify-center font-serif text-xl italic font-bold ${type === 'ops' ? 'bg-primary text-primary-foreground' : 'bg-primary text-primary-foreground rounded-full'}`}>C</div>
            <span className={`font-serif text-xl tracking-tight font-bold ${type === 'ops' ? 'text-white' : 'text-foreground'}`}>Cloudberry</span>
          </Link>
          <Badge variant="outline" className={type === 'ops' ? 'border-slate-700 text-slate-300' : 'bg-primary/10 text-primary border-none'}>
            {type === 'ops' ? 'Operations' : 'Coach Portal'}
          </Badge>
        </div>
        
        <div className="flex items-center gap-6">
          <nav className="hidden md:flex items-center gap-4">
            {navItems.map((item) => {
              const isActive = location === item.href;
              return (
                <Link 
                  key={item.name} 
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive 
                      ? type === 'ops' ? "bg-slate-800 text-white" : "bg-primary/10 text-primary" 
                      : type === 'ops' ? "text-slate-400 hover:text-white" : "text-muted-foreground hover:text-foreground"
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
            className={`flex items-center gap-2 text-sm ${type === 'ops' ? 'text-slate-400 hover:text-white' : 'text-muted-foreground hover:text-foreground'}`}
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
