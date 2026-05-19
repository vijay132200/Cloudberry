import type React from "react";
import { PatientLayout } from "@/components/layout/patient-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, Video, User, Stethoscope, Apple, HeartHandshake, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

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
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error("Failed");
  return r.json();
}
async function postJson(path: string, body: any) {
  const token = localStorage.getItem("cloudberry_token");
  const r = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error("Failed");
  return r.json();
}

const roleIcons: Record<string, React.ElementType> = {
  physician: Stethoscope, dietician: Apple, caretaker: HeartHandshake, coach: User,
};
const roleColors: Record<string, string> = {
  physician: "bg-blue-50 text-blue-700 border-blue-200",
  dietician: "bg-green-50 text-green-700 border-green-200",
  caretaker: "bg-purple-50 text-purple-700 border-purple-200",
  coach: "bg-primary/10 text-primary border-primary/20",
};
const statusColors: Record<string, string> = {
  upcoming: "bg-green-50 text-green-700 border-green-200",
  reschedule_requested: "bg-amber-50 text-amber-700 border-amber-200",
  requested: "bg-blue-50 text-blue-700 border-blue-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  completed: "bg-muted text-muted-foreground",
};

function fmtDate(iso: string) { return new Date(iso).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }); }
function fmtTime(iso: string) { return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }); }
function isUpcoming(iso: string) { return new Date(iso) > new Date(); }

export default function AppointmentsPage() {
  const qc = useQueryClient();
  const { data: appointments = [], isLoading } = useQuery({ queryKey: ["appointments"], queryFn: () => fetchJson("/appointments") });

  const [reschedule, setReschedule] = useState<any | null>(null);
  const [newDate, setNewDate] = useState("");
  const [reason, setReason] = useState("");
  const [ticketOpen, setTicketOpen] = useState(false);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMsg, setTicketMsg] = useState("");

  const rescheduleMut = useMutation({
    mutationFn: () => patchJson(`/appointments/${reschedule.id}/reschedule`, { newDate, reason }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["appointments"] }); setReschedule(null); setNewDate(""); setReason(""); },
  });
  const cancelMut = useMutation({
    mutationFn: (id: number) => patchJson(`/appointments/${id}/cancel`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appointments"] }),
  });
  const ticketMut = useMutation({
    mutationFn: () => postJson("/appointments/tickets", { subject: ticketSubject, message: ticketMsg }),
    onSuccess: () => { setTicketOpen(false); setTicketSubject(""); setTicketMsg(""); alert("Ticket submitted. The care team will respond shortly."); },
  });

  const active = appointments.filter((a: any) => a.status !== "cancelled" && a.status !== "completed");
  const upcoming = active.filter((a: any) => isUpcoming(a.scheduledAt));
  const past = appointments.filter((a: any) => !isUpcoming(a.scheduledAt) || a.status === "completed" || a.status === "cancelled");

  return (
    <PatientLayout>
      <div className="p-4 md:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Appointments</h1>
            <p className="text-muted-foreground text-sm mt-1">Your scheduled sessions and support requests.</p>
          </div>
          <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setTicketOpen(true)}>Raise a request</Button>
        </div>

        {isLoading ? (
          <div className="text-sm text-muted-foreground py-12 text-center">Loading…</div>
        ) : (
          <>
            <section>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Upcoming ({upcoming.length})</h2>
              {upcoming.length === 0 ? (
                <Card className="border-dashed border-border/60 bg-muted/20">
                  <CardContent className="py-10 text-center space-y-2">
                    <Calendar className="w-8 h-8 text-muted-foreground mx-auto" />
                    <p className="text-sm font-medium text-foreground">No upcoming meetings</p>
                    <p className="text-xs text-muted-foreground">Your care team will schedule sessions here.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {upcoming.map((appt: any) => {
                    const RoleIcon = roleIcons[appt.role?.toLowerCase()] ?? User;
                    return (
                      <Card key={appt.id} className="border-border/60 shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><RoleIcon className="w-5 h-5 text-primary" /></div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 flex-wrap">
                                <div>
                                  <p className="font-semibold text-foreground text-sm">{appt.careTeamMember}</p>
                                  <Badge variant="outline" className={`text-[10px] mt-0.5 ${roleColors[appt.role?.toLowerCase()] ?? ""}`}>
                                    {appt.role}
                                  </Badge>
                                </div>
                                <Badge className={`text-[10px] border ${statusColors[appt.status] ?? "bg-muted"}`}>{appt.status.replace("_", " ")}</Badge>
                              </div>
                              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{fmtDate(appt.scheduledAt)}</span>
                                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{fmtTime(appt.scheduledAt)}</span>
                              </div>
                              {appt.notes && <p className="text-xs text-muted-foreground mt-2 bg-muted/40 rounded-lg px-3 py-2">{appt.notes}</p>}
                              <div className="flex gap-2 mt-3 flex-wrap">
                                <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs" onClick={() => { setReschedule(appt); setNewDate(""); setReason(""); }}>Reschedule</Button>
                                <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => { if (confirm("Cancel this appointment?")) cancelMut.mutate(appt.id); }}><X className="w-3.5 h-3.5 mr-1" /> Cancel</Button>
                                <Button size="sm" className="h-8 rounded-lg text-xs gap-1.5 ml-auto"><Video className="w-3.5 h-3.5" /> Join</Button>
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

            {past.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Past & Cancelled</h2>
                <div className="space-y-2">
                  {past.map((appt: any) => {
                    const RoleIcon = roleIcons[appt.role?.toLowerCase()] ?? User;
                    return (
                      <Card key={appt.id} className="border-border/40 bg-muted/20 opacity-80">
                        <CardContent className="p-3 flex gap-3 items-center">
                          <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0"><RoleIcon className="w-4 h-4 text-muted-foreground" /></div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground text-sm truncate">{appt.careTeamMember}</p>
                            <p className="text-xs text-muted-foreground truncate">{fmtDate(appt.scheduledAt)} · {fmtTime(appt.scheduledAt)}</p>
                          </div>
                          <Badge variant="outline" className={`text-[10px] ${statusColors[appt.status] ?? ""}`}>{appt.status}</Badge>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}

        {/* Reschedule modal */}
        <Dialog open={!!reschedule} onOpenChange={(v) => !v && setReschedule(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Reschedule</DialogTitle>
              <DialogDescription>Your care team will confirm the new time.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2"><Label>New preferred date & time</Label><Input type="datetime-local" value={newDate} onChange={e => setNewDate(e.target.value)} /></div>
              <div className="space-y-2"><Label>Reason (optional)</Label><Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Conflicting commitment, travel…" rows={3} /></div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setReschedule(null)}>Close</Button>
              <Button onClick={() => rescheduleMut.mutate()} disabled={!newDate || rescheduleMut.isPending}>{rescheduleMut.isPending ? "Submitting…" : "Submit"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Ticket modal */}
        <Dialog open={ticketOpen} onOpenChange={setTicketOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Raise a Support Request</DialogTitle>
              <DialogDescription>Send a question or issue to the care team.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2"><Label>Subject</Label><Input value={ticketSubject} onChange={e => setTicketSubject(e.target.value)} placeholder="e.g. Question about meal plan" /></div>
              <div className="space-y-2"><Label>Message</Label><Textarea value={ticketMsg} onChange={e => setTicketMsg(e.target.value)} placeholder="Describe your question or issue…" rows={5} /></div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setTicketOpen(false)}>Close</Button>
              <Button onClick={() => ticketMut.mutate()} disabled={!ticketMsg.trim() || ticketMut.isPending}>{ticketMut.isPending ? "Sending…" : "Submit"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PatientLayout>
  );
}
