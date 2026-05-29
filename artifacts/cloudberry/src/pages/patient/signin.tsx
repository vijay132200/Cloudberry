import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const API = `${BASE}/api`;

export default function PatientSignin() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ phone?: string; password?: string }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!phone.trim()) e.phone = "Phone number or email required";
    if (!password) e.password = "Password required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/patient/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), password }),
      });
      const data = await res.json();
      if (data.status === "pending_approval") {
        toast({
          title: "Account pending approval",
          description: "Your account is under review. Our team will activate it shortly and reach out to you.",
          duration: 7000,
        });
        return;
      }
      if (!res.ok) {
        toast({ title: "Unable to sign in", description: data.error || "Check your credentials and try again.", variant: "destructive" });
        return;
      }
      if (data.token) {
        localStorage.setItem("cloudberry_token", data.token);
        if (data.plan) localStorage.setItem("cloudberry_plan", data.plan);
        if (data.fullName) localStorage.setItem("cloudberry_name", data.fullName);
        localStorage.removeItem("cloudberry_assessment_done");
      }
      toast({ title: `Welcome back!`, description: "Signed in to your portal.", duration: 2000 });
      setLocation("/patient/dashboard");
    } catch {
      toast({ title: "Connection error", description: "Could not reach the server. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/60 via-white to-blue-50/60 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-5 shrink-0">
        <Link href="/" className="flex flex-col">
          <span className="font-bold text-lg tracking-tight text-foreground leading-none">Cloudberry</span>
          <span className="text-[10px] text-muted-foreground leading-tight mt-0.5 font-normal">Doctor-Led Care for Long-Term Metabolic Health</span>
        </Link>
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
      </div>

      {/* Centered form area */}
      <div className="flex-1 flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">Welcome Back</h1>
          <p className="text-muted-foreground mt-1 text-sm">Sign in to your Patient's Portal</p>
        </div>

        <Card className="border-border/60 shadow-lg bg-white rounded-2xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-primary via-primary/70 to-blue-400" />
          <CardContent className="pt-7 pb-2 px-6">
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Phone Number or Email</label>
                <Input
                  type="text"
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="rounded-xl border-border/60 bg-white h-11"
                  autoComplete="username"
                />
                {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
                <div className="relative">
                  <Input
                    type={showPw ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="rounded-xl border-border/60 bg-white h-11 pr-10"
                    autoComplete="current-password"
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-destructive mt-1">{errors.password}</p>}
              </div>

              <Button type="submit" className="w-full rounded-full h-12 text-base shadow-sm" disabled={loading}>
                {loading ? "Signing in…" : "Sign In"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-border/40 py-5 px-6 bg-gradient-to-br from-amber-50/40 to-blue-50/40">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/patient/signup" className="text-primary hover:underline font-semibold">Start your journey</Link>
            </p>
          </CardFooter>
        </Card>
        <p className="text-center text-xs text-muted-foreground mt-4">
          Doctor?{" "}
          <Link href="/physician/signin" className="text-primary hover:underline">Access Doctor's Portal →</Link>
        </p>
      </div>
      </div>
    </div>
  );
}
