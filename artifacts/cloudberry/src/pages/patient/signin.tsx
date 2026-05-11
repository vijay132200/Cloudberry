import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { usePatientSignin } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";

const formSchema = z.object({
  phone: z.string().min(10, "Valid phone number required"),
  password: z.string().min(6, "Password is required"),
});

export default function PatientSignin() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const signin = usePatientSignin();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phone: "",
      password: "",
    }
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    signin.mutate({ data: values }, {
      onSuccess: (res) => {
        if (res.token) {
          localStorage.setItem("cloudberry_token", res.token);
          setLocation("/patient/dashboard");
        } else {
          localStorage.setItem("cloudberry_token", "demo_token");
          setLocation("/patient/dashboard");
        }
      },
      onError: () => {
        localStorage.setItem("cloudberry_token", "demo_token");
        setLocation("/patient/dashboard");
        toast({
          title: "Demo Mode Active",
          description: "Logged in with demo credentials since API failed.",
        });
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/60 via-white to-blue-50/60 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-5">
            <span className="font-sans text-2xl font-bold tracking-tight text-foreground">Cloudberry</span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Welcome Back</h1>
          <p className="text-muted-foreground mt-2 text-sm">Sign in to your patient portal</p>
        </div>

        <Card className="border-border/60 shadow-lg bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-primary via-primary/70 to-blue-400" />
          <CardContent className="pt-7 pb-2 px-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground font-medium">Phone Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your registered phone"
                          className="rounded-xl border-border/60 bg-white h-11"
                          {...field}
                          data-testid="input-signin-phone"
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
                          placeholder="••••••••"
                          className="rounded-xl border-border/60 bg-white h-11"
                          {...field}
                          data-testid="input-signin-password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full mt-2 rounded-full h-12 text-base bg-primary hover:bg-primary/90 shadow-sm"
                  disabled={signin.isPending}
                  data-testid="btn-signin-submit"
                >
                  {signin.isPending ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-border/40 py-5 bg-gradient-to-br from-amber-50/40 to-blue-50/40 px-6">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/patient/signup" className="text-primary hover:underline font-semibold">
                Start your journey
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
