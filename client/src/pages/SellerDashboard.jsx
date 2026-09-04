import { useEffect, useState } from 'react';
import api from '../services/api';

function SellerDashboard() {
  const [applications, setApplications] = useState([]);
  const [products, setProducts] = useState([]);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ name: '', description: '', category: 'Electronics', brand: '', price: '', stock: '', sku: '' });

  useEffect(() => {
    api.get('/sellers/my-applications').then(({ data }) => setApplications(data)).catch(() => setApplications([]));
    api.get('/sellers/products').then(({ data }) => setProducts(data.products || [])).catch(() => setProducts([]));
  }, []);

  const handleChange = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const createProduct = async (event) => {
    event.preventDefault();
    setMessage('');
    try {
      const { data } = await api.post('/sellers/products', { ...form, price: Number(form.price), stock: Number(form.stock) });
      setProducts((current) => [data.product, ...current]);
      setForm({ name: '', description: '', category: 'Electronics', brand: '', price: '', stock: '', sku: '' });
      setMessage('Product submitted to your seller catalog.');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to create product.');
    }
  };

  return (
    <section className="page-block">
      <p className="eyebrow">Seller workspace</p>
      <h1>Partner dashboard</h1>
      <p className="muted">Manage onboarding, publish products, and keep your seller inventory visible in one workspace.</p>
      <div className="seller-workspace-grid">
        <form className="seller-product-form" onSubmit={createProduct}>
          <h2>Add product</h2>
          <input name="name" placeholder="Product name" value={form.name} onChange={handleChange} required />
          <textarea name="description" placeholder="Product description" value={form.description} onChange={handleChange} required />
          <div className="seller-form-row">
            <select name="category" value={form.category} onChange={handleChange}><option>Electronics</option><option>Fashion</option><option>Home & Kitchen</option><option>Beauty</option><option>Sports & Fitness</option><option>Grocery</option></select>
            <input name="brand" placeholder="Brand" value={form.brand} onChange={handleChange} required />
          </div>
          <div className="seller-form-row">
            <input name="price" type="number" min="0" step="0.01" placeholder="Price" value={form.price} onChange={handleChange} required />
            <input name="stock" type="number" min="0" placeholder="Stock" value={form.stock} onChange={handleChange} required />
          </div>
          <input name="sku" placeholder="SKU" value={form.sku} onChange={handleChange} required />
          <button type="submit">Publish product</button>
          {message && <p className="form-message">{message}</p>}
        </form>
        <div className="seller-products-panel">
          <div className="section-heading"><h2>Your catalog</h2><span>{products.length} products</span></div>
          {products.length ? products.map((product) => (
            <article className="seller-product-row" key={product._id}>
              <div><strong>{product.name}</strong><p className="muted">{product.brand} · {product.category}</p></div>
              <div><strong>₹{product.price}</strong><p className="muted">{product.stock} in stock</p></div>
            </article>
          )) : <p className="empty-state">Your approved catalog will appear here.</p>}
        </div>
      </div>
      <div className="orders-list">
        {applications.length ? applications.map((application) => (
          <article className="order-item" key={application._id}>
            <div><h3>{application.brandName}</h3><p className="muted">{application.category}</p></div>
            <span className={`status status-${application.status}`}>{application.status}</span>
          </article>
        )) : <p className="empty-state">No seller applications are linked to this account yet.</p>}
      </div>
    </section>
  );
}

export default SellerDashboard;
