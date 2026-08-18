import { useEffect, useState } from 'react';
import api from '../api';

function Admin() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    api.get('/products')
      .then((response) => setProducts(Array.isArray(response.data) ? response.data : []))
      .catch(() => setProducts([]));
  }, []);

  return (
    <section className="page-block">
      <h2>Admin Panel</h2>
      <div className="admin-list">
        {products.map((product) => (
          <div className="admin-item" key={product._id || product.id}>
            <div>
              <h3>{product.name}</h3>
              <p>{product.category}</p>
            </div>
            <span>Stock: {product.stock}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Admin;
