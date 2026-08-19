import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

function Checkout({ cart, totalPrice }) {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [processing, setProcessing] = useState(false);
  const [address, setAddress] = useState({ name: '', street: '', city: '', postalCode: '', country: '' });
  const paymentCancelled = new URLSearchParams(window.location.search).get('payment') === 'cancelled';

  const handleChange = (event) => {
    setAddress({ ...address, [event.target.name]: event.target.value });
  };

  const handlePlaceOrder = async (event) => {
    event.preventDefault();

    if (!localStorage.getItem('token')) {
      navigate('/login');
      return;
    }

    try {
      setProcessing(true);
      const response = await api.post('/payments/create-checkout-session', {
        items: cart.map((item) => ({ product: item._id || item.id, quantity: item.quantity })),
        shippingAddress: address
      });
      window.location.assign(response.data.checkoutUrl);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Could not place order');
      setProcessing(false);
    }
  };

  return (
    <section className="page-block">
      <h2>Checkout</h2>
      {paymentCancelled && <p className="form-message">Payment was cancelled. Your cart is still here.</p>}
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

        <form onSubmit={handlePlaceOrder} className="auth-form">
          <input name="name" placeholder="Full name" value={address.name} onChange={handleChange} required />
          <input name="street" placeholder="Street address" value={address.street} onChange={handleChange} required />
          <input name="city" placeholder="City" value={address.city} onChange={handleChange} required />
          <input name="postalCode" placeholder="Postal code" value={address.postalCode} onChange={handleChange} required />
          <input name="country" placeholder="Country" value={address.country} onChange={handleChange} required />
          <button type="submit" className="primary-btn">
          {processing ? 'Opening secure payment...' : 'Pay securely'}
          </button>
        </form>
        {message && <p className="form-message">{message}</p>}
        <Link className="secondary-btn" to="/cart">
          Back to cart
        </Link>
      </div>
    </section>
  );
}

export default Checkout;
