import { Link } from 'react-router-dom';

function Checkout({ cart, totalPrice }) {
  const handlePlaceOrder = () => {
    alert('Order placed successfully!');
  };

  return (
    <section className="page-block">
      <h2>Checkout</h2>
      <div className="checkout-box">
        <div>
          {cart.length === 0 ? (
            <p>Your cart is empty.</p>
          ) : (
            cart.map((item) => (
              <div key={item._id || item.id} className="checkout-item">
                <span>{item.name}</span>
                <span>{item.quantity} x ₹{item.price}</span>
              </div>
            ))
          )}
        </div>

        <div className="checkout-total">
          <strong>Total: ₹{totalPrice}</strong>
        </div>

        <button onClick={handlePlaceOrder} className="primary-btn">
          Place order
        </button>
        <Link className="secondary-btn" to="/cart">
          Back to cart
        </Link>
      </div>
    </section>
  );
}

export default Checkout;
