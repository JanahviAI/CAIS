/**
 * components/common/DepartmentFilter.jsx
 * ─────────────────────────────────────────
 * Dropdown to filter complaints by department.
 * Fetches departments from GET /api/departments.
 */

import { useState, useEffect } from "react";
import { fetchDepartments } from "../../services/api";
import { Filter } from "lucide-react";
import { COLORS } from "../../data/constants";

export default function DepartmentFilter({ value, onChange, includeAll = true }) {
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    fetchDepartments().then(setDepartments).catch(() => {});
  }, []);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <Filter size={14} color={COLORS.textSecondary} />
      <select
        value={value ?? ""}
        onChange={e => onChange(e.target.value === "" ? null : parseInt(e.target.value))}
        style={{
          border: `1px solid ${COLORS.border}`,
          borderRadius: 8, padding: "7px 12px",
          fontSize: 13, fontFamily: "'Inter',sans-serif",
          color: COLORS.textPrimary, background: COLORS.bgCard,
          cursor: "pointer", outline: "none",
        }}
      >
        {includeAll && <option value="">All Departments</option>}
        {departments.map(d => (
          <option key={d.id} value={d.id}>{d.name}</option>
        ))}
      </select>
    </div>
  );
}
