import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/Button';

function OrderConfirmation() {
  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const sessionId = searchParams.get('session_id');
  const orderId = searchParams.get('orderId');

  useEffect(() => {
    const loadOrder = async () => {
      try {
        let targetOrderId = orderId;

        if (!targetOrderId && sessionId) {
          const { data } = await api.get(`/payments/session?session_id=${sessionId}`);
          targetOrderId = data.orderId;
        }

        if (!targetOrderId) {
          setError('Order information not found.');
          setLoading(false);
          return;
        }

        const { data } = await api.get(`/orders/${targetOrderId}`);
        setOrder(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load order details.');
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [sessionId, orderId]);

  if (loading) {
    return (
      <section className="page-block text-center" style={{ padding: '4rem 2rem' }}>
        <div className="skeleton-card" style={{ maxWidth: '400px', margin: '0 auto', height: '200px' }} />
        <p className="muted" style={{ marginTop: '1rem' }}>Loading order confirmation...</p>
      </section>
    );
  }

  if (error || !order) {
    return (
      <section className="page-block auth-page">
        <div className="auth-box text-center">
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h2 style={{ margin: '0 0 0.5rem' }}>Order not found</h2>
          <p className="muted" style={{ marginBottom: '1.5rem' }}>{error || 'We could not find this order.'}</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button to="/orders" size="lg">View all orders</Button>
            <Button to="/products" variant="secondary" size="lg">Continue shopping</Button>
          </div>
        </div>
      </section>
    );
  }

  const subtotal = order.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
  const shipping = order.shippingCost || 0;
  const tax = order.taxAmount || 0;
  const total = order.total || subtotal + shipping + tax;

  return (
    <section className="order-confirmation-page">
      <div className="card order-confirmation-card" style={{ marginBottom: '2rem', border: 'none', background: 'linear-gradient(135deg, #e6f2ff 0%, #f0f2f5 100%)' }}>
        <div className="order-confirmation-icon">✅</div>
        <h1 className="order-confirmation-title">Order confirmed!</h1>
        <p className="muted" style={{ fontSize: '1rem', maxWidth: '500px', margin: '0 auto' }}>
          Thank you for your purchase. We've received your order and will begin processing it soon.
        </p>
        <div className="order-confirmation-actions" style={{ marginTop: '1.5rem' }}>
          <Button to={`/orders/${order._id}`} size="lg">View order details</Button>
          <Button to="/products" variant="secondary" size="lg">Continue shopping</Button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <p className="muted" style={{ marginBottom: '0.25rem' }}>Order number</p>
            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>#{order._id.slice(-8).toUpperCase()}</h3>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p className="muted" style={{ marginBottom: '0.25rem' }}>Placed on</p>
            <p style={{ margin: 0, fontWeight: '600' }}>{new Date(order.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</p>
          </div>
        </div>

        <div className="order-detail-meta-grid">
          <div className="order-detail-meta-item" style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
            <p className="order-detail-meta-label" style={{ marginBottom: '0.25rem', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05rem' }}>Status</p>
            <span className={`status status-${order.status}`} style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}>
              {order.status.replace('_', ' ')}
            </span>
          </div>
          <div className="order-detail-meta-item" style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
            <p className="order-detail-meta-label" style={{ marginBottom: '0.25rem', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05rem' }}>Payment</p>
            <span className={`status status-${order.paymentStatus}`} style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}>
              {order.paymentStatus.replace('_', ' ')}
            </span>
          </div>
          <div className="order-detail-meta-item" style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
            <p className="order-detail-meta-label" style={{ marginBottom: '0.25rem', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05rem' }}>Total paid</p>
            <p style={{ margin: 0, fontWeight: '700', fontSize: '1.1rem', color: 'var(--primary)' }}>₹{total}</p>
          </div>
        </div>

        <h3 className="order-detail-section-title">Items</h3>
        <div className="orders-list">
          {order.items?.map((item) => (
            <div key={item.product || item.sku} className="checkout-item order-detail-item">
              <div>
                <p className="order-detail-item-name">{item.name}</p>
                <p className="order-detail-item-qty">Qty: {item.quantity}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p className="order-detail-item-price">₹{item.price * item.quantity}</p>
                {item.sku && <p className="order-detail-item-sku">SKU: {item.sku}</p>}
              </div>
            </div>
          ))}
        </div>

        <div className="order-detail-shipping">
          <div>
            <p className="order-detail-meta-label" style={{ marginBottom: '0.25rem', fontSize: '0.85rem' }}>Shipping to</p>
            <p style={{ margin: 0, fontWeight: '600' }}>{order.shippingAddress?.name}</p>
            <p className="muted" style={{ fontSize: '0.9rem' }}>
              {order.shippingAddress?.street}, {order.shippingAddress?.city}, {order.shippingAddress?.postalCode}, {order.shippingAddress?.country}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p className="order-detail-meta-label" style={{ marginBottom: '0.25rem', fontSize: '0.85rem' }}>Estimated delivery</p>
            <p style={{ margin: 0, fontWeight: '600' }}>4-5 business days</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default OrderConfirmation;
