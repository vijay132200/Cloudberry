import { StaffLayout } from "@/components/layout/staff-layout";
import { useListCoachPatients } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Filter } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function CoachPatients() {
  const { data: patients, isLoading } = useListCoachPatients();
  const [, setLocation] = useLocation();

  const displayPatients = patients ?? [];

  const getRiskColor = (risk: string) => {
    switch(risk) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return 'bg-primary/10 text-primary border-primary/20';
      case 'paused': return 'bg-muted text-muted-foreground border-border';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <StaffLayout type="coach">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Patients</h1>
            <p className="text-sm text-muted-foreground">
            {isLoading ? "Loading patients…" : `You are currently managing ${displayPatients.length} active patient${displayPatients.length !== 1 ? "s" : ""}.`}
          </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search patients..." className="pl-9 bg-white" />
            </div>
            <Button variant="outline" size="icon" className="bg-white"><Filter className="h-4 w-4"/></Button>
          </div>
        </div>

        <Card className="shadow-sm border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground bg-muted/50 border-b uppercase">
                <tr>
                  <th className="px-6 py-4 font-medium">Patient</th>
                  <th className="px-6 py-4 font-medium">Status / Plan</th>
                  <th className="px-6 py-4 font-medium">Risk / Adherence</th>
                  <th className="px-6 py-4 font-medium">Last Check-in</th>
                  <th className="px-6 py-4 font-medium">Next Session</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {isLoading && (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-muted-foreground text-sm">Loading patients from database…</td></tr>
                )}
                {!isLoading && displayPatients.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-muted-foreground text-sm">No patients assigned to you yet.</td></tr>
                )}
                {displayPatients.map((patient: any) => (
                  <tr 
                    key={patient.id} 
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => setLocation(`/coach/patients/${patient.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-foreground text-base">{patient.fullName}</div>
                      <div className="text-xs text-muted-foreground">Week {patient.weekNumber}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 items-start">
                        <Badge variant="outline" className={`uppercase text-[10px] px-2 py-0 ${getStatusColor(patient.status)}`}>
                          {patient.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{patient.plan}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 items-start">
                        <Badge variant="outline" className={`uppercase text-[10px] px-2 py-0 ${getRiskColor(patient.riskLevel)}`}>
                          {patient.riskLevel} Risk
                        </Badge>
                        <span className="text-xs font-medium">{patient.adherencePct}% Adherence</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {patient.lastCheckinAt || "Never"}
                    </td>
                    <td className="px-6 py-4 text-foreground font-medium">
                      {patient.nextSessionAt || "-"}
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
