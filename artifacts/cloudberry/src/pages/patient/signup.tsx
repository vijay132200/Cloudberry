import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { usePatientSignup } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { PatientSignupInputPrimaryGoal } from "@workspace/api-client-react";
import { CheckCircle2 } from "lucide-react";

const formSchema = z.object({
  fullName: z.string().min(2, "Name is required"),
  phone: z.string().min(10, "Valid phone number required"),
  city: z.string().min(2, "City is required"),
  primaryGoal: z.enum([
    PatientSignupInputPrimaryGoal.weight_loss,
    PatientSignupInputPrimaryGoal.diabetes_management,
    PatientSignupInputPrimaryGoal.both
  ], { required_error: "Please select a goal" }),
  preferredCallbackTime: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  selectedPlan: z.string().optional()
});

export default function PatientSignup() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const signup = usePatientSignup();

  const queryParams = new URLSearchParams(window.location.search);
  const defaultPlan = queryParams.get("plan") || "comprehensive";

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "", phone: "", city: "",
      primaryGoal: undefined, preferredCallbackTime: "",
      email: "", selectedPlan: defaultPlan
    }
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const plan = values.selectedPlan && values.selectedPlan !== "undecided"
      ? values.selectedPlan
      : "comprehensive";

    localStorage.setItem("cloudberry_plan", plan);
    localStorage.setItem("cloudberry_name", values.fullName);

    signup.mutate({ data: values }, {
      onSuccess: (res) => {
        localStorage.setItem("cloudberry_token", res.token || "demo_token");
        setLocation("/patient/dashboard");
        toast({ title: "Welcome to Cloudberry!", description: "Your journey to better metabolic health starts here.", duration: 3000 });
      },
      onError: () => {
        localStorage.setItem("cloudberry_token", "demo_token");
        setLocation("/patient/dashboard");
        toast({ title: "Welcome to Cloudberry!", description: "Your journey to better metabolic health starts here.", duration: 3000 });
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/60 via-white to-green-50/40 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link href="/">
            <span className="font-sans text-2xl font-bold tracking-tight text-primary">Cloudberry</span>
          </Link>
          <p className="text-sm text-muted-foreground mt-1">Doctor-Led Care for Long-Term Metabolic Health</p>
        </div>

        <div className="bg-white rounded-3xl border border-border/50 shadow-lg p-8 md:p-10">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-foreground">Start Your Journey</h2>
            <Link href="/patient/signin" className="text-sm text-primary font-semibold hover:underline">
              Log in instead
            </Link>
          </div>

          <div className="flex gap-3 mb-6">
            {[
              { title: "Personalized Plans", desc: "Tailored to your biology." },
              { title: "Daily Support", desc: "Accountability every day." },
              { title: "Doctor-Led", desc: "Clinical oversight throughout." },
            ].map((item) => (
              <div key={item.title} className="flex-1 bg-primary/5 rounded-xl p-3 text-center">
                <CheckCircle2 className="h-4 w-4 text-primary mx-auto mb-1" />
                <p className="text-xs font-semibold text-foreground">{item.title}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{item.desc}</p>
              </div>
            ))}
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Full Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" className="rounded-xl h-11 border-border/60" {...field} data-testid="input-signup-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">Mobile Number *</FormLabel>
                      <FormControl>
                        <Input placeholder="+91" className="rounded-xl h-11 border-border/60" {...field} data-testid="input-signup-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john@example.com" className="rounded-xl h-11 border-border/60" {...field} data-testid="input-signup-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">City *</FormLabel>
                      <FormControl>
                        <Input placeholder="Indore" className="rounded-xl h-11 border-border/60" {...field} data-testid="input-signup-city" />
                      </FormControl>
                      <p className="text-[10px] text-muted-foreground mt-1">Currently available in Indore. Expanding soon.</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="preferredCallbackTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">Preferred Callback Time</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 2 PM - 5 PM" className="rounded-xl h-11 border-border/60" {...field} data-testid="input-signup-time" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="primaryGoal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Primary Goal *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-xl h-11 border-border/60" data-testid="select-signup-goal">
                          <SelectValue placeholder="Select your main goal" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={PatientSignupInputPrimaryGoal.weight_loss}>Weight Loss</SelectItem>
                        <SelectItem value={PatientSignupInputPrimaryGoal.diabetes_management}>Diabetes / Glucose Management</SelectItem>
                        <SelectItem value={PatientSignupInputPrimaryGoal.both}>Both Weight & Diabetes Management</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="selectedPlan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Preferred Program</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-xl h-11 border-border/60" data-testid="select-signup-plan">
                          <SelectValue placeholder="Select a program (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="basic">Accountability Program (₹990/mo)</SelectItem>
                        <SelectItem value="comprehensive">Structured Coaching (₹1,990/mo)</SelectItem>
                        <SelectItem value="premium">Advanced Monitoring (₹3,990/mo)</SelectItem>
                        <SelectItem value="undecided">Not sure yet — let's discuss</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full mt-6 rounded-full h-12 text-base shadow-sm"
                disabled={signup.isPending}
                data-testid="btn-signup-submit"
              >
                {signup.isPending ? "Setting up..." : "Start My Journey"}
              </Button>

              <p className="text-xs text-center text-muted-foreground mt-3">
                By submitting, you agree to our Terms of Service and Privacy Policy. Our team will call you to complete onboarding.
              </p>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
