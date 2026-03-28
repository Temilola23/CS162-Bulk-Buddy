import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

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

export function buildAdminAuthRedirectUrl(targetPath) {
  const redirectPath = normalizeRedirectPath(
    targetPath,
    '/admin-console/driver-applications',
  );
  return `/admin-console/login?next=${encodeURIComponent(redirectPath)}`;
}

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
