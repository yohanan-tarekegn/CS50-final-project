import { useState } from 'react';
import { fetchApi } from '../api';

interface EventComposerProps {
  onCreated: (shareCode: string) => void;
}

export function EventComposer({ onCreated }: EventComposerProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const updateOption = (index: number, value: string) => {
    setOptions((current) => current.map((option, optionIndex) => optionIndex === index ? value : option));
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const votingOptions = options.map((option) => option.trim()).filter(Boolean);
    if (votingOptions.length < 2) {
      setError('Add at least two voting options.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const result = await fetchApi<{ event_id: number; share_code: string }>('/api/events', {
        method: 'POST',
        body: JSON.stringify({ title: title.trim(), description: description.trim(), options: votingOptions }),
      });
      onCreated(result.share_code);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not create this event.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="form-panel composer-panel">
      <div className="panel-heading">
        <div><p className="eyebrow">The first step</p><h2>Start a new gathering</h2></div>
        <span className="step-mark">01 <i>/ 01</i></span>
      </div>
      <form onSubmit={(event) => void submit(event)} className="stack-form">
        <label>What are we getting together for?<input required maxLength={120} placeholder="Sunday brunch, movie night…" value={title} onChange={(event) => setTitle(event.target.value)} /></label>
        <label>A little more detail <span className="optional">Optional</span><textarea rows={2} maxLength={500} placeholder="Add a note for your guests" value={description} onChange={(event) => setDescription(event.target.value)} /></label>
        <fieldset className="options-fieldset">
          <legend>What should people vote on?</legend>
          <p className="field-hint">Add dates, times, places, or anything else to choose from.</p>
          <div className="option-list">
            {options.map((option, index) => (
              <div className="option-input" key={index}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <input aria-label={`Voting option ${index + 1}`} maxLength={160} placeholder={index === 0 ? 'Friday, 7 pm' : 'Saturday, 2 pm'} value={option} onChange={(event) => updateOption(index, event.target.value)} />
                {options.length > 2 && <button type="button" className="remove-option" aria-label={`Remove option ${index + 1}`} onClick={() => setOptions((current) => current.filter((_, optionIndex) => optionIndex !== index))}>×</button>}
              </div>
            ))}
          </div>
          {options.length < 8 && <button type="button" className="add-option" onClick={() => setOptions((current) => [...current, ''])}>+ Add another option</button>}
        </fieldset>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="form-bottom"><span>Share the poll once it’s ready.</span><button className="button" disabled={submitting}>{submitting ? 'Creating…' : 'Create gathering'} <span aria-hidden="true">↗</span></button></div>
      </form>
    </section>
  );
}