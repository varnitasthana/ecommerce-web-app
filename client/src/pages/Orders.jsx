import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/Button';

function Orders({ clearCart }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('token')) return;
    if (new URLSearchParams(window.location.search).get('payment') === 'success') clearCart();
    api.get('/orders/mine?limit=20')
      .then((response) => { setOrders(response.data.orders || []); setLoading(false); })
      .catch(() => { setOrders([]); setLoading(false); });
  }, [clearCart]);

  if (loading) {
    return (
      <section className="page-block" style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div className="skeleton-card" style={{ height: '200px', marginBottom: '1rem' }} />
        <div className="skeleton-card" style={{ height: '200px' }} />
      </section>
    );
  }

  return (
    <section className="page-block" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="section-heading home-section-heading">
        <div>
          <p className="eyebrow">Order history</p>
          <h2>My Orders</h2>
        </div>
      </div>
      {!orders.length ? (
        <div className="card text-center" style={{ padding: '3rem 2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
          <h3 style={{ margin: '0 0 0.5rem', color: 'var(--text-primary)' }}>No orders yet</h3>
          <p className="muted" style={{ marginBottom: '1.5rem' }}>When you place an order, it will appear here.</p>
          <Button to="/products" size="lg">Start Shopping</Button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {orders.map((order) => (
            <Link to={`/orders/${order._id}`} key={order._id} className="product-card-link">
              <div className="card order-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', cursor: 'pointer', textDecoration: 'none', color: 'inherit' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '200px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--primary-light)',
                    color: 'var(--primary)',
                    display: 'grid',
                    placeItems: 'center',
                    fontWeight: '700',
                    fontSize: '1.2rem',
                    flexShrink: 0
                  }}>
                    {order.items?.length || 0}
                  </div>
                  <div>
                    <h3 style={{ margin: '0 0 0.25rem', fontSize: '1rem' }}>Order #{order._id.slice(-8).toUpperCase()}</h3>
                    <p className="muted" style={{ fontSize: '0.85rem' }}>Placed {new Date(order.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <span className={`status status-${order.status}`}>{order.status.replace('_', ' ')}</span>
                  <strong style={{ fontSize: '1.1rem', minWidth: '80px', textAlign: 'right' }}>₹{order.total}</strong>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

export default Orders;
