/**
 * hooks/useAnalytics.js
 * ──────────────────────
 * Fetches org-wide or department-specific analytics.
 * Used by AnalyticsDashboard component.
 */

import { useState, useEffect, useCallback } from "react";
import { fetchOrganizationStats, fetchDepartmentStats, fetchAnomalies } from "../services/api";

export function useAnalytics({ user }) {
  const [stats, setStats]         = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let data;
      if (user.is_super_admin) {
        data = await fetchOrganizationStats(user.user_id);
      } else if (user.role === "dept_head" && user.dept_id) {
        data = await fetchDepartmentStats(user.dept_id, user.user_id);
      } else {
        data = null;
      }
      setStats(data);

      const dept_id = user.is_super_admin ? null : user.dept_id;
      const anomalyData = await fetchAnomalies(dept_id);
      setAnomalies(anomalyData.anomalies || []);
    } catch (e) {
      setError(e?.response?.data?.detail || "Failed to load analytics.");
    } finally {
      setLoading(false);
    }
  }, [user.user_id, user.is_super_admin, user.role, user.dept_id]);

  useEffect(() => { load(); }, [load]);

  return { stats, anomalies, loading, error, reload: load };
}
