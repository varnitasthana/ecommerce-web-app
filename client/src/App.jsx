import { useEffect, useMemo, useState, useCallback } from 'react';
import { BrowserRouter, Link, Navigate, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails';
import Login from './pages/Login';
import Register from './pages/Register';
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
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';
import ToastContainer from './components/Toast';
import { addToast } from './components/toastApi';
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

  return (
    <>
      {/* ANNOUNCEMENT BAR */}
      <div className="announcement">
        🎉 Free delivery on orders over ₹999 · ✓ Trusted brands · ↩️ Easy returns · 🔒 Secure checkout
      </div>

      {/* MAIN HEADER */}
      <header className="topbar glass-header">
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0.75rem max(1.5rem, calc((100vw - 1400px) / 2))', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {/* LOGO */}
          <Link className="brand" to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'inherit' }}>
            <span className="brand-mark" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '2.2rem', height: '2.2rem', borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', color: 'white', fontWeight: 700, fontSize: '1.1rem', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)' }}>S</span>
            <span style={{ fontWeight: 700, fontSize: '1.2rem' }}>ShopEase</span>
          </Link>

          {/* SEARCH BAR */}
          <form className="global-search" onSubmit={submitSearch} style={{ flex: 1, maxWidth: 600, position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              aria-label="Search products"
              placeholder="Search for products, brands, and more..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                if (event.target.value.trim().length >= 2) {
                  const timer = setTimeout(() => {
                    fetch(`/api/search/suggestions?q=${encodeURIComponent(event.target.value.trim())}`)
                      .then((r) => r.json())
                      .then((data) => setSuggestions(data.suggestions || []))
                      .catch(() => setSuggestions([]));
                  }, 300);
                  return () => clearTimeout(timer);
                } else {
                  setSuggestions([]);
                }
              }}
              style={{ width: '100%', padding: '0.7rem 2.5rem 0.7rem 1rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--border)', background: 'var(--bg-secondary)', transition: 'all 0.3s ease', fontSize: '0.95rem' }}
            />
            <button type="submit" aria-label="Search" style={{ position: 'absolute', right: '0.4rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-full)', padding: '0.55rem 1rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s ease' }}>🔍</button>

            {suggestions.length > 0 && (
              <div className="search-suggestions" style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '0.5rem', borderRadius: 'var(--radius-md)', overflow: 'hidden', zIndex: 50 }}>
                {suggestions.map((s) => (
                  <Link key={s._id} to={`/products/${s._id}`} className="search-suggestion-item" onClick={() => setSuggestions([])}>
                    <img src={s.image || 'https://via.placeholder.com/48x48'} alt="" />
                    <span><strong>{s.name}</strong><small>{s.brand} · ₹{s.price}</small></span>
                  </Link>
                ))}
              </div>
            )}
          </form>

          {/* THEME TOGGLE */}
          <button className="theme-toggle" onClick={toggleDarkMode} aria-label="Toggle dark mode" title={darkMode ? 'Light mode' : 'Dark mode'}>
            {darkMode ? '☀️' : '🌙'}
          </button>

          {/* MOBILE MENU BUTTON */}
          <button className="mobile-menu-btn" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
            {mobileOpen ? '✕' : '☰'}
          </button>

          {/* DESKTOP NAVIGATION */}
          <nav className="nav" style={{ display: window.innerWidth > 768 ? 'flex' : 'none' }}>
            <NavLink to="/products">🛒 Shop</NavLink>
            <NavLink to="/wishlist">❤️ Wishlist</NavLink>
            <NavLink to="/orders">📦 Orders</NavLink>
            <NavLink to="/cart">🛍️ Cart
              {cart.length > 0 && <span className="nav-count">{cart.length}</span>}
            </NavLink>

            {user?.role === 'admin' && (
              <NavLink to="/admin">⚙️ Admin</NavLink>
            )}

            {(user?.role === 'seller' || user?.role === 'admin') && (
              <NavLink to="/seller">📊 Seller</NavLink>
            )}

            {/* USER PROFILE OR LOGIN */}
            <div style={{ position: 'relative' }}>
              {user ? (
                <>
                  <button
                    className="nav-button"
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                  >
                    👤 {user.name || 'Account'}
                  </button>

                  {/* PROFILE DROPDOWN */}
                  {showProfileMenu && (
                    <div className="profile-dropdown">
                      <div className="profile-dropdown-header">
                        <p>{user.name}</p>
                        <small>{user.email}</small>
                      </div>
                      <div className="profile-dropdown-menu">
                        <NavLink to="/orders" onClick={() => setShowProfileMenu(false)}>
                          📦 My Orders
                        </NavLink>
                        <NavLink to="/wishlist" onClick={() => setShowProfileMenu(false)}>
                          ❤️ Wishlist
                        </NavLink>
                        <button onClick={handleLogout}>
                          🚪 Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <NavLink to="/login">
                  🔐 Sign In
                </NavLink>
              )}
            </div>
          </nav>
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
            <Route
              path="/cart"
              element={<Cart cart={cart} removeFromCart={removeFromCart} updateQuantity={updateQuantity} totalPrice={totalPrice} />}
            />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <Checkout cart={cart} totalPrice={totalPrice} />
                </ProtectedRoute>
              }
            />
            <Route path="/orders" element={<ProtectedRoute><Orders clearCart={clearCart} /></ProtectedRoute>} />
            <Route path="/orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
            <Route path="/order-confirmation" element={<ProtectedRoute><OrderConfirmation /></ProtectedRoute>} />
            <Route path="/wishlist" element={<ProtectedRoute><Wishlist addToCart={addToCart} /></ProtectedRoute>} />
            <Route path="/partner" element={<Partner />} />
            <Route path="/seller" element={<ProtectedRoute roles={['seller', 'admin']}><SellerDashboard /></ProtectedRoute>} />
            <Route path="/support" element={<Support />} />
            <Route path="/privacy" element={<Legal type="privacy" />} />
            <Route path="/terms" element={<Legal type="terms" />} />
            <Route path="/returns" element={<Legal type="returns" />} />
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
              <p style={{ color: '#aaa', fontSize: '0.95rem' }}>Your trusted online marketplace for quality products and amazing deals. Shop with confidence!</p>
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
            <div style={{ color: '#999', fontSize: '0.8rem' }}>
              © 2026 ShopEase Marketplace. All rights reserved. | Made with ❤️ for better shopping
            </div>
          </div>
        </footer>

        <ToastContainer />
        <BackToTop />
      </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
