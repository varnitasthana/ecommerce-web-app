import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';

function Compare() {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState({});

  const ids = useMemo(() => {
    const paramIds = searchParams.get('ids');
    if (paramIds) {
      return paramIds.split(',').filter(Boolean).slice(0, 4);
    }
    try {
      const stored = JSON.parse(localStorage.getItem('compareList') || '[]');
      return stored.slice(0, 4);
    } catch {
      return [];
    }
  }, [searchParams]);

  useEffect(() => {
    if (!ids.length) {
      setProducts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    api.get('/products', { params: { ids: ids.join(',') } })
      .then((response) => {
        const list = Array.isArray(response.data) ? response.data : (response.data.products || []);
        setProducts(list);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [ids]);

  useEffect(() => {
    localStorage.setItem('compareList', JSON.stringify(ids));
  }, [ids]);

  const removeProduct = (id) => {
    setRemoving((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => {
      const next = ids.filter((itemId) => itemId !== id);
      const newParams = new URLSearchParams(searchParams);
      if (next.length) {
        newParams.set('ids', next.join(','));
      } else {
        newParams.delete('ids');
      }
      window.history.replaceState(null, '', `${window.location.pathname}?${newParams.toString()}`);
      setProducts((prev) => prev.filter((p) => (p._id || p.id) !== id));
      localStorage.setItem('compareList', JSON.stringify(next));
      setRemoving((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    }, 250);
  };

  const features = useMemo(() => {
    if (!products.length) return [];
    const allKeys = new Set();
    products.forEach((p) => {
      const attrs = p.attributes || {};
      Object.keys(attrs).forEach((k) => allKeys.add(k));
    });
    const ordered = [];
    if (allKeys.has('condition')) ordered.push('condition');
    if (allKeys.has('catalog')) ordered.push('catalog');
    if (allKeys.has('availability')) ordered.push('availability');
    allKeys.forEach((k) => { if (!ordered.includes(k)) ordered.push(k); });
    return ordered;
  }, [products]);

  const getFeatureValue = (product, key) => {
    const attrs = product.attributes || {};
    if (attrs[key] !== undefined) return attrs[key];
    const map = {
      warranty: product.warranty,
      weight: product.weight,
      dimensions: product.dimensions,
      returnPolicy: product.returnPolicy,
      deliveryDays: product.deliveryDays
    };
    return map[key] || 'N/A';
  };

  const hasVariation = (key) => {
    if (!products.length) return false;
    const values = products.map((p) => {
      if (key === 'price') return p.price;
      if (key === 'rating') return p.rating;
      if (key === 'stock') return p.stock;
      return getFeatureValue(p, key);
    });
    return new Set(values).size > 1;
  };

  const stockStatus = (product) => {
    if (product.stock === 0) return 'Out of Stock';
    if (product.stock < 5) return `Low Stock (${product.stock})`;
    return 'In Stock';
  };

  const stockClass = (product) => {
    if (product.stock === 0) return 'status-cancelled';
    if (product.stock < 5) return 'status-pending';
    return 'status-confirmed';
  };

  if (loading) {
    return (
      <section className="page-block">
        <div className="section-heading home-section-heading">
          <div>
            <p className="eyebrow">Product comparison</p>
            <h1>Compare Products</h1>
          </div>
        </div>
        <div className="compare-loading-grid">
          {[1, 2, 3, 4].map((item) => <div className="skeleton-card" key={item} />)}
        </div>
      </section>
    );
  }

  if (!products.length) {
    return (
      <section className="page-block">
        <div className="section-heading home-section-heading">
          <div>
            <p className="eyebrow">Product comparison</p>
            <h1>Compare Products</h1>
          </div>
        </div>
        <div className="card text-center" style={{ padding: '4rem 2rem' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>⚖️</div>
          <h2 style={{ margin: '0 0 0.5rem', color: 'var(--text-primary)' }}>No products to compare</h2>
          <p className="muted" style={{ marginBottom: '1.5rem' }}>Select at least 2 products from the products page to compare features, price, and more.</p>
          <Link to="/products" className="primary-btn">Browse Products</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="page-block">
      <div className="section-heading home-section-heading">
        <div>
          <p className="eyebrow">Product comparison</p>
          <h1>Compare Products</h1>
        </div>
        <Link to="/products" className="primary-btn">+ Add More</Link>
      </div>

      {/* Product Cards */}
      <div className="compare-cards">
        {products.map((product) => {
          const pid = product._id || product.id;
          return (
            <div
              key={pid}
              className={`compare-card ${removing[pid] ? 'compare-card-removing' : ''}`}
            >
              <button
                className="compare-card-remove"
                onClick={() => removeProduct(pid)}
                title="Remove"
              >
                ✕
              </button>
              <Link to={`/products/${pid}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="compare-card-image">
                  <img
                    src={product.image || product.images?.[0] || 'https://via.placeholder.com/240x240'}
                    alt={product.name || 'Product'}
                  />
                </div>
                <div className="compare-card-body">
                  <h3 className="compare-card-title">{product.name || 'Unnamed Product'}</h3>
                  <div className="compare-card-meta">
                    <span className="compare-card-brand">{product.brand || 'ShopEase'}</span>
                    <span className="compare-card-category">{product.category || 'General'}</span>
                  </div>
                  <div className="compare-card-price">
                    <span className="compare-card-amount">₹{product.price ?? 0}</span>
                    {product.compareAtPrice && product.compareAtPrice > product.price && (
                      <span className="compare-card-compare">₹{product.compareAtPrice}</span>
                    )}
                  </div>
                  {product.compareAtPrice && product.compareAtPrice > product.price && (
                    <div className="compare-card-discount">
                      {Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)}% OFF
                    </div>
                  )}
                  <div className="compare-card-footer">
                    <span className={`status ${stockClass(product)}`}>{stockStatus(product)}</span>
                    {product.rating && (
                      <span className="compare-card-rating">⭐ {Math.round(product.rating * 10) / 10}</span>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
      </div>

      {/* Comparison Table */}
      <div className="compare-table-wrapper">
        <table className="compare-table">
          <thead>
            <tr>
              <th className="compare-table-feature">Feature</th>
              {products.map((product) => {
                const pid = product._id || product.id;
                return (
                  <th key={pid} className="compare-table-product">
                    <div className="compare-table-product-name">{product.name || 'Product'}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="compare-table-label">Price</td>
              {products.map((product) => {
                const pid = product._id || product.id;
                return (
                  <td key={pid} className={`compare-table-value ${hasVariation('price') ? 'compare-highlight' : ''}`}>
                    <div className="compare-table-price">
                      <span className="compare-table-amount">₹{product.price}</span>
                      {product.compareAtPrice && product.compareAtPrice > product.price && (
                        <span className="compare-table-compare">₹{product.compareAtPrice}</span>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
            <tr>
              <td className="compare-table-label">Compare-at Price</td>
              {products.map((product) => {
                const pid = product._id || product.id;
                return (
                  <td key={pid} className="compare-table-value">
                    {product.compareAtPrice ? `₹${product.compareAtPrice}` : 'N/A'}
                  </td>
                );
              })}
            </tr>
            <tr>
              <td className="compare-table-label">Discount</td>
              {products.map((product) => {
                const pid = product._id || product.id;
                const discount = product.compareAtPrice && product.compareAtPrice > product.price
                  ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
                  : 0;
                return (
                  <td key={pid} className="compare-table-value">
                    {discount > 0 ? <span className="compare-discount-badge">{discount}% OFF</span> : 'N/A'}
                  </td>
                );
              })}
            </tr>
            <tr>
              <td className="compare-table-label">Category</td>
              {products.map((product) => {
                const pid = product._id || product.id;
                return (
                  <td key={pid} className="compare-table-value">{product.category || 'N/A'}</td>
                );
              })}
            </tr>
            <tr>
              <td className="compare-table-label">Brand</td>
              {products.map((product) => {
                const pid = product._id || product.id;
                return (
                  <td key={pid} className="compare-table-value">{product.brand || 'N/A'}</td>
                );
              })}
            </tr>
            <tr>
              <td className="compare-table-label">Rating</td>
              {products.map((product) => {
                const pid = product._id || product.id;
                return (
                  <td key={pid} className={`compare-table-value ${hasVariation('rating') ? 'compare-highlight' : ''}`}>
                    <div className="compare-rating">
                      <span className="compare-stars">★★★★★</span>
                      <span className="compare-rating-value">{product.rating ? Math.round(product.rating * 10) / 10 : '4.5'}</span>
                    </div>
                  </td>
                );
              })}
            </tr>
            <tr>
              <td className="compare-table-label">Stock Status</td>
              {products.map((product) => {
                const pid = product._id || product.id;
                return (
                  <td key={pid} className="compare-table-value">
                    <span className={`status ${stockClass(product)}`}>{stockStatus(product)}</span>
                  </td>
                );
              })}
            </tr>
            <tr>
              <td className="compare-table-label">Delivery Days</td>
              {products.map((product) => {
                const pid = product._id || product.id;
                return (
                  <td key={pid} className="compare-table-value">{product.deliveryDays || '4-5'}</td>
                );
              })}
            </tr>
            {features.map((feature) => (
              <tr key={feature}>
                <td className="compare-table-label" style={{ textTransform: 'capitalize' }}>{feature}</td>
                {products.map((product) => {
                  const pid = product._id || product.id;
                  return (
                    <td key={pid} className="compare-table-value">
                      {getFeatureValue(product, feature)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default Compare;
