import { useNavigate } from 'react-router-dom';
import { useApi } from '../contexts/ApiProvider';
import { useSession } from '../contexts/SessionProvider';

/**
 * Returns an action that logs out the shopper and clears session state.
 */
export default function useLogoutAction() {
  const api = useApi();
  const { clearSession } = useSession();
  const navigate = useNavigate();

  return async function logout() {
    await api.post('/logout');
    clearSession();
    navigate('/', { replace: true });
  };
}
