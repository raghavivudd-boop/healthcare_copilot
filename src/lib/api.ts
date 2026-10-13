import { supabase } from "./supabase";
import type {
  HealthProfile,
  MedicalRecord,
  ExtractedMedicine,
  ExtractedLabTest,
  ExtractedDiagnosis,
  HealthSummary,
} from "./types";

export async function fetchProfiles(): Promise<HealthProfile[]> {
  const { data, error } = await supabase
    .from("health_profiles")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchProfile(id: string): Promise<HealthProfile | null> {
  const { data, error } = await supabase
    .from("health_profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createProfile(profile: Partial<HealthProfile>): Promise<HealthProfile> {
  const { data, error } = await supabase
    .from("health_profiles")
    .insert(profile)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateProfile(id: string, updates: Partial<HealthProfile>): Promise<HealthProfile> {
  const { data, error } = await supabase
    .from("health_profiles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchRecords(profileId: string): Promise<MedicalRecord[]> {
  const { data, error } = await supabase
    .from("medical_records")
    .select("*")
    .eq("profile_id", profileId)
    .order("record_date", { ascending: false, nullsFirst: false });
  if (error) throw error;
  return data || [];
}

export async function fetchRecord(id: string): Promise<MedicalRecord | null> {
  const { data, error } = await supabase
    .from("medical_records")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchMedicines(profileId: string): Promise<ExtractedMedicine[]> {
  const { data, error } = await supabase
    .from("extracted_medicines")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchLabTests(profileId: string): Promise<ExtractedLabTest[]> {
  const { data, error } = await supabase
    .from("extracted_lab_tests")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchDiagnoses(profileId: string): Promise<ExtractedDiagnosis[]> {
  const { data, error } = await supabase
    .from("extracted_diagnoses")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchSummaries(profileId: string): Promise<HealthSummary[]> {
  const { data, error } = await supabase
    .from("health_summaries")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchLatestSummary(profileId: string): Promise<HealthSummary | null> {
  const { data, error } = await supabase
    .from("health_summaries")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function uploadFile(file: File, profileId: string): Promise<string> {
  const fileExt = file.name.split(".").pop();
  const fileName = `${profileId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
  const { error } = await supabase.storage
    .from("health-records")
    .upload(fileName, file);
  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from("health-records")
    .getPublicUrl(fileName);
  return urlData.publicUrl;
}

export async function createRecord(
  profileId: string,
  record: {
    record_type: string;
    title: string;
    file_name: string;
    file_url: string;
    file_type: string;
    raw_text: string;
  }
): Promise<MedicalRecord> {
  const { data, error } = await supabase
    .from("medical_records")
    .insert({
      profile_id: profileId,
      ...record,
      processing_status: "pending",
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteRecord(recordId: string): Promise<void> {
  const { error } = await supabase
    .from("medical_records")
    .delete()
    .eq("id", recordId);
  if (error) throw error;
}

export async function callExtractMedicalData(recordId: string, rawText: string, fileName: string, fileType: string) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const response = await fetch(`${supabaseUrl}/functions/v1/extract-medical-data`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${anonKey}`,
    },
    body: JSON.stringify({
      record_id: recordId,
      raw_text: rawText,
      file_name: fileName,
      file_type: fileType,
    }),
  });
  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.error || `Extraction failed (${response.status})`);
  }
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data;
}

export async function callGenerateSummary(profileId: string, recordIds?: string[]) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const response = await fetch(`${supabaseUrl}/functions/v1/generate-health-summary`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${anonKey}`,
    },
    body: JSON.stringify({
      profile_id: profileId,
      record_ids: recordIds,
    }),
  });
  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.error || `Summary generation failed (${response.status})`);
  }
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data;
}
