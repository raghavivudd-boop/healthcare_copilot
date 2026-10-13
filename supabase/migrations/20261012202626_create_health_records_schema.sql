/*
# AI Health Summary Copilot - Core Schema (ABDM/FHIR-aligned)

## Overview
Creates the complete data model for the AI Health Summary Copilot:
- Health profiles (patient identity, ABHA mock linking)
- Medical records (FHIR-style: prescriptions, lab reports, discharge summaries, diagnostics)
- Extracted entities (medicines, dosages, test values, diagnoses, dates)
- AI health summaries (plain-language + multi-language)
- OCR extraction jobs (track processing status)

## New Tables

### health_profiles
- `id` (uuid PK)
- `patient_name` (text)
- `abha_id` (text, mock ABHA ID for ABDM readiness)
- `date_of_birth` (date)
- `gender` (text: male/female/other)
- `blood_group` (text)
- `phone` (text)
- `address` (text)
- `allergies` (text[])
- `chronic_conditions` (text[])
- `emergency_contact` (text)
- `language_preference` (text, default 'en')
- `created_at` / `updated_at` (timestamps)

### medical_records
- `id` (uuid PK)
- `profile_id` (uuid FK -> health_profiles)
- `record_type` (text: prescription, lab_report, discharge_summary, diagnostic_report)
- `title` (text)
- `file_name` (text)
- `file_url` (text, Supabase storage path)
- `file_type` (text: pdf, image)
- `raw_text` (text, OCR extracted text)
- `record_date` (date, when the medical event occurred)
- `doctor_name` (text)
- `hospital_name` (text)
- `fhir_resource_type` (text, FHIR resource type)
- `processing_status` (text: pending, processing, completed, failed)
- `created_at` / `updated_at` (timestamps)

### extracted_medicines
- `id` (uuid PK)
- `record_id` (uuid FK -> medical_records)
- `profile_id` (uuid FK -> health_profiles)
- `medicine_name` (text)
- `dosage` (text)
- `frequency` (text)
- `duration` (text)
- `instructions` (text)
- `start_date` (date)
- `created_at` (timestamp)

### extracted_lab_tests
- `id` (uuid PK)
- `record_id` (uuid FK -> medical_records)
- `profile_id` (uuid FK -> health_profiles)
- `test_name` (text)
- `value` (text)
- `unit` (text)
- `reference_range` (text)
- `is_abnormal` (boolean)
- `flag` (text: high, low, normal, critical)
- `test_date` (date)
- `created_at` (timestamp)

### extracted_diagnoses
- `id` (uuid PK)
- `record_id` (uuid FK -> medical_records)
- `profile_id` (uuid FK -> health_profiles)
- `diagnosis_name` (text)
- `icd_code` (text, ICD-10 for ABDM alignment)
- `severity` (text)
- `diagnosis_date` (date)
- `notes` (text)
- `created_at` (timestamp)

### health_summaries
- `id` (uuid PK)
- `profile_id` (uuid FK -> health_profiles)
- `summary_text` (text, plain-language English summary)
- `summary_language` (text, language code)
- `summary_translations` (jsonb, translations in regional languages)
- `key_findings` (jsonb, array of key findings)
- `recommendations` (jsonb, array of recommendations)
- `abnormal_values_explanation` (jsonb)
- `risk_level` (text: low, moderate, high)
- `record_ids` (uuid[], records included in this summary)
- `created_at` (timestamp)

## Security
- Single-tenant app (no sign-in required for hackathon demo)
- RLS enabled on all tables
- anon + authenticated have full CRUD (intentionally public/shared for demo)

## ABDM Readiness
- health_profiles has abha_id field for mock ABHA linking
- medical_records uses FHIR resource types
- extracted_diagnoses uses ICD-10 codes
- Schema is extensible to full FHIR R4 resources
*/

-- Health Profiles
CREATE TABLE IF NOT EXISTS health_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_name text NOT NULL,
  abha_id text,
  date_of_birth date,
  gender text DEFAULT 'other',
  blood_group text,
  phone text,
  address text,
  allergies text[] DEFAULT '{}',
  chronic_conditions text[] DEFAULT '{}',
  emergency_contact text,
  language_preference text DEFAULT 'en',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE health_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_profiles" ON health_profiles;
CREATE POLICY "anon_select_profiles" ON health_profiles FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_profiles" ON health_profiles;
CREATE POLICY "anon_insert_profiles" ON health_profiles FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_profiles" ON health_profiles;
CREATE POLICY "anon_update_profiles" ON health_profiles FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_profiles" ON health_profiles;
CREATE POLICY "anon_delete_profiles" ON health_profiles FOR DELETE
  TO anon, authenticated USING (true);

-- Medical Records
CREATE TABLE IF NOT EXISTS medical_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES health_profiles(id) ON DELETE CASCADE,
  record_type text NOT NULL DEFAULT 'prescription',
  title text,
  file_name text,
  file_url text,
  file_type text,
  raw_text text,
  record_date date,
  doctor_name text,
  hospital_name text,
  fhir_resource_type text,
  processing_status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_records" ON medical_records;
CREATE POLICY "anon_select_records" ON medical_records FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_records" ON medical_records;
CREATE POLICY "anon_insert_records" ON medical_records FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_records" ON medical_records;
CREATE POLICY "anon_update_records" ON medical_records FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_records" ON medical_records;
CREATE POLICY "anon_delete_records" ON medical_records FOR DELETE
  TO anon, authenticated USING (true);

-- Extracted Medicines
CREATE TABLE IF NOT EXISTS extracted_medicines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id uuid REFERENCES medical_records(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES health_profiles(id) ON DELETE CASCADE,
  medicine_name text NOT NULL,
  dosage text,
  frequency text,
  duration text,
  instructions text,
  start_date date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE extracted_medicines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_medicines" ON extracted_medicines;
CREATE POLICY "anon_select_medicines" ON extracted_medicines FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_medicines" ON extracted_medicines;
CREATE POLICY "anon_insert_medicines" ON extracted_medicines FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_medicines" ON extracted_medicines;
CREATE POLICY "anon_update_medicines" ON extracted_medicines FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_medicines" ON extracted_medicines;
CREATE POLICY "anon_delete_medicines" ON extracted_medicines FOR DELETE
  TO anon, authenticated USING (true);

-- Extracted Lab Tests
CREATE TABLE IF NOT EXISTS extracted_lab_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id uuid REFERENCES medical_records(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES health_profiles(id) ON DELETE CASCADE,
  test_name text NOT NULL,
  value text,
  unit text,
  reference_range text,
  is_abnormal boolean DEFAULT false,
  flag text DEFAULT 'normal',
  test_date date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE extracted_lab_tests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_labtests" ON extracted_lab_tests;
CREATE POLICY "anon_select_labtests" ON extracted_lab_tests FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_labtests" ON extracted_lab_tests;
CREATE POLICY "anon_insert_labtests" ON extracted_lab_tests FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_labtests" ON extracted_lab_tests;
CREATE POLICY "anon_update_labtests" ON extracted_lab_tests FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_labtests" ON extracted_lab_tests;
CREATE POLICY "anon_delete_labtests" ON extracted_lab_tests FOR DELETE
  TO anon, authenticated USING (true);

-- Extracted Diagnoses
CREATE TABLE IF NOT EXISTS extracted_diagnoses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id uuid REFERENCES medical_records(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES health_profiles(id) ON DELETE CASCADE,
  diagnosis_name text NOT NULL,
  icd_code text,
  severity text,
  diagnosis_date date,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE extracted_diagnoses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_diagnoses" ON extracted_diagnoses;
CREATE POLICY "anon_select_diagnoses" ON extracted_diagnoses FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_diagnoses" ON extracted_diagnoses;
CREATE POLICY "anon_insert_diagnoses" ON extracted_diagnoses FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_diagnoses" ON extracted_diagnoses;
CREATE POLICY "anon_update_diagnoses" ON extracted_diagnoses FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_diagnoses" ON extracted_diagnoses;
CREATE POLICY "anon_delete_diagnoses" ON extracted_diagnoses FOR DELETE
  TO anon, authenticated USING (true);

-- Health Summaries (AI-generated)
CREATE TABLE IF NOT EXISTS health_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES health_profiles(id) ON DELETE CASCADE,
  summary_text text NOT NULL,
  summary_language text DEFAULT 'en',
  summary_translations jsonb DEFAULT '{}',
  key_findings jsonb DEFAULT '[]',
  recommendations jsonb DEFAULT '[]',
  abnormal_values_explanation jsonb DEFAULT '[]',
  risk_level text DEFAULT 'low',
  record_ids uuid[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE health_summaries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_summaries" ON health_summaries;
CREATE POLICY "anon_select_summaries" ON health_summaries FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_summaries" ON health_summaries;
CREATE POLICY "anon_insert_summaries" ON health_summaries FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_summaries" ON health_summaries;
CREATE POLICY "anon_update_summaries" ON health_summaries FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_summaries" ON health_summaries;
CREATE POLICY "anon_delete_summaries" ON health_summaries FOR DELETE
  TO anon, authenticated USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_records_profile ON medical_records(profile_id);
CREATE INDEX IF NOT EXISTS idx_medicines_profile ON extracted_medicines(profile_id);
CREATE INDEX IF NOT EXISTS idx_labtests_profile ON extracted_lab_tests(profile_id);
CREATE INDEX IF NOT EXISTS idx_diagnoses_profile ON extracted_diagnoses(profile_id);
CREATE INDEX IF NOT EXISTS idx_summaries_profile ON health_summaries(profile_id);
CREATE INDEX IF NOT EXISTS idx_records_date ON medical_records(record_date);
