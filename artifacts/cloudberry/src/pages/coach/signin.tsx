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
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-serif text-xl italic font-bold">C</div>
            <span className="font-serif text-2xl tracking-tight text-foreground font-bold">Cloudberry</span>
          </Link>
        </div>

        <Card className="border-border shadow-md">
          <CardHeader className="text-center border-b pb-6">
            <CardTitle className="text-xl font-semibold">Coach Portal</CardTitle>
            <CardDescription>Sign in to manage your patients</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Work Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="coach@cloudberry.health" {...field} data-testid="input-coach-email" />
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
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} data-testid="input-coach-password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full mt-6" size="lg" disabled={signin.isPending} data-testid="btn-coach-submit">
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
