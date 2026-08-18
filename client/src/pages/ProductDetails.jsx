import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api';

function ProductDetails({ addToCart }) {
  const { id } = useParams();
  const [product, setProduct] = useState(null);

  useEffect(() => {
    api.get(`/products/${id}`)
      .then((response) => setProduct(response.data))
      .catch(() => setProduct(null));
  }, [id]);

  if (!product) {
    return <div className="page-block">Loading product...</div>;
  }

  return (
    <section className="page-block product-detail">
      <div className="product-detail-image">
        <img src={product.image || 'https://via.placeholder.com/500x400'} alt={product.name} />
      </div>
      <div className="product-detail-info">
        <p className="eyebrow">{product.category}</p>
        <h2>{product.name}</h2>
        <p className="price">₹{product.price}</p>
        <p>{product.description}</p>
        <div className="detail-actions">
          <button onClick={() => addToCart(product, 1)}>Add to cart</button>
          <Link className="secondary-btn" to="/products">
            Back to products
          </Link>
        </div>
      </div>
    </section>
  );
}

export default ProductDetails;
