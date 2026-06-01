import { StaffLayout } from "@/components/layout/staff-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useLocation } from "wouter";
import {
  Settings, Shield, Bell, Database, Users, Stethoscope, Salad, UserCheck,
  ExternalLink, CheckCircle2, LayoutDashboard, ChevronRight, LogOut, FlaskConical
} from "lucide-react";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "");

interface PortalEntry { label: string; role: string; route: string; icon: any; color: string; email: string }

const PORTALS: PortalEntry[] = [
  { label: "Physician Portal", role: "physician", route: "/physician/dashboard", icon: Stethoscope, color: "bg-sky-50 border-sky-200 text-sky-700", email: "dr.mehta@cloudberry.health" },
  { label: "Dietician Portal", role: "dietician", route: "/dietician/dashboard", icon: Salad, color: "bg-emerald-50 border-emerald-200 text-emerald-700", email: "priya.diet@cloudberry.health" },
  { label: "Caretaker Portal", role: "caretaker", route: "/caretaker/dashboard", icon: UserCheck, color: "bg-amber-50 border-amber-200 text-amber-700", email: "ranjit.care@cloudberry.health" },
];

export default function OpsSettings() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [escalationThreshold, setEscalationThreshold] = useState("2");
  const [adherenceAlert, setAdherenceAlert] = useState("40");
  const [refetchInterval, setRefetchInterval] = useState("30");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem("cloudberry_ops_escalation_threshold", escalationThreshold);
    localStorage.setItem("cloudberry_ops_adherence_alert", adherenceAlert);
    localStorage.setItem("cloudberry_ops_refetch_interval", refetchInterval);
    setSaved(true);
    toast({ title: "Settings saved", description: "Your preferences have been updated." });
    setTimeout(() => setSaved(false), 3000);
  };

  const accessPortal = (portal: PortalEntry) => {
    const currentToken = localStorage.getItem("cloudberry_token");
    const currentRole = localStorage.getItem("cloudberry_role");
    const currentName = localStorage.getItem("cloudberry_name");
    if (currentToken) {
      localStorage.setItem("cloudberry_ops_backup", JSON.stringify({ token: currentToken, role: currentRole, name: currentName }));
    }
    const dummyToken = btoa(JSON.stringify({ userId: 0, role: portal.role, opsPreview: true }));
    localStorage.setItem("cloudberry_token", dummyToken);
    localStorage.setItem("cloudberry_role", portal.role);
    localStorage.setItem("cloudberry_name", portal.role === "physician" ? "Dr. Sneha Mehta" : portal.role === "dietician" ? "Priya Sharma" : "Ranjit Kumar");
    setLocation(portal.route);
  };

  return (
    <StaffLayout type="ops">
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary" /> Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Configure Operations portal preferences and access care team portals</p>
        </div>

        {/* Formula Management */}
        <Card className="border-primary/30 shadow-sm bg-gradient-to-br from-primary/5 to-background">
          <CardHeader className="border-b bg-muted/20 pb-3">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-primary" /> Formula Management & Governance
              <Badge className="ml-auto text-[10px] bg-primary/10 text-primary border-primary/20" variant="outline">Admin</Badge>
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Govern scoring formulas, thresholds, and calculation weights with versioning, approval workflows, impact simulation, and full audit trail.
            </p>
          </CardHeader>
          <CardContent className="pt-4 pb-4 flex items-center justify-between gap-4">
            <div className="flex gap-3 text-[10px] text-muted-foreground">
              {["6 Formulas", "Versioned", "Audit Trail", "Patient Overrides"].map(f => (
                <span key={f} className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" />{f}</span>
              ))}
            </div>
            <Button className="gap-1.5 shrink-0" onClick={() => setLocation("/ops/formula-management")}>
              <FlaskConical className="w-3.5 h-3.5" /> Open Formula Registry <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </CardContent>
        </Card>

        {/* Portal Access */}
        <Card className="border-border shadow-sm">
          <CardHeader className="border-b bg-muted/20 pb-3">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4 text-primary" /> Care Team Portal Access
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Switch into a care team portal as that role. A banner will appear in the portal to return to Ops.</p>
          </CardHeader>
          <CardContent className="pt-4 pb-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PORTALS.map(portal => (
              <div key={portal.role} className={`border rounded-xl p-4 ${portal.color.split(" ").map(c => c.startsWith("bg-") ? c : "").filter(Boolean)[0]} border-opacity-60`}>
                <div className="flex items-center gap-2 mb-3">
                  <portal.icon className="w-4 h-4" />
                  <span className="text-sm font-semibold">{portal.label}</span>
                </div>
                <p className="text-[10px] text-muted-foreground mb-3">Sign in as {portal.role} and view the portal in context.</p>
                <Button size="sm" className="w-full h-8 text-xs" onClick={() => accessPortal(portal)}>
                  <ExternalLink className="w-3 h-3 mr-1.5" /> Access Portal
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Alert thresholds */}
        <Card className="border-border shadow-sm">
          <CardHeader className="border-b bg-muted/20 pb-3">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-500" /> Alert Thresholds
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 pb-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Missed check-ins before escalation alert</label>
                <p className="text-[10px] text-muted-foreground">Flag a patient as high-risk after this many consecutive missed days</p>
                <div className="flex items-center gap-2">
                  <Input type="number" min={1} max={14} value={escalationThreshold}
                    onChange={e => setEscalationThreshold(e.target.value)}
                    className="h-9 text-sm w-24 rounded-lg" />
                  <span className="text-xs text-muted-foreground">days</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Adherence % threshold for low-adherence alert</label>
                <p className="text-[10px] text-muted-foreground">Show warning badge when patient adherence falls below this</p>
                <div className="flex items-center gap-2">
                  <Input type="number" min={0} max={100} value={adherenceAlert}
                    onChange={e => setAdherenceAlert(e.target.value)}
                    className="h-9 text-sm w-24 rounded-lg" />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data settings */}
        <Card className="border-border shadow-sm">
          <CardHeader className="border-b bg-muted/20 pb-3">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-500" /> Data & Refresh Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 pb-5 space-y-4">
            <div className="space-y-1.5 max-w-sm">
              <label className="text-xs font-semibold text-foreground">Dashboard auto-refresh interval</label>
              <p className="text-[10px] text-muted-foreground">How often the dashboard polls the database for fresh data</p>
              <div className="flex items-center gap-2">
                <Input type="number" min={10} max={300} value={refetchInterval}
                  onChange={e => setRefetchInterval(e.target.value)}
                  className="h-9 text-sm w-24 rounded-lg" />
                <span className="text-xs text-muted-foreground">seconds</span>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-blue-50/60 border border-blue-100 rounded-xl p-3">
              <Database className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-blue-800">Connected to Neon PostgreSQL</p>
                <p className="text-[10px] text-blue-600 mt-0.5">All patient data, check-ins, metrics, appointments, and notes are stored in the Neon database and updated in real time.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="border-border shadow-sm">
          <CardHeader className="border-b bg-muted/20 pb-3">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Shield className="w-4 h-4 text-violet-500" /> Security & Access
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 pb-5 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {[
                { label: "Operations Portal", url: "/ops/signin", badge: "ops" },
                { label: "Physician Portal", url: "/physician/signin", badge: "physician" },
                { label: "Dietician Portal", url: "/dietician/signin", badge: "dietician" },
                { label: "Caretaker Portal", url: "/caretaker/signin", badge: "caretaker" },
                { label: "Patient Portal", url: "/patient/signin", badge: "patient" },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between border border-border/50 rounded-xl p-3 bg-muted/20">
                  <div>
                    <p className="font-semibold text-foreground">{s.label}</p>
                    <p className="text-muted-foreground font-mono text-[10px]">{BASE}{s.url}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] capitalize shrink-0">{s.badge}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button className="rounded-xl px-8" onClick={handleSave}>
            {saved ? <><CheckCircle2 className="w-4 h-4 mr-1.5" /> Saved!</> : "Save Settings"}
          </Button>
          <p className="text-xs text-muted-foreground">Settings are stored locally in your browser.</p>
        </div>
      </div>
    </StaffLayout>
  );
}
