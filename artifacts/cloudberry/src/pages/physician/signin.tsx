import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCoachSignin } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { Stethoscope, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

const formSchema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(6, "Password required"),
});

export default function PhysicianSignin() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const signin = useCoachSignin();
  const [showPw, setShowPw] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    signin.mutate({ data: values }, {
      onSuccess: (res: any) => {
        if (res.token) localStorage.setItem("cloudberry_token", res.token);
        if (res.fullName) localStorage.setItem("cloudberry_name", res.fullName);
        if (res.role) localStorage.setItem("cloudberry_role", res.role);
        setLocation("/coach/patients");
        toast({ title: `Welcome, ${res.fullName || "Doctor"}`, description: "Signed in to Physician Portal.", duration: 3000 });
      },
      onError: () => {
        toast({ title: "Invalid credentials", description: "Check your email and password.", variant: "destructive", duration: 3000 });
      },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50/60 via-white to-blue-50/60 flex flex-col md:flex-row">
      {/* Left branding panel */}
      <div className="hidden md:flex w-5/12 lg:w-1/2 relative flex-col border-r border-border/40 overflow-hidden bg-gradient-to-br from-sky-900 via-blue-800 to-slate-900 text-white">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 40% 60%, #38bdf8 0%, transparent 60%)" }} />
        <div className="relative z-10 flex flex-col justify-center h-full px-12 py-16">
          <Link href="/" className="mb-10">
            <span className="font-sans text-2xl font-bold tracking-tight text-white/90">Cloudberry</span>
          </Link>
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center mb-6">
            <Stethoscope className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Physician Portal</h1>
          <p className="text-white/70 text-base leading-relaxed mb-8">
            Access your patient roster, clinical dashboards, care plans, and appointment management all in one place.
          </p>
          <div className="space-y-3">
            {["Patient health analytics", "Clinical notes & care plans", "Appointment scheduling", "Risk monitoring & alerts"].map(f => (
              <div key={f} className="flex items-center gap-3 text-white/80 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
                {f}
              </div>
            ))}
          </div>
          <div className="mt-10 pt-10 border-t border-white/10 text-xs text-white/40">
            Physician & care team login. Not a patient?{" "}
            <Link href="/patient/signin" className="text-sky-400 hover:text-sky-300 underline">Patient portal →</Link>
          </div>
        </div>
      </div>

      {/* Right signin panel */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          <div className="md:hidden text-center mb-8">
            <Link href="/" className="inline-block mb-3">
              <span className="font-sans text-2xl font-bold tracking-tight text-foreground">Cloudberry</span>
            </Link>
            <p className="text-muted-foreground text-sm">Physician & Care Team Portal</p>
          </div>

          <div className="mb-7">
            <h2 className="text-2xl font-bold text-foreground">Sign In</h2>
            <p className="text-muted-foreground mt-1 text-sm">For physicians, dieticians, and caretakers</p>
          </div>

          <Card className="border-border/60 shadow-lg bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-400" />
            <CardContent className="pt-7 pb-8 px-7">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground font-medium">Work Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="physician@cloudberry.health"
                          className="rounded-xl border-border/60 bg-white h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="password" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground font-medium">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input type={showPw ? "text" : "password"} placeholder="••••••••"
                            className="rounded-xl border-border/60 bg-white h-11 pr-10" {...field} />
                          <button type="button" onClick={() => setShowPw(v => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="bg-sky-50 border border-sky-200 rounded-xl px-4 py-3 space-y-1">
                    <p className="text-xs text-sky-700 font-semibold">Demo credentials (all roles)</p>
                    <p className="text-xs text-sky-600">Physician: physician@cloudberry.health</p>
                    <p className="text-xs text-sky-600">Dietician: dietician@cloudberry.health</p>
                    <p className="text-xs text-sky-600">Caretaker: caretaker@cloudberry.health</p>
                    <p className="text-xs text-sky-500">Password: demo123</p>
                  </div>

                  <Button type="submit" className="w-full mt-2 rounded-full h-12 text-base bg-sky-600 hover:bg-sky-700 shadow-sm"
                    disabled={signin.isPending}>
                    {signin.isPending ? "Signing in..." : "Access Portal"}
                  </Button>
                </form>
              </Form>

              <p className="text-xs text-muted-foreground text-center mt-5">
                Want to join as a physician?{" "}
                <Link href="/physician/signup" className="text-primary hover:underline font-medium">Partner with us</Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
