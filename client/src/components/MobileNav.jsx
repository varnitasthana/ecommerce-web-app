import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaSearch, FaShoppingCart, FaHeart, FaUser } from 'react-icons/fa';
import { useAuth } from '../context/useAuth';

function MobileNav() {
  const location = useLocation();
  const { user } = useAuth();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const updateCartCount = () => {
      try {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        setCartCount(cart.reduce((sum, item) => sum + (item.quantity || 1), 0));
      } catch {
        setCartCount(0);
      }
    };
    updateCartCount();
    window.addEventListener('cart-updated', updateCartCount);
    return () => window.removeEventListener('cart-updated', updateCartCount);
  }, []);

  const navItems = [
    { path: '/', icon: FaHome, label: 'Home' },
    { path: '/products', icon: FaSearch, label: 'Search' },
    { path: '/cart', icon: FaShoppingCart, label: 'Cart', badge: cartCount },
    { path: user ? '/wishlist' : '/wishlist', icon: FaHeart, label: 'Wishlist' },
    { path: user ? '/account/addresses' : '/login', icon: FaUser, label: user ? 'Account' : 'Login' }
  ];

  return (
    <nav className="mobile-bottom-nav" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--bg-primary)', borderTop: '1px solid var(--border)', display: 'none', justifyContent: 'space-around', alignItems: 'center', padding: '0.5rem 0', zIndex: 900, boxShadow: '0 -4px 20px rgba(0,0,0,0.08)' }}>
      {navItems.map((item) => {
        const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`mobile-nav-item ${isActive ? 'mobile-nav-item-active' : ''}`}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', padding: '0.4rem 0', textDecoration: 'none', color: isActive ? 'var(--primary)' : 'var(--text-tertiary)', fontSize: '0.7rem', fontWeight: 600, position: 'relative', transition: 'color 0.2s ease' }}
          >
            <div style={{ position: 'relative' }}>
              <item.icon style={{ fontSize: '1.25rem' }} />
              {item.badge > 0 && (
                <span style={{ position: 'absolute', top: '-6px', right: '-10px', background: 'var(--danger)', color: 'white', fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.4rem', borderRadius: 'var(--radius-full)', minWidth: '18px', textAlign: 'center', lineHeight: 1 }}>{item.badge}</span>
              )}
            </div>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default MobileNav;
