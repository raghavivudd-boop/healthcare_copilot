import { useEffect, useState } from "react";
import { Sparkles, AlertTriangle, Lightbulb, TrendingUp, TrendingDown, Loader2, Globe, FileText, ChevronDown, Info } from "lucide-react";
import type { HealthProfile, HealthSummary } from "@/lib/types";
import { RISK_LEVELS, LANGUAGES } from "@/lib/types";
import { fetchSummaries, callGenerateSummary, fetchLatestSummary } from "@/lib/api";

interface Props {
  profile: HealthProfile;
}

export function HealthSummaryView({ profile }: Props) {
  const [summaries, setSummaries] = useState<HealthSummary[]>([]);
  const [activeSummary, setActiveSummary] = useState<HealthSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState("en");
  const [showHistory, setShowHistory] = useState(false);

  const loadSummaries = async () => {
    try {
      setLoading(true);
      const data = await fetchSummaries(profile.id);
      setSummaries(data);
      if (data.length > 0) setActiveSummary(data[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load summaries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummaries();
  }, [profile.id]);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setError(null);
      await callGenerateSummary(profile.id);
      const latest = await fetchLatestSummary(profile.id);
      if (latest) setActiveSummary(latest);
      await loadSummaries();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate summary");
    } finally {
      setGenerating(false);
    }
  };

  const displayText = (() => {
    if (!activeSummary) return "";
    if (language === "en") return activeSummary.summary_text;
    return activeSummary.summary_translations?.[language] || activeSummary.summary_text;
  })();

  const riskInfo = activeSummary ? RISK_LEVELS[activeSummary.risk_level] : null;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 shimmer rounded-lg" />
        <div className="h-96 rounded-2xl shimmer" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">AI Health Summary</h1>
          <p className="text-slate-500 mt-1">Your medical records explained in simple, plain language.</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-smooth disabled:opacity-50"
        >
          {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4" /> Generate New Summary</>}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {!activeSummary ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <Sparkles className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-500 mb-4">No health summary generated yet</p>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-smooth disabled:opacity-50"
          >
            {generating ? "Generating..." : "Generate Summary"}
          </button>
        </div>
      ) : (
        <>
          {/* Summary selector + language */}
          <div className="flex flex-wrap items-center gap-3">
            {summaries.length > 1 && (
              <div className="relative">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  <FileText className="w-4 h-4 text-slate-400" />
                  {new Date(activeSummary.created_at).toLocaleDateString()}
                  <ChevronDown className="w-4 h-4" />
                </button>
                {showHistory && (
                  <div className="absolute top-full mt-1 left-0 bg-white border border-slate-200 rounded-lg shadow-lg z-20 min-w-64 max-h-64 overflow-y-auto">
                    {summaries.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => { setActiveSummary(s); setShowHistory(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 border-b border-slate-50 last:border-0 ${activeSummary.id === s.id ? "bg-primary-50 text-primary-700" : "text-slate-600"}`}
                      >
                        {new Date(s.created_at).toLocaleString()}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <Globe className="w-4 h-4 text-slate-400" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-400"
              >
                {Object.entries(LANGUAGES).map(([code, lang]) => (
                  <option key={code} value={code}>{lang.nativeLabel} ({lang.label})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Risk badge */}
          {riskInfo && (
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold ${riskInfo.bgColor} ${riskInfo.color} border ${riskInfo.borderColor}`}>
              <AlertTriangle className="w-4 h-4" />
              {riskInfo.label}
            </div>
          )}

          {/* Main summary text */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 animate-slide-up">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Your Health in Simple Words</h3>
                <p className="text-xs text-slate-400">Generated on {new Date(activeSummary.created_at).toLocaleString()}</p>
              </div>
            </div>
            <div className="prose prose-sm max-w-none">
              <div className="text-slate-700 leading-relaxed whitespace-pre-wrap text-sm md:text-base">
                {displayText}
              </div>
            </div>
          </div>

          {/* Key findings */}
          {activeSummary.key_findings.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 animate-slide-up">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-secondary-500" /> Key Findings
              </h3>
              <div className="grid gap-3">
                {activeSummary.key_findings.map((finding, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <div className="w-6 h-6 rounded-full bg-secondary-100 text-secondary-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <p className="text-sm text-slate-700">{finding}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Abnormal values explained */}
          {activeSummary.abnormal_values_explanation.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 animate-slide-up">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" /> What Abnormal Values Mean
              </h3>
              <div className="grid gap-3">
                {activeSummary.abnormal_values_explanation.map((item, idx) => (
                  <div key={idx} className="border border-amber-100 bg-amber-50/50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-slate-800 text-sm">{item.test}</span>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold text-amber-700">{item.value}</span>
                        <span className="text-slate-400">Normal: {item.normal_range}</span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">{item.explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {activeSummary.recommendations.length > 0 && (
            <div className="bg-gradient-to-br from-primary-50 to-emerald-50 rounded-2xl border border-primary-100 p-6 animate-slide-up">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-primary-600" /> What You Should Do
              </h3>
              <div className="grid gap-2">
                {activeSummary.recommendations.map((rec, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary-200 text-primary-800 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <p className="text-sm text-slate-700">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="bg-slate-50 rounded-xl p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-slate-500 leading-relaxed">
              This AI-generated summary is for informational purposes only and does not replace professional medical advice.
              Always consult with your healthcare provider before making decisions about your treatment or health management.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
