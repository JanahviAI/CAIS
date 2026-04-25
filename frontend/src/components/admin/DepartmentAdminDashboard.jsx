/**
 * components/admin/DepartmentAdminDashboard.jsx
 * ────────────────────────────────────────────────
 * Dashboard for Department Heads.
 *
 * Tabs:
 *   - Overview     : Dept-specific analytics + anomaly alerts
 *   - All Complaints: Org-wide read-only view (grayed out, view only)
 *   - My Department: Full-color, actionable dept complaints
 *   - Emergency    : Emergency complaints across org
 *   - Insights     : NLP clustering
 */

import { useState } from "react";
import Navbar, { NavTab } from "../common/Navbar";
import AnalyticsDashboard from "./AnalyticsDashboard";
import Dashboard          from "./Dashboard";
import EmergencyTab       from "./EmergencyTab";
import InsightsTab        from "./InsightsTab";
import { useComplaints }  from "../../hooks/useComplaints";
import { COLORS }         from "../../data/constants";
import { Building2 }      from "lucide-react";

export default function DepartmentAdminDashboard({ user, onLogout }) {
  const [view, setView] = useState("analytics");

  // Fetch all complaints for the org-wide read-only view
  const { complaints: allComplaints, loading: allLoading, error: allError, reload: reloadAll, patchComplaint: patchAll } = useComplaints();

  // Fetch only this dept's complaints for the actionable view
  const { complaints: deptComplaints, loading: deptLoading, error: deptError, reload: reloadDept, patchComplaint: patchDept } = useComplaints(
    user.dept_id ? { dept_id: user.dept_id } : {}
  );

  const emergencyCount = allComplaints.filter(c => c.is_emergency && !c.demoted_by_admin).length;

  const handleDeptUpdate = async (id, data) => {
    await patchDept(id, data);
    // Also refresh the all-complaints list
    await reloadAll();
  };

  const handleAllUpdate = async (id, data) => {
    await patchAll(id, data);
  };

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bgPage, fontFamily: "'Inter',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />

      <Navbar isAdmin user={user} onLogout={onLogout}>
        {[
          { key: "analytics",     label: "Overview" },
          { key: "all",           label: "All Complaints" },
          { key: "dept",          label: `${user.dept_name || "My Dept"} ▸` },
          { key: "emergency",     label: emergencyCount > 0
              ? <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  Emergency
                  <span style={{ background: COLORS.red, color: "#fff", borderRadius: 10, padding: "1px 7px", fontSize: 11, fontWeight: 700 }}>{emergencyCount}</span>
                </span>
              : "Emergency"
          },
          { key: "insights",      label: "Insights" },
        ].map(({ key, label }) => (
          <NavTab key={key} active={view === key} onClick={() => setView(key)}>
            {label}
          </NavTab>
        ))}
      </Navbar>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "30px 24px" }}>

        {view === "analytics" && <AnalyticsDashboard user={user} />}

        {view === "all" && (
          <>
            {/* Read-only org banner */}
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              background: "#eff6ff", border: "1px solid #bfdbfe",
              borderRadius: 10, padding: "12px 18px", marginBottom: 18,
              fontSize: 13, color: "#1e40af",
            }}>
              <Building2 size={15} color="#1e40af" />
              <span><strong>Organisation View</strong> — Read-only. You can view all complaints but only act on your department's complaints.</span>
            </div>
            <Dashboard
              complaints={allComplaints}
              loading={allLoading}
              error={allError}
              onRetry={reloadAll}
              onUpdate={handleAllUpdate}
              readOnly={true}
            />
          </>
        )}

        {view === "dept" && (
          <>
            {/* Dept-specific action banner */}
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              background: COLORS.successBg, border: "1px solid #bbf7d0",
              borderRadius: 10, padding: "12px 18px", marginBottom: 18,
              fontSize: 13, color: "#166534",
            }}>
              <Building2 size={15} color="#166534" />
              <span><strong>{user.dept_name || "Department"} Complaints</strong> — These are yours to manage. Approve, assign, or resolve.</span>
            </div>
            <Dashboard
              complaints={deptComplaints}
              loading={deptLoading}
              error={deptError}
              onRetry={reloadDept}
              onUpdate={handleDeptUpdate}
              readOnly={false}
              actorId={user.user_id}
            />
          </>
        )}

        {view === "emergency" && (
          <EmergencyTab complaints={allComplaints} loading={allLoading} onUpdate={handleAllUpdate} />
        )}

        {view === "insights" && <InsightsTab />}
      </div>
    </div>
  );
}
