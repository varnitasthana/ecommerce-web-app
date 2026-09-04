import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FaHeart, FaRegHeart, FaShoppingCart } from 'react-icons/fa';
import api from '../services/api';

function ProductDetails({ addToCart }) {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [review, setReview] = useState({ rating: 5, title: '', comment: '' });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [saved, setSaved] = useState(false);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    api.get(`/products/${id}`)
      .then((response) => setProduct(response.data))
      .catch(() => setProduct(null));
    api.get(`/reviews/${id}`).then((response) => setReviews(response.data)).catch(() => setReviews([]));
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
      <div style={{
        padding: '4rem 2rem',
        textAlign: 'center',
        background: 'white',
        borderRadius: '12px',
        margin: '2rem'
      }}>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>Loading product details...</p>
      </div>
    );
  }

  const discount = product.compareAtPrice ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100) : 0;
  const avgRating = product.rating ? Math.round(product.rating * 10) / 10 : 4.5;
  const reviewCount = reviews.length || 128;

  return (
    <section style={{ padding: '2rem max(1.5rem, calc((100vw - 1400px) / 2))' }}>
      {/* MAIN PRODUCT DETAILS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '3rem',
        marginBottom: '3rem',
        background: 'white',
        padding: '2rem',
        borderRadius: '12px',
        border: '1px solid var(--border)'
      }}>
        {/* IMAGE SECTION */}
        <div>
          <div style={{
            position: 'relative',
            width: '100%',
            paddingBottom: '100%',
            background: 'var(--bg-secondary)',
            borderRadius: '12px',
            overflow: 'hidden',
            marginBottom: '1rem'
          }}>
            <img
              src={product.image || 'https://via.placeholder.com/500x500'}
              alt={product.name}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
            {discount > 0 && (
              <div style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'var(--danger)',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '0.9rem'
              }}>
                {discount}% OFF
              </div>
            )}
          </div>

          {/* TRUST BADGES */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.75rem'
          }}>
            <div style={{
              padding: '0.75rem',
              background: 'var(--primary-light)',
              borderRadius: '8px',
              textAlign: 'center',
              fontSize: '0.8rem',
              fontWeight: '600',
              color: 'var(--primary)'
            }}>
              <div style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>✓</div>
              Verified
            </div>
            <div style={{
              padding: '0.75rem',
              background: 'var(--primary-light)',
              borderRadius: '8px',
              textAlign: 'center',
              fontSize: '0.8rem',
              fontWeight: '600',
              color: 'var(--primary)'
            }}>
              <div style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>🔒</div>
              Secure
            </div>
            <div style={{
              padding: '0.75rem',
              background: 'var(--primary-light)',
              borderRadius: '8px',
              textAlign: 'center',
              fontSize: '0.8rem',
              fontWeight: '600',
              color: 'var(--primary)'
            }}>
              <div style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>✓</div>
              Authentic
            </div>
          </div>
        </div>

        {/* DETAILS SECTION */}
        <div>
          <div style={{ marginBottom: '1rem' }}>
            <p style={{
              margin: '0 0 0.5rem',
              fontSize: '0.85rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05rem',
              color: 'var(--text-tertiary)',
              fontWeight: '700'
            }}>
              {product.brand || 'Premium Select'} · {product.category}
            </p>
            <h1 style={{ margin: '0 0 1rem', fontSize: '1.8rem', fontWeight: '700' }}>
              {product.name}
            </h1>

            {/* RATING */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '1rem',
              paddingBottom: '1rem',
              borderBottom: '1px solid var(--border)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.1rem', color: '#ffc107' }}>★★★★★</span>
                <span style={{ fontWeight: '700' }}>{avgRating}</span>
              </div>
              <span style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
                ({reviewCount} verified reviews)
              </span>
            </div>
          </div>

          {/* PRICE */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem' }}>
              <span style={{
                fontSize: '2rem',
                fontWeight: '700',
                color: 'var(--primary)'
              }}>
                ₹{product.price}
              </span>
              {product.compareAtPrice && (
                <>
                  <span style={{
                    fontSize: '1.2rem',
                    textDecoration: 'line-through',
                    color: 'var(--text-tertiary)'
                  }}>
                    ₹{product.compareAtPrice}
                  </span>
                  <span style={{
                    background: 'var(--primary-light)',
                    color: 'var(--primary)',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontWeight: '700'
                  }}>
                    Save ₹{product.compareAtPrice - product.price}
                  </span>
                </>
              )}
            </div>
            <p style={{ margin: '0.75rem 0 0', color: 'var(--success)', fontWeight: '600', fontSize: '0.95rem' }}>
              ✓ {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
            </p>
          </div>

          {/* QUANTITY SELECTOR */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1.5rem',
            padding: '1rem',
            background: 'var(--bg-secondary)',
            borderRadius: '8px'
          }}>
            <label style={{ fontWeight: '600', minWidth: '80px' }}>Quantity:</label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              background: 'white'
            }}>
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '0.5rem 0.75rem',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '700'
                }}
              >
                −
              </button>
              <span style={{ padding: '0.5rem 1rem', fontWeight: '700', minWidth: '3rem', textAlign: 'center' }}>
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '0.5rem 0.75rem',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '700'
                }}
              >
                +
              </button>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <button
              onClick={() => addToCart(product, quantity)}
              style={{
                padding: '1rem',
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'var(--primary-dark)';
                e.target.style.boxShadow = 'var(--shadow-lg)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'var(--primary)';
                e.target.style.boxShadow = 'none';
              }}
            >
              <FaShoppingCart /> Add to Cart
            </button>
            <button
              onClick={toggleWishlist}
              style={{
                padding: '1rem 1.5rem',
                background: 'white',
                color: saved ? 'var(--danger)' : 'var(--text-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.3s ease'
              }}
              title={saved ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              {saved ? <FaHeart /> : <FaRegHeart />}
            </button>
          </div>

          {/* DELIVERY INFO */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1rem',
            padding: '1rem',
            background: 'white',
            border: '1px solid var(--border)',
            borderRadius: '8px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>🚚</div>
              <div style={{ fontSize: '0.85rem', fontWeight: '700' }}>Free Delivery</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>On orders over ₹999</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>↩️</div>
              <div style={{ fontSize: '0.85rem', fontWeight: '700' }}>Easy Returns</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>30 days guaranteed</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>🔒</div>
              <div style={{ fontSize: '0.85rem', fontWeight: '700' }}>Secure Payment</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>100% Protected</div>
            </div>
          </div>

          {message && (
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem 1rem',
              background: messageType === 'success' ? 'var(--primary-light)' : '#ffebee',
              color: messageType === 'success' ? 'var(--primary)' : 'var(--danger)',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '0.9rem'
            }}>
              {message}
            </div>
          )}
        </div>
      </div>

      {/* DESCRIPTION */}
      {product.description && (
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '12px',
          border: '1px solid var(--border)',
          marginBottom: '2rem'
        }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1.2rem' }}>Product Description</h3>
          <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            {product.description}
          </p>
        </div>
      )}

      {/* REVIEWS SECTION */}
      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '12px',
        border: '1px solid var(--border)'
      }}>
        <h2 style={{ margin: '0 0 2rem', fontSize: '1.3rem' }}>Customer Reviews</h2>

        {/* WRITE REVIEW */}
        <div style={{
          padding: '1.5rem',
          background: 'var(--bg-secondary)',
          borderRadius: '8px',
          marginBottom: '2rem'
        }}>
          <h3 style={{ margin: '0 0 1rem' }}>Share your experience</h3>
          <form className="auth-form" onSubmit={submitReview} style={{ display: 'grid', gap: '1rem' }}>
            <select
              value={review.rating}
              onChange={(event) => setReview({ ...review, rating: Number(event.target.value) })}
              style={{
                padding: '0.75rem',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                background: 'white'
              }}
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
              style={{
                padding: '0.75rem',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                background: 'white'
              }}
              required
            />
            <textarea
              placeholder="Share your experience with this product"
              value={review.comment}
              onChange={(event) => setReview({ ...review, comment: event.target.value })}
              style={{
                padding: '0.75rem',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                background: 'white',
                minHeight: '100px',
                resize: 'vertical'
              }}
              required
            />
            <button
              type="submit"
              style={{
                padding: '0.75rem 1.5rem',
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              Publish Review
            </button>
          </form>
        </div>

        {/* REVIEWS LIST */}
        {reviews.length > 0 ? (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {reviews.map((item) => (
              <div
                className="review-item"
                key={item._id}
                style={{
                  padding: '1rem',
                  border: '1px solid var(--border)',
                  borderLeft: '4px solid var(--primary)',
                  borderRadius: '8px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <strong style={{ color: '#ffc107' }}>
                    {'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)} {item.title}
                  </strong>
                  <small style={{ color: 'var(--text-tertiary)' }}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </small>
                </div>
                <p style={{ margin: '0.5rem 0 0', color: 'var(--text-secondary)' }}>
                  {item.comment}
                </p>
                <small style={{ color: 'var(--text-tertiary)' }}>
                  By {item.user?.name || 'Verified Buyer'}
                </small>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '2rem' }}>
            No reviews yet. Be the first to review this product!
          </p>
        )}
      </div>
    </section>
  );
}

export default ProductDetails;
