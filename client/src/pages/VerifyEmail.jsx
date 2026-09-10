import { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/Button';

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link.');
        return;
      }

      try {
        await api.get(`/auth/tokens/verify-email/${token}`);
        setStatus('success');
        setMessage('Your email has been verified successfully!');
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Verification failed. The link may have expired.');
      }
    };

    verify();
  }, [token]);

  return (
    <section className="page-block auth-page">
      <div className="auth-box text-center">
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
          {status === 'loading' ? '⏳' : status === 'success' ? '✅' : '❌'}
        </div>
        <h2 style={{ margin: '0 0 0.5rem' }}>
          {status === 'loading' ? 'Verifying your email...' : status === 'success' ? 'Email verified!' : 'Verification failed'}
        </h2>
        <p className="muted" style={{ marginBottom: '1.5rem' }}>{message}</p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {status === 'success' && (
            <Button to="/login" size="lg">Continue to Login</Button>
          )}
          {status === 'error' && (
            <>
              <Button to="/login" size="lg">Go to Login</Button>
              <Button to="/register" variant="secondary" size="lg">Create New Account</Button>
            </>
          )}
          {status === 'loading' && <Button size="lg" disabled>Please wait...</Button>}
        </div>
      </div>
    </section>
  );
}

export default VerifyEmail;
