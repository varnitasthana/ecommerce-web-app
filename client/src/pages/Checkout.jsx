import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaLock,
  FaTruck,
  FaUndoAlt,
  FaCheckCircle
} from 'react-icons/fa';
import api from '../services/api';
import Button from '../components/Button';
import Breadcrumb from '../components/Breadcrumb';

const PAYMENT_METHODS = [
  {
    id: 'razorpay',
    label: 'Razorpay',
    description: 'Pay securely using Cards, UPI, Wallets, or Net Banking',
    icon: '🔐',
    options: ['Visa', 'Mastercard', 'RuPay', 'UPI', 'Paytm', 'PhonePe', 'Net Banking']
  },
  {
    id: 'cod',
    label: 'Cash on Delivery',
    description: 'Pay when you receive the order',
    icon: '💵',
    options: []
  }
];

function Checkout({ cart, totalPrice, clearCart }) {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [processing, setProcessing] = useState(false);
  const [address, setAddress] = useState({ name: '', street: '', city: '', postalCode: '', country: '', phone: '' });
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [errors, setErrors] = useState({});
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [demoMode, setDemoMode] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [paymentCancelled, setPaymentCancelled] = useState(false);
  const submittingRef = useRef(false);

  useEffect(() => {
    setPaymentCancelled(new URLSearchParams(window.location.search).get('payment') === 'cancelled');
  }, []);

  const checkoutRequestId = useMemo(() => {
    const stored = sessionStorage.getItem('checkoutRequestId');
    if (stored) return stored;
    const generated = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    sessionStorage.setItem('checkoutRequestId', generated);
    return generated;
  }, []);

  useEffect(() => {
    const checkRazorpay = async () => {
      try {
        const { data } = await api.get('/health');
        setDemoMode(!data.integrations?.payments);
      } catch {
        setDemoMode(true);
      }
    };
    checkRazorpay();
  }, []);

  useEffect(() => {
    const loadAddresses = async () => {
      try {
        const { data } = await api.get('/account/addresses');
        const addresses = Array.isArray(data) ? data : [];
        setSavedAddresses(addresses);
        const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0];
        if (defaultAddr) {
          setAddress({
            name: defaultAddr.name,
            street: defaultAddr.street,
            city: defaultAddr.city,
            postalCode: defaultAddr.postalCode,
            country: defaultAddr.country || 'India',
            phone: defaultAddr.phone || ''
          });
          setSelectedAddressId(defaultAddr._id);
        }
      } catch {
        setSavedAddresses([]);
      } finally {
        setLoadingAddresses(false);
      }
    };
    loadAddresses();
  }, []);

  useEffect(() => {
    if (demoMode || paymentMethod === 'cod') return;

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    script.onerror = () => setRazorpayLoaded(false);
    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [demoMode, paymentMethod]);

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

  const handleChange = (event) => {
    const { name, value } = event.target;
    setAddress((prev) => ({ ...prev, [name]: value }));
    setSelectedAddressId(null);
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSelectAddress = (addr) => {
    setAddress({
      name: addr.name,
      street: addr.street,
      city: addr.city,
      postalCode: addr.postalCode,
      country: addr.country || 'India',
      phone: addr.phone || ''
    });
    setSelectedAddressId(addr._id);
    setErrors({});
  };

  const calculateTotal = () => {
    const subtotal = totalPrice || 0;
    const shipping = subtotal >= 999 ? 0 : 49;
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

    if (submittingRef.current) return;
    submittingRef.current = true;
    setProcessing(true);

    try {
      const items = cart.map((item) => ({ product: item._id || item.id, quantity: item.quantity }));
      const payload = {
        items,
        shippingAddress: address,
        ...(selectedAddressId ? { addressId: selectedAddressId } : {})
      };

      if (demoMode || paymentMethod === 'cod') {
        const { data } = await api.post('/payments/demo-checkout', {
          ...payload,
          paymentMethod: paymentMethod === 'cod' ? 'cod' : 'demo'
        }, {
          headers: { 'Idempotency-Key': checkoutRequestId }
        });
        sessionStorage.removeItem('checkoutRequestId');
        setOrderSuccess(data);
        clearCart();
        navigate(`/order-confirmation?orderId=${data.orderId}&paymentMethod=${paymentMethod}`);
      } else {
        const { data } = await api.post('/payments/create-order', payload, {
          headers: { 'Idempotency-Key': checkoutRequestId }
        });

        sessionStorage.removeItem('checkoutRequestId');

        if (data.idempotent && data.order) {
          setOrderSuccess({ orderId: data.order._id, demo: false, paymentMethod: 'razorpay' });
          clearCart();
          navigate(`/order-confirmation?orderId=${data.order._id}&paymentMethod=${paymentMethod}`);
          return;
        }

        if (!razorpayLoaded || !window.Razorpay) {
          throw new Error('Razorpay checkout is not loaded. Please check your internet connection and try again.');
        }

        const options = {
          key: data.razorpayKeyId,
          amount: data.amount,
          currency: data.currency || 'INR',
          name: 'ShopEase',
          description: 'Order Payment',
          order_id: data.razorpayOrderId,
          prefill: {
            email: data.userEmail || '',
            contact: ''
          },
          theme: {
            color: '#4f46e5'
          },
          handler: async (response) => {
            try {
              const verifyData = await api.post('/payments/verify', {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              });

              if (verifyData.data.orderId) {
                clearCart();
                navigate(`/order-confirmation?orderId=${verifyData.data.orderId}`);
              } else {
                setMessage('Payment verification failed. Please contact support if amount was deducted.');
                setMessageType('error');
                setProcessing(false);
              }
            } catch (err) {
              setMessage(err.response?.data?.message || 'Payment verification failed. Please contact support.');
              setMessageType('error');
              setProcessing(false);
            }
          },
          modal: {
            ondismiss: () => {
              setProcessing(false);
              submittingRef.current = false;
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    } catch (error) {
      const serverMessage = error.response?.data?.message;
      const errorCode = error.response?.data?.code;

      if (errorCode === 'RAZORPAY_AUTH_FAILED') {
        setMessage('Online payments are temporarily unavailable. Please choose Cash on Delivery or contact support.');
        setMessageType('error');
        setPaymentMethod('cod');
      } else {
        setMessage(serverMessage || 'Could not place order. Please try again.');
        setMessageType('error');
      }
    } finally {
      setProcessing(false);
      submittingRef.current = false;
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
      <Breadcrumb items={[{ label: 'Home', path: '/' }, { label: 'Cart', path: '/cart' }, { label: 'Checkout' }]} />
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
              
              {savedAddresses.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <p style={{ margin: '0 0 0.75rem', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Saved Addresses</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {savedAddresses.map((addr) => (
                      <label key={addr._id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '1rem', borderRadius: 'var(--radius-md)', border: selectedAddressId === addr._id ? '2px solid var(--primary)' : '1px solid var(--border)', background: selectedAddressId === addr._id ? 'var(--primary-light)' : 'var(--bg-secondary)', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                        <input type="radio" name="savedAddress" checked={selectedAddressId === addr._id} onChange={() => handleSelectAddress(addr)} style={{ marginTop: '0.2rem', accentColor: 'var(--primary)' }} />
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: '0 0 0.25rem', fontWeight: 600 }}>{addr.name} {addr.isDefault && <span style={{ fontSize: '0.75rem', background: 'var(--primary)', color: 'white', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-full)', marginLeft: '0.5rem' }}>Default</span>}</p>
                          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{addr.street}, {addr.city}, {addr.postalCode}, {addr.country}</p>
                          {addr.phone && <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>📞 {addr.phone}</p>}
                        </div>
                      </label>
                    ))}
                  </div>
                  <button type="button" onClick={() => setSelectedAddressId(null)} style={{ marginTop: '0.75rem', background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                    + Use a different address
                  </button>
                </div>
              )}

              {(!selectedAddressId || savedAddresses.length === 0) && (
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
              )}
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

              {paymentMethod === 'cod' && (
                <div className="checkout-payment-details" style={{ background: 'var(--success-light)', border: '1px solid var(--success)' }}>
                  <p style={{ margin: 0, color: 'var(--success)', fontWeight: '600' }}>💵 Pay on Delivery</p>
                  <p className="muted" style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Pay cash or card when you receive your order.</p>
                </div>
              )}

              {paymentMethod === 'razorpay' && (
                <div className="checkout-payment-details" style={{ background: 'var(--primary-light)', border: '1px solid var(--primary)' }}>
                  <p style={{ margin: 0, color: 'var(--primary)', fontWeight: '600' }}>🔐 Secure Razorpay Checkout</p>
                  <p className="muted" style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                    You will be redirected to Razorpay's secure payment page to complete your transaction. We support Cards, UPI, Wallets, and Net Banking.
                  </p>
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
                        <img src={item.image || 'https://via.placeholder.com/50x50'} alt={item.name || 'Product'} className="checkout-order-item-image" />
                        <div>
                          <p className="checkout-order-item-name">{item.name || 'Product'}</p>
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
