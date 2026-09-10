import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/Button';
import Breadcrumb from '../components/Breadcrumb';
import ShareButton from '../components/ShareButton';
import OrderTracking from '../components/OrderTracking';
import { formatDate, formatShortDate, formatCurrency } from '../utils/formatters';

const ORDER_STEPS = [
  { key: 'pending_payment', label: 'Placed', icon: '📝' },
  { key: 'confirmed', label: 'Confirmed', icon: '✅' },
  { key: 'processing', label: 'Processing', icon: '⚙️' },
  { key: 'packed', label: 'Packed', icon: '📦' },
  { key: 'shipped', label: 'Shipped', icon: '🚚' },
  { key: 'out_for_delivery', label: 'Out for delivery', icon: '🛵' },
  { key: 'delivered', label: 'Delivered', icon: '🏠' }
];

const CANCELABLE_STATUSES = ['pending_payment', 'confirmed', 'processing'];

function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [returnReason, setReturnReason] = useState('');

  const loadOrder = useCallback(async () => {
    try {
      const { data } = await api.get(`/orders/${id}`);
      setOrder(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load order details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const handleCancel = async () => {
    try {
      await api.post(`/orders/${id}/cancel`, { reason: 'Customer requested cancellation' });
      setActionMessage('Order cancelled successfully.');
      loadOrder();
    } catch (err) {
      setActionMessage(err.response?.data?.message || 'Could not cancel order.');
    }
  };

  const handleRefund = async () => {
    try {
      await api.post(`/orders/${id}/refund`, { reason: 'Customer requested refund' });
      setActionMessage('Refund processed successfully.');
      loadOrder();
    } catch (err) {
      setActionMessage(err.response?.data?.message || 'Could not process refund.');
    }
  };

  const handleReturn = async () => {
    try {
      const items = order.items.map((item) => ({ product: item.product, name: item.name, price: item.price, quantity: item.quantity, reason: returnReason }));
      await api.post('/returns', { orderId: id, items, reason: returnReason });
      setActionMessage('Return request submitted successfully.');
      setShowReturnForm(false);
      loadOrder();
    } catch (err) {
      setActionMessage(err.response?.data?.message || 'Could not submit return request.');
    }
  };

  const estimatedDelivery = useMemo(() => {
    if (!order) return null;
    if (order.estimatedDelivery) return new Date(order.estimatedDelivery);
    const base = new Date(order.createdAt || Date.now());
    const days = order.maxDeliveryDays || 4;
    const delivery = new Date(base);
    delivery.setDate(base.getDate() + days);
    return delivery;
  }, [order]);

  const formattedDelivery = estimatedDelivery ? formatShortDate(estimatedDelivery) : 'N/A';

  const isDelivered = order?.status === 'delivered';
  const isCancelled = order?.status === 'cancelled';
  const isReturn = ['return_requested', 'return_approved', 'returned'].includes(order?.status);

  const currentStepIndex = ORDER_STEPS.findIndex((s) => s.key === order?.status);
  const progressWidth = useMemo(() => {
    if (isCancelled || isReturn) return 0;
    if (isDelivered) return 100;
    if (currentStepIndex < 0) return 0;
    return ((currentStepIndex + 1) / ORDER_STEPS.length) * 100;
  }, [order?.status, currentStepIndex, isDelivered, isCancelled, isReturn]);

  if (loading) {
    return (
      <section className="page-block" style={{ maxWidth: '960px', margin: '0 auto' }}>
        <div className="skeleton-card" style={{ height: '300px', marginBottom: '1.5rem' }} />
        <div className="skeleton-card" style={{ height: '200px' }} />
      </section>
    );
  }

  if (error || !order) {
    return (
      <section className="page-block auth-page">
        <div className="auth-box text-center order-detail-not-found">
          <div className="order-detail-not-found-icon">⚠️</div>
          <h2 className="order-detail-not-found-title">Order not found</h2>
          <p className="muted" style={{ marginBottom: '1.5rem' }}>{error || 'We could not find this order.'}</p>
          <Button to="/orders" size="lg">Back to orders</Button>
        </div>
      </section>
    );
  }

  const subtotal = order.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
  const shipping = order.shippingCost || 0;
  const tax = order.taxAmount || 0;
  const total = order.total || subtotal + shipping + tax;
  const canCancel = CANCELABLE_STATUSES.includes(order.status);
  const canRefund = order.paymentStatus === 'paid' && order.refundStatus === 'none';
  const canReturn = order.status === 'delivered' && order.paymentStatus === 'paid' && !isReturn;

  return (
    <section className="order-detail-page">
      <Breadcrumb items={[{ label: 'Home', path: '/' }, { label: 'Orders', path: '/orders' }, { label: `Order #${order._id.slice(-8).toUpperCase()}` }]} />

      <div className="order-detail-header">
        <div className="order-detail-header-info">
          <p className="muted" style={{ marginBottom: '0.25rem' }}>Order details</p>
          <h2 className="order-detail-id">#{order._id.slice(-8).toUpperCase()}</h2>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <ShareButton title={`Order #${order._id.slice(-8).toUpperCase()}`} url={window.location.href} description={`Track your order #${order._id.slice(-8).toUpperCase()} on ShopEase`} />
          <Button to="/orders" variant="secondary" size="sm">← All orders</Button>
        </div>
      </div>

      {actionMessage && (
        <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>
          {actionMessage}
        </div>
      )}

      {!isCancelled && !isReturn && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 className="order-detail-section-title" style={{ marginBottom: '1.5rem' }}>Order Progress</h3>
          <div className="order-timeline">
            <div className="order-timeline-line" />
            <div className="order-timeline-line-fill" style={{ width: `${progressWidth}%` }} />
            {ORDER_STEPS.map((step, idx) => {
              const isDone = idx <= currentStepIndex && !isCancelled && !isReturn;
              const isActive = idx === currentStepIndex && !isCancelled && !isReturn;
              return (
                <div
                  key={step.key}
                  className={`order-timeline-step ${isActive ? 'order-timeline-step-active' : ''} ${isDone ? 'order-timeline-step-done' : ''}`}
                >
                  <div className="order-timeline-dot">{isDone && !isActive ? '✓' : step.icon}</div>
                  <span className="order-timeline-label">{step.label}</span>
                </div>
              );
            })}
          </div>

          {estimatedDelivery && (
            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <div className={`order-delivery-badge ${estimatedDelivery < new Date() && !isDelivered ? 'order-delivery-badge-overdue' : ''}`}>
                🚚 {isDelivered ? 'Delivered' : `Estimated delivery by ${formattedDelivery}`}
              </div>
              {!isDelivered && estimatedDelivery < new Date() && (
                <p className="muted" style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>This date has passed. Please contact support if you haven't received your order.</p>
              )}
            </div>
          )}
        </div>
      )}

      <OrderTracking orderId={id} initialOrder={order} />

      <div className="card">
        <div className="order-detail-meta-grid">
          <div className="order-detail-meta-item">
            <p className="order-detail-meta-label">Order status</p>
            <span className={`status status-${order.status}`}>{order.status.replace('_', ' ')}</span>
          </div>
          <div className="order-detail-meta-item">
            <p className="order-detail-meta-label">Payment</p>
            <span className={`status status-${order.paymentStatus}`}>{order.paymentStatus.replace('_', ' ')}</span>
          </div>
          <div className="order-detail-meta-item">
            <p className="order-detail-meta-label">Placed on</p>
            <p className="order-detail-meta-value">{formatDate(order.createdAt)}</p>
          </div>
          {isDelivered && order.deliveredAt && (
            <div className="order-detail-meta-item">
              <p className="order-detail-meta-label">Delivered on</p>
              <p className="order-detail-meta-value">{formatDate(order.deliveredAt)}</p>
            </div>
          )}
          {order.paidAt && (
            <div className="order-detail-meta-item">
              <p className="order-detail-meta-label">Paid on</p>
              <p className="order-detail-meta-value">{formatDate(order.paidAt)}</p>
            </div>
          )}
          <div className="order-detail-meta-item">
            <p className="order-detail-meta-label">Total paid</p>
            <p className="order-detail-meta-value-lg">₹{total}</p>
          </div>
        </div>

        <h3 className="order-detail-section-title">Items</h3>
        <div className="orders-list">
          {order.items?.map((item) => {
            const itemId = item.product || item.sku;
            if (!itemId) return null;
            return (
              <Link to={`/products/${itemId}`} key={itemId} className="order-detail-item-link">
                <div className="order-detail-item" style={{ cursor: 'pointer', textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                    {item.product?.image && (
                      <div style={{ width: '64px', height: '64px', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--bg-primary)', border: '1px solid var(--border)', flexShrink: 0 }}>
                        <img src={item.product.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
                    <div>
                      <p className="order-detail-item-name">{item.name}</p>
                      <p className="order-detail-item-qty">Qty: {item.quantity}</p>
                      {item.sku && <p className="order-detail-item-sku">SKU: {item.sku}</p>}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p className="order-detail-item-price">₹{item.price * item.quantity}</p>
                    <p className="order-detail-item-sku">₹{item.price} each</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="order-detail-shipping">
          <div>
            <p className="order-detail-meta-label" style={{ marginBottom: '0.25rem', fontSize: '0.85rem' }}>Shipping address</p>
            <p style={{ margin: 0, fontWeight: '600' }}>{order.shippingAddress?.name}</p>
            <p className="muted" style={{ fontSize: '0.9rem' }}>
              {order.shippingAddress?.street}, {order.shippingAddress?.city}, {order.shippingAddress?.postalCode}, {order.shippingAddress?.country}
            </p>
            {order.shippingAddress?.phone && <p className="muted" style={{ fontSize: '0.9rem' }}>Phone: {order.shippingAddress.phone}</p>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <p className="order-detail-meta-label" style={{ marginBottom: '0.25rem', fontSize: '0.85rem' }}>Estimated delivery</p>
            <p style={{ margin: 0, fontWeight: '600' }}>{formattedDelivery}</p>
            <p className="muted" style={{ fontSize: '0.8rem' }}>{order.maxDeliveryDays || 4} business days</p>
          </div>
        </div>

        {subtotal > 0 && (
          <div className="order-summary-grid" style={{ display: 'grid', gap: '0.75rem', maxWidth: '320px', marginLeft: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span className="muted">Subtotal</span>
              <span>₹{subtotal}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span className="muted">Shipping</span>
              <span>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
            </div>
            {tax > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span className="muted">Tax</span>
                <span>₹{tax}</span>
              </div>
            )}
            {order.discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--success)' }}>
                <span>Discount</span>
                <span>-₹{order.discountAmount}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 700, borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
              <span>Total</span>
              <span style={{ color: 'var(--primary)' }}>₹{total}</span>
            </div>
          </div>
        )}
      </div>

      {(canCancel || canRefund) && (
        <div className="card order-detail-actions" style={{ marginTop: '2rem' }}>
          {canCancel && (
            <Button onClick={handleCancel} variant="danger" size="sm">Cancel order</Button>
          )}
          {canRefund && (
            <Button onClick={handleRefund} variant="outline" size="sm">Request refund</Button>
          )}
        </div>
      )}

      {canReturn && (
        <div className="card" style={{ marginTop: '2rem' }}>
          {!showReturnForm ? (
            <Button onClick={() => setShowReturnForm(true)} variant="outline" size="sm">Request Return</Button>
          ) : (
            <div>
              <h4 style={{ margin: '0 0 1rem' }}>Request Return</h4>
              <textarea
                className="return-form-textarea"
                placeholder="Please describe the reason for return"
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                required
              />
              <div style={{ display: 'flex', gap: '1rem' }}>
                <Button onClick={handleReturn} size="sm">Submit Return Request</Button>
                <Button variant="secondary" size="sm" onClick={() => setShowReturnForm(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <Link to="/orders" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>← Back to all orders</Link>
      </div>
    </section>
  );
}

export default OrderDetail;
