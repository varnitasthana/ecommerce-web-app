import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

function OrderTracking({ orderId, initialOrder }) {
  const [order, setOrder] = useState(initialOrder || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const intervalRef = useRef(null);

  const loadOrder = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/orders/${orderId}`);
      setOrder(data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update order status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!orderId) return;
    loadOrder();
    intervalRef.current = window.setInterval(loadOrder, 30000);
    return () => window.clearInterval(intervalRef.current);
  }, [orderId]);

  if (!order) {
    return (
      <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
        {loading ? 'Updating order status...' : 'Order not found.'}
      </div>
    );
  }

  const progressWidth = (() => {
    if (order.status === 'delivered') return 100;
    if (['cancelled', 'return_requested', 'return_approved', 'returned'].includes(order.status)) return 0;
    const steps = ['pending_payment', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered'];
    const currentIdx = steps.indexOf(order.status);
    if (currentIdx < 0) return 0;
    return ((currentIdx + 1) / steps.length) * 100;
  })();

  return (
    <div className="order-tracking-card" style={{ padding: '1.25rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: '1.5rem' }}>
      <div className="order-tracking-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <p style={{ margin: '0 0 0.25rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>Shipment Provider</p>
          <h3 className="order-tracking-id" style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{order.shippingProvider || 'Standard Shipping'}</h3>
          {order.trackingNumber && <p className="order-tracking-status" style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Tracking: {order.trackingNumber}</p>}
        </div>
        {order.trackingUrl && (
          <Button to={order.trackingUrl} target="_blank" rel="noopener noreferrer" variant="secondary" size="sm">Track Package ↗</Button>
        )}
      </div>

      <div style={{ position: 'relative', marginBottom: '1rem' }}>
        <div style={{ height: '3px', background: 'var(--border)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
          <div style={{ height: '100%', background: 'var(--primary)', borderRadius: 'var(--radius-full)', width: `${progressWidth}%`, transition: 'width 0.4s ease' }} />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <p style={{ margin: '0 0 0.25rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>Current Status</p>
          <span className={`status status-${order.status}`} style={{ display: 'inline-block' }}>{order.status.replace('_', ' ')}</span>
        </div>
        <div>
          <p style={{ margin: '0 0 0.25rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>Estimated Delivery</p>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            {order.estimatedDelivery ? new Date(order.estimatedDelivery).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : 'N/A'}
          </p>
        </div>
      </div>

      {error && <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--danger)' }}>{error}</p>}
    </div>
  );
}

export default OrderTracking;
