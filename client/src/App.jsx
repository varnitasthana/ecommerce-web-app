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
import './App.css';

function ProtectedRoute({ children, adminOnly = false }) {
  const location = useLocation();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (adminOnly && user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
}

function Header({ cart }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');
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
          <NavLink to={user ? '/orders' : '/login'}>{user ? user.name : 'Sign in'}</NavLink>
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
            <Route path="/admin" element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />
            <Route path="*" element={<Home addToCart={addToCart} />} />
          </Routes>
        </main>

        <footer className="footer">
          <Link to="/checkout">Proceed to checkout</Link>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
