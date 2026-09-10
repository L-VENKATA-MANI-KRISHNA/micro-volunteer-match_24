import { useEffect, useState } from 'react';
import { Search, SlidersHorizontal, X, BellPlus } from 'lucide-react';
import api from '../services/api';
import { ErrorMessage, LoadingSpinner, TaskCard } from '../components/UIV2';
import { categories, catalog, difficulties } from '../data/catalog';

const EMPTY = { category: '', service: '', location: '', status: 'OPEN', difficulty: '', search: '', duration: '', remote: '', minMatch: '', urgency: '', beginnerFriendly: '' };

export default function TaskBoard() {
  const [tasks, setTasks] = useState([]);
  const [filters, setFilters] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [alertMsg, setAlertMsg] = useState('');

  const load = async current => {
    setLoading(true);
    try {
      const params = { ...current };
      if (params.duration === '10') { params.minMinutes = 10; params.maxMinutes = 10; }
      if (params.duration === '15') { params.minMinutes = 15; params.maxMinutes = 15; }
      delete params.duration;
      const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== ''));
      const { data } = await api.get('/tasks', { params: clean });
      let list = data.tasks;
      if (current.minMatch) list = list.filter(t => (t.match?.score ?? 0) >= Number(current.minMatch));
      setTasks(list);
      setError('');
    } catch (e) {
      setError(e.response?.data?.message || 'Could not load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => load(filters), 200);
    return () => clearTimeout(timer);
  }, [filters]);

  const claim = async id => {
    try {
      await api.patch(`/tasks/${id}/claim`);
      load(filters);
    } catch (e) {
      setError(e.response?.data?.message || 'Could not claim that task');
    }
  };

  const saveAlert = async () => {
    try {
      await api.post('/stats/alerts', { category: filters.category, service: filters.service, minMatch: Number(filters.minMatch) || 80 });
      setAlertMsg('Alert saved! High matches will boost in recommendations.');
      setTimeout(() => setAlertMsg(''), 3000);
    } catch {
      setError('Could not save alert');
    }
  };

  const set = (k, v) => setFilters(f => ({ ...f, [k]: v }));
  const activeCount = Object.entries(filters).filter(([k, v]) => v && k !== 'status').length;

  return (
    <>
      <section className="page-intro">
        <p className="eyebrow">MICRO-TASK BOARD</p>
        <h2>Find a moment. Make it count.</h2>
        <p>{tasks.length} open now. 🔥 Urgent ranks first. 🌱 = no portfolio needed.</p>
      </section>

      <div className="filters-wrap">
        <div className="filters">
          <SlidersHorizontal />
          <input value={filters.search} onChange={e => set('search', e.target.value)} placeholder="Search poster, Python..." />
          <select value={filters.category} onChange={e => setFilters({ ...filters, category: e.target.value, service: '' })}>
            <option value="">All categories</option>
            {categories.map(x => <option key={x}>{x}</option>)}
          </select>
          <select value={filters.service} onChange={e => set('service', e.target.value)}>
            <option value="">All services</option>
            {(filters.category ? catalog[filters.category] : Object.values(catalog).flat()).map(x => <option key={x}>{x}</option>)}
          </select>
          <select value={filters.difficulty} onChange={e => set('difficulty', e.target.value)}>
            <option value="">Any difficulty</option>
            {difficulties.map(x => <option key={x}>{x}</option>)}
          </select>
        </div>
        <div className="filters second">
          <select value={filters.duration} onChange={e => set('duration', e.target.value)}>
            <option value="">Any duration</option>
            <option value="10">10 minutes</option>
            <option value="15">15 minutes</option>
          </select>
          <select value={filters.remote} onChange={e => set('remote', e.target.value)}>
            <option value="">Remote + on-campus</option>
            <option value="true">Remote only</option>
            <option value="false">On-campus only</option>
          </select>
          <select value={filters.minMatch} onChange={e => set('minMatch', e.target.value)}>
            <option value="">Any match</option>
            <option value="80">80%+ match</option>
            <option value="50">50%+ match</option>
          </select>
          <select value={filters.urgency} onChange={e => set('urgency', e.target.value)}>
            <option value="">All urgency</option>
            <option value="Urgent">🔥 Urgent only</option>
            <option value="Normal">Normal only</option>
          </select>
          <select value={filters.beginnerFriendly} onChange={e => set('beginnerFriendly', e.target.value)}>
            <option value="">All levels</option>
            <option value="true">🌱 Beginner-friendly</option>
          </select>
          <input value={filters.location} onChange={e => set('location', e.target.value)} placeholder="Location" />
          {activeCount > 0 && (
            <>
              <button type="button" className="button ghost small" onClick={() => setFilters(EMPTY)}><X /> Clear ({activeCount})</button>
              <button type="button" className="button ghost small" onClick={saveAlert}><BellPlus /> Alert me</button>
            </>
          )}
        </div>
      </div>
      {alertMsg && <p className="success">{alertMsg}</p>}

      {error && <ErrorMessage>{error}</ErrorMessage>}
      {loading ? <LoadingSpinner /> : tasks.length ? (
        <div className="tasks-grid">{tasks.map(task => <TaskCard key={task._id} task={task} onClaim={claim} />)}</div>
      ) : (
        <div className="empty"><Search /><h3>No tasks match those filters</h3><p>Try another service, or save an alert to get notified.</p></div>
      )}
    </>
  );
}
