import { PatientLayout } from "@/components/layout/patient-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Eye, Trash2, Download, FolderOpen, Plus, X } from "lucide-react";
import { useState, useRef, useCallback } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

type DocCategory = "prescription" | "report" | "lab_test" | "discharge" | "other";

type DocEntry = {
  id: string;
  name: string;
  category: DocCategory;
  date: string;
  size: string;
  mimeType: string;
  data: string;
};

const CATEGORY_LABELS: Record<DocCategory, string> = {
  prescription: "Prescription",
  report: "Medical Report",
  lab_test: "Lab Test",
  discharge: "Discharge Summary",
  other: "Other",
};

const CATEGORY_COLORS: Record<DocCategory, string> = {
  prescription: "bg-blue-50 text-blue-700 border-blue-200",
  report: "bg-emerald-50 text-emerald-700 border-emerald-200",
  lab_test: "bg-purple-50 text-purple-700 border-purple-200",
  discharge: "bg-amber-50 text-amber-700 border-amber-200",
  other: "bg-slate-50 text-slate-600 border-slate-200",
};

const STORAGE_KEY = "cloudberry_patient_documents";

function loadDocs(): DocEntry[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}

function saveDocs(docs: DocEntry[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(docs)); } catch { }
}

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export default function PatientRecords() {
  const { toast } = useToast();
  const [docs, setDocs] = useState<DocEntry[]>(loadDocs);
  const [filter, setFilter] = useState<DocCategory | "all">("all");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [viewDoc, setViewDoc] = useState<DocEntry | null>(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ name: "", category: "prescription" as DocCategory });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setForm(f => ({ ...f, name: file.name.replace(/\.[^/.]+$/, "") }));
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) { handleFileSelect(file); setUploadOpen(true); }
  }, []);

  const closeUpload = () => {
    setUploadOpen(false);
    setSelectedFile(null);
    setForm({ name: "", category: "prescription" });
  };

  const handleUpload = () => {
    if (!selectedFile || !form.name.trim()) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const doc: DocEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: form.name.trim(),
        category: form.category,
        date: new Date().toISOString(),
        size: fmtSize(selectedFile.size),
        mimeType: selectedFile.type || "application/octet-stream",
        data: e.target?.result as string,
      };
      const updated = [doc, ...docs];
      setDocs(updated);
      saveDocs(updated);
      closeUpload();
      setUploading(false);
      toast({ title: "Document saved", description: `${doc.name} has been added to your records.` });
    };
    reader.onerror = () => {
      setUploading(false);
      toast({ title: "Upload failed", description: "Could not read the file. Please try again.", variant: "destructive" });
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleDelete = (id: string) => {
    const updated = docs.filter(d => d.id !== id);
    setDocs(updated);
    saveDocs(updated);
    toast({ title: "Document removed" });
  };

  const filtered = filter === "all" ? docs : docs.filter(d => d.category === filter);

  const counts: Record<string, number> = { all: docs.length };
  (Object.keys(CATEGORY_LABELS) as DocCategory[]).forEach(c => { counts[c] = docs.filter(d => d.category === c).length; });

  const filterTabs: [string, string][] = [
    ["all", "All"],
    ["prescription", "Prescriptions"],
    ["report", "Reports"],
    ["lab_test", "Lab Tests"],
    ["discharge", "Discharge"],
    ["other", "Other"],
  ];

  return (
    <PatientLayout>
      <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">My Documents</h1>
            <p className="text-muted-foreground text-sm">Your prescriptions, reports, and medical documents — stored privately on this device.</p>
          </div>
          <Button className="rounded-full shadow-sm gap-2" onClick={() => setUploadOpen(true)}>
            <Plus className="w-4 h-4" /> Upload Document
          </Button>
        </div>

        {/* Drop zone */}
        <div
          className="border-2 border-dashed border-border/50 rounded-2xl p-8 mb-6 flex flex-col items-center justify-center gap-2.5 text-center bg-muted/20 hover:bg-muted/30 transition-colors cursor-pointer"
          onClick={() => setUploadOpen(true)}
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
        >
          <Upload className="w-8 h-8 text-muted-foreground/50" />
          <p className="text-sm font-medium text-foreground">Drag & drop a file here, or click to browse</p>
          <p className="text-xs text-muted-foreground">PDF, JPG, PNG supported · Files stored locally on your device</p>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 flex-wrap mb-5">
          {filterTabs.map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val as DocCategory | "all")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                filter === val
                  ? "bg-primary text-white border-primary shadow-sm"
                  : "bg-white text-muted-foreground border-border/60 hover:text-foreground hover:border-border"
              }`}
            >
              {label}
              {counts[val] > 0 && (
                <span className="ml-1.5 opacity-70">{counts[val]}</span>
              )}
            </button>
          ))}
        </div>

        {/* Document list */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <FolderOpen className="w-7 h-7 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1.5">
              {filter === "all" ? "No documents uploaded yet" : `No ${CATEGORY_LABELS[filter as DocCategory] || filter} documents yet`}
            </p>
            <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
              {filter === "all"
                ? "Keep your prescriptions, lab reports, and medical documents in one place. Upload your first document to get started."
                : "Click 'Upload Document' to add files to this category."}
            </p>
            <Button variant="outline" className="mt-4 rounded-full gap-2 text-sm" onClick={() => setUploadOpen(true)}>
              <Upload className="w-4 h-4" /> Upload Document
            </Button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map(doc => (
              <div
                key={doc.id}
                className="flex items-center gap-4 p-4 rounded-xl border border-border/60 bg-white hover:shadow-sm transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center shrink-0 border border-primary/15">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{doc.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(doc.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    {" · "}{doc.size}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={`text-[10px] shrink-0 hidden sm:inline-flex ${CATEGORY_COLORS[doc.category]}`}
                >
                  {CATEGORY_LABELS[doc.category]}
                </Badge>
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    onClick={() => setViewDoc(doc)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="View"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <a
                    href={doc.data}
                    download={doc.name}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png,.webp,.gif"
          onChange={e => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0]); }}
        />

        {/* Upload Dialog */}
        <Dialog open={uploadOpen} onOpenChange={open => { if (!open) closeUpload(); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {!selectedFile ? (
                <div
                  className="border-2 border-dashed border-border/60 rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer hover:bg-muted/20 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={e => { e.preventDefault(); if (e.dataTransfer.files[0]) handleFileSelect(e.dataTransfer.files[0]); }}
                  onDragOver={e => e.preventDefault()}
                >
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground text-center">Click or drag file here</p>
                  <p className="text-xs text-muted-foreground">PDF, JPG, PNG — up to 10 MB</p>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
                  <FileText className="w-5 h-5 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">{fmtSize(selectedFile.size)}</p>
                  </div>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="text-muted-foreground hover:text-foreground p-1 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="space-y-2">
                <Label>Document Name</Label>
                <Input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Dr. Mehta Prescription — May 2026"
                />
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={form.category}
                  onValueChange={v => setForm(f => ({ ...f, category: v as DocCategory }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prescription">Prescription</SelectItem>
                    <SelectItem value="report">Medical Report</SelectItem>
                    <SelectItem value="lab_test">Lab Test / Blood Work</SelectItem>
                    <SelectItem value="discharge">Discharge Summary</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={closeUpload}>Cancel</Button>
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || !form.name.trim() || uploading}
              >
                {uploading ? "Saving…" : "Save Document"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Document Dialog */}
        <Dialog open={!!viewDoc} onOpenChange={open => { if (!open) setViewDoc(null); }}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <FileText className="w-4 h-4 text-primary shrink-0" />
                <span className="truncate">{viewDoc?.name}</span>
                {viewDoc && (
                  <Badge variant="outline" className={`ml-1 text-[10px] shrink-0 ${CATEGORY_COLORS[viewDoc.category]}`}>
                    {CATEGORY_LABELS[viewDoc.category]}
                  </Badge>
                )}
              </DialogTitle>
            </DialogHeader>
            {viewDoc && (
              <div className="rounded-xl overflow-hidden border border-border/60 max-h-[60vh] overflow-y-auto">
                {viewDoc.mimeType.startsWith("image/") ? (
                  <img src={viewDoc.data} alt={viewDoc.name} className="w-full object-contain" />
                ) : viewDoc.mimeType === "application/pdf" ? (
                  <iframe src={viewDoc.data} className="w-full h-[55vh]" title={viewDoc.name} />
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <FileText className="w-10 h-10 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">Preview not available for this file type</p>
                    <a href={viewDoc.data} download={viewDoc.name}>
                      <Button variant="outline" size="sm" className="gap-2 rounded-full">
                        <Download className="w-4 h-4" /> Download to view
                      </Button>
                    </a>
                  </div>
                )}
              </div>
            )}
            {viewDoc && (
              <div className="flex items-center justify-between pt-1">
                <p className="text-xs text-muted-foreground">
                  Added {new Date(viewDoc.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} · {viewDoc.size}
                </p>
                <a href={viewDoc.data} download={viewDoc.name}>
                  <Button variant="outline" size="sm" className="gap-1.5 rounded-full h-8 text-xs">
                    <Download className="w-3.5 h-3.5" /> Download
                  </Button>
                </a>
              </div>
            )}
          </DialogContent>
        </Dialog>

      </div>
    </PatientLayout>
  );
}
