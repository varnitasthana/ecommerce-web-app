import { useState, useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/Button';

const ACCOUNT_NAV = [
  { path: '/account', label: 'Overview', icon: '🏠', exact: true },
  { path: '/account/orders', label: 'Your Orders', icon: '📦' },
  { path: '/account/wishlist', label: 'Wishlist', icon: '❤️' },
  { path: '/account/addresses', label: 'Addresses', icon: '📍' },
  { path: '/account/returns', label: 'Returns & Refunds', icon: '↩️' },
  { path: '/account/settings', label: 'Account Settings', icon: '⚙️' }
];

function AccountLayout() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get('/auth/me');
        setUser(data.user || data);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const isActive = (path, exact) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  if (loading) {
    return (
      <section className="page-block">
        <div className="loading-grid">
          {[1, 2, 3].map((item) => <div className="skeleton-card" key={item} />)}
        </div>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="page-block auth-page">
        <div className="auth-box text-center">
          <h2>Sign in to your account</h2>
          <p className="muted" style={{ marginBottom: '1.5rem' }}>Access your orders, wishlist, and account settings.</p>
          <Button to="/login" size="lg">Sign In</Button>
        </div>
      </section>
    );
  }

  return (
    <section className="page-block account-page">
      <div className="account-container">
        {/* SIDEBAR */}
        <aside className="account-sidebar">
          <div className="account-profile">
            <div className="account-avatar">
              {user.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="account-profile-info">
              <h3>{user.name}</h3>
              <p className="muted">{user.email}</p>
              <span className="account-role-badge">{user.role}</span>
            </div>
          </div>
          <nav className="account-nav">
            {ACCOUNT_NAV.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={isActive(item.path, item.exact) ? 'account-nav-item active' : 'account-nav-item'}
              >
                <span className="account-nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* MAIN CONTENT */}
        <div className="account-content">
          <Outlet />
        </div>
      </div>
    </section>
  );
}

export default AccountLayout;
