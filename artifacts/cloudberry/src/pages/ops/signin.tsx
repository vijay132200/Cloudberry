import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useOpsSignin } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { ShieldCheck } from "lucide-react";

const formSchema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(6, "Password is required"),
});

export default function OpsSignin() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const signin = useOpsSignin();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" }
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    signin.mutate({ data: values }, {
      onSuccess: (res) => {
        if (res.token) localStorage.setItem("cloudberry_token", res.token);
        setLocation("/ops/dashboard");
        toast({ title: "Welcome, Operations.", description: "Signed in successfully.", duration: 3000 });
      },
      onError: () => {
        toast({ title: "Invalid credentials", description: "Check your email and password.", variant: "destructive", duration: 3000 });
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/60 via-white to-blue-50/60 flex flex-col md:flex-row">
      {/* Left panel — branding */}
      <div className="hidden md:flex w-5/12 lg:w-1/2 relative flex-col border-r border-border/40 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1551601651-2a8555f1a136?auto=format&fit=crop&w=900&q=80"
            alt="Operations team"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/85 via-primary/60 to-blue-900/70" />
        </div>

        <div className="relative z-10 p-12 lg:p-16 flex flex-col h-full">
          <Link href="/" className="inline-block mb-10">
            <span className="font-sans text-2xl font-bold tracking-tight text-white">Cloudberry</span>
          </Link>

          <div className="flex-grow flex flex-col justify-center">
            <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center mb-6">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4 leading-tight">
              Operations Command Center
            </h1>
            <p className="text-white/75 text-base mb-10 leading-relaxed">
              Monitor patient adherence, manage the care team, escalate at-risk patients, and track program outcomes in real time.
            </p>

            <div className="space-y-4">
              {[
                { title: "Real-Time Adherence Monitoring", desc: "Track every patient's daily check-in completion and flag gaps instantly." },
                { title: "Clinical Escalation Tools", desc: "Escalate high-risk patients to the care team with one click." },
                { title: "Coach Performance Dashboard", desc: "Monitor team adherence metrics and patient load distribution." },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                  <div>
                    <p className="text-white font-semibold text-sm">{item.title}</p>
                    <p className="text-white/60 text-xs mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="w-full md:w-7/12 lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 md:hidden">
            <Link href="/" className="inline-block mb-3">
              <span className="font-sans text-2xl font-bold tracking-tight text-foreground">Cloudberry</span>
            </Link>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground">Operations Sign In</h2>
            <p className="text-muted-foreground mt-1 text-sm">Authorized personnel only</p>
          </div>

          <Card className="border-border/60 shadow-lg bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-primary via-primary/70 to-blue-400" />
            <CardContent className="pt-7 pb-8 px-7">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground font-medium">Admin Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            className="rounded-xl border-border/60 bg-white h-11"
                            placeholder="admin@cloudberry.health"
                            {...field}
                            data-testid="input-ops-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground font-medium">Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            className="rounded-xl border-border/60 bg-white h-11"
                            placeholder="••••••••"
                            {...field}
                            data-testid="input-ops-password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                    <p className="text-xs text-blue-700 font-medium">Demo credentials</p>
                    <p className="text-xs text-blue-600 mt-0.5">Email: ops@cloudberry.health (any password)</p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full mt-2 rounded-full h-12 text-base bg-primary hover:bg-primary/90 shadow-sm"
                    disabled={signin.isPending}
                    data-testid="btn-ops-submit"
                  >
                    {signin.isPending ? "Authenticating..." : "Enter Command Center"}
                  </Button>
                </form>
              </Form>

              <p className="text-xs text-muted-foreground text-center mt-5">
                Access restricted to Cloudberry operations team.{" "}
                <Link href="/" className="text-primary hover:underline">Return to homepage</Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
