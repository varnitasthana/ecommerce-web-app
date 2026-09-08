import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import api from '../services/api';
import { useAuth } from '../context/useAuth';
import Button from '../components/Button';

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '', remember: false });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const registered = params.get('registered');
    if (registered) {
      setMessage('Account created! Please sign in.');
      setMessageType('success');
    }
  }, [location.search]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setMessageType('');
    setSubmitting(true);

    try {
      const { data } = await api.post('/auth/login', {
        email: form.email,
        password: form.password
      });

      login(data);
      navigate(location.state?.from || '/');
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || 'Login failed');
      setMessageType('error');
      setSubmitting(false);
    }
  };

  return (
    <section className="page-block auth-page">
      <div className="auth-box">
        <h2>Welcome back</h2>
        <p className="muted" style={{ marginBottom: '1.5rem' }}>Sign in to your ShopEase account</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-field-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle-btn"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <div className="form-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
            <label className="form-checkbox-label">
              <input
                type="checkbox"
                name="remember"
                checked={form.remember}
                onChange={handleChange}
              />
              <span>Remember me</span>
            </label>
            <Link to="/forgot-password" className="auth-link">Forgot password?</Link>
          </div>

          <Button type="submit" size="lg" disabled={submitting} style={{ width: '100%' }}>
            {submitting ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        {message && (
          <div className={`form-message ${messageType === 'success' ? 'success' : 'error'}`} style={{ marginTop: '1rem' }}>
            {message}
          </div>
        )}

        <p className="auth-footer-text">
          New here? <Link to="/register" className="auth-link">Create account</Link>
        </p>
      </div>
    </section>
  );
}

export default Login;
