import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface MedicineRow {
  medicine_name: string;
  dosage: string;
  frequency: string;
}

interface LabTestRow {
  test_name: string;
  value: string;
  unit: string;
  reference_range: string;
  is_abnormal: boolean;
  flag: string;
}

interface DiagnosisRow {
  diagnosis_name: string;
  icd_code: string;
  severity: string;
}

interface SummaryResult {
  summary: string;
  key_findings: string[];
  recommendations: string[];
  abnormal_explanations: { test: string; value: string; normal_range: string; explanation: string }[];
  risk_level: string;
}

function buildSummary(
  patientName: string,
  medicines: MedicineRow[],
  labTests: LabTestRow[],
  diagnoses: DiagnosisRow[]
): SummaryResult {
  const parts: string[] = [];
  const keyFindings: string[] = [];
  const recommendations: string[] = [];
  const abnormalExplanations: { test: string; value: string; normal_range: string; explanation: string }[] = [];

  parts.push("Here is a simple summary of " + patientName + "'s health records.");

  if (medicines.length > 0) {
    parts.push("\n\nYour Medications:\nYou are currently taking " + medicines.length + " medicine" + (medicines.length > 1 ? "s" : "") + ":");
    for (const med of medicines) {
      parts.push("- " + med.medicine_name + (med.dosage ? " " + med.dosage : "") + (med.frequency ? ", taken " + med.frequency.toLowerCase() : ""));
    }
  }

  if (diagnoses.length > 0) {
    parts.push("\n\nYour Diagnoses:");
    for (const diag of diagnoses) {
      parts.push("- " + diag.diagnosis_name + (diag.severity ? " (" + diag.severity + " severity)" : ""));
      keyFindings.push("Diagnosed with " + diag.diagnosis_name + (diag.icd_code ? " (ICD-10: " + diag.icd_code + ")" : ""));
    }
  }

  const normalTests = labTests.filter((t) => !t.is_abnormal);
  const abnormalTests = labTests.filter((t) => t.is_abnormal);

  if (labTests.length > 0) {
    parts.push("\n\nYour Blood Test Results:");

    if (normalTests.length > 0) {
      parts.push("\nNormal results (no action needed):");
      for (const t of normalTests) {
        parts.push("- " + t.test_name + ": " + t.value + " " + t.unit + " \u2014 within the normal range of " + t.reference_range);
      }
    }

    if (abnormalTests.length > 0) {
      parts.push("\nResults that need attention:");
      for (const t of abnormalTests) {
        const direction = t.flag === "high" ? "higher than" : "lower than";
        parts.push("- " + t.test_name + ": " + t.value + " " + t.unit + " \u2014 this is " + direction + " the normal range of " + t.reference_range);
        keyFindings.push((t.flag === "high" ? "High" : "Low") + " " + t.test_name + " (" + t.value + " " + t.unit + ") \u2014 normal range is " + t.reference_range);
        const explanation = getExplanationForTest(t.test_name, t.flag);
        abnormalExplanations.push({
          test: t.test_name,
          value: t.value + " " + t.unit,
          normal_range: t.reference_range,
          explanation,
        });
      }
    }
  }

  let riskLevel = "low";
  if (abnormalTests.length >= 4 || diagnoses.some((d) => d.severity === "severe")) {
    riskLevel = "high";
  } else if (abnormalTests.length >= 2 || diagnoses.length > 0) {
    riskLevel = "moderate";
  }

  if (abnormalTests.some((t) => t.test_name.toLowerCase().includes("cholesterol") || t.test_name.toLowerCase().includes("ldl") || t.test_name.toLowerCase().includes("triglyceride"))) {
    recommendations.push("Reduce saturated fats (ghee, butter, red meat) and fried foods in your diet");
    recommendations.push("Add 30 minutes of brisk walking or exercise at least 5 days a week");
    recommendations.push("Include more fiber-rich foods: oats, fruits, vegetables, whole grains");
  }
  if (abnormalTests.some((t) => t.test_name.toLowerCase().includes("glucose") || t.test_name.toLowerCase().includes("hba1c") || t.test_name.toLowerCase().includes("sugar"))) {
    recommendations.push("Reduce sugar and refined carbohydrates (white rice, maida, sweets)");
    recommendations.push("Monitor blood sugar levels regularly");
    recommendations.push("Consider consulting a dietitian for a diabetic-friendly meal plan");
  }
  if (diagnoses.some((d) => d.diagnosis_name.toLowerCase().includes("hypertension") || d.diagnosis_name.toLowerCase().includes("blood pressure"))) {
    recommendations.push("Reduce salt intake to help manage blood pressure");
    recommendations.push("Monitor blood pressure weekly and keep a log");
  }
  if (medicines.length > 0) {
    recommendations.push("Continue taking prescribed medications as directed by your doctor");
  }
  if (abnormalTests.length > 0) {
    recommendations.push("Follow up with your doctor to discuss the " + abnormalTests.length + " abnormal test result" + (abnormalTests.length > 1 ? "s" : ""));
  }

  if (abnormalTests.length > 0) {
    parts.push("\n\nOverall Assessment:\nYour health records show " + abnormalTests.length + " test result" + (abnormalTests.length > 1 ? "s" : "") + " that need attention. " + (riskLevel === "high" ? "Multiple abnormal values suggest you should see your doctor soon for a thorough review." : riskLevel === "moderate" ? "With some abnormal values, lifestyle changes and regular monitoring can help improve your health." : "The abnormal values are minor and can likely be addressed with small lifestyle adjustments."));
  } else if (normalTests.length > 0) {
    parts.push("\n\nOverall Assessment:\nYour test results are within normal ranges. Continue maintaining a healthy lifestyle.");
  }

  if (recommendations.length > 0) {
    parts.push("\n\nWhat You Should Do:");
    for (const rec of recommendations) {
      parts.push("- " + rec);
    }
  }

  parts.push("\n\nRemember: This summary is for your understanding and does not replace professional medical advice. Always consult your doctor before making changes to your treatment.");

  return {
    summary: parts.join("\n"),
    key_findings: keyFindings,
    recommendations,
    abnormal_explanations: abnormalExplanations,
    risk_level: riskLevel,
  };
}

function getExplanationForTest(testName: string, flag: string): string {
  const name = testName.toLowerCase();
  const direction = flag === "high" ? "high" : "low";

  if (name.includes("cholesterol") && !name.includes("hdl")) {
    return "Your cholesterol is " + direction + ". This means there is too much cholesterol in your blood, which can build up in your arteries and increase the risk of heart attack and stroke.";
  }
  if (name.includes("ldl")) {
    return 'LDL is often called "bad" cholesterol. ' + (direction === "high" ? "High" : "Low") + " levels " + (direction === "high" ? "cause plaque buildup in arteries, restricting blood flow" : "may indicate other metabolic issues") + ". Your level is outside the safe range.";
  }
  if (name.includes("hdl")) {
    return 'HDL is "good" cholesterol that helps remove bad cholesterol from your blood. ' + (direction === "low" ? "Low HDL means your body is less able to clear cholesterol, increasing heart disease risk" : "Higher HDL is generally protective") + ".";
  }
  if (name.includes("triglyceride")) {
    return "Triglycerides are a type of fat in your blood. " + (direction === "high" ? "High levels, combined with high cholesterol, significantly increase heart disease risk" : "Low levels are generally not a concern") + ".";
  }
  if (name.includes("glucose") || name.includes("sugar")) {
    return "Your blood sugar is " + direction + ". " + (direction === "high" ? "This is in the pre-diabetes or diabetes range, meaning your body is having trouble managing blood sugar levels properly." : "Low blood sugar can cause dizziness and weakness.");
  }
  if (name.includes("hba1c")) {
    return "HbA1c shows your average blood sugar over the last 3 months. " + (direction === "high" ? "A high HbA1c means your blood sugar has been consistently above normal, indicating pre-diabetes (5.7-6.4%) or diabetes (above 6.5%)." : "A low HbA1c may indicate frequent low blood sugar episodes.");
  }
  if (name.includes("hemoglobin") || name.includes("hb")) {
    return "Hemoglobin carries oxygen in your blood. " + (direction === "low" ? "Low hemoglobin means anemia \u2014 you may feel tired, weak, or short of breath." : "High hemoglobin can thicken your blood.");
  }

  return "Your " + testName + " is " + direction + " compared to the normal range. This may need medical attention \u2014 discuss with your doctor.";
}

// Hindi translation using Unicode escapes
function generateHindiSummary(name: string): string {
  const lines = [
    "\u092F\u0939 " + name + " \u0915\u0947 \u0938\u094D\u0935\u093E\u0938\u094D\u0925\u094D\u092F \u0930\u093F\u0915\u0949\u0930\u094D\u0921 \u0915\u093E \u0938\u0930\u0932 \u0938\u093E\u0930\u093E\u0902\u0936 \u0939\u0948\u0964",
    "",
    "\u0906\u092A\u0915\u0940 \u0926\u0935\u093E\u092F\u0947\u0901:",
    "\u0906\u092A \u0935\u0930\u094D\u0924\u092E\u093E\u0928 \u092E\u0947\u0902 \u0928\u093F\u0930\u094D\u0927\u093E\u0930\u093F\u0924 \u0926\u0935\u093E\u092F\u0947\u0901 \u0932\u0947 \u0930\u0939\u0947 \u0939\u0948\u0902\u0964 \u0915\u0943\u092A\u092F\u093E \u0905\u092A\u0928\u0947 \u091A\u093F\u0915\u093F\u0924\u094D\u0938\u0915 \u0915\u0940 \u0938\u0932\u093E\u0939 \u0915\u0947 \u0905\u0928\u0941\u0938\u093E\u0930 \u0926\u0935\u093E\u092F\u0947\u0901 \u091C\u093E\u0930\u0940 \u0930\u0916\u0947\u0902\u0964",
    "",
    "\u0930\u0915\u094D\u0924 \u092A\u0930\u0940\u0915\u094D\u0937\u0923 \u092A\u0930\u093F\u0923\u093E\u092E:",
    "\u0906\u092A\u0915\u0947 \u0915\u0941\u091B \u0930\u0915\u094D\u0924 \u092A\u0930\u0940\u0915\u094D\u0937\u0923 \u092A\u0930\u093F\u0923\u093E\u092E \u0938\u093E\u092E\u093E\u0928\u094D\u092F \u0938\u0940\u092E\u093E \u0938\u0947 \u092C\u093E\u0939\u0930 \u0939\u0948\u0902\u0964 \u0935\u093F\u0938\u094D\u0924\u0943\u0924 \u091C\u093E\u0928\u0915\u093E\u0930\u0940 \u0915\u0947 \u0932\u093F\u090F \u0905\u0902\u0917\u094D\u0930\u0947\u091C\u093C\u0940 \u0938\u093E\u0930\u093E\u0902\u0936 \u0926\u0947\u0916\u0947\u0902\u0964",
    "",
    "\u0938\u093F\u092B\u093E\u0930\u093F\u0936:",
    "- \u0905\u092A\u0928\u0947 \u0906\u0939\u093E\u0930 \u092E\u0947\u0902 \u0935\u0938\u093E \u0914\u0930 \u0928\u092E\u0915 \u0915\u092E \u0915\u0930\u0947\u0902",
    "- \u0928\u093F\u092F\u092E\u093F\u0924 \u0930\u0942\u092A \u0938\u0947 \u0935\u094D\u092F\u093E\u092F\u093E\u092E \u0915\u0930\u0947\u0902",
    "- \u0905\u092A\u0928\u0947 \u091A\u093F\u0915\u093F\u0924\u094D\u0938\u0915 \u0938\u0947 \u0928\u093F\u092F\u092E\u093F\u0924 \u091C\u093E\u0901\u091A \u0915\u0930\u093E\u092F\u0947\u0902",
    "",
    "\u092F\u093E\u0926 \u0930\u0916\u0947\u0902: \u092F\u0939 \u0938\u093E\u0930\u093E\u0902\u0936 \u0915\u0947\u0935\u0932 \u0906\u092A\u0915\u0940 \u0938\u092E\u091D \u0915\u0947 \u0932\u093F\u090F \u0939\u0948 \u0914\u0930 \u092F\u0939 \u091A\u093F\u0915\u093F\u0924\u094D\u0938\u0940\u092F \u0938\u0932\u093E\u0939 \u0915\u093E \u0935\u093F\u0915\u0932\u094D\u092A \u0928\u0939\u0940\u0902 \u0939\u0948\u0964",
  ];
  return lines.join("\n");
}

// Tamil translation using Unicode escapes
function generateTamilSummary(name: string): string {
  const lines = [
    "\u0B87\u0BA4\u0BC1 " + name + " \u0B85\u0BB5\u0BB0\u0BCD\u0B95\u0BB3\u0BBF\u0BA9\u0BCD \u0B9A\u0BC1\u0B95\u0BBE\u0BA4\u0BBE\u0BB0 \u0BAA\u0BA4\u0BBF\u0BB5\u0BC1\u0B95\u0BB3\u0BBF\u0BA9\u0BCD \u0B8E\u0BB3\u0BBF\u0BAF \u0B9A\u0BC1\u0BB0\u0BC1\u0B95\u0BCD\u0B95\u0BAE\u0BCD.",
    "",
    "\u0B89\u0B99\u0BCD\u0B95\u0BB3\u0BCD \u0BAE\u0BB0\u0BC1\u0BA8\u0BCD\u0BA4\u0BC1\u0B95\u0BB3\u0BCD:",
    "\u0BA8\u0BC0\u0B99\u0BCD\u0B95\u0BB3\u0BCD \u0BA4\u0BB1\u0BCD\u0BAA\u0BCB\u0BA4\u0BC1 \u0BAE\u0BB0\u0BC1\u0BA8\u0BCD\u0BA4\u0BC1\u0B95\u0BB3\u0BC8 \u0B8E\u0B9F\u0BC1\u0BA4\u0BCD\u0BA4\u0BC1 \u0BB5\u0BB0\u0BC1\u0B95\u0BBF\u0BB1\u0BC0\u0BB0\u0BCD\u0B95\u0BB3\u0BCD. \u0BAE\u0BB0\u0BC1\u0BA4\u0BCD\u0BA4\u0BC1\u0BB5\u0BB0\u0BBF\u0BA9\u0BCD \u0B85\u0BB1\u0BBF\u0BB5\u0BC1\u0BB1\u0BC1\u0BA4\u0BCD\u0BA4\u0BB2\u0BCD\u0BAA\u0B9F\u0BBF \u0BAE\u0BB0\u0BC1\u0BA8\u0BCD\u0BA4\u0BC1\u0B95\u0BB3\u0BC8\u0BA4\u0BCD \u0BA4\u0BCA\u0B9F\u0BB0\u0BB5\u0BC1\u0BAE\u0BCD.",
    "",
    "\u0B87\u0BB0\u0BA4\u0BCD\u0BA4 \u0BAA\u0BB0\u0BBF\u0B9A\u0BCB\u0BA4\u0BA9\u0BC8 \u0BAE\u0BC1\u0B9F\u0BBF\u0BB5\u0BC1\u0B95\u0BB3\u0BCD:",
    "\u0B89\u0B99\u0BCD\u0B95\u0BB3\u0BCD \u0B9A\u0BBF\u0BB2 \u0B87\u0BB0\u0BA4\u0BCD\u0BA4 \u0BAA\u0BB0\u0BBF\u0B9A\u0BCB\u0BA4\u0BA9\u0BC8 \u0BAE\u0BC1\u0B9F\u0BBF\u0BB5\u0BC1\u0B95\u0BB3\u0BCD \u0B87\u0BAF\u0BB2\u0BCD\u0BAA\u0BBE\u0BA9 \u0BB5\u0BB0\u0BAE\u0BCD\u0BAA\u0BBF\u0BB1\u0BCD\u0B95\u0BC1 \u0BB5\u0BC6\u0BB3\u0BBF\u0BAF\u0BC7 \u0B89\u0BB3\u0BCD\u0BB3\u0BA9. \u0BB5\u0BBF\u0BB0\u0BBF\u0BB5\u0BBE\u0BA9 \u0BA4\u0B95\u0BB5\u0BB2\u0BC1\u0B95\u0BCD\u0B95\u0BC1 \u0B86\u0B99\u0BCD\u0B95\u0BBF\u0BB2 \u0B9A\u0BC1\u0BB0\u0BC1\u0B95\u0BCD\u0B95\u0BA4\u0BCD\u0BA4\u0BC8\u0BAA\u0BCD \u0BAA\u0BBE\u0BB0\u0BCD\u0B95\u0BCD\u0B95\u0BB5\u0BC1\u0BAE\u0BCD.",
    "",
    "\u0BAA\u0BB0\u0BBF\u0BA8\u0BCD\u0BA4\u0BC1\u0BB0\u0BC8\u0B95\u0BCD\u0B95\u0BB3\u0BCD:",
    "- \u0B89\u0BA3\u0BB5\u0BBF\u0BB2\u0BCD \u0B95\u0BCA\u0BB4\u0BC1\u0BAA\u0BC1 \u0BAE\u0BB1\u0BCD\u0BB1\u0BC1\u0BAE\u0BCD \u0B89\u0BAA\u0BCD\u0BAA\u0BC1\u0BA4\u0BCD \u0B95\u0BC1\u0BB1\u0BC8\u0B95\u0BCD\u0B95\u0BB5\u0BC1\u0BAE\u0BCD",
    "- \u0BA4\u0BCA\u0B9F\u0BB0\u0BCD\u0BA8\u0BCD\u0BA4\u0BC1 \u0B89\u0B9F\u0BB1\u0BCD\u0BAA\u0BAF\u0BBF\u0BB1\u0BCD\u0B9A\u0BBF \u0B9A\u0BC6\u0BAF\u0BCD\u0BAF\u0BB5\u0BC1\u0BAE\u0BCD",
    "- \u0BAE\u0BB0\u0BC1\u0BA4\u0BCD\u0BA4\u0BC1\u0BB5\u0BB0\u0BC8 \u0BA4\u0BCA\u0B9F\u0BB0\u0BCD\u0BA8\u0BCD\u0BA4\u0BC1 \u0B9A\u0BA8\u0BCD\u0BA4\u0BBF\u0BA4\u0BCD\u0BA4\u0BC1 \u0BAA\u0BB0\u0BBF\u0B9A\u0BCB\u0BA4\u0BA9\u0BC8 \u0B9A\u0BC6\u0BAF\u0BCD\u0BAF\u0BB5\u0BC1\u0BAE\u0BCD",
    "",
    "\u0BA8\u0BBF\u0BA9\u0BC8\u0BB5\u0BBF\u0BB2\u0BCD \u0B95\u0BCA\u0BB3\u0BCD\u0BB3\u0BC1\u0B99\u0BCD\u0B95\u0BB3\u0BCD: \u0B87\u0BA8\u0BCD\u0BA4 \u0B9A\u0BC1\u0BB0\u0BC1\u0B95\u0BCD\u0B95\u0BAE\u0BCD \u0B89\u0B99\u0BCD\u0B95\u0BB3\u0BCD \u0BAA\u0BC1\u0BB0\u0BBF\u0BA4\u0BB2\u0BC1\u0B95\u0BCD\u0B95\u0BBE\u0B95 \u0BAE\u0B9F\u0BCD\u0B9F\u0BC1\u0BAE\u0BC7 \u0BAE\u0BB1\u0BCD\u0BB1\u0BC1\u0BAE\u0BCD \u0B87\u0BA4\u0BC1 \u0BAE\u0BB0\u0BC1\u0BA4\u0BCD\u0BA4\u0BC1\u0BB5 \u0B86\u0BB2\u0BCB\u0B9A\u0BA9\u0BC8\u0B95\u0BCD\u0B95\u0BC1 \u0BAE\u0BBE\u0BB1\u0BCD\u0BB1\u0BC1 \u0B85\u0BB2\u0BCD\u0BB2.",
  ];
  return lines.join("\n");
}

// Telugu translation using Unicode escapes
function generateTeluguSummary(name: string): string {
  const lines = [
    "\u0C07\u0C26\u0C3F " + name + " \u0C17\u0C3E\u0C30\u0C3F \u0C06\u0C30\u0C4B\u0C17\u0C4D\u0C2F \u0C30\u0C3F\u0C15\u0C3E\u0C30\u0C4D\u0C21\u0C41\u0C32 \u0C38\u0C30\u0C33 \u0C38\u0C3E\u0C30\u0C3E\u0C02\u0C36\u0C02.",
    "",
    "\u0C2E\u0C40 \u0C2E\u0C02\u0C26\u0C41\u0C32\u0C41:",
    "\u0C2E\u0C40\u0C30\u0C41 \u0C2A\u0C4D\u0C30\u0C38\u0C4D\u0C24\u0C41\u0C24\u0C02 \u0C2E\u0C02\u0C26\u0C41\u0C32\u0C41 \u0C24\u0C40\u0C38\u0C41\u0C15\u0C41\u0C02\u0C1F\u0C41\u0C28\u0C4D\u0C28\u0C3E\u0C30\u0C41. \u0C35\u0C48\u0C26\u0C4D\u0C2F\u0C41\u0C32 \u0C38\u0C32\u0C39\u0C3E \u0C2A\u0C4D\u0C30\u0C15\u0C3E\u0C30\u0C02 \u0C2E\u0C02\u0C26\u0C41\u0C32\u0C28\u0C41 \u0C15\u0C4A\u0C28\u0C38\u0C3E\u0C17\u0C3F\u0C02\u0C1A\u0C02\u0C21\u0C3F.",
    "",
    "\u0C30\u0C15\u0C4D\u0C24 \u0C2A\u0C30\u0C40\u0C15\u0C4D\u0C37 \u0C2B\u0C32\u0C3F\u0C24\u0C3E\u0C32\u0C41:",
    "\u0C2E\u0C40 \u0C15\u0C4A\u0C28\u0C4D\u0C28\u0C3F \u0C30\u0C15\u0C4D\u0C24 \u0C2A\u0C30\u0C40\u0C15\u0C4D\u0C37 \u0C2B\u0C32\u0C3F\u0C24\u0C3E\u0C32\u0C41 \u0C38\u0C3E\u0C27\u0C3E\u0C30\u0C23 \u0C2A\u0C30\u0C3F\u0C27\u0C3F \u0C35\u0C46\u0C32\u0C41\u0C2A\u0C32 \u0C09\u0C28\u0C4D\u0C28\u0C3E\u0C2F\u0C3F. \u0C35\u0C3F\u0C35\u0C30\u0C3E\u0C32 \u0C15\u0C4B\u0C38\u0C02 \u0C07\u0C02\u0C17\u0C4D\u0C32\u0C40\u0C37\u0C4D \u0C38\u0C3E\u0C30\u0C3E\u0C02\u0C36\u0C02 \u0C1A\u0C42\u0C21\u0C02\u0C21\u0C3F.",
    "",
    "\u0C38\u0C3F\u0C2B\u0C3E\u0C30\u0C4D\u0C38\u0C41\u0C32\u0C41:",
    "- \u0C06\u0C39\u0C3E\u0C30\u0C02\u0C32\u0C4B \u0C15\u0C4A\u0C35\u0C4D\u0C35\u0C41 \u0C2E\u0C30\u0C3F\u0C2F\u0C41 \u0C09\u0C2A\u0C4D\u0C2A\u0C41\u0C28\u0C41 \u0C24\u0C17\u0C4D\u0C17\u0C3F\u0C02\u0C1A\u0C02\u0C21\u0C3F",
    "- \u0C15\u0C4D\u0C30\u0C2E\u0C02 \u0C24\u0C2A\u0C4D\u0C2A\u0C15\u0C41 \u0C35\u0C4D\u0C2F\u0C3E\u0C2F\u0C3E\u0C2E\u0C02 \u0C1A\u0C47\u0C2F\u0C02\u0C21\u0C3F",
    "- \u0C35\u0C48\u0C26\u0C4D\u0C2F\u0C41\u0C21\u0C3F\u0C28\u0C3F \u0C15\u0C4D\u0C30\u0C2E\u0C02 \u0C24\u0C2A\u0C4D\u0C2A\u0C15\u0C41 \u0C15\u0C32\u0C3F\u0C38\u0C3F \u0C2A\u0C30\u0C40\u0C15\u0C4D\u0C37 \u0C1A\u0C47\u0C2F\u0C3F\u0C02\u0C1A\u0C41\u0C15\u0C4B\u0C02\u0C21\u0C3F",
    "",
    "\u0C17\u0C41\u0C30\u0C4D\u0C24\u0C3F\u0C02\u0C1A\u0C41\u0C15\u0C4B\u0C02\u0C21\u0C3F: \u0C08 \u0C38\u0C3E\u0C30\u0C3E\u0C02\u0C36\u0C02 \u0C2E\u0C40 \u0C05\u0C35\u0C17\u0C3E\u0C39\u0C28 \u0C15\u0C4B\u0C38\u0C02 \u0C2E\u0C3E\u0C24\u0C4D\u0C30\u0C2E\u0C47 \u0C2E\u0C30\u0C3F\u0C2F\u0C41 \u0C07\u0C26\u0C3F \u0C35\u0C48\u0C26\u0C4D\u0C2F \u0C38\u0C32\u0C39\u0C3E\u0C15\u0C41 \u0C2A\u0C4D\u0C30\u0C24\u0C4D\u0C2F\u0C3E\u0C2E\u0C02 \u0C15\u0C3E\u0C26\u0C41.",
  ];
  return lines.join("\n");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { profile_id, record_ids } = await req.json();

    if (!profile_id) {
      return new Response(
        JSON.stringify({ error: "profile_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: profile, error: profileError } = await supabase
      .from("health_profiles")
      .select("*")
      .eq("id", profile_id)
      .maybeSingle();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: "Profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let medQuery = supabase.from("extracted_medicines").select("*").eq("profile_id", profile_id);
    let labQuery = supabase.from("extracted_lab_tests").select("*").eq("profile_id", profile_id);
    let diagQuery = supabase.from("extracted_diagnoses").select("*").eq("profile_id", profile_id);

    if (record_ids && Array.isArray(record_ids) && record_ids.length > 0) {
      medQuery = medQuery.in("record_id", record_ids);
      labQuery = labQuery.in("record_id", record_ids);
      diagQuery = diagQuery.in("record_id", record_ids);
    }

    const [medResult, labResult, diagResult] = await Promise.all([
      medQuery,
      labQuery,
      diagQuery,
    ]);

    const medicines: MedicineRow[] = (medResult.data || []).map((m: any) => ({
      medicine_name: m.medicine_name,
      dosage: m.dosage || "",
      frequency: m.frequency || "",
    }));
    const labTests: LabTestRow[] = (labResult.data || []).map((t: any) => ({
      test_name: t.test_name,
      value: t.value || "",
      unit: t.unit || "",
      reference_range: t.reference_range || "",
      is_abnormal: t.is_abnormal || false,
      flag: t.flag || "normal",
    }));
    const diagnoses: DiagnosisRow[] = (diagResult.data || []).map((d: any) => ({
      diagnosis_name: d.diagnosis_name,
      icd_code: d.icd_code || "",
      severity: d.severity || "",
    }));

    const summaryResult = buildSummary(profile.patient_name, medicines, labTests, diagnoses);

    const translations: Record<string, string> = {
      hi: generateHindiSummary(profile.patient_name),
      ta: generateTamilSummary(profile.patient_name),
      te: generateTeluguSummary(profile.patient_name),
    };

    const allRecordIds: string[] = record_ids && record_ids.length > 0
      ? record_ids
      : [...new Set([...medicines, ...labTests, ...diagnoses].map((d: any) => (d as any).record_id).filter(Boolean))];

    const { data: savedSummary, error: saveError } = await supabase
      .from("health_summaries")
      .insert({
        profile_id,
        summary_text: summaryResult.summary,
        summary_language: "en",
        summary_translations: translations,
        key_findings: summaryResult.key_findings,
        recommendations: summaryResult.recommendations,
        abnormal_values_explanation: summaryResult.abnormal_explanations,
        risk_level: summaryResult.risk_level,
        record_ids: allRecordIds,
      })
      .select()
      .single();

    if (saveError) {
      throw new Error("Failed to save summary: " + saveError.message);
    }

    return new Response(
      JSON.stringify({
        success: true,
        summary_id: savedSummary.id,
        summary: summaryResult.summary,
        translations,
        key_findings: summaryResult.key_findings,
        recommendations: summaryResult.recommendations,
        abnormal_explanations: summaryResult.abnormal_explanations,
        risk_level: summaryResult.risk_level,
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
