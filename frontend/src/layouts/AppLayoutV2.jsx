import { Link, NavLink, useNavigate } from 'react-router-dom';
import { HeartHandshake, LayoutDashboard, ListTodo, UserRound, PlusCircle, LogOut, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = user?.role === 'organizer'
    ? [['/dashboard', 'Dashboard', LayoutDashboard], ['/post-task', 'Post a task', PlusCircle], ['/tasks', 'Task board', ListTodo], ['/profile', 'Profile', UserRound]]
    : [['/dashboard', 'Dashboard', LayoutDashboard], ['/tasks', 'Find tasks', ListTodo], ['/profile', 'My impact', UserRound]];
  return <div className="premium-app-shell">
    <header className="app-topbar"><Link className="premium-brand" to="/dashboard"><span className="brand-mark"><HeartHandshake /></span><span>Micro<span>Volunteer</span></span></Link><nav>{links.map(([to, label, Icon]) => <NavLink key={to} to={to}><Icon />{label}</NavLink>)}</nav><div className="topbar-user"><div className="app-avatar">{user?.name?.[0]}</div><div className="topbar-name"><b>{user?.name}</b><small>{user?.role === 'organizer' ? 'Organizer' : 'Student volunteer'}</small></div><button className="icon-button" onClick={() => { logout(); navigate('/'); }} aria-label="Sign out"><LogOut /></button></div></header>
    <div className="app-content"><div className="app-heading"><div><span className="app-kicker">MICRO-VOLUNTEER MATCH</span><h1>{user?.role === 'organizer' ? 'Make campus move.' : 'Make your minutes matter.'}</h1><p>{user?.role === 'organizer' ? 'Turn small needs into opportunities for your community.' : 'Your skills can make someone’s day.'}</p></div><Link className="app-help-link" to="/tasks">Explore opportunities <ArrowUpRight /></Link></div>{children}</div>
    <nav className="mobile-app-nav">{links.map(([to, label, Icon]) => <NavLink key={to} to={to}><Icon /><span>{label}</span></NavLink>)}</nav>
  </div>;
}
