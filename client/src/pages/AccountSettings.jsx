import { useState } from 'react';
import api from '../services/api';
import Button from '../components/Button';

function AccountSettings() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useState(() => {
    api.get('/auth/me').then(({ data }) => {
      const user = data.user || data;
      setName(user.name || '');
      setEmail(user.email || '');
    }).catch(() => {});
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      await api.put('/users/profile', { name });
      setMessage('Profile updated successfully');
      setMessageType('success');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to update profile');
      setMessageType('error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      await api.post('/auth/tokens/change-password', { currentPassword, newPassword });
      setMessage('Password changed successfully');
      setMessageType('success');
      setCurrentPassword('');
      setNewPassword('');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to change password');
      setMessageType('error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="account-settings">
      <h2>Account Settings</h2>

      {message && (
        <div className={`form-message ${messageType === 'success' ? 'success' : 'error'}`} style={{ marginBottom: '1.5rem' }}>
          {message}
        </div>
      )}

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ margin: '0 0 1rem' }}>Profile Information</h3>
        <form onSubmit={handleUpdateProfile} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input id="name" value={name} onChange={(e) => setName(e.target.value)} className="form-input" required />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input id="email" value={email} disabled className="form-input" style={{ opacity: 0.7, cursor: 'not-allowed' }} />
          </div>
          <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save Changes'}</Button>
        </form>
      </div>

      <div className="card">
        <h3 style={{ margin: '0 0 1rem' }}>Change Password</h3>
        <form onSubmit={handleChangePassword} className="auth-form">
          <div className="form-group">
            <label htmlFor="currentPassword">Current Password</label>
            <input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="form-input" required />
          </div>
          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="form-input" required minLength={8} />
          </div>
          <Button type="submit" disabled={submitting}>{submitting ? 'Updating...' : 'Update Password'}</Button>
        </form>
      </div>
    </div>
  );
}

export default AccountSettings;
