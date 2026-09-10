import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const CATEGORY_PROMOS = {
  Electronics: { emoji: '📱', label: 'Latest gadgets', color: '#e0e7ff' },
  Fashion: { emoji: '👗', label: 'Trending styles', color: '#fce7f3' },
  Home: { emoji: '🏠', label: 'Home essentials', color: '#dcfce7' },
  Sports: { emoji: '⚽', label: 'Gear up', color: '#fef9c3' }
};

function MegaMenu() {
  const [categories, setCategories] = useState([]);
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [categoryProducts, setCategoryProducts] = useState([]);

  useEffect(() => {
    api.get('/categories')
      .then((response) => {
        const list = Array.isArray(response.data) ? response.data : (response.data.categories || []);
        setCategories(list.slice(0, 8));
      })
      .catch(() => setCategories(['Electronics', 'Fashion', 'Home', 'Sports', 'Beauty', 'Toys', 'Books', 'Grocery']));
  }, []);

  useEffect(() => {
    if (!activeCategory) return;
    api.get('/products', { params: { category: activeCategory, limit: 6 } })
      .then((response) => setCategoryProducts(response.data.products || []))
      .catch(() => setCategoryProducts([]));
  }, [activeCategory]);

  return (
    <nav
      className="mega-menu"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => { setOpen(false); setActiveCategory(null); }}
      style={{ position: 'relative' }}
    >
      <button
        type="button"
        className="mega-menu-trigger"
        onClick={() => setOpen((prev) => !prev)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}
      >
        ☰ Categories
      </button>

      {open && (
        <div className="mega-menu-panel" style={{ position: 'absolute', top: 'calc(100% + 0.75rem)', left: 0, background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)', zIndex: 1000, display: 'grid', gridTemplateColumns: '260px 1fr', minWidth: '820px', overflow: 'hidden' }}>
          <div className="mega-menu-sidebar" style={{ borderRight: '1px solid var(--border)', padding: '0.5rem' }}>
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                onMouseEnter={() => setActiveCategory(category)}
                className={`mega-menu-item ${activeCategory === category ? 'mega-menu-item-active' : ''}`}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0.75rem', borderRadius: 'var(--radius-md)', border: 'none', background: activeCategory === category ? 'var(--primary-light)' : 'transparent', color: activeCategory === category ? 'var(--primary)' : 'var(--text-primary)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, textAlign: 'left', transition: 'all 0.2s ease' }}
              >
                <span style={{ fontSize: '1.1rem' }}>{CATEGORY_PROMOS[category]?.emoji || '📦'}</span>
                <span>{category}</span>
              </button>
            ))}
            <Link to="/products" onClick={() => setOpen(false)} style={{ display: 'block', padding: '0.75rem', color: 'var(--primary)', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none', borderTop: '1px solid var(--border)', marginTop: '0.5rem' }}>
              Browse all →
            </Link>
          </div>

          <div className="mega-menu-content" style={{ padding: '1.25rem', background: 'var(--bg-secondary)' }}>
            {activeCategory ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: CATEGORY_PROMOS[activeCategory]?.color || 'var(--primary-light)', display: 'grid', placeItems: 'center', fontSize: '1.5rem' }}>
                    {CATEGORY_PROMOS[activeCategory]?.emoji || '📦'}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, color: 'var(--text-primary)' }}>{activeCategory}</p>
                    <p style={{ margin: '0.15rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{CATEGORY_PROMOS[activeCategory]?.label || 'Top picks'}</p>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
                  {categoryProducts.map((product) => (
                    <Link key={product._id} to={`/products/${product._id}`} onClick={() => setOpen(false)} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <div style={{ background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border)', transition: 'all 0.2s ease' }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                        <img src={product.image || 'https://via.placeholder.com/150x150'} alt={product.name || 'Product'} style={{ width: '100%', height: '140px', objectFit: 'cover', display: 'block' }} />
                        <div style={{ padding: '0.75rem' }}>
                          <p style={{ margin: '0 0 0.25rem', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name || 'Product'}</p>
                          <p style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{product.brand || 'ShopEase'}</p>
                          <p style={{ margin: 0, fontWeight: 700, color: 'var(--primary)', fontSize: '0.95rem' }}>₹{product.price ?? 0}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                <Link to={`/products?category=${encodeURIComponent(activeCategory)}`} onClick={() => setOpen(false)} style={{ display: 'inline-block', marginTop: '1rem', color: 'var(--primary)', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none' }}>
                  See all {activeCategory} →
                </Link>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-tertiary)' }}>
                <p style={{ margin: '0 0 0.5rem', fontSize: '2rem' }}>🛍️</p>
                <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>Browse categories</p>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem' }}>Select a category to see top deals and recommendations</p>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default MegaMenu;
