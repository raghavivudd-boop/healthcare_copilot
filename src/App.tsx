import { useState, useEffect, useCallback } from "react";
import { HeartPulse, Upload, FileText, LayoutDashboard, Info, User } from "lucide-react";
import type { HealthProfile } from "@/lib/types";
import { fetchProfiles } from "@/lib/api";
import { Dashboard } from "@/components/Dashboard";
import { UploadRecords } from "@/components/UploadRecords";
import { HealthSummaryView } from "@/components/HealthSummaryView";
import { Timeline } from "@/components/Timeline";
import { ArchitecturePage } from "@/components/ArchitecturePage";
import { ProfileSelector } from "@/components/ProfileSelector";

type Page = "dashboard" | "upload" | "summary" | "timeline" | "architecture";

const NAV_ITEMS: { id: Page; label: string; icon: typeof HeartPulse }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "upload", label: "Upload Records", icon: Upload },
  { id: "summary", label: "AI Summary", icon: FileText },
  { id: "timeline", label: "Timeline", icon: HeartPulse },
  { id: "architecture", label: "Architecture", icon: Info },
];

function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [profiles, setProfiles] = useState<HealthProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<HealthProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileSelectorOpen, setProfileSelectorOpen] = useState(false);

  const loadProfiles = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchProfiles();
      setProfiles(data);
      if (data.length > 0 && !activeProfile) {
        setActiveProfile(data[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profiles");
    } finally {
      setLoading(false);
    }
  }, [activeProfile]);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const handleProfileChange = (profile: HealthProfile) => {
    setActiveProfile(profile);
    setProfileSelectorOpen(false);
  };

  const handleProfileCreated = (profile: HealthProfile) => {
    setProfiles((prev) => [profile, ...prev]);
    setActiveProfile(profile);
    setProfileSelectorOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col fixed h-screen z-30 hidden md:flex">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/30">
              <HeartPulse className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-800 leading-tight">Health Summary</h1>
              <p className="text-xs text-slate-400">AI Copilot</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = page === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-smooth ${
                  isActive
                    ? "bg-primary-50 text-primary-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-primary-600" : "text-slate-400"}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200">
          <button
            onClick={() => setProfileSelectorOpen(true)}
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-smooth"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-secondary-400 to-secondary-600 flex items-center justify-center text-white text-sm font-semibold">
              {activeProfile?.patient_name?.charAt(0).toUpperCase() || "?"}
            </div>
            <div className="text-left flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-700 truncate">
                {activeProfile?.patient_name || "No profile"}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {activeProfile?.abha_id || "No ABHA ID"}
              </p>
            </div>
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-slate-200 z-30">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
              <HeartPulse className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-sm text-slate-800">Health Copilot</span>
          </div>
          <button
            onClick={() => setProfileSelectorOpen(true)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary-400 to-secondary-600 flex items-center justify-center text-white text-xs font-semibold">
              {activeProfile?.patient_name?.charAt(0).toUpperCase() || "?"}
            </div>
          </button>
        </div>
        <div className="flex overflow-x-auto px-2 pb-2 gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = page === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-smooth ${
                  isActive
                    ? "bg-primary-50 text-primary-700"
                    : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 md:ml-64 pt-28 md:pt-0 min-h-screen">
        <div className="max-w-6xl mx-auto p-4 md:p-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
              <p className="text-red-700 font-medium">{error}</p>
              <button onClick={loadProfiles} className="mt-3 text-sm text-red-600 underline">
                Try again
              </button>
            </div>
          ) : !activeProfile ? (
            <div className="text-center py-20">
              <User className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 mb-4">No health profile found</p>
              <button
                onClick={() => setProfileSelectorOpen(true)}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-smooth"
              >
                Create a Profile
              </button>
            </div>
          ) : (
            <div key={page} className="animate-fade-in">
              {page === "dashboard" && <Dashboard profile={activeProfile} onNavigate={setPage} />}
              {page === "upload" && <UploadRecords profile={activeProfile} />}
              {page === "summary" && <HealthSummaryView profile={activeProfile} />}
              {page === "timeline" && <Timeline profile={activeProfile} />}
              {page === "architecture" && <ArchitecturePage />}
            </div>
          )}
        </div>
      </main>

      {profileSelectorOpen && (
        <ProfileSelector
          profiles={profiles}
          activeProfile={activeProfile}
          onSelect={handleProfileChange}
          onCreated={handleProfileCreated}
          onClose={() => setProfileSelectorOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
