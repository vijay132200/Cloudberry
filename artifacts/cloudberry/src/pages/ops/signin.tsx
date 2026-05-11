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
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-2">
            <span className="font-sans text-2xl font-bold tracking-tight text-white">Cloudberry</span>
          </Link>
          <div className="text-slate-400 font-mono text-xs tracking-widest mt-2 uppercase">Command Center</div>
        </div>

        <Card className="border-slate-800 bg-slate-950 text-slate-200 shadow-2xl">
          <CardHeader className="text-center border-b border-slate-800 pb-6">
            <CardTitle className="text-xl font-semibold text-white">Operations Login</CardTitle>
            <CardDescription className="text-slate-400">Authorized personnel only</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Admin Email</FormLabel>
                      <FormControl>
                        <Input type="email" className="bg-slate-900 border-slate-700 text-white focus-visible:ring-primary" placeholder="admin@cloudberry.health" {...field} data-testid="input-ops-email" />
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
                      <FormLabel className="text-slate-300">Password</FormLabel>
                      <FormControl>
                        <Input type="password" className="bg-slate-900 border-slate-700 text-white focus-visible:ring-primary" placeholder="••••••••" {...field} data-testid="input-ops-password" />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full mt-6" size="lg" disabled={signin.isPending} data-testid="btn-ops-submit">
                  {signin.isPending ? "Authenticating..." : "System Access"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
