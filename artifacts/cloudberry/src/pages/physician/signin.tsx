import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useState } from "react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const API = `${BASE}/api`;

export default function PhysicianSignin() {
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
      toast({ title: `Welcome, Dr. ${data.fullName || ""}!`, duration: 2000 });
      const role = data.role;
      if (role === "physician") setLocation("/physician/dashboard");
      else if (role === "dietician") setLocation("/dietician/dashboard");
      else if (role === "caretaker") setLocation("/caretaker/dashboard");
      else if (role === "ops") setLocation("/ops/dashboard");
      else if (role === "coach") setLocation("/coach/patients");
      else setLocation("/physician/dashboard");
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/40 via-white to-amber-50/30 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-3">
          <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-5">
            <span className="font-bold text-2xl tracking-tight text-foreground">Cloudberry</span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Doctor Sign In</h1>
          <p className="text-muted-foreground mt-1 text-sm">For registered Cloudberry physicians</p>
        </div>

        <Card className="border-border/60 shadow-lg bg-white rounded-2xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-primary via-primary/70 to-blue-400" />
          <CardContent className="pt-7 pb-8 px-7">
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Email or Phone</label>
                <Input
                  type="text"
                  placeholder="Email address or phone number"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="rounded-xl border-border/60 bg-white h-11"
                  autoComplete="username"
                />
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
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && <p className="text-sm text-destructive bg-destructive/8 rounded-lg px-3 py-2">{error}</p>}

              <Button
                type="submit"
                className="w-full rounded-full h-12 text-base shadow-sm"
                disabled={loading}
              >
                {loading ? "Signing in…" : "Sign In"}
              </Button>
            </form>

            <p className="text-xs text-muted-foreground text-center mt-5">
              New doctor?{" "}
              <Link href="/physician/signup" className="text-primary hover:underline font-medium">Connect with us →</Link>
            </p>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Are you a patient?{" "}
              <Link href="/patient/signin" className="text-primary hover:underline font-medium">Patient's Portal →</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
