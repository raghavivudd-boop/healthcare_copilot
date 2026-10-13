import { useEffect, useState } from "react";
import { Pill, TestTube, FileText, Stethoscope, Calendar, MapPin, User, Activity, Heart } from "lucide-react";
import type { HealthProfile, MedicalRecord, ExtractedMedicine, ExtractedLabTest, ExtractedDiagnosis } from "@/lib/types";
import { RECORD_TYPE_LABELS } from "@/lib/types";
import { fetchRecords, fetchMedicines, fetchLabTests, fetchDiagnoses } from "@/lib/api";

interface Props {
  profile: HealthProfile;
}

interface TimelineItem {
  date: string | null;
  type: "record" | "medicine" | "lab_test" | "diagnosis";
  title: string;
  subtitle: string;
  detail?: string;
  recordType?: string;
  isAbnormal?: boolean;
  flag?: string;
}

export function Timeline({ profile }: Props) {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [medicines, setMedicines] = useState<ExtractedMedicine[]>([]);
  const [labTests, setLabTests] = useState<ExtractedLabTest[]>([]);
  const [diagnoses, setDiagnoses] = useState<ExtractedDiagnosis[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [r, m, l, d] = await Promise.all([
          fetchRecords(profile.id),
          fetchMedicines(profile.id),
          fetchLabTests(profile.id),
          fetchDiagnoses(profile.id),
        ]);
        setRecords(r);
        setMedicines(m);
        setLabTests(l);
        setDiagnoses(d);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [profile.id]);

  const items: TimelineItem[] = [
    ...records.map((r) => ({
      date: r.record_date || r.created_at,
      type: "record" as const,
      title: r.title || "Untitled Record",
      subtitle: RECORD_TYPE_LABELS[r.record_type] || r.record_type,
      detail: r.hospital_name || r.doctor_name || "",
      recordType: r.record_type,
    })),
    ...medicines.map((m) => ({
      date: m.start_date || m.created_at,
      type: "medicine" as const,
      title: `${m.medicine_name} ${m.dosage || ""}`.trim(),
      subtitle: m.frequency || "",
      detail: m.duration || "",
    })),
    ...labTests.map((t) => ({
      date: t.test_date || t.created_at,
      type: "lab_test" as const,
      title: t.test_name,
      subtitle: `${t.value} ${t.unit} (Normal: ${t.reference_range})`,
      detail: "",
      isAbnormal: t.is_abnormal,
      flag: t.flag,
    })),
    ...diagnoses.map((d) => ({
      date: d.diagnosis_date || d.created_at,
      type: "diagnosis" as const,
      title: d.diagnosis_name,
      subtitle: d.icd_code ? `ICD-10: ${d.icd_code}` : "",
      detail: d.severity || "",
    })),
  ].sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return dateB - dateA;
  });

  const filteredItems = filter === "all" ? items : items.filter((i) => i.type === filter);

  const filters = [
    { id: "all", label: "All", count: items.length },
    { id: "record", label: "Records", count: items.filter((i) => i.type === "record").length },
    { id: "medicine", label: "Medicines", count: items.filter((i) => i.type === "medicine").length },
    { id: "lab_test", label: "Lab Tests", count: items.filter((i) => i.type === "lab_test").length },
    { id: "diagnosis", label: "Diagnoses", count: items.filter((i) => i.type === "diagnosis").length },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 shimmer rounded-lg" />
        <div className="space-y-3">{[1, 2, 3, 4].map((i) => <div key={i} className="h-20 rounded-xl shimmer" />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Health Timeline</h1>
        <p className="text-slate-500 mt-1">A chronological view of all your medical records, medications, tests, and diagnoses.</p>
      </div>

      {/* Profile summary */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold">
              {profile.patient_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-slate-800">{profile.patient_name}</p>
              {profile.abha_id && <p className="text-xs text-slate-400">ABHA: {profile.abha_id}</p>}
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-slate-500">
            {profile.date_of_birth && (
              <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-slate-400" /> {new Date(profile.date_of_birth).toLocaleDateString()}</span>
            )}
            {profile.gender && <span className="flex items-center gap-1.5"><User className="w-4 h-4 text-slate-400" /> <span className="capitalize">{profile.gender}</span></span>}
            {profile.blood_group && <span className="flex items-center gap-1.5"><Heart className="w-4 h-4 text-slate-400" /> {profile.blood_group}</span>}
            {profile.address && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-slate-400" /> {profile.address}</span>}
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-smooth ${
              filter === f.id ? "bg-primary-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {f.label}
            <span className={`text-xs px-1.5 py-0.5 rounded ${filter === f.id ? "bg-white/20" : "bg-slate-100 text-slate-500"}`}>{f.count}</span>
          </button>
        ))}
      </div>

      {/* Timeline */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <Activity className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-400">No records found in this category</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-2 bottom-2 w-0.5 bg-slate-200" />

          <div className="space-y-4">
            {filteredItems.map((item, idx) => {
              const Icon = item.type === "record" ? (item.recordType === "prescription" ? Pill : item.recordType === "lab_report" ? TestTube : item.recordType === "discharge_summary" ? FileText : Stethoscope) :
                item.type === "medicine" ? Pill :
                item.type === "lab_test" ? TestTube : Stethoscope;

              const iconBg = item.type === "record" ? (item.recordType === "prescription" ? "bg-blue-100 text-blue-600" : item.recordType === "lab_report" ? "bg-amber-100 text-amber-600" : item.recordType === "discharge_summary" ? "bg-purple-100 text-purple-600" : "bg-emerald-100 text-emerald-600") :
                item.type === "medicine" ? "bg-emerald-100 text-emerald-600" :
                item.type === "lab_test" ? (item.isAbnormal ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-500") :
                "bg-purple-100 text-purple-600";

              return (
                <div key={idx} className="relative flex items-start gap-4 animate-slide-up" style={{ animationDelay: `${idx * 40}ms` }}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 z-10 border-4 border-slate-50 ${iconBg}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 transition-smooth">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800 truncate">{item.title}</p>
                        <p className="text-sm text-slate-500 truncate">{item.subtitle}</p>
                        {item.detail && <p className="text-xs text-slate-400 mt-1">{item.detail}</p>}
                      </div>
                      <div className="text-right flex-shrink-0">
                        {item.date && (
                          <p className="text-xs text-slate-400">{new Date(item.date).toLocaleDateString()}</p>
                        )}
                        {item.isAbnormal && (
                          <span className={`text-xs font-semibold mt-1 inline-block ${item.flag === "high" ? "text-red-600" : "text-blue-600"}`}>
                            {item.flag?.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
