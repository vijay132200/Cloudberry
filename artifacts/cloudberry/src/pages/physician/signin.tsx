import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { Stethoscope, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const API = `${BASE}/api`;

export default function StaffSignin() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError("Email is required"); return; }
    if (!password) { setError("Password is required"); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/coach/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid credentials. Please try again.");
        return;
      }
      if (data.token) {
        localStorage.setItem("cloudberry_token", data.token);
        if (data.fullName) localStorage.setItem("cloudberry_name", data.fullName);
        if (data.role) localStorage.setItem("cloudberry_role", data.role);
        if (data.specialty) localStorage.setItem("cloudberry_specialty", data.specialty);
      }
      toast({ title: `Welcome, ${data.fullName || "Team Member"}!`, duration: 2000 });
      const role = data.role;
      if (role === "physician") setLocation("/physician/dashboard");
      else if (role === "dietician") setLocation("/dietician/dashboard");
      else if (role === "caretaker") setLocation("/caretaker/dashboard");
      else if (role === "ops") setLocation("/ops/dashboard");
      else setLocation("/coach/patients");
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50/60 via-white to-blue-50/60 flex flex-col md:flex-row">
      {/* Left branding */}
      <div className="hidden md:flex w-5/12 lg:w-1/2 relative flex-col border-r border-border/40 overflow-hidden bg-gradient-to-br from-sky-900 via-blue-800 to-slate-900 text-white">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 40% 60%, #38bdf8 0%, transparent 60%)" }} />
        <div className="relative z-10 flex flex-col justify-center h-full px-12 py-16">
          <Link href="/" className="mb-10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/20">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <span className="font-bold text-2xl tracking-tight text-white/90">Cloudberry</span>
            </div>
          </Link>
          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mb-6">
            <Stethoscope className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Care Team Portal</h1>
          <p className="text-white/70 text-base leading-relaxed mb-8">
            Access your patient roster, health dashboards, care plans, and appointment management in one place.
          </p>
          <div className="space-y-3 mb-8">
            {["Patient health analytics & daily check-ins", "Clinical notes & escalation management", "Appointment & call scheduling", "Messaging with patients and team"].map(f => (
              <div key={f} className="flex items-center gap-3 text-white/80 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />{f}
              </div>
            ))}
          </div>
          {/* Demo credentials on left panel */}
          <div className="bg-white/8 border border-white/15 rounded-xl p-4 space-y-1.5">
            <p className="text-xs text-sky-300 font-semibold uppercase tracking-wide">Demo Credentials — all roles use: demo123</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {[
                ["Physician 1", "dr.mehta@cloudberry.health"],
                ["Physician 2", "dr.raj@cloudberry.health"],
                ["Physician 3", "dr.priya@cloudberry.health"],
                ["Dietician 1", "priya.diet@cloudberry.health"],
                ["Dietician 2", "kavya.diet@cloudberry.health"],
                ["Dietician 3", "rohan.diet@cloudberry.health"],
                ["Caretaker 1", "ranjit.care@cloudberry.health"],
                ["Caretaker 2", "sunita.care@cloudberry.health"],
                ["Caretaker 3", "mahesh.care@cloudberry.health"],
                ["Ops 1", "ops@cloudberry.health"],
                ["Ops 2", "ops2@cloudberry.health"],
              ].map(([label, mail]) => (
                <div key={label}>
                  <p className="text-[10px] text-white/50 leading-none">{label}</p>
                  <p className="text-[10px] text-white/80">{mail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right signin panel */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          <div className="md:hidden text-center mb-8">
            <Link href="/" className="inline-block mb-3">
              <span className="font-bold text-2xl tracking-tight text-foreground">Cloudberry</span>
            </Link>
            <p className="text-muted-foreground text-sm">Physician & Care Team Portal</p>
          </div>

          <div className="mb-7">
            <h2 className="text-2xl font-bold text-foreground">Care Team Sign In</h2>
            <p className="text-muted-foreground mt-1 text-sm">For physicians, dieticians, caretakers, and operations staff</p>
          </div>

          <Card className="border-border/60 shadow-lg bg-white rounded-2xl overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-400" />
            <CardContent className="pt-7 pb-8 px-7">
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Work Email</label>
                  <Input type="email" placeholder="you@cloudberry.health"
                    value={email} onChange={e => setEmail(e.target.value)}
                    className="rounded-xl border-border/60 bg-white h-11" autoComplete="username" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
                  <div className="relative">
                    <Input type={showPw ? "text" : "password"} placeholder="••••••••"
                      value={password} onChange={e => setPassword(e.target.value)}
                      className="rounded-xl border-border/60 bg-white h-11 pr-10" autoComplete="current-password" />
                    <button type="button" onClick={() => setShowPw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && <p className="text-sm text-destructive bg-destructive/8 rounded-lg px-3 py-2">{error}</p>}

                {/* Mobile demo hint */}
                <div className="md:hidden bg-sky-50 border border-sky-100 rounded-xl px-4 py-3 space-y-1">
                  <p className="text-xs text-sky-700 font-semibold">Demo credentials (password: demo123)</p>
                  <p className="text-xs text-sky-600">Physician: dr.mehta@cloudberry.health</p>
                  <p className="text-xs text-sky-600">Dietician: priya.diet@cloudberry.health</p>
                  <p className="text-xs text-sky-600">Caretaker: ranjit.care@cloudberry.health</p>
                  <p className="text-xs text-sky-600">Ops: ops@cloudberry.health</p>
                </div>

                <Button type="submit" className="w-full rounded-full h-12 text-base bg-sky-600 hover:bg-sky-700 shadow-sm" disabled={loading}>
                  {loading ? "Signing in…" : "Access Portal"}
                </Button>
              </form>

              <p className="text-xs text-muted-foreground text-center mt-5">
                Are you a patient?{" "}
                <Link href="/patient/signin" className="text-primary hover:underline font-medium">Patient portal →</Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
