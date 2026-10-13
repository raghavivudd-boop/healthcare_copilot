import { Upload, FileText, Brain, Database, Globe, Shield, HeartPulse, ArrowRight, Layers, Zap, Stethoscope, Languages } from "lucide-react";

export function ArchitecturePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Architecture & Approach</h1>
        <p className="text-slate-500 mt-1">How the AI Health Summary Copilot works end-to-end.</p>
      </div>

      {/* Data pipeline diagram */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8">
        <h2 className="text-lg font-bold text-slate-800 mb-6">Data Pipeline</h2>
        <div className="grid md:grid-cols-5 gap-3">
          <PipelineStep icon={Upload} title="Upload" desc="PDF / Image drag-drop" color="blue" />
          <PipelineArrow />
          <PipelineStep icon={FileText} title="OCR & Text" desc="Text extraction from documents" color="amber" />
          <PipelineArrow />
          <PipelineStep icon={Brain} title="AI Extraction" desc="Medicines, tests, diagnoses parsed" color="emerald" />
          <PipelineArrow />
          <PipelineStep icon={HeartPulse} title="Summary" desc="Plain-language AI explanation" color="primary" />
          <PipelineArrow />
          <PipelineStep icon={Globe} title="Translate" desc="Hindi, Tamil, Telugu output" color="accent" />
        </div>
      </div>

      {/* System architecture */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8">
        <h2 className="text-lg font-bold text-slate-800 mb-6">System Architecture</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {/* Frontend */}
          <ArchColumn title="Frontend" icon={Layers} color="blue">
            <ArchItem title="React + TypeScript" desc="Single-page application with Vite" />
            <ArchItem title="Tailwind CSS" desc="Responsive design system with custom theme" />
            <ArchItem title="Lucide Icons" desc="Clean, consistent medical iconography" />
            <ArchItem title="Client-side State" desc="React hooks for data fetching & UI state" />
          </ArchColumn>

          {/* Backend */}
          <ArchColumn title="Backend (Edge Functions)" icon={Zap} color="emerald">
            <ArchItem title="extract-medical-data" desc="Parses OCR text: medicines, lab values, diagnoses using regex + NLP patterns" />
            <ArchItem title="generate-health-summary" desc="Builds plain-language summary, detects abnormal values, generates recommendations" />
            <ArchItem title="Multi-language Engine" desc="Translations in Hindi, Tamil, Telugu using Unicode-composed text" />
            <ArchItem title="Deno Runtime" desc="Serverless functions on Supabase Edge" />
          </ArchColumn>

          {/* Database */}
          <ArchColumn title="Database (Supabase)" icon={Database} color="amber">
            <ArchItem title="health_profiles" desc="Patient identity, ABHA ID, allergies, chronic conditions" />
            <ArchItem title="medical_records" desc="FHIR-typed records with OCR text, file storage refs" />
            <ArchItem title="extracted_medicines" desc="Structured medicine data: name, dosage, frequency" />
            <ArchItem title="extracted_lab_tests" desc="Test values with abnormality detection & flags" />
            <ArchItem title="extracted_diagnoses" desc="ICD-10 coded diagnoses with severity" />
            <ArchItem title="health_summaries" desc="AI summaries with translations & recommendations" />
            <ArchItem title="Storage Bucket" desc="File storage for PDFs and images" />
          </ArchColumn>
        </div>
      </div>

      {/* ABDM readiness */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8">
        <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary-600" /> ABDM / ABHA Readiness
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <ABDMItem title="FHIR-Aligned Schema" desc="medical_records use FHIR resource types: MedicationRequest, Observation, DiagnosticReport, DocumentReference" />
            <ABDMItem title="Mock ABHA ID" desc="health_profiles.abha_id stores a mock ABHA ID (e.g., ABHA-91-4521-8830-2341) ready for real ABHA linking" />
            <ABDMItem title="ICD-10 Coding" desc="Diagnoses are extracted with ICD-10 codes (e.g., I10 for hypertension, E11 for diabetes)" />
            <ABDMItem title="Extensible to FHIR R4" desc="Schema designed to map to full FHIR R4 resources for ABDM compliance" />
          </div>
          <div className="bg-primary-50 rounded-xl p-5 border border-primary-100">
            <h3 className="font-semibold text-primary-800 mb-2">FHIR Resource Mapping</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Prescription</span>
                <code className="text-xs bg-white px-2 py-1 rounded text-primary-700">MedicationRequest</code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Lab Report</span>
                <code className="text-xs bg-white px-2 py-1 rounded text-primary-700">Observation</code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Discharge Summary</span>
                <code className="text-xs bg-white px-2 py-1 rounded text-primary-700">DocumentReference</code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Diagnostic Report</span>
                <code className="text-xs bg-white px-2 py-1 rounded text-primary-700">DiagnosticReport</code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Diagnosis</span>
                <code className="text-xs bg-white px-2 py-1 rounded text-primary-700">Condition (ICD-10)</code>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key features */}
      <div className="grid md:grid-cols-2 gap-6">
        <FeatureCard icon={Brain} title="AI Health Intelligence" color="emerald" items={[
          "Automatic extraction of medicines, dosages, frequencies, durations",
          "Lab test parsing with reference range comparison & abnormality detection",
          "Diagnosis extraction with ICD-10 code mapping",
          "Plain-language summary explaining what abnormal values mean",
          "Risk level assessment (low, moderate, high) based on findings",
        ]} />
        <FeatureCard icon={Languages} title="Multi-language Support" color="blue" items={[
          "Summaries generated in English by default",
          "Translations in Hindi, Tamil, and Telugu",
          "Language switcher on the summary page",
          "Unicode-composed text for accurate regional rendering",
          "Designed for bilingual/handwritten prescription support",
        ]} />
      </div>

      {/* Tech stack */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Technology Stack</h2>
        <div className="flex flex-wrap gap-3">
          {["React 18", "TypeScript", "Vite", "Tailwind CSS", "Supabase", "PostgreSQL", "Deno Edge Functions", "FHIR R4", "ICD-10", "ABDM Compliant", "Lucide Icons"].map((tech) => (
            <span key={tech} className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-600">
              {tech}
            </span>
          ))}
        </div>
      </div>

      {/* Demo flow */}
      <div className="bg-gradient-to-br from-primary-50 to-emerald-50 rounded-2xl border border-primary-100 p-6 md:p-8">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-primary-600" /> Demo Flow
        </h2>
        <div className="space-y-3">
          {[
            { num: 1, title: "Select or create a health profile", desc: "Includes mock ABHA ID for ABDM readiness" },
            { num: 2, title: "Upload medical records", desc: "Drag-drop PDF/image, paste text, or try sample records" },
            { num: 3, title: "AI extracts structured data", desc: "Medicines, lab tests, diagnoses automatically parsed" },
            { num: 4, title: "Generate AI Health Summary", desc: "Plain-language explanation with abnormal value insights" },
            { num: 5, title: "Switch languages", desc: "View summary in Hindi, Tamil, or Telugu" },
            { num: 6, title: "Browse the timeline", desc: "Unified chronological view of all health events" },
          ].map((step) => (
            <div key={step.num} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-primary-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                {step.num}
              </div>
              <div>
                <p className="font-medium text-slate-800 text-sm">{step.title}</p>
                <p className="text-sm text-slate-500">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PipelineStep({ icon: Icon, title, desc, color }: { icon: typeof Upload; title: string; desc: string; color: string }) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    primary: "bg-primary-50 text-primary-600 border-primary-100",
    accent: "bg-accent-50 text-accent-600 border-accent-100",
  };
  return (
    <div className={`rounded-xl border p-4 text-center ${colors[color]}`}>
      <Icon className="w-7 h-7 mx-auto mb-2" />
      <p className="font-bold text-sm text-slate-800">{title}</p>
      <p className="text-xs text-slate-500 mt-1">{desc}</p>
    </div>
  );
}

function PipelineArrow() {
  return (
    <div className="hidden md:flex items-center justify-center">
      <ArrowRight className="w-5 h-5 text-slate-300" />
    </div>
  );
}

function ArchColumn({ title, icon: Icon, color, children }: { title: string; icon: typeof Layers; color: string; children: React.ReactNode }) {
  const colors: Record<string, string> = {
    blue: "text-blue-600 bg-blue-50",
    emerald: "text-emerald-600 bg-emerald-50",
    amber: "text-amber-600 bg-amber-50",
  };
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="font-bold text-slate-800">{title}</h3>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function ArchItem({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="p-3 bg-slate-50 rounded-lg">
      <p className="font-medium text-sm text-slate-700">{title}</p>
      <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
    </div>
  );
}

function ABDMItem({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
      <Shield className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
      <div>
        <p className="font-medium text-sm text-slate-700">{title}</p>
        <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, color, items }: { icon: typeof Brain; title: string; color: string; items: string[] }) {
  const colors: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="font-bold text-slate-800">{title}</h3>
      </div>
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-2 flex-shrink-0" />
            <p className="text-sm text-slate-600">{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
