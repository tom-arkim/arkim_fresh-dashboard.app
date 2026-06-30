import { getSessionId } from '@/storage/authStorage';
import { Outlet, useNavigate } from 'react-router-dom';

function AuthRouting() {
  const sessionId = getSessionId();
  const navigate = useNavigate();

  if (sessionId) {
    navigate('/dashboard', { replace: true });
  }
  return (
    <main
      className="flex items-center justify-center min-h-screen"
      style={{
        backgroundImage: 'url("/bg-centre-gradient.png")',
      }}
    >
      <Outlet />
    </main>
  );
}

export default AuthRouting;
