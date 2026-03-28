import { useEffect, useState } from 'react';

const AUTH_LOADER_STORAGE_KEY = 'bulk-buddy-show-auth-loader';
const LOADER_TIMINGS = {
  landing: {
    fadeDelayMs: 1100,
    unmountDelayMs: 1600,
  },
  auth: {
    fadeDelayMs: 3100,
    unmountDelayMs: 3600,
  },
};

function getCurrentPathname() {
  if (typeof window === 'undefined') {
    return '/';
  }

  // Normalize trailing slashes so /login and /login/ resolve to the same view.
  return window.location.pathname.replace(/\/+$/, '') || '/';
}

function getInitialLoaderMode() {
  const pathname = getCurrentPathname();

  if (pathname === '/') {
    // The landing page always shows the loader on entry/reload.
    return 'landing';
  }

  try {
    return window.sessionStorage.getItem(AUTH_LOADER_STORAGE_KEY) === 'true' ? 'auth' : 'none';
  } catch {
    return 'none';
  }
}

export function markAuthLoaderRequested() {
  try {
    window.sessionStorage.setItem(AUTH_LOADER_STORAGE_KEY, 'true');
  } catch {
    // Ignore storage failures and fall back to the normal redirect flow.
  }
}

export default function useAppLoader() {
  const [loaderMode, setLoaderMode] = useState(getInitialLoaderMode);
  const [loaderIsLeaving, setLoaderIsLeaving] = useState(false);
  const showLoader = loaderMode !== 'none';

  useEffect(() => {
    if (!showLoader) {
      return undefined;
    }

    try {
      window.sessionStorage.removeItem(AUTH_LOADER_STORAGE_KEY);
    } catch {
      // Ignore storage failures and continue with the in-memory loader state.
    }

    const { fadeDelayMs, unmountDelayMs } = LOADER_TIMINGS[loaderMode];
    // Fade and unmount are split so the overlay can animate out before React removes it.
    const loaderFadeTimeout = window.setTimeout(() => {
      setLoaderIsLeaving(true);
    }, fadeDelayMs);
    const loaderUnmountTimeout = window.setTimeout(() => {
      setLoaderMode('none');
    }, unmountDelayMs);

    return () => {
      window.clearTimeout(loaderFadeTimeout);
      window.clearTimeout(loaderUnmountTimeout);
    };
  }, [loaderMode, showLoader]);

  return {
    showLoader,
    loaderIsLeaving,
  };
}
