import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { HeartHandshake, LayoutDashboard, ListTodo, UserRound, PlusCircle, LogOut, ArrowUpRight, Pencil, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import EditProfileModal from '../components/EditProfileModal';

export default function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropOpen, setDropOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const dropRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const links = user?.role === 'organizer'
    ? [['/dashboard', 'Dashboard', LayoutDashboard], ['/post-task', 'Post a task', PlusCircle], ['/tasks', 'Task board', ListTodo], ['/profile', 'Profile', UserRound]]
    : [['/dashboard', 'Dashboard', LayoutDashboard], ['/tasks', 'Find tasks', ListTodo], ['/profile', 'My impact', UserRound]];

  return (
    <div className="premium-app-shell">
      <header className="app-topbar">
        <Link className="premium-brand" to="/dashboard">
          <span className="brand-mark" style={{ backgroundColor: '#625cf2', color: '#fff' }}><HeartHandshake /></span>
          <span>Micro<span>Volunteer</span></span>
        </Link>
        <nav>
          {links.map(([to, label, Icon]) => (
            <NavLink key={to} to={to}><Icon />{label}</NavLink>
          ))}
        </nav>

        {/* User area with dropdown */}
        <div className="topbar-user-area" ref={dropRef}>
          <button
            className="topbar-user-btn"
            onClick={() => setDropOpen(o => !o)}
            aria-label="Open user menu"
          >
            <div className="app-avatar-wrap">
              <div className="app-avatar">{user?.name?.[0]?.toUpperCase()}</div>
              <span className="avatar-edit-badge"><Pencil /></span>
            </div>
            <div className="topbar-name">
              <b><HeartHandshake className="name-handshake" /> {user?.name}</b>
              <small>{user?.role === 'organizer' ? 'Organizer' : 'Student volunteer'}</small>
            </div>
            <ChevronDown className={`chevron-icon ${dropOpen ? 'open' : ''}`} />
          </button>

          {dropOpen && (
            <div className="user-dropdown">
              <div className="dropdown-header">
                <div className="dropdown-avatar">{user?.name?.[0]?.toUpperCase()}</div>
                <div>
                  <strong>{user?.name}</strong>
                  <small>{user?.email}</small>
                </div>
              </div>
              <div className="dropdown-divider" />
              <button className="dropdown-item" onClick={() => { setDropOpen(false); setEditOpen(true); }}>
                <Pencil /> Edit Profile
              </button>
              <Link className="dropdown-item" to="/profile" onClick={() => setDropOpen(false)}>
                <UserRound /> View Profile
              </Link>
              <div className="dropdown-divider" />
              <button className="dropdown-item danger" onClick={() => { setDropOpen(false); logout(); navigate('/'); }}>
                <LogOut /> Sign out
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="app-content">
        <div className="app-heading">
          <div>
            <span className="app-kicker">MICRO-VOLUNTEER MATCH</span>
            <h1>{user?.role === 'organizer' ? 'Make campus move.' : 'Make your minutes matter.'}</h1>
            <p>{user?.role === 'organizer' ? 'Turn small needs into opportunities for your community.' : "Your skills can make someone's day."}</p>
          </div>
          <Link className="app-help-link" to="/tasks">Explore opportunities <ArrowUpRight /></Link>
        </div>
        {children}
      </div>

      <nav className="mobile-app-nav">
        {links.map(([to, label, Icon]) => (
          <NavLink key={to} to={to}><Icon /><span>{label}</span></NavLink>
        ))}
      </nav>

      {editOpen && <EditProfileModal onClose={() => setEditOpen(false)} />}
    </div>
  );
}
