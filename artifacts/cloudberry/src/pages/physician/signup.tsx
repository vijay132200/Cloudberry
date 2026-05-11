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
        toast({
          variant: "destructive",
          title: "Submission Failed",
          description: "Please try again later."
        });
      }
    });
  };

  return (
    <MarketingLayout>
      <div className="bg-muted/30 py-16 md:py-24 min-h-[calc(100vh-80px)] flex items-center">
        <div className="container mx-auto px-4 max-w-lg">
          <Card className="border-border shadow-md">
            <CardHeader className="text-center pb-8 border-b">
              <CardTitle className="text-2xl font-serif text-foreground">Partner with Cloudberry</CardTitle>
              <CardDescription>
                Leave your details below and our clinical partnership team will reach out to discuss collaboration.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-8">
              {submitted ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round" className="lucide lucide-check"><path d="M20 6 9 17l-5-5"/></svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Thank you, Doctor</h3>
                  <p className="text-muted-foreground">We have received your details and will be in touch within 24 hours.</p>
                </div>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name (with credentials)</FormLabel>
                          <FormControl>
                            <Input placeholder="Dr. Jane Doe, MD" {...field} data-testid="input-physician-name" />
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
                            <FormLabel>Specialty</FormLabel>
                            <FormControl>
                              <Input placeholder="Endocrinology" {...field} data-testid="input-physician-specialty" />
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
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input placeholder="Indore" {...field} data-testid="input-physician-city" />
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
                          <FormLabel>Clinic / Hospital (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Apollo Hospitals" {...field} data-testid="input-physician-clinic" />
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
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input placeholder="+91" {...field} data-testid="input-physician-phone" />
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
                            <FormLabel>Preferred Time (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="2 PM - 4 PM" {...field} data-testid="input-physician-time" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button type="submit" className="w-full mt-6 rounded-full" size="lg" disabled={submitLead.isPending} data-testid="btn-physician-submit">
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
