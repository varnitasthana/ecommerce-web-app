import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { formatCurrency } from '../utils/formatters';

function SellerDashboard() {
  const [applications, setApplications] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ name: '', description: '', category: 'Electronics', brand: '', price: '', stock: '', sku: '' });

  useEffect(() => {
    api.get('/sellers/my-applications').then(({ data }) => setApplications(data)).catch(() => setApplications([]));
    api.get('/sellers/products').then(({ data }) => setProducts(data.products || [])).catch(() => setProducts([]));
    api.get('/sellers/orders?limit=20').then(({ data }) => setOrders(data.orders || data || [])).catch(() => setOrders([]));
    api.get('/sellers/analytics').then(({ data }) => setAnalytics(data)).catch(() => setAnalytics(null));
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

  const stats = analytics || { totalRevenue: 0, totalOrders: 0, totalSales: 0, pendingOrders: 0, lowStockProducts: [] };

  return (
    <section className="page-block">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <p className="eyebrow">Seller workspace</p>
          <h1>Partner dashboard</h1>
          <p className="muted">Manage onboarding, publish products, and keep your seller inventory visible in one workspace.</p>
        </div>
        <Link to="/seller/analytics" className="primary-btn">View Analytics</Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {[
           { label: 'Total Revenue', value: formatCurrency(stats.totalRevenue || 0), color: 'var(--primary)' },
          { label: 'Total Orders', value: stats.totalOrders || 0, color: 'var(--success)' },
          { label: 'Products Sold', value: stats.totalSales || 0, color: 'var(--secondary)' },
          { label: 'Pending Orders', value: stats.pendingOrders || 0, color: 'var(--danger)' }
        ].map((stat) => (
          <div key={stat.label} className="card" style={{ padding: '1.5rem', borderLeft: `4px solid ${stat.color}` }}>
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>{stat.label}</p>
            <p style={{ margin: 0, fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{stat.value}</p>
          </div>
        ))}
      </div>

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
            <article className="seller-product-row" key={product._id || product.id}>
              <div><strong>{product.name || 'Product'}</strong><p className="muted">{product.brand || 'ShopEase'} · {product.category || 'N/A'}</p></div>
              <div><strong>₹{product.price ?? 0}</strong><p className="muted">{product.stock ?? 0} in stock</p></div>
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
