import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
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
  const [location, setLocation] = useLocation();
  const signup = usePatientSignup();

  // Extract plan from URL if present
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
        // Fallback to demo mode
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
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Left Panel */}
      <div className="w-full md:w-5/12 lg:w-1/2 bg-primary/5 p-8 md:p-12 lg:p-20 flex flex-col border-b md:border-b-0 md:border-r border-border">
        <Link href="/" className="inline-flex items-center gap-2 mb-12">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-serif text-xl italic font-bold">C</div>
          <span className="font-serif text-2xl tracking-tight text-foreground font-bold">Cloudberry</span>
        </Link>
        
        <div className="flex-grow">
          <h1 className="text-3xl lg:text-4xl font-serif font-bold mb-6 leading-tight">
            Doctor-Led Care for Sustainable Weight & Diabetes Management
          </h1>
          <p className="text-muted-foreground text-lg mb-10">
            Join the platform that treats metabolic health holistically through clinical oversight and daily support.
          </p>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                <CheckCircle2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Personalized Plans</h3>
                <p className="text-muted-foreground text-sm mt-1">Protocols tailored to your unique biology, not generic diets.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                <CheckCircle2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Continuous Support</h3>
                <p className="text-muted-foreground text-sm mt-1">Daily accountability and habit building, not just monthly visits.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                <CheckCircle2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Coordinated Care Team</h3>
                <p className="text-muted-foreground text-sm mt-1">Doctors, nutritionists, and fitness coaches working together for you.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full md:w-7/12 lg:w-1/2 p-8 md:p-12 lg:p-20 overflow-y-auto">
        <div className="max-w-md mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-semibold">Start Your Journey</h2>
            <Link href="/patient/signin" className="text-sm text-primary font-medium hover:underline">
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
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} data-testid="input-signup-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mobile Number *</FormLabel>
                      <FormControl>
                        <Input placeholder="+91" {...field} data-testid="input-signup-phone" />
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
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john@example.com" {...field} data-testid="input-signup-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City *</FormLabel>
                      <FormControl>
                        <Input placeholder="Indore" {...field} data-testid="input-signup-city" />
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
                      <FormLabel>Preferred Callback Time</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 2 PM - 5 PM" {...field} data-testid="input-signup-time" />
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
                    <FormLabel>Primary Goal *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-signup-goal">
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
                    <FormLabel>Preferred Program</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-signup-plan">
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

              <Button type="submit" className="w-full mt-8 rounded-full h-12 text-md" disabled={signup.isPending} data-testid="btn-signup-submit">
                {signup.isPending ? "Setting up..." : "Start My Journey"}
              </Button>
              
              <p className="text-xs text-center text-muted-foreground mt-4">
                By submitting this form, you agree to our Terms of Service and Privacy Policy. Our team will call you to complete your onboarding.
              </p>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
