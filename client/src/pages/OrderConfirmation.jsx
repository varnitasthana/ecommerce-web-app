import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/Button';
import { formatDate, formatShortDate, formatCurrency } from '../utils/formatters';

function OrderConfirmation() {
  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);

  const orderId = searchParams.get('orderId');
  const razorpayPaymentId = searchParams.get('razorpay_payment_id');
  const razorpayOrderId = searchParams.get('razorpay_order_id');

  useEffect(() => {
    const loadOrder = async () => {
      try {
        let targetOrderId = orderId;

        if (!targetOrderId && razorpayOrderId && razorpayPaymentId) {
          setVerifying(true);
          try {
            const { data } = await api.post('/payments/verify', {
              razorpay_order_id: razorpayOrderId,
              razorpay_payment_id: razorpayPaymentId,
              razorpay_signature: searchParams.get('razorpay_signature') || ''
            });
            targetOrderId = data.orderId;
          } catch (err) {
            setError(err.response?.data?.message || 'Payment verification failed. If payment was made, please contact support.');
            setLoading(false);
            setVerifying(false);
            return;
          }
          setVerifying(false);
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
  }, [orderId, razorpayOrderId, razorpayPaymentId, searchParams]);

  if (loading || verifying) {
    return (
      <section className="page-block text-center" style={{ padding: '4rem 2rem' }}>
        <div className="skeleton-card" style={{ maxWidth: '400px', margin: '0 auto', height: '200px' }} />
        <p className="muted" style={{ marginTop: '1rem' }}>{verifying ? 'Verifying payment...' : 'Loading order confirmation...'}</p>
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

  const estimatedDelivery = useMemo(() => {
    const base = new Date(order.createdAt || Date.now());
    const days = order.estimatedDeliveryDays || 4;
    const delivery = new Date(base);
    delivery.setDate(base.getDate() + days);
    return delivery;
  }, [order]);

  const formattedDelivery = estimatedDelivery ? formatShortDate(estimatedDelivery) : 'N/A';

  return (
    <section className="order-confirmation-page">
      <div className="card order-confirmation-card" style={{ marginBottom: '2rem', border: 'none', background: 'linear-gradient(135deg, #e6f2ff 0%, #f0f2f5 100%)' }}>
        <div style={{ fontSize: '4rem', marginBottom: '0.75rem', animation: 'bounceIn 0.6s ease' }}>🎉</div>
        <h1 className="order-confirmation-title">Order confirmed!</h1>
        <p className="muted" style={{ fontSize: '1rem', maxWidth: '500px', margin: '0 auto' }}>
          Thank you for your purchase. We've received your order and will begin processing it soon.
        </p>
        <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', display: 'inline-flex', alignItems: 'center', gap: '0.75rem', boxShadow: 'var(--shadow-sm)' }}>
          <span style={{ fontSize: '1.5rem' }}>🚚</span>
          <div style={{ textAlign: 'left' }}>
            <p style={{ margin: 0, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>Estimated Delivery</p>
            <p style={{ margin: '0.25rem 0 0', fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{formattedDelivery}</p>
          </div>
        </div>
        <div className="order-confirmation-actions" style={{ marginTop: '1.5rem' }}>
          {order._id && <Button to={`/orders/${order._id}`} size="lg">Track Order</Button>}
          <Button to="/products" variant="secondary" size="lg">Continue Shopping</Button>
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
            <p style={{ margin: 0, fontWeight: '600' }}>{formatDate(order.createdAt)}</p>
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
            <p style={{ margin: 0, fontWeight: '600' }}>{formattedDelivery}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default OrderConfirmation;
