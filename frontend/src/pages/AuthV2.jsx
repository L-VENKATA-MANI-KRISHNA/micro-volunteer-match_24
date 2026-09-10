import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HeartHandshake } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { catalog, categories, categoryIcons } from '../data/catalog';

export default function Auth({ register = false }) {
  const { save } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student', skills: [] });
  const [open, setOpen] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const toggleSkillGroup = category => {
    const all = catalog[category];
    const current = form.skills.find(x => x.name === category)?.services || [];
    const allSelected = all.every(s => current.includes(s));
    if (allSelected) {
      setForm({ ...form, skills: form.skills.filter(x => x.name !== category) });
    } else {
      setForm({
        ...form,
        skills: [...form.skills.filter(x => x.name !== category), { name: category, services: [...all] }]
      });
    }
  };

  const toggle = (category, service) => {
    const group = form.skills.find(x => x.name === category);
    if (group?.services.includes(service)) {
      const next = group.services.filter(s => s !== service);
      setForm({
        ...form,
        skills: next.length
          ? form.skills.map(x => (x.name === category ? { ...x, services: next } : x))
          : form.skills.filter(x => x.name !== category)
      });
    } else {
      setForm({
        ...form,
        skills: [...form.skills.filter(x => x.name !== category), { name: category, services: [...(group?.services || []), service] }]
      });
    }
  };

  const submit = async e => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { data } = await api.post(
        `/auth/${register ? 'register' : 'login'}`,
        register ? form : { email: form.email, password: form.password }
      );
      save(data);
      nav('/dashboard');
    } catch (e) {
      setError(e.response?.data?.message || 'Unable to continue. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const selectedCount = form.skills.reduce((n, g) => n + g.services.length, 0);

  return (
    <div className="auth">
      <Link className="brand" to="/"><HeartHandshake /> Micro<span>Match</span></Link>
      <form onSubmit={submit}>
        <p className="eyebrow">{register ? 'JOIN THE MOVEMENT' : 'WELCOME BACK'}</p>
        <h1>{register ? 'Make your minutes matter.' : 'Sign in to your impact.'}</h1>
        {error && <p className="error">{error}</p>}
        {register && (
          <label>Name<input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Your full name" /></label>
        )}
        <label>Email<input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@college.edu" /></label>
        <label>Password<input required minLength="6" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min 6 characters" /></label>
        {register && (
          <>
            <label>I want to join as
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                <option value="student">A student volunteer</option>
                <option value="organizer">A club organizer</option>
              </select>
            </label>
            {form.role === 'student' && (
              <div className="signup-services">
                <b>Select your skills {selectedCount > 0 && `(${selectedCount} services)`}</b>
                <p className="hint">Pick a skill, then choose exact services. You can edit this later.</p>
                {categories.map(category => {
                  const current = form.skills.find(x => x.name === category)?.services || [];
                  const isOpen = open[category] ?? current.length > 0;
                  return (
                    <div key={category} className="signup-group">
                      <div className="signup-group-head">
                        <button type="button" className="link-btn" onClick={() => setOpen({ ...open, [category]: !isOpen })}>
                          {categoryIcons[category] || '•'} {category} ({current.length}/{catalog[category].length})
                        </button>
                        <button type="button" className="link-btn small" onClick={() => toggleSkillGroup(category)}>
                          {catalog[category].every(s => current.includes(s)) ? 'Clear' : 'Select all'}
                        </button>
                      </div>
                      {isOpen && (
                        <div className="signup-services-list">
                          {catalog[category].map(service => (
                            <label className="service-check" key={service}>
                              <input
                                type="checkbox"
                                checked={current.includes(service)}
                                onChange={() => toggle(category, service)}
                              />
                              {service}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
        <button className="wide" disabled={busy}>{busy ? 'Please wait...' : register ? 'Create my account' : 'Log in'}</button>
        <p className="switch">{register ? 'Already a member?' : 'New to MicroMatch?'} <Link to={register ? '/login' : '/register'}>{register ? 'Log in' : 'Create account'}</Link></p>
      </form>
    </div>
  );
}
