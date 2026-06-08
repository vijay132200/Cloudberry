import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  FileText, ShieldAlert, AlertTriangle, Salad, Activity, Clock,
  Plus, Edit2, ChevronDown, ChevronUp, CheckCircle, RotateCcw,
  Calendar, Filter, User, History, X, Save,
  TrendingDown, Droplets, Footprints,
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const API = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";

async function fetchJson(path: string) {
  const token = localStorage.getItem("cloudberry_token") || "";
  const r = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
async function postJson(path: string, body: any) {
  const token = localStorage.getItem("cloudberry_token") || "";
  const r = await fetch(`${API}${path}`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
async function patchJson(path: string, body: any) {
  const token = localStorage.getItem("cloudberry_token") || "";
  const r = await fetch(`${API}${path}`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}
function fmtShort(iso: string) { return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" }); }

// ── CLINICAL NOTES TAB ──────────────────────────────────────────────────────
export function ClinicalNotesTab({ patientId, prefix }: { patientId: number; prefix: string }) {
  const canWrite = prefix !== "ops"; // Ops can only READ clinical notes per spec
  const qc = useQueryClient();
  const { toast } = useToast();
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("general");
  const [editId, setEditId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [expandedVersions, setExpandedVersions] = useState<number[]>([]);

  const { data: notes = [], isLoading } = useQuery<any[]>({
    queryKey: [`${prefix}-clinical-notes`, patientId],
    queryFn: () => fetchJson(`/${prefix}/patients/${patientId}/clinical-notes`),
  });

  const createMut = useMutation({
    mutationFn: (body: any) => postJson(`/${prefix}/patients/${patientId}/clinical-notes`, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [`${prefix}-clinical-notes`, patientId] }); setNewContent(""); toast({ title: "Clinical note added" }); },
    onError: (e: any) => toast({ title: "Failed to add note", description: e.message, variant: "destructive" }),
  });

  const editMut = useMutation({
    mutationFn: ({ id, content }: { id: number; content: string }) => patchJson(`/${prefix}/clinical-notes/${id}`, { content }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [`${prefix}-clinical-notes`, patientId] }); setEditId(null); toast({ title: "Note updated" }); },
    onError: (e: any) => toast({ title: "Failed to update note", description: e.message, variant: "destructive" }),
  });

  const catColors: Record<string, string> = {
    general: "bg-slate-50 text-slate-600 border-slate-200",
    physician: "bg-sky-50 text-sky-700 border-sky-200",
    follow_up: "bg-violet-50 text-violet-700 border-violet-200",
    observation: "bg-amber-50 text-amber-700 border-amber-200",
  };

  return (
    <div className="space-y-4">
      {canWrite && (
        <Card className="border-border/40 rounded-xl">
          <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm flex items-center gap-2"><Plus className="w-4 h-4 text-primary" />Add Clinical Note</CardTitle></CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            <Select value={newCategory} onValueChange={setNewCategory}>
              <SelectTrigger className="h-8 text-xs rounded-lg"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["general", "physician", "follow_up", "observation"].map(c => <SelectItem key={c} value={c} className="text-xs capitalize">{c.replace(/_/g, " ")}</SelectItem>)}
              </SelectContent>
            </Select>
            <Textarea value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="Clinical observation or note…" className="text-sm min-h-[80px] resize-none rounded-xl" />
            <Button size="sm" className="rounded-full gap-2 w-full h-8 text-xs" disabled={!newContent.trim() || createMut.isPending} onClick={() => createMut.mutate({ content: newContent, category: newCategory })}>
              <Save className="w-3 h-3" />{createMut.isPending ? "Saving…" : "Save Note"}
            </Button>
          </CardContent>
        </Card>
      )}
      {!canWrite && (
        <div className="flex items-center gap-2 bg-sky-50 border border-sky-200 rounded-xl px-3 py-2">
          <FileText className="w-4 h-4 text-sky-600 shrink-0" />
          <p className="text-xs text-sky-800">Clinical notes are authored by physicians. Ops staff have read-only access.</p>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}</div>
      ) : notes.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">No clinical notes yet.</p>
      ) : notes.map((note: any) => (
        <Card key={note.id} className="border-border/40 rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={`text-[10px] border ${catColors[note.category] ?? catColors.general}`}>{note.category?.replace(/_/g, " ")}</Badge>
                <span className="text-[10px] text-muted-foreground flex items-center gap-1"><User className="w-3 h-3" />{note.authorName}</span>
                <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{fmtDate(note.createdAt)}</span>
                {note.updatedAt !== note.createdAt && <span className="text-[10px] text-muted-foreground italic">edited {fmtDate(note.updatedAt)}</span>}
              </div>
              {canWrite && (
                <button className="text-muted-foreground hover:text-primary shrink-0" onClick={() => { setEditId(note.id); setEditContent(note.content); }}>
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {editId === note.id ? (
              <div className="space-y-2">
                <Textarea value={editContent} onChange={e => setEditContent(e.target.value)} className="text-sm min-h-[60px] resize-none rounded-xl" />
                <div className="flex gap-2">
                  <Button size="sm" className="h-7 text-xs rounded-full gap-1" disabled={editMut.isPending} onClick={() => editMut.mutate({ id: note.id, content: editContent })}>
                    <Save className="w-3 h-3" />{editMut.isPending ? "Saving…" : "Save"}
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs rounded-full" onClick={() => setEditId(null)}><X className="w-3 h-3" /></Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{note.content}</p>
            )}
            {note.versions?.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border/40">
                <button className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground" onClick={() => setExpandedVersions(v => v.includes(note.id) ? v.filter(x => x !== note.id) : [...v, note.id])}>
                  <History className="w-3 h-3" />Edit history ({note.versions.length})
                  {expandedVersions.includes(note.id) ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                {expandedVersions.includes(note.id) && (
                  <div className="mt-2 space-y-2">
                    {note.versions.map((v: any, i: number) => (
                      <div key={v.id} className="bg-slate-50 rounded-lg p-2 border border-border/30">
                        <p className="text-[10px] text-muted-foreground mb-1">Version {note.versions.length - i} · {fmtDate(v.editedAt)}</p>
                        <p className="text-xs text-foreground/70 whitespace-pre-wrap">{v.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── CRITICAL NOTES TAB ──────────────────────────────────────────────────────
export function CriticalNotesTab({ patientId, prefix }: { patientId: number; prefix: string }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [newContent, setNewContent] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [expandedVersions, setExpandedVersions] = useState<number[]>([]);

  const { data: notes = [], isLoading } = useQuery<any[]>({
    queryKey: [`${prefix}-critical-notes`, patientId],
    queryFn: () => fetchJson(`/${prefix}/patients/${patientId}/critical-notes`),
  });

  const createMut = useMutation({
    mutationFn: (body: any) => postJson(`/${prefix}/patients/${patientId}/critical-notes`, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [`${prefix}-critical-notes`, patientId] }); setNewContent(""); toast({ title: "Critical note added" }); },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const editMut = useMutation({
    mutationFn: ({ id, content }: { id: number; content: string }) => patchJson(`/${prefix}/critical-notes/${id}`, { content }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [`${prefix}-critical-notes`, patientId] }); setEditId(null); toast({ title: "Note updated" }); },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
        <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
        <p className="text-xs text-rose-800 font-medium">Critical notes are strictly internal — never shared with patients.</p>
      </div>
      <Card className="border-rose-200 rounded-xl">
        <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm flex items-center gap-2 text-rose-700"><Plus className="w-4 h-4" />Add Critical Note</CardTitle></CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          <Textarea value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="Critical clinical observation (internal only)…" className="text-sm min-h-[80px] resize-none rounded-xl border-rose-200" />
          <Button size="sm" className="rounded-full gap-2 w-full h-8 text-xs bg-rose-600 hover:bg-rose-700" disabled={!newContent.trim() || createMut.isPending} onClick={() => createMut.mutate({ content: newContent })}>
            <ShieldAlert className="w-3 h-3" />{createMut.isPending ? "Saving…" : "Save Critical Note"}
          </Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}</div>
      ) : notes.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">No critical notes recorded.</p>
      ) : notes.map((note: any) => (
        <Card key={note.id} className="border-rose-200 rounded-xl bg-rose-50/30">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-[10px] border bg-rose-50 text-rose-700 border-rose-200">Critical</Badge>
                <span className="text-[10px] text-muted-foreground flex items-center gap-1"><User className="w-3 h-3" />{note.authorName} · {note.authorRole}</span>
                <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{fmtDate(note.createdAt)}</span>
                {note.updatedAt !== note.createdAt && <span className="text-[10px] text-muted-foreground italic">edited {fmtDate(note.updatedAt)}</span>}
              </div>
              <button className="text-muted-foreground hover:text-rose-600 shrink-0" onClick={() => { setEditId(note.id); setEditContent(note.content); }}>
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
            {editId === note.id ? (
              <div className="space-y-2">
                <Textarea value={editContent} onChange={e => setEditContent(e.target.value)} className="text-sm min-h-[60px] resize-none rounded-xl border-rose-200" />
                <div className="flex gap-2">
                  <Button size="sm" className="h-7 text-xs rounded-full gap-1 bg-rose-600 hover:bg-rose-700" disabled={editMut.isPending} onClick={() => editMut.mutate({ id: note.id, content: editContent })}>
                    <Save className="w-3 h-3" />{editMut.isPending ? "Saving…" : "Save"}
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs rounded-full" onClick={() => setEditId(null)}><X className="w-3 h-3" /></Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{note.content}</p>
            )}
            {note.versions?.length > 0 && (
              <div className="mt-3 pt-3 border-t border-rose-200">
                <button className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground" onClick={() => setExpandedVersions(v => v.includes(note.id) ? v.filter(x => x !== note.id) : [...v, note.id])}>
                  <History className="w-3 h-3" />Edit history ({note.versions.length})
                  {expandedVersions.includes(note.id) ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                {expandedVersions.includes(note.id) && (
                  <div className="mt-2 space-y-2">
                    {note.versions.map((v: any, i: number) => (
                      <div key={v.id} className="bg-white rounded-lg p-2 border border-rose-100">
                        <p className="text-[10px] text-muted-foreground mb-1">Version {note.versions.length - i} · {fmtDate(v.editedAt)}</p>
                        <p className="text-xs text-foreground/70 whitespace-pre-wrap">{v.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── ESCALATIONS TAB ─────────────────────────────────────────────────────────
export function EscalationsTab({ patientId, prefix, isOps }: { patientId: number; prefix: string; isOps?: boolean }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCat, setNewCat] = useState("medical");
  const [expandedAudit, setExpandedAudit] = useState<number[]>([]);
  const [resolveId, setResolveId] = useState<number | null>(null);
  const [resolveNote, setResolveNote] = useState("");
  const [opsLogContent, setOpsLogContent] = useState("");
  const [opsLogCat, setOpsLogCat] = useState("observation");

  const { data: escalations = [], isLoading } = useQuery<any[]>({
    queryKey: [`${prefix}-escalations`, patientId],
    queryFn: () => fetchJson(`/${prefix}/patients/${patientId}/escalations`),
  });

  const { data: opsLog = [] } = useQuery<any[]>({
    queryKey: [`ops-escalation-log`, patientId],
    queryFn: () => fetchJson(`/ops/patients/${patientId}/escalation-log`),
    enabled: isOps === true,
  });

  const createMut = useMutation({
    mutationFn: (body: any) => postJson(`/${prefix}/patients/${patientId}/escalations`, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [`${prefix}-escalations`, patientId] }); setShowCreate(false); setNewTitle(""); setNewDesc(""); toast({ title: "Escalation created" }); },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const actionMut = useMutation({
    mutationFn: ({ id, action, note, resolutionNotes }: any) => patchJson(`/${prefix}/escalations/${id}`, { action, note, resolutionNotes }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [`${prefix}-escalations`, patientId] }); setResolveId(null); setResolveNote(""); toast({ title: "Escalation updated" }); },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const opsLogMut = useMutation({
    mutationFn: (body: any) => postJson(`/ops/patients/${patientId}/escalation-log`, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [`ops-escalation-log`, patientId] }); setOpsLogContent(""); toast({ title: "Ops log entry added" }); },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const statusColor = (s: string) => s === "open" ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-emerald-50 text-emerald-700 border-emerald-200";
  const catColor = (c: string) => c === "medical" ? "bg-sky-50 text-sky-700 border-sky-200" : c === "diet" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200";

  return (
    <div className="space-y-4">
      {isOps ? (
        <Button size="sm" variant="outline" className="rounded-full gap-2 h-8 text-xs border-rose-200 text-rose-700 hover:bg-rose-50" onClick={() => setShowCreate(v => !v)}>
          <Plus className="w-3 h-3" />New Escalation
        </Button>
      ) : (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <p className="text-xs text-amber-800">Escalations are created and resolved by Ops staff. Physicians have read-only access.</p>
        </div>
      )}

      {showCreate && (
        <Card className="border-rose-200 rounded-xl">
          <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm flex items-center gap-2 text-rose-700"><AlertTriangle className="w-4 h-4" />Create Escalation</CardTitle></CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            <Select value={newCat} onValueChange={setNewCat}>
              <SelectTrigger className="h-8 text-xs rounded-lg"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="medical" className="text-xs">Medical</SelectItem>
                <SelectItem value="diet" className="text-xs">Diet</SelectItem>
                <SelectItem value="other" className="text-xs">Other</SelectItem>
              </SelectContent>
            </Select>
            <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Escalation title…" className="text-sm rounded-xl h-8" />
            <Textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Describe the escalation…" className="text-sm min-h-[70px] resize-none rounded-xl" />
            <div className="flex gap-2">
              <Button size="sm" className="h-8 text-xs rounded-full gap-1 bg-rose-600 hover:bg-rose-700 flex-1" disabled={!newTitle.trim() || !newDesc.trim() || createMut.isPending} onClick={() => createMut.mutate({ category: newCat, title: newTitle, description: newDesc })}>
                <AlertTriangle className="w-3 h-3" />{createMut.isPending ? "Creating…" : "Create Escalation"}
              </Button>
              <Button size="sm" variant="ghost" className="h-8 text-xs rounded-full" onClick={() => setShowCreate(false)}><X className="w-3 h-3" /></Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />)}</div>
      ) : escalations.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">No escalations recorded.</p>
      ) : escalations.map((esc: any) => (
        <Card key={esc.id} className={`rounded-xl border ${esc.status === "open" ? "border-rose-200 bg-rose-50/20" : "border-border/40"}`}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <p className="font-semibold text-sm text-foreground">{esc.title}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant="outline" className={`text-[10px] border ${statusColor(esc.status)}`}>{esc.status}</Badge>
                  <Badge variant="outline" className={`text-[10px] border ${catColor(esc.category)}`}>{esc.category}</Badge>
                  <span className="text-[10px] text-muted-foreground">{esc.authorName} · {fmtDate(esc.createdAt)}</span>
                </div>
              </div>
              {isOps && (
                <div className="flex gap-1 shrink-0">
                  {esc.status === "open" ? (
                    <Button size="sm" variant="outline" className="h-7 text-xs rounded-full gap-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50" onClick={() => setResolveId(esc.id)}>
                      <CheckCircle className="w-3 h-3" />Resolve
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" className="h-7 text-xs rounded-full gap-1" onClick={() => actionMut.mutate({ id: esc.id, action: "reopen", note: "Reopened" })}>
                      <RotateCcw className="w-3 h-3" />Reopen
                    </Button>
                  )}
                </div>
              )}
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed mb-2">{esc.description}</p>
            {esc.resolutionNotes && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 mb-2">
                <p className="text-[10px] font-semibold text-emerald-700 mb-0.5">Resolution</p>
                <p className="text-xs text-emerald-800">{esc.resolutionNotes}</p>
              </div>
            )}
            {isOps && resolveId === esc.id && (
              <div className="space-y-2 mt-2 pt-2 border-t border-border/40">
                <Textarea value={resolveNote} onChange={e => setResolveNote(e.target.value)} placeholder="Resolution notes (optional)…" className="text-sm min-h-[50px] resize-none rounded-xl" />
                <div className="flex gap-2">
                  <Button size="sm" className="h-7 text-xs rounded-full gap-1 bg-emerald-600 hover:bg-emerald-700" disabled={actionMut.isPending} onClick={() => actionMut.mutate({ id: esc.id, action: "resolve", resolutionNotes: resolveNote, note: "Resolved" })}>
                    <CheckCircle className="w-3 h-3" />{actionMut.isPending ? "Resolving…" : "Mark Resolved"}
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs rounded-full" onClick={() => setResolveId(null)}><X className="w-3 h-3" /></Button>
                </div>
              </div>
            )}
            {esc.auditLog?.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border/40">
                <button className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground" onClick={() => setExpandedAudit(v => v.includes(esc.id) ? v.filter(x => x !== esc.id) : [...v, esc.id])}>
                  <History className="w-3 h-3" />Audit log ({esc.auditLog.length})
                  {expandedAudit.includes(esc.id) ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                {expandedAudit.includes(esc.id) && (
                  <div className="mt-2 space-y-1.5">
                    {esc.auditLog.map((a: any) => (
                      <div key={a.id} className="flex items-start gap-2 text-[10px] text-muted-foreground">
                        <span className="text-foreground/60 font-medium">{a.action}</span>
                        <span>by {a.actorName}</span>
                        <span className="ml-auto">{fmtDate(a.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Ops Internal Log */}
      {isOps && (
        <div className="mt-6 pt-4 border-t border-border/40">
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert className="w-4 h-4 text-violet-600" />
            <p className="text-sm font-semibold text-foreground">Ops Internal Log</p>
            <Badge variant="outline" className="text-[10px] border bg-violet-50 text-violet-700 border-violet-200">Ops Only</Badge>
          </div>
          <Card className="border-violet-200 rounded-xl mb-3">
            <CardContent className="p-4 space-y-3">
              <Select value={opsLogCat} onValueChange={setOpsLogCat}>
                <SelectTrigger className="h-8 text-xs rounded-lg"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="observation" className="text-xs">Observation</SelectItem>
                  <SelectItem value="decision" className="text-xs">Decision</SelectItem>
                  <SelectItem value="follow_up" className="text-xs">Follow-up</SelectItem>
                </SelectContent>
              </Select>
              <Textarea value={opsLogContent} onChange={e => setOpsLogContent(e.target.value)} placeholder="Internal ops observation or decision…" className="text-sm min-h-[60px] resize-none rounded-xl border-violet-200" />
              <Button size="sm" className="h-8 text-xs rounded-full gap-1 w-full bg-violet-600 hover:bg-violet-700" disabled={!opsLogContent.trim() || opsLogMut.isPending} onClick={() => opsLogMut.mutate({ content: opsLogContent, category: opsLogCat })}>
                <Save className="w-3 h-3" />{opsLogMut.isPending ? "Adding…" : "Add Ops Log Entry"}
              </Button>
            </CardContent>
          </Card>
          {(opsLog as any[]).length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-4">No ops log entries.</p>
          ) : (opsLog as any[]).map((entry: any) => (
            <Card key={entry.id} className="border-violet-100 rounded-xl bg-violet-50/20 mb-2">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Badge variant="outline" className="text-[10px] border bg-violet-50 text-violet-700 border-violet-200">{entry.category}</Badge>
                  <span className="text-[10px] text-muted-foreground">{entry.authorName} · {fmtDate(entry.createdAt)}</span>
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap">{entry.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ── DIET PLAN TAB ────────────────────────────────────────────────────────────
export function DietPlanTab({ patientId, prefix, canUpload }: { patientId: number; prefix: string; canUpload?: boolean }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [pdfFilename, setPdfFilename] = useState<string | null>(null);
  const [pdfData, setPdfData] = useState<string | null>(null);

  function handlePdfChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) { setPdfFilename(null); setPdfData(null); return; }
    const reader = new FileReader();
    reader.onload = ev => {
      const base64 = (ev.target?.result as string)?.split(",")[1] ?? null;
      setPdfFilename(file.name);
      setPdfData(base64);
    };
    reader.readAsDataURL(file);
  }

  const { data: plans = [], isLoading } = useQuery<any[]>({
    queryKey: [`${prefix}-diet-plans`, patientId],
    queryFn: () => fetchJson(`/${prefix}/patients/${patientId}/diet-plans`),
  });

  const createMut = useMutation({
    mutationFn: (body: any) => postJson(`/${prefix}/patients/${patientId}/diet-plans`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [`${prefix}-diet-plans`, patientId] });
      setShowCreate(false); setTitle(""); setContent(""); setPdfFilename(null); setPdfData(null);
      toast({ title: "Diet plan uploaded" });
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const activePlan = (plans as any[]).find((p: any) => p.isActive);
  const history = (plans as any[]).filter((p: any) => !p.isActive);

  return (
    <div className="space-y-4">
      {canUpload && (
        <Button size="sm" variant="outline" className="rounded-full gap-2 h-8 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50" onClick={() => setShowCreate(v => !v)}>
          <Plus className="w-3 h-3" />Upload New Diet Plan
        </Button>
      )}

      {showCreate && (
        <Card className="border-emerald-200 rounded-xl">
          <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm flex items-center gap-2 text-emerald-700"><Salad className="w-4 h-4" />New Diet Plan</CardTitle></CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Plan title (e.g. Week 5 Diet Plan)" className="text-sm rounded-xl h-8" />
            <Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Diet plan content — meals, guidelines, targets…" className="text-sm min-h-[100px] resize-none rounded-xl" />
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground font-medium">Attach PDF (optional)</p>
              <label className="flex items-center gap-2 cursor-pointer border border-dashed border-emerald-300 rounded-xl px-3 py-2 hover:bg-emerald-50/50 transition-colors">
                <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs text-muted-foreground truncate">{pdfFilename ?? "Click to select a PDF file…"}</span>
                <input type="file" accept=".pdf,application/pdf" className="sr-only" onChange={handlePdfChange} />
              </label>
              {pdfFilename && (
                <button className="text-[10px] text-rose-500 hover:text-rose-700" onClick={() => { setPdfFilename(null); setPdfData(null); }}>Remove PDF</button>
              )}
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="h-8 text-xs rounded-full gap-1 bg-emerald-600 hover:bg-emerald-700 flex-1" disabled={!title.trim() || !content.trim() || createMut.isPending} onClick={() => createMut.mutate({ title, content, ...(pdfFilename ? { pdfFilename, pdfData } : {}) })}>
                <Save className="w-3 h-3" />{createMut.isPending ? "Uploading…" : "Save Diet Plan"}
              </Button>
              <Button size="sm" variant="ghost" className="h-8 text-xs rounded-full" onClick={() => setShowCreate(false)}><X className="w-3 h-3" /></Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-2">{[1].map(i => <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />)}</div>
      ) : !activePlan ? (
        <p className="text-center text-sm text-muted-foreground py-8">No active diet plan assigned.</p>
      ) : (
        <Card className="border-emerald-200 rounded-xl bg-emerald-50/20">
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-start justify-between">
              <CardTitle className="text-sm flex items-center gap-2 text-emerald-700"><Salad className="w-4 h-4" />Current Diet Plan</CardTitle>
              <Badge variant="outline" className="text-[10px] border bg-emerald-50 text-emerald-700 border-emerald-200">v{activePlan.version} · Active</Badge>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="font-semibold text-sm text-foreground mb-1">{activePlan.title}</p>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-3">
              <User className="w-3 h-3" />{activePlan.authorName} · <Clock className="w-3 h-3" />{fmtDate(activePlan.createdAt)}
            </div>
            <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">{activePlan.content}</p>
          </CardContent>
        </Card>
      )}

      {history.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-2">Previous Versions</p>
          <div className="space-y-2">
            {history.map((plan: any) => (
              <Card key={plan.id} className="border-border/40 rounded-xl">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{plan.title}</p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                        <span>v{plan.version}</span><span>·</span><span>{plan.authorName}</span><span>·</span><span>{fmtDate(plan.createdAt)}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] border bg-slate-50 text-slate-500 border-slate-200">Archived</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{plan.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── RECORDS CENTER TAB ────────────────────────────────────────────────────────
type TimeRange = "weekly" | "monthly" | "enrollment" | "month" | "custom";


export function RecordsTab({ patientId, prefix, enrolledAt }: { patientId: number; prefix: string; enrolledAt?: string }) {
  const [range, setRange] = useState<TimeRange>("monthly");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const now = new Date();
  const [monthYear, setMonthYear] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);

  function getRange() {
    if (range === "weekly") {
      const from = new Date(now); from.setDate(from.getDate() - 7);
      return { from: from.toISOString().slice(0, 10), to: now.toISOString().slice(0, 10) };
    }
    if (range === "monthly") {
      const from = new Date(now); from.setDate(from.getDate() - 30);
      return { from: from.toISOString().slice(0, 10), to: now.toISOString().slice(0, 10) };
    }
    if (range === "enrollment") {
      return { from: enrolledAt ? enrolledAt.slice(0, 10) : undefined, to: now.toISOString().slice(0, 10) };
    }
    if (range === "month" && monthYear) {
      const [y, m] = monthYear.split("-").map(Number);
      const from = new Date(y, m - 1, 1).toISOString().slice(0, 10);
      const to = new Date(y, m, 0).toISOString().slice(0, 10);
      return { from, to };
    }
    return { from: customFrom || undefined, to: customTo || undefined };
  }

  const r = getRange();
  const queryStr = [r.from ? `from=${r.from}` : "", r.to ? `to=${r.to}` : ""].filter(Boolean).join("&");

  const { data, isLoading } = useQuery<any>({
    queryKey: [`${prefix}-records`, patientId, range, customFrom, customTo, monthYear],
    queryFn: () => fetchJson(`/${prefix}/patients/${patientId}/records${queryStr ? `?${queryStr}` : ""}`),
  });

  const rangeOptions: { value: TimeRange; label: string }[] = [
    { value: "weekly", label: "Last 7 days" },
    { value: "monthly", label: "Last 30 days" },
    { value: "enrollment", label: "Since enrollment" },
    { value: "month", label: "Specific month" },
    { value: "custom", label: "Custom range" },
  ];

  const cb = data?.consistencyBreakdown;
  const overall = cb ? Math.round((cb.mealLogging + cb.activity + cb.sleep) / 3) : null;
  const scoreColor = overall === null ? "#94a3b8" : overall >= 70 ? "#22c55e" : overall >= 45 ? "#f59e0b" : "#ef4444";
  const scoreBg = overall === null ? "bg-slate-50 text-slate-500 border-slate-200"
    : overall >= 70 ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : overall >= 45 ? "bg-amber-50 text-amber-700 border-amber-200"
    : "bg-rose-50 text-rose-700 border-rose-200";
  const scoreLabel = overall === null ? "No data" : overall >= 70 ? "Strong" : overall >= 45 ? "Moderate" : "Needs Work";

  return (
    <div className="space-y-4">
      <Card className="border-border/40 rounded-xl">
        <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" />Historical Records</CardTitle></CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="flex gap-2 flex-wrap mb-3">
            {rangeOptions.map(o => (
              <button key={o.value} onClick={() => setRange(o.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${range === o.value ? "bg-primary text-white border-primary" : "border-border/60 text-muted-foreground hover:text-foreground"}`}>
                {o.label}
              </button>
            ))}
          </div>
          {range === "month" && (
            <div className="mb-3">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-1">Select Month</label>
              <Input type="month" value={monthYear} onChange={e => setMonthYear(e.target.value)} className="h-8 text-xs rounded-lg w-40" />
            </div>
          )}
          {range === "custom" && (
            <div className="flex gap-3 mb-3">
              <div className="flex-1">
                <label className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-1">From</label>
                <Input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="h-8 text-xs rounded-lg" />
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-1">To</label>
                <Input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} className="h-8 text-xs rounded-lg" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />)}
        </div>
      ) : !data ? null : (
        <>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Total Check-ins", value: data.totalCheckins ?? "—", sub: "logged in range" },
              { label: "Adherence Rate", value: data.adherencePct != null ? `${data.adherencePct}%` : "—", sub: "meals followed" },
              { label: "Activity Rate", value: data.activityPct != null ? `${data.activityPct}%` : "—", sub: "activity completed" },
              { label: "Avg Weight", value: data.avgWeight ? `${data.avgWeight} kg` : "—", sub: "over period" },
              { label: "Avg Glucose", value: data.avgGlucose ? `${data.avgGlucose} mg/dL` : "—", sub: "fasting avg" },
              { label: "Avg Sleep", value: data.avgSleep ? `${data.avgSleep} hrs` : "—", sub: "nightly avg" },
            ].map(card => (
              <div key={card.label} className="bg-muted/40 rounded-xl p-3 border border-border/40">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">{card.label}</p>
                <p className="font-bold text-foreground text-base">{card.value}</p>
                <p className="text-[10px] text-muted-foreground">{card.sub}</p>
              </div>
            ))}
          </div>

          {/* Consistency card — mirrors patient dashboard */}
          {cb && (
            <Card className="border-border/40 rounded-xl">
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2"><Footprints className="w-4 h-4 text-emerald-600" />Behavioral Consistency</CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-lg leading-none" style={{ color: scoreColor }}>{overall ?? "—"}</span>
                    <span className="text-xs text-muted-foreground">/100</span>
                    <Badge variant="outline" className={`text-[10px] border ${scoreBg}`}>{scoreLabel}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-2">
                {[
                  { label: "Meal Logging", value: cb.mealLogging, color: "bg-emerald-500" },
                  { label: "Activity", value: cb.activity, color: "bg-violet-500" },
                  { label: "Sleep", value: cb.sleep, color: "bg-indigo-500" },
                ].map(b => (
                  <div key={b.label}>
                    <div className="flex items-center justify-between text-[10px] mb-0.5">
                      <span className="text-foreground/80 font-medium">{b.label}</span>
                      <span className="font-bold tabular-nums">{b.value}<span className="text-muted-foreground font-normal">/100</span></span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${b.color}`} style={{ width: `${b.value}%` }} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {data.weightSeries?.length > 1 && (
            <Card className="border-border/40 rounded-xl">
              <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm flex items-center gap-2"><TrendingDown className="w-4 h-4 text-sky-600" />Weight Trend</CardTitle></CardHeader>
              <CardContent className="px-4 pb-4">
                <ResponsiveContainer width="100%" height={90}>
                  <LineChart data={data.weightSeries}><XAxis dataKey="date" tick={{ fontSize: 8 }} tickFormatter={fmtShort} /><YAxis tick={{ fontSize: 8 }} domain={["auto", "auto"]} width={28} /><Tooltip formatter={(v: number) => [`${v} kg`, "Weight"]} labelFormatter={fmtShort} /><Line type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 2 }} /></LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {data.glucoseSeries?.length > 1 && (
            <Card className="border-border/40 rounded-xl">
              <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm flex items-center gap-2"><Droplets className="w-4 h-4 text-rose-500" />Glucose Trend</CardTitle></CardHeader>
              <CardContent className="px-4 pb-4">
                <ResponsiveContainer width="100%" height={90}>
                  <LineChart data={data.glucoseSeries}><XAxis dataKey="date" tick={{ fontSize: 8 }} tickFormatter={fmtShort} /><YAxis tick={{ fontSize: 8 }} domain={[60, 200]} width={30} /><Tooltip formatter={(v: number) => [`${v} mg/dL`, "Glucose"]} labelFormatter={fmtShort} /><Line type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={2} dot={{ r: 2 }} /></LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

// ── ACTIVITY FEED TAB ─────────────────────────────────────────────────────────
const EVENT_COLORS: Record<string, string> = {
  checkin: "bg-sky-50 border-sky-200 text-sky-700",
  clinical_note: "bg-violet-50 border-violet-200 text-violet-700",
  critical_note: "bg-rose-50 border-rose-200 text-rose-700",
  escalation: "bg-amber-50 border-amber-200 text-amber-700",
  appointment: "bg-emerald-50 border-emerald-200 text-emerald-700",
  diet_plan: "bg-teal-50 border-teal-200 text-teal-700",
  note: "bg-slate-50 border-slate-200 text-slate-600",
  metric: "bg-blue-50 border-blue-200 text-blue-700",
  care_plan: "bg-orange-50 border-orange-200 text-orange-700",
};
const EVENT_LABELS: Record<string, string> = {
  checkin: "Check-in", clinical_note: "Clinical Note", critical_note: "Critical Note",
  escalation: "Escalation", appointment: "Appointment", diet_plan: "Diet Plan",
  note: "Care Note", metric: "Metric", care_plan: "Care Plan Edit",
};

export function ActivityFeedTab({ patientId, prefix }: { patientId: number; prefix: string }) {
  const [typeFilter, setTypeFilter] = useState("all");
  const [authorFilter, setAuthorFilter] = useState("");
  const [fromFilter, setFromFilter] = useState("");
  const [toFilter, setToFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const buildQs = () => {
    const parts: string[] = [];
    if (typeFilter !== "all") parts.push(`type=${typeFilter}`);
    if (authorFilter.trim()) parts.push(`author=${encodeURIComponent(authorFilter.trim())}`);
    if (fromFilter) parts.push(`from=${fromFilter}`);
    if (toFilter) parts.push(`to=${toFilter}`);
    return parts.length ? `?${parts.join("&")}` : "";
  };

  const { data: events = [], isLoading } = useQuery<any[]>({
    queryKey: [`${prefix}-activity`, patientId, typeFilter, authorFilter, fromFilter, toFilter],
    queryFn: () => fetchJson(`/${prefix}/patients/${patientId}/activity${buildQs()}`),
    staleTime: 30000,
  });

  const types = ["all", "checkin", "clinical_note", "critical_note", "escalation", "appointment", "diet_plan", "metric", "care_plan"];
  const hasActiveFilters = authorFilter.trim() || fromFilter || toFilter;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          {types.map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-medium border transition-colors ${typeFilter === t ? "bg-primary text-white border-primary" : "border-border/60 text-muted-foreground hover:text-foreground"}`}>
              {t === "all" ? "All Events" : EVENT_LABELS[t] ?? t}
            </button>
          ))}
          <button onClick={() => setShowFilters(v => !v)}
            className={`px-2.5 py-1 rounded-full text-[10px] font-medium border transition-colors flex items-center gap-1 ${(showFilters || hasActiveFilters) ? "bg-violet-100 text-violet-700 border-violet-300" : "border-border/60 text-muted-foreground hover:text-foreground"}`}>
            <Filter className="w-2.5 h-2.5" />Filters{hasActiveFilters ? " ●" : ""}
          </button>
        </div>
        {showFilters && (
          <Card className="border-border/40 rounded-xl">
            <CardContent className="p-3 space-y-3">
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-1">Author name</label>
                <Input value={authorFilter} onChange={e => setAuthorFilter(e.target.value)} placeholder="Filter by author…" className="h-7 text-xs rounded-lg" />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-1">From</label>
                  <Input type="date" value={fromFilter} onChange={e => setFromFilter(e.target.value)} className="h-7 text-xs rounded-lg" />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-1">To</label>
                  <Input type="date" value={toFilter} onChange={e => setToFilter(e.target.value)} className="h-7 text-xs rounded-lg" />
                </div>
              </div>
              {hasActiveFilters && (
                <Button size="sm" variant="ghost" className="h-6 text-[10px] rounded-full gap-1 text-muted-foreground" onClick={() => { setAuthorFilter(""); setFromFilter(""); setToFilter(""); }}>
                  <X className="w-2.5 h-2.5" />Clear filters
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />)}</div>
      ) : (events as any[]).length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">No activity events found.</p>
      ) : (events as any[]).map((event: any) => (
        <div key={event.id}>
          <button className={`w-full text-left border rounded-xl p-3 transition-colors ${EVENT_COLORS[event.type] ?? EVENT_COLORS.note} hover:opacity-90`}
            onClick={() => setExpandedId(expandedId === event.id ? null : event.id)}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-wide opacity-70">{EVENT_LABELS[event.type] ?? event.type}</span>
                  <span className="text-[10px] opacity-60 flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{fmtDate(event.createdAt)}</span>
                </div>
                <p className="text-xs font-semibold truncate">{event.title}</p>
                <p className="text-[10px] opacity-70 truncate mt-0.5">{event.summary}</p>
              </div>
              <span className="text-[10px] opacity-50 shrink-0">{expandedId === event.id ? "▲" : "▼"}</span>
            </div>
          </button>
          {expandedId === event.id && (
            <div className="border border-t-0 border-border/40 rounded-b-xl px-4 py-3 bg-white space-y-2">
              <div className="text-[10px] text-muted-foreground flex gap-4 flex-wrap">
                <span><strong>Author:</strong> {event.author}</span>
                <span><strong>Time:</strong> {fmtDate(event.createdAt)}</span>
              </div>
              {event.type === "checkin" && event.content && (
                <div className="space-y-1">
                  <p className="text-xs"><span className="text-muted-foreground">Meals:</span> <span className="font-medium capitalize">{event.content.mealsFollowed}</span></p>
                  <p className="text-xs"><span className="text-muted-foreground">Energy:</span> <span className="font-medium capitalize">{event.content.energyLevel}</span></p>
                  <p className="text-xs"><span className="text-muted-foreground">Mood:</span> <span className="font-medium capitalize">{event.content.mood}</span></p>
                  {event.content.glucoseReading && <p className="text-xs"><span className="text-muted-foreground">Glucose:</span> <span className="font-medium">{event.content.glucoseReading} mg/dL</span></p>}
                  {event.content.notes && <p className="text-xs text-muted-foreground italic">"{event.content.notes}"</p>}
                </div>
              )}
              {(event.type === "clinical_note" || event.type === "critical_note" || event.type === "note") && (
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{event.content?.content}</p>
              )}
              {event.type === "escalation" && event.content && (
                <div className="space-y-1">
                  <p className="text-xs"><span className="text-muted-foreground">Category:</span> <span className="font-medium">{event.content.category}</span></p>
                  <p className="text-xs"><span className="text-muted-foreground">Status:</span> <span className="font-medium">{event.content.status}</span></p>
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed mt-1">{event.content.description}</p>
                  {event.content.resolutionNotes && <p className="text-xs text-emerald-700 mt-1"><strong>Resolution:</strong> {event.content.resolutionNotes}</p>}
                </div>
              )}
              {event.type === "diet_plan" && event.content && (
                <div>
                  <p className="text-xs font-semibold">{event.content.title} <span className="font-normal text-muted-foreground">v{event.content.version}</span></p>
                  <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed mt-1 line-clamp-4">{event.content.content}</p>
                  {event.content.pdfFilename && (
                    <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1"><FileText className="w-3 h-3" />{event.content.pdfFilename}</p>
                  )}
                </div>
              )}
              {event.type === "metric" && event.content && (
                <div className="space-y-1">
                  <p className="text-xs"><span className="text-muted-foreground">Type:</span> <span className="font-medium capitalize">{String(event.content.type ?? "").replace(/_/g, " ")}</span></p>
                  <p className="text-xs"><span className="text-muted-foreground">Value:</span> <span className="font-medium">{event.summary}</span></p>
                  {event.content.unit && <p className="text-xs"><span className="text-muted-foreground">Unit:</span> <span className="font-medium">{event.content.unit}</span></p>}
                </div>
              )}
              {event.type === "care_plan" && event.content && (
                <div className="space-y-2">
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Snapshot before this edit</p>
                  {event.content.nutritionPlan && (
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground mb-0.5">Nutrition Plan</p>
                      <p className="text-xs text-foreground/80 whitespace-pre-wrap line-clamp-4">{event.content.nutritionPlan}</p>
                    </div>
                  )}
                  {event.content.activityPlan && (
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground mb-0.5">Activity Plan</p>
                      <p className="text-xs text-foreground/80 whitespace-pre-wrap line-clamp-4">{event.content.activityPlan}</p>
                    </div>
                  )}
                  {event.content.weeklyGoals && (
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground mb-0.5">Weekly Goals</p>
                      <p className="text-xs text-foreground/80 whitespace-pre-wrap line-clamp-4">{event.content.weeklyGoals}</p>
                    </div>
                  )}
                  {!event.content.nutritionPlan && !event.content.activityPlan && !event.content.weeklyGoals && (
                    <p className="text-xs text-muted-foreground italic">No plan sections were set before this edit.</p>
                  )}
                </div>
              )}
              {event.type === "appointment" && event.content && (
                <div className="space-y-1">
                  <p className="text-xs"><span className="text-muted-foreground">With:</span> <span className="font-medium">{event.content.careTeamMember}</span></p>
                  <p className="text-xs"><span className="text-muted-foreground">Status:</span> <span className="font-medium">{event.content.status}</span></p>
                  {event.content.notes && <p className="text-xs text-muted-foreground italic">"{event.content.notes}"</p>}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
