import { useNavigate } from 'react-router-dom';
import { useApi } from '../contexts/ApiProvider';
import { useSession } from '../contexts/SessionProvider';

export default function useAdminLogoutAction() {
  const api = useApi();
  const navigate = useNavigate();
  const { clearSession } = useSession();

  return async function logout() {
    await api.post('/admin/logout');
    clearSession();
    navigate('/admin-console/login', { replace: true });
  };
}
