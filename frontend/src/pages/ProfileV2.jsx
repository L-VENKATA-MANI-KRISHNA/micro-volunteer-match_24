import { useEffect, useState } from 'react';
import { Award, Clock, CheckCircle2, Plus, Trash2, Briefcase, CalendarClock, HeartHandshake, BellPlus, Star, Share2 } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner, StatCard, ErrorMessage } from '../components/UIV2';
import { catalog, categories, categoryIcons } from '../data/catalog';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const INTEREST_OPTIONS = [...categories, ...Object.values(catalog).flat().slice(0, 30)];

export default function Profile() {
  const { user, save } = useAuth();
  const [stats, setStats] = useState(null);
  const [skills, setSkills] = useState(user.skills || []);
  const [interests, setInterests] = useState(user.interests || []);
  const [availability, setAvailability] = useState(user.availability || []);
  const [portfolio, setPortfolio] = useState(user.portfolio || []);
  const [alerts, setAlerts] = useState([]);
  const [cert, setCert] = useState(null);
  const [interestInput, setInterestInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  useEffect(() => {
    api.get('/stats/me').then(r => setStats(r.data)).catch(() => {});
    api.get('/stats/alerts').then(r => setAlerts(r.data.alerts || [])).catch(() => {});
    if (user.role === 'student') api.get('/stats/certificate').then(r => setCert(r.data)).catch(() => {});
  }, []);

  const toggle = (category, service) => {
    const group = skills.find(x => x.name === category);
    if (group?.services?.includes(service)) {
      const next = group.services.filter(s => s !== service);
      setSkills(next.length
        ? skills.map(x => (x.name === category ? { ...x, services: next } : x))
        : skills.filter(x => x.name !== category));
    } else {
      setSkills([...skills.filter(x => x.name !== category), { name: category, services: [...(group?.services || []), service] }]);
    }
  };

  const saveAll = async () => {
    setSaving(true); setError(''); setOk('');
    try {
      const { data } = await api.patch('/stats/profile', { skills, interests, availability, portfolio });
      const token = localStorage.getItem('mvm_token');
      save({ token, user: data.user });
      setOk('Profile saved. Recommendations update instantly.');
    } catch (e) { setError(e.response?.data?.message || 'Could not save profile'); }
    finally { setSaving(false); }
  };

  const removeAlert = async idx => {
    await api.delete(`/stats/alerts/${idx}`);
    setAlerts(alerts.filter((_, i) => i !== idx));
  };

  if (!stats) return <LoadingSpinner />;

  return (
    <>
      <section className="profile-hero">
        <div className="profile-avatar">{user.name?.[0] || 'S'}</div>
        <div>
          <p className="eyebrow">IMPACT PROFILE</p>
          <h2>{user.name} {stats.ratingAvg ? <small>★{stats.ratingAvg} ({stats.ratingCount})</small> : ''}</h2>
          <p>{user.role === 'organizer' ? 'Club organizer' : 'Student volunteer'} · Member since {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : ''}</p>
        </div>
        <div className="badge-big"><Award /><span>{stats.badges.find(x => x.earned)?.name || 'Impact Starter'}</span></div>
      </section>

      <div className="stats-grid">
        <StatCard label="Tasks completed" value={stats.completedTasks} icon={CheckCircle2} />
        <StatCard label="Impact minutes" value={stats.impactMinutes} icon={Clock} />
        <StatCard label="People helped" value={stats.peopleHelped || 0} icon={HeartHandshake} />
        <StatCard label="Rating" value={stats.ratingAvg ? `★${stats.ratingAvg}` : 'New'} icon={Star} />
      </div>

      {cert && cert.completedTasks > 0 && (
        <div className="cert-banner">
          <span>🎓 Certificate ready: {cert.name} · {cert.completedTasks} tasks · {cert.impactMinutes} mins · {cert.date}</span>
          <button className="button ghost small" onClick={() => {
            const text = `I volunteered ${cert.completedTasks} tasks (${cert.impactMinutes} mins) via Micro-Volunteer Match!`;
            if (navigator.share) navigator.share({ title: 'My Certificate', text }).catch(() => {});
            else window.print();
          }}><Share2 /> Share / Print</button>
        </div>
      )}

      <section className="skills">
        <p className="eyebrow">WHAT I CAN HELP WITH</p>
        <h2>{skills.reduce((n, g) => n + (g.services?.length || 0), 0)} services ready</h2>
        <div className="help-grid">
          {skills.map(g => (
            <div key={g.name} className="help-card"><b>{categoryIcons[g.name] || ''} {g.name}</b><ul>{g.services.map(s => <li key={s}>{s}</li>)}</ul></div>
          ))}
        </div>
        <h3>Select your skills</h3>
        {categories.map(category => (
          <div className="skill-group" key={category}>
            <b>{categoryIcons[category]} {category}</b>
            <div>{catalog[category].map(service => (
              <label className="service-check" key={service}>
                <input type="checkbox" checked={skills.some(x => x.name === category && x.services?.includes(service))} onChange={() => toggle(category, service)} />{service}
              </label>
            ))}</div>
          </div>
        ))}
      </section>

      <section className="skills">
        <p className="eyebrow">AVAILABILITY & INTERESTS</p>
        <h2>When can you help?</h2>
        {availability.map((a, i) => (
          <div className="portfolio-row" key={i}>
            <select value={a.day} onChange={e => setAvailability(availability.map((x, j) => (j === i ? { ...x, day: e.target.value } : x)))}>{DAYS.map(d => <option key={d}>{d}</option>)}</select>
            <input type="time" value={a.start || ''} onChange={e => setAvailability(availability.map((x, j) => (j === i ? { ...x, start: e.target.value } : x)))} />
            <input type="time" value={a.end || ''} onChange={e => setAvailability(availability.map((x, j) => (j === i ? { ...x, end: e.target.value } : x)))} />
            <button type="button" onClick={() => setAvailability(availability.filter((_, j) => j !== i))}><Trash2 /></button>
          </div>
        ))}
        <button type="button" className="button ghost" onClick={() => setAvailability([...availability, { day: 'Monday', start: '17:00', end: '19:00' }])}><CalendarClock /> Add time slot</button>
        <h3>Interests</h3>
        <div className="chips">{interests.map(x => <span key={x} className="chip">{x} <button type="button" onClick={() => setInterests(interests.filter(y => y !== x))}>×</button></span>)}</div>
        <div className="portfolio-row">
          <input list="interest-options" value={interestInput} onChange={e => setInterestInput(e.target.value)} placeholder="e.g. event work" onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (interestInput.trim()) { setInterests([...interests, interestInput.trim()]); setInterestInput(''); } } }} />
          <datalist id="interest-options">{INTEREST_OPTIONS.map(o => <option key={o} value={o} />)}</datalist>
          <button type="button" onClick={() => { if (interestInput.trim()) { setInterests([...interests, interestInput.trim()]); setInterestInput(''); } }}><Plus /></button>
        </div>
        <h3><BellPlus /> Saved alerts ({alerts.length})</h3>
        {alerts.length === 0 ? <p className="muted">Save filters from Task Board to get boosted recommendations.</p> :
          alerts.map((a, i) => <p key={i} className="chip">{a.category || 'Any'} → {a.service || 'Any'} · {a.minMatch}% <button onClick={() => removeAlert(i)}>×</button></p>)}
      </section>

      <section className="skills">
        <p className="eyebrow">PORTFOLIO · OPTIONAL</p>
        <h2>My work</h2>
        {portfolio.map((item, index) => (
          <div className="portfolio-row" key={index}>
            <input value={item.title || ''} onChange={e => setPortfolio(portfolio.map((x, i) => (i === index ? { ...x, title: e.target.value } : x)))} placeholder="Work title" />
            <input value={item.url || ''} onChange={e => setPortfolio(portfolio.map((x, i) => (i === index ? { ...x, url: e.target.value } : x)))} placeholder="https://..." />
            <button type="button" onClick={() => setPortfolio(portfolio.filter((_, i) => i !== index))}><Trash2 /></button>
          </div>
        ))}
        <button type="button" className="button ghost" onClick={() => setPortfolio([...portfolio, { title: '', url: '' }])}><Plus /> Add link</button>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        {ok && <p className="success">{ok}</p>}
        <button className="wide" disabled={saving} onClick={saveAll}>{saving ? 'Saving...' : 'Save profile'}</button>
      </section>

      <section className="skills">
        <p className="eyebrow">MY IMPACT</p>
        <h2>Contribution tracking</h2>
        <div className="impact-breakdown">
          <span>🏆 {stats.completedTasks} Done</span><span>⏱️ {stats.impactMinutes} Mins</span><span>👥 {stats.peopleHelped || 0} Helped</span><span>🛠️ {stats.skillsUsed ?? 0} Skills</span>
        </div>
        <div className="badge-grid">
          {(stats.badges || []).map(b => (
            <div key={b.name} className={b.earned ? 'earned-badge' : 'locked-badge'}>
              <span className="badge-icon">{b.icon}</span><b>{b.name}</b><small>{b.detail}</small>
              {b.target > 1 && <small>{b.progress || 0}/{b.target}</small>}
              <small>{b.earned ? 'Unlocked ✓' : 'Locked'}</small>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
