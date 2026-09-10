import { useState } from 'react';
import { X, Pencil, Check, Loader } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function EditProfileModal({ onClose }) {
  const { user, save } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setError('Name cannot be empty');
    setSaving(true); setError(''); setOk('');
    try {
      const { data } = await api.patch('/auth/me', { name: name.trim() });
      const token = localStorage.getItem('mvm_token');
      save({ token, user: data.user });
      setOk('Profile updated!');
      setTimeout(() => onClose(), 900);
    } catch (e) {
      setError(e.response?.data?.message || 'Could not update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card">
        <div className="modal-header">
          <div className="modal-title-row">
            <div className="modal-icon-wrap"><Pencil /></div>
            <div>
              <h2>Edit Profile</h2>
              <p>Update your display name and info</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close"><X /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {/* Avatar preview */}
          <div className="modal-avatar-row">
            <div className="modal-avatar">{name?.[0]?.toUpperCase() || user?.name?.[0]}</div>
            <div className="modal-avatar-info">
              <strong>{name || user?.name}</strong>
              <small>{user?.email}</small>
              <span className="role-chip">{user?.role === 'organizer' ? '🏢 Organizer' : '🎓 Student Volunteer'}</span>
            </div>
          </div>

          <div className="modal-field">
            <label htmlFor="edit-name">Display Name</label>
            <input
              id="edit-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your full name"
              maxLength={60}
              autoFocus
            />
          </div>

          <div className="modal-field">
            <label htmlFor="edit-email">Email</label>
            <input
              id="edit-email"
              type="email"
              value={user?.email || ''}
              disabled
              style={{ opacity: 0.6, cursor: 'not-allowed' }}
            />
            <small style={{ color: '#8aa398', marginTop: 4, display: 'block' }}>Email cannot be changed</small>
          </div>

          <div className="modal-field">
            <label>Role</label>
            <div className="role-display">
              {user?.role === 'organizer' ? '🏢 Club Organizer' : '🎓 Student Volunteer'}
            </div>
          </div>

          {error && <p className="modal-error">{error}</p>}
          {ok && <p className="modal-ok"><Check /> {ok}</p>}

          <div className="modal-footer">
            <button type="button" className="button ghost" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" disabled={saving || !name.trim()}>
              {saving ? <><Loader className="spin" /> Saving...</> : <><Check /> Save changes</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
