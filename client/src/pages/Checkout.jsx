import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

function Checkout({ cart, totalPrice, clearCart }) {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [address, setAddress] = useState({ name: '', street: '', city: '', postalCode: '', country: '' });

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
      await api.post('/orders', {
        items: cart.map((item) => ({ product: item._id || item.id, quantity: item.quantity })),
        shippingAddress: address
      });
      clearCart();
      navigate('/orders');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Could not place order');
    }
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

        <form onSubmit={handlePlaceOrder} className="auth-form">
          <input name="name" placeholder="Full name" value={address.name} onChange={handleChange} required />
          <input name="street" placeholder="Street address" value={address.street} onChange={handleChange} required />
          <input name="city" placeholder="City" value={address.city} onChange={handleChange} required />
          <input name="postalCode" placeholder="Postal code" value={address.postalCode} onChange={handleChange} required />
          <input name="country" placeholder="Country" value={address.country} onChange={handleChange} required />
          <button type="submit" className="primary-btn">
          Place order
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
