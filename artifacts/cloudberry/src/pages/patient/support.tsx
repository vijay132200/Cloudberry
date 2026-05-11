import { PatientLayout } from "@/components/layout/patient-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { Phone, MessageSquare, AlertCircle, PlayCircle } from "lucide-react";

const flagSchema = z.object({
  reason: z.string().min(5, "Please describe the issue"),
});

export default function PatientSupport() {
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof flagSchema>>({
    resolver: zodResolver(flagSchema),
    defaultValues: { reason: "" }
  });

  const onSubmit = (values: z.infer<typeof flagSchema>) => {
    toast({
      title: "Support Request Sent",
      description: "A care coordinator will reach out to you shortly.",
    });
    form.reset();
  };

  return (
    <PatientLayout>
      <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-8">
        
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">Support & Resources</h1>
          <p className="text-muted-foreground">We're here to help you navigate your journey.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-border shadow-sm border-t-4 border-t-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                Care Team Chat
              </CardTitle>
              <CardDescription>For routine questions about nutrition, app issues, or rescheduling.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full rounded-xl" variant="outline">Open WhatsApp Chat</Button>
              <p className="text-xs text-center text-muted-foreground mt-3">Usually responds within 2 hours</p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm border-t-4 border-t-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-destructive" />
                Medical Red Flag
              </CardTitle>
              <CardDescription>If you're experiencing severe side effects or concerning symptoms.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90">Raise Medical Flag</Button>
              <p className="text-xs text-center text-muted-foreground mt-3">Connects directly to clinical team</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle>How it Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-video w-full bg-muted rounded-xl relative flex items-center justify-center mb-6 overflow-hidden">
              <img src="/images/hero-2-support.png" alt="Video placeholder" className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-multiply" />
              <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center z-10 cursor-pointer hover:scale-105 transition-transform shadow-lg">
                <PlayCircle className="w-8 h-8 text-primary" />
              </div>
            </div>
            
            <h3 className="font-medium text-foreground mb-3">Quick Links</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['App Tutorial', 'Nutrition Guide', 'Device Syncing', 'Billing FAQs'].map(link => (
                <Button key={link} variant="secondary" className="bg-primary/5 text-primary hover:bg-primary/10 justify-start h-auto py-3 px-4 rounded-xl">
                  {link}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle>Contact Support Team</CardTitle>
            <CardDescription>Need help with something else? Send us a message.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>How can we help?</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe your issue or question here..." 
                          className="min-h-[100px] resize-none"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="rounded-xl">Submit Request</Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </PatientLayout>
  );
}
