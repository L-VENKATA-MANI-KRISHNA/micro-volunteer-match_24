import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardCheck, Timer, ListChecks, PlusCircle, Sparkles, ArrowRight, Flame, Trophy, Share2 } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ImpactCounter, LoadingSpinner, StatCard, TaskCard, ErrorMessage, EmptyState } from '../components/UIV2';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [gaps, setGaps] = useState([]);
  const [leaders, setLeaders] = useState([]);
  const [cert, setCert] = useState(null);
  const [error, setError] = useState('');

  const load = async () => {
    setError('');
    try {
      const reqs = [api.get('/stats/campus'), api.get('/tasks/mine'), api.get('/auth/me'), api.get('/stats/gaps'), api.get('/stats/leaderboard')];
      if (user.role === 'student') reqs.push(api.get('/tasks/recommendations'), api.get('/stats/certificate'));
      const results = await Promise.allSettled(reqs);
      const val = (i, fallback) => (results[i]?.status === 'fulfilled' ? results[i].value.data : fallback);
      const campus = val(0, null);
      const mine = val(1, { tasks: [] });
      const me = val(2, null);
      if (!campus || !me) throw new Error('Could not load dashboard');
      setStats(campus);
      setTasks(mine.tasks || []);
      setGaps(val(3, { gaps: [] }).gaps || []);
      setLeaders(val(4, { top: [] }).top || []);
      setRecommended(val(5, { tasks: [] }).tasks || []);
      const cf = val(6, null);
      if (cf) setCert(cf);
      localStorage.setItem('mvm_user', JSON.stringify(me.user));
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Could not load dashboard');
    }
  };

  useEffect(() => { load(); }, []);

  if (!stats) return <LoadingSpinner />;

  const pending = tasks.filter(t => t.status === 'PENDING_REVIEW');
  const active = tasks.find(t => t.status === 'IN-PROGRESS');
  const complete = tasks.filter(t => t.status === 'COMPLETED');
  const organizer = user.role === 'organizer';

  const claim = async id => {
    try { await api.patch(`/tasks/${id}/claim`); await load(); }
    catch (e) { setError(e.response?.data?.message || 'Could not claim task'); }
  };

  const shareImpact = () => {
    if (!cert) return;
    const text = `I volunteered ${cert.completedTasks} tasks (${cert.impactMinutes} mins) via Micro-Volunteer Match! Top: ${(cert.topSkills || []).join(', ') || 'campus help'} #CampusImpact`;
    if (navigator.share) navigator.share({ title: 'My Campus Impact', text }).catch(() => {});
    else { navigator.clipboard?.writeText(text); alert('Impact text copied! Paste on LinkedIn/WhatsApp.'); }
  };

  const printCert = () => window.print();

  return (
    <>
      <ImpactCounter stats={stats} />
      {error && <ErrorMessage>{error}</ErrorMessage>}

      <div className="stats-grid">
        {organizer ? (
          <>
            <StatCard label="Posted tasks" value={tasks.length} icon={ListChecks} />
            <StatCard label="Open tasks" value={tasks.filter(t => t.status === 'OPEN').length} />
            <StatCard label="Needs review" value={pending.length} icon={ClipboardCheck} />
            <StatCard label="Minutes generated" value={complete.reduce((n, t) => n + t.estimatedMinutes, 0)} icon={Timer} />
          </>
        ) : (
          <>
            <StatCard label="Tasks completed" value={user.completedTasks ?? 0} icon={ClipboardCheck} />
            <StatCard label="Your impact minutes" value={user.impactMinutes ?? 0} icon={Timer} />
            <StatCard label="Rating" value={user.ratingAvg ? `★${user.ratingAvg}` : 'New'} icon={Sparkles} />
            <StatCard label="Top match" value={recommended[0] ? `${recommended[0].match?.score || 0}%` : '—'} icon={Sparkles} />
          </>
        )}
      </div>

      {organizer && pending.length > 0 && (
        <>
          <div className="section-title"><div><p className="eyebrow">NEEDS REVIEW</p><h2>Approve proof to award minutes</h2></div></div>
          <div className="tasks-grid">{pending.slice(0, 3).map(t => <TaskCard key={t._id} task={t} showMatch={false} />)}</div>
        </>
      )}

      {!organizer && (
        <>
          <div className="section-title">
            <div><p className="eyebrow">RECOMMENDED FOR YOU</p><h2>Tasks matched to your services</h2></div>
            <Link className="button" to="/tasks">View all <ArrowRight /></Link>
          </div>
          {recommended.length ? (
            <div className="tasks-grid">{recommended.slice(0, 3).map(t => <TaskCard key={t._id} task={t} onClaim={claim} />)}</div>
          ) : (
            <div className="empty"><Sparkles /><h3>No recommendations yet</h3><p>Select services in your <Link to="/profile">profile</Link>.</p></div>
          )}
          {cert && cert.completedTasks > 0 && (
            <div className="cert-banner">
              <span>🏆 {cert.completedTasks} tasks · {cert.impactMinutes} mins · Top: {(cert.topSkills || []).join(', ') || '—'}</span>
              <span className="cert-actions">
                <button className="button ghost small" onClick={shareImpact}><Share2 /> Share impact</button>
                <button className="button ghost small" onClick={printCert}>Print certificate</button>
              </span>
            </div>
          )}
        </>
      )}

      <div className="section-title">
        <div><p className="eyebrow">{organizer ? 'TASK OVERSIGHT' : 'YOUR JOURNEY'}</p><h2>{active && !organizer ? 'Your current mission' : organizer ? 'Your posted tasks' : 'Recent activity'}</h2></div>
        {organizer && <Link className="button" to="/post-task"><PlusCircle /> Post a task</Link>}
        {!organizer && !active && <Link className="button" to="/tasks">Find a task</Link>}
      </div>

      {active && !organizer ? <TaskCard task={active} /> : tasks.length ? (
        <div className="tasks-grid">{tasks.slice(0, 3).map(t => <TaskCard task={t} key={t._id} showMatch={false} />)}</div>
      ) : (
        <EmptyState title="No activity yet" hint={organizer ? 'Post your first 10-minute task.' : 'Claim a recommended task above.'} />
      )}

      <div className="two-col">
        <section className="skills">
          <p className="eyebrow">DEMAND vs SUPPLY</p>
          <h3>Where help is needed most</h3>
          {gaps.slice(0, 5).map(g => (
            <div key={g.category} className="bar-row"><span>{g.category}: {g.open} open / {g.volunteers} volunteers</span><div className="bar"><div style={{ width: `${g.open ? Math.min(100, (g.open / Math.max(1, g.volunteers)) * 50) : 4}%` }} /></div></div>
          ))}
          {organizer && <p className="hint"><Flame /> Post in high-gap categories to get faster pickups.</p>}
        </section>
        <section className="skills">
          <p className="eyebrow">LEADERBOARD</p>
          <h3><Trophy /> Top volunteers</h3>
          {(leaders || []).slice(0, 5).map((u, i) => (
            <p key={u._id} className="leader-row">{i + 1}. {u.name} · {u.impactMinutes} mins {u.ratingAvg ? `★${u.ratingAvg}` : ''}</p>
          ))}
        </section>
      </div>
    </>
  );
}
