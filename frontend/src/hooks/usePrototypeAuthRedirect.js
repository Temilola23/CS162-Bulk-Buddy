import useLoginForm from './useLoginForm';

export default function usePrototypeAuthRedirect(redirectPath = '/trip-feed') {
  // Keep the legacy import name working while the forms move onto the real API-backed flow.
  return useLoginForm(redirectPath).handleSubmit;
}
