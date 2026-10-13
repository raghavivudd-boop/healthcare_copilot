import { useEffect, useState } from "react";
import { Activity, Pill, TestTube, Stethoscope, FileText, TrendingUp, AlertTriangle, Heart, Calendar, Phone, MapPin, Shield, Upload, Sparkles, ArrowRight } from "lucide-react";
import type { HealthProfile, MedicalRecord, ExtractedMedicine, ExtractedLabTest, ExtractedDiagnosis, HealthSummary } from "@/lib/types";
import { RECORD_TYPE_LABELS, RISK_LEVELS } from "@/lib/types";
import { fetchRecords, fetchMedicines, fetchLabTests, fetchDiagnoses, fetchLatestSummary } from "@/lib/api";

interface Props {
  profile: HealthProfile;
  onNavigate: (page: "dashboard" | "upload" | "summary" | "timeline" | "architecture") => void;
}

export function Dashboard({ profile, onNavigate }: Props) {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [medicines, setMedicines] = useState<ExtractedMedicine[]>([]);
  const [labTests, setLabTests] = useState<ExtractedLabTest[]>([]);
  const [diagnoses, setDiagnoses] = useState<ExtractedDiagnosis[]>([]);
  const [summary, setSummary] = useState<HealthSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [r, m, l, d, s] = await Promise.all([
          fetchRecords(profile.id),
          fetchMedicines(profile.id),
          fetchLabTests(profile.id),
          fetchDiagnoses(profile.id),
          fetchLatestSummary(profile.id),
        ]);
        setRecords(r);
        setMedicines(m);
        setLabTests(l);
        setDiagnoses(d);
        setSummary(s);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [profile.id]);

  const abnormalTests = labTests.filter((t) => t.is_abnormal);
  const riskInfo = summary ? RISK_LEVELS[summary.risk_level] : null;
  const age = profile.date_of_birth ? Math.floor((Date.now() - new Date(profile.date_of_birth).getTime()) / 365.25 / 86400000) : null;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 rounded-2xl shimmer" />
        <div className="grid md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 rounded-xl shimmer" />)}
        </div>
        <div className="h-64 rounded-2xl shimmer" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile header card */}
      <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-20 -translate-x-20" />
        <div className="relative flex flex-col md:flex-row md:items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-3xl font-bold flex-shrink-0">
            {profile.patient_name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{profile.patient_name}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-primary-100">
              {age && <span>{age} years</span>}
              <span className="capitalize">{profile.gender}</span>
              {profile.blood_group && <span>Blood: {profile.blood_group}</span>}
              {profile.abha_id && (
                <span className="flex items-center gap-1 bg-white/15 px-2 py-0.5 rounded-md text-xs">
                  <Shield className="w-3 h-3" /> ABHA: {profile.abha_id}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => onNavigate("upload")}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/15 backdrop-blur-sm rounded-lg text-sm font-medium hover:bg-white/25 transition-smooth self-start"
          >
            <Upload className="w-4 h-4" /> Upload Records
          </button>
        </div>

        {profile.allergies.length > 0 || profile.chronic_conditions.length > 0 ? (
          <div className="relative mt-6 pt-6 border-t border-white/15 flex flex-wrap gap-4">
            {profile.allergies.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-200" />
                <span className="text-primary-100">Allergies:</span>
                <span className="font-medium">{profile.allergies.join(", ")}</span>
              </div>
            )}
            {profile.chronic_conditions.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <Heart className="w-4 h-4 text-red-200" />
                <span className="text-primary-100">Chronic:</span>
                <span className="font-medium">{profile.chronic_conditions.join(", ")}</span>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={FileText} label="Records" value={records.length} color="blue" onClick={() => onNavigate("upload")} />
        <StatCard icon={Pill} label="Medicines" value={medicines.length} color="emerald" />
        <StatCard icon={TestTube} label="Lab Tests" value={labTests.length} color="amber" />
        <StatCard icon={AlertTriangle} label="Abnormal" value={abnormalTests.length} color="red" onClick={() => onNavigate("summary")} />
      </div>

      {/* AI Summary preview */}
      {summary && riskInfo && (
        <div className={`bg-white rounded-2xl border-2 ${riskInfo.borderColor} p-6 animate-slide-up`}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Latest AI Health Summary</h3>
                <p className="text-xs text-slate-400">{new Date(summary.created_at).toLocaleString()}</p>
              </div>
            </div>
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${riskInfo.bgColor} ${riskInfo.color}`}>
              {riskInfo.label}
            </span>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed line-clamp-4 mb-4">
            {summary.summary_text}
          </p>

          {summary.key_findings.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Key Findings</p>
              <div className="flex flex-wrap gap-2">
                {summary.key_findings.slice(0, 4).map((finding, idx) => (
                  <span key={idx} className="text-xs bg-slate-50 text-slate-600 px-3 py-1.5 rounded-lg border border-slate-100">
                    {finding}
                  </span>
                ))}
                {summary.key_findings.length > 4 && (
                  <span className="text-xs text-slate-400 px-3 py-1.5">+{summary.key_findings.length - 4} more</span>
                )}
              </div>
            </div>
          )}

          <button
            onClick={() => onNavigate("summary")}
            className="flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 transition-smooth"
          >
            View Full Summary <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Recent records + medicines + diagnoses */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent records */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800">Recent Records</h3>
            <button onClick={() => onNavigate("upload")} className="text-xs text-primary-600 hover:underline">View all</button>
          </div>
          <div className="space-y-2">
            {records.slice(0, 5).map((record) => {
              const Icon = record.record_type === "prescription" ? Pill : record.record_type === "lab_report" ? TestTube : record.record_type === "discharge_summary" ? FileText : Stethoscope;
              return (
                <div key={record.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-smooth">
                  <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{record.title}</p>
                    <p className="text-xs text-slate-400">{RECORD_TYPE_LABELS[record.record_type]}</p>
                  </div>
                  {record.record_date && (
                    <span className="text-xs text-slate-400 flex-shrink-0">{new Date(record.record_date).toLocaleDateString()}</span>
                  )}
                </div>
              );
            })}
            {records.length === 0 && (
              <p className="text-center text-slate-400 py-6 text-sm">No records yet</p>
            )}
          </div>
        </div>

        {/* Current medications */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800">Current Medications</h3>
            <Pill className="w-4 h-4 text-slate-300" />
          </div>
          <div className="space-y-2">
            {medicines.slice(0, 5).map((med) => (
              <div key={med.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-smooth">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <Pill className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{med.medicine_name} {med.dosage}</p>
                  <p className="text-xs text-slate-400 truncate">{med.frequency}</p>
                </div>
              </div>
            ))}
            {medicines.length === 0 && (
              <p className="text-center text-slate-400 py-6 text-sm">No medications extracted yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Diagnoses + Abnormal tests */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="font-bold text-slate-800 mb-4">Diagnoses</h3>
          <div className="space-y-2">
            {diagnoses.map((diag) => (
              <div key={diag.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                <Stethoscope className="w-4 h-4 text-purple-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700">{diag.diagnosis_name}</p>
                  {diag.icd_code && <p className="text-xs text-slate-400">ICD-10: {diag.icd_code}</p>}
                </div>
                {diag.severity && (
                  <span className={`text-xs px-2 py-1 rounded ${
                    diag.severity === "severe" ? "bg-red-50 text-red-600" :
                    diag.severity === "moderate" ? "bg-amber-50 text-amber-600" :
                    "bg-emerald-50 text-emerald-600"
                  }`}>{diag.severity}</span>
                )}
              </div>
            ))}
            {diagnoses.length === 0 && <p className="text-center text-slate-400 py-6 text-sm">No diagnoses extracted yet</p>}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="font-bold text-slate-800 mb-4">Abnormal Test Results</h3>
          <div className="space-y-2">
            {abnormalTests.map((test) => (
              <div key={test.id} className="flex items-center gap-3 p-3 rounded-lg bg-red-50/50">
                <TrendingUp className={`w-4 h-4 flex-shrink-0 ${test.flag === "high" ? "text-red-500" : "text-blue-500"}`} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700">{test.test_name}</p>
                  <p className="text-xs text-slate-400">Normal: {test.reference_range}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${test.flag === "high" ? "text-red-600" : "text-blue-600"}`}>{test.value} {test.unit}</p>
                  <span className={`text-xs uppercase ${test.flag === "high" ? "text-red-500" : "text-blue-500"}`}>{test.flag}</span>
                </div>
              </div>
            ))}
            {abnormalTests.length === 0 && <p className="text-center text-slate-400 py-6 text-sm">No abnormal results</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, onClick }: { icon: typeof Activity; label: string; value: number; color: string; onClick?: () => void }) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
  };
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3 hover:border-slate-300 hover:shadow-sm transition-smooth text-left"
    >
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        <p className="text-xs text-slate-400">{label}</p>
      </div>
    </button>
  );
}
