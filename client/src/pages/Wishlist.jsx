import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/Button';
import Breadcrumb from '../components/Breadcrumb';
import PriceDropAlert from '../components/PriceDropAlert';

function Wishlist({ addToCart }) {
  const [products, setProducts] = useState([]);

  const loadWishlist = () => {
    api.get('/wishlist').then((response) => setProducts(response.data)).catch(() => setProducts([]));
  };

  useEffect(() => {
    loadWishlist();
  }, []);

  const remove = async (id) => {
    await api.post(`/wishlist/${id}/toggle`);
    loadWishlist();
  };

  return (
    <section className="page-block" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <Breadcrumb items={[{ label: 'Home', path: '/' }, { label: 'Wishlist' }]} />
      <div className="section-heading home-section-heading">
        <div>
          <p className="eyebrow">Saved for later</p>
          <h2>My Wishlist</h2>
        </div>
        <span className="muted">{products.length} saved</span>
      </div>
      {!products.length ? (
        <div className="card text-center" style={{ padding: '3rem 2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❤️</div>
          <h3 style={{ margin: '0 0 0.5rem', color: 'var(--text-primary)' }}>Your wishlist is empty</h3>
          <p className="muted" style={{ marginBottom: '1.5rem' }}>Save items you love and come back to them later.</p>
          <Button to="/products">Browse Products</Button>
        </div>
      ) : (
        <div className="product-grid">
          {products.map((product) => (
            <Link to={`/products/${product._id}`} className="product-card-link" key={product._id}>
              <div className="product-card">
                <div className="product-card-image">
                  <img src={product.image || 'https://via.placeholder.com/300x220'} alt={product.name} />
                </div>
                <div className="product-card-body">
                  <p className="eyebrow">{product.brand}</p>
                  <h3>{product.name}</h3>
                  <div className="product-meta">
                    <span className="product-price-current">₹{product.price}</span>
                    {product.compareAtPrice && product.compareAtPrice > product.price && (
                      <span className="product-price-original">₹{product.compareAtPrice}</span>
                    )}
                  </div>
                  {product.compareAtPrice && product.compareAtPrice > product.price && (
                    <PriceDropAlert
                      productId={product._id}
                      productName={product.name}
                      currentPrice={`₹${product.price}`}
                      oldPrice={`₹${product.compareAtPrice}`}
                    />
                  )}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }} onClick={(e) => e.preventDefault()}>
                    <Button to={`/products/${product._id}`} variant="outline" size="sm" style={{ flex: 1 }}>View</Button>
                    <Button onClick={(e) => { e.preventDefault(); addToCart(product); }} size="sm" style={{ flex: 1 }}>Add to cart</Button>
                    <Button onClick={(e) => { e.preventDefault(); remove(product._id); }} variant="danger" size="sm">Remove</Button>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

export default Wishlist;
