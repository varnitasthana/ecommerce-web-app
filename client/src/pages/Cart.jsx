import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FaTrash, FaRegHeart } from 'react-icons/fa';
import Button from '../components/Button';

const FREE_SHIPPING_THRESHOLD = 999;

function Cart({ cart, removeFromCart, updateQuantity, totalPrice }) {
  const [coupon, setCoupon] = useState('');
  const [saveForLater, setSaveForLater] = useState([]);

  const handleSaveForLater = (item) => {
    setSaveForLater((prev) => {
      const exists = prev.find((p) => (p._id || p.id) === (item._id || item.id));
      if (exists) return prev;
      return [...prev, { ...item, savedAt: Date.now() }];
    });
    removeFromCart(item._id || item.id);
  };

  const handleMoveToCart = (item) => {
    setSaveForLater((prev) => prev.filter((p) => (p._id || p.id) !== (item._id || item.id)));
    const existing = cart.find((i) => (i._id || i.id) === (item._id || item.id));
    if (!existing) {
      updateQuantity(item._id || item.id, 1);
    }
  };

  const savings = cart.reduce((total, item) => {
    const discount = ((item.compareAtPrice - item.price) * item.quantity) || 0;
    return total + discount;
  }, 0);

  const shippingProgress = useMemo(() => {
    if (totalPrice >= FREE_SHIPPING_THRESHOLD) return 100;
    return Math.min(100, Math.round((totalPrice / FREE_SHIPPING_THRESHOLD) * 100));
  }, [totalPrice]);

  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - totalPrice);

  if (!cart.length && !saveForLater.length) {
    return (
      <section className="page-block auth-page">
        <div className="auth-box text-center">
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🛒</div>
          <h2 style={{ margin: '0 0 0.5rem', color: 'var(--text-primary)' }}>Your cart is empty</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            Looks like you haven't added anything to your cart yet.
          </p>
          <Button to="/products" size="lg">Continue Shopping</Button>
        </div>
      </section>
    );
  }

  return (
    <section className="cart-page">
      {/* CART ITEMS */}
      <div className="cart-items-column">
        {cart.length > 0 && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Shopping Cart ({cart.length} items)</h2>
            </div>

            {/* FREE SHIPPING PROGRESS */}
            {remainingForFreeShipping > 0 && (
              <div className="shipping-progress" style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                    🚚 Add ₹{remainingForFreeShipping} more for <strong style={{ color: 'var(--success)' }}>FREE shipping</strong>
                  </span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 600 }}>{shippingProgress}%</span>
                </div>
                <div className="shipping-progress-bar">
                  <div className="shipping-progress-fill" style={{ width: `${shippingProgress}%` }} />
                </div>
                <p className="shipping-progress-text">
                  {totalPrice >= FREE_SHIPPING_THRESHOLD
                    ? '🎉 You qualify for free shipping!'
                    : `You've earned ₹{totalPrice} — only ₹{remainingForFreeShipping} away from free delivery!`}
                </p>
              </div>
            )}

            {totalPrice >= FREE_SHIPPING_THRESHOLD && (
              <div style={{ padding: '0.75rem 1rem', background: 'var(--success-light)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                🎉 You've unlocked FREE shipping on this order!
              </div>
            )}

            <div className="cart-list">
              {cart.map((item) => (
                <div className="cart-item cart-item-grid" key={item._id || item.id}>
                  {/* PRODUCT IMAGE */}
                  <Link to={`/products/${item._id || item.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <img
                      src={item.image || 'https://via.placeholder.com/100x100'}
                      alt={item.name}
                      className="cart-item-image"
                    />
                  </Link>

                  {/* PRODUCT DETAILS */}
                  <div className="cart-item-details">
                    <Link to={`/products/${item._id || item.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <h3 style={{ transition: 'color 0.2s ease' }}>{item.name}</h3>
                    </Link>
                    <p className="cart-item-brand">{item.brand || 'Premium Select'}</p>
                    <div className="cart-item-price">
                      <span className="cart-item-price-current">₹{item.price}</span>
                      {item.compareAtPrice && item.compareAtPrice > item.price && (
                        <>
                          <span className="cart-item-price-original">₹{item.compareAtPrice}</span>
                          <span className="cart-item-save">
                            Save {Math.round(((item.compareAtPrice - item.price) / item.compareAtPrice) * 100)}%
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* QUANTITY CONTROLS */}
                  <div className="quantity-control">
                    <button onClick={() => updateQuantity(item._id || item.id, item.quantity - 1)} aria-label="Decrease quantity">
                      −
                    </button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item._id || item.id, item.quantity + 1)} aria-label="Increase quantity">
                      +
                    </button>
                  </div>

                  {/* SUBTOTAL & DELETE */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem' }}>
                    <div className="cart-item-subtotal">
                      <p className="cart-item-subtotal-label">Subtotal</p>
                      <p className="cart-item-subtotal-value">₹{item.price * item.quantity}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleSaveForLater(item)}
                        style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0.5rem 0.75rem', cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', transition: 'all 0.2s ease', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                        onMouseEnter={(e) => { e.target.style.color = 'var(--primary)'; e.target.style.borderColor = 'var(--primary)'; }}
                        onMouseLeave={(e) => { e.target.style.color = 'var(--text-secondary)'; e.target.style.borderColor = 'var(--border)'; }}
                        title="Save for later"
                      >
                        <FaRegHeart /> Save
                      </button>
                      <button
                        onClick={() => removeFromCart(item._id || item.id)}
                        className="btn btn-danger btn-sm"
                        style={{ display: 'inline-flex' }}
                      >
                        <FaTrash /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CONTINUE SHOPPING */}
        {cart.length > 0 && (
          <Link to="/products" style={{ marginTop: '1rem', display: 'inline-flex', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none', transition: 'all 0.2s ease' }}>
            ← Continue Shopping
          </Link>
        )}

        {/* SAVE FOR LATER */}
        {saveForLater.length > 0 && (
          <div className="save-for-later-section">
            <h3 className="save-for-later-title">💔 Saved for Later ({saveForLater.length})</h3>
            <div className="save-for-later-list">
              {saveForLater.map((item) => (
                <div className="save-for-later-item" key={item._id || item.id}>
                  <Link to={`/products/${item._id || item.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <img src={item.image || 'https://via.placeholder.com/48x48'} alt={item.name} />
                  </Link>
                  <div className="save-for-later-item-info">
                    <Link to={`/products/${item._id || item.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <h4>{item.name}</h4>
                    </Link>
                    <span>₹{item.price}</span>
                  </div>
                  <Button size="sm" onClick={() => handleMoveToCart(item)} style={{ flexShrink: 0 }}>
                    Move to Cart
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ORDER SUMMARY SIDEBAR */}
      {cart.length > 0 && (
        <div className="cart-summary-sidebar">
          <div className="card">
            <h3 className="cart-summary-title">Order Summary</h3>

            {/* PRICE BREAKDOWN */}
            <div className="cart-summary-divider">
              <div className="cart-summary-row">
                <span>Subtotal ({cart.length} items)</span>
                <span>₹{totalPrice}</span>
              </div>
              <div className="cart-summary-row">
                <span>Shipping</span>
                <span className="cart-summary-row-savings">
                  {totalPrice >= FREE_SHIPPING_THRESHOLD ? 'FREE' : `₹${Math.max(0, Math.round(totalPrice * 0.05))}`}
                </span>
              </div>
              {savings > 0 && (
                <div className="cart-summary-row">
                  <span>Your Savings</span>
                  <span className="cart-summary-row-savings">−₹{savings}</span>
                </div>
              )}
              <div className="cart-summary-row">
                <span>Tax (18%)</span>
                <span>₹{Math.round(totalPrice * 0.18)}</span>
              </div>
            </div>

            {/* TOTAL */}
            <div className="cart-summary-total-row">
              <span className="cart-summary-total-label">Total:</span>
              <span className="cart-summary-total-value">
                ₹{totalPrice + Math.round(totalPrice * 0.18) + (totalPrice >= FREE_SHIPPING_THRESHOLD ? 0 : Math.max(0, Math.round(totalPrice * 0.05)))}
              </span>
            </div>

            {/* COUPON CODE */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="cart-coupon-label">Coupon Code</label>
              <div className="cart-coupon-input-group">
                <input
                  type="text"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  placeholder="Enter code"
                  className="form-input cart-coupon-input"
                />
                <Button type="button" variant="secondary" size="sm">Apply</Button>
              </div>
            </div>

            {/* CHECKOUT BUTTON */}
            <Button to="/checkout" size="lg" style={{ width: '100%', marginBottom: '0.75rem' }}>
              Proceed to Checkout →
            </Button>

            {/* TRUST BADGES */}
            <div className="cart-trust-badges">
              <div>✓ Secure checkout with SSL encryption</div>
              <div>✓ Money-back guarantee within 30 days</div>
              <div>✓ Free delivery on orders over ₹999</div>
            </div>
          </div>

          {/* DELIVERY INFO */}
          <div className="card cart-delivery-info">
            <div className="cart-delivery-title">
              📦 Estimated delivery
            </div>
            <div>4-5 business days</div>
          </div>
        </div>
      )}
    </section>
  );
}

export default Cart;
