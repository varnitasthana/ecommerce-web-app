import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FaHeart, FaRegHeart, FaShoppingCart, FaRuler, FaQuestionCircle } from 'react-icons/fa';
import api from '../services/api';
import Button from '../components/Button';
import Breadcrumb from '../components/Breadcrumb';
import ShareButton from '../components/ShareButton';
import QASection from '../components/QASection';
import SizeGuide from '../components/SizeGuide';

function ProductDetails({ addToCart }) {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [review, setReview] = useState({ rating: 5, title: '', comment: '' });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [saved, setSaved] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [recommendations, setRecommendations] = useState([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  useEffect(() => {
    api.get(`/products/${id}`)
      .then((response) => {
        setProduct(response.data);
        const images = response.data.images?.length ? response.data.images : [response.data.image].filter(Boolean);
        if (images.length) setSelectedImage(0);
      })
      .catch(() => setProduct(null));
    api.get(`/reviews/${id}`).then((response) => setReviews(response.data)).catch(() => setReviews([]));
    api.get(`/products/${id}/recommendations`).then((response) => setRecommendations(response.data.products || [])).catch(() => setRecommendations([]));
  }, [id]);

  const toggleWishlist = async () => {
    try {
      const response = await api.post(`/wishlist/${id}/toggle`);
      setSaved(response.data.saved);
      setMessageType('success');
      setMessage(response.data.saved ? '❤️ Added to wishlist' : '♡ Removed from wishlist');
    } catch (error) {
      setMessageType('error');
      setMessage(error.response?.data?.message || 'Log in to save products');
    }
    setTimeout(() => setMessage(''), 3000);
  };

  const submitReview = async (event) => {
    event.preventDefault();
    try {
      await api.post(`/reviews/${id}`, review);
      setMessageType('success');
      setMessage('✓ Review published successfully');
      setReview({ rating: 5, title: '', comment: '' });
      const response = await api.get(`/reviews/${id}`);
      setReviews(response.data);
    } catch (error) {
      setMessageType('error');
      setMessage(error.response?.data?.message || 'Log in to publish a review');
    }
    setTimeout(() => setMessage(''), 3000);
  };

  if (!product) {
    return (
      <div className="card text-center" style={{ margin: '2rem', padding: '4rem 2rem' }}>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>Loading product details...</p>
      </div>
    );
  }

  const discount = product.compareAtPrice ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100) : 0;
  const avgRating = product.rating ? Math.round(product.rating * 10) / 10 : 4.5;
  const reviewCount = reviews.length || 128;
  const isOutOfStock = product.stock === 0;

  return (
    <section className="product-details-page" style={{ position: 'relative' }}>
      {isOutOfStock && (
        <div style={{
          position: 'absolute',
          inset: '0',
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.5)',
          borderRadius: 'var(--radius-lg)',
          backdropFilter: 'blur(2px)',
          pointerEvents: 'none'
        }}>
          <div style={{
            padding: '1.5rem 3rem',
            background: 'var(--danger)',
            color: 'white',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-xl)',
            fontSize: '1.5rem',
            fontWeight: 700,
            textAlign: 'center'
          }}>
            Out of Stock
          </div>
        </div>
      )}
      <Breadcrumb items={[{ label: 'Products', path: '/products' }, { label: product.category, path: `/products?category=${encodeURIComponent(product.category)}` }, { label: product.name }]} />

      <div className="product-details-grid card">
        {/* IMAGE SECTION */}
        <div>
          <div className="product-image-wrapper">
            {(() => {
              const images = product.images?.length ? product.images : (product.image ? [product.image] : []);
              const displayImage = images[selectedImage] || images[0] || 'https://via.placeholder.com/500x500';
              return <img src={displayImage} alt={product.name || 'Product'} />;
            })()}
            {discount > 0 && (
              <div className="product-discount-badge">
                {discount}% OFF
              </div>
            )}
          </div>

          {product.images?.length > 1 && (
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
              {product.images.map((img, idx) => (
                <button key={idx} onClick={() => setSelectedImage(idx)} style={{ width: '64px', height: '64px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: selectedImage === idx ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer', flexShrink: 0, padding: 0, background: 'transparent' }}>
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}

          {/* TRUST BADGES */}
          <div className="product-trust-grid">
            {[['✓', 'Verified'], ['🔒', 'Secure'], ['✓', 'Authentic']].map(([icon, label]) => (
              <div key={label} className="product-trust-item">
                <div className="product-trust-icon">{icon}</div>
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* DETAILS SECTION */}
        <div>
          <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <p className="product-brand-category">
                {product.brand || 'ShopEase'} · {product.category || 'General'}
              </p>
              <h1 className="product-name">
                {product.name || 'Product'}
              </h1>
            </div>
            <ShareButton title={product.name || 'Product'} description={product.description} />
          </div>

          {/* RATING */}
          <div className="product-rating-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="product-rating-stars">★★★★★</span>
              <span className="product-rating-value">{avgRating}</span>
            </div>
            <span className="product-review-count">
              ({reviewCount} verified reviews)
            </span>
          </div>

          {/* PRICE */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div className="product-price-row">
              <span className="product-price-current-lg">
                ₹{product.price}
              </span>
              {product.compareAtPrice && (
                <>
                  <span className="product-price-original-lg">
                    ₹{product.compareAtPrice}
                  </span>
                  <span className="product-price-save-badge">
                    Save ₹{product.compareAtPrice - product.price}
                  </span>
                </>
              )}
            </div>
            <p className="product-stock-status" style={{ color: isOutOfStock ? 'var(--danger)' : 'var(--success)' }}>
              ✓ {isOutOfStock ? 'Out of Stock' : product.stock < 5 ? `Only ${product.stock} left` : 'In Stock'}
            </p>
          </div>

          {/* QUANTITY SELECTOR */}
          <div className="product-quantity-selector">
            <label className="product-quantity-label">Quantity:</label>
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Decrease quantity">−</button>
            <span style={{ padding: '0 0.6rem', fontWeight: '700', minWidth: '2rem', textAlign: 'center' }}>{quantity}</span>
            <button onClick={() => setQuantity(quantity + 1)} aria-label="Increase quantity">+</button>
          </div>

          {/* VARIANTS */}
          {product.variants?.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ margin: '0 0 0.75rem', fontWeight: 600, fontSize: '0.9rem' }}>Available Options</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {product.variants.map((variant, idx) => {
                  const attrs = Object.entries(variant.attributes || {}).map(([, v]) => v).join(' / ');
                  const label = attrs || variant.sku;
                  return (
                    <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: selectedVariant === idx ? '2px solid var(--primary)' : '1px solid var(--border)', background: selectedVariant === idx ? 'var(--primary-light)' : 'var(--bg-secondary)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, transition: 'all 0.2s ease' }}>
                      <input
                        type="radio"
                        name="variant"
                        checked={selectedVariant === idx}
                        onChange={() => setSelectedVariant(idx)}
                        style={{ accentColor: 'var(--primary)', width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <span style={{ flex: 1 }}>{label}</span>
                      <span style={{ color: 'var(--primary)', fontWeight: 700 }}>₹{variant.price}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* ACTION BUTTONS */}
          <div className="product-action-row">
            <Button onClick={() => addToCart(product, quantity)} size="lg" style={{ flex: 1, opacity: isOutOfStock ? 0.6 : 1, pointerEvents: isOutOfStock ? 'none' : 'auto' }} disabled={isOutOfStock}>
              <FaShoppingCart /> {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
            </Button>
            <Button onClick={toggleWishlist} variant="outline" size="lg" style={{ color: saved ? 'var(--danger)' : 'var(--text-secondary)', borderColor: saved ? 'var(--danger)' : 'var(--border)', opacity: isOutOfStock ? 0.6 : 1, pointerEvents: isOutOfStock ? 'none' : 'auto' }} disabled={isOutOfStock}>
              {saved ? <FaHeart /> : <FaRegHeart />}
            </Button>
            <Button variant="secondary" size="lg" onClick={() => setShowSizeGuide(true)} disabled={isOutOfStock}>
              <FaRuler /> Size Guide
            </Button>
          </div>

          {/* DELIVERY INFO */}
          <div className="product-delivery-grid">
            {[
              { icon: '🚚', title: 'Free Delivery', desc: 'On orders over ₹999' },
              { icon: '↩️', title: 'Easy Returns', desc: '30 days guaranteed' },
              { icon: '🔒', title: 'Secure Payment', desc: '100% Protected' }
            ].map((item) => (
              <div key={item.title} className="product-delivery-item">
                <div className="product-delivery-icon">{item.icon}</div>
                <div className="product-delivery-title">{item.title}</div>
                <div className="product-delivery-desc">{item.desc}</div>
              </div>
            ))}
          </div>

          {message && (
            <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-error'}`} style={{ marginTop: '1rem' }}>
              {message}
            </div>
          )}
        </div>
      </div>

      {/* SPECIFICATIONS */}
      {(product.warranty || product.weight || product.dimensions || product.returnPolicy) && (
        <div className="card product-description-section" style={{ marginTop: '2rem' }}>
          <h3 className="product-description-title">Specifications</h3>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {product.warranty && (
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                <span style={{ fontWeight: 600 }}>Warranty</span>
                <span className="muted">{product.warranty}</span>
              </div>
            )}
            {product.weight && (
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                <span style={{ fontWeight: 600 }}>Weight</span>
                <span className="muted">{product.weight} kg</span>
              </div>
            )}
            {product.dimensions && (
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                <span style={{ fontWeight: 600 }}>Dimensions (L×W×H)</span>
                <span className="muted">{product.dimensions.length || 0} × {product.dimensions.width || 0} × {product.dimensions.height || 0} cm</span>
              </div>
            )}
            {product.returnPolicy && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600 }}>Return Policy</span>
                <span className="muted">{product.returnPolicy}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DESCRIPTION */}
      {product.description && (
        <div className="card product-description-section" style={{ marginTop: '2rem' }}>
          <h3 className="product-description-title">Product Description</h3>
          <p className="product-description-text">
            {product.description}
          </p>
        </div>
      )}

      {/* Q&A SECTION */}
      <QASection productId={id} />

      {/* SIZE GUIDE MODAL */}
      {showSizeGuide && <SizeGuide product={product} onClose={() => setShowSizeGuide(false)} />}

      {/* REVIEWS SECTION */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <h2 className="product-reviews-title">Customer Reviews</h2>

        {/* WRITE REVIEW */}
        <div className="card product-review-form" style={{ marginBottom: '2rem', background: 'var(--bg-secondary)', border: 'none' }}>
          <h3 className="product-review-form-title">Share your experience</h3>
          <form onSubmit={submitReview} className="product-review-form-grid">
            <select
              value={review.rating}
              onChange={(event) => setReview({ ...review, rating: Number(event.target.value) })}
              className="form-select"
            >
              <option value="5">★★★★★ Excellent</option>
              <option value="4">★★★★☆ Good</option>
              <option value="3">★★★☆☆ Average</option>
              <option value="2">★★☆☆☆ Poor</option>
              <option value="1">★☆☆☆☆ Terrible</option>
            </select>
            <input
              placeholder="Review title"
              value={review.title}
              onChange={(event) => setReview({ ...review, title: event.target.value })}
              className="form-input"
              required
            />
            <textarea
              placeholder="Share your experience with this product"
              value={review.comment}
              onChange={(event) => setReview({ ...review, comment: event.target.value })}
              className="form-input"
              style={{ minHeight: '100px', resize: 'vertical' }}
              required
            />
            <Button type="submit" size="md">Publish Review</Button>
          </form>
        </div>

        {/* REVIEWS LIST */}
        {reviews.length > 0 ? (
          <div className="product-reviews-list">
            {reviews.map((item) => (
              <div key={item._id} className="product-review-card">
                <div className="product-review-card-header">
                  <strong className="product-review-card-rating">
                    {'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)} {item.title}
                  </strong>
                  <small className="product-review-card-date">
                     {new Date(item.createdAt).toLocaleDateString('en-US')}
                  </small>
                </div>
                <p className="product-review-card-text">
                  {item.comment}
                </p>
                <small className="product-review-card-author">
                  By {item.user?.name || 'Verified Buyer'}
                </small>
              </div>
            ))}
          </div>
        ) : (
          <p className="product-empty-state">
            No reviews yet. Be the first to review this product!
          </p>
        )}
      </div>

      {/* RECOMMENDATIONS */}
      {recommendations.length > 0 && (
        <section className="recommendation-section" style={{ marginTop: '3rem' }}>
          <div className="section-heading home-section-heading">
            <div>
              <p className="eyebrow">Curated for you</p>
              <h2>Customers also explore</h2>
            </div>
          </div>
          <div className="recommendation-grid">
            {recommendations.map((item) => (
              <article className="recommendation-card" key={item._id || item.id}>
                <Link to={`/products/${item._id || item.id}`}><img src={item.image || 'https://via.placeholder.com/240x180'} alt={item.name || 'Product'} /></Link>
                <div className="recommendation-card-body">
                  <small>{item.brand || 'ShopEase'}</small>
                  <h3>{item.name || 'Product'}</h3>
                  <strong>₹{item.price ?? 0}</strong>
                  <button onClick={() => addToCart(item, 1)} className="btn btn-primary">Add to cart</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </section>
  );
}

export default ProductDetails;
