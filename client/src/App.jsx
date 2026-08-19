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

  const submitSearch = (event) => {
    event.preventDefault();
    navigate(`/products${search.trim() ? `?search=${encodeURIComponent(search.trim())}` : ''}`);
  };

  return (
    <>
      <div className="announcement">Free delivery on orders over ₹999 · Trusted brands · Easy returns</div>
      <header className="topbar">
        <Link className="brand" to="/">
          <span className="brand-mark">S</span>
          ShopEase
        </Link>
        <form className="global-search" onSubmit={submitSearch}>
          <input aria-label="Search products" placeholder="Search products, brands and categories" value={search} onChange={(event) => setSearch(event.target.value)} />
          <button type="submit" aria-label="Search">Search</button>
        </form>
        <nav className="nav">
          <NavLink to="/products">Shop</NavLink>
          <NavLink to="/wishlist">Wishlist</NavLink>
          <NavLink to="/orders">Orders</NavLink>
          <NavLink to="/cart">Cart <span className="nav-count">{cart.length}</span></NavLink>
          {user?.role === 'admin' && <NavLink to="/admin">Admin</NavLink>}
          {(user?.role === 'seller' || user?.role === 'admin') && <NavLink to="/seller">Seller</NavLink>}
          {user ? <button className="nav-button" onClick={() => { logout(); navigate('/'); }}>Sign out</button> : <NavLink to="/login">Sign in</NavLink>}
        </nav>
      </header>
      <div className="category-bar">
        <NavLink to="/products">All products</NavLink>
        <NavLink to="/products?category=Electronics">Electronics</NavLink>
        <NavLink to="/products?category=Home">Home & living</NavLink>
        <NavLink to="/products?category=Fashion">Fashion</NavLink>
        <NavLink to="/partner">Sell with us</NavLink>
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
            <div><Link className="footer-brand" to="/">ShopEase</Link><p>Everyday essentials, thoughtfully delivered.</p></div>
            <div><strong>Shop</strong><Link to="/products">All products</Link><Link to="/wishlist">Wishlist</Link><Link to="/partner">Sell with us</Link></div>
            <div><strong>Help</strong><Link to="/support">Customer support</Link><Link to="/returns">Returns and refunds</Link><Link to="/orders">Track an order</Link></div>
            <div><strong>Policies</strong><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link><Link to="/checkout">Secure checkout</Link></div>
          </div>
          <div className="footer-bottom"><span>© 2026 ShopEase Marketplace</span><span>Secure payments · Verified partners · Easy returns</span></div>
        </footer>
      </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
