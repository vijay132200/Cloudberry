import { PatientLayout } from "@/components/layout/patient-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Download, CreditCard, Bell, Shield, User, ChevronRight } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const API = `${BASE}/api`;

async function fetchJson(path: string) {
  const token = localStorage.getItem("cloudberry_token");
  const r = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error("Failed");
  return r.json();
}
async function patchJson(path: string, body: any) {
  const token = localStorage.getItem("cloudberry_token");
  const r = await fetch(`${API}${path}`, {
    method: "PATCH", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error("Failed");
  return r.json();
}

type Section = "profile" | "billing" | "notifications" | "security";

const NAV: { key: Section; label: string; icon: any }[] = [
  { key: "profile", label: "Profile", icon: User },
  { key: "billing", label: "Plan & Billing", icon: CreditCard },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "security", label: "Security", icon: Shield },
];

const PLAN_LABELS: Record<string, { name: string; price: string }> = {
  basic: { name: "Accountability Program", price: "₹990" },
  comprehensive: { name: "Structured Coaching", price: "₹1,990" },
  premium: { name: "Advanced Monitoring", price: "₹3,990" },
};

function ProfileSection() {
  const qc = useQueryClient();
  const { data: me } = useQuery({ queryKey: ["me"], queryFn: () => fetchJson("/patients/me") });
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (me) { setFullName(me.fullName ?? ""); setEmail(me.email ?? ""); setCity(me.city ?? ""); }
  }, [me]);

  const save = useMutation({
    mutationFn: () => patchJson("/patients/me", { fullName, email, city }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      localStorage.setItem("cloudberry_name", fullName);
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    },
  });

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg"><User className="w-5 h-5" /> Personal Information</CardTitle>
        <CardDescription>Update your contact details and demographics.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2"><Label>Full Name</Label><Input value={fullName} onChange={e => setFullName(e.target.value)} /></div>
        <div className="space-y-2"><Label>Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
        <div className="space-y-2"><Label>City</Label><Input value={city} onChange={e => setCity(e.target.value)} /></div>
        <div className="space-y-2"><Label>Phone Number</Label><Input value={me?.phone ?? ""} disabled className="bg-muted" /><p className="text-xs text-muted-foreground">Contact support to change your registered phone.</p></div>
        <div className="flex items-center gap-3 pt-2">
          <Button className="rounded-xl" onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? "Saving…" : "Save Changes"}</Button>
          {saved && <span className="text-xs text-green-600 font-medium">Saved ✓</span>}
        </div>
      </CardContent>
    </Card>
  );
}

function BillingSection() {
  const { data: me } = useQuery({ queryKey: ["me"], queryFn: () => fetchJson("/patients/me") });
  const planKey = me?.plan ?? "comprehensive";
  const plan = PLAN_LABELS[planKey] ?? PLAN_LABELS.comprehensive;
  const startedAt = me?.createdAt ? new Date(me.createdAt) : new Date();
  const nextBilling = new Date(startedAt); nextBilling.setMonth(nextBilling.getMonth() + (me?.weekNumber ? Math.ceil(me.weekNumber / 4) : 1));

  return (
    <div className="space-y-6">
      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><CreditCard className="w-5 h-5" /> Active Plan</CardTitle>
          <CardDescription>Manage your subscription.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex justify-between items-center flex-wrap gap-3">
            <div>
              <h4 className="font-bold text-primary">{plan.name}</h4>
              <p className="text-sm text-foreground">{plan.price} / month</p>
              <p className="text-xs text-muted-foreground mt-1">Next billing: {nextBilling.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
            </div>
            <Badge variant="outline" className="bg-white">Active</Badge>
          </div>

          <div>
            <h4 className="font-medium mb-3 text-sm">Payment Method</h4>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-6 bg-muted rounded flex items-center justify-center font-mono text-[10px] font-bold">VISA</div>
                <span className="text-sm">•••• •••• •••• 4242</span>
              </div>
              <Button variant="ghost" size="sm" className="text-primary h-8">Edit</Button>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-3 text-sm">Invoices</h4>
            <div className="space-y-1">
              {[0, 1, 2].map(i => {
                const d = new Date(startedAt); d.setMonth(d.getMonth() - i);
                return (
                  <div key={i} className="flex items-center justify-between p-2 hover:bg-muted/40 rounded-lg transition-colors">
                    <span className="text-sm">{d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} — {plan.price}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full"><Download className="w-4 h-4" /></Button>
                  </div>
                );
              })}
            </div>
          </div>

          <Separator />
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" className="rounded-xl" asChild><a href="/cloudberry/#pricing">Change plan</a></Button>
            <Button variant="outline" className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20 rounded-xl">Cancel Subscription</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function NotificationsSection() {
  const [prefs, setPrefs] = useState(() => {
    const stored = localStorage.getItem("cloudberry_notif_prefs");
    return stored ? JSON.parse(stored) : { checkinReminder: true, whatsapp: true, marketing: false, weeklySummary: true, careTeamMessages: true };
  });
  const update = (k: string, v: boolean) => {
    const next = { ...prefs, [k]: v }; setPrefs(next);
    localStorage.setItem("cloudberry_notif_prefs", JSON.stringify(next));
  };
  const items: { k: string; label: string; desc: string }[] = [
    { k: "checkinReminder", label: "Daily Check-in Reminder", desc: "Push notification at 8 PM if you haven't checked in" },
    { k: "weeklySummary", label: "Weekly Summary", desc: "Sunday digest of your progress" },
    { k: "careTeamMessages", label: "Care Team Messages", desc: "Notify me when my care team sends a message" },
    { k: "whatsapp", label: "WhatsApp Updates", desc: "Important reminders via WhatsApp" },
    { k: "marketing", label: "Marketing Emails", desc: "Product news, tips and offers" },
  ];
  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg"><Bell className="w-5 h-5" /> Notifications</CardTitle>
        <CardDescription>Choose how we keep you informed.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {items.map((it, i) => (
          <div key={it.k}>
            {i > 0 && <Separator className="my-1" />}
            <div className="flex items-center justify-between py-3">
              <div className="pr-4">
                <h4 className="text-sm font-medium">{it.label}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">{it.desc}</p>
              </div>
              <Switch checked={prefs[it.k]} onCheckedChange={(v) => update(it.k, v)} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function SecuritySection() {
  const [currentPw, setCurrentPw] = useState("");
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [msg, setMsg] = useState("");

  const changePw = useMutation({
    mutationFn: () => {
      const token = localStorage.getItem("cloudberry_token");
      return fetch(`${API}/patients/me/password`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPw || undefined, newPassword: pw1 }),
      }).then(async r => { if (!r.ok) throw new Error((await r.json()).error ?? "Failed"); });
    },
    onSuccess: () => { setMsg("Password updated successfully ✓"); setCurrentPw(""); setPw1(""); setPw2(""); },
    onError: (e: any) => setMsg(e.message ?? "Failed to update password"),
  });

  const onChange = () => {
    if (pw1.length < 8) return setMsg("Password must be at least 8 characters.");
    if (pw1 !== pw2) return setMsg("Passwords do not match.");
    setMsg("");
    changePw.mutate();
  };

  return (
    <div className="space-y-6">
      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><Shield className="w-5 h-5" /> Password</CardTitle>
          <CardDescription>Choose a strong password you don't use elsewhere.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>Current password</Label><Input type="password" value={currentPw} onChange={e => { setCurrentPw(e.target.value); setMsg(""); }} placeholder="Leave blank if you signed up without a password" /></div>
          <div className="space-y-2"><Label>New password</Label><Input type="password" value={pw1} onChange={e => { setPw1(e.target.value); setMsg(""); }} /></div>
          <div className="space-y-2"><Label>Confirm new password</Label><Input type="password" value={pw2} onChange={e => { setPw2(e.target.value); setMsg(""); }} /></div>
          {msg && <p className={`text-xs ${msg.includes("✓") ? "text-green-600" : "text-destructive"}`}>{msg}</p>}
          <Button className="rounded-xl" onClick={onChange} disabled={!pw1 || !pw2 || changePw.isPending}>
            {changePw.isPending ? "Updating…" : "Update password"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PatientSettings() {
  const [section, setSection] = useState<Section>("profile");

  return (
    <PatientLayout>
      <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">My Profile</h1>
          <p className="text-muted-foreground text-sm">Manage your account, preferences, and billing.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6 lg:gap-8">
          {/* Sidebar */}
          <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible -mx-4 px-4 md:m-0 md:p-0">
            {NAV.map(n => (
              <button
                key={n.key}
                onClick={() => setSection(n.key)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap shrink-0 md:shrink ${
                  section === n.key
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                }`}
              >
                <n.icon className="w-4 h-4 shrink-0" />
                <span>{n.label}</span>
                <ChevronRight className={`w-3 h-3 ml-auto hidden md:block ${section === n.key ? "text-primary" : "text-muted-foreground/40"}`} />
              </button>
            ))}
          </nav>

          {/* Section */}
          <div>
            {section === "profile" && <ProfileSection />}
            {section === "billing" && <BillingSection />}
            {section === "notifications" && <NotificationsSection />}
            {section === "security" && <SecuritySection />}
          </div>
        </div>
      </div>
    </PatientLayout>
  );
}
