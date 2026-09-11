import { useEffect, useState } from 'react';
import api from '../services/api';
import Button from '../components/Button';
import CloudinaryUpload from '../components/CloudinaryUpload';
import { formatDate } from '../utils/formatters';

const emptyProductForm = { name: '', description: '', price: '', compareAtPrice: '', category: '', subcategory: '', brand: '', sku: '', image: '', stock: '', active: true };

function Admin() {
  const [tab, setTab] = useState('overview');
  const [products, setProducts] = useState([]);
  const [overview, setOverview] = useState(null);
  const [orders, setOrders] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [categories, setCategories] = useState([]);
  const [returns, setReturns] = useState([]);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState(emptyProductForm);
  const [editingId, setEditingId] = useState(null);
  const [orderFilter, setOrderFilter] = useState({ status: '', page: 1 });
  const [orderPagination, setOrderPagination] = useState({ page: 1, totalPages: 1 });

  const loadProducts = () => {
    api.get('/products?limit=50')
      .then((response) => setProducts(Array.isArray(response.data) ? response.data : response.data.products || []))
      .catch(() => setProducts([]));
  };

  const loadOverview = () => {
    api.get('/admin/overview').then(({ data }) => setOverview(data)).catch(() => setOverview(null));
  };

  const loadOrders = (page = 1) => {
    const params = new URLSearchParams({ page, limit: 20 });
    if (orderFilter.status) params.set('status', orderFilter.status);
    api.get(`/admin/orders?${params}`)
      .then(({ data }) => {
        setOrders(data.orders || []);
        setOrderPagination({ page: data.pagination.page, totalPages: data.pagination.totalPages });
      })
      .catch(() => setOrders([]));
  };

  const loadCoupons = () => {
    api.get('/admin/coupons').then(({ data }) => setCoupons(data.coupons || [])).catch(() => setCoupons([]));
  };

  const loadCategories = () => {
    api.get('/categories').then(({ data }) => setCategories(data.categories || [])).catch(() => setCategories([]));
  };

  const loadReturns = () => {
    api.get('/admin/returns').then(({ data }) => setReturns(data.returns || [])).catch(() => setReturns([]));
  };

  useEffect(() => {
    loadOverview();
    loadProducts();
  }, []);

  useEffect(() => {
    if (tab === 'orders') loadOrders(orderFilter.page);
    if (tab === 'coupons') loadCoupons();
    if (tab === 'categories') loadCategories();
    if (tab === 'returns') loadReturns();
  }, [tab, orderFilter.page]);

  const handleProductSubmit = async (event) => {
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
      setForm(emptyProductForm);
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
    setTab('products');
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

  const updateOrderStatus = async (orderId, status, extra = {}) => {
    try {
      await api.put(`/admin/orders/${orderId}`, { status, ...extra });
      loadOrders(orderFilter.page);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Could not update order');
    }
  };

  const [couponForm, setCouponForm] = useState({ code: '', description: '', type: 'percentage', value: '', minOrderAmount: 0, maxUsageCount: '', usageLimitPerUser: 1, startDate: '', endDate: '' });
  const [editingCouponId, setEditingCouponId] = useState(null);

  const handleCouponSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    try {
      const payload = { ...couponForm, value: Number(couponForm.value), minOrderAmount: Number(couponForm.minOrderAmount || 0), maxUsageCount: couponForm.maxUsageCount ? Number(couponForm.maxUsageCount) : null, usageLimitPerUser: Number(couponForm.usageLimitPerUser) };
      if (editingCouponId) {
        await api.put(`/admin/coupons/${editingCouponId}`, payload);
        setMessage('Coupon updated successfully');
      } else {
        await api.post('/admin/coupons', payload);
        setMessage('Coupon created successfully');
      }
      setCouponForm({ code: '', description: '', type: 'percentage', value: '', minOrderAmount: 0, maxUsageCount: '', usageLimitPerUser: 1, startDate: '', endDate: '' });
      setEditingCouponId(null);
      loadCoupons();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Could not save coupon');
    }
  };

  const editCoupon = (coupon) => {
    setEditingCouponId(coupon._id);
    setCouponForm({ code: coupon.code, description: coupon.description, type: coupon.type, value: String(coupon.value), minOrderAmount: String(coupon.minOrderAmount || 0), maxUsageCount: coupon.maxUsageCount ? String(coupon.maxUsageCount) : '', usageLimitPerUser: String(coupon.usageLimitPerUser || 1), startDate: coupon.startDate?.slice(0, 10) || '', endDate: coupon.endDate?.slice(0, 10) || '' });
    setTab('coupons');
  };

  const deleteCoupon = async (id) => {
    try {
      await api.delete(`/admin/coupons/${id}`);
      setMessage('Coupon deactivated');
      loadCoupons();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Could not delete coupon');
    }
  };

  const [categoryForm, setCategoryForm] = useState({ name: '', description: '', image: '', sortOrder: 0 });
  const [editingCategoryId, setEditingCategoryId] = useState(null);

  const handleCategorySubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    try {
      const payload = { ...categoryForm, sortOrder: Number(categoryForm.sortOrder) };
      if (editingCategoryId) {
        await api.put(`/admin/categories/${editingCategoryId}`, payload);
        setMessage('Category updated successfully');
      } else {
        await api.post('/admin/categories', payload);
        setMessage('Category created successfully');
      }
      setCategoryForm({ name: '', description: '', image: '', sortOrder: 0 });
      setEditingCategoryId(null);
      loadCategories();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Could not save category');
    }
  };

  const deleteCategory = async (id) => {
    try {
      await api.delete(`/admin/categories/${id}`);
      setMessage('Category deactivated');
      loadCategories();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Could not delete category');
    }
  };

  const updateReturnStatus = async (returnId, status, notes = '') => {
    try {
      await api.put(`/admin/returns/${returnId}`, { status, notes });
      loadReturns();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Could not update return');
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'products', label: 'Products' },
    { id: 'orders', label: 'Orders' },
    { id: 'coupons', label: 'Coupons' },
    { id: 'categories', label: 'Categories' },
    { id: 'returns', label: 'Returns' }
  ];

  return (
    <section className="page-block">
      <h2>Admin Panel</h2>
      
      <div className="admin-tabs">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={tab === t.id ? 'active' : ''}>{t.label}</button>
        ))}
      </div>

      {message && <p className="form-message" style={{ marginBottom: '1rem' }}>{message}</p>}

      {tab === 'overview' && overview && (
        <div className="admin-overview-grid">
          {[
            ['Customers', overview.customers],
            ['Sellers', overview.sellers],
            ['Active products', overview.activeProducts],
            ['Orders', overview.orders],
            ['Pending orders', overview.pendingOrders],
            ['Low stock', overview.lowStockProducts],
            ['Pending applications', overview.pendingSellerApplications]
          ].map(([label, value]) => <div className="admin-stat" key={label}><strong>{value}</strong><span>{label}</span></div>)}
        </div>
      )}

      {tab === 'products' && (
        <div>
          <form className="admin-form" onSubmit={handleProductSubmit}>
            <h3>{editingId ? 'Edit product' : 'Add product'}</h3>
            <input name="name" placeholder="Product name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <textarea name="description" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
            <div className="admin-form-row">
              <input name="price" type="number" min="0" step="0.01" placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
              <input name="compareAtPrice" type="number" min="0" step="0.01" placeholder="MRP / compare-at" value={form.compareAtPrice} onChange={(e) => setForm({ ...form, compareAtPrice: e.target.value })} />
              <input name="stock" type="number" min="0" placeholder="Stock" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} required />
            </div>
            <div className="admin-form-row">
              <input name="category" placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required />
              <input name="subcategory" placeholder="Subcategory" value={form.subcategory} onChange={(e) => setForm({ ...form, subcategory: e.target.value })} />
              <input name="brand" placeholder="Brand" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
            </div>
            <input name="sku" placeholder="SKU (optional)" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            <CloudinaryUpload value={form.image} onChange={(url) => setForm({ ...form, image: url })} label="Product image" />
            <div className="hero-actions">
              <button type="submit" className="primary-btn">{editingId ? 'Save changes' : 'Add product'}</button>
              {editingId && <button type="button" className="secondary-btn" onClick={() => { setEditingId(null); setForm(emptyProductForm); }}>Cancel</button>}
            </div>
          </form>
          <div className="admin-list" style={{ marginTop: '2rem' }}>
            {products.map((product) => (
              <div className="admin-item" key={product._id || product.id}>
                <div>
                  <h3>{product.name || 'Product'}</h3>
                  <p>{product.category || 'N/A'} · {product.brand || 'N/A'}</p>
                </div>
                <span>Stock: {product.stock ?? 0}</span>
                <div className="admin-actions">
                  <button className="secondary-btn" onClick={() => editProduct(product)}>Edit</button>
                  <button className="danger-btn" onClick={() => deleteProduct(product._id || product.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'orders' && (
        <div>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <select value={orderFilter.status} onChange={(e) => setOrderFilter({ ...orderFilter, status: e.target.value, page: 1 })} style={{ padding: '0.6rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
              <option value="">All statuses</option>
              {['pending_payment', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'return_requested', 'return_approved', 'returned'].map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
            <Button size="sm" onClick={() => loadOrders(1)}>Apply filter</Button>
          </div>
          <div className="admin-list">
            {orders.map((order) => (
              <div className="admin-item" key={order._id} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h3>Order #{(order._id || order.id)?.slice(-8).toUpperCase()}</h3>
                    <p className="muted">{order.user?.name || 'Guest'} · {formatDate(order.createdAt)}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className={`status status-${order.status}`}>{order.status?.replace('_', ' ') || 'N/A'}</span>
                    <strong>₹{order.total ?? 0}</strong>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <select value={order.status} onChange={(e) => updateOrderStatus(order._id, e.target.value)} style={{ padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg-secondary)', fontSize: '0.85rem' }}>
                    {['confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'].map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                  {order.status === 'shipped' && (
                    <input placeholder="Tracking #" defaultValue={order.trackingNumber || ''} onBlur={(e) => updateOrderStatus(order._id, 'shipped', { trackingNumber: e.target.value })} style={{ padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.85rem', width: '180px' }} />
                  )}
                </div>
              </div>
            ))}
          </div>
          {orderPagination.totalPages > 1 && (
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', justifyContent: 'center' }}>
              <Button variant="secondary" size="sm" disabled={orderFilter.page <= 1} onClick={() => { setOrderFilter({ ...orderFilter, page: orderFilter.page - 1 }); }}>Previous</Button>
              <span style={{ alignSelf: 'center', fontWeight: 600 }}>Page {orderFilter.page} of {orderPagination.totalPages}</span>
              <Button variant="secondary" size="sm" disabled={orderFilter.page >= orderPagination.totalPages} onClick={() => { setOrderFilter({ ...orderFilter, page: orderFilter.page + 1 }); }}>Next</Button>
            </div>
          )}
        </div>
      )}

      {tab === 'coupons' && (
        <div>
          <form className="admin-form" onSubmit={handleCouponSubmit} style={{ marginBottom: '2rem' }}>
            <h3>{editingCouponId ? 'Edit coupon' : 'Create coupon'}</h3>
            <div className="admin-form-row">
              <input name="code" placeholder="Coupon code" value={couponForm.code} onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })} required />
              <select name="type" value={couponForm.type} onChange={(e) => setCouponForm({ ...couponForm, type: e.target.value })}>
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
                <option value="free_shipping">Free Shipping</option>
              </select>
            </div>
            <input name="description" placeholder="Description" value={couponForm.description} onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })} required />
            <div className="admin-form-row">
              <input name="value" type="number" min="0" placeholder={couponForm.type === 'percentage' ? 'Discount %' : 'Discount ₹'} value={couponForm.value} onChange={(e) => setCouponForm({ ...couponForm, value: e.target.value })} required />
              <input name="minOrderAmount" type="number" min="0" placeholder="Min order ₹" value={couponForm.minOrderAmount} onChange={(e) => setCouponForm({ ...couponForm, minOrderAmount: e.target.value })} />
            </div>
            <div className="admin-form-row">
              <input name="maxUsageCount" type="number" min="1" placeholder="Max usage (optional)" value={couponForm.maxUsageCount} onChange={(e) => setCouponForm({ ...couponForm, maxUsageCount: e.target.value })} />
              <input name="startDate" type="date" value={couponForm.startDate} onChange={(e) => setCouponForm({ ...couponForm, startDate: e.target.value })} />
              <input name="endDate" type="date" value={couponForm.endDate} onChange={(e) => setCouponForm({ ...couponForm, endDate: e.target.value })} required />
            </div>
            <div className="hero-actions">
              <button type="submit" className="primary-btn">{editingCouponId ? 'Save changes' : 'Create coupon'}</button>
              {editingCouponId && <button type="button" className="secondary-btn" onClick={() => { setEditingCouponId(null); setCouponForm({ code: '', description: '', type: 'percentage', value: '', minOrderAmount: 0, maxUsageCount: '', usageLimitPerUser: 1, startDate: '', endDate: '' }); }}>Cancel</button>}
            </div>
          </form>
          <div className="admin-list">
            {coupons.map((coupon) => (
              <div className="admin-item" key={coupon._id}>
                <div>
                  <h3>{coupon.code}</h3>
                  <p className="muted">{coupon.description} · {coupon.type} · Used {coupon.usageCount}/{coupon.maxUsageCount || '∞'}</p>
                </div>
                <div className="admin-actions">
                  <button className="secondary-btn" onClick={() => editCoupon(coupon)}>Edit</button>
                  <button className="danger-btn" onClick={() => deleteCoupon(coupon._id)}>Deactivate</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'categories' && (
        <div>
          <form className="admin-form" onSubmit={handleCategorySubmit} style={{ marginBottom: '2rem' }}>
            <h3>{editingCategoryId ? 'Edit category' : 'Create category'}</h3>
            <div className="admin-form-row">
              <input name="name" placeholder="Category name" value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} required />
              <input name="sortOrder" type="number" placeholder="Sort order" value={categoryForm.sortOrder} onChange={(e) => setCategoryForm({ ...categoryForm, sortOrder: e.target.value })} />
            </div>
            <input name="description" placeholder="Description" value={categoryForm.description} onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })} />
            <CloudinaryUpload value={categoryForm.image} onChange={(url) => setCategoryForm({ ...categoryForm, image: url })} label="Category image" folder="shopease/categories" />
            <div className="hero-actions">
              <button type="submit" className="primary-btn">{editingCategoryId ? 'Save changes' : 'Create category'}</button>
              {editingCategoryId && <button type="button" className="secondary-btn" onClick={() => { setEditingCategoryId(null); setCategoryForm({ name: '', description: '', image: '', sortOrder: 0 }); }}>Cancel</button>}
            </div>
          </form>
          <div className="admin-list">
            {categories.map((cat) => (
              <div className="admin-item" key={cat._id}>
                <div>
                  <h3>{cat.name}</h3>
                  <p className="muted">{cat.description || 'No description'}</p>
                </div>
                <div className="admin-actions">
                  <button className="secondary-btn" onClick={() => { setEditingCategoryId(cat._id); setCategoryForm({ name: cat.name, description: cat.description || '', image: cat.image || '', sortOrder: String(cat.sortOrder || 0) }); setTab('categories'); }}>Edit</button>
                  <button className="danger-btn" onClick={() => deleteCategory(cat._id)}>Deactivate</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'returns' && (
        <div className="admin-list">
          {returns.map((ret) => (
            <div className="admin-item" key={ret._id} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3>Return #{ret._id.slice(-8).toUpperCase()}</h3>
                  <p className="muted">Order #{ret.order?._id?.slice(-8).toUpperCase()} · {ret.user?.name || 'User'} · ₹{ret.refundAmount || 0}</p>
                </div>
                <span className={`status status-${ret.status}`}>{ret.status}</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <select value={ret.status} onChange={(e) => updateReturnStatus(ret._id, e.target.value)} style={{ padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg-secondary)', fontSize: '0.85rem' }}>
                  <option value="pending">Pending</option>
                  <option value="approved">Approve</option>
                  <option value="rejected">Reject</option>
                  <option value="processed">Process Refund</option>
                  <option value="completed">Complete</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default Admin;
