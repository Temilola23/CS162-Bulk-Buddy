import useLoginForm from './useLoginForm';

/**
 * Redirects legacy prototype auth flows to a target route.
 */
export default function usePrototypeAuthRedirect(redirectPath = '/trip-feed') {
  // Keep the legacy import name working while the forms move onto the real API-backed flow.
  return useLoginForm(redirectPath).handleSubmit;
}
