function Cart({ cart, removeFromCart, updateQuantity, totalPrice }) {
  if (!cart.length) {
    return (
      <section className="page-block">
        <h2>Your cart is empty</h2>
      </section>
    );
  }

  return (
    <section className="page-block">
      <h2>Cart</h2>
      <div className="cart-list">
        {cart.map((item) => (
          <div className="cart-item" key={item._id || item.id}>
            <div>
              <h3>{item.name}</h3>
              <p>₹{item.price}</p>
            </div>
            <div className="cart-controls">
              <button onClick={() => updateQuantity(item._id, item.quantity - 1)}>-</button>
              <span>{item.quantity}</span>
              <button onClick={() => updateQuantity(item._id, item.quantity + 1)}>+</button>
            </div>
            <button className="link-btn" onClick={() => removeFromCart(item._id)}>
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="checkout-summary">
        <h3>Total: ₹{totalPrice}</h3>
      </div>
    </section>
  );
}

export default Cart;
