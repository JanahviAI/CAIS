import { useState } from "react";
import Navbar, { NavTab } from "../common/Navbar";
import ComplaintForm from "./ComplaintForm";
import ComplaintList from "./ComplaintList";
import { useComplaints } from "../../hooks/useComplaints";
import { COLORS } from "../../data/constants";

export default function UserDashboard({ user, onLogout }) {
  const [view, setView] = useState("submit");
  const { complaints, loading, error, reload, addComplaint } = useComplaints({ user_id: user.user_id });

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bgPage, fontFamily: "'Inter',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
      <Navbar user={user} onLogout={onLogout}>
        <NavTab active={view === "submit"}  onClick={() => setView("submit")}>Submit Complaint</NavTab>
        <NavTab active={view === "history"} onClick={() => setView("history")}>My Complaints ({complaints.length})</NavTab>
      </Navbar>
      <div style={{ maxWidth: 720, margin: "36px auto", padding: "0 24px" }}>
        {view === "submit"
          ? <ComplaintForm userId={user.user_id} onSubmitted={c => { addComplaint(c); }} />
          : (
            <>
              <div style={{ marginBottom: 22 }}>
                <h1 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 24, fontWeight: 700, color: COLORS.textPrimary, margin: 0 }}>My Complaints</h1>
                <p style={{ color: COLORS.textSecondary, marginTop: 5, fontSize: 13 }}>Track the status of your submitted complaints.</p>
              </div>
              <ComplaintList complaints={complaints} loading={loading} error={error} onRetry={reload} />
            </>
          )
        }
      </div>
    </div>
  );
}
