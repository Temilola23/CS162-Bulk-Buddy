import { useApi } from '../contexts/ApiProvider';
import { useSession } from '../contexts/SessionProvider';

export default function useLogoutAction() {
  const api = useApi();
  const { clearSession } = useSession();

  return async function logout() {
    await api.post('/logout');
    clearSession();
    window.location.assign('/');
  };
}
