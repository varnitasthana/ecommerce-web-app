import { useEffect, useMemo, useState, useCallback } from 'react';
import { BrowserRouter, Link, Navigate, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import OrderConfirmation from './pages/OrderConfirmation';
import Admin from './pages/Admin';
import Wishlist from './pages/Wishlist';
import Partner from './pages/Partner';
import Legal from './pages/Legal';
import Support from './pages/Support';
import SellerDashboard from './pages/SellerDashboard';
import Compare from './pages/Compare';
import SellerAnalytics from './pages/SellerAnalytics';
import Addresses from './pages/Addresses';
import Returns from './pages/Returns';
import Notifications from './pages/Notifications';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';
import ToastContainer from './components/Toast';
import { addToast } from './components/toastApi';
import api from './services/api';
import ErrorBoundary from './components/ErrorBoundary';
import SearchAutocomplete from './components/SearchAutocomplete';
import MegaMenu from './components/MegaMenu';
import MobileNav from './components/MobileNav';
import './Premium.css';
import './App.css';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);
  return null;
}

function ProtectedRoute({ children, adminOnly = false, roles = [] }) {
  const location = useLocation();
  const { user, loading } = useAuth();

  if (loading) return <div className="page-block">Checking your session...</div>;
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if ((adminOnly && user?.role !== 'admin') || (roles.length > 0 && !roles.includes(user?.role))) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <button
      className={`back-to-top ${visible ? 'visible' : ''}`}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Back to top"
      title="Back to top"
    >
      ↑
    </button>
  );
}

function Header({ cart, darkMode, toggleDarkMode }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [search, setSearch] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const submitSearch = (event) => {
    event.preventDefault();
    navigate(`/products${search.trim() ? `?search=${encodeURIComponent(search.trim())}` : ''}`);
    setSuggestions([]);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setShowProfileMenu(false);
    setMobileOpen(false);
  };

  useEffect(() => {
    if (!user) return;
    api.get('/notifications')
      .then(({ data }) => setUnreadNotifications(data.unreadCount || 0))
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    const handleNotificationsUpdated = () => {
      if (!user) return;
      api.get('/notifications')
        .then(({ data }) => setUnreadNotifications(data.unreadCount || 0))
        .catch(() => {});
    };
    window.addEventListener('notifications-updated', handleNotificationsUpdated);
    return () => window.removeEventListener('notifications-updated', handleNotificationsUpdated);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      api.get('/notifications')
        .then(({ data }) => setUnreadNotifications(data.unreadCount || 0))
        .catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <>
      {/* ANNOUNCEMENT BAR */}
      <div className="announcement">
        🎉 Free delivery on orders over ₹999 · ✓ Trusted brands · ↩️ Easy returns · 🔒 Secure checkout
      </div>

      {/* MAIN HEADER */}
      <header className="topbar glass-header">
        <div className="topbar-inner">
          {/* LOGO */}
          <Link className="brand" to="/">
            <span className="brand-mark">S</span>
            <span className="brand-text">ShopEase</span>
          </Link>

          {/* SEARCH BAR */}
          <div className="global-search">
            <SearchAutocomplete value={search} onChange={setSearch} onSelect={submitSearch} />
          </div>

          {/* DESKTOP ACTIONS */}
          <div className="topbar-actions">
            {user && (
              <button className="theme-toggle" onClick={() => navigate('/notifications')} aria-label="Notifications" title="Notifications">
                🔔
                {unreadNotifications > 0 && <span className="topbar-badge">{unreadNotifications > 9 ? '9+' : unreadNotifications}</span>}
              </button>
            )}
            <button className="theme-toggle" onClick={toggleDarkMode} aria-label="Toggle dark mode" title={darkMode ? 'Light mode' : 'Dark mode'}>
              {darkMode ? '☀️' : '🌙'}
            </button>
            <button className="mobile-menu-btn" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
              {mobileOpen ? '✕' : '☰'}
            </button>
            <div className="desktop-nav">
              <NavLink to="/products">🛒 Shop</NavLink>
              <NavLink to="/wishlist">❤️ Wishlist</NavLink>
              <NavLink to="/orders">📦 Orders</NavLink>
              <NavLink to="/cart">🛍️ Cart{cart.length > 0 ? ` (${cart.length})` : ''}</NavLink>
              {user?.role === 'admin' && (
                <NavLink to="/admin">⚙️ Admin</NavLink>
              )}
              {(user?.role === 'seller' || user?.role === 'admin') && (
                <NavLink to="/seller">📊 Seller</NavLink>
              )}
              <div className="desktop-auth">
                {user ? (
                  <div className="profile-dropdown">
                    <button className="nav-button" onClick={() => setShowProfileMenu(!showProfileMenu)}>
                      👤 {user.name || 'Account'}
                    </button>
                    {showProfileMenu && (
                      <div className="profile-dropdown">
                        <div className="profile-dropdown-header">
                          <p>{user.name}</p>
                          <small>{user.email}</small>
                        </div>
                        <div className="profile-dropdown-menu">
                          <NavLink to="/orders" onClick={() => setShowProfileMenu(false)}>📦 My Orders</NavLink>
                          <NavLink to="/wishlist" onClick={() => setShowProfileMenu(false)}>❤️ Wishlist</NavLink>
                          <NavLink to="/account/addresses" onClick={() => setShowProfileMenu(false)}>📍 Addresses</NavLink>
                          <NavLink to="/returns" onClick={() => setShowProfileMenu(false)}>↩️ Returns</NavLink>
                          <button onClick={handleLogout}>🚪 Sign Out</button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <NavLink to="/login" className="nav-button">🔐 Sign In</NavLink>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* CATEGORY BAR */}
      <div className="category-bar">
        <NavLink to="/products">🏠 All Products</NavLink>
        <NavLink to="/products?category=Electronics">💻 Electronics</NavLink>
        <NavLink to="/products?category=Fashion">👕 Fashion</NavLink>
        <NavLink to="/products?category=Home%20%26%20Kitchen">🏡 Home & Living</NavLink>
        <NavLink to="/products?category=Sports%20%26%20Fitness">⚽ Sports</NavLink>
        <Link to="/partner" style={{ marginLeft: 'auto', color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}>
          📈 Sell with Us
        </Link>
      </div>

      {/* MOBILE NAVIGATION */}
      {mobileOpen && (
        <div className="mobile-nav-overlay" onClick={() => setMobileOpen(false)}>
          <div className="mobile-nav-panel" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-nav-close">
              <button onClick={() => setMobileOpen(false)} style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>✕</button>
            </div>
            <div className="mobile-nav-links">
              <Link to="/products" onClick={() => setMobileOpen(false)}>🛒 Shop</Link>
              <Link to="/wishlist" onClick={() => setMobileOpen(false)}>❤️ Wishlist</Link>
              <Link to="/orders" onClick={() => setMobileOpen(false)}>📦 Orders</Link>
              <Link to="/cart" onClick={() => setMobileOpen(false)}>🛍️ Cart {cart.length > 0 && `(${cart.length})`}</Link>
              {user?.role === 'admin' && (
                <Link to="/admin" onClick={() => setMobileOpen(false)}>⚙️ Admin</Link>
              )}
              {(user?.role === 'seller' || user?.role === 'admin') && (
                <Link to="/seller" onClick={() => setMobileOpen(false)}>📊 Seller</Link>
              )}
              {user ? (
                <>
                  <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid var(--border)', margin: '0.5rem 0' }}>
                    <p style={{ margin: 0, fontWeight: 700, color: 'var(--text-primary)' }}>{user.name}</p>
                    <small style={{ color: 'var(--text-tertiary)' }}>{user.email}</small>
                  </div>
                  <button onClick={handleLogout} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>🚪 Sign Out</button>
                </>
              ) : (
                <Link to="/login" onClick={() => setMobileOpen(false)}>🔐 Sign In</Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function App() {
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cart') || '[]');
    } catch {
      return [];
    }
  });
  const [darkMode, setDarkMode] = useState(() => {
    try {
      return localStorage.getItem('darkMode') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('darkMode', String(darkMode));
    if (darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => !prev);
  }, []);

  const addToCart = (product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => (item._id || item.id) === (product._id || product.id));

      if (existing) {
        return prev.map((item) =>
          (item._id || item.id) === (product._id || product.id)
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      return [...prev, { ...product, quantity }];
    });
    addToast(`${product.name} added to cart`, 'success');
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((item) => (item._id || item.id) !== id));
  };

  const updateQuantity = (id, newQty) => {
    if (newQty <= 0) {
      removeFromCart(id);
      return;
    }

    setCart((prev) =>
      prev.map((item) => ((item._id || item.id) === id ? { ...item, quantity: newQty } : item))
    );
  };

  const clearCart = useCallback(() => setCart([]), []);

  const totalPrice = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  return (
    <BrowserRouter>
      <AuthProvider>
      <ErrorBoundary>
      <div className="app-shell">
        <ScrollToTop />
        <Header cart={cart} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

        <main>
          <Routes>
            <Route path="/" element={<Home addToCart={addToCart} />} />
            <Route path="/products" element={<Products addToCart={addToCart} />} />
            <Route path="/products/:id" element={<ProductDetails addToCart={addToCart} />} />
             <Route path="/login" element={<Login />} />
             <Route path="/register" element={<Register />} />
             <Route path="/forgot-password" element={<ForgotPassword />} />
             <Route path="/reset-password" element={<ResetPassword />} />
             <Route path="/verify-email" element={<VerifyEmail />} />
            <Route
              path="/cart"
              element={<Cart cart={cart} removeFromCart={removeFromCart} updateQuantity={updateQuantity} totalPrice={totalPrice} />}
            />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <Checkout cart={cart} totalPrice={totalPrice} clearCart={clearCart} />
                </ProtectedRoute>
              }
            />
            <Route path="/orders" element={<ProtectedRoute><Orders clearCart={clearCart} addToCart={addToCart} /></ProtectedRoute>} />
            <Route path="/orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
            <Route path="/order-confirmation" element={<ProtectedRoute><OrderConfirmation /></ProtectedRoute>} />
             <Route path="/wishlist" element={<ProtectedRoute><Wishlist addToCart={addToCart} /></ProtectedRoute>} />
             <Route path="/account/addresses" element={<ProtectedRoute><Addresses /></ProtectedRoute>} />
             <Route path="/returns" element={<ProtectedRoute><Returns /></ProtectedRoute>} />
             <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
             <Route path="/partner" element={<Partner />} />
             <Route path="/seller" element={<ProtectedRoute roles={['seller', 'admin']}><SellerDashboard /></ProtectedRoute>} />
             <Route path="/seller/analytics" element={<ProtectedRoute roles={['seller', 'admin']}><SellerAnalytics /></ProtectedRoute>} />
             <Route path="/compare" element={<Compare />} />
             <Route path="/support" element={<Support />} />
             <Route path="/privacy" element={<Legal type="privacy" />} />
             <Route path="/terms" element={<Legal type="terms" />} />
             <Route path="/admin" element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />
             <Route path="*" element={<Home addToCart={addToCart} />} />
          </Routes>
        </main>

        <footer className="footer">
          <div className="footer-grid">
            <div>
              <Link className="footer-brand" to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'inherit', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--primary)', fontSize: '1.3rem' }}>S</span>
                <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>ShopEase</span>
              </Link>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Your trusted online marketplace for quality products and amazing deals. Shop with confidence!</p>
              <div className="social-icons">
                <a href="#" className="social-icon">f</a>
                <a href="#" className="social-icon">𝕏</a>
                <a href="#" className="social-icon">📷</a>
              </div>
            </div>
            <div>
              <strong>🛒 Shop</strong>
              <Link to="/products">All Products</Link>
              <Link to="/products?category=Electronics">Electronics</Link>
              <Link to="/products?category=Fashion">Fashion</Link>
              <Link to="/products?category=Home%20%26%20Kitchen">Home & Living</Link>
              <Link to="/partner">Become a Seller</Link>
            </div>
            <div>
              <strong>💬 Help & Support</strong>
              <Link to="/support">Customer Support</Link>
              <Link to="/returns">Returns Policy</Link>
              <Link to="/orders">Track Order</Link>
              <Link to="/support" className="footer-link">FAQs</Link>
              <Link to="/support" className="footer-link">Contact Us</Link>
            </div>
            <div>
              <strong>📋 Policies</strong>
              <Link to="/privacy">Privacy Policy</Link>
              <Link to="/terms">Terms & Conditions</Link>
              <Link to="/privacy" className="footer-link">Secure Checkout</Link>
              <Link to="/terms" className="footer-link">Security & Trust</Link>
            </div>
          </div>

          {/* FOOTER BOTTOM */}
          <div className="footer-bottom-grid">
            <div>
              <div className="footer-bottom-item-title">✓ Verified Sellers</div>
              <div>100% authentic products from trusted brands</div>
            </div>
            <div>
              <div className="footer-bottom-item-title">🔒 Secure Payments</div>
              <div>SSL encrypted & protected transactions</div>
            </div>
            <div>
              <div className="footer-bottom-item-title">🚚 Fast Delivery</div>
              <div>4-5 business days with free shipping</div>
            </div>
            <div>
              <div className="footer-bottom-item-title">↩️ Easy Returns</div>
              <div>30-day money-back guarantee</div>
            </div>
          </div>

          <div className="footer-bottom" style={{ textAlign: 'center', paddingTop: '1.5rem' }}>
            <div style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
              © 2026 ShopEase Marketplace. All rights reserved. | Made with ❤️ for better shopping
            </div>
          </div>
        </footer>

        <ToastContainer />
        <BackToTop />
        <MobileNav />
      </div>
      </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
