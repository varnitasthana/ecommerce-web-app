import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaHeart, FaRegHeart, FaShoppingCart, FaTimes } from 'react-icons/fa';
import api from '../services/api';

function QuickViewModal({ productId, onClose }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [saved, setSaved] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    api.get(`/products/${productId}`)
      .then((response) => {
        setProduct(response.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [productId]);

  useEffect(() => {
    if (product) {
      const images = product.images?.length ? product.images : (product.image ? [product.image] : []);
      setSelectedImage(0);
    }
  }, [product]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'auto'; };
  }, []);

  if (!productId) return null;

  const images = product ? (product.images?.length ? product.images : (product.image ? [product.image] : [])) : [];
  const discount = product?.compareAtPrice ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100) : 0;
  const isOutOfStock = product?.stock === 0;

  const handleAddToCart = () => {
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="quick-view-backdrop" onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'grid', placeItems: 'center', zIndex: 1100, padding: '1rem', backdropFilter: 'blur(2px)' }}>
      <div className="quick-view-modal" onClick={(e) => e.stopPropagation()} style={{ background: 'var(--bg-primary)', borderRadius: 'var(--radius-lg)', maxWidth: '960px', width: '100%', maxHeight: '90vh', overflowY: 'auto', position: 'relative', boxShadow: 'var(--shadow-xl)', border: '1px solid var(--border)' }}>
        <button type="button" onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-full)', width: '36px', height: '36px', display: 'grid', placeItems: 'center', cursor: 'pointer', fontSize: '1rem', color: 'var(--text-secondary)', zIndex: 10 }}>
          <FaTimes />
        </button>

        {loading ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <div className="skeleton-card" style={{ height: '300px', marginBottom: '1rem' }} />
            <div className="skeleton-card" style={{ height: '200px' }} />
          </div>
        ) : !product ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <p style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</p>
            <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Product not found</p>
          </div>
        ) : (
          <div className="quick-view-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            {/* IMAGES */}
            <div style={{ padding: '1.5rem' }}>
              <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'var(--bg-secondary)', marginBottom: '1rem', position: 'relative' }}>
                <img src={images[selectedImage] || images[0] || 'https://via.placeholder.com/500x500'} alt={product.name} style={{ width: '100%', height: '380px', objectFit: 'cover', display: 'block' }} />
                {discount > 0 && <span className="product-discount-badge" style={{ position: 'absolute', top: '1rem', left: '1rem' }}>{discount}% OFF</span>}
                {isOutOfStock && <span style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'var(--danger)', color: 'white', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', fontWeight: 700 }}>Out of Stock</span>}
              </div>
              {images.length > 1 && (
                <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto' }}>
                  {images.map((img, idx) => (
                    <button key={idx} onClick={() => setSelectedImage(idx)} style={{ width: '64px', height: '64px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: selectedImage === idx ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer', flexShrink: 0, padding: 0, background: 'transparent' }}>
                      <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* DETAILS */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <p style={{ margin: '0 0 0.5rem', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>{product.brand || 'ShopEase'} · {product.category || 'General'}</p>
                <h2 style={{ margin: '0 0 0.75rem', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>{product.name || 'Product'}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>₹{product.price}</span>
                  {product.compareAtPrice && product.compareAtPrice > product.price && (
                    <>
                      <span style={{ fontSize: '1rem', color: 'var(--text-tertiary)', textDecoration: 'line-through' }}>₹{product.compareAtPrice}</span>
                      <span style={{ background: 'var(--success-light)', color: 'var(--success)', padding: '0.25rem 0.6rem', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', fontWeight: 700 }}>{discount}% OFF</span>
                    </>
                  )}
                </div>
                <p style={{ margin: '0.75rem 0 0', fontSize: '0.9rem', color: isOutOfStock ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>
                  {isOutOfStock ? 'Out of Stock' : typeof product.stock === 'number' && product.stock < 5 ? `Only ${product.stock} left` : 'In Stock'}
                </p>
              </div>

              <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{product.description}</p>

              {product.variants?.length > 0 && (
                <div>
                  <p style={{ margin: '0 0 0.75rem', fontWeight: 600, fontSize: '0.9rem' }}>Available Options</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {product.variants.map((variant, idx) => (
                      <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: selectedVariant === idx ? '2px solid var(--primary)' : '1px solid var(--border)', background: selectedVariant === idx ? 'var(--primary-light)' : 'var(--bg-secondary)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}>
                        <input type="radio" name="variant" checked={selectedVariant === idx} onChange={() => setSelectedVariant(idx)} style={{ accentColor: 'var(--primary)' }} />
                        <span style={{ flex: 1 }}>{Object.entries(variant.attributes || {}).map(([, v]) => v).join(' / ') || variant.sku}</span>
                        <span style={{ color: 'var(--primary)', fontWeight: 700 }}>₹{variant.price}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Qty:</span>
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg-secondary)', cursor: 'pointer', fontSize: '1rem', fontWeight: 700 }}>-</button>
                <span style={{ padding: '0 0.75rem', fontWeight: 700, minWidth: '2rem', textAlign: 'center' }}>{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg-secondary)', cursor: 'pointer', fontSize: '1rem', fontWeight: 700 }}>+</button>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  style={{ flex: 1, padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-md)', border: 'none', background: isOutOfStock ? 'var(--text-tertiary)' : 'var(--primary)', color: 'white', fontWeight: 700, fontSize: '0.95rem', cursor: isOutOfStock ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s ease' }}
                >
                  <FaShoppingCart /> {added ? '✓ Added!' : isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                </button>
                <button
                  type="button"
                  onClick={() => setSaved(!saved)}
                  style={{ padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: saved ? 'var(--danger-light)' : 'var(--bg-secondary)', color: saved ? 'var(--danger)' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '1rem' }}
                >
                  {saved ? <FaHeart /> : <FaRegHeart />}
                </button>
              </div>

              <Link to={`/products/${product._id}`} onClick={onClose} style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none' }}>
                View full details →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default QuickViewModal;
