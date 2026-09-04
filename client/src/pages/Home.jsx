import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaShoppingCart, FaTruck, FaShieldAlt, FaUndoAlt } from 'react-icons/fa';
import api from '../services/api';

function Home({ addToCart }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/products')
      .then((response) => setProducts(Array.isArray(response.data) ? response.data : response.data.products || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  // Categorize products
  const featuredProducts = products.slice(0, 4);
  const trendingProducts = products.slice(4, 8);
  const bestSellerProducts = products.slice(0, 6);
  
  // Get badges for products
  const getProductBadge = (product, index) => {
    if (product.discount && product.discount > 20) return { text: `${product.discount}% OFF`, class: 'badge-sale' };
    if (index % 3 === 0) return { text: 'TRENDING', class: 'badge-hot' };
    if (!product.rating || product.rating < 3) return { text: 'NEW', class: 'badge-new' };
    return null;
  };

  const renderProductCard = (product, index) => (
    <div className="product-card" key={product._id || product.id}>
      <div className="product-card-image">
        <img src={product.image || 'https://via.placeholder.com/300x240'} alt={product.name} />
        {getProductBadge(product, index) && (
          <div className={`product-badge ${getProductBadge(product, index).class}`}>
            {getProductBadge(product, index).text}
          </div>
        )}
      </div>
      <div className="product-card-body">
        <p>{product.brand || 'Premium Select'}</p>
        <h3>{product.name}</h3>
        
        <div className="product-rating">
          <span className="rating-stars">★★★★★</span>
          <span className="rating-count">{product.rating ? Math.round(product.rating * 10) / 10 : '4.5'}</span>
          <span style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>(128)</span>
        </div>

        <div className="product-meta">
          <div className="product-price">
            <span className="product-price-current">₹{product.price}</span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <>
                <span className="product-price-original">₹{product.compareAtPrice}</span>
                <span className="product-discount">{Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)}% off</span>
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
            <Link className="primary-btn" to="/products">
              🛍️ Start Shopping
            </Link>
            <Link className="secondary-btn" to="/partner">
              📦 Become a Seller
            </Link>
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
      <div className="section-heading home-section-heading">
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
        <div className="product-grid">
          {featuredProducts.map((product, idx) => renderProductCard(product, idx))}
        </div>
      )}

      {/* PROMOTIONAL BANNER */}
      <div style={{
        margin: '3rem 0',
        padding: '2rem',
        borderRadius: '12px',
        background: 'linear-gradient(135deg, #ff9900 0%, #ff6b00 100%)',
        color: 'white',
        textAlign: 'center'
      }}>
        <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.8rem' }}>🔥 Flash Sale</h2>
        <p style={{ margin: '0 0 1rem', fontSize: '1.05rem' }}>Get up to 50% off on selected items - Limited time offer!</p>
        <Link className="primary-btn" to="/products?sort=price-low" style={{ background: 'white', color: '#ff6b00' }}>
          Shop Flash Sale
        </Link>
      </div>

      {/* TRENDING PRODUCTS SECTION */}
      <div className="section-heading home-section-heading">
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
        <div className="product-grid">
          {trendingProducts.map((product, idx) => renderProductCard(product, idx + 4))}
        </div>
      )}

      {/* CATEGORY HIGHLIGHTS */}
      <div style={{ margin: '3rem 0' }}>
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
          {['Electronics', 'Fashion', 'Home & Living', 'Sports'].map((cat) => (
            <Link
              key={cat}
              to={`/products?category=${cat}`}
              style={{
                padding: '2rem',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, var(--primary-light) 0%, var(--bg-secondary) 100%)',
                textAlign: 'center',
                transition: 'all 0.3s ease',
                textDecoration: 'none',
                color: 'var(--primary)',
                fontWeight: '600',
                fontSize: '1.1rem',
                border: '1px solid var(--border)',
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.05)';
                e.target.style.boxShadow = 'var(--shadow-lg)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = 'none';
              }}
            >
              {cat}
            </Link>
          ))}
        </div>
      </div>

      {/* BEST SELLERS */}
      <div className="section-heading home-section-heading">
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
        <div className="product-grid">
          {bestSellerProducts.slice(0, 6).map((product, idx) => renderProductCard(product, idx))}
        </div>
      )}

      {/* INFO SECTION */}
      <div style={{
        marginTop: '4rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem'
      }}>
        <div style={{
          padding: '1.5rem',
          borderRadius: '12px',
          background: 'white',
          border: '1px solid var(--border)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📱</div>
          <h3 style={{ margin: '0 0 0.5rem', color: 'var(--primary)' }}>Mobile App</h3>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Download our app for exclusive deals and faster checkout</p>
        </div>
        
        <div style={{
          padding: '1.5rem',
          borderRadius: '12px',
          background: 'white',
          border: '1px solid var(--border)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎁</div>
          <h3 style={{ margin: '0 0 0.5rem', color: 'var(--primary)' }}>Rewards Program</h3>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Earn points on every purchase and redeem for discounts</p>
        </div>
        
        <div style={{
          padding: '1.5rem',
          borderRadius: '12px',
          background: 'white',
          border: '1px solid var(--border)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💬</div>
          <h3 style={{ margin: '0 0 0.5rem', color: 'var(--primary)' }}>Customer Support</h3>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>24/7 support team ready to help with any questions</p>
        </div>
      </div>
    </section>
  );
}

export default Home;
