import { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FaShoppingCart, FaTruck, FaShieldAlt, FaUndoAlt } from 'react-icons/fa';
import api from '../services/api';
import Button from '../components/Button';

function useReveal() {
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          node.classList.add('visible');
          observer.unobserve(node);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return ref;
}

function Home({ addToCart }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  useEffect(() => {
    api.get('/products')
      .then((response) => setProducts(Array.isArray(response.data) ? response.data : response.data.products || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
      setRecentlyViewed(stored);
    } catch {
      setRecentlyViewed([]);
    }
  }, []);

  const addToRecentlyViewed = useCallback((product) => {
    setRecentlyViewed((prev) => {
      const filtered = prev.filter((p) => (p._id || p.id) !== (product._id || product.id));
      const updated = [product, ...filtered].slice(0, 8);
      localStorage.setItem('recentlyViewed', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const featuredProducts = products.slice(0, 4);
  const trendingProducts = products.slice(4, 8);
  const bestSellerProducts = products.slice(0, 6);
  const dealsProducts = products
    .filter((p) => p.compareAtPrice && p.compareAtPrice > p.price)
    .map((p) => ({ ...p, discount: Math.round(((p.compareAtPrice - p.price) / p.compareAtPrice) * 100) }))
    .filter((p) => p.discount > 15)
    .slice(0, 4);

  const getProductDiscount = (product) => {
    if (!product.compareAtPrice || product.compareAtPrice <= product.price) return 0;
    return Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100);
  };

  const getProductBadge = (product, index) => {
    const discount = getProductDiscount(product);
    if (discount > 20) return { text: `${discount}% OFF`, class: 'badge-sale' };
    if (index % 3 === 0) return { text: 'TRENDING', class: 'badge-hot' };
    if (!product.rating || product.rating < 3) return { text: 'NEW', class: 'badge-new' };
    return null;
  };

  const openQuickView = (product) => {
    setQuickViewProduct(product);
    addToRecentlyViewed(product);
    document.body.style.overflow = 'hidden';
  };

  const closeQuickView = () => {
    setQuickViewProduct(null);
    document.body.style.overflow = '';
  };

  const renderProductCard = (product, index) => {
    if (!product || !product._id) return null;
    const badge = getProductBadge(product, index);
    const name = product.name || 'Premium Product';
    const brand = product.brand || 'ShopEase';
    const price = product.price ?? 0;
    const image = product.image || product.images?.[0] || 'https://via.placeholder.com/300x240';
    const rating = typeof product.rating === 'number' ? product.rating : 0;
    const compareAtPrice = product.compareAtPrice || 0;
    const discount = compareAtPrice > price ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100) : 0;

    return (
      <div className="product-card reveal" key={product._id || product.id}>
        <div className="product-card-image">
          <img src={image} alt={name} loading="lazy" />
          {badge && (
            <div className={`product-badge ${badge.class}`}>
              {badge.text}
            </div>
          )}
          <button
            className="quick-view-btn"
            onClick={(e) => { e.preventDefault(); openQuickView(product); }}
            aria-label="Quick view"
          >
            👁 Quick View
          </button>
        </div>
        <div className="product-card-body">
          <p>{brand}</p>
          <h3>{name}</h3>

          <div className="product-rating">
            <span className="rating-stars">★★★★★</span>
            <span className="rating-count">{rating ? Math.round(rating * 10) / 10 : '4.5'}</span>
            <span style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>(128)</span>
          </div>

          <div className="product-meta">
            <div className="product-price">
              <span className="product-price-current">₹{price}</span>
              {compareAtPrice > price && (
                <>
                  <span className="product-price-original">₹{compareAtPrice}</span>
                  <span className="product-discount">{discount}% off</span>
                </>
              )}
            </div>
            <button onClick={() => addToCart(product, 1)} title="Add to cart">
              <FaShoppingCart /> Add
            </button>
          </div>
        </div>
      </div>
    );
  };

  const featuredRef = useReveal();
  const trendingRef = useReveal();
  const dealsRef = useReveal();
  const bestSellerRef = useReveal();
  const infoRef = useReveal();

  return (
    <section className="home-page">
      {/* HERO BANNER */}
      <div className="hero-banner">
        <div className="hero-copy">
          <p className="eyebrow">🎉 Exclusive Deals</p>
          <h1>Shop the Best Premium Products Online</h1>
          <p>
            Discover millions of products with exceptional deals and fast delivery. Experience premium shopping with 100% authenticity guarantee, easy returns, and secure payment options.
          </p>
          <div className="hero-actions">
            <Link className="primary-btn" to="/products">🛍️ Start Shopping</Link>
            <Link className="secondary-btn" to="/partner">📦 Become a Seller</Link>
          </div>
        </div>
        <div className="hero-stat">
          <strong>48h</strong>
          <span>Super Fast Delivery on All Orders</span>
        </div>
      </div>

      {/* TRUST STRIP */}
      <div className="trust-strip">
        <div>
          <div style={{ color: 'var(--primary)' }}>
            <FaTruck style={{ fontSize: '1.8rem' }} />
          </div>
          <div>
            <strong>Free Shipping</strong>
            <span>On orders over ₹999</span>
          </div>
        </div>
        <div>
          <div style={{ color: 'var(--primary)' }}>
            <FaShieldAlt style={{ fontSize: '1.8rem' }} />
          </div>
          <div>
            <strong>Secure Payment</strong>
            <span>100% Protected Transactions</span>
          </div>
        </div>
        <div>
          <div style={{ color: 'var(--primary)' }}>
            <FaUndoAlt style={{ fontSize: '1.8rem' }} />
          </div>
          <div>
            <strong>Easy Returns</strong>
            <span>30-day hassle-free returns</span>
          </div>
        </div>
      </div>

      {/* FEATURED PRODUCTS SECTION */}
      <div className="section-heading home-section-heading" ref={featuredRef}>
        <div>
          <p className="eyebrow">✨ Curated Collection</p>
          <h2>Featured Products</h2>
        </div>
        <Link className="text-link" to="/products">See all featured →</Link>
      </div>

      {loading ? (
        <div className="loading-grid">
          {[1, 2, 3, 4].map((item) => <div className="skeleton-card" key={item} />)}
        </div>
      ) : (
        <div className="product-grid" ref={featuredRef}>
          {featuredProducts.map((product, idx) => renderProductCard(product, idx))}
        </div>
      )}

      {/* PROMOTIONAL BANNER */}
      <div style={{
        margin: '3rem 0',
        padding: '2.5rem',
        borderRadius: 'var(--radius-xl)',
        background: 'linear-gradient(135deg, #ff9900 0%, #ff6b00 100%)',
        color: 'white',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at top right, rgba(255,255,255,0.2) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ margin: '0 0 0.5rem', fontSize: '2rem', fontWeight: 700 }}>🔥 Flash Sale</h2>
          <p style={{ margin: '0 0 1.25rem', fontSize: '1.1rem', opacity: 0.95 }}>Get up to 50% off on selected items - Limited time offer!</p>
          <Link className="primary-btn" to="/products?sort=price-low" style={{ background: 'var(--bg-primary)', color: '#ff6b00', boxShadow: 'var(--shadow-md)' }}>
            Shop Flash Sale
          </Link>
        </div>
      </div>

      {/* DEALS OF THE DAY */}
      {dealsProducts.length > 0 && (
        <>
          <div className="section-heading home-section-heading" ref={dealsRef}>
            <div>
              <p className="eyebrow">⏰ Limited Time</p>
              <h2>Deals of the Day</h2>
            </div>
            <Link className="text-link" to="/products?sort=price-low">See all deals →</Link>
          </div>
          <div className="product-grid" ref={dealsRef}>
            {dealsProducts.map((product, idx) => renderProductCard(product, idx))}
          </div>
        </>
      )}

      {/* TRENDING PRODUCTS SECTION */}
      <div className="section-heading home-section-heading" ref={trendingRef}>
        <div>
          <p className="eyebrow">🔥 Popular Picks</p>
          <h2>Trending Now</h2>
        </div>
        <Link className="text-link" to="/products?sort=featured">View all trending →</Link>
      </div>

      {loading ? (
        <div className="loading-grid">
          {[1, 2, 3, 4].map((item) => <div className="skeleton-card" key={item} />)}
        </div>
      ) : (
        <div className="product-grid" ref={trendingRef}>
          {trendingProducts.map((product, idx) => renderProductCard(product, idx + 4))}
        </div>
      )}

      {/* CATEGORY HIGHLIGHTS */}
      <div style={{ margin: '3rem 0' }} ref={infoRef}>
        <div className="section-heading home-section-heading">
          <div>
            <p className="eyebrow">🏪 Shop by Category</p>
            <h2>Popular Categories</h2>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem'
        }}>
          {[
            { value: 'Electronics', label: 'Electronics', emoji: '💻' },
            { value: 'Fashion', label: 'Fashion', emoji: '👕' },
            { value: 'Home & Kitchen', label: 'Home & Living', emoji: '🏡' },
            { value: 'Sports & Fitness', label: 'Sports', emoji: '⚽' }
          ].map(({ value, label, emoji }) => (
            <Link
              key={value}
              to={`/products?category=${encodeURIComponent(value)}`}
              style={{
                padding: '2rem',
                borderRadius: 'var(--radius-lg)',
                background: 'linear-gradient(135deg, var(--primary-light) 0%, var(--bg-secondary) 100%)',
                textAlign: 'center',
                transition: 'all 0.3s ease',
                textDecoration: 'none',
                color: 'var(--primary)',
                fontWeight: 600,
                fontSize: '1.1rem',
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                e.currentTarget.style.borderColor = 'var(--primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
            >
              <span style={{ fontSize: '2.5rem' }}>{emoji}</span>
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* BEST SELLERS */}
      <div className="section-heading home-section-heading" ref={bestSellerRef}>
        <div>
          <p className="eyebrow">⭐ Customer Favorites</p>
          <h2>Best Sellers</h2>
        </div>
        <Link className="text-link" to="/products?sort=featured">View all best sellers →</Link>
      </div>

      {loading ? (
        <div className="loading-grid">
          {[1, 2, 3, 4, 5, 6].map((item) => <div className="skeleton-card" key={item} />)}
        </div>
      ) : (
        <div className="product-grid" ref={bestSellerRef}>
          {bestSellerProducts.slice(0, 6).map((product, _idx) => renderProductCard(product, _idx))}
        </div>
      )}

      {/* RECENTLY VIEWED */}
      {recentlyViewed.length > 0 && (
        <div style={{ marginTop: '3rem' }}>
          <div className="section-heading home-section-heading">
            <div>
              <p className="eyebrow">🕒 Continue Browsing</p>
              <h2>Recently Viewed</h2>
            </div>
          </div>
          <div className="product-grid">
            {recentlyViewed.slice(0, 4).map((product, _idx) => {
              if (!product || !product._id) return null;
              const name = product.name || 'Product';
              const brand = product.brand || 'ShopEase';
              const price = product.price ?? 0;
              const image = product.image || product.images?.[0] || 'https://via.placeholder.com/300x240';
              const rating = typeof product.rating === 'number' ? product.rating : 0;
              return (
                <div className="product-card reveal" key={`recent-${product._id || product.id}`}>
                  <Link to={`/products/${product._id || product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="product-card-image">
                      <img src={image} alt={name} loading="lazy" />
                    </div>
                    <div className="product-card-body">
                      <p>{brand}</p>
                      <h3>{name}</h3>
                      <div className="product-rating">
                        <span className="rating-stars">★★★★★</span>
                        <span className="rating-count">{rating ? Math.round(rating * 10) / 10 : '4.5'}</span>
                      </div>
                      <div className="product-meta">
                        <div className="product-price">
                          <span className="product-price-current">₹{price}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* INFO SECTION */}
      <div style={{
        marginTop: '4rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem'
      }} ref={infoRef}>
        <div style={{
          padding: '1.5rem',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--bg-primary)',
          border: '1px solid var(--border)',
          textAlign: 'center',
          transition: 'all 0.3s ease'
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📱</div>
          <h3 style={{ margin: '0 0 0.5rem', color: 'var(--primary)', fontSize: '1.1rem' }}>Mobile App</h3>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Download our app for exclusive deals and faster checkout</p>
        </div>

        <div style={{
          padding: '1.5rem',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--bg-primary)',
          border: '1px solid var(--border)',
          textAlign: 'center',
          transition: 'all 0.3s ease'
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🎁</div>
          <h3 style={{ margin: '0 0 0.5rem', color: 'var(--primary)', fontSize: '1.1rem' }}>Rewards Program</h3>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Earn points on every purchase and redeem for discounts</p>
        </div>

        <div style={{
          padding: '1.5rem',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--bg-primary)',
          border: '1px solid var(--border)',
          textAlign: 'center',
          transition: 'all 0.3s ease'
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>💬</div>
          <h3 style={{ margin: '0 0 0.5rem', color: 'var(--primary)', fontSize: '1.1rem' }}>Customer Support</h3>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>24/7 support team ready to help with any questions</p>
        </div>
      </div>

      {/* QUICK VIEW MODAL */}
      {quickViewProduct && (
        <div className="modal-overlay" onClick={closeQuickView}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ position: 'relative' }}>
            <button className="modal-close" onClick={closeQuickView}>✕</button>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', padding: '2rem' }}>
              <div>
                <div className="product-image-wrapper" style={{ marginBottom: '1rem' }}>
                  <img src={quickViewProduct.image || 'https://via.placeholder.com/500x500'} alt={quickViewProduct.name} />
                </div>
                <div className="product-trust-grid">
                  {[['✓', 'Verified'], ['🔒', 'Secure'], ['✓', 'Authentic']].map(([icon, label]) => (
                    <div key={label} className="product-trust-item">
                      <div className="product-trust-icon">{icon}</div>
                      {label}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="product-brand-category">{quickViewProduct.brand || 'Premium Select'} · {quickViewProduct.category}</p>
                <h1 className="product-name" style={{ fontSize: '1.5rem' }}>{quickViewProduct.name}</h1>
                <div className="product-rating-row" style={{ border: 'none', padding: 0, margin: '0.75rem 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="product-rating-stars">★★★★★</span>
                    <span className="product-rating-value">{quickViewProduct.rating ? Math.round(quickViewProduct.rating * 10) / 10 : '4.5'}</span>
                  </div>
                </div>
                <div className="product-price-row" style={{ marginBottom: '1rem' }}>
                  <span className="product-price-current-lg" style={{ fontSize: '1.5rem' }}>₹{quickViewProduct.price}</span>
                  {quickViewProduct.compareAtPrice && (
                    <>
                      <span className="product-price-original-lg">₹{quickViewProduct.compareAtPrice}</span>
                      <span className="product-price-save-badge">Save ₹{quickViewProduct.compareAtPrice - quickViewProduct.price}</span>
                    </>
                  )}
                </div>
                <p className="product-stock-status">✓ {quickViewProduct.stock > 0 ? 'In Stock' : 'Out of Stock'}</p>
                <div className="product-action-row" style={{ marginTop: '1rem' }}>
                  <Button onClick={() => { addToCart(quickViewProduct, 1); closeQuickView(); }} size="lg" style={{ flex: 1 }}>
                    <FaShoppingCart /> Add to Cart
                  </Button>
                  <Link to={`/products/${quickViewProduct._id || quickViewProduct.id}`} style={{ textDecoration: 'none' }}>
                    <Button variant="outline" size="lg">View Details</Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default Home;
