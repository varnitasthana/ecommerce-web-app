import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

function Home({ addToCart }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/products')
      .then((response) => setProducts(Array.isArray(response.data) ? response.data : []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const featuredProducts = products.slice(0, 4);

  return (
    <section className="home-page">
      <div className="hero-banner">
        <div className="hero-copy">
          <p className="eyebrow">Fresh picks</p>
          <h1>Everyday essentials, thoughtfully delivered.</h1>
          <p>
            Curated products from trusted brands, transparent pricing, and a shopping experience built around you.
          </p>
          <div className="hero-actions">
            <Link className="primary-btn" to="/products">
              Shop now
            </Link>
            <Link className="secondary-btn" to="/partner">
              Partner with us
            </Link>
          </div>
        </div>
        <div className="hero-stat"><strong>24h</strong><span>Dispatch on thousands of products</span></div>
      </div>

      <div className="trust-strip">
        <div><strong>Verified brands</strong><span>Quality checked partners</span></div>
        <div><strong>Secure checkout</strong><span>Protected by Stripe</span></div>
        <div><strong>Easy returns</strong><span>Simple, transparent policy</span></div>
      </div>

      <div className="section-heading home-section-heading">
        <div><p className="eyebrow">Curated for you</p><h2>Featured products</h2></div>
        <Link className="text-link" to="/products">View all products →</Link>
      </div>

      {loading ? <div className="loading-grid">{[1, 2, 3, 4].map((item) => <div className="skeleton-card" key={item} />)}</div> : <div className="product-grid">
        {featuredProducts.map((product) => (
          <div className="product-card" key={product._id || product.id}>
            <img src={product.image || 'https://via.placeholder.com/300x220'} alt={product.name} />
            <div className="product-card-body">
              <p className="eyebrow">{product.brand || 'ShopEase select'}</p>
              <h3>{product.name}</h3>
              <p className="muted">{product.category} · ★ {product.rating || 'New'}</p>
              <div className="product-meta">
                <span>₹{product.price}</span>
                <button onClick={() => addToCart(product, 1)}>Add to cart</button>
              </div>
            </div>
          </div>
        ))}
      </div>}
    </section>
  );
}

export default Home;
