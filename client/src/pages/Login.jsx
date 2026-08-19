import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/useAuth';

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const { data } = await api.post('/auth/login', form);

      login(data);
      setMessage('Login successful');
      navigate('/');
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || 'Login failed');
    }
  };

  return (
    <section className="page-block auth-page">
      <div className="auth-box">
        <h2>Login</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
          />
          <button type="submit">Login</button>
        </form>
        {message && <p className="form-message">{message}</p>}
        <p>
          New here? <Link to="/register">Create account</Link>
        </p>
      </div>
    </section>
  );
}

export default Login;
