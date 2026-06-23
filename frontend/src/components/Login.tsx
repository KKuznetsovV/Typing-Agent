import { useAuth } from '../context/AuthContext';

export function Login() {
  const { login } = useAuth();

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <h1>GitHub OAuth App</h1>
        <p>Sign in to continue</p>
        <button type="button" onClick={login}>
          Sign in with GitHub
        </button>
      </div>
    </div>
  );
}
