/**
 * hooks/useSession.js
 * ────────────────────
 * Manages auth session in AsyncStorage.
 * On app launch, tries to restore a saved session automatically.
 */

import { useState, useEffect } from "react";
import { saveSession, getSession, clearSession } from "../services/storage";

export function useSession() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true); // true while checking storage

  // Restore session on app start
  useEffect(() => {
    getSession().then(s => {
      setSession(s);
      setLoading(false);
    });
  }, []);

  const signIn = async (userData) => {
    await saveSession(userData);
    setSession(userData);
  };

  const signOut = async () => {
    await clearSession();
    setSession(null);
  };

  return { session, loading, signIn, signOut };
}
