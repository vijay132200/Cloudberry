import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
    defaultValues: { email: "", password: "" }
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    signin.mutate({ data: values }, {
      onSuccess: (res: any) => {
        if (res.token) localStorage.setItem("cloudberry_token", res.token);
        if (res.role) localStorage.setItem("cloudberry_role", res.role);
        if ((res as any).fullName) localStorage.setItem("cloudberry_name", (res as any).fullName);
        setLocation("/ops/dashboard");
        toast({ title: "Welcome, Operations.", description: "Signed in successfully.", duration: 3000 });
      },
      onError: () => {
        toast({ title: "Invalid credentials", description: "Check your email and password.", variant: "destructive", duration: 3000 });
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/40 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-3">
            <span className="font-bold text-2xl tracking-tight text-foreground">Cloudberry</span>
          </Link>
          <h2 className="text-2xl font-bold text-foreground">Operations Sign In</h2>
          <p className="text-muted-foreground mt-1 text-sm">Authorized personnel only</p>
        </div>

        <Card className="border-border/60 shadow-lg bg-white rounded-2xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-primary via-primary/70 to-blue-400" />
          <CardContent className="pt-7 pb-8 px-7">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground font-medium">Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          className="rounded-xl border-border/60 bg-white h-11"
                          placeholder=""
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

                <Button
                  type="submit"
                  className="w-full mt-2 rounded-full h-12 text-base shadow-sm"
                  disabled={signin.isPending}
                  data-testid="btn-ops-submit"
                >
                  {signin.isPending ? "Authenticating..." : "Sign In"}
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
  );
}
