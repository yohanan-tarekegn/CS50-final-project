import { useEffect, useState } from 'react';
import { fetchApi } from '../api';
import type { User } from '../App';

interface EventOption {
  id: number;
  option_text: string;
  votes: number;
  user_voted: boolean;
}

interface EventData {
  id: number;
  title: string;
  description: string;
  share_code: string;
  creator: string;
  options: EventOption[];
}

interface EventDetailProps {
  shareCode: string;
  user: User | null;
  onOpenAuth: () => void;
  onBack: () => void;
}

async function fetchEvent(shareCode: string): Promise<EventData> {
  return fetchApi<EventData>(`/api/events/${encodeURIComponent(shareCode)}`);
}

export function EventDetail({ shareCode, user, onOpenAuth, onBack }: EventDetailProps) {
  const [event, setEvent] = useState<EventData | null>(null);
  const [error, setError] = useState('');
  const [busyOption, setBusyOption] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const loadEvent = async () => {
    try {
      const result = await fetchEvent(shareCode);
      setEvent(result);
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load this gathering.');
    }
  };

  useEffect(() => {
    let active = true;
    fetchEvent(shareCode)
      .then((result) => {
        if (active) {
          setEvent(result);
          setError('');
        }
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Could not load this gathering.');
        }
      });
    return () => { active = false; };
  }, [shareCode]);

  const vote = async (optionId: number) => {
    if (!user) {
      onOpenAuth();
      return;
    }
    setBusyOption(optionId);
    setError('');
    try {
      await fetchApi<{ action: 'added' | 'removed' }>('/api/vote', {
        method: 'POST',
        body: JSON.stringify({ option_id: optionId }),
      });
      await loadEvent();
    } catch (voteError) {
      setError(voteError instanceof Error ? voteError.message : 'Your vote could not be saved.');
    } finally {
      setBusyOption(null);
    }
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  if (error && !event) {
    return <section className="event-state"><button className="back-link" onClick={onBack}>← All gatherings</button><p className="eyebrow">Gathering unavailable</p><h1>We couldn’t find that plan.</h1><p>{error}</p></section>;
  }
  if (!event) return <section className="event-state"><p className="eyebrow">GatherRound</p><h1>Opening the gathering…</h1></section>;

  const totalVotes = event.options.reduce((total, option) => total + option.votes, 0);
  return (
    <section className="event-page">
      <button className="back-link" onClick={onBack}>← Create a gathering</button>
      <div className="event-heading">
        <div><p className="eyebrow">A gathering by {event.creator}</p><h1>{event.title}</h1>{event.description && <p className="event-description">{event.description}</p>}</div>
        <button className="share-button" onClick={() => void copyLink()} aria-label="Copy invitation link" title="Copy invitation link"><span aria-hidden="true">↗</span><span>{copied ? 'Link copied' : 'Share invite'}</span></button>
      </div>
      <div className="vote-header"><div><p className="eyebrow">Find the best fit</p><h2>Choose every option that works</h2></div><span className="vote-total">{totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}</span></div>
      <div className="vote-list">
        {event.options.map((option, index) => {
          const percent = totalVotes ? Math.round(option.votes / totalVotes * 100) : 0;
          return (
            <button key={option.id} className={`vote-option ${option.user_voted ? 'selected' : ''}`} onClick={() => void vote(option.id)} disabled={busyOption !== null}>
              <span className="vote-number">{String(index + 1).padStart(2, '0')}</span>
              <span className="vote-choice"><span>{option.option_text}</span><span className="vote-meter"><i style={{ width: `${percent}%` }} /></span></span>
              <span className="vote-count">{option.votes}<small>{option.user_voted ? 'Your vote' : option.votes === 1 ? 'vote' : 'votes'}</small></span>
              <span className="vote-check" aria-hidden="true">{option.user_voted ? '✓' : '+'}</span>
            </button>
          );
        })}
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <p className="vote-note">{user ? `Voting as ${user.username}. Select an option again to remove your vote.` : 'Log in to cast your vote.'}</p>
    </section>
  );
}