import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';

function ProductDetails({ addToCart }) {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [review, setReview] = useState({ rating: 5, title: '', comment: '' });
  const [message, setMessage] = useState('');
  const [saved, setSaved] = useState(false);

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
    } catch (error) {
      setMessage(error.response?.data?.message || 'Log in to save products');
    }
  };

  const submitReview = async (event) => {
    event.preventDefault();
    try {
      await api.post(`/reviews/${id}`, review);
      setMessage('Review published');
      setReview({ rating: 5, title: '', comment: '' });
      const response = await api.get(`/reviews/${id}`);
      setReviews(response.data);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Log in to publish a review');
    }
  };

  if (!product) {
    return <div className="page-block">Loading product...</div>;
  }

  return (
    <section className="page-block product-detail">
      <div className="product-detail-image">
        <img src={product.image || 'https://via.placeholder.com/500x400'} alt={product.name} />
      </div>
      <div className="product-detail-info">
        <p className="eyebrow">{product.brand} · {product.category}</p>
        <h2>{product.name}</h2>
        <p className="price">₹{product.price}</p>
        <p>{product.rating > 0 ? `★ ${product.rating} from ${product.reviewCount} reviews` : 'New arrival'}</p>
        <p>Delivery in {product.deliveryDays || 3} days · Free returns</p>
        <p>{product.description}</p>
        <div className="detail-actions">
          <button onClick={() => addToCart(product, 1)}>Add to cart</button>
          <button className="secondary-btn" onClick={toggleWishlist}>{saved ? 'Saved' : '♡ Wishlist'}</button>
          <Link className="secondary-btn" to="/products">
            Back to products
          </Link>
        </div>
      </div>
      <div className="review-panel">
        <h3>Customer reviews</h3>
        <form className="auth-form" onSubmit={submitReview}>
          <select value={review.rating} onChange={(event) => setReview({ ...review, rating: Number(event.target.value) })}>
            {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} stars</option>)}
          </select>
          <input placeholder="Review title" value={review.title} onChange={(event) => setReview({ ...review, title: event.target.value })} required />
          <textarea placeholder="Share your experience" value={review.comment} onChange={(event) => setReview({ ...review, comment: event.target.value })} required />
          <button type="submit">Publish review</button>
        </form>
        {message && <p className="form-message">{message}</p>}
        <div className="review-list">
          {reviews.map((item) => <article className="review-item" key={item._id}><strong>★ {item.rating} · {item.title}</strong><p>{item.comment}</p><small>By {item.user?.name || 'Shopper'}</small></article>)}
        </div>
      </div>
    </section>
  );
}

export default ProductDetails;
