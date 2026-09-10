import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/Button';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setMessageType('');
    setSubmitting(true);

    try {
      await api.post('/auth/tokens/forgot-password', { email });
      setMessage('If an account with that email exists, we have sent a password reset link.');
      setMessageType('success');
      setEmail('');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to process request. Please try again.');
      setMessageType('error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="page-block auth-page">
      <div className="auth-box">
        <h2>Reset your password</h2>
        <p className="muted" style={{ marginBottom: '1.5rem' }}>
          Enter the email address associated with your account and we'll send you a link to reset your password.
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <Button type="submit" size="lg" disabled={submitting} style={{ width: '100%' }}>
            {submitting ? 'Sending...' : 'Send Reset Link'}
          </Button>
        </form>

        {message && (
          <div className={`form-message ${messageType === 'success' ? 'success' : 'error'}`} style={{ marginTop: '1rem' }}>
            {message}
          </div>
        )}

        <p className="auth-footer-text">
          Remember your password? <Link to="/login" className="auth-link">Sign in</Link>
        </p>
      </div>
    </section>
  );
}

export default ForgotPassword;
