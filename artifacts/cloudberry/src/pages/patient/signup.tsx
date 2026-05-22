import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { usePatientSignup } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { PatientSignupInputPrimaryGoal } from "@workspace/api-client-react";
import { CheckCircle2, Clock, Eye, EyeOff, Users } from "lucide-react";
import { useState } from "react";

const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/\d/, "Password must include at least one number")
  .regex(/[^a-zA-Z0-9]/, "Password must include at least one special character");

const phoneSchema = z.string()
  .regex(/^\d{10}$/, "Phone must be exactly 10 digits");

const formSchema = z.object({
  fullName: z.string().min(2, "Name is required"),
  phone: phoneSchema,
  email: z.string().email("Valid email address required"),
  password: passwordSchema,
  confirmPassword: z.string(),
  city: z.string().min(2, "City is required"),
  primaryGoal: z.enum([
    PatientSignupInputPrimaryGoal.weight_loss,
    PatientSignupInputPrimaryGoal.diabetes_management,
    PatientSignupInputPrimaryGoal.both
  ], { required_error: "Please select a goal" }),
  preferredCallbackTime: z.string().optional(),
  selectedPlan: z.string().optional(),
  consent: z.boolean().refine(v => v === true, { message: "You must accept the terms to continue" }),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export default function PatientSignup() {
  const { toast } = useToast();
  const signup = usePatientSignup();
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedName, setSubmittedName] = useState("");

  const queryParams = new URLSearchParams(window.location.search);
  const defaultPlan = queryParams.get("plan") || "comprehensive";

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "", phone: "", email: "", password: "", confirmPassword: "",
      city: "", primaryGoal: undefined, preferredCallbackTime: "",
      selectedPlan: defaultPlan, consent: false,
    }
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const plan = values.selectedPlan && values.selectedPlan !== "undecided" ? values.selectedPlan : "comprehensive";
    localStorage.setItem("cloudberry_plan", plan);
    localStorage.setItem("cloudberry_name", values.fullName);

    signup.mutate({ data: { ...values, selectedPlan: plan } }, {
      onSuccess: (_res: any) => {
        setSubmittedName(values.fullName);
        setSubmitted(true);
      },
      onError: (err: any) => {
        const msg = err?.message || "Registration failed. Please try again.";
        toast({ title: "Registration failed", description: msg, variant: "destructive", duration: 4000 });
      }
    });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/60 via-white to-green-50/40 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md text-center">
          <Link href="/" className="inline-block mb-8">
            <span className="font-sans text-2xl font-bold tracking-tight text-foreground">Cloudberry</span>
          </Link>
          <div className="bg-white rounded-3xl border border-border/50 shadow-lg p-8 md:p-10 space-y-6">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8 text-amber-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Application Received!</h2>
              <p className="text-muted-foreground mt-2 leading-relaxed">
                Thank you, <span className="font-semibold text-foreground">{submittedName}</span>. Your application has been submitted and is currently pending review by our team.
              </p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-left space-y-2">
              <p className="text-sm font-semibold text-amber-900">What happens next?</p>
              <ul className="text-sm text-amber-800 space-y-1.5">
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" /> Our operations team will review your application</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" /> You'll receive a call to confirm your details and plan</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" /> Once approved, your portal will be activated</li>
              </ul>
            </div>
            <p className="text-xs text-muted-foreground">
              Questions? Email us at{" "}
              <a href="mailto:hello@cloudberry.health" className="text-primary hover:underline">hello@cloudberry.health</a>
            </p>
            <Link href="/">
              <Button variant="outline" className="rounded-full w-full">Back to Home</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/60 via-white to-green-50/40 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link href="/">
            <span className="font-sans text-2xl font-bold tracking-tight text-foreground">Cloudberry</span>
          </Link>
          <p className="text-sm text-muted-foreground mt-1">Doctor-Led Care for Long-Term Metabolic Health</p>
        </div>

        <div className="bg-white rounded-3xl border border-border/50 shadow-lg p-8 md:p-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-foreground">Start Your Journey</h2>
            <Link href="/patient/signin" className="text-sm text-primary font-semibold hover:underline">
              Log in instead
            </Link>
          </div>

          <div className="flex gap-2 mb-7">
            {[
              { title: "Personalised Plans", desc: "Tailored to your biology." },
              { title: "Daily Support", desc: "Accountability every day." },
              { title: "Doctor-Led", desc: "Clinical oversight throughout." },
              { title: "Coordinated", desc: "Care Team" },
            ].map((item) => (
              <div key={item.title} className="flex-1 bg-primary/5 rounded-xl p-2.5 text-center">
                <CheckCircle2 className="h-4 w-4 text-primary mx-auto mb-1" />
                <p className="text-xs font-semibold text-foreground leading-tight">{item.title}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{item.desc}</p>
              </div>
            ))}
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField control={form.control} name="fullName" render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium">Full Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Rahul Sharma" className="rounded-xl h-11 border-border/60" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Mobile Number * <span className="text-[10px] text-muted-foreground">(10 digits)</span></FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="9876543210" maxLength={10} className="rounded-xl h-11 border-border/60" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Email Address *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" className="rounded-xl h-11 border-border/60" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Password *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input type={showPw ? "text" : "password"} placeholder="Min 8 chars, 1 number, 1 special"
                          className="rounded-xl h-11 border-border/60 pr-10" {...field} />
                        <button type="button" onClick={() => setShowPw(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Confirm Password *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input type={showCpw ? "text" : "password"} placeholder="Repeat password"
                          className="rounded-xl h-11 border-border/60 pr-10" {...field} />
                        <button type="button" onClick={() => setShowCpw(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          {showCpw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 text-xs text-blue-700">
                Password must be at least 8 characters and include at least one number and one special character (e.g. @, #, !, %).
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="city" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">City *</FormLabel>
                    <FormControl>
                      <Input placeholder="Indore" className="rounded-xl h-11 border-border/60" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="preferredCallbackTime" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Preferred Callback Time</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 2 PM – 5 PM" className="rounded-xl h-11 border-border/60" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="primaryGoal" render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium">Primary Goal *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="rounded-xl h-11 border-border/60">
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
              )} />

              <FormField control={form.control} name="selectedPlan" render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium">Preferred Program</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="rounded-xl h-11 border-border/60">
                        <SelectValue placeholder="Select a program (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="basic">Basic Plan — ₹990/mo</SelectItem>
                      <SelectItem value="comprehensive">Comprehensive Plan — ₹1,990/mo</SelectItem>
                      <SelectItem value="premium">Premium Plan — ₹3,990/mo</SelectItem>
                      <SelectItem value="undecided">Not sure yet — let's discuss</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="consent" render={({ field }) => (
                <FormItem className="flex flex-row items-start gap-3 space-y-0 rounded-xl border border-border/60 bg-muted/20 p-4">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm font-normal cursor-pointer">
                      I agree to the{" "}
                      <Link href="/terms" className="text-primary underline">Terms & Conditions</Link>
                      {" "}and{" "}
                      <Link href="/privacy-policy" className="text-primary underline">Privacy Policy</Link>.
                      I understand that my health data will be handled in accordance with healthcare privacy standards.
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )} />

              <Button type="submit" className="w-full mt-2 rounded-full h-12 text-base shadow-sm"
                disabled={signup.isPending}>
                {signup.isPending ? "Setting up your account..." : "Start My Journey"}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Our team will call you to complete onboarding and confirm your plan.
              </p>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
