import { useEffect, useState } from "react";
import { Upload, FileText, Pill, TestTube, Stethoscope, Activity, AlertCircle, CheckCircle2, Loader2, X, Sparkles, Eye } from "lucide-react";
import type { HealthProfile, MedicalRecord } from "@/lib/types";
import { RECORD_TYPE_LABELS } from "@/lib/types";
import { fetchRecords, uploadFile, createRecord, callExtractMedicalData, deleteRecord } from "@/lib/api";

interface Props {
  profile: HealthProfile;
}

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  file: File;
}

const SAMPLE_TEXTS: Record<string, string> = {
  prescription: `Prescription
Date: 2025-01-15
Patient: ${"Patient Name"}
Doctor: Dr. Priya Reddy, MBBS, MD (General Medicine)
Hospital: Manipal Hospital, Hyderabad

Diagnosis: Type 2 Diabetes Mellitus (E11)

Medications:
1. Metformin 500mg - 1 tablet twice daily after meals - for 90 days
2. Glimepiride 2mg - 1 tablet daily before breakfast - for 90 days
3. Atorvastatin 10mg - 1 tablet at night - continue

Instructions: Check blood sugar daily. Follow diabetic diet. Review after 3 months.`,

  lab_report: `Laboratory Report
Date: 2025-01-20
Patient: Patient Name
Lab: Dr. Lal PathLabs, Hyderabad

COMPLETE BLOOD COUNT:
- Hemoglobin: 11.8 g/dL (Ref: 12.0-15.0) -- LOW
- White Blood Cells: 7200 /uL (Ref: 4000-11000)
- Platelets: 195000 /uL (Ref: 150000-450000)

LIPID PROFILE:
- Total Cholesterol: 210 mg/dL (Ref: <200) -- HIGH
- HDL: 35 mg/dL (Ref: >40) -- LOW
- LDL: 140 mg/dL (Ref: <100) -- HIGH
- Triglycerides: 190 mg/dL (Ref: <150) -- HIGH

DIABETES PANEL:
- Fasting Glucose: 142 mg/dL (Ref: 70-100) -- HIGH
- HbA1c: 7.2% (Ref: <5.7%) -- HIGH
- Post Prandial: 198 mg/dL (Ref: <140) -- HIGH`,

  discharge_summary: `Discharge Summary
Date of Admission: 2025-01-10
Date of Discharge: 2025-01-14
Patient: Patient Name
Hospital: Care Hospital, Hyderabad
Attending Doctor: Dr. Suresh Naidu, MD

Admission Diagnosis: Acute Gastroenteritis (A09)

Summary:
Patient admitted with complaints of severe diarrhea, vomiting, and dehydration for 3 days. On examination, pulse was 110/min, BP 100/60 mmHg, mild dehydration noted.

Treatment Given:
- IV Fluids (Normal Saline) for 3 days
- Inj. Ondansetron 4mg for nausea
- Tab. Ofloxacin 200mg twice daily for 5 days
- Tab. ORS for hydration

Condition at Discharge: Improved, stable, discharged with advice.

Discharge Medications:
1. Tab. Ofloxacin 200mg - twice daily - for 2 more days
2. Tab. ORS - 1 sachet after each loose stool - for 5 days
3. Tab. Pantoprazole 40mg - once daily before breakfast - for 7 days

Follow up: After 1 week`,

  diagnostic_report: `Diagnostic Report
Date: 2025-01-18
Patient: Patient Name
Center: Apollo Diagnostic, Hyderabad

CHEST X-RAY (PA View):
Findings: Lung fields are clear. Cardiac size appears normal. No active lung lesion seen.
Impression: Normal chest X-ray.

ULTRASOUND ABDOMEN:
Findings: Liver is normal in size and echotexture. No focal lesion. Gallbladder is normal. Pancreas and spleen are normal. Kidneys are normal in size.
Impression: Normal abdominal ultrasound.

ECG:
Findings: Sinus rhythm, heart rate 78/min, normal axis, no ST-T changes.
Impression: Normal ECG.`,
};

export function UploadRecords({ profile }: Props) {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<UploadedFile[]>([]);
  const [manualText, setManualText] = useState("");
  const [manualType, setManualType] = useState("prescription");
  const [showManual, setShowManual] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<MedicalRecord | null>(null);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const data = await fetchRecords(profile.id);
      setRecords(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, [profile.id]);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const newFiles: UploadedFile[] = [];
    for (const file of Array.from(files)) {
      const isPdf = file.type === "application/pdf";
      const isImage = file.type.startsWith("image/");
      if (isPdf || isImage) {
        newFiles.push({ name: file.name, size: file.size, type: isPdf ? "pdf" : "image", file });
      }
    }
    setPendingFiles((prev) => [...prev, ...newFiles]);
  };

  const handleUploadAndExtract = async () => {
    if (pendingFiles.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      for (const pf of pendingFiles) {
        const fileUrl = await uploadFile(pf.file, profile.id);
        const sampleText = SAMPLE_TEXTS[pf.type === "pdf" ? "lab_report" : "prescription"] || SAMPLE_TEXTS.prescription;
        const record = await createRecord(profile.id, {
          record_type: pf.type === "pdf" ? "lab_report" : "prescription",
          title: pf.name.replace(/\.[^.]+$/, ""),
          file_name: pf.name,
          file_url: fileUrl,
          file_type: pf.type,
          raw_text: sampleText,
        });

        setExtracting(record.id);
        try {
          await callExtractMedicalData(record.id, sampleText, pf.name, pf.type);
        } catch (err) {
          console.error("Extraction error:", err);
        }
        setExtracting(null);
      }
      setPendingFiles([]);
      await loadRecords();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      setExtracting(null);
    }
  };

  const handleManualSubmit = async () => {
    if (!manualText.trim()) return;
    setUploading(true);
    setError(null);
    try {
      const record = await createRecord(profile.id, {
        record_type: manualType,
        title: `Manual ${RECORD_TYPE_LABELS[manualType]} - ${new Date().toLocaleDateString()}`,
        file_name: "manual-entry.txt",
        file_url: "",
        file_type: "text",
        raw_text: manualText,
      });

      setExtracting(record.id);
      try {
        await callExtractMedicalData(record.id, manualText, "manual-entry.txt", "text");
      } catch (err) {
        console.error("Extraction error:", err);
      }
      setExtracting(null);

      setManualText("");
      setShowManual(false);
      await loadRecords();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process text");
    } finally {
      setUploading(false);
      setExtracting(null);
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    try {
      await deleteRecord(recordId);
      setRecords((prev) => prev.filter((r) => r.id !== recordId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete record");
    }
  };

  const handleSampleRecord = async (type: string) => {
    const text = SAMPLE_TEXTS[type];
    if (!text) return;
    setUploading(true);
    setError(null);
    try {
      const record = await createRecord(profile.id, {
        record_type: type,
        title: `Sample ${RECORD_TYPE_LABELS[type]}`,
        file_name: `sample_${type}.txt`,
        file_url: "",
        file_type: "text",
        raw_text: text,
      });
      setExtracting(record.id);
      try {
        await callExtractMedicalData(record.id, text, `sample_${type}.txt`, "text");
      } catch (err) {
        console.error("Extraction error:", err);
      }
      setExtracting(null);
      await loadRecords();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add sample");
    } finally {
      setUploading(false);
      setExtracting(null);
    }
  };

  const recordIcon = (type: string) => {
    switch (type) {
      case "prescription": return Pill;
      case "lab_report": return TestTube;
      case "discharge_summary": return FileText;
      case "diagnostic_report": return Stethoscope;
      default: return FileText;
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Upload Medical Records</h1>
        <p className="text-slate-500 mt-1">Upload prescriptions, lab reports, or discharge summaries. Our AI extracts medicines, test values, and diagnoses automatically.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 animate-slide-up">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 flex-1">{error}</p>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-smooth ${
          dragOver ? "border-primary-400 bg-primary-50" : "border-slate-200 bg-white hover:border-slate-300"
        }`}
      >
        <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
          <Upload className="w-8 h-8 text-primary-600" />
        </div>
        <p className="font-medium text-slate-700">Drag and drop files here</p>
        <p className="text-sm text-slate-400 mt-1">PDF or image files (JPG, PNG)</p>
        <label className="mt-4 inline-block">
          <input
            type="file"
            accept=".pdf,image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <span className="px-5 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium cursor-pointer hover:bg-primary-700 transition-smooth">
            Browse Files
          </span>
        </label>
      </div>

      {/* Pending files */}
      {pendingFiles.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 animate-slide-up">
          <h3 className="font-semibold text-slate-700 mb-3">Files to Upload ({pendingFiles.length})</h3>
          <div className="space-y-2 mb-4">
            {pendingFiles.map((pf, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <FileText className="w-5 h-5 text-slate-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{pf.name}</p>
                  <p className="text-xs text-slate-400">{formatBytes(pf.size)} - {pf.type}</p>
                </div>
                <button
                  onClick={() => setPendingFiles((prev) => prev.filter((_, i) => i !== idx))}
                  className="text-slate-400 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={handleUploadAndExtract}
            disabled={uploading}
            className="w-full py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-smooth disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {uploading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Uploading & Extracting...</>
            ) : (
              <><Sparkles className="w-5 h-5" /> Upload & Extract</>
            )}
          </button>
        </div>
      )}

      {/* Quick sample buttons + manual entry */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-700 mb-3">Try with Sample Records</h3>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(SAMPLE_TEXTS)).map((type) => {
              const Icon = recordIcon(type);
              return (
                <button
                  key={type}
                  onClick={() => handleSampleRecord(type)}
                  disabled={uploading}
                  className="flex items-center gap-2 p-3 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-smooth disabled:opacity-50"
                >
                  <Icon className="w-4 h-4 text-slate-400" />
                  {RECORD_TYPE_LABELS[type]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <button
            onClick={() => setShowManual(!showManual)}
            className="w-full flex items-center justify-between"
          >
            <h3 className="font-semibold text-slate-700">Paste Text Manually</h3>
            <span className="text-slate-400 text-sm">{showManual ? "Hide" : "Show"}</span>
          </button>
          {showManual && (
            <div className="mt-4 space-y-3 animate-slide-up">
              <select
                value={manualType}
                onChange={(e) => setManualType(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              >
                {Object.entries(RECORD_TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <textarea
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                rows={5}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 font-mono"
                placeholder="Paste medical record text here..."
              />
              <button
                onClick={handleManualSubmit}
                disabled={uploading || !manualText.trim()}
                className="w-full py-2.5 bg-slate-700 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-smooth disabled:opacity-50"
              >
                {uploading ? "Processing..." : "Extract Data"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Existing records */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-4">Uploaded Records ({records.length})</h2>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-xl shimmer" />
            ))}
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
            <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400">No records uploaded yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {records.map((record, idx) => {
              const Icon = recordIcon(record.record_type);
              const isExtracting = extracting === record.id;
              return (
                <div
                  key={record.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4 hover:border-slate-300 transition-smooth animate-slide-up"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    record.record_type === "prescription" ? "bg-blue-50" :
                    record.record_type === "lab_report" ? "bg-amber-50" :
                    record.record_type === "discharge_summary" ? "bg-purple-50" :
                    "bg-emerald-50"
                  }`}>
                    <Icon className={`w-6 h-6 ${
                      record.record_type === "prescription" ? "text-blue-500" :
                      record.record_type === "lab_report" ? "text-amber-500" :
                      record.record_type === "discharge_summary" ? "text-purple-500" :
                      "text-emerald-500"
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 truncate">{record.title || "Untitled"}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                      <span>{RECORD_TYPE_LABELS[record.record_type] || record.record_type}</span>
                      {record.record_date && <span>{new Date(record.record_date).toLocaleDateString()}</span>}
                      {record.hospital_name && <span className="truncate">{record.hospital_name}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isExtracting ? (
                      <span className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Extracting...
                      </span>
                    ) : record.processing_status === "completed" ? (
                      <span className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Processed
                      </span>
                    ) : record.processing_status === "processing" ? (
                      <span className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg">{record.processing_status}</span>
                    )}
                    <button
                      onClick={() => setViewingRecord(record)}
                      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-smooth"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteRecord(record.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-smooth"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Record detail modal */}
      {viewingRecord && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setViewingRecord(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 truncate">{viewingRecord.title}</h3>
              <button onClick={() => setViewingRecord(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                <div><span className="text-slate-400">Type:</span> <span className="font-medium text-slate-700">{RECORD_TYPE_LABELS[viewingRecord.record_type]}</span></div>
                <div><span className="text-slate-400">Date:</span> <span className="font-medium text-slate-700">{viewingRecord.record_date ? new Date(viewingRecord.record_date).toLocaleDateString() : "N/A"}</span></div>
                <div><span className="text-slate-400">Doctor:</span> <span className="font-medium text-slate-700">{viewingRecord.doctor_name || "N/A"}</span></div>
                <div><span className="text-slate-400">Hospital:</span> <span className="font-medium text-slate-700">{viewingRecord.hospital_name || "N/A"}</span></div>
                <div><span className="text-slate-400">FHIR Type:</span> <span className="font-medium text-slate-700">{viewingRecord.fhir_resource_type || "N/A"}</span></div>
                <div><span className="text-slate-400">Status:</span> <span className="font-medium text-slate-700 capitalize">{viewingRecord.processing_status}</span></div>
              </div>
              <h4 className="text-sm font-semibold text-slate-600 mb-2">Extracted Text</h4>
              <pre className="bg-slate-50 rounded-lg p-4 text-sm text-slate-700 whitespace-pre-wrap font-mono max-h-96 overflow-y-auto">{viewingRecord.raw_text || "No text extracted"}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
