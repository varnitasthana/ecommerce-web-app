import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

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
    <section className="page-block">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Saved for later</p>
          <h2>My wishlist</h2>
        </div>
        <span>{products.length} saved</span>
      </div>
      {!products.length && <p className="empty-state">Your wishlist is waiting for its first find.</p>}
      <div className="product-grid">
        {products.map((product) => (
          <article className="product-card" key={product._id}>
            <img src={product.image || 'https://via.placeholder.com/300x220'} alt={product.name} />
            <div className="product-card-body">
              <p className="eyebrow">{product.brand}</p>
              <h3>{product.name}</h3>
              <div className="product-meta"><span>₹{product.price}</span><Link to={`/products/${product._id}`}>View</Link></div>
              <div className="hero-actions">
                <button onClick={() => addToCart(product)}>Add to cart</button>
                <button className="secondary-btn" onClick={() => remove(product._id)}>Remove</button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default Wishlist;