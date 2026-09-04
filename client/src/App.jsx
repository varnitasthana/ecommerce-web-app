import { useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Link, Navigate, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails';
import Login from './pages/Login';
import Register from './pages/Register';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import Admin from './pages/Admin';
import Wishlist from './pages/Wishlist';
import Partner from './pages/Partner';
import Legal from './pages/Legal';
import Support from './pages/Support';
import SellerDashboard from './pages/SellerDashboard';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';
import './App.css';

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

function Header({ cart }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [search, setSearch] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const submitSearch = (event) => {
    event.preventDefault();
    navigate(`/products${search.trim() ? `?search=${encodeURIComponent(search.trim())}` : ''}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setShowProfileMenu(false);
  };

  return (
    <>
      {/* ANNOUNCEMENT BAR */}
      <div className="announcement">
        🎉 Free delivery on orders over ₹999 · ✓ Trusted brands · ↩️ Easy returns · 🔒 Secure checkout
      </div>

      {/* MAIN HEADER */}
      <header className="topbar">
        {/* LOGO */}
        <Link className="brand" to="/">
          <span className="brand-mark">S</span>
          ShopEase
        </Link>

        {/* SEARCH BAR */}
        <form className="global-search" onSubmit={submitSearch}>
          <input
            aria-label="Search products"
            placeholder="Search for products, brands, and more..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <button type="submit" aria-label="Search">🔍 Search</button>
        </form>

        {/* NAVIGATION */}
        <nav className="nav">
          <NavLink to="/products" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            🛒 Shop
          </NavLink>
          <NavLink to="/wishlist" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            ❤️ Wishlist
          </NavLink>
          <NavLink to="/orders" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            📦 Orders
          </NavLink>
          <NavLink
            to="/cart"
            style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}
          >
            🛍️ Cart
            {cart.length > 0 && <span className="nav-count">{cart.length}</span>}
          </NavLink>

          {/* ADMIN LINK */}
          {user?.role === 'admin' && (
            <NavLink to="/admin" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              ⚙️ Admin
            </NavLink>
          )}

          {/* SELLER LINK */}
          {(user?.role === 'seller' || user?.role === 'admin') && (
            <NavLink to="/seller" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              📊 Seller
            </NavLink>
          )}

          {/* USER PROFILE OR LOGIN */}
          <div style={{ position: 'relative' }}>
            {user ? (
              <>
                <button
                  className="nav-button"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: 'inherit'
                  }}
                >
                  👤 {user.name || 'Account'}
                </button>

                {/* PROFILE DROPDOWN */}
                {showProfileMenu && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      background: 'white',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      boxShadow: 'var(--shadow-lg)',
                      minWidth: '200px',
                      zIndex: 50,
                      marginTop: '0.5rem',
                      animation: 'slideDown 0.2s ease'
                    }}
                  >
                    <div style={{
                      padding: '1rem',
                      borderBottom: '1px solid var(--border)',
                      fontSize: '0.9rem'
                    }}>
                      <p style={{ margin: '0 0 0.25rem', fontWeight: '700' }}>{user.name}</p>
                      <p style={{ margin: 0, color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>{user.email}</p>
                    </div>
                    <div style={{ padding: '0.5rem 0' }}>
                      <NavLink
                        to="/orders"
                        onClick={() => setShowProfileMenu(false)}
                        style={{
                          display: 'block',
                          padding: '0.65rem 1rem',
                          color: 'var(--text-secondary)',
                          textDecoration: 'none',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.target.style.background = 'var(--bg-secondary)'}
                        onMouseLeave={(e) => e.target.style.background = 'transparent'}
                      >
                        📦 My Orders
                      </NavLink>
                      <NavLink
                        to="/wishlist"
                        onClick={() => setShowProfileMenu(false)}
                        style={{
                          display: 'block',
                          padding: '0.65rem 1rem',
                          color: 'var(--text-secondary)',
                          textDecoration: 'none',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.target.style.background = 'var(--bg-secondary)'}
                        onMouseLeave={(e) => e.target.style.background = 'transparent'}
                      >
                        ❤️ Wishlist
                      </NavLink>
                      <button
                        onClick={handleLogout}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '0.65rem 1rem',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--text-secondary)',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.target.style.background = 'var(--bg-secondary)'}
                        onMouseLeave={(e) => e.target.style.background = 'transparent'}
                      >
                        🚪 Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <NavLink to="/login" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                🔐 Sign In
              </NavLink>
            )}
          </div>
        </nav>
      </header>

      {/* CATEGORY BAR */}
      <div className="category-bar">
        <NavLink to="/products">🏠 All Products</NavLink>
        <NavLink to="/products?category=Electronics">💻 Electronics</NavLink>
        <NavLink to="/products?category=Fashion">👕 Fashion</NavLink>
        <NavLink to="/products?category=Home">🏡 Home & Living</NavLink>
        <NavLink to="/products?category=Sports">⚽ Sports</NavLink>
        <NavLink to="/partner" style={{ marginLeft: 'auto', color: 'var(--primary)', fontWeight: '600' }}>
          📈 Sell with Us
        </NavLink>
      </div>
    </>
  );
}

function App() {
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('cart') || '[]'));

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

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

  const clearCart = () => setCart([]);

  const totalPrice = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  return (
    <BrowserRouter>
      <AuthProvider>
      <div className="app-shell">
        <Header cart={cart} />

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
              <Link className="footer-brand" to="/">
                <span style={{ color: 'var(--primary)', fontSize: '1.3rem' }}>S</span>
                ShopEase
              </Link>
              <p>Your trusted online marketplace for quality products and amazing deals. Shop with confidence!</p>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                <a href="#" style={{ width: '30px', height: '30px', background: 'var(--primary-light)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>f</a>
                <a href="#" style={{ width: '30px', height: '30px', background: 'var(--primary-light)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>𝕏</a>
                <a href="#" style={{ width: '30px', height: '30px', background: 'var(--primary-light)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>📷</a>
              </div>
            </div>
            <div>
              <strong>🛒 Shop</strong>
              <Link to="/products">All Products</Link>
              <Link to="/products?category=Electronics">Electronics</Link>
              <Link to="/products?category=Fashion">Fashion</Link>
              <Link to="/products?category=Home">Home & Living</Link>
              <Link to="/partner">Become a Seller</Link>
            </div>
            <div>
              <strong>💬 Help & Support</strong>
              <Link to="/support">Customer Support</Link>
              <Link to="/returns">Returns Policy</Link>
              <Link to="/orders">Track Order</Link>
              <a href="#" style={{ display: 'block', color: '#bbb', textDecoration: 'none', transition: 'color 0.3s' }} onMouseEnter={(e) => e.target.style.color = 'var(--primary)'} onMouseLeave={(e) => e.target.style.color = '#bbb'}>FAQs</a>
              <a href="#" style={{ display: 'block', color: '#bbb', textDecoration: 'none', transition: 'color 0.3s' }} onMouseEnter={(e) => e.target.style.color = 'var(--primary)'} onMouseLeave={(e) => e.target.style.color = '#bbb'}>Contact Us</a>
            </div>
            <div>
              <strong>📋 Policies</strong>
              <Link to="/privacy">Privacy Policy</Link>
              <Link to="/terms">Terms & Conditions</Link>
              <a href="#" style={{ display: 'block', color: '#bbb', textDecoration: 'none', transition: 'color 0.3s' }} onMouseEnter={(e) => e.target.style.color = 'var(--primary)'} onMouseLeave={(e) => e.target.style.color = '#bbb'}>Secure Checkout</a>
              <a href="#" style={{ display: 'block', color: '#bbb', textDecoration: 'none', transition: 'color 0.3s' }} onMouseEnter={(e) => e.target.style.color = 'var(--primary)'} onMouseLeave={(e) => e.target.style.color = '#bbb'}>Security & Trust</a>
            </div>
          </div>

          {/* FOOTER BOTTOM */}
          <div style={{
            padding: '1.5rem max(1.5rem, calc((100vw - 1400px) / 2))',
            borderTop: '1px solid #333',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '2rem',
            textAlign: 'center',
            fontSize: '0.85rem',
            color: '#999'
          }}>
            <div>
              <div style={{ fontWeight: '700', marginBottom: '0.5rem', color: '#ccc' }}>✓ Verified Sellers</div>
              <div>100% authentic products from trusted brands</div>
            </div>
            <div>
              <div style={{ fontWeight: '700', marginBottom: '0.5rem', color: '#ccc' }}>🔒 Secure Payments</div>
              <div>SSL encrypted & protected transactions</div>
            </div>
            <div>
              <div style={{ fontWeight: '700', marginBottom: '0.5rem', color: '#ccc' }}>🚚 Fast Delivery</div>
              <div>4-5 business days with free shipping</div>
            </div>
            <div>
              <div style={{ fontWeight: '700', marginBottom: '0.5rem', color: '#ccc' }}>↩️ Easy Returns</div>
              <div>30-day money-back guarantee</div>
            </div>
          </div>

          <div className="footer-bottom" style={{ textAlign: 'center', paddingTop: '1.5rem' }}>
            <div style={{ color: '#999', fontSize: '0.8rem' }}>
              © 2026 ShopEase Marketplace. All rights reserved. | Made with ❤️ for better shopping
            </div>
          </div>
        </footer>
      </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
