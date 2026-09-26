import { useState } from 'react';
import { fetchApi } from '../api';
import type { User } from '../App';

interface AuthPanelProps {
  initialMode: 'login' | 'register';
  onCancel: () => void;
  onSuccess: (user: User) => void;
}

export function AuthPanel({ initialMode, onCancel, onSuccess }: AuthPanelProps) {
  const [mode, setMode] = useState(initialMode);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const result = await fetchApi<User>(`/api/${mode === 'register' ? 'register' : 'login'}`, {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      onSuccess(result);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not sign in.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="form-panel auth-panel">
      <button className="back-link" onClick={onCancel}>← Back</button>
      <p className="eyebrow">Your plans, all in one place</p>
      <h1>{mode === 'register' ? 'Join the gathering.' : 'Welcome back.'}</h1>
      <p className="form-intro">{mode === 'register' ? 'Create an account to start making plans.' : 'Sign in to keep planning with your people.'}</p>
      <div className="mode-switch" role="tablist" aria-label="Account access">
        <button role="tab" aria-selected={mode === 'login'} className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setError(''); }}>Log in</button>
        <button role="tab" aria-selected={mode === 'register'} className={mode === 'register' ? 'active' : ''} onClick={() => { setMode('register'); setError(''); }}>Create account</button>
      </div>
      <form onSubmit={(event) => void submit(event)} className="stack-form">
        <label>Username<input autoComplete="username" required value={username} onChange={(event) => setUsername(event.target.value)} /></label>
        <label>Password<input type="password" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button form-submit" disabled={submitting}>{submitting ? 'Please wait…' : mode === 'register' ? 'Create account' : 'Log in'} <span aria-hidden="true">↗</span></button>
      </form>
    </section>
  );
}