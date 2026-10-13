export interface HealthProfile {
  id: string;
  patient_name: string;
  abha_id: string | null;
  date_of_birth: string | null;
  gender: string;
  blood_group: string | null;
  phone: string | null;
  address: string | null;
  allergies: string[];
  chronic_conditions: string[];
  emergency_contact: string | null;
  language_preference: string;
  created_at: string;
  updated_at: string;
}

export interface MedicalRecord {
  id: string;
  profile_id: string;
  record_type: string;
  title: string | null;
  file_name: string | null;
  file_url: string | null;
  file_type: string | null;
  raw_text: string | null;
  record_date: string | null;
  doctor_name: string | null;
  hospital_name: string | null;
  fhir_resource_type: string | null;
  processing_status: string;
  created_at: string;
  updated_at: string;
}

export interface ExtractedMedicine {
  id: string;
  record_id: string;
  profile_id: string;
  medicine_name: string;
  dosage: string | null;
  frequency: string | null;
  duration: string | null;
  instructions: string | null;
  start_date: string | null;
  created_at: string;
}

export interface ExtractedLabTest {
  id: string;
  record_id: string;
  profile_id: string;
  test_name: string;
  value: string | null;
  unit: string | null;
  reference_range: string | null;
  is_abnormal: boolean;
  flag: string;
  test_date: string | null;
  created_at: string;
}

export interface ExtractedDiagnosis {
  id: string;
  record_id: string;
  profile_id: string;
  diagnosis_name: string;
  icd_code: string | null;
  severity: string | null;
  diagnosis_date: string | null;
  notes: string | null;
  created_at: string;
}

export interface AbnormalExplanation {
  test: string;
  value: string;
  normal_range: string;
  explanation: string;
}

export interface HealthSummary {
  id: string;
  profile_id: string;
  summary_text: string;
  summary_language: string;
  summary_translations: Record<string, string>;
  key_findings: string[];
  recommendations: string[];
  abnormal_values_explanation: AbnormalExplanation[];
  risk_level: string;
  record_ids: string[];
  created_at: string;
}

export type RecordType = "prescription" | "lab_report" | "discharge_summary" | "diagnostic_report";

export const RECORD_TYPE_LABELS: Record<string, string> = {
  prescription: "Prescription",
  lab_report: "Lab Report",
  discharge_summary: "Discharge Summary",
  diagnostic_report: "Diagnostic Report",
};

export const RECORD_TYPE_ICONS: Record<string, string> = {
  prescription: "Pill",
  lab_report: "TestTube",
  discharge_summary: "FileText",
  diagnostic_report: "Stethoscope",
};

export const RISK_LEVELS: Record<string, { label: string; color: string; bgColor: string; borderColor: string }> = {
  low: { label: "Low Risk", color: "text-emerald-700", bgColor: "bg-emerald-50", borderColor: "border-emerald-200" },
  moderate: { label: "Moderate Risk", color: "text-amber-700", bgColor: "bg-amber-50", borderColor: "border-amber-200" },
  high: { label: "High Risk", color: "text-red-700", bgColor: "bg-red-50", borderColor: "border-red-200" },
};

export const LANGUAGES: Record<string, { label: string; nativeLabel: string }> = {
  en: { label: "English", nativeLabel: "English" },
  hi: { label: "Hindi", nativeLabel: "हिन्दी" },
  ta: { label: "Tamil", nativeLabel: "தமிழ்" },
  te: { label: "Telugu", nativeLabel: "తెలుగు" },
};
