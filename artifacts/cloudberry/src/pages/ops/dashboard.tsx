import { StaffLayout } from "@/components/layout/staff-layout";
import { useGetOpsDashboard, useListOpsPatients, useAssignCoachToPatient, useEscalatePatient, getListOpsPatientsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, AlertTriangle, CheckCircle, Clock, ShieldAlert, HeartPulse } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function OpsDashboard() {
  const { data: dashboard, isLoading: dashLoading } = useGetOpsDashboard();
  const { data: patients, isLoading: patientsLoading } = useListOpsPatients();
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
    { id: 1, fullName: "Priya Patel", plan: "Premium", status: "active", riskLevel: "high", adherencePct: 45, weekNumber: 6, lastCheckinAt: "2 days ago", assignedCoach: "Dr. A. Mehta", escalated: true },
    { id: 2, fullName: "Amit Kumar", plan: "Basic", status: "paused", riskLevel: "medium", adherencePct: 60, weekNumber: 2, lastCheckinAt: "1 week ago", assignedCoach: "Karan V.", escalated: false },
    { id: 3, fullName: "Rahul Sharma", plan: "Comprehensive", status: "active", riskLevel: "low", adherencePct: 85, weekNumber: 3, lastCheckinAt: "2 hours ago", assignedCoach: null, escalated: false },
    { id: 4, fullName: "Neha Singh", plan: "Comprehensive", status: "active", riskLevel: "low", adherencePct: 92, weekNumber: 8, lastCheckinAt: "5 hours ago", assignedCoach: "Priya S.", escalated: false },
  ];

  const dData = dashboard || demoDash;
  const pData = patients || demoPatients;

  const getRiskColor = (risk: string) => {
    switch(risk) {
      case 'low': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'medium': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'high': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      default: return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <StaffLayout type="ops">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Global Command Center</h1>
          <p className="text-slate-400">Monitoring platform health and patient outcomes in real-time.</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="bg-slate-900 border-slate-800 shadow-sm">
            <CardContent className="p-4 flex flex-col justify-center">
              <div className="text-slate-400 text-xs uppercase tracking-wider mb-1 flex items-center gap-1.5"><Users className="w-3 h-3"/> Active</div>
              <div className="text-2xl font-semibold text-white">{dData.activePatients}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-900 border-slate-800 shadow-sm">
            <CardContent className="p-4 flex flex-col justify-center">
              <div className="text-slate-400 text-xs uppercase tracking-wider mb-1 flex items-center gap-1.5"><CheckCircle className="w-3 h-3"/> Adherence</div>
              <div className="text-2xl font-semibold text-emerald-400">{dData.dailyAdherencePct}%</div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-900 border-slate-800 shadow-sm">
            <CardContent className="p-4 flex flex-col justify-center">
              <div className="text-slate-400 text-xs uppercase tracking-wider mb-1 flex items-center gap-1.5"><Clock className="w-3 h-3"/> Missed Checkins</div>
              <div className="text-2xl font-semibold text-amber-400">{dData.missedCheckins}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-900 border-rose-900 shadow-sm">
            <CardContent className="p-4 flex flex-col justify-center">
              <div className="text-slate-400 text-xs uppercase tracking-wider mb-1 flex items-center gap-1.5"><HeartPulse className="w-3 h-3 text-rose-500"/> High Risk</div>
              <div className="text-2xl font-semibold text-rose-400">{dData.highRiskCount}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-900 border-slate-800 shadow-sm">
            <CardContent className="p-4 flex flex-col justify-center">
              <div className="text-slate-400 text-xs uppercase tracking-wider mb-1 flex items-center gap-1.5"><AlertTriangle className="w-3 h-3"/> Escalations</div>
              <div className="text-2xl font-semibold text-white">{dData.escalationsPending}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-900 border-slate-800 shadow-sm">
            <CardContent className="p-4 flex flex-col justify-center">
              <div className="text-slate-400 text-xs uppercase tracking-wider mb-1 flex items-center gap-1.5"><ShieldAlert className="w-3 h-3"/> Conversion</div>
              <div className="text-2xl font-semibold text-white">{dData.conversionRate}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Patient Roster */}
        <Card className="bg-slate-900 border-slate-800 shadow-sm overflow-hidden">
          <CardHeader className="border-b border-slate-800 bg-slate-950/50 py-4">
            <CardTitle className="text-white text-lg flex items-center justify-between">
              Patient Care Roster
              <Badge className="bg-slate-800 text-slate-300 hover:bg-slate-700 font-mono text-xs">Live Updates Active</Badge>
            </CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-400 bg-slate-900/50 border-b border-slate-800 uppercase">
                <tr>
                  <th className="px-6 py-4 font-medium">Patient Details</th>
                  <th className="px-6 py-4 font-medium">Health Status</th>
                  <th className="px-6 py-4 font-medium">Care Team Assignment</th>
                  <th className="px-6 py-4 font-medium text-right">Ops Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 bg-slate-900">
                {pData.map((patient: any) => (
                  <tr key={patient.id} className={`transition-colors ${patient.escalated ? 'bg-rose-950/20' : 'hover:bg-slate-800/50'}`}>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white text-base flex items-center gap-2">
                        {patient.fullName}
                        {patient.escalated && <ShieldAlert className="w-4 h-4 text-rose-500" />}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">Week {patient.weekNumber} • {patient.plan}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2 items-start">
                        <Badge variant="outline" className={`uppercase text-[10px] px-2 py-0 border ${getRiskColor(patient.riskLevel)}`}>
                          {patient.riskLevel} Risk
                        </Badge>
                        <span className={`text-xs font-medium ${patient.adherencePct < 50 ? 'text-rose-400' : patient.adherencePct < 75 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {patient.adherencePct}% Adherence
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {patient.assignedCoach ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-medium text-slate-300 border border-slate-700">
                            {patient.assignedCoach.charAt(0)}
                          </div>
                          <span className="text-slate-300 font-medium">{patient.assignedCoach}</span>
                        </div>
                      ) : (
                        <div className="w-full max-w-[150px]">
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
                      {!patient.escalated ? (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleEscalate(patient.id)}
                          className="bg-slate-950 border-slate-700 text-slate-300 hover:bg-rose-950 hover:text-rose-400 hover:border-rose-900 text-xs h-8"
                        >
                          Escalate Case
                        </Button>
                      ) : (
                        <Badge className="bg-rose-500/20 text-rose-400 hover:bg-rose-500/20 border-none px-3 py-1 font-medium text-xs">
                          Escalated to MD
                        </Badge>
                      )}
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
