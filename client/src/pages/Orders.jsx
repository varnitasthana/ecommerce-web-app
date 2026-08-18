import { useEffect, useState } from 'react';
import api from '../api';

function Orders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (!localStorage.getItem('token')) return;
    api.get('/orders/mine').then((response) => setOrders(response.data)).catch(() => setOrders([]));
  }, []);

  return (
    <section className="page-block">
      <h2>Orders</h2>
      <div className="orders-list">
        {orders.map((order) => (
          <div className="order-item" key={order.id}>
            <div>
              <h3>Order {order._id.slice(-8).toUpperCase()}</h3>
              <p>Status: {order.status}</p>
            </div>
            <strong>₹{order.total}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Orders;
