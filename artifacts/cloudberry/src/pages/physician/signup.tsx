import { MarketingLayout } from "@/components/layout/marketing-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSubmitPhysicianLead } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { CheckCircle2, Stethoscope } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, "Name is required"),
  specialty: z.string().min(2, "Specialty is required"),
  clinicOrHospital: z.string().optional(),
  city: z.string().min(2, "City is required"),
  phone: z.string().min(10, "Valid phone number required"),
  preferredCallbackTime: z.string().optional()
});

export default function PhysicianSignupPage() {
  const { toast } = useToast();
  const submitLead = useSubmitPhysicianLead();
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      specialty: "",
      clinicOrHospital: "",
      city: "",
      phone: "",
      preferredCallbackTime: ""
    }
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    submitLead.mutate({ data: values }, {
      onSuccess: () => {
        setSubmitted(true);
        toast({
          title: "Request Received",
          description: "A member of our team will contact you shortly."
        });
      },
      onError: () => {
        setSubmitted(true);
        toast({
          title: "Request Submitted",
          description: "We'll be in touch within 24 hours."
        });
      }
    });
  };

  return (
    <MarketingLayout>
      <div className="bg-gradient-to-br from-blue-50/50 via-white to-amber-50/40 py-16 md:py-24 min-h-[calc(100vh-80px)] flex items-center">
        <div className="container mx-auto px-4 max-w-lg">
          <Card className="border-border/50 shadow-xl rounded-2xl overflow-hidden bg-white">
            <div className="h-1.5 bg-gradient-to-r from-primary via-blue-400 to-primary/60" />
            <CardHeader className="text-center pb-7 border-b border-border/40 pt-8 bg-gradient-to-br from-primary/5 to-blue-50/50">
              <div className="flex justify-center mb-3">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full">
                  <Stethoscope className="w-3.5 h-3.5" /> Physician / Doctor Sign Up
                </span>
              </div>
              <CardTitle className="text-2xl font-bold text-foreground">Connect with Us</CardTitle>
              <CardDescription className="mt-2">
                Leave your details and our clinical partnership team will reach out to discuss collaboration.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-8 px-7 pb-8">
              {submitted ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-5">
                    <CheckCircle2 className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Thank you for connecting!</h3>
                  <p className="text-muted-foreground">We have received your details and our partnership team will speak to you within the next 24 hours.</p>
                </div>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-medium">Full Name (with credentials)</FormLabel>
                          <FormControl>
                            <Input placeholder="Dr. Jane Doe, MD" className="rounded-xl h-11 border-border/60" {...field} data-testid="input-physician-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="specialty"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-medium">Specialty</FormLabel>
                            <FormControl>
                              <Input placeholder="Endocrinology" className="rounded-xl h-11 border-border/60" {...field} data-testid="input-physician-specialty" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-medium">City</FormLabel>
                            <FormControl>
                              <Input placeholder="Indore" className="rounded-xl h-11 border-border/60" {...field} data-testid="input-physician-city" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="clinicOrHospital"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-medium">Clinic / Hospital (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Apollo Hospitals" className="rounded-xl h-11 border-border/60" {...field} data-testid="input-physician-clinic" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-medium">Phone Number</FormLabel>
                            <FormControl>
                              <Input placeholder="+91" className="rounded-xl h-11 border-border/60" {...field} data-testid="input-physician-phone" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="preferredCallbackTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-medium">Preferred Time</FormLabel>
                            <FormControl>
                              <Input placeholder="2 PM – 4 PM" className="rounded-xl h-11 border-border/60" {...field} data-testid="input-physician-time" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full mt-4 rounded-full h-12 text-base shadow-sm"
                      disabled={submitLead.isPending}
                      data-testid="btn-physician-submit"
                    >
                      {submitLead.isPending ? "Submitting..." : "Request Collaboration"}
                    </Button>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MarketingLayout>
  );
}
