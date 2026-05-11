import { PatientLayout } from "@/components/layout/patient-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Download, FileText, Activity } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function PatientRecords() {
  const weightData = [
    { date: 'Week 1', weight: 82.5 },
    { date: 'Week 2', weight: 81.8 },
    { date: 'Week 3', weight: 81.0 },
    { date: 'Week 4', weight: 80.2 },
    { date: 'Week 5', weight: 79.5 },
    { date: 'Week 6', weight: 78.8 },
    { date: 'Current', weight: 78.1 },
  ];

  return (
    <PatientLayout>
      <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">Health Records</h1>
            <p className="text-muted-foreground">Track your progress and access your medical documents.</p>
          </div>
          <Button className="rounded-full shadow-sm gap-2" data-testid="btn-add-metric">
            <Plus className="w-4 h-4" /> Add Metric
          </Button>
        </div>

        <Tabs defaultValue="trends" className="w-full">
          <TabsList className="w-full max-w-md grid grid-cols-3 mb-6 bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="trends" className="rounded-lg">Trends</TabsTrigger>
            <TabsTrigger value="labs" className="rounded-lg">Lab Reports</TabsTrigger>
            <TabsTrigger value="notes" className="rounded-lg">Consult Notes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="trends" className="space-y-6">
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle>Weight Progress</CardTitle>
                <CardDescription>Tracking towards target weight of 70kg</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weightData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} dy={10} />
                      <YAxis domain={['dataMin - 2', 'dataMax + 2']} axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} dx={-10} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value) => [`${value} kg`, 'Weight']}
                      />
                      <Line type="monotone" dataKey="weight" stroke="hsl(var(--primary))" strokeWidth={3} dot={{r: 4, fill: "hsl(var(--primary))", strokeWidth: 2, stroke: "#fff"}} activeDot={{r: 6}} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Recent Glucose Readings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { val: 92, type: "Fasting", date: "Today, 8:00 AM", status: "normal" },
                      { val: 124, type: "Post-meal", date: "Yesterday, 2:00 PM", status: "normal" },
                      { val: 95, type: "Fasting", date: "Yesterday, 7:30 AM", status: "normal" }
                    ].map((g, i) => (
                      <div key={i} className="flex justify-between items-center p-3 rounded-lg border border-border/50">
                        <div>
                          <div className="font-medium text-foreground">{g.type}</div>
                          <div className="text-xs text-muted-foreground">{g.date}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg">{g.val} <span className="text-xs font-normal text-muted-foreground">mg/dL</span></div>
                          <div className="text-xs text-primary font-medium">In range</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border shadow-sm bg-primary/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    Clinical Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-foreground/80 leading-relaxed">
                  <p className="mb-2">Excellent progress this month. You've consistently maintained fasting glucose under 100mg/dL and lost 1.5kg.</p>
                  <p>Keep prioritizing morning protein and the post-dinner walks. We will review your HbA1c at the end of Week 12 to consider reducing your Metformin dosage.</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="labs">
            <Card className="border-border shadow-sm">
              <CardContent className="p-0">
                <div className="divide-y">
                  {[
                    { name: "Comprehensive Metabolic Panel", date: "Sep 10, 2025", provider: "PathLabs Inc." },
                    { name: "HbA1c & Fasting Insulin", date: "Sep 10, 2025", provider: "PathLabs Inc." },
                    { name: "Thyroid Profile (T3, T4, TSH)", date: "Jan 15, 2025", provider: "City Hospital" }
                  ].map((lab, i) => (
                    <div key={i} className="p-4 flex justify-between items-center hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground">{lab.name}</h4>
                          <p className="text-xs text-muted-foreground">{lab.date} • {lab.provider}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary rounded-full">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="notes">
            <div className="space-y-4">
              {[
                { doc: "Dr. A. Mehta", role: "Obesity Medicine", date: "Oct 1, 2025", excerpt: "Patient is responding well to initial lifestyle interventions. Weight is trending down. Fasting glucose stabilizing. Advised to continue current nutrition protocol. Plan to re-evaluate labs in 8 weeks." },
                { doc: "Priya S.", role: "Nutritionist", date: "Sep 15, 2025", excerpt: "Discussed struggles with afternoon sugar cravings. Swapped afternoon snack from fruit alone to apple with almonds to increase fat/fiber ratio. Patient reported better satiety." }
              ].map((note, i) => (
                <Card key={i} className="border-border shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-foreground">{note.doc}</h4>
                        <p className="text-xs text-primary">{note.role}</p>
                      </div>
                      <Badge variant="outline" className="text-xs font-normal text-muted-foreground border-border bg-transparent">{note.date}</Badge>
                    </div>
                    <p className="text-sm text-foreground/80 bg-muted/50 p-3 rounded-lg">{note.excerpt}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PatientLayout>
  );
}
