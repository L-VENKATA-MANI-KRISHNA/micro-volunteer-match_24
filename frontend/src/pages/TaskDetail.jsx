import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Clock, MapPin, Wifi, CalendarClock, ArrowLeft, Gauge, Users, Copy, Star, MessageCircle, Download } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner, StatusBadge, ErrorMessage, MatchScore, MatchBreakdown, DifficultyBadge, UrgencyBadge, downloadICS } from '../components/UIV2';
import { categoryIcons } from '../data/catalog';

export default function TaskDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [task, setTask] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [proofUrl, setProofUrl] = useState('');
  const [proofNote, setProofNote] = useState('');
  const [comment, setComment] = useState('');
  const [score, setScore] = useState(5);

  const reload = () => api.get(`/tasks/${id}`).then(r => setTask(r.data.task)).catch(e => setError(e.response?.data?.message || 'Task not found'));
  useEffect(() => { reload(); }, [id]);

  const act = async (fn, okMsg) => {
    setBusy(true); setError('');
    try { await fn(); await reload(); } catch (e) { setError(e.response?.data?.message || okMsg || 'Action failed'); } finally { setBusy(false); }
  };

  if (error && !task) return <ErrorMessage>{error}</ErrorMessage>;
  if (!task) return <LoadingSpinner />;

  const isStudent = user?.role === 'student';
  const isOrganizer = user?.role === 'organizer' && String(task.organizer?._id || task.organizer) === String(user?._id);
  const myId = String(user?._id);
  const iVolunteer = (task.volunteers || []).some(v => String(v._id || v) === myId) || String(task.volunteer?._id || task.volunteer) === myId;
  const canClaim = isStudent && ['OPEN', 'IN-PROGRESS'].includes(task.status) && !iVolunteer && (task.slotsLeft ?? 1) > 0;
  const canSubmit = isStudent && iVolunteer && task.status === 'IN-PROGRESS';
  const canRate = task.status === 'COMPLETED' && (isOrganizer || iVolunteer);

  return (
    <section className="task-detail">
      <button className="button ghost" onClick={() => nav(-1)}><ArrowLeft /> Back</button>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      <div className="detail-card">
        <div className="card-top">
          <span className="category">{categoryIcons[task.category] || ''} {task.category}</span>
          <span className="badges-right"><UrgencyBadge urgency={task.urgency} /><StatusBadge status={task.status} /></span>
        </div>
        <h2>{task.title}</h2>
        <p className="lead">{task.description}</p>

        <div className="detail-grid">
          <span><b>Service</b><br />{task.service}</span>
          <span><b><Clock /> Duration</b><br />{task.estimatedMinutes} mins</span>
          <span><b>Location</b><br />{task.isRemote ? <><Wifi /> Remote ({task.location})</> : <><MapPin /> {task.location}</>}</span>
          <span><b><Gauge /> Level</b><br /><DifficultyBadge level={task.difficulty} /> {task.beginnerFriendly && '🌱'}</span>
          <span><b><CalendarClock /> Preferred</b><br />{task.preferredTime ? new Date(task.preferredTime).toLocaleString() : 'Flexible'}</span>
          <span><b>Deadline</b><br />{task.deadline ? new Date(task.deadline).toLocaleString() : '—'}</span>
          <span><b><Users /> Team</b><br />{(task.volunteers?.length || (task.volunteer ? 1 : 0))}/{task.slotsTotal || 1} {task.volunteers?.map(v => v.name).join(', ')}</span>
          <span><b>Organizer</b><br />{task.organizer?.name} {task.organizer?.ratingAvg ? `★${task.organizer.ratingAvg}` : ''}</span>
        </div>

        {task.match && isStudent && <div className="detail-match"><MatchScore match={task.match} /><MatchBreakdown match={task.match} /></div>}

        {(task.preferredTime || task.deadline) && (
          <button className="button ghost small" onClick={() => downloadICS(task)}><Download /> Add to Calendar (.ics)</button>
        )}

        {task.requiresApproval && <p className="hint">🛡️ Requires organizer approval — submit proof after finishing.</p>}
        {task.proofUrl && <p className="hint">Proof: <a href={task.proofUrl} target="_blank" rel="noreferrer">{task.proofUrl}</a> {task.proofNote ? `— ${task.proofNote}` : ''}</p>}
        {(task.volunteerRating || task.organizerRating) && (
          <p className="hint">Ratings: {task.volunteerRating ? `Volunteer ★${task.volunteerRating}` : ''} {task.organizerRating ? `· Organizer ★${task.organizerRating}` : ''}</p>
        )}

        <div className="detail-actions">
          {canClaim && <button className="wide" disabled={busy} onClick={() => act(() => api.patch(`/tasks/${id}/claim`), 'Could not claim')}>{`Accept task · ${task.estimatedMinutes} mins`}</button>}
          {isStudent && !iVolunteer && task.status !== 'COMPLETED' && <button className="button ghost" disabled={busy} onClick={() => act(() => api.post(`/tasks/${id}/request`))}>Request to join</button>}
          {canSubmit && <button className="wide" disabled={busy} onClick={() => act(() => api.patch(`/tasks/${id}/complete`))}>Mark complete (no approval)</button>}
          {isOrganizer && task.status === 'PENDING_REVIEW' && (
            <>
              <button disabled={busy} onClick={() => act(() => api.patch(`/tasks/${id}/approve`))}>✓ Approve + award minutes</button>
              <button className="button ghost" disabled={busy} onClick={() => act(() => api.patch(`/tasks/${id}/reject`))}>Ask for rework</button>
            </>
          )}
          {isOrganizer && task.status === 'IN-PROGRESS' && <button disabled={busy} onClick={() => act(() => api.patch(`/tasks/${id}/approve`))}>Mark verified complete</button>}
          {isOrganizer && <button className="button ghost" disabled={busy} onClick={() => act(() => api.post(`/tasks/${id}/clone`))}><Copy /> Clone task</button>}
        </div>

        {canSubmit && task.requiresApproval && (
          <div className="proof-box">
            <h4>Submit proof of work</h4>
            <input value={proofUrl} onChange={e => setProofUrl(e.target.value)} placeholder="Link to poster / reel / doc (https://...)" />
            <textarea rows="2" value={proofNote} onChange={e => setProofNote(e.target.value)} placeholder="What did you do? (optional note)" />
            <button disabled={busy} onClick={() => act(() => api.patch(`/tasks/${id}/submit`, { proofUrl, proofNote }))}>Submit for approval</button>
          </div>
        )}

        {canRate && (
          <div className="proof-box">
            <h4><Star /> Rate this collaboration</h4>
            <div className="portfolio-row">
              <select value={score} onChange={e => setScore(Number(e.target.value))}>{[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} stars</option>)}</select>
              <button disabled={busy} onClick={() => act(() => api.post(`/tasks/${id}/rate`, { score }))}>Submit rating</button>
            </div>
          </div>
        )}

        {isOrganizer && task.applicants?.length > 0 && (
          <div className="proof-box">
            <h4>Applicants ({task.applicants.length})</h4>
            {task.applicants.map(a => (
              <div key={a._id} className="portfolio-row"><span>{a.name} · {a.email}</span><button disabled={busy} onClick={() => act(() => api.post(`/tasks/${id}/pick`, { userId: a._id }))}>Pick</button></div>
            ))}
          </div>
        )}

        <div className="proof-box">
          <h4><MessageCircle /> Questions & coordination ({task.comments?.length || 0})</h4>
          {(task.comments || []).map(c => (
            <p key={c._id} className="comment"><b>{c.user?.name || 'User'}:</b> {c.text}</p>
          ))}
          <div className="portfolio-row">
            <input value={comment} onChange={e => setComment(e.target.value)} placeholder="Ask about files, venue, time..." maxLength={500} />
            <button disabled={busy || !comment.trim()} onClick={() => act(() => api.post(`/tasks/${id}/comments`, { text: comment }).then(() => setComment('')))}>Send</button>
          </div>
        </div>

        <p className="muted">Posted {task.createdAt ? new Date(task.createdAt).toLocaleDateString() : ''} · <Link to="/tasks">More tasks</Link></p>
      </div>
    </section>
  );
}
