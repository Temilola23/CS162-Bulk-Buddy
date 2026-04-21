import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Sanitizes admin redirect targets to prevent external redirects.
 */
function normalizeRedirectPath(target, fallbackPath) {
  if (!target || typeof target !== 'string') {
    return fallbackPath;
  }

  if (!target.startsWith('/')) {
    return fallbackPath;
  }

  if (target.startsWith('//')) {
    return fallbackPath;
  }

  if (target.startsWith('/admin-console/login')) {
    return fallbackPath;
  }

  return target;
}

/**
 * Builds the admin login URL with a safe next-path query string.
 */
export function buildAdminAuthRedirectUrl(targetPath) {
  const redirectPath = normalizeRedirectPath(
    targetPath,
    '/admin-console/driver-applications',
  );
  return `/admin-console/login?next=${encodeURIComponent(redirectPath)}`;
}

/**
 * Resolves where an admin should land after login or registration.
 */
export default function useAdminPostAuthRedirect(
  fallbackPath = '/admin-console/driver-applications',
) {
  const location = useLocation();

  return useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    const requestedNextPath = searchParams.get('next');
    const redirectPath = normalizeRedirectPath(requestedNextPath, fallbackPath);

    return {
      redirectPath,
      authQueryString:
        requestedNextPath === redirectPath
          ? `?next=${encodeURIComponent(redirectPath)}`
          : '',
    };
  }, [fallbackPath, location.search]);
}
