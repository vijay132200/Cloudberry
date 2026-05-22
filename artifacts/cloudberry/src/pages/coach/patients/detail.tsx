import { StaffLayout } from "@/components/layout/staff-layout";
import { useGetCoachPatientDetail, useAddPatientNote, useUpdatePatientPlan, getGetCoachPatientDetailQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRoute } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { ArrowLeft, MessageSquare, AlertCircle, FileText, CheckCircle2, TrendingDown } from "lucide-react";
import { Link } from "wouter";

const noteSchema = z.object({
  content: z.string().min(2, "Note content cannot be empty"),
  category: z.string().optional()
});

const planSchema = z.object({
  nutritionPlan: z.string().optional(),
  activityPlan: z.string().optional(),
  weeklyGoals: z.string().optional(),
});

export default function CoachPatientDetail() {
  const [match, params] = useRoute("/coach/patients/:id");
  const id = params?.id ? parseInt(params.id, 10) : 0;
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data, isLoading } = useGetCoachPatientDetail(id, { query: { enabled: !!id, queryKey: getGetCoachPatientDetailQueryKey(id) } });
  const addNote = useAddPatientNote();
  const updatePlan = useUpdatePatientPlan();

  const noteForm = useForm<z.infer<typeof noteSchema>>({
    resolver: zodResolver(noteSchema),
    defaultValues: { content: "", category: "clinical" }
  });

  const planForm = useForm<z.infer<typeof planSchema>>({
    resolver: zodResolver(planSchema),
    defaultValues: { nutritionPlan: "", activityPlan: "", weeklyGoals: "" }
  });

  useEffect(() => {
    if (data?.plan) {
      planForm.reset({
        nutritionPlan: data.plan.nutritionPlan ?? "",
        activityPlan: data.plan.activityPlan ?? "",
        weeklyGoals: data.plan.weeklyGoals ?? "",
      });
    }
  }, [data?.plan]);

  const onAddNote = (values: z.infer<typeof noteSchema>) => {
    addNote.mutate({ id, data: values }, {
      onSuccess: () => {
        toast({ title: "Note added" });
        noteForm.reset();
        queryClient.invalidateQueries({ queryKey: getGetCoachPatientDetailQueryKey(id) });
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to save note. Please try again.", variant: "destructive" });
      }
    });
  };

  const onUpdatePlan = (values: z.infer<typeof planSchema>) => {
    updatePlan.mutate({ id, data: values }, {
      onSuccess: () => {
        toast({ title: "Plan updated successfully" });
        queryClient.invalidateQueries({ queryKey: getGetCoachPatientDetailQueryKey(id) });
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to update plan. Please try again.", variant: "destructive" });
      }
    });
  };

  if (isLoading || !data) return (
    <StaffLayout type="coach">
      <div className="p-6 text-sm text-muted-foreground">
        {isLoading ? "Loading patient data…" : "Patient not found."}
      </div>
    </StaffLayout>
  );

  const pData = data;

  return (
    <StaffLayout type="coach">
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-2">
          <Button variant="ghost" size="icon" asChild className="rounded-full">
            <Link href="/coach/patients"><ArrowLeft className="w-4 h-4" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
              {pData.patient.fullName}
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs px-2 uppercase">Active</Badge>
            </h1>
            <p className="text-sm text-muted-foreground">Week {pData.patient.weekNumber} • {pData.patient.plan} Plan • Goal: {pData.patient.primaryGoal}</p>
          </div>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" className="gap-2"><MessageSquare className="w-4 h-4"/> Message</Button>
            <Button variant="destructive" className="gap-2 bg-red-600 hover:bg-red-700 text-white"><AlertCircle className="w-4 h-4"/> Escalate</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-border shadow-sm text-center py-4">
            <div className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Starting</div>
            <div className="text-2xl font-semibold">{pData.patient.startingWeight || "-"} kg</div>
          </Card>
          <Card className="border-border shadow-sm text-center py-4 border-b-2 border-b-primary">
            <div className="text-primary text-xs uppercase tracking-wider mb-1 font-medium">Current</div>
            <div className="text-3xl font-bold text-primary">{pData.patient.currentWeight || "-"} kg</div>
          </Card>
          <Card className="border-border shadow-sm text-center py-4">
            <div className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Target</div>
            <div className="text-2xl font-semibold">{pData.patient.targetWeight || "-"} kg</div>
          </Card>
          <Card className="border-border shadow-sm text-center py-4">
            <div className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Total Loss</div>
            <div className="text-2xl font-semibold text-green-600 flex items-center justify-center gap-1">
              <TrendingDown className="w-4 h-4" /> 
              {pData.patient.startingWeight && pData.patient.currentWeight ? (pData.patient.startingWeight - pData.patient.currentWeight).toFixed(1) : "-"} kg
            </div>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid grid-cols-4 w-full max-w-2xl bg-card border shadow-sm p-1 rounded-lg">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="checkins">Check-ins</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="plan">Plan Editor</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-6 space-y-6">
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle>Weight Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={pData.metrics.filter((m: any) => m.type === 'weight' || !m.type)} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} dy={10} />
                      <YAxis domain={['dataMin - 2', 'dataMax + 2']} axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} dx={-10} />
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value) => [`${value} kg`, 'Weight']}
                      />
                      <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={3} dot={{r: 4, fill: "hsl(var(--primary))", strokeWidth: 2, stroke: "#fff"}} activeDot={{r: 6}} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Current Protocol</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div>
                    <h4 className="font-medium text-foreground mb-1">Nutrition</h4>
                    <p className="text-muted-foreground">{pData.plan.nutritionPlan || "Not set"}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground mb-1">Activity</h4>
                    <p className="text-muted-foreground">{pData.plan.activityPlan || "Not set"}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground mb-1">Goals</h4>
                    <p className="text-muted-foreground">{pData.plan.weeklyGoals || "Not set"}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Recent Check-in Snapshot</CardTitle>
                </CardHeader>
                <CardContent>
                  {pData.checkins[0] ? (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                        <span className="text-sm">Meals Followed</span>
                        <Badge variant="outline" className={pData.checkins[0].mealsFollowed === 'yes' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                          {pData.checkins[0].mealsFollowed}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                        <span className="text-sm">Activity Completed</span>
                        <Badge variant="outline" className={pData.checkins[0].activityCompleted ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {pData.checkins[0].activityCompleted ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                        <span className="text-sm">Energy</span>
                        <span className="text-sm font-medium capitalize">{pData.checkins[0].energyLevel}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No recent check-ins.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="checkins" className="mt-6">
            <Card className="border-border shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground bg-muted/50 border-b uppercase">
                    <tr>
                      <th className="px-6 py-4 font-medium">Date</th>
                      <th className="px-6 py-4 font-medium">Meals</th>
                      <th className="px-6 py-4 font-medium">Activity</th>
                      <th className="px-6 py-4 font-medium">Energy / Mood</th>
                      <th className="px-6 py-4 font-medium">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-card">
                    {pData.checkins.map((checkin: any) => (
                      <tr key={checkin.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 text-foreground font-medium">
                          {new Date(checkin.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`capitalize ${checkin.mealsFollowed === 'yes' ? 'text-green-600' : checkin.mealsFollowed === 'partially' ? 'text-yellow-600' : 'text-red-600'}`}>
                            {checkin.mealsFollowed}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {checkin.activityCompleted ? <CheckCircle2 className="w-4 h-4 text-green-600"/> : <span className="text-red-600 font-medium">Missed</span>}
                        </td>
                        <td className="px-6 py-4">
                          <div className="capitalize text-xs text-muted-foreground">E: <span className="font-medium text-foreground">{checkin.energyLevel}</span></div>
                          <div className="capitalize text-xs text-muted-foreground mt-1">M: <span className="font-medium text-foreground">{checkin.mood}</span></div>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground truncate max-w-[200px]">
                          {checkin.notes || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="notes" className="mt-6 space-y-6">
            <Card className="border-border shadow-sm bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" /> Add Clinical Note
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...noteForm}>
                  <form onSubmit={noteForm.handleSubmit(onAddNote)} className="space-y-4">
                    <FormField
                      control={noteForm.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea placeholder="Type observation, insight, or summary here..." className="bg-white" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end">
                      <Button type="submit" disabled={addNote.isPending}>
                        {addNote.isPending ? "Saving..." : "Save Note"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {pData.notes.map((note: any) => (
                <Card key={note.id} className="border-border shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline" className="bg-muted text-xs capitalize">{note.category}</Badge>
                      <span className="text-xs text-muted-foreground">{new Date(note.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm">{note.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="plan" className="mt-6">
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle>Update Patient Protocol</CardTitle>
                <CardDescription>Adjustments will be reflected in the patient's app immediately.</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...planForm}>
                  <form onSubmit={planForm.handleSubmit(onUpdatePlan)} className="space-y-6">
                    <FormField
                      control={planForm.control}
                      name="nutritionPlan"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nutrition Protocol</FormLabel>
                          <FormControl>
                            <Textarea placeholder="e.g. 100g protein daily, Mediterranean style" className="min-h-[80px]" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={planForm.control}
                      name="activityPlan"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Activity Protocol</FormLabel>
                          <FormControl>
                            <Textarea placeholder="e.g. 8k steps, Zone 2 cardio 2x week" className="min-h-[80px]" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={planForm.control}
                      name="weeklyGoals"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Week's Focus Goals</FormLabel>
                          <FormControl>
                            <Textarea placeholder="e.g. Drink 3L water, prioritize sleep" className="min-h-[80px]" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end pt-4 border-t">
                      <Button type="submit" disabled={updatePlan.isPending}>
                        {updatePlan.isPending ? "Updating..." : "Update Protocol"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </StaffLayout>
  );
}
