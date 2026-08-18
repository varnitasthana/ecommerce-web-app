import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

function Products({ addToCart }) {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    api.get('/products')
      .then((response) => setProducts(Array.isArray(response.data) ? response.data : []))
      .catch(() => setProducts([]));
  }, []);

  return (
    <section className="page-block">
      <div className="section-heading">
        <h2>Products</h2>
      </div>

      <div className="product-grid">
        {products.map((product) => (
          <div className="product-card" key={product._id || product.id}>
            <img src={product.image || 'https://via.placeholder.com/300x220'} alt={product.name} />
            <div className="product-card-body">
              <h3>{product.name}</h3>
              <p>{product.category}</p>
              <div className="product-meta">
                <span>₹{product.price}</span>
                <Link to={`/products/${product._id}`}>View</Link>
              </div>
              <button className="small-btn" onClick={() => addToCart(product, 1)}>
                Add to cart
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Products;
