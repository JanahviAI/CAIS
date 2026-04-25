import { useState, useEffect, useCallback } from "react";
import { fetchComplaints, updateComplaint } from "../services/api";

export function useComplaints(params = {}) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setComplaints(await fetchComplaints(params)); }
    catch (e) { setError(e?.response?.data?.detail || "Failed to load complaints."); }
    finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(params)]);

  useEffect(() => { load(); }, [load]);

  const addComplaint = c => setComplaints(p => [c, ...p]);

  const patchComplaint = async (id, data) => {
    // If data is already a full complaint object (from demote), merge directly
    if (data.id !== undefined) {
      setComplaints(prev => prev.map(c => c.id === id ? data : c));
      return data;
    }
    const updated = await updateComplaint(id, data);
    setComplaints(prev => prev.map(c => c.id === id ? updated : c));
    return updated;
  };

  return { complaints, loading, error, reload: load, addComplaint, patchComplaint };
}
