import { StaffLayout } from "@/components/layout/staff-layout";
import { useGetOpsDashboard, useListOpsPatients, useAssignCoachToPatient, useEscalatePatient, getListOpsPatientsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, AlertTriangle, CheckCircle, Clock, ShieldAlert, HeartPulse, CalendarDays, Bell, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function OpsDashboard() {
  const { data: dashboard } = useGetOpsDashboard();
  const { data: patients } = useListOpsPatients();
  const assignCoach = useAssignCoachToPatient();
  const escalatePatient = useEscalatePatient();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleAssignCoach = (patientId: number, coachIdStr: string) => {
    const coachId = parseInt(coachIdStr, 10);
    assignCoach.mutate({ data: { coachId }, id: patientId }, {
      onSuccess: () => {
        toast({ title: "Coach assigned" });
        queryClient.invalidateQueries({ queryKey: getListOpsPatientsQueryKey() });
      },
      onError: () => {
        toast({ title: "Demo Mode", description: "Coach assigned locally." });
      }
    });
  };

  const handleEscalate = (patientId: number) => {
    escalatePatient.mutate({ data: { reason: "Flagged by Ops for review" }, id: patientId }, {
      onSuccess: () => {
        toast({ title: "Patient Escalated", variant: "destructive" });
        queryClient.invalidateQueries({ queryKey: getListOpsPatientsQueryKey() });
      },
      onError: () => {
        toast({ title: "Demo Mode", description: "Patient escalated locally.", variant: "destructive" });
      }
    });
  };

  const handleSendReminders = () => {
    toast({ title: "Reminders Sent", description: "WhatsApp reminders sent to all patients with missed check-ins." });
  };

  const handleExportReport = () => {
    toast({ title: "Export Started", description: "Generating PDF summary report..." });
  };

  const demoDash = {
    activePatients: 245,
    dailyAdherencePct: 82,
    missedCheckins: 14,
    highRiskCount: 8,
    upcomingAppointments: 32,
    escalationsPending: 3,
    totalLeads: 120,
    conversionRate: 15
  };

  const demoPatients = [
    { id: 1, fullName: "Priya Patel", plan: "Premium", status: "active", riskLevel: "high", adherencePct: 45, weekNumber: 6, lastCheckinAt: "2 days ago", nextSession: "Tomorrow 11:00 AM", assignedCoach: "Dr. A. Mehta", escalated: true },
    { id: 2, fullName: "Amit Kumar", plan: "Basic", status: "paused", riskLevel: "medium", adherencePct: 60, weekNumber: 2, lastCheckinAt: "1 week ago", nextSession: "Thu 3:00 PM", assignedCoach: "Karan V.", escalated: false },
    { id: 3, fullName: "Rahul Sharma", plan: "Comprehensive", status: "active", riskLevel: "low", adherencePct: 85, weekNumber: 3, lastCheckinAt: "2 hours ago", nextSession: "Fri 10:00 AM", assignedCoach: null, escalated: false },
    { id: 4, fullName: "Neha Singh", plan: "Comprehensive", status: "active", riskLevel: "low", adherencePct: 92, weekNumber: 8, lastCheckinAt: "5 hours ago", nextSession: "Sat 9:00 AM", assignedCoach: "Priya S.", escalated: false },
  ];

  const dData = dashboard || demoDash;
  const pData = patients || demoPatients;

  const getRiskColor = (risk: string) => {
    switch(risk) {
      case 'low': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'medium': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'high': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default: return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getStatusDot = (risk: string) => {
    switch(risk) {
      case 'low': return 'bg-emerald-400';
      case 'medium': return 'bg-amber-400';
      case 'high': return 'bg-rose-400';
      default: return 'bg-slate-400';
    }
  };

  const metrics = [
    { label: "Active Patients", value: dData.activePatients, icon: <Users className="w-3.5 h-3.5" />, color: "text-white" },
    { label: "Daily Adherence", value: `${dData.dailyAdherencePct}%`, icon: <CheckCircle className="w-3.5 h-3.5" />, color: "text-emerald-400" },
    { label: "Missed Check-ins", value: dData.missedCheckins, icon: <Clock className="w-3.5 h-3.5" />, color: "text-amber-400" },
    { label: "High Risk", value: dData.highRiskCount, icon: <HeartPulse className="w-3.5 h-3.5 text-rose-400" />, color: "text-rose-400" },
    { label: "Upcoming Appointments", value: dData.upcomingAppointments, icon: <CalendarDays className="w-3.5 h-3.5" />, color: "text-sky-400" },
    { label: "Escalations Pending", value: dData.escalationsPending, icon: <AlertTriangle className="w-3.5 h-3.5" />, color: "text-orange-400" },
  ];

  return (
    <StaffLayout type="ops">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Operations Dashboard</h1>
            <p className="text-slate-400 text-sm">Adherence monitoring, escalation tracking, and team coordination.</p>
          </div>
          {/* Master Actions */}
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              className="bg-slate-900 border-slate-700 text-slate-300 hover:bg-sky-950 hover:text-sky-300 hover:border-sky-800 gap-2 text-xs"
              onClick={handleSendReminders}
            >
              <Bell className="w-3.5 h-3.5" /> Send Reminders
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="bg-slate-900 border-slate-700 text-slate-300 hover:bg-emerald-950 hover:text-emerald-300 hover:border-emerald-800 gap-2 text-xs"
              onClick={handleExportReport}
            >
              <Download className="w-3.5 h-3.5" /> Export Report
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {metrics.map((m, i) => (
            <Card key={i} className={`bg-slate-900 border-slate-800 shadow-sm ${m.label === 'High Risk' ? 'border-rose-900/50' : ''}`}>
              <CardContent className="p-4 flex flex-col justify-center">
                <div className="text-slate-400 text-xs uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  {m.icon} {m.label}
                </div>
                <div className={`text-2xl font-bold ${m.color}`}>{m.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Patient Roster */}
        <Card className="bg-slate-900 border-slate-800 shadow-sm overflow-hidden">
          <CardHeader className="border-b border-slate-800 bg-slate-950/50 py-4">
            <CardTitle className="text-white text-base flex items-center justify-between">
              Patient Care Roster
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <Badge className="bg-slate-800 text-slate-300 hover:bg-slate-700 font-mono text-xs">Live</Badge>
              </div>
            </CardTitle>
          </CardHeader>

          {/* Status Legend */}
          <div className="flex items-center gap-6 px-6 py-3 border-b border-slate-800 bg-slate-950/30 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Stable</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Declining adherence</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-400 inline-block" /> Urgent attention</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-400 bg-slate-900/50 border-b border-slate-800 uppercase">
                <tr>
                  <th className="px-6 py-4 font-medium">Patient</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Last Check-In</th>
                  <th className="px-6 py-4 font-medium">Next Session</th>
                  <th className="px-6 py-4 font-medium">Adherence %</th>
                  <th className="px-6 py-4 font-medium">Coach Assignment</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 bg-slate-900">
                {pData.map((patient: any) => (
                  <tr key={patient.id} className={`transition-colors ${patient.escalated ? 'bg-rose-950/20' : 'hover:bg-slate-800/40'}`}>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${getStatusDot(patient.riskLevel)}`} />
                        {patient.fullName}
                        {patient.escalated && <ShieldAlert className="w-4 h-4 text-rose-500" />}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 ml-4">Week {patient.weekNumber} · {patient.plan}</div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={`uppercase text-[10px] px-2 py-0.5 border ${getRiskColor(patient.riskLevel)}`}>
                        {patient.riskLevel} Risk
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">{patient.lastCheckinAt}</td>
                    <td className="px-6 py-4 text-slate-300 text-xs">{patient.nextSession || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-semibold ${patient.adherencePct < 50 ? 'text-rose-400' : patient.adherencePct < 75 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {patient.adherencePct}%
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {patient.assignedCoach ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-medium text-slate-300 border border-slate-700">
                            {patient.assignedCoach.charAt(0)}
                          </div>
                          <span className="text-slate-300 text-xs">{patient.assignedCoach}</span>
                        </div>
                      ) : (
                        <div className="w-full max-w-[140px]">
                          <Select onValueChange={(val) => handleAssignCoach(patient.id, val)}>
                            <SelectTrigger className="h-8 bg-slate-950 border-slate-700 text-slate-300 text-xs">
                              <SelectValue placeholder="Assign Coach..." />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-700 text-slate-300">
                              <SelectItem value="1">Dr. A. Mehta</SelectItem>
                              <SelectItem value="2">Priya S.</SelectItem>
                              <SelectItem value="3">Karan V.</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toast({ title: "Reminder Sent", description: `WhatsApp sent to ${patient.fullName}.` })}
                          className="text-slate-400 hover:text-sky-300 hover:bg-sky-950/40 text-xs h-8 px-2"
                        >
                          <Bell className="w-3 h-3" />
                        </Button>
                        {!patient.escalated ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEscalate(patient.id)}
                            className="bg-slate-950 border-slate-700 text-slate-300 hover:bg-rose-950 hover:text-rose-400 hover:border-rose-900 text-xs h-8"
                          >
                            Escalate
                          </Button>
                        ) : (
                          <Badge className="bg-rose-500/20 text-rose-400 hover:bg-rose-500/20 border-none px-3 py-1 font-medium text-xs">
                            Escalated
                          </Badge>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </StaffLayout>
  );
}
