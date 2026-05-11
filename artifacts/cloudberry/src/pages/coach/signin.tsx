import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCoachSignin } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";

const formSchema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(6, "Password is required"),
});

export default function CoachSignin() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const signin = useCoachSignin();

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
        setLocation("/coach/patients");
      },
      onError: () => {
        localStorage.setItem("cloudberry_token", "demo_token");
        setLocation("/coach/patients");
        toast({
          title: "Demo Mode Active",
          description: "Logged in to coach portal with demo credentials.",
        });
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/60 via-white to-blue-50/60 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <span className="font-sans text-2xl font-bold tracking-tight text-foreground">Cloudberry</span>
          </Link>
          <p className="text-muted-foreground text-sm">Coach Portal</p>
        </div>

        <Card className="border-border/60 shadow-lg bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-primary via-primary/70 to-blue-400" />
          <CardHeader className="text-center border-b border-border/40 pb-5 pt-6 bg-gradient-to-br from-primary/5 to-blue-50/50">
            <CardTitle className="text-xl font-bold text-foreground">Coach Portal</CardTitle>
            <CardDescription>Sign in to manage your patients</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 px-6 pb-7">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">Work Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="coach@cloudberry.health"
                          className="rounded-xl h-11 border-border/60"
                          {...field}
                          data-testid="input-coach-email"
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
                      <FormLabel className="font-medium">Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          className="rounded-xl h-11 border-border/60"
                          {...field}
                          data-testid="input-coach-password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full mt-4 rounded-full h-12 text-base"
                  disabled={signin.isPending}
                  data-testid="btn-coach-submit"
                >
                  {signin.isPending ? "Authenticating..." : "Access Portal"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
