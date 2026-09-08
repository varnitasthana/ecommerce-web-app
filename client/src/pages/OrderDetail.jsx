import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/Button';

function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');

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

  if (loading) {
    return (
      <section className="page-block" style={{ maxWidth: '900px', margin: '0 auto' }}>
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
  const canCancel = ['pending_payment', 'confirmed', 'processing'].includes(order.status);
  const canRefund = order.paymentStatus === 'paid' && order.refundStatus === 'none';

  return (
    <section className="order-detail-page">
      <div className="order-detail-header">
        <div className="order-detail-header-info">
          <p className="muted" style={{ marginBottom: '0.25rem' }}>Order details</p>
          <h2 className="order-detail-id">#{order._id.slice(-8).toUpperCase()}</h2>
        </div>
        <Button to="/orders" variant="secondary" size="sm">← All orders</Button>
      </div>

      {actionMessage && (
        <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>
          {actionMessage}
        </div>
      )}

      <div style={{ display: 'grid', gap: '2rem' }}>
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
              <p className="order-detail-meta-value">{new Date(order.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
            </div>
            <div className="order-detail-meta-item">
              <p className="order-detail-meta-label">Total paid</p>
              <p className="order-detail-meta-value-lg">₹{total}</p>
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
              <p className="order-detail-meta-label" style={{ marginBottom: '0.25rem', fontSize: '0.85rem' }}>Shipping address</p>
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

        {(canCancel || canRefund) && (
          <div className="card order-detail-actions">
            {canCancel && (
              <Button onClick={handleCancel} variant="danger" size="sm">Cancel order</Button>
            )}
            {canRefund && (
              <Button onClick={handleRefund} variant="outline" size="sm">Request refund</Button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default OrderDetail;
