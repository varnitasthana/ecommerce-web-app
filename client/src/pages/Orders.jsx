import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/Button';
import Breadcrumb from '../components/Breadcrumb';
import { Skeleton } from '../components/Skeleton';
import { formatShortDate } from '../utils/formatters';

const STATUS_TABS = [
  { label: 'All', value: '' },
  { label: 'To Pay', value: 'pending_payment' },
  { label: 'Processing', value: 'confirmed' },
  { label: 'Shipped', value: 'shipped' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Cancelled', value: 'cancelled' }
];

const CANCELABLE_STATUSES = ['pending_payment', 'confirmed', 'processing'];

function Orders({ clearCart, addToCart }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('');
  const navigate = useNavigate();

  const loadOrders = async (status = '') => {
    setLoading(true);
    try {
      const { data } = await api.get(`/orders?limit=50${status ? `&status=${status}` : ''}`);
      setOrders(data.orders || []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      setLoading(false);
      return;
    }
    if (new URLSearchParams(window.location.search).get('payment') === 'success') clearCart();
    loadOrders(activeTab);
  }, [activeTab, clearCart]);

  const handleReorder = async (order) => {
    try {
      order.items?.forEach((item) => {
        const product = {
          _id: item.product,
          name: item.name,
          price: item.price,
          image: item.product?.image || 'https://via.placeholder.com/100x100',
          quantity: item.quantity
        };
        addToCart(product, item.quantity);
      });
      navigate('/cart');
    } catch (err) {
      // handled by toast
    }
  };

  const formatDate = (date) => formatShortDate(date);

  const getEstimatedDelivery = (order) => {
    if (order.estimatedDelivery) {
      return formatDate(order.estimatedDelivery);
    }
    const base = new Date(order.createdAt || Date.now());
    const days = order.maxDeliveryDays || 4;
    const delivery = new Date(base);
    delivery.setDate(base.getDate() + days);
    return formatDate(delivery);
  };

  if (loading) {
    return (
      <section className="page-block" style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <Breadcrumb items={[{ label: 'Home', path: '/' }, { label: 'My Orders' }]} />
        <div className="section-heading home-section-heading">
          <div>
            <p className="eyebrow">Order history</p>
            <h2>My Orders</h2>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} height="40px" style={{ width: '100px', borderRadius: 'var(--radius-full)' }} />)}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[1, 2, 3].map((i) => <Skeleton key={i} height="140px" />)}
        </div>
      </section>
    );
  }

  return (
    <section className="page-block" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <Breadcrumb items={[{ label: 'Home', path: '/' }, { label: 'My Orders' }]} />
      <div className="section-heading home-section-heading">
        <div>
          <p className="eyebrow">Order history</p>
          <h2>My Orders</h2>
        </div>
      </div>

      <div className="orders-tabs" style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            className={`orders-tab ${activeTab === tab.value ? 'orders-tab-active' : ''}`}
            onClick={() => setActiveTab(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {!orders.length ? (
        <div className="card text-center" style={{ padding: '4rem 2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📦</div>
          <h3 style={{ margin: '0 0 0.5rem', color: 'var(--text-primary)' }}>No orders yet</h3>
          <p className="muted" style={{ marginBottom: '1.5rem' }}>When you place an order, it will appear here.</p>
          <Button to="/products" size="lg">Start Shopping</Button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {orders.map((order) => (
            <div key={order._id} className="card order-card" style={{ cursor: 'default' }}>
              <div className="order-card-main">
                <div className="order-card-thumb">
                  {order.thumbnail ? (
                    <img src={order.thumbnail} alt="" />
                  ) : (
                    <span className="order-card-thumb-placeholder">📦</span>
                  )}
                </div>
                <div className="order-card-info">
                  <div className="order-card-header">
                    <Link to={`/orders/${order._id}`} className="order-card-id" style={{ textDecoration: 'none', color: 'inherit' }}>
                      Order #{order._id.slice(-8).toUpperCase()}
                    </Link>
                    <span className={`status status-${order.status}`}>{order.status.replace('_', ' ')}</span>
                  </div>
                  <p className="muted" style={{ fontSize: '0.85rem', margin: '0.25rem 0 0.5rem' }}>
                    {formatDate(order.createdAt)} · {order.itemCount || order.items?.length || 0} item(s)
                  </p>
                  <p className="muted" style={{ fontSize: '0.8rem', margin: 0 }}>
                    🚚 Estimated delivery: <strong style={{ color: 'var(--text-primary)' }}>{getEstimatedDelivery(order)}</strong>
                  </p>
                </div>
                <div className="order-card-actions">
                  <strong className="order-card-total">₹{order.total}</strong>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <Button to={`/orders/${order._id}`} variant="secondary" size="sm">View</Button>
                    {CANCELABLE_STATUSES.includes(order.status) && (
                      <Button variant="outline" size="sm" onClick={() => handleReorder(order)}>Reorder</Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default Orders;
