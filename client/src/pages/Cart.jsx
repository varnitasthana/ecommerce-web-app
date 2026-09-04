import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaTrash } from 'react-icons/fa';

function Cart({ cart, removeFromCart, updateQuantity, totalPrice }) {
  const [coupon, setCoupon] = useState('');

  if (!cart.length) {
    return (
      <section style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <div style={{
          padding: '3rem 2rem',
          borderRadius: '12px',
          background: 'white',
          border: '1px solid var(--border)'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🛒</div>
          <h2 style={{ margin: '0 0 0.5rem', color: 'var(--text-primary)' }}>Your cart is empty</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            Looks like you haven't added anything to your cart yet.
          </p>
          <Link
            to="/products"
            style={{
              display: 'inline-block',
              padding: '0.85rem 2rem',
              background: 'var(--primary)',
              color: 'white',
              borderRadius: '8px',
              fontWeight: '600',
              textDecoration: 'none',
              transition: 'all 0.3s ease'
            }}
          >
            Continue Shopping
          </Link>
        </div>
      </section>
    );
  }

  const savings = cart.reduce((total, item) => {
    const discount = (item.compareAtPrice - item.price) * item.quantity || 0;
    return total + discount;
  }, 0);

  return (
    <section style={{
      display: 'grid',
      gridTemplateColumns: '1fr 380px',
      gap: '2rem',
      padding: '2rem max(1.5rem, calc((100vw - 1400px) / 2))'
    }}>
      {/* CART ITEMS */}
      <div>
        <div style={{
          padding: '1.5rem',
          background: 'white',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          marginBottom: '2rem'
        }}>
          <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.5rem' }}>
            Shopping Cart ({cart.length} items)
          </h2>

          <div className="cart-list">
            {cart.map((item) => (
              <div
                className="cart-item"
                key={item._id || item.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '100px 1fr auto auto',
                  gap: '1.5rem',
                  alignItems: 'start',
                  padding: '1.5rem',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  marginBottom: '1rem'
                }}
              >
                {/* PRODUCT IMAGE */}
                <img
                  src={item.image || 'https://via.placeholder.com/100x100'}
                  alt={item.name}
                  style={{
                    width: '100px',
                    height: '100px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    background: 'var(--bg-secondary)'
                  }}
                />

                {/* PRODUCT DETAILS */}
                <div>
                  <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem', fontWeight: '600' }}>
                    {item.name}
                  </h3>
                  <p style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    {item.brand || 'Premium Select'}
                  </p>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.05rem', fontWeight: '700' }}>
                      ₹{item.price}
                    </span>
                    {item.compareAtPrice && item.compareAtPrice > item.price && (
                      <>
                        <span style={{
                          textDecoration: 'line-through',
                          color: 'var(--text-tertiary)',
                          fontSize: '0.9rem'
                        }}>
                          ₹{item.compareAtPrice}
                        </span>
                        <span style={{
                          color: 'var(--success)',
                          fontSize: '0.85rem',
                          fontWeight: '600'
                        }}>
                          Save {Math.round(((item.compareAtPrice - item.price) / item.compareAtPrice) * 100)}%
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* QUANTITY CONTROLS */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '0.4rem 0.5rem',
                  background: 'var(--bg-secondary)'
                }}>
                  <button
                    onClick={() => updateQuantity(item._id || item.id, item.quantity - 1)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: '0.4rem 0.6rem',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      fontWeight: '700',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    −
                  </button>
                  <span style={{
                    padding: '0 0.6rem',
                    fontWeight: '600',
                    minWidth: '2rem',
                    textAlign: 'center'
                  }}>
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item._id || item.id, item.quantity + 1)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: '0.4rem 0.6rem',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      fontWeight: '700',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    +
                  </button>
                </div>

                {/* SUBTOTAL & DELETE */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: '0.75rem'
                }}>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: '0 0 0.25rem', fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
                      Subtotal
                    </p>
                    <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>
                      ₹{item.price * item.quantity}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFromCart(item._id || item.id)}
                    style={{
                      background: 'transparent',
                      color: 'var(--danger)',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.4rem 0.75rem',
                      borderRadius: '6px',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#ffebee'}
                    onMouseLeave={(e) => e.target.style.background = 'transparent'}
                  >
                    <FaTrash /> Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CONTINUE SHOPPING */}
        <Link
          to="/products"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'var(--primary)',
            fontWeight: '600',
            textDecoration: 'none',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => e.target.style.transform = 'translateX(-4px)'}
          onMouseLeave={(e) => e.target.style.transform = 'translateX(0)'}
        >
          ← Continue Shopping
        </Link>
      </div>

      {/* ORDER SUMMARY SIDEBAR */}
      <div style={{
        height: 'fit-content',
        position: 'sticky',
        top: '120px'
      }}>
        <div style={{
          padding: '1.5rem',
          background: 'white',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          marginBottom: '1rem'
        }}>
          <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.1rem', fontWeight: '700' }}>
            Order Summary
          </h3>

          {/* PRICE BREAKDOWN */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            paddingBottom: '1rem',
            borderBottom: '1px solid var(--border)',
            marginBottom: '1rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span>Subtotal</span>
              <span>₹{totalPrice}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span>Shipping</span>
              <span style={{ color: 'var(--success)', fontWeight: '600' }}>FREE</span>
            </div>
            {savings > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span>Your Savings</span>
                <span style={{ color: 'var(--success)', fontWeight: '600' }}>−₹{savings}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span>Tax</span>
              <span>₹{Math.round(totalPrice * 0.18)}</span>
            </div>
          </div>

          {/* TOTAL */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
            paddingBottom: '1.5rem',
            borderBottom: '2px solid var(--border)'
          }}>
            <span style={{ fontSize: '1rem', fontWeight: '700' }}>Total:</span>
            <span style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--primary)' }}>
              ₹{totalPrice + Math.round(totalPrice * 0.18)}
            </span>
          </div>

          {/* COUPON CODE */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '600' }}>
              Coupon Code
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                placeholder="Enter code"
                style={{
                  flex: 1,
                  padding: '0.65rem 0.75rem',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '0.9rem'
                }}
              />
              <button
                style={{
                  padding: '0.65rem 1rem',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.85rem'
                }}
              >
                Apply
              </button>
            </div>
          </div>

          {/* CHECKOUT BUTTON */}
          <Link
            to="/checkout"
            style={{
              display: 'block',
              padding: '1rem',
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              textAlign: 'center',
              textDecoration: 'none',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              marginBottom: '0.75rem'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'var(--primary-dark)';
              e.target.style.boxShadow = 'var(--shadow-md)';
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'var(--primary)';
              e.target.style.boxShadow = 'none';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            Proceed to Checkout →
          </Link>

          {/* TRUST BADGES */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            fontSize: '0.8rem',
            color: 'var(--text-tertiary)',
            textAlign: 'center',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-light)'
          }}>
            <div>✓ Secure checkout with SSL encryption</div>
            <div>✓ Money-back guarantee within 30 days</div>
            <div>✓ Free delivery on orders over ₹999</div>
          </div>
        </div>

        {/* DELIVERY INFO */}
        <div style={{
          padding: '1rem',
          background: 'var(--primary-light)',
          border: '1px solid var(--primary)',
          borderRadius: '12px',
          fontSize: '0.85rem',
          color: 'var(--primary)'
        }}>
          <div style={{ fontWeight: '700', marginBottom: '0.5rem' }}>
            📦 Estimated delivery
          </div>
          <div>4-5 business days</div>
        </div>
      </div>

      {/* MOBILE RESPONSIVE */}
      <style>{`
        @media (max-width: 768px) {
          section { display: flex; flex-direction: column; gap: 1rem !important; }
          div[style*="grid-template-columns: 1fr 380px"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}

export default Cart;
