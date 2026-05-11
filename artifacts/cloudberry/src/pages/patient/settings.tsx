import { PatientLayout } from "@/components/layout/patient-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Download, CreditCard, Bell, Shield, User } from "lucide-react";

export default function PatientSettings() {
  return (
    <PatientLayout>
      <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your account, preferences, and billing.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Sidebar Nav (Desktop) */}
          <div className="hidden md:flex flex-col gap-2">
            <Button variant="ghost" className="justify-start font-medium bg-muted">Profile</Button>
            <Button variant="ghost" className="justify-start font-medium text-muted-foreground">Plan & Billing</Button>
            <Button variant="ghost" className="justify-start font-medium text-muted-foreground">Notifications</Button>
            <Button variant="ghost" className="justify-start font-medium text-muted-foreground">Security</Button>
          </div>

          <div className="md:col-span-2 space-y-8">
            {/* Profile */}
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><User className="w-5 h-5"/> Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>First Name</Label>
                    <Input defaultValue="Rahul" />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name</Label>
                    <Input defaultValue="Sharma" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input defaultValue="rahul.sharma@example.com" type="email" />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input defaultValue="+91 98765 43210" disabled className="bg-muted" />
                  <p className="text-xs text-muted-foreground">Contact support to change your registered phone number.</p>
                </div>
                <Button className="mt-2 rounded-xl">Save Changes</Button>
              </CardContent>
            </Card>

            {/* Plan & Billing */}
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><CreditCard className="w-5 h-5"/> Plan & Billing</CardTitle>
                <CardDescription>Manage your subscription and payment methods</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-primary">Comprehensive Plan</h4>
                    <p className="text-sm text-foreground">₹1,990 / month</p>
                    <p className="text-xs text-muted-foreground mt-1">Next billing date: Oct 25, 2025</p>
                  </div>
                  <Badge variant="outline" className="bg-white">Active</Badge>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Payment Method</h4>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-6 bg-muted rounded flex items-center justify-center font-mono text-[10px] font-bold">VISA</div>
                      <span className="text-sm">•••• •••• •••• 4242</span>
                    </div>
                    <Button variant="ghost" size="sm" className="text-primary h-8">Edit</Button>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Invoices</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 hover:bg-muted rounded-lg transition-colors">
                      <span className="text-sm">Sep 25, 2025 - ₹1,990</span>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full"><Download className="w-4 h-4"/></Button>
                    </div>
                    <div className="flex items-center justify-between p-2 hover:bg-muted rounded-lg transition-colors">
                      <span className="text-sm">Aug 25, 2025 - ₹1,990</span>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full"><Download className="w-4 h-4"/></Button>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <Button variant="outline" className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20 rounded-xl">Cancel Subscription</Button>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Bell className="w-5 h-5"/> Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium">Daily Check-in Reminder</h4>
                    <p className="text-xs text-muted-foreground">Receive a push notification at 8 PM</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium">WhatsApp Updates</h4>
                    <p className="text-xs text-muted-foreground">Receive important updates via WhatsApp</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium">Marketing Emails</h4>
                    <p className="text-xs text-muted-foreground">News, tips and offers</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </PatientLayout>
  );
}
