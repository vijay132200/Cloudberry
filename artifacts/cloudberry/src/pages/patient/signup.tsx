import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  ], {
    required_error: "Please select a goal",
  }),
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
      fullName: "",
      phone: "",
      city: "",
      primaryGoal: undefined,
      preferredCallbackTime: "",
      email: "",
      selectedPlan: defaultPlan
    }
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    signup.mutate({ data: values }, {
      onSuccess: (res) => {
        if (res.token) {
          localStorage.setItem("cloudberry_token", res.token);
        } else {
          localStorage.setItem("cloudberry_token", "demo_token");
        }
        setLocation("/patient/dashboard");
        toast({
          title: "Welcome to Cloudberry",
          description: "Your journey to better metabolic health starts here."
        });
      },
      onError: () => {
        localStorage.setItem("cloudberry_token", "demo_token");
        setLocation("/patient/dashboard");
        toast({
          title: "Demo Mode Active",
          description: "Created demo account since API failed.",
        });
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/50 via-white to-blue-50/50 flex flex-col md:flex-row">
      {/* Left Panel */}
      <div className="w-full md:w-5/12 lg:w-1/2 relative flex flex-col border-b md:border-b-0 md:border-r border-border/40 overflow-hidden">
        {/* Background image with overlay */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=900&q=80"
            alt="Doctor consultation"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-primary/60 to-blue-700/70" />
        </div>

        <div className="relative z-10 p-8 md:p-12 lg:p-16 flex flex-col h-full min-h-[340px] md:min-h-screen">
          <Link href="/" className="inline-flex items-center gap-2 mb-10">
            <span className="font-sans text-2xl font-bold tracking-tight text-white">Cloudberry</span>
          </Link>

          <div className="flex-grow flex flex-col justify-center">
            <h1 className="text-3xl lg:text-4xl font-bold mb-5 leading-tight text-white">
              Doctor-Led Care for Sustainable Weight & Diabetes Management
            </h1>
            <p className="text-white/80 text-base mb-10">
              Join the platform that treats metabolic health holistically through clinical oversight and daily support.
            </p>

            <div className="space-y-5">
              {[
                { title: "Personalized Plans", desc: "Protocols tailored to your unique biology, not generic diets." },
                { title: "Continuous Support", desc: "Daily accountability and habit building, not just monthly visits." },
                { title: "Coordinated Care Team", desc: "Doctors, nutritionists, and fitness coaches working together for you." },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-base">{item.title}</h3>
                    <p className="text-white/70 text-sm mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full md:w-7/12 lg:w-1/2 p-8 md:p-12 lg:p-16 overflow-y-auto">
        <div className="max-w-md mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-foreground">Start Your Journey</h2>
            <Link href="/patient/signin" className="text-sm text-primary font-semibold hover:underline">
              Log in instead
            </Link>
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
                        <SelectItem value="basic">Basic (₹990/mo)</SelectItem>
                        <SelectItem value="comprehensive">Comprehensive (₹1,990/mo)</SelectItem>
                        <SelectItem value="premium">Premium (₹3,990/mo)</SelectItem>
                        <SelectItem value="undecided">Not sure yet, let's discuss</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full mt-6 rounded-full h-12 text-base bg-primary hover:bg-primary/90 shadow-sm"
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
