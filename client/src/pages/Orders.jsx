import { useEffect, useState } from 'react';
import api from '../api';

function Orders({ clearCart }) {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (!localStorage.getItem('token')) return;
    if (new URLSearchParams(window.location.search).get('payment') === 'success') clearCart();
    api.get('/orders/mine').then((response) => setOrders(response.data)).catch(() => setOrders([]));
  }, [clearCart]);

  return (
    <section className="page-block">
      <h2>Orders</h2>
      <div className="orders-list">
        {orders.map((order) => (
          <div className="order-item" key={order._id}>
            <div>
              <h3>Order {order._id.slice(-8).toUpperCase()}</h3>
              <p className="muted">Placed {new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="order-summary"><span className={`status status-${order.status}`}>{order.status.replace('_', ' ')}</span><strong>₹{order.total}</strong></div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Orders;
