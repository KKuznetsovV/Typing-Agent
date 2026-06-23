import { useAuth } from '../context/AuthContext';

export function Welcome() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="auth-screen">
      <div className="auth-card">
        {user.avatarUrl && (
          <img src={user.avatarUrl} alt="" className="avatar" width={64} height={64} />
        )}
        <h1>Welcome, {user.displayName || user.username}!</h1>
        <button type="button" onClick={logout}>
          Logout
        </button>
      </div>
    </div>
  );
}
