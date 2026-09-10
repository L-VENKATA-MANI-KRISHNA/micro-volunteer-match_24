import { Clock, MapPin, Wifi, CheckCircle2, Users, Sparkles, Target, ArrowRight, Flame, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { categoryIcons } from '../data/catalog';

export const StatusBadge = ({ status }) => (
  <span className={`badge ${(status || '').toLowerCase().replace('-', '').replace('_', '')}`}>{status?.replace('_', ' ')}</span>
);

export const DifficultyBadge = ({ level }) => (
  <span className={`difficulty difficulty-${(level || 'beginner').toLowerCase()}`}>{level}</span>
);

export const UrgencyBadge = ({ urgency }) => (
  urgency === 'Urgent' ? <span className="urgency"><Flame /> SOS Urgent</span> : null
);

export function StatCard({ label, value, icon: Icon = Sparkles }) {
  return (
    <article className="stat-card">
      <div><span>{label}</span><strong>{value}</strong></div>
      <Icon />
    </article>
  );
}

export function ImpactCounter({ stats }) {
  return (
    <section className="impact">
      <div>
        <span>Campus Impact</span>
        <h2>{stats.impactMinutes} <small>Minutes Contributed</small></h2>
        <p>Every small action adds up to meaningful campus change.{stats.urgentOpen ? ` ${stats.urgentOpen} urgent open now.` : ''}</p>
      </div>
      <div className="impact-stats">
        <span><CheckCircle2 /> {stats.completedTasks} tasks done</span>
        <span><Users /> {stats.activeVolunteers} active volunteers</span>
      </div>
    </section>
  );
}

export function MatchScore({ match }) {
  if (!match) return null;
  const cls = match.score >= 80 ? 'high' : match.score >= 40 ? 'mid' : 'low';
  return (
    <span className={`match-score ${cls}`} title={(match.reasons || []).join('\n')}>
      <Target /> {match.score}% Match
    </span>
  );
}

export function RatingStars({ value }) {
  if (!value) return <span className="muted">New</span>;
  return <span className="stars"><Star /> {Number(value).toFixed(1)}</span>;
}

export function MatchBreakdown({ match }) {
  if (!match) return null;
  const rows = [
    { label: 'Exact service match (+70)', ok: match.serviceMatch },
    { label: 'Parent skill match (+20)', ok: match.skillMatch },
    { label: 'Interest match (+5)', ok: match.interestMatch },
    { label: 'Availability match (+5)', ok: match.availabilityMatch }
  ];
  return (
    <div className="match-breakdown">
      <b><Target /> Why {match.score}%?</b>
      <ul>
        {rows.map(r => (
          <li key={r.label} className={r.ok ? 'ok' : 'miss'}>{r.ok ? '✓' : '○'} {r.label}</li>
        ))}
      </ul>
      {(match.reasons || []).length > 0 && (
        <div className="match-reasons">{match.reasons.map((x, i) => <span key={i}>{x}</span>)}</div>
      )}
    </div>
  );
}

export function TaskCard({ task, onClaim, onComplete, showMatch = true }) {
  const left = task.slotsLeft ?? (task.slotsTotal > 1 ? Math.max(0, (task.slotsTotal || 1) - (task.volunteers?.length || 0)) : null);
  return (
    <article className={`task-card ${task.urgency === 'Urgent' ? 'urgent' : ''}`}>
      <div className="card-top">
        <span className="category">{categoryIcons[task.category] || ''} {task.category}</span>
        <span className="badges-right"><UrgencyBadge urgency={task.urgency} /><StatusBadge status={task.status} /></span>
      </div>
      <h3><Link to={`/tasks/${task._id}`}>{task.title}</Link></h3>
      <p className="desc">{task.description}</p>
      <div className="service-badges">
        <span className="service-badge">{task.service}</span>
        {task.difficulty && <DifficultyBadge level={task.difficulty} />}
        {task.beginnerFriendly && <span className="beginner">🌱 Beginner-friendly</span>}
        {task.slotsTotal > 1 && <span className="team"><Users /> Team {task.volunteers?.length || 0}/{task.slotsTotal}{left > 0 ? ` · ${left} left` : ''}</span>}
      </div>
      <div className="task-meta">
        <span><Clock /> {task.estimatedMinutes} mins</span>
        <span>{task.isRemote ? <><Wifi /> Remote</> : <><MapPin /> {task.location}</>}</span>
      </div>
      <div className="card-footer">
        <small>By {task.organizer?.name || 'Campus organizer'} {task.organizer?.ratingAvg ? `★${task.organizer.ratingAvg}` : ''}</small>
        {showMatch && task.match && <MatchScore match={task.match} />}
      </div>
      <div className="card-actions">
        <Link className="button ghost" to={`/tasks/${task._id}`}>View Task <ArrowRight /></Link>
        {onClaim && (task.status === 'OPEN' || (task.status === 'IN-PROGRESS' && (task.slotsLeft ?? 1) > 0)) && <button onClick={() => onClaim(task._id)}>Accept · {task.estimatedMinutes}m</button>}
        {onComplete && task.status === 'IN-PROGRESS' && <button onClick={() => onComplete(task._id)}>Mark complete</button>}
      </div>
    </article>
  );
}

export const LoadingSpinner = () => <div className="loading">Loading your impact...</div>;
export const ErrorMessage = ({ children }) => <p className="error">{children}</p>;
export const EmptyState = ({ title, hint }) => (
  <div className="empty"><Sparkles /><h3>{title}</h3>{hint && <p>{hint}</p>}</div>
);

// Downloadable calendar file for preferredTime/deadline
export function downloadICS(task) {
  const dt = task.preferredTime || task.deadline;
  if (!dt) return;
  const start = new Date(dt);
  const end = new Date(start.getTime() + (task.estimatedMinutes || 15) * 60000);
  const fmt = d => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT', `UID:${task._id}@micromatch`, `DTSTART:${fmt(start)}`, `DTEND:${fmt(end)}`, `SUMMARY:${task.title}`, `DESCRIPTION:${(task.description || '').slice(0, 200)}`, `LOCATION:${task.location || ''}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  const blob = new Blob([ics], { type: 'text/calendar' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'micro-task.ics';
  a.click();
}
