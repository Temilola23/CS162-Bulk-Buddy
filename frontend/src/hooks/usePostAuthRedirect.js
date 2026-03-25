import { useMemo } from 'react';

function normalizeRedirectPath(target, fallbackPath) {
  if (!target || typeof target !== 'string') {
    return fallbackPath;
  }

  // Only allow internal app paths so auth redirects cannot be turned into
  // external open redirects.
  if (!target.startsWith('/') || target.startsWith('//')) {
    return fallbackPath;
  }

  if (target === '/login' || target === '/register') {
    return fallbackPath;
  }

  return target;
}

export function buildAuthRedirectUrl(targetPath) {
  const encodedTarget = encodeURIComponent(targetPath);
  return `/login?next=${encodedTarget}`;
}

export default function usePostAuthRedirect(fallbackPath = '/trip-feed', preferredRedirectPath = null) {
  return useMemo(() => {
    if (preferredRedirectPath) {
      const redirectPath = normalizeRedirectPath(preferredRedirectPath, fallbackPath);
      return {
        redirectPath,
        authQueryString: `?next=${encodeURIComponent(redirectPath)}`,
      };
    }

    if (typeof window === 'undefined') {
      return {
        redirectPath: fallbackPath,
        authQueryString: '',
      };
    }

    const searchParams = new URLSearchParams(window.location.search);
    const requestedNextPath = searchParams.get('next');
    const redirectPath = normalizeRedirectPath(requestedNextPath, fallbackPath);
    const hasExplicitNextTarget = requestedNextPath === redirectPath;

    return {
      redirectPath,
      authQueryString: hasExplicitNextTarget
        ? `?next=${encodeURIComponent(redirectPath)}`
        : '',
    };
  }, [fallbackPath, preferredRedirectPath]);
}
