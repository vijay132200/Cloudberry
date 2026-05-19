import { PatientLayout } from "@/components/layout/patient-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Video, User, Stethoscope, Apple, HeartHandshake } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const API = `${BASE}/api`;

async function fetchJson(path: string) {
  const token = localStorage.getItem("cloudberry_token");
  const r = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error("Failed to fetch");
  return r.json();
}

const roleIcons: Record<string, React.ElementType> = {
  physician: Stethoscope,
  dietician: Apple,
  caretaker: HeartHandshake,
  coach: User,
};

const roleColors: Record<string, string> = {
  physician: "bg-blue-50 text-blue-700 border-blue-200",
  dietician: "bg-green-50 text-green-700 border-green-200",
  caretaker: "bg-purple-50 text-purple-700 border-purple-200",
  coach: "bg-primary/10 text-primary border-primary/20",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}
function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}
function isUpcoming(iso: string) {
  return new Date(iso) > new Date();
}

export default function AppointmentsPage() {
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["appointments"],
    queryFn: () => fetchJson("/appointments"),
    retry: 1,
  });

  const storedName = localStorage.getItem("cloudberry_name") || "Rahul Sharma";

  const demoAppointments = [
    {
      id: 1, careTeamMember: "Dr. Arjun Mehta", role: "physician",
      scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      status: "upcoming", notes: "Routine metabolic review – bring recent glucose readings",
      imageUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=80&q=80"
    },
    {
      id: 2, careTeamMember: "Priya Sharma", role: "dietician",
      scheduledAt: new Date(Date.now() + 3 * 86400000).toISOString(),
      status: "upcoming", notes: "Weekly nutrition review – discuss meal plan adjustments",
      imageUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=80&q=80"
    },
    {
      id: 3, careTeamMember: "Rajesh Kumar", role: "caretaker",
      scheduledAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      status: "upcoming", notes: "Progress check-in call",
      imageUrl: null
    },
    {
      id: 4, careTeamMember: "Dr. Arjun Mehta", role: "physician",
      scheduledAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      status: "completed", notes: "Initial consultation – assessment completed",
      imageUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=80&q=80"
    },
  ];

  const displayAppointments = appointments.length > 0 ? appointments : demoAppointments;
  const upcoming = displayAppointments.filter((a: any) => isUpcoming(a.scheduledAt));
  const past = displayAppointments.filter((a: any) => !isUpcoming(a.scheduledAt));

  return (
    <PatientLayout>
      <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Appointments</h1>
          <p className="text-muted-foreground text-sm mt-1">Your upcoming and past care team sessions.</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">Loading appointments…</div>
        ) : (
          <>
            {/* Upcoming */}
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Upcoming ({upcoming.length})</h2>
              {upcoming.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-10 text-center text-muted-foreground text-sm">No upcoming appointments scheduled.</CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {upcoming.map((appt: any) => {
                    const RoleIcon = roleIcons[appt.role] ?? User;
                    return (
                      <Card key={appt.id} className="border-border shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex gap-4">
                            <div className="shrink-0">
                              {appt.imageUrl ? (
                                <img src={appt.imageUrl} alt={appt.careTeamMember} className="w-12 h-12 rounded-full object-cover border" />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                  <RoleIcon className="w-5 h-5 text-primary" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 flex-wrap">
                                <div>
                                  <p className="font-semibold text-foreground text-sm">{appt.careTeamMember}</p>
                                  <Badge variant="outline" className={`text-[10px] mt-0.5 ${roleColors[appt.role] ?? ""}`}>
                                    {appt.role.charAt(0).toUpperCase() + appt.role.slice(1)}
                                  </Badge>
                                </div>
                                <Badge className="bg-green-50 text-green-700 border border-green-200 text-[10px]">Upcoming</Badge>
                              </div>
                              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{formatDate(appt.scheduledAt)}</span>
                                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{formatTime(appt.scheduledAt)}</span>
                              </div>
                              {appt.notes && (
                                <p className="text-xs text-muted-foreground mt-2 bg-muted/40 rounded-lg px-3 py-2">{appt.notes}</p>
                              )}
                              <div className="flex gap-2 mt-3">
                                <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs">Reschedule</Button>
                                <Button size="sm" className="h-8 rounded-lg text-xs gap-1.5">
                                  <Video className="w-3.5 h-3.5" /> Join Call
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Past */}
            {past.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Past Sessions</h2>
                <div className="space-y-2">
                  {past.map((appt: any) => {
                    const RoleIcon = roleIcons[appt.role] ?? User;
                    return (
                      <Card key={appt.id} className="border-border/50 bg-muted/20 opacity-75">
                        <CardContent className="p-4">
                          <div className="flex gap-3 items-center">
                            <div className="shrink-0">
                              {appt.imageUrl ? (
                                <img src={appt.imageUrl} alt={appt.careTeamMember} className="w-9 h-9 rounded-full object-cover border grayscale" />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                                  <RoleIcon className="w-4 h-4 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-foreground text-sm">{appt.careTeamMember}</p>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                <span>{formatDate(appt.scheduledAt)} · {formatTime(appt.scheduledAt)}</span>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-[10px] text-muted-foreground">Completed</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </PatientLayout>
  );
}
