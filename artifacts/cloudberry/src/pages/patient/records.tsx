import { PatientLayout } from "@/components/layout/patient-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, FileText, Activity, Inbox } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const API = `${BASE}/api`;

async function fetchJson(path: string) {
  const token = localStorage.getItem("cloudberry_token");
  const r = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
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

function EmptyBlock({ icon: Icon, title, body }: { icon: any; title: string; body: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4">
      <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3"><Icon className="w-6 h-6 text-muted-foreground" /></div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground mt-1 max-w-xs">{body}</p>
    </div>
  );
}

export default function PatientRecords() {
  const qc = useQueryClient();
  const { data: dash, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: () => fetchJson("/patients/me/dashboard") });
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("weight");
  const [value, setValue] = useState("");

  const addMetric = useMutation({
    mutationFn: () => postJson("/metrics", {
      type, value: parseFloat(value), date: new Date().toISOString().slice(0, 10),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setOpen(false); setValue("");
    },
  });

  const weightData = (dash?.weightSeries ?? []).map((d: any) => ({
    date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    weight: d.value,
  }));
  const glucoseReadings = (dash?.glucoseSeries ?? []).slice(-10).reverse().map((g: any) => ({
    val: g.value,
    date: new Date(g.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
    status: g.value <= 100 ? "normal" : g.value <= 140 ? "elevated" : "high",
  }));
  const carePlan = dash?.carePlan;

  return (
    <PatientLayout>
      <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Health Records</h1>
            <p className="text-muted-foreground text-sm">Track your metrics and review clinical notes.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full shadow-sm gap-2"><Plus className="w-4 h-4" /> Add Reading</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add a metric reading</DialogTitle></DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weight">Weight (kg)</SelectItem>
                      <SelectItem value="glucose">Glucose (mg/dL)</SelectItem>
                      <SelectItem value="blood_pressure_systolic">BP — Systolic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Value</Label>
                  <Input type="number" step="0.1" value={value} onChange={e => setValue(e.target.value)} placeholder="e.g. 78.5" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={() => addMetric.mutate()} disabled={!value || addMetric.isPending}>{addMetric.isPending ? "Saving…" : "Save"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="trends" className="w-full">
          <TabsList className="w-full max-w-md grid grid-cols-3 mb-6 bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="trends" className="rounded-lg">Trends</TabsTrigger>
            <TabsTrigger value="readings" className="rounded-lg">Readings</TabsTrigger>
            <TabsTrigger value="notes" className="rounded-lg">Care Plan</TabsTrigger>
          </TabsList>

          <TabsContent value="trends" className="space-y-6">
            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle>Weight Progress</CardTitle>
                <CardDescription>
                  {dash?.patient?.targetWeight
                    ? `Tracking towards target of ${dash.patient.targetWeight}kg`
                    : "Track your weight over time"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-sm text-muted-foreground py-12 text-center">Loading…</p>
                ) : weightData.length === 0 ? (
                  <EmptyBlock icon={Activity} title="No weight readings yet" body="Tap 'Add Reading' to log your first weight and start tracking progress." />
                ) : (
                  <div className="h-[300px] w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={weightData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 12 }} dy={10} />
                        <YAxis domain={["dataMin - 2", "dataMax + 2"]} axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 12 }} dx={-10} />
                        <Tooltip contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} formatter={(v: number) => [`${v} kg`, "Weight"]} />
                        <Line type="monotone" dataKey="weight" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="readings">
            <Card className="border-border/60 shadow-sm">
              <CardHeader><CardTitle className="text-lg">Recent Glucose Readings</CardTitle></CardHeader>
              <CardContent>
                {glucoseReadings.length === 0 ? (
                  <EmptyBlock icon={Inbox} title="No readings yet" body="Add a glucose reading to start tracking." />
                ) : (
                  <div className="space-y-3">
                    {glucoseReadings.map((g: any, i: number) => (
                      <div key={i} className="flex justify-between items-center p-3 rounded-lg border border-border/40">
                        <div>
                          <div className="font-medium text-foreground">Reading</div>
                          <div className="text-xs text-muted-foreground">{g.date}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg">{g.val} <span className="text-xs font-normal text-muted-foreground">mg/dL</span></div>
                          <div className={`text-xs font-medium ${g.status === "normal" ? "text-green-600" : g.status === "elevated" ? "text-amber-600" : "text-red-600"}`}>
                            {g.status === "normal" ? "In range" : g.status === "elevated" ? "Elevated" : "High"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes" className="space-y-4">
            {!dash?.careAssigned ? (
              <Card className="border-dashed border-border/60 bg-muted/20">
                <CardContent className="py-8"><EmptyBlock icon={FileText} title="Care plan pending" body="Your care team will provide a personalised plan after Operations completes your onboarding." /></CardContent>
              </Card>
            ) : !carePlan || (!carePlan.nutritionPlan && !carePlan.activityPlan && !carePlan.weeklyGoals) ? (
              <Card className="border-dashed border-border/60 bg-muted/20">
                <CardContent className="py-8"><EmptyBlock icon={FileText} title="Plan being prepared" body="Your care team is finalising your plan. Check back soon." /></CardContent>
              </Card>
            ) : (
              <Card className="border-border/60 shadow-sm">
                <CardContent className="p-6 space-y-5 text-sm text-foreground/80 leading-relaxed">
                  {carePlan.weeklyGoals && <div><Badge variant="outline" className="mb-2">Weekly Goals</Badge><p>{carePlan.weeklyGoals}</p></div>}
                  {carePlan.nutritionPlan && <div><Badge variant="outline" className="mb-2">Nutrition</Badge><p>{carePlan.nutritionPlan}</p></div>}
                  {carePlan.activityPlan && <div><Badge variant="outline" className="mb-2">Activity</Badge><p>{carePlan.activityPlan}</p></div>}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PatientLayout>
  );
}
