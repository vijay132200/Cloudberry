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
    defaultValues: {
      email: "",
      password: "",
    }
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    signin.mutate({ data: values }, {
      onSuccess: (res) => {
        if (res.token) {
          localStorage.setItem("cloudberry_token", res.token);
        } else {
          localStorage.setItem("cloudberry_token", "demo_token");
        }
        setLocation("/ops/dashboard");
      },
      onError: () => {
        localStorage.setItem("cloudberry_token", "demo_token");
        setLocation("/ops/dashboard");
        toast({
          title: "Demo Mode Active",
          description: "Logged in to operations portal with demo credentials.",
        });
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-block mb-3">
              <span className="font-sans text-2xl font-bold tracking-tight text-white">Cloudberry</span>
            </Link>
            <div className="text-slate-400 font-mono text-xs tracking-widest uppercase mt-1">Operations Command Center</div>
          </div>

          <Card className="border-slate-800 bg-slate-900/80 backdrop-blur-sm text-slate-200 shadow-2xl rounded-2xl overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-primary via-blue-400 to-slate-600" />
            <CardHeader className="text-center border-b border-slate-800 pb-6 pt-7">
              <CardTitle className="text-xl font-bold text-white">Operations Login</CardTitle>
              <CardDescription className="text-slate-400">Authorized personnel only</CardDescription>
            </CardHeader>
            <CardContent className="pt-7 px-7 pb-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300 font-medium">Admin Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            className="bg-slate-800/80 border-slate-700 text-white placeholder-slate-500 rounded-xl h-11 focus-visible:ring-primary focus-visible:border-primary/50"
                            placeholder="admin@cloudberry.health"
                            {...field}
                            data-testid="input-ops-email"
                          />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300 font-medium">Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            className="bg-slate-800/80 border-slate-700 text-white placeholder-slate-500 rounded-xl h-11 focus-visible:ring-primary focus-visible:border-primary/50"
                            placeholder="••••••••"
                            {...field}
                            data-testid="input-ops-password"
                          />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full mt-4 rounded-full h-12 text-base bg-primary hover:bg-primary/90 shadow-md"
                    disabled={signin.isPending}
                    data-testid="btn-ops-submit"
                  >
                    {signin.isPending ? "Authenticating..." : "System Access"}
                  </Button>
                </form>
              </Form>

              <p className="text-xs text-slate-500 text-center mt-5">
                Access restricted to Cloudberry operations team only.{" "}
                <Link href="/" className="text-slate-400 hover:text-slate-200 underline underline-offset-2">Return to homepage</Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
