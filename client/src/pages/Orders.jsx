const orders = [
  { id: 1, orderId: 'ORD-1001', total: 2500, status: 'Delivered' },
  { id: 2, orderId: 'ORD-1002', total: 1500, status: 'Processing' },
  { id: 3, orderId: 'ORD-1003', total: 3600, status: 'Shipped' }
];

function Orders() {
  return (
    <section className="page-block">
      <h2>Orders</h2>
      <div className="orders-list">
        {orders.map((order) => (
          <div className="order-item" key={order.id}>
            <div>
              <h3>{order.orderId}</h3>
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
