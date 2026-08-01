import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, getCurrentUserId, setCurrentUserId } from "../api/client.js";

const SessionContext = createContext(null);

/**
 * Holds the "signed in" user. Until real auth exists this is just an id kept in
 * localStorage and echoed back to the API on every request.
 */
export function SessionProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!getCurrentUserId()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      setUser(await api.me());
    } catch {
      setCurrentUserId(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const signIn = useCallback(async (id) => {
    setCurrentUserId(id);
    setLoading(true);
    await refresh();
  }, [refresh]);

  const signOut = useCallback(() => {
    setCurrentUserId(null);
    setUser(null);
  }, []);

  return (
    <SessionContext.Provider value={{ user, loading, signIn, signOut, refresh }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside <SessionProvider>");
  return ctx;
}
