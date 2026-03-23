import { useCallback } from 'react';
import { markAuthLoaderRequested } from './useAppLoader';

export default function usePrototypeAuthRedirect(redirectPath = '/trip-feed') {
  return useCallback(
    (event) => {
      event.preventDefault();

      // Keep the prototype auth flow consistent across forms until real auth exists.
      markAuthLoaderRequested();
      window.location.assign(redirectPath);
    },
    [redirectPath],
  );
}
