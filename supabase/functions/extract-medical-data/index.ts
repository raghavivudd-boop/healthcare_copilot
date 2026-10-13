import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ExtractedMedicine {
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  start_date: string | null;
}

interface ExtractedLabTest {
  test_name: string;
  value: string;
  unit: string;
  reference_range: string;
  is_abnormal: boolean;
  flag: string;
  test_date: string | null;
}

interface ExtractedDiagnosis {
  diagnosis_name: string;
  icd_code: string;
  severity: string;
  diagnosis_date: string | null;
  notes: string;
}

interface ExtractionResult {
  raw_text: string;
  record_type: string;
  record_date: string | null;
  doctor_name: string;
  hospital_name: string;
  fhir_resource_type: string;
  medicines: ExtractedMedicine[];
  lab_tests: ExtractedLabTest[];
  diagnoses: ExtractedDiagnosis[];
}

// Parse medical text to extract structured data using regex patterns
function parseMedicalText(text: string): ExtractionResult {
  const lines = text.split("\n").map((l) => l.trim());

  // Determine record type
  let recordType = "prescription";
  let fhirResourceType = "MedicationRequest";
  const lowerText = text.toLowerCase();

  if (lowerText.includes("laboratory") || lowerText.includes("lab report") || lowerText.includes("blood count") || lowerText.includes("lipid profile") || lowerText.includes("glucose") || lowerText.includes("hemoglobin")) {
    recordType = "lab_report";
    fhirResourceType = "Observation";
  } else if (lowerText.includes("discharge") || lowerText.includes("discharged")) {
    recordType = "discharge_summary";
    fhirResourceType = "DocumentReference";
  } else if (lowerText.includes("diagnostic") || lowerText.includes("x-ray") || lowerText.includes("ct scan") || lowerText.includes("mri") || lowerText.includes("ultrasound")) {
    recordType = "diagnostic_report";
    fhirResourceType = "DiagnosticReport";
  }

  // Extract date
  let recordDate: string | null = null;
  const datePatterns = [
    /(?:date|dated)[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    /(?:date|dated)[:\s]+(\d{4}-\d{2}-\d{2})/i,
    /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,
    /(\d{4}-\d{2}-\d{2})/,
  ];
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      const rawDate = match[1];
      try {
        const parts = rawDate.split(/[\/\-]/);
        if (parts[0].length === 4) {
          recordDate = rawDate;
        } else if (parts[2].length === 2) {
          parts[2] = "20" + parts[2];
          recordDate = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
        } else {
          recordDate = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
        }
        break;
      } catch {
        // ignore parse errors
      }
    }
  }

  // Extract doctor name
  let doctorName = "";
  const doctorMatch = text.match(/(?:dr\.?|doctor)[:\s]+([a-z\s,\.]+?)(?:\n|$)/i);
  if (doctorMatch) doctorName = doctorMatch[1].trim();

  // Extract hospital name
  let hospitalName = "";
  const hospitalMatch = text.match(/(?:hospital|clinic|lab|laboratory|diagnostic)[:\s]+([a-z\s,\.]+?)(?:\n|$)/i);
  if (hospitalMatch) hospitalName = hospitalMatch[1].trim();

  // Extract medicines
  const medicines: ExtractedMedicine[] = [];
  const medPatterns = [
    /(?:\d+[\.\)]\s*)?([A-Z][a-zA-Z]+(?:\s\d+)?(?:mg|ml|mcg|g)?)\s*[-–]\s*(\d+\s*(?:mg|ml|mcg|g)?)\s*[-–]\s*([^\n]+)/g,
    /([A-Z][a-zA-Z]+)\s+(\d+\s*(?:mg|ml|mcg|g))\s*[-–]\s*([^\n]+)/g,
  ];

  for (const pattern of medPatterns) {
    let medMatch;
    while ((medMatch = pattern.exec(text)) !== null) {
      const fullName = medMatch[1].trim();
      const dosage = medMatch[2]?.trim() || "";
      const restLine = medMatch[3].trim();

      // Skip if it looks like a lab test (has reference range or mg/dL)
      if (restLine.includes("mg/dL") || restLine.includes("Ref:") || restLine.includes("g/dL")) continue;

      const parts = restLine.split(/\s*[-–]\s*/);
      const frequency = parts[0]?.trim() || "";
      const duration = parts[1]?.trim() || "";
      const instructions = parts.slice(2).join(" - ").trim();

      // Check for duplicates
      if (!medicines.find((m) => m.medicine_name === fullName)) {
        medicines.push({
          medicine_name: fullName,
          dosage,
          frequency,
          duration,
          instructions,
          start_date: recordDate,
        });
      }
    }
  }

  // Also look for numbered medication lists
  const medListPattern = /\d+[\.\)]\s+([A-Za-z][A-Za-z\s]+?)(?:\s+(\d+\s*(?:mg|ml|mcg|g)))?\s*[-–]\s*(.+?)(?:\n|$)/g;
  if (medicines.length === 0) {
    let medMatch;
    while ((medMatch = medListPattern.exec(text)) !== null) {
      const name = medMatch[1].trim();
      const dosage = medMatch[2]?.trim() || "";
      const restLine = medMatch[3].trim();
      if (restLine.includes("mg/dL") || restLine.includes("Ref:") || restLine.includes("g/dL")) continue;

      const parts = restLine.split(/\s*[-–]\s*/);
      medicines.push({
        medicine_name: name,
        dosage,
        frequency: parts[0]?.trim() || "",
        duration: parts[1]?.trim() || "",
        instructions: parts.slice(2).join(" - ").trim(),
        start_date: recordDate,
      });
    }
  }

  // Extract lab tests
  const labTests: ExtractedLabTest[] = [];
  const labTestPattern = /[-•]\s*(.+?):\s*(\d+\.?\d*)\s*([a-zA-Z%\/]+)?\s*(?:\(Ref:?\s*([^)]+)\))?\s*(?:--\s*(\w+))?/g;
  let labMatch;
  while ((labMatch = labTestPattern.exec(text)) !== null) {
    const testName = labMatch[1].trim();
    const value = labMatch[2].trim();
    const unit = labMatch[3]?.trim() || "";
    const refRange = labMatch[4]?.trim() || "";
    const flagText = (labMatch[5]?.trim() || "").toUpperCase();

    // Determine if abnormal
    let isAbnormal = false;
    let flag = "normal";

    if (flagText.includes("HIGH") || flagText.includes("CRITICAL")) {
      isAbnormal = true;
      flag = flagText.includes("CRITICAL") ? "critical" : "high";
    } else if (flagText.includes("LOW")) {
      isAbnormal = true;
      flag = "low";
    } else if (refRange) {
      // Try to determine abnormality from reference range
      const numericValue = parseFloat(value);
      const ltMatch = refRange.match(/<?\s*(\d+\.?\d*)/);
      const gtMatch = refRange.match(/>?\s*(\d+\.?\d*)/);
      const rangeMatch = refRange.match(/(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)/);

      if (rangeMatch) {
        const low = parseFloat(rangeMatch[1]);
        const high = parseFloat(rangeMatch[2]);
        if (numericValue > high) {
          isAbnormal = true;
          flag = "high";
        } else if (numericValue < low) {
          isAbnormal = true;
          flag = "low";
        }
      } else if (ltMatch) {
        const threshold = parseFloat(ltMatch[1]);
        if (refRange.startsWith("<") && numericValue >= threshold) {
          isAbnormal = true;
          flag = "high";
        }
      } else if (gtMatch) {
        const threshold = parseFloat(gtMatch[1]);
        if (refRange.startsWith(">") && numericValue <= threshold) {
          isAbnormal = true;
          flag = "low";
        }
      }
    }

    // Skip if it looks like a medicine entry
    if (unit === "mg" || unit === "ml" || unit === "mcg") continue;

    labTests.push({
      test_name: testName,
      value,
      unit,
      reference_range: refRange,
      is_abnormal: isAbnormal,
      flag,
      test_date: recordDate,
    });
  }

  // Extract diagnoses
  const diagnoses: ExtractedDiagnosis[] = [];
  const diagnosisPattern = /(?:diagnosis|diagnosed with)[:\s]+([A-Za-z\s,()]+?)(?:\s*\(?(I[A-Z]\d[\.\d]*)\)?)?(?:\n|$)/gi;
  let diagMatch;
  while ((diagMatch = diagnosisPattern.exec(text)) !== null) {
    const diagName = diagMatch[1].trim().replace(/[,\.]$/, "");
    const icdCode = diagMatch[2]?.trim() || "";

    let severity = "mild";
    const lowerDiag = diagName.toLowerCase();
    if (lowerDiag.includes("severe") || lowerDiag.includes("critical")) severity = "severe";
    else if (lowerDiag.includes("moderate")) severity = "moderate";

    if (!diagnoses.find((d) => d.diagnosis_name === diagName)) {
      diagnoses.push({
        diagnosis_name: diagName,
        icd_code: icdCode,
        severity,
        diagnosis_date: recordDate,
        notes: "",
      });
    }
  }

  return {
    raw_text: text,
    record_type: recordType,
    record_date: recordDate,
    doctor_name: doctorName,
    hospital_name: hospitalName,
    fhir_resource_type: fhirResourceType,
    medicines,
    lab_tests: labTests,
    diagnoses,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { record_id, raw_text, file_name, file_type } = await req.json();

    if (!record_id || !raw_text) {
      return new Response(
        JSON.stringify({ error: "record_id and raw_text are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Update record status to processing
    await supabase
      .from("medical_records")
      .update({ processing_status: "processing" })
      .eq("id", record_id);

    // Parse the medical text
    const result = parseMedicalText(raw_text);

    // Update the medical record with extracted metadata
    const { error: updateError } = await supabase
      .from("medical_records")
      .update({
        raw_text: result.raw_text,
        record_type: result.record_type,
        record_date: result.record_date,
        doctor_name: result.doctor_name,
        hospital_name: result.hospital_name,
        fhir_resource_type: result.fhir_resource_type,
        processing_status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", record_id);

    if (updateError) {
      throw new Error(`Failed to update record: ${updateError.message}`);
    }

    // Get the profile_id from the record
    const { data: record, error: recordError } = await supabase
      .from("medical_records")
      .select("profile_id")
      .eq("id", record_id)
      .maybeSingle();

    if (recordError || !record) {
      throw new Error("Failed to get record profile_id");
    }

    const profileId = record.profile_id;

    // Insert extracted medicines
    if (result.medicines.length > 0) {
      const medRows = result.medicines.map((m) => ({
        record_id,
        profile_id: profileId,
        ...m,
      }));
      const { error: medError } = await supabase
        .from("extracted_medicines")
        .insert(medRows);
      if (medError) console.error("Medicine insert error:", medError.message);
    }

    // Insert extracted lab tests
    if (result.lab_tests.length > 0) {
      const labRows = result.lab_tests.map((t) => ({
        record_id,
        profile_id: profileId,
        ...t,
      }));
      const { error: labError } = await supabase
        .from("extracted_lab_tests")
        .insert(labRows);
      if (labError) console.error("Lab test insert error:", labError.message);
    }

    // Insert extracted diagnoses
    if (result.diagnoses.length > 0) {
      const diagRows = result.diagnoses.map((d) => ({
        record_id,
        profile_id: profileId,
        ...d,
      }));
      const { error: diagError } = await supabase
        .from("extracted_diagnoses")
        .insert(diagRows);
      if (diagError) console.error("Diagnosis insert error:", diagError.message);
    }

    return new Response(
      JSON.stringify({
        success: true,
        record_id,
        extracted: {
          medicines: result.medicines.length,
          lab_tests: result.lab_tests.length,
          diagnoses: result.diagnoses.length,
        },
        data: result,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
