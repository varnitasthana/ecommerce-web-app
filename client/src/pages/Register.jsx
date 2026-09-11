import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import api from '../services/api';
import Button from '../components/Button';

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', agreeToTerms: false });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Name is required';
    if (!form.email.trim()) next.email = 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Enter a valid email';
    if (!form.password) next.password = 'Password is required';
    if (form.password.length < 8) next.password = 'At least 8 characters required';
    if (!/[A-Z]/.test(form.password)) next.password = 'Include at least one uppercase letter';
    if (!/[a-z]/.test(form.password)) next.password = 'Include at least one lowercase letter';
    if (!/[0-9]/.test(form.password)) next.password = 'Include at least one number';
    if (form.password !== form.confirmPassword) next.confirmPassword = 'Passwords do not match';
    if (!form.agreeToTerms) next.agreeToTerms = 'You must agree to continue';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setMessageType('');

    if (!validate()) return;

    setSubmitting(true);
    try {
      await api.post('/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password
      });

      setMessage('Account created! Redirecting to sign in...');
      setMessageType('success');
      setTimeout(() => navigate('/login?registered=true'), 1200);
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || 'Registration failed');
      setMessageType('error');
      setSubmitting(false);
    }
  };

  return (
    <section className="page-block auth-page">
      <div className="auth-box">
        <h2>Create account</h2>
        <p className="muted" style={{ marginBottom: '1.5rem' }}>Join ShopEase and start shopping</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">Full name</label>
            <input
              id="name"
              type="text"
              name="name"
              placeholder="Your full name"
              value={form.name}
              onChange={handleChange}
              required
              autoComplete="name"
            />
            {errors.name && <small className="form-error">{errors.name}</small>}
          </div>

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
            {errors.email && <small className="form-error">{errors.email}</small>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-field-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Create a password"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="new-password"
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
            {errors.password && <small className="form-error">{errors.password}</small>}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm password</label>
            <input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              name="confirmPassword"
              placeholder="Re-enter your password"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />
            {errors.confirmPassword && <small className="form-error">{errors.confirmPassword}</small>}
          </div>

          <div className="form-group">
            <label className="form-checkbox-label">
              <input
                type="checkbox"
                name="agreeToTerms"
                checked={form.agreeToTerms}
                onChange={handleChange}
              />
              <span>I agree to the <Link to="/terms" className="auth-link">Terms & Conditions</Link> and <Link to="/privacy" className="auth-link">Privacy Policy</Link></span>
            </label>
            {errors.agreeToTerms && <small className="form-error">{errors.agreeToTerms}</small>}
          </div>

          <Button type="submit" size="lg" disabled={submitting} style={{ width: '100%' }}>
            {submitting ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>

        {message && (
          <div className={`form-message ${messageType === 'success' ? 'success' : 'error'}`} style={{ marginTop: '1rem' }}>
            {message}
          </div>
        )}

        <p className="auth-footer-text" style={{ textAlign: 'center', marginTop: '1.25rem' }}>
          Already have an account? <Link to="/login" className="auth-link">Sign in</Link>
        </p>
      </div>
    </section>
  );
}

export default Register;
