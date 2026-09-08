import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaLock,
  FaTruck,
  FaUndoAlt,
  FaCheckCircle,
  FaQrcode
} from 'react-icons/fa';
import api from '../services/api';
import Button from '../components/Button';

const PAYMENT_METHODS = [
  {
    id: 'upi',
    label: 'UPI / GPay / PhonePe / BHIM / Navi Pay',
    description: 'Pay instantly using any UPI app',
    icon: '💳',
    options: ['Google Pay', 'PhonePe', 'BHIM', 'Navi Pay', 'Any UPI App']
  },
  {
    id: 'card',
    label: 'Credit / Debit Card',
    description: 'Visa, Mastercard, RuPay, Amex',
    icon: '🏦',
    options: ['Visa', 'Mastercard', 'RuPay', 'Amex']
  },
  {
    id: 'wallet',
    label: 'Wallets',
    description: 'Paytm, Amazon Pay, MobiKwik',
    icon: '📱',
    options: ['Paytm', 'Amazon Pay', 'MobiKwik']
  },
  {
    id: 'cod',
    label: 'Cash on Delivery',
    description: 'Pay when you receive the order',
    icon: '💵',
    options: []
  }
];

function Checkout({ cart, totalPrice }) {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [processing, setProcessing] = useState(false);
  const [address, setAddress] = useState({ name: '', street: '', city: '', postalCode: '', country: '' });
  const [errors, setErrors] = useState({});
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [upiId, setUpiId] = useState('');
  const [upiQR, setUpiQR] = useState('');
  const [showUPIQR, setShowUPIQR] = useState(false);
  const [cardDetails, setCardDetails] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const [demoMode, setDemoMode] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const paymentCancelled = new URLSearchParams(window.location.search).get('payment') === 'cancelled';

  useEffect(() => {
    const checkStripe = async () => {
      try {
        await api.get('/health');
        setDemoMode(false);
      } catch {
        setDemoMode(true);
      }
    };
    checkStripe();
  }, []);

  const generateUPIQR = () => {
    const amount = calculateTotal();
    const upiString = `upi://pay?pa=shopease@upi&pn=ShopEase&am=${amount}&cu=INR&tr=${Date.now()}`;
    setUpiQR(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiString)}`);
    setShowUPIQR(true);
  };

  const validateAddress = () => {
    const next = {};
    if (!address.name.trim()) next.name = 'Full name is required';
    if (!address.street.trim()) next.street = 'Street address is required';
    if (!address.city.trim()) next.city = 'City is required';
    if (!address.postalCode.trim()) next.postalCode = 'Postal code is required';
    if (!address.country.trim()) next.country = 'Country is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const validatePayment = () => {
    if (paymentMethod === 'upi') {
      if (!upiId.trim()) {
        setMessage('Please enter your UPI ID');
        setMessageType('error');
        return false;
      }
    }
    if (paymentMethod === 'card') {
      if (!cardDetails.number || !cardDetails.expiry || !cardDetails.cvv || !cardDetails.name) {
        setMessage('Please fill in all card details');
        setMessageType('error');
        return false;
      }
    }
    return true;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setAddress((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const calculateTotal = () => {
    const subtotal = totalPrice || 0;
    const shipping = subtotal > 999 ? 0 : 49;
    const tax = Math.round(subtotal * 0.18);
    return subtotal + shipping + tax;
  };

  const handlePlaceOrder = async (event) => {
    event.preventDefault();
    setMessage('');
    setMessageType('');

    if (!localStorage.getItem('token')) {
      navigate('/login');
      return;
    }

    if (!validateAddress()) return;
    if (!validatePayment()) return;

    setProcessing(true);
    try {
      const items = cart.map((item) => ({ product: item._id || item.id, quantity: item.quantity }));

      if (demoMode || paymentMethod === 'upi' || paymentMethod === 'cod' || paymentMethod === 'wallet') {
        const { data } = await api.post('/payments/demo-checkout', {
          items,
          shippingAddress: address,
          paymentMethod
        });
        setOrderSuccess(data);
        navigate(`/order-confirmation?orderId=${data.orderId}&paymentMethod=${paymentMethod}`);
      } else {
        const { data } = await api.post('/payments/create-checkout-session', {
          items,
          shippingAddress: address,
          paymentMethod
        });
        if (data.checkoutUrl) {
          window.location.assign(data.checkoutUrl);
        } else {
          navigate(`/order-confirmation?orderId=${data.orderId}&paymentMethod=${paymentMethod}`);
        }
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Could not place order. Please try again.');
      setMessageType('error');
      setProcessing(false);
    }
  };

  const subtotal = totalPrice || 0;
  const shipping = subtotal > 999 ? 0 : 49;
  const tax = Math.round(subtotal * 0.18);
  const total = calculateTotal();

  if (orderSuccess) {
    return (
      <section className="page-block" style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div className="card text-center" style={{ padding: '3rem 2rem' }}>
          <FaCheckCircle style={{ fontSize: '4rem', color: 'var(--success)', marginBottom: '1rem' }} />
          <h2 style={{ margin: '0 0 0.5rem' }}>Order placed successfully!</h2>
          <p className="muted" style={{ marginBottom: '1.5rem' }}>Order ID: #{orderSuccess.orderId.slice(-8).toUpperCase()}</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button to={`/orders/${orderSuccess.orderId}`} size="lg">View Order</Button>
            <Button to="/products" variant="secondary" size="lg">Continue Shopping</Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="checkout-page">
      <div style={{ marginBottom: '2rem' }}>
        <h2>Checkout</h2>
        <p className="muted">Complete your order securely</p>
      </div>

      {paymentCancelled && (
        <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
          Payment was cancelled. Your cart is still here. You can try again or continue shopping.
        </div>
      )}
      {message && (
        <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: '1.5rem' }}>
          {message}
        </div>
      )}
      {demoMode && (
        <div className="alert" style={{ marginBottom: '1.5rem', background: 'var(--warning-light)', color: 'var(--warning)' }}>
          Demo mode: payments will be simulated without real processing.
        </div>
      )}

      <form onSubmit={handlePlaceOrder}>
        <div className="checkout-grid">
          <div className="checkout-main">
            {/* SHIPPING ADDRESS */}
            <div className="card">
              <h3 className="checkout-card-title">Shipping Address</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input id="name" name="name" placeholder="Your full name" value={address.name} onChange={handleChange} required />
                  {errors.name && <small className="form-error">{errors.name}</small>}
                </div>
                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input id="phone" name="phone" placeholder="+91 98765 43210" value={address.phone || ''} onChange={handleChange} />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="street">Street Address</label>
                <input id="street" name="street" placeholder="House no., building, street, area" value={address.street} onChange={handleChange} required />
                {errors.street && <small className="form-error">{errors.street}</small>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label htmlFor="city">City</label>
                  <input id="city" name="city" placeholder="City" value={address.city} onChange={handleChange} required />
                  {errors.city && <small className="form-error">{errors.city}</small>}
                </div>
                <div className="form-group">
                  <label htmlFor="postalCode">Postal Code</label>
                  <input id="postalCode" name="postalCode" placeholder="400001" value={address.postalCode} onChange={handleChange} required />
                  {errors.postalCode && <small className="form-error">{errors.postalCode}</small>}
                </div>
                <div className="form-group">
                  <label htmlFor="country">Country</label>
                  <input id="country" name="country" placeholder="India" value={address.country} onChange={handleChange} required />
                  {errors.country && <small className="form-error">{errors.country}</small>}
                </div>
              </div>
            </div>

            {/* PAYMENT METHOD */}
            <div className="card">
              <h3 className="checkout-card-title">Payment Method</h3>
              <div style={{ display: 'grid', gap: '1rem' }}>
                {PAYMENT_METHODS.map((method) => (
                  <label
                    key={method.id}
                    className={`checkout-payment-option ${paymentMethod === method.id ? 'checkout-payment-option-selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.id}
                      checked={paymentMethod === method.id}
                      onChange={(e) => {
                        setPaymentMethod(e.target.value);
                        setShowUPIQR(false);
                        setMessage('');
                      }}
                      style={{ width: '20px', height: '20px', accentColor: 'var(--primary)' }}
                    />
                    <span className="checkout-payment-icon">{method.icon}</span>
                    <div className="checkout-payment-info">
                      <p className="checkout-payment-label">{method.label}</p>
                      <p className="checkout-payment-desc">{method.description}</p>
                    </div>
                  </label>
                ))}
              </div>

              {paymentMethod === 'upi' && (
                <div className="checkout-payment-details">
                  <h4>UPI Payment</h4>
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>Select UPI App</label>
                      <div className="checkout-upi-apps">
                        {['Google Pay', 'PhonePe', 'BHIM', 'Navi Pay'].map((app) => (
                          <button
                            key={app}
                            type="button"
                            onClick={() => {
                              setUpiId(`${app.toLowerCase().replace(' ', '')}@${app === 'Navi Pay' ? 'navipay' : app.toLowerCase().replace(' ', '')}`);
                              setShowUPIQR(false);
                            }}
                            className={`checkout-upi-app-btn ${upiId.includes(app.toLowerCase().replace(' ', '')) ? 'checkout-upi-app-btn-selected' : ''}`}
                          >
                            {app}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="form-group">
                      <label htmlFor="upiId">Or enter UPI ID</label>
                      <input
                        id="upiId"
                        placeholder="yourname@upi"
                        value={upiId}
                        onChange={(e) => { setUpiId(e.target.value); setShowUPIQR(false); }}
                        className="form-input"
                      />
                    </div>
                    {upiId && !showUPIQR && (
                      <Button type="button" variant="secondary" size="sm" onClick={generateUPIQR}>
                        <FaQrcode /> Generate QR Code
                      </Button>
                    )}
                    {showUPIQR && upiQR && (
                      <div className="checkout-qr-container">
                        <img src={upiQR} alt="UPI QR Code" className="checkout-qr-image" />
                        <p className="checkout-qr-text">Scan QR to pay ₹{total}</p>
                        <p className="checkout-qr-upi">Or pay to: {upiId}</p>
                        <Button type="button" variant="outline" size="sm" onClick={() => setShowUPIQR(false)} style={{ marginTop: '0.5rem' }}>
                          Change UPI ID
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {paymentMethod === 'card' && (
                <div className="checkout-payment-details">
                  <h4>Card Details</h4>
                  <div className="checkout-card-details-grid">
                    <div className="form-group">
                      <label htmlFor="cardNumber">Card Number</label>
                      <input
                        id="cardNumber"
                        placeholder="1234 5678 9012 3456"
                        value={cardDetails.number}
                        onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                        maxLength={19}
                        className="form-input"
                      />
                    </div>
                    <div className="checkout-card-details-row">
                      <div className="form-group">
                        <label htmlFor="expiry">Expiry Date</label>
                        <input
                          id="expiry"
                          placeholder="MM/YY"
                          value={cardDetails.expiry}
                          onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                          maxLength={5}
                          className="form-input"
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="cvv">CVV</label>
                        <input
                          id="cvv"
                          type="password"
                          placeholder="123"
                          value={cardDetails.cvv}
                          onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                          maxLength={3}
                          className="form-input"
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label htmlFor="cardName">Cardholder Name</label>
                      <input
                        id="cardName"
                        placeholder="Name on card"
                        value={cardDetails.name}
                        onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                        className="form-input"
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'cod' && (
                <div className="checkout-payment-details" style={{ background: 'var(--success-light)', border: '1px solid var(--success)' }}>
                  <p style={{ margin: 0, color: 'var(--success)', fontWeight: '600' }}>💵 Pay on Delivery</p>
                  <p className="muted" style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Pay cash or card when you receive your order.</p>
                </div>
              )}
            </div>

            {/* ORDER ITEMS */}
            <div className="card">
              <h3 className="checkout-card-title">Order Items ({cart.length})</h3>
              {cart.length === 0 ? (
                <p className="muted">Your cart is empty.</p>
              ) : (
                <div className="orders-list">
                  {cart.map((item) => (
                    <div key={item._id || item.id} className="checkout-item checkout-order-item">
                      <div className="checkout-order-item-info">
                        <img src={item.image || 'https://via.placeholder.com/50x50'} alt={item.name} className="checkout-order-item-image" />
                        <div>
                          <p className="checkout-order-item-name">{item.name}</p>
                          <p className="checkout-order-item-qty">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <p className="checkout-order-item-price">₹{item.price * item.quantity}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ORDER SUMMARY SIDEBAR */}
          <div className="checkout-summary-sidebar">
            <div className="card">
              <h3 className="cart-summary-title">Order Summary</h3>
              <div className="cart-summary-divider">
                <div className="checkout-summary-row">
                  <span>Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                <div className="checkout-summary-row">
                  <span>Shipping</span>
                  <span style={{ color: shipping === 0 ? 'var(--success)' : 'inherit', fontWeight: shipping === 0 ? '600' : '400' }}>
                    {shipping === 0 ? 'FREE' : `₹${shipping}`}
                  </span>
                </div>
                <div className="checkout-summary-row">
                  <span>Tax (18%)</span>
                  <span>₹{tax}</span>
                </div>
              </div>
              <div className="checkout-summary-total-row cart-summary-total-row">
                <span className="cart-summary-total-label">Total</span>
                <span className="cart-summary-total-value">₹{total}</span>
              </div>
              <Button
                type="submit"
                size="lg"
                disabled={processing || !cart.length}
                style={{ width: '100%', marginBottom: '0.75rem' }}
              >
                {processing ? 'Processing...' : `Pay ₹${total} securely`}
              </Button>
              <p className="muted" style={{ textAlign: 'center', fontSize: '0.8rem', margin: 0 }}>
                <FaLock style={{ marginRight: '0.3rem' }} />
                Payments are secure and encrypted
              </p>
            </div>

            <div className="checkout-info-card checkout-info-card-blue">
              <div className="checkout-info-card-title">
                <FaTruck /> Estimated delivery
              </div>
              <div>4-5 business days from order confirmation</div>
            </div>

            <div className="checkout-info-card">
              <div className="checkout-info-card-title">
                <FaUndoAlt /> Easy returns
              </div>
              <div>30-day hassle-free returns on all orders</div>
            </div>
          </div>
        </div>
      </form>
    </section>
  );
}

export default Checkout;
