import { PatientLayout } from "@/components/layout/patient-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Download, CreditCard, Bell, Shield, User, ChevronRight, ArrowLeftRight, Clock, CheckCircle, X } from "lucide-react";
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
async function postJson(path: string, body: any) {
  const token = localStorage.getItem("cloudberry_token");
  const r = await fetch(`${API}${path}`, {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error ?? "Failed"); }
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

const PLANS = [
  { key: "basic", name: "Accountability Program", price: "₹990/mo", desc: "Daily check-ins, basic coaching" },
  { key: "comprehensive", name: "Structured Coaching", price: "₹1,990/mo", desc: "Full coaching + dietician access" },
  { key: "premium", name: "Advanced Monitoring", price: "₹3,990/mo", desc: "Everything + physician priority + glucose" },
];

function BillingSection() {
  const qc = useQueryClient();
  const { data: me } = useQuery({ queryKey: ["me"], queryFn: () => fetchJson("/patients/me") });
  const { data: planStatus } = useQuery({
    queryKey: ["plan-change-status"],
    queryFn: () => fetchJson("/patients/me/plan-change-request/status"),
    staleTime: 10000,
  });

  const [showChangePlan, setShowChangePlan] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("");

  const planKey = me?.plan ?? "comprehensive";
  const plan = PLAN_LABELS[planKey] ?? PLAN_LABELS.comprehensive;
  const startedAt = me?.createdAt ? new Date(me.createdAt) : new Date();
  const nextBilling = new Date(startedAt); nextBilling.setMonth(nextBilling.getMonth() + (me?.weekNumber ? Math.ceil(me.weekNumber / 4) : 1));

  const submitRequest = useMutation({
    mutationFn: () => postJson("/patients/me/plan-change-request", { requestedPlan: selectedPlan }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plan-change-status"] });
      setShowChangePlan(false);
      setSelectedPlan("");
    },
  });

  const hasPending = planStatus?.hasPending;
  const pendingReq = planStatus?.pending;

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

          {/* Pending plan change request banner */}
          {hasPending && pendingReq && (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
              <Clock className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-amber-800">Plan change pending</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Your request to switch to <strong>{PLAN_LABELS[pendingReq.requestedPlan]?.name ?? pendingReq.requestedPlan}</strong> is
                  awaiting ops review. Usually processed within 24 hours.
                </p>
              </div>
            </div>
          )}

          {/* Recent approved / rejected */}
          {!hasPending && planStatus?.recent?.length > 0 && planStatus.recent[0]?.status !== "pending" && (
            <div className={`flex items-start gap-3 p-3 rounded-xl border ${planStatus.recent[0].status === "approved" ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"}`}>
              {planStatus.recent[0].status === "approved"
                ? <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                : <X className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />}
              <p className="text-xs text-muted-foreground">
                Your last plan change request was <strong className={planStatus.recent[0].status === "approved" ? "text-emerald-700" : "text-rose-700"}>{planStatus.recent[0].status}</strong>.
              </p>
            </div>
          )}

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
            <Button
              variant="outline" className="rounded-xl gap-2"
              disabled={hasPending}
              onClick={() => { setSelectedPlan(""); setShowChangePlan(true); }}
            >
              <ArrowLeftRight className="w-4 h-4" />
              {hasPending ? "Change pending..." : "Change Plan"}
            </Button>
            <Button variant="outline" className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20 rounded-xl">Cancel Subscription</Button>
          </div>
        </CardContent>
      </Card>

      {/* Plan change dialog */}
      <Dialog open={showChangePlan} onOpenChange={open => { if (!open) setShowChangePlan(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><ArrowLeftRight className="w-4 h-4 text-primary" />Request Plan Change</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Your request will be reviewed by our ops team and processed within 24 hours.
              Currently on: <strong className="text-foreground">{plan.name}</strong>
            </p>
            <div className="space-y-2">
              {PLANS.filter(p => p.key !== planKey).map(p => (
                <button
                  key={p.key}
                  onClick={() => setSelectedPlan(p.key)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${selectedPlan === p.key ? "border-primary bg-primary/5" : "border-border/60 hover:border-primary/40"}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground text-sm">{p.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{p.desc}</p>
                    </div>
                    <span className="text-sm font-bold text-primary ml-4 shrink-0">{p.price}</span>
                  </div>
                </button>
              ))}
            </div>
            {submitRequest.isError && (
              <p className="text-xs text-rose-600">{(submitRequest.error as any)?.message ?? "Failed to submit request"}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChangePlan(false)}>Cancel</Button>
            <Button
              disabled={!selectedPlan || submitRequest.isPending}
              onClick={() => submitRequest.mutate()}
            >
              {submitRequest.isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
