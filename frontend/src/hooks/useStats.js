/**
 * hooks/useStats.js
 * ──────────────────
 * Fetches analytics stats from GET /api/analytics/stats.
 * Used by the admin Overview and Insights tabs.
 */

import { useState, useEffect } from "react";
import { fetchStats } from "../services/api";

export function useStats() {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchStats();
      setStats(data);
    } catch (e) {
      setError(e?.response?.data?.detail || "Failed to load analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return { stats, loading, error, reload: load };
}
