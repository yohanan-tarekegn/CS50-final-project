import { useEffect, useState } from 'react';
import { fetchApi } from '../api';

interface PlanUser {
  id: number;
}

interface Plan {
  id: number;
  title: string;
  description: string;
  share_code: string;
  created_at: string;
}

interface MyPlansProps {
  user: PlanUser | null;
  onOpenPlan: (shareCode: string) => void;
  onCreatePlan: () => void;
  onLogin: () => void;
}

export function MyPlans({ user, onOpenPlan, onCreatePlan, onLogin }: MyPlansProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    if (!user) {
      return () => { active = false; };
    }

    fetchApi<{ events: Plan[] }>('/api/events')
      .then((result) => {
        if (active) setPlans(result.events);
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Could not load your plans.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [user]);

  return (
    <section className="plans-page">
      <div className="plans-heading">
        <div>
          <p className="eyebrow">Your gatherings</p>
          <h1>My plans</h1>
        </div>
        <button className="button" onClick={onCreatePlan}>Create a plan <span aria-hidden="true">↗</span></button>
      </div>
      {!user ? (
        <div className="plans-empty">
          <h2>Sign in to see your plans</h2>
          <button className="text-button" onClick={onLogin}>Log in ↗</button>
        </div>
      ) : loading ? <p className="plans-message">Loading your plans…</p> : error ? (
        <div className="plans-message">
          <p className="form-error" role="alert">{error}</p>
          {error === 'Unauthorized' && <button className="text-button" onClick={onLogin}>Log in to see your plans</button>}
        </div>
      ) : plans.length === 0 ? (
        <div className="plans-empty">
          <h2>No plans yet</h2>
          <p>Your gatherings will appear here after you create one.</p>
          <button className="text-button" onClick={onCreatePlan}>Start your first plan ↗</button>
        </div>
      ) : (
        <div className="plans-list">
          {plans.map((plan) => (
            <button className="plan-row" key={plan.id} onClick={() => onOpenPlan(plan.share_code)}>
              <span className="plan-copy">
                <strong>{plan.title}</strong>
                {plan.description && <span>{plan.description}</span>}
              </span>
              <span className="plan-date">{new Date(plan.created_at.replace(' ', 'T')).toLocaleDateString()}</span>
              <span className="plan-open" aria-hidden="true">↗</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}