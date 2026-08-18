import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

function Home({ addToCart }) {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    api.get('/products')
      .then((response) => setProducts(Array.isArray(response.data) ? response.data : []))
      .catch(() => setProducts([]));
  }, []);

  const featuredProducts = products.slice(0, 4);

  return (
    <section className="page-block">
      <div className="hero-banner">
        <div>
          <p className="eyebrow">Fresh picks</p>
          <h1>Shop the latest essentials</h1>
          <p>
            Discover quality products, simple checkout, and a smooth shopping
            experience.
          </p>
          <div className="hero-actions">
            <Link className="primary-btn" to="/products">
              Shop now
            </Link>
            <Link className="secondary-btn" to="/login">
              Login
            </Link>
          </div>
        </div>
      </div>

      <div className="product-grid">
        {featuredProducts.map((product) => (
          <div className="product-card" key={product._id || product.id}>
            <img src={product.image || 'https://via.placeholder.com/300x220'} alt={product.name} />
            <div className="product-card-body">
              <h3>{product.name}</h3>
              <p>{product.category}</p>
              <div className="product-meta">
                <span>₹{product.price}</span>
                <button onClick={() => addToCart(product, 1)}>Add to cart</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Home;
