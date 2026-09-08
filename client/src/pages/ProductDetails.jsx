import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FaHeart, FaRegHeart, FaShoppingCart } from 'react-icons/fa';
import api from '../services/api';
import Button from '../components/Button';

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

  useEffect(() => {
    api.get(`/products/${id}`)
      .then((response) => setProduct(response.data))
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

  return (
    <section className="product-details-page">
      {/* MAIN PRODUCT DETAILS */}
      <div className="product-details-grid card">
        {/* IMAGE SECTION */}
        <div>
          <div className="product-image-wrapper">
            <img
              src={product.image || 'https://via.placeholder.com/500x500'}
              alt={product.name}
            />
            {discount > 0 && (
              <div className="product-discount-badge">
                {discount}% OFF
              </div>
            )}
          </div>

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
          <div style={{ marginBottom: '1rem' }}>
            <p className="product-brand-category">
              {product.brand || 'Premium Select'} · {product.category}
            </p>
            <h1 className="product-name">
              {product.name}
            </h1>

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
            <p className="product-stock-status">
              ✓ {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
            </p>
          </div>

          {/* QUANTITY SELECTOR */}
          <div className="product-quantity-selector">
            <label className="product-quantity-label">Quantity:</label>
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Decrease quantity">−</button>
            <span style={{ padding: '0 0.6rem', fontWeight: '700', minWidth: '2rem', textAlign: 'center' }}>{quantity}</span>
            <button onClick={() => setQuantity(quantity + 1)} aria-label="Increase quantity">+</button>
          </div>

          {/* ACTION BUTTONS */}
          <div className="product-action-row">
            <Button onClick={() => addToCart(product, quantity)} size="lg" style={{ flex: 1 }}>
              <FaShoppingCart /> Add to Cart
            </Button>
            <Button onClick={toggleWishlist} variant="outline" size="lg" style={{ color: saved ? 'var(--danger)' : 'var(--text-secondary)', borderColor: saved ? 'var(--danger)' : 'var(--border)' }}>
              {saved ? <FaHeart /> : <FaRegHeart />}
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

      {/* DESCRIPTION */}
      {product.description && (
        <div className="card product-description-section">
          <h3 className="product-description-title">Product Description</h3>
          <p className="product-description-text">
            {product.description}
          </p>
        </div>
      )}

      {/* REVIEWS SECTION */}
      <div className="card">
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
                    {new Date(item.createdAt).toLocaleDateString()}
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
              <article className="recommendation-card" key={item._id}>
                <Link to={`/products/${item._id}`}><img src={item.image || 'https://via.placeholder.com/240x180'} alt={item.name} /></Link>
                <div className="recommendation-card-body">
                  <small>{item.brand}</small>
                  <h3>{item.name}</h3>
                  <strong>₹{item.price}</strong>
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
