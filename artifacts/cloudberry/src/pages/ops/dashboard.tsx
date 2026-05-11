import { StaffLayout } from "@/components/layout/staff-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Users, AlertTriangle, CheckCircle, Clock, ShieldAlert, HeartPulse, CalendarDays,
  Bell, Download, Search, X, Phone, Mail, MapPin, TrendingUp, Activity, FileText,
  Star, MessageSquare, Target, Stethoscope, Salad, Dumbbell
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const DEMO_PATIENTS = [
  {
    id: 1, fullName: "Priya Patel", phone: "+91 98765 43210", email: "priya.patel@email.com",
    plan: "Premium", status: "active", riskLevel: "high", adherencePct: 45,
    weekNumber: 6, lastCheckinAt: "2 days ago", nextSession: "Tomorrow 11:00 AM",
    assignedCoach: "Dr. A. Mehta", escalated: true,
    age: 34, city: "Indore", primaryGoal: "Diabetes Management",
    weight: "78 kg", startWeight: "82 kg", targetWeight: "68 kg",
    glucoseAvg: "142 mg/dL", lastGlucose: "156 mg/dL",
    notes: "Patient on Metformin 500mg. High stress reported. Missed 3 check-ins this week. Needs immediate follow-up call.",
    joinedDate: "Sep 1, 2025", streak: 2,
    medications: "Metformin 500mg (after dinner)",
    checkIns: [
      { date: "Oct 10", meals: "Partially", activity: false, energy: "Low", mood: "Stressed", glucose: "156" },
      { date: "Oct 8", meals: "Yes", activity: true, energy: "Moderate", mood: "Neutral", glucose: "142" },
      { date: "Oct 7", meals: "No", activity: false, energy: "Low", mood: "Stressed", glucose: "168" },
    ]
  },
  {
    id: 2, fullName: "Amit Kumar", phone: "+91 87654 32109", email: "amit.kumar@email.com",
    plan: "Basic", status: "paused", riskLevel: "medium", adherencePct: 60,
    weekNumber: 2, lastCheckinAt: "1 week ago", nextSession: "Thu 3:00 PM",
    assignedCoach: "Karan V.", escalated: false,
    age: 45, city: "Indore", primaryGoal: "Weight Loss",
    weight: "92 kg", startWeight: "95 kg", targetWeight: "80 kg",
    glucoseAvg: "—", lastGlucose: "—",
    notes: "Program paused due to travel. Resume scheduled next Thursday. Motivated but inconsistent with check-ins.",
    joinedDate: "Oct 1, 2025", streak: 0,
    medications: "None",
    checkIns: [
      { date: "Oct 5", meals: "Yes", activity: false, energy: "Moderate", mood: "Neutral", glucose: "—" },
      { date: "Oct 4", meals: "Partially", activity: true, energy: "Good", mood: "Positive", glucose: "—" },
    ]
  },
  {
    id: 3, fullName: "Rahul Sharma", phone: "+91 76543 21098", email: "rahul.s@email.com",
    plan: "Comprehensive", status: "active", riskLevel: "low", adherencePct: 85,
    weekNumber: 3, lastCheckinAt: "2 hours ago", nextSession: "Fri 10:00 AM",
    assignedCoach: null, escalated: false,
    age: 38, city: "Indore", primaryGoal: "Both Weight & Diabetes",
    weight: "85 kg", startWeight: "89 kg", targetWeight: "75 kg",
    glucoseAvg: "108 mg/dL", lastGlucose: "102 mg/dL",
    notes: "Excellent adherence. Following nutrition plan consistently. Ready for movement intensity increase next week.",
    joinedDate: "Oct 5, 2025", streak: 12,
    medications: "None",
    checkIns: [
      { date: "Oct 12", meals: "Yes", activity: true, energy: "Good", mood: "Positive", glucose: "102" },
      { date: "Oct 11", meals: "Yes", activity: true, energy: "Good", mood: "Positive", glucose: "105" },
      { date: "Oct 10", meals: "Partially", activity: true, energy: "Moderate", mood: "Neutral", glucose: "112" },
    ]
  },
  {
    id: 4, fullName: "Neha Singh", phone: "+91 65432 10987", email: "neha.singh@email.com",
    plan: "Comprehensive", status: "active", riskLevel: "low", adherencePct: 92,
    weekNumber: 8, lastCheckinAt: "5 hours ago", nextSession: "Sat 9:00 AM",
    assignedCoach: "Priya S.", escalated: false,
    age: 29, city: "Indore", primaryGoal: "Weight Loss",
    weight: "71 kg", startWeight: "78 kg", targetWeight: "62 kg",
    glucoseAvg: "—", lastGlucose: "—",
    notes: "Star patient. Lost 7 kg in 8 weeks. Energy levels excellent. Candidate for success story testimonial.",
    joinedDate: "Aug 15, 2025", streak: 21,
    medications: "None",
    checkIns: [
      { date: "Oct 12", meals: "Yes", activity: true, energy: "Good", mood: "Positive", glucose: "—" },
      { date: "Oct 11", meals: "Yes", activity: true, energy: "Good", mood: "Positive", glucose: "—" },
      { date: "Oct 10", meals: "Yes", activity: true, energy: "Good", mood: "Positive", glucose: "—" },
    ]
  },
  {
    id: 5, fullName: "Suresh Verma", phone: "+91 54321 09876", email: "suresh.v@email.com",
    plan: "Premium", status: "active", riskLevel: "medium", adherencePct: 71,
    weekNumber: 4, lastCheckinAt: "Yesterday", nextSession: "Mon 2:00 PM",
    assignedCoach: "Dr. A. Mehta", escalated: false,
    age: 52, city: "Indore", primaryGoal: "Diabetes Management",
    weight: "88 kg", startWeight: "91 kg", targetWeight: "78 kg",
    glucoseAvg: "128 mg/dL", lastGlucose: "119 mg/dL",
    notes: "Improving glucose trend. Struggles with dinner nutrition plan. Follow up on stress management techniques.",
    joinedDate: "Sep 15, 2025", streak: 5,
    medications: "Metformin 1000mg (twice daily), Januvia 100mg",
    checkIns: [
      { date: "Oct 11", meals: "Partially", activity: true, energy: "Moderate", mood: "Neutral", glucose: "119" },
      { date: "Oct 10", meals: "Yes", activity: false, energy: "Good", mood: "Positive", glucose: "128" },
    ]
  },
];

const RECENT_ACTIVITY = [
  { time: "2 min ago", msg: "Rahul Sharma completed today's check-in — Glucose 102 mg/dL", type: "checkin" },
  { time: "5 hrs ago", msg: "Neha Singh completed check-in — 21-day streak maintained", type: "checkin" },
  { time: "Yesterday", msg: "Suresh Verma logged glucose 119 mg/dL — improving trend", type: "glucose" },
  { time: "Yesterday", msg: "Priya Patel missed check-in — 2nd consecutive miss", type: "alert" },
  { time: "2 days ago", msg: "Amit Kumar paused program — travel reason noted", type: "info" },
  { time: "3 days ago", msg: "Priya Patel escalated by Dr. A. Mehta for urgent review", type: "escalation" },
];

const COACHES = [
  { name: "Dr. A. Mehta", role: "Lead Physician", patients: 3, adherenceAvg: 67, img: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=200&q=80" },
  { name: "Priya S.", role: "Nutritionist", patients: 1, adherenceAvg: 92, img: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=200&q=80" },
  { name: "Karan V.", role: "Fitness Coach", patients: 1, adherenceAvg: 60, img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80" },
];

type Patient = typeof DEMO_PATIENTS[0];

export default function OpsDashboard() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patients, setPatients] = useState(DEMO_PATIENTS);

  const filteredPatients = patients.filter(p =>
    p.fullName.toLowerCase().includes(search.toLowerCase()) ||
    p.plan.toLowerCase().includes(search.toLowerCase()) ||
    p.riskLevel.toLowerCase().includes(search.toLowerCase()) ||
    p.city.toLowerCase().includes(search.toLowerCase())
  );

  const handleAssignCoach = (patientId: number, coachName: string) => {
    setPatients(prev => prev.map(p => p.id === patientId ? { ...p, assignedCoach: coachName } : p));
    toast({ title: "Coach assigned", description: `${coachName} assigned successfully.` });
  };

  const handleEscalate = (patientId: number) => {
    setPatients(prev => prev.map(p => p.id === patientId ? { ...p, escalated: true, riskLevel: "high" } : p));
    if (selectedPatient?.id === patientId) {
      setSelectedPatient(prev => prev ? { ...prev, escalated: true, riskLevel: "high" } : null);
    }
    toast({ title: "Patient Escalated", description: "Clinical team has been notified.", variant: "destructive" });
  };

  const getRiskStyle = (risk: string) => {
    switch (risk) {
      case "low": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "medium": return "bg-amber-50 text-amber-700 border-amber-200";
      case "high": return "bg-rose-50 text-rose-700 border-rose-200";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  const getRiskDot = (risk: string) => {
    switch (risk) {
      case "low": return "bg-emerald-500";
      case "medium": return "bg-amber-500";
      case "high": return "bg-rose-500";
      default: return "bg-muted-foreground";
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "checkin": return <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />;
      case "glucose": return <HeartPulse className="w-4 h-4 text-sky-500 shrink-0" />;
      case "alert": return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
      case "escalation": return <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />;
      default: return <Bell className="w-4 h-4 text-muted-foreground shrink-0" />;
    }
  };

  const metrics = [
    { label: "Active Patients", value: "245", icon: <Users className="w-4 h-4 text-primary" />, color: "text-foreground", bg: "bg-primary/8 border-primary/20" },
    { label: "Daily Adherence", value: "82%", icon: <CheckCircle className="w-4 h-4 text-emerald-600" />, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-100" },
    { label: "Missed Check-ins", value: "14", icon: <Clock className="w-4 h-4 text-amber-600" />, color: "text-amber-700", bg: "bg-amber-50 border-amber-100" },
    { label: "High Risk", value: "8", icon: <HeartPulse className="w-4 h-4 text-rose-600" />, color: "text-rose-700", bg: "bg-rose-50 border-rose-100" },
    { label: "Appointments", value: "32", icon: <CalendarDays className="w-4 h-4 text-sky-600" />, color: "text-sky-700", bg: "bg-sky-50 border-sky-100" },
    { label: "Escalations", value: "3", icon: <AlertTriangle className="w-4 h-4 text-orange-600" />, color: "text-orange-700", bg: "bg-orange-50 border-orange-100" },
    { label: "New This Month", value: "18", icon: <TrendingUp className="w-4 h-4 text-violet-600" />, color: "text-violet-700", bg: "bg-violet-50 border-violet-100" },
    { label: "Avg Adherence", value: "76%", icon: <Activity className="w-4 h-4 text-teal-600" />, color: "text-teal-700", bg: "bg-teal-50 border-teal-100" },
  ];

  return (
    <StaffLayout type="ops">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">Operations Dashboard</h1>
            <p className="text-muted-foreground text-sm">Adherence monitoring, escalation tracking, and team coordination.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" className="gap-2 text-xs rounded-full" onClick={() => toast({ title: "Reminders Sent", description: "WhatsApp reminders sent to all patients with missed check-ins." })}>
              <Bell className="w-3.5 h-3.5" /> Send Reminders
            </Button>
            <Button size="sm" variant="outline" className="gap-2 text-xs rounded-full" onClick={() => toast({ title: "Export Started", description: "Generating PDF summary report..." })}>
              <Download className="w-3.5 h-3.5" /> Export Report
            </Button>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {metrics.map((m, i) => (
            <Card key={i} className={`border shadow-sm ${m.bg}`}>
              <CardContent className="p-4">
                <div className="text-muted-foreground text-[10px] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  {m.icon}
                  <span className="truncate">{m.label}</span>
                </div>
                <div className={`text-2xl font-bold ${m.color}`}>{m.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Patient Roster — 2/3 width */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="border-border shadow-sm overflow-hidden">
              <CardHeader className="border-b bg-muted/20 py-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <CardTitle className="text-base text-foreground flex items-center gap-2">
                    Patient Care Roster
                    <span className="flex items-center gap-1.5 ml-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <Badge variant="outline" className="font-mono text-[10px]">Live</Badge>
                    </span>
                  </CardTitle>
                  <div className="relative w-full sm:w-48">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search patients..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="pl-8 h-8 text-xs rounded-lg border-border/60"
                    />
                  </div>
                </div>
              </CardHeader>

              <div className="flex items-center gap-5 px-5 py-2.5 border-b bg-muted/10 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Stable</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Declining</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Urgent</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground bg-muted/20 border-b uppercase">
                    <tr>
                      <th className="px-5 py-3 font-medium">Patient</th>
                      <th className="px-5 py-3 font-medium">Risk</th>
                      <th className="px-5 py-3 font-medium">Adherence</th>
                      <th className="px-5 py-3 font-medium">Coach</th>
                      <th className="px-5 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {filteredPatients.map((patient) => (
                      <tr
                        key={patient.id}
                        className={`transition-colors ${patient.escalated ? "bg-rose-50/40" : "hover:bg-muted/30"}`}
                      >
                        <td className="px-5 py-4">
                          <button onClick={() => setSelectedPatient(patient)} className="text-left group w-full">
                            <div className="font-semibold text-foreground flex items-center gap-2 group-hover:text-primary transition-colors">
                              <span className={`w-2 h-2 rounded-full shrink-0 ${getRiskDot(patient.riskLevel)}`} />
                              {patient.fullName}
                              {patient.escalated && <ShieldAlert className="w-4 h-4 text-rose-500" />}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5 ml-4">
                              Wk {patient.weekNumber} · {patient.plan} · {patient.lastCheckinAt}
                            </div>
                          </button>
                        </td>
                        <td className="px-5 py-4">
                          <Badge variant="outline" className={`uppercase text-[10px] px-2 py-0.5 border ${getRiskStyle(patient.riskLevel)}`}>
                            {patient.riskLevel}
                          </Badge>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-14 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${patient.adherencePct >= 75 ? "bg-emerald-500" : patient.adherencePct >= 50 ? "bg-amber-500" : "bg-rose-500"}`}
                                style={{ width: `${patient.adherencePct}%` }}
                              />
                            </div>
                            <span className={`text-sm font-semibold ${patient.adherencePct < 50 ? "text-rose-600" : patient.adherencePct < 75 ? "text-amber-600" : "text-emerald-600"}`}>
                              {patient.adherencePct}%
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          {patient.assignedCoach ? (
                            <span className="text-sm text-foreground/70">{patient.assignedCoach}</span>
                          ) : (
                            <Select onValueChange={(val) => handleAssignCoach(patient.id, val)}>
                              <SelectTrigger className="h-7 w-32 text-xs border-border/60">
                                <SelectValue placeholder="Assign..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Dr. A. Mehta">Dr. A. Mehta</SelectItem>
                                <SelectItem value="Priya S.">Priya S.</SelectItem>
                                <SelectItem value="Karan V.">Karan V.</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost" size="sm"
                              onClick={() => toast({ title: "Reminder Sent", description: `WhatsApp reminder sent to ${patient.fullName}.` })}
                              className="text-muted-foreground hover:text-sky-600 hover:bg-sky-50 h-7 w-7 p-0"
                            >
                              <Bell className="w-3.5 h-3.5" />
                            </Button>
                            {!patient.escalated ? (
                              <Button
                                variant="outline" size="sm"
                                onClick={() => handleEscalate(patient.id)}
                                className="hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-xs h-7 px-2"
                              >
                                Escalate
                              </Button>
                            ) : (
                              <Badge className="bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-50 font-medium text-xs px-2">
                                Escalated
                              </Badge>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredPatients.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-5 py-12 text-center text-muted-foreground text-sm">
                          No patients match your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Program Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="border-border shadow-sm bg-emerald-50/60">
                <CardContent className="p-4 text-center">
                  <Target className="w-5 h-5 text-emerald-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-emerald-700">68%</p>
                  <p className="text-xs text-emerald-600 mt-0.5">Weekly Goal Completion</p>
                </CardContent>
              </Card>
              <Card className="border-border shadow-sm bg-sky-50/60">
                <CardContent className="p-4 text-center">
                  <Stethoscope className="w-5 h-5 text-sky-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-sky-700">12</p>
                  <p className="text-xs text-sky-600 mt-0.5">Consultations This Week</p>
                </CardContent>
              </Card>
              <Card className="border-border shadow-sm bg-violet-50/60">
                <CardContent className="p-4 text-center">
                  <TrendingUp className="w-5 h-5 text-violet-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-violet-700">-4.2kg</p>
                  <p className="text-xs text-violet-600 mt-0.5">Avg Weight Loss (cohort)</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-5">
            {/* Recent Activity */}
            <Card className="border-border shadow-sm">
              <CardHeader className="border-b pb-3">
                <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Bell className="w-4 h-4 text-primary" /> Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/40">
                  {RECENT_ACTIVITY.map((item, i) => (
                    <div key={i} className="px-4 py-3 flex items-start gap-3">
                      <div className="mt-0.5">{getActivityIcon(item.type)}</div>
                      <div>
                        <p className="text-xs text-foreground/80 leading-snug">{item.msg}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{item.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Coach Performance */}
            <Card className="border-border shadow-sm">
              <CardHeader className="border-b pb-3">
                <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Star className="w-4 h-4 text-primary" /> Care Team Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {COACHES.map((coach, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <img src={coach.img} alt={coach.name} className="w-10 h-10 rounded-full object-cover border border-border shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{coach.name}</p>
                      <p className="text-xs text-muted-foreground">{coach.role} · {coach.patients}p</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-bold ${coach.adherenceAvg >= 75 ? "text-emerald-600" : coach.adherenceAvg >= 50 ? "text-amber-600" : "text-rose-600"}`}>
                        {coach.adherenceAvg}%
                      </p>
                      <p className="text-[10px] text-muted-foreground">adherence</p>
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full text-xs rounded-full mt-2" onClick={() => toast({ title: "Coach Management", description: "Full team management panel coming soon." })}>
                  Manage Care Team
                </Button>
              </CardContent>
            </Card>

            {/* Upcoming Appointments */}
            <Card className="border-border shadow-sm">
              <CardHeader className="border-b pb-3">
                <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-primary" /> Today's Appointments
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3 space-y-3">
                {[
                  { name: "Priya Patel", time: "11:00 AM", coach: "Dr. A. Mehta", type: "Glucose Review" },
                  { name: "Rahul Sharma", time: "12:30 PM", coach: "Priya S.", type: "Nutrition Check-in" },
                  { name: "Suresh Verma", time: "2:00 PM", coach: "Dr. A. Mehta", type: "Medical Review" },
                ].map((appt, i) => (
                  <div key={i} className="flex items-center justify-between text-xs border border-border/50 rounded-xl px-3 py-2.5 hover:bg-muted/30 transition-colors">
                    <div>
                      <p className="font-semibold text-foreground">{appt.name}</p>
                      <p className="text-muted-foreground">{appt.type} · {appt.coach}</p>
                    </div>
                    <span className="font-mono text-primary font-semibold shrink-0">{appt.time}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Patient Detail Slide-Over */}
        {selectedPatient && (
          <div
            className="fixed inset-0 z-50 flex items-start justify-end bg-black/25 backdrop-blur-sm"
            onClick={() => setSelectedPatient(null)}
          >
            <div
              className="bg-white w-full max-w-lg h-full overflow-y-auto shadow-2xl border-l border-border animate-in slide-in-from-right duration-300"
              onClick={e => e.stopPropagation()}
            >
              {/* Sticky Header */}
              <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-border z-10 p-5 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${getRiskDot(selectedPatient.riskLevel)}`} />
                    <h2 className="text-xl font-bold text-foreground">{selectedPatient.fullName}</h2>
                    {selectedPatient.escalated && <ShieldAlert className="w-5 h-5 text-rose-500" />}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">{selectedPatient.plan} Plan</Badge>
                    <Badge variant="outline" className={`text-xs border ${getRiskStyle(selectedPatient.riskLevel)}`}>{selectedPatient.riskLevel} risk</Badge>
                    <span className="text-xs text-muted-foreground">Week {selectedPatient.weekNumber} · Joined {selectedPatient.joinedDate}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedPatient(null)} className="p-1.5 rounded-lg hover:bg-muted transition-colors mt-0.5">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <div className="p-5 space-y-5">
                {/* Contact Info */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4 shrink-0 text-primary" />
                    <span className="truncate">{selectedPatient.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4 shrink-0 text-primary" />
                    <span className="truncate">{selectedPatient.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 shrink-0 text-primary" />
                    <span>{selectedPatient.city} · Age {selectedPatient.age}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Target className="w-4 h-4 shrink-0 text-primary" />
                    <span className="truncate">{selectedPatient.primaryGoal}</span>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-muted/40 rounded-xl p-3 text-center">
                    <p className={`text-lg font-bold ${selectedPatient.adherencePct < 50 ? "text-rose-600" : selectedPatient.adherencePct < 75 ? "text-amber-600" : "text-emerald-600"}`}>
                      {selectedPatient.adherencePct}%
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Adherence</p>
                  </div>
                  <div className="bg-muted/40 rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-foreground">{selectedPatient.streak}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Day Streak</p>
                  </div>
                  <div className="bg-muted/40 rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-sky-700 truncate text-base">{selectedPatient.glucoseAvg}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Avg Glucose</p>
                  </div>
                </div>

                {/* Weight Progress */}
                <div className="bg-gradient-to-br from-primary/5 to-blue-50/60 border border-primary/20 rounded-xl p-4">
                  <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">Weight Journey</p>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-sm font-bold text-muted-foreground">{selectedPatient.startWeight}</p>
                      <p className="text-[10px] text-muted-foreground">Start</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{selectedPatient.weight}</p>
                      <p className="text-[10px] text-muted-foreground">Current</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-emerald-600">{selectedPatient.targetWeight}</p>
                      <p className="text-[10px] text-muted-foreground">Target</p>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 text-sm">
                  {[
                    { label: "Medications", value: selectedPatient.medications },
                    { label: "Assigned Coach", value: selectedPatient.assignedCoach || "Unassigned" },
                    { label: "Next Session", value: selectedPatient.nextSession || "—" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-start gap-2">
                      <span className="text-xs font-semibold text-foreground w-28 shrink-0 pt-0.5">{label}</span>
                      <span className="text-xs text-muted-foreground">{value}</span>
                    </div>
                  ))}
                </div>

                {/* Clinical Notes */}
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                  <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> Clinical Notes
                  </p>
                  <p className="text-sm text-amber-900/80 leading-relaxed">{selectedPatient.notes}</p>
                </div>

                {/* Recent Check-ins */}
                <div>
                  <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">Recent Check-ins</p>
                  <div className="space-y-2">
                    {selectedPatient.checkIns.map((c, i) => (
                      <div key={i} className="bg-muted/30 border border-border/40 rounded-xl px-4 py-3 text-xs">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-foreground">{c.date}</span>
                          {c.glucose !== "—" && (
                            <span className="text-sky-600 font-semibold">Glucose: {c.glucose} mg/dL</span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${c.meals === "Yes" ? "bg-emerald-50 text-emerald-700" : c.meals === "No" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}`}>
                            Meals: {c.meals}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${c.activity ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                            Activity: {c.activity ? "✓" : "✗"}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-muted text-muted-foreground">Energy: {c.energy}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-muted text-muted-foreground">Mood: {c.mood}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 pt-2 border-t border-border">
                  <Button size="sm" className="w-full gap-2 rounded-full" onClick={() => toast({ title: "Reminder Sent", description: `WhatsApp reminder sent to ${selectedPatient.fullName}.` })}>
                    <MessageSquare className="w-4 h-4" /> Send WhatsApp Reminder
                  </Button>
                  <Button size="sm" variant="outline" className="w-full gap-2 rounded-full" onClick={() => toast({ title: "Scheduled", description: "Follow-up call added to queue." })}>
                    <Phone className="w-4 h-4" /> Schedule Follow-up Call
                  </Button>
                  <Button size="sm" variant="outline" className="w-full gap-2 rounded-full" onClick={() => toast({ title: "Notes Updated", description: "Clinical notes saved." })}>
                    <FileText className="w-4 h-4" /> Add Clinical Note
                  </Button>
                  {!selectedPatient.escalated && (
                    <Button size="sm" variant="outline" className="w-full gap-2 rounded-full hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200" onClick={() => handleEscalate(selectedPatient.id)}>
                      <ShieldAlert className="w-4 h-4" /> Escalate to Clinical Team
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </StaffLayout>
  );
}
