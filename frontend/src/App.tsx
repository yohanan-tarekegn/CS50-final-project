import { useEffect, useState } from 'react';
import { fetchApi } from './api';

interface User {
  id: number;
  username: string;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>('Connecting to backend...');

  useEffect(() => {
    fetchApi<{ user: User | null }>('/api/me')
      .then((data) => {
        setUser(data.user);
        setStatus('Successfully connected to Flask backend!');
      })
      .catch((err) => {
        setStatus(`Backend connection failed: ${err.message}`);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>GatherRound</h1>
      <p><strong>Status:</strong> {status}</p>
      {loading ? (
        <p>Loading session data...</p>
      ) : (
        <p>Logged in as: {user ? user.username : 'Guest (Not logged in)'}</p>
      )}
    </div>
  );
}

export default App;