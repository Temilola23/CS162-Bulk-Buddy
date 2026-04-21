import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useApi } from './ApiProvider';

const SessionContext = createContext(undefined);
const SESSION_STORAGE_KEY = 'bulk-buddy-session';

/**
 * Reads the last known session snapshot for faster reload rendering.
 */
function readStoredSession() {
  // Reuse the last successful session snapshot during full-page navigations so
  // the shopper header does not briefly fall back to placeholder content.
  try {
    return JSON.parse(window.sessionStorage.getItem(SESSION_STORAGE_KEY) || 'null');
  } catch (error) {
    return null;
  }
}

/**
 * Saves the current user/session snapshot in browser storage.
 */
function writeStoredSession(sessionSnapshot) {
  window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionSnapshot));
}

/**
 * Removes cached session data after logout or failed refresh.
 */
function clearStoredSession() {
  window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
}

/**
 * Owns the authenticated user session and exposes refresh/clear actions.
 */
export function SessionProvider({ children }) {
  const api = useApi();
  const storedSession = readStoredSession();
  const [currentUser, setCurrentUser] = useState(() => storedSession?.currentUser || null);
  const [driverApplication, setDriverApplication] = useState(
    () => storedSession?.driverApplication || null,
  );
  const [isSessionLoading, setIsSessionLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    setIsSessionLoading(true);
    const response = await api.get('/me');

    if (!response.ok) {
      setCurrentUser(null);
      setDriverApplication(null);
      clearStoredSession();
      setIsSessionLoading(false);
      return null;
    }

    // Keep React state and the lightweight browser cache in sync so reloads
    // can paint the last known user immediately while /api/me refreshes.
    const nextUser = response.body?.user || null;
    const nextDriverApplication = response.body?.driver_application || null;
    setCurrentUser(nextUser);
    setDriverApplication(nextDriverApplication);
    writeStoredSession({
      currentUser: nextUser,
      driverApplication: nextDriverApplication,
    });
    setIsSessionLoading(false);
    return nextUser;
  }, [api]);

  const clearSession = useCallback(() => {
    setCurrentUser(null);
    setDriverApplication(null);
    clearStoredSession();
    setIsSessionLoading(false);
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const value = useMemo(
    () => ({
      currentUser,
      driverApplication,
      isSessionLoading,
      refreshSession,
      clearSession,
    }),
    [currentUser, driverApplication, isSessionLoading, refreshSession, clearSession],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

/**
 * Returns the active session context for components and hooks.
 */
export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
