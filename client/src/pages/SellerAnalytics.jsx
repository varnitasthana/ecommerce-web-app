import { useEffect, useState, useMemo } from 'react';
import api from '../services/api';
import Button from '../components/Button';
import { formatDate, formatCurrency } from '../utils/formatters';

function SellerAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderFilter, setOrderFilter] = useState('all');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/sellers/analytics').catch(() => ({ data: null })),
      api.get('/sellers/orders?limit=20').catch(() => ({ data: [] })),
      api.get('/sellers/products').catch(() => ({ data: { products: [] } }))
    ]).then(([analyticsRes, ordersRes, productsRes]) => {
      setAnalytics(analyticsRes.data);
      setOrders(ordersRes.data.orders || ordersRes.data || []);
      setProducts(productsRes.data.products || productsRes.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filteredOrders = orderFilter === 'all' ? orders : orders.filter((o) => o.status === orderFilter);

  const statusBreakdown = useMemo(() => {
    const counts = {};
    orders.forEach((o) => {
      counts[o.status] = (counts[o.status] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [orders]);

  const topProducts = useMemo(() => {
    return [...products].sort((a, b) => (b.revenue || 0) - (a.revenue || 0) || (b.unitsSold || 0) - (a.unitsSold || 0)).slice(0, 5);
  }, [products]);

  const maxRevenue = topProducts.length ? Math.max(...topProducts.map((p) => p.revenue || 0)) : 1;

  if (loading) {
    return (
      <section className="page-block">
        <h1>Seller Analytics</h1>
        <div className="loading-grid">
          {[1, 2, 3, 4].map((item) => <div className="skeleton-card" key={item} />)}
        </div>
      </section>
    );
  }

  const stats = analytics || { totalRevenue: 0, totalOrders: 0, totalSales: 0, pendingOrders: 0, lowStockProducts: [] };

  return (
    <section className="page-block">
      <div className="section-heading home-section-heading">
        <div>
          <p className="eyebrow">Performance overview</p>
          <h1>Seller Analytics</h1>
        </div>
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Top Products</h3>
          {topProducts.length === 0 ? (
            <p className="muted">No product data available yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {topProducts.map((product) => {
                const revenue = product.revenue || 0;
                const units = product.unitsSold || 0;
                return (
                  <div key={product._id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem', maxWidth: '70%' }}>{product.name}</div>
                       <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{units} sold · {formatCurrency(revenue)}</div>
                    </div>
                    <div style={{ height: '8px', borderRadius: 'var(--radius-full)', background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 'var(--radius-full)', background: 'linear-gradient(90deg, var(--primary) 0%, var(--primary-dark) 100%)', width: `${Math.max((revenue / maxRevenue) * 100, 5)}%`, transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Order Status Breakdown</h3>
          {statusBreakdown.length === 0 ? (
            <p className="muted">No order data yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {statusBreakdown.map(([status, count]) => {
                const total = orders.length || 1;
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={status}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{status.replace('_', ' ')}</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>{count} ({pct}%)</span>
                    </div>
                    <div style={{ height: '8px', borderRadius: 'var(--radius-full)', background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 'var(--radius-full)', background: 'var(--secondary)', width: `${pct}%`, transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Recent Orders</h3>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            {['all', 'pending_payment', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map((s) => (
              <button key={s} onClick={() => setOrderFilter(s)} style={{ padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: orderFilter === s ? 'var(--primary)' : 'var(--bg-secondary)', color: orderFilter === s ? 'white' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s ease' }}>{s === 'all' ? 'All' : s.replace('_', ' ')}</button>
            ))}
          </div>
          {filteredOrders.length === 0 ? (
            <p className="muted">No orders found.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {filteredOrders.slice(0, 10).map((order) => (
                <div key={order._id || order.id} className="seller-product-row" style={{ padding: '0.75rem 1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>Order #{(order._id || order.id)?.slice(-8).toUpperCase()}</p>
                       <p className="muted" style={{ fontSize: '0.75rem' }}>{formatDate(order.createdAt)}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: 0, fontWeight: 700, color: 'var(--primary)', fontSize: '0.9rem' }}>₹{order.total ?? 0}</p>
                      <span className={`status status-${order.status}`} style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}>{order.status?.replace('_', ' ') || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Low Stock Alerts</h3>
          {(stats.lowStockProducts || []).length === 0 ? (
            <p className="muted">No low stock products.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {(stats.lowStockProducts || []).map((product) => (
                <div key={product._id || product.id} className="seller-product-row" style={{ padding: '0.75rem 1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{product.name || 'Product'}</p>
                      <p className="muted" style={{ fontSize: '0.75rem' }}>{product.category || 'N/A'} · {product.brand || 'N/A'}</p>
                    </div>
                    <span className="status status-pending" style={{ fontSize: '0.8rem' }}>{product.stock ?? 0} left</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default SellerAnalytics;
