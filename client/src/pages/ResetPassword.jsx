import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/Button';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [validToken, setValidToken] = useState(true);

  useEffect(() => {
    if (!token) {
      setValidToken(false);
      setMessage('Invalid or expired reset link.');
      setMessageType('error');
    }
  }, [token]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setMessageType('');

    if (form.password.length < 8) {
      setMessage('Password must be at least 8 characters.');
      setMessageType('error');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setMessage('Passwords do not match.');
      setMessageType('error');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/auth/tokens/reset-password', { token, password: form.password });
      setMessage('Password reset successfully! Redirecting to login...');
      setMessageType('success');
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to reset password. The link may have expired.');
      setMessageType('error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!validToken) {
    return (
      <section className="page-block auth-page">
        <div className="auth-box text-center">
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔗</div>
          <h2 style={{ margin: '0 0 0.5rem' }}>Invalid or expired link</h2>
          <p className="muted" style={{ marginBottom: '1.5rem' }}>
            This password reset link is invalid or has expired.
          </p>
          <Button to="/forgot-password" size="lg">Request New Link</Button>
        </div>
      </section>
    );
  }

  return (
    <section className="page-block auth-page">
      <div className="auth-box">
        <h2>Set a new password</h2>
        <p className="muted" style={{ marginBottom: '1.5rem' }}>
          Create a strong password that you haven't used before.
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="password">New password</label>
            <input
              id="password"
              type="password"
              placeholder="At least 8 characters"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm new password</label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="Repeat your new password"
              value={form.confirmPassword}
              onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>

          <Button type="submit" size="lg" disabled={submitting} style={{ width: '100%' }}>
            {submitting ? 'Resetting...' : 'Reset Password'}
          </Button>
        </form>

        {message && (
          <div className={`form-message ${messageType === 'success' ? 'success' : 'error'}`} style={{ marginTop: '1rem' }}>
            {message}
          </div>
        )}
      </div>
    </section>
  );
}

export default ResetPassword;
