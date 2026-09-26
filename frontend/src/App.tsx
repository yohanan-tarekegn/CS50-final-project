import { useCallback, useEffect, useState } from 'react';
import { fetchApi } from './api';
import { AuthPanel } from './components/AuthPanel';
import { EventComposer } from './components/EventComposer';
import { EventDetail } from './components/EventDetail';
import { MyPlans } from './components/MyPlans';

export interface User {
  id: number;
  username: string;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'register' | null>(null);
  const [shareCode, setShareCode] = useState(() => readShareCode());
  const [showPlans, setShowPlans] = useState(() => window.location.pathname === '/plans');

  useEffect(() => {
    fetchApi<{ user: User | null }>('/api/me')
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setShareCode(readShareCode());
      setShowPlans(window.location.pathname === '/plans');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const openEvent = useCallback((code: string) => {
    window.history.pushState({}, '', `/event/${encodeURIComponent(code)}`);
    setShareCode(code);
    setAuthMode(null);
  }, []);

  const goHome = () => {
    window.history.pushState({}, '', '/');
    setShareCode(null);
    setShowPlans(false);
    setAuthMode(null);
  };

  const goToPlans = () => {
    window.history.pushState({}, '', '/plans');
    setShareCode(null);
    setShowPlans(true);
    setAuthMode(null);
  };

  const logout = async () => {
    await fetchApi<{ message: string }>('/api/logout', { method: 'POST' });
    setUser(null);
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={goHome} aria-label="GatherRound home">
          <span className="brand-mark" aria-hidden="true">g</span>
          <span>gatherround</span>
        </button>
        <div className="account-area">
          {loading ? <span className="quiet-label">Checking session</span> : user ? (
            <>
              <button className="text-button" onClick={goToPlans}>My plans</button>
              <span className="signed-in">{user.username}</span>
              <button className="text-button" onClick={() => void logout()}>Sign out</button>
            </>
          ) : (
            <>
              <button className="text-button" onClick={() => setAuthMode('login')}>Log in</button>
              <button className="button button-small" onClick={() => setAuthMode('register')}>Create account</button>
            </>
          )}
        </div>
      </header>

      <main className="main-content">
        {authMode ? (
          <AuthPanel
            initialMode={authMode}
            onCancel={() => setAuthMode(null)}
            onSuccess={(nextUser) => { setUser(nextUser); setAuthMode(null); }}
          />
        ) : shareCode ? (
          <EventDetail shareCode={shareCode} user={user} loading={loading} onOpenAuth={() => setAuthMode('login')} onBack={showPlans ? goToPlans : goHome} />
        ) : showPlans ? (
          <MyPlans key={user?.id ?? 'signed-out'} user={user} onOpenPlan={openEvent} onCreatePlan={goHome} onLogin={() => setAuthMode('login')} />
        ) : (
          <>
            <section className="intro-row">
              <div>
                <p className="eyebrow">Make a plan, together</p>
                <h1>Good things happen<br />when we gather.</h1>
                <p className="intro-copy">Find a time everyone can make. One simple poll, a plan worth keeping.</p>
              </div>
              <div className="orbit-art" aria-hidden="true">
                <span className="orbit orbit-one" /><span className="orbit orbit-two" />
                <span className="sun-dot" /><span className="orbit-caption">your people,<br />in one place</span>
              </div>
            </section>
            {user ? (
              <EventComposer onCreated={openEvent} />
            ) : (
              <section className="welcome-strip">
                <div>
                  <p className="eyebrow">Start with your crew</p>
                  <h2>Bring everyone to the table.</h2>
                </div>
                <button className="button" onClick={() => setAuthMode('register')}>Create a free account <span aria-hidden="true">↗</span></button>
              </section>
            )}
          </>
        )}
      </main>
      <footer className="site-footer"><span>GatherRound</span><span>Plans are better together.</span></footer>
    </div>
  );
}

function readShareCode(): string | null {
  const match = window.location.pathname.match(/^\/event\/([^/]+)\/?$/);
  return match ? decodeURIComponent(match[1]) : null;
}

export default App;