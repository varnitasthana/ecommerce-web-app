import { useEffect, useState } from 'react';
import api from '../services/api';

const emptyForm = { name: '', description: '', price: '', compareAtPrice: '', category: '', subcategory: '', brand: '', sku: '', image: '', stock: '', active: true };

function Admin() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');
  const [overview, setOverview] = useState(null);

  const loadProducts = () => {
    api.get('/products')
      .then((response) => setProducts(Array.isArray(response.data) ? response.data : response.data.products || []))
      .catch((error) => setMessage(error.response?.data?.message || 'Could not load products'));
    api.get('/admin/overview').then(({ data }) => setOverview(data)).catch(() => setOverview(null));
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    const payload = { ...form, price: Number(form.price), compareAtPrice: Number(form.compareAtPrice || 0), stock: Number(form.stock), active: Boolean(form.active) };

    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, payload);
        setMessage('Product updated successfully');
      } else {
        await api.post('/products', payload);
        setMessage('Product created successfully');
      }
      setForm(emptyForm);
      setEditingId(null);
      loadProducts();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Could not save product');
    }
  };

  const editProduct = (product) => {
    setEditingId(product._id);
    setForm({
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      subcategory: product.subcategory || '',
      brand: product.brand || '',
      sku: product.sku || '',
      compareAtPrice: product.compareAtPrice || '',
      image: product.image || '',
      stock: product.stock,
      active: product.active !== false
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteProduct = async (id) => {
    try {
      await api.delete(`/products/${id}`);
      setMessage('Product deleted successfully');
      loadProducts();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Could not delete product');
    }
  };

  return (
    <section className="page-block">
      <h2>Admin Panel</h2>
      {overview && (
        <div className="admin-overview-grid">
          {[
            ['Customers', overview.customers],
            ['Sellers', overview.sellers],
            ['Active products', overview.activeProducts],
            ['Orders', overview.orders],
            ['Pending orders', overview.pendingOrders],
            ['Low stock', overview.lowStockProducts]
          ].map(([label, value]) => <div className="admin-stat" key={label}><strong>{value}</strong><span>{label}</span></div>)}
        </div>
      )}
      <form className="admin-form" onSubmit={handleSubmit}>
        <h3>{editingId ? 'Edit product' : 'Add product'}</h3>
        <input name="name" placeholder="Product name" value={form.name} onChange={handleChange} required />
        <textarea name="description" placeholder="Description" value={form.description} onChange={handleChange} required />
        <div className="admin-form-row">
          <input name="price" type="number" min="0" step="0.01" placeholder="Price" value={form.price} onChange={handleChange} required />
          <input name="compareAtPrice" type="number" min="0" step="0.01" placeholder="MRP / compare-at" value={form.compareAtPrice} onChange={handleChange} />
          <input name="stock" type="number" min="0" placeholder="Stock" value={form.stock} onChange={handleChange} required />
        </div>
        <div className="admin-form-row">
          <input name="category" placeholder="Category" value={form.category} onChange={handleChange} required />
          <input name="subcategory" placeholder="Subcategory" value={form.subcategory} onChange={handleChange} />
          <input name="brand" placeholder="Brand" value={form.brand} onChange={handleChange} />
        </div>
        <input name="sku" placeholder="SKU (optional)" value={form.sku} onChange={handleChange} />
        <input name="image" type="url" placeholder="Image URL" value={form.image} onChange={handleChange} />
        <div className="hero-actions">
          <button type="submit" className="primary-btn">{editingId ? 'Save changes' : 'Add product'}</button>
          {editingId && <button type="button" className="secondary-btn" onClick={() => { setEditingId(null); setForm(emptyForm); }}>Cancel</button>}
        </div>
      </form>
      {message && <p className="form-message">{message}</p>}
      <div className="admin-list">
        {products.map((product) => (
          <div className="admin-item" key={product._id || product.id}>
            <div>
              <h3>{product.name}</h3>
              <p>{product.category}</p>
            </div>
            <span>Stock: {product.stock}</span>
            <div className="admin-actions">
              <button className="secondary-btn" onClick={() => editProduct(product)}>Edit</button>
              <button className="danger-btn" onClick={() => deleteProduct(product._id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Admin;
