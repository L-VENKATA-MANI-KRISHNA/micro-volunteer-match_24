import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ErrorMessage } from '../components/UIV2';
import { catalog, categories, templates, difficulties } from '../data/catalog';

export default function PostTask() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    title: '', description: '', category: 'Design', service: catalog.Design[0],
    estimatedMinutes: 15, location: '', isRemote: false, difficulty: 'Beginner', preferredTime: '',
    urgency: 'Normal', deadline: '', beginnerFriendly: true, slotsTotal: 1, requiresApproval: false
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const applyTemplate = t => {
    setForm(f => ({
      ...f,
      category: t.category,
      service: t.service,
      title: t.title || f.title,
      description: t.description || f.description,
      difficulty: t.difficulty || f.difficulty
    }));
  };

  const submit = async e => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/tasks', { ...form, estimatedMinutes: Number(form.estimatedMinutes), slotsTotal: Number(form.slotsTotal) });
      nav('/dashboard');
    } catch (e) {
      setError(e.response?.data?.message || 'Unable to post task');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <section className="page-intro">
        <p className="eyebrow">ORGANIZER TOOLKIT</p>
        <h2>Post a service-specific task</h2>
        <p>Urgent tasks rank first. Team tasks accept up to 5 volunteers. Approval adds a quality check.</p>
      </section>

      <div className="templates">
        <b>Start from a template (auto-fills category + service)</b>
        {templates.map(t => (
          <button type="button" key={t.label} onClick={() => applyTemplate(t)} title={`${t.category} → ${t.service}`}>
            {t.label}
          </button>
        ))}
      </div>

      <form className="task-form" onSubmit={submit}>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <label>Task title<input required maxLength={120} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Need a poster for our blood donation camp" /></label>
        <label>Description<textarea required rows="4" maxLength={2000} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Create a simple promotional poster for the event." /></label>
        <div className="form-row">
          <label>Category<select value={form.category} onChange={e => setForm({ ...form, category: e.target.value, service: catalog[e.target.value][0] })}>
            {categories.map(x => <option key={x}>{x}</option>)}
          </select></label>
          <label>Service required<select value={form.service} onChange={e => set('service', e.target.value)}>
            {catalog[form.category].map(x => <option key={x}>{x}</option>)}
          </select></label>
        </div>
        <div className="form-row">
          <label>Estimated minutes (10–15)<select value={form.estimatedMinutes} onChange={e => set('estimatedMinutes', e.target.value)}>
            <option value="10">10 minutes</option>
            <option value="15">15 minutes</option>
          </select></label>
          <label>Experience level<select value={form.difficulty} onChange={e => set('difficulty', e.target.value)}>
            {difficulties.map(x => <option key={x}>{x}</option>)}
          </select></label>
        </div>
        <div className="form-row">
          <label>Urgency<select value={form.urgency} onChange={e => set('urgency', e.target.value)}>
            <option value="Normal">Normal</option>
            <option value="Urgent">🔥 SOS Urgent (ranks first)</option>
          </select></label>
          <label>Team slots (1-5)<select value={form.slotsTotal} onChange={e => set('slotsTotal', e.target.value)}>
            {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} volunteer{n > 1 ? 's' : ''}</option>)}
          </select></label>
        </div>
        <div className="form-row">
          <label>Location<input required value={form.location} onChange={e => set('location', e.target.value)} placeholder="Online / Block B, Room 3" /></label>
          <label>Preferred date/time (optional)<input type="datetime-local" value={form.preferredTime} onChange={e => set('preferredTime', e.target.value)} /></label>
        </div>
        <div className="form-row">
          <label>Deadline (optional)<input type="datetime-local" value={form.deadline} onChange={e => set('deadline', e.target.value)} /></label>
          <label className="check" style={{ alignItems: 'end' }}><span><input type="checkbox" checked={form.beginnerFriendly} onChange={e => set('beginnerFriendly', e.target.checked)} /> 🌱 Beginner-friendly (no portfolio needed)</span></label>
        </div>
        <label className="check"><input type="checkbox" checked={form.isRemote} onChange={e => set('isRemote', e.target.checked)} /> This can be completed remotely</label>
        <label className="check"><input type="checkbox" checked={form.requiresApproval} onChange={e => set('requiresApproval', e.target.checked)} /> Require proof approval before completion (recommended for Design/Video)</label>
        <button disabled={saving}>{saving ? 'Posting...' : 'Post micro-task'}</button>
      </form>
    </>
  );
}
