import { useState } from "react";
import Navbar, { NavTab } from "../common/Navbar";
import OverviewTab   from "./OverviewTab";
import Dashboard     from "./Dashboard";
import EmergencyTab  from "./EmergencyTab";
import InsightsTab   from "./InsightsTab";
import { useComplaints } from "../../hooks/useComplaints";
import { COLORS } from "../../data/constants";

export default function AdminDashboard({ user, onLogout }) {
  const [view, setView] = useState("overview");
  const { complaints, loading, error, reload, patchComplaint } = useComplaints();

  const emergencyCount = complaints.filter(c => c.is_emergency && !c.demoted_by_admin).length;

  const handleUpdate = async (id, data) => {
    await patchComplaint(id, data);
  };

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bgPage, fontFamily: "'Inter',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />

      <Navbar isAdmin user={user} onLogout={onLogout}>
        {["overview","complaints","emergency","insights"].map(v => (
          <NavTab key={v} active={view === v} onClick={() => setView(v)}>
            {v === "emergency"
              ? <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  Emergency
                  {emergencyCount > 0 && (
                    <span style={{ background: COLORS.red, color: "#fff", borderRadius: 10, padding: "1px 7px", fontSize: 11, fontWeight: 700 }}>{emergencyCount}</span>
                  )}
                </span>
              : v.charAt(0).toUpperCase() + v.slice(1)
            }
          </NavTab>
        ))}
      </Navbar>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "30px 24px" }}>
        {view === "overview"   && <OverviewTab />}
        {view === "complaints" && <Dashboard complaints={complaints} loading={loading} error={error} onRetry={reload} onUpdate={handleUpdate} />}
        {view === "emergency"  && <EmergencyTab complaints={complaints} loading={loading} onUpdate={handleUpdate} />}
        {view === "insights"   && <InsightsTab />}
      </div>
    </div>
  );
}
