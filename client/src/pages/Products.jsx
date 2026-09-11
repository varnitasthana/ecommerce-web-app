import { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { FaFilter, FaSearch, FaShoppingCart } from 'react-icons/fa';
import api from '../services/api';
import Button from '../components/Button';
import QuickViewModal from '../components/QuickViewModal';

const MAX_COMPARE = 4;

function Products({ addToCart }) {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('featured');
  const [brand, setBrand] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState('');
  const [availability, setAvailability] = useState('all');
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const [error, setError] = useState('');
  const [filterOpen, setFilterOpen] = useState(true);
  const [suggestions, setSuggestions] = useState([]);
  const [searchParams] = useSearchParams();
  const searchParamsString = searchParams.toString();
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [compareIds, setCompareIds] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('compareList') || '[]');
      setCompareIds(stored.slice(0, MAX_COMPARE));
    } catch {
      setCompareIds([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('compareList', JSON.stringify(compareIds));
  }, [compareIds]);

  useEffect(() => {
    const nextParams = new URLSearchParams(searchParamsString);
    setSearch(nextParams.get('search') || '');
    setCategory(nextParams.get('category') || 'all');
    setBrand(nextParams.get('brand') || 'all');
    setPageFromUrl(Number(nextParams.get('page') || 1));
  }, [searchParamsString]);

  const [page, setPageFromUrl] = useState(1);

  useEffect(() => {
    const params = { page, limit: 12, sort };
    if (search) params.search = search;
    if (category !== 'all') params.category = category;
    if (brand !== 'all') params.brand = brand;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;
    if (minRating) params.minRating = minRating;
    if (availability !== 'all') params.availability = availability;
    setError('');
    api.get('/products', { params })
      .then((response) => {
        setProducts(response.data.products || []);
        setPagination(response.data.pagination || { page: 1, total: response.data.length || 0, totalPages: 1 });
      })
      .catch((requestError) => {
        setProducts([]);
        setError(requestError.response?.data?.message || 'Unable to load products');
      });
  }, [search, category, brand, minPrice, maxPrice, minRating, availability, sort, page]);

  useEffect(() => {
    if (search.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = window.setTimeout(() => {
      api.get('/search/suggestions', { params: { q: search.trim() } })
        .then((response) => setSuggestions(response.data.suggestions || []))
        .catch(() => setSuggestions([]));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  const categories = [...new Set(products.map((product) => product.category).filter(Boolean))];
  const brands = [...new Set(products.map((product) => product.brand).filter(Boolean))];

  const clearFilters = () => {
    setSearch('');
    setCategory('all');
    setBrand('all');
    setMinPrice('');
    setMaxPrice('');
    setMinRating('');
    setAvailability('all');
    setSort('featured');
    setPageFromUrl(1);
  };

  const activeFiltersCount = [search, category !== 'all', brand !== 'all', minPrice, maxPrice, minRating, availability !== 'all'].filter(Boolean).length;

  const toggleCompare = (productId) => {
    setCompareIds((prev) => {
      const id = String(productId);
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= MAX_COMPARE) {
        return prev;
      }
      return [...prev, id];
    });
  };

  const goToCompare = () => {
    if (compareIds.length < 2) return;
    navigate(`/compare?ids=${compareIds.join(',')}`);
  };

  const getProductBadge = (product, index) => {
    if (product.discount && product.discount > 20) return { text: `${product.discount}% OFF`, class: 'badge-sale' };
    if (index % 4 === 0) return { text: 'POPULAR', class: 'badge-hot' };
    if (!product.rating || product.rating < 3) return { text: 'NEW', class: 'badge-new' };
    return null;
  };

  const openQuickView = (product) => {
    setQuickViewProduct(product);
    document.body.style.overflow = 'hidden';
  };

  const closeQuickView = () => {
    setQuickViewProduct(null);
    document.body.style.overflow = '';
  };

  return (
    <section className="products-page">
      {/* MOBILE FILTER OVERLAY */}
      {filterOpen && (
        <div className="mobile-nav-overlay" onClick={() => setFilterOpen(false)}>
          <div className="mobile-nav-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 360, width: '85%' }}>
            <div className="mobile-nav-close">
              <button onClick={() => setFilterOpen(false)} style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>✕</button>
            </div>
            <div className="mobile-nav-links" style={{ padding: '1rem' }}>
              <div className="products-filter-header">
                <h3 className="products-filter-title">Filters</h3>
                {activeFiltersCount > 0 && (
                  <button className="filter-toggle-button" onClick={clearFilters}>Clear all</button>
                )}
              </div>
              <div className="filter-group">
                <h4>Category</h4>
                <select value={category} onChange={(e) => { setCategory(e.target.value); setPageFromUrl(1); }} className="form-select">
                  <option value="all">All categories</option>
                  {categories.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
              <div className="filter-group">
                <h4>Brand</h4>
                <select value={brand} onChange={(e) => { setBrand(e.target.value); setPageFromUrl(1); }} className="form-select">
                  <option value="all">All brands</option>
                  {brands.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
              <div className="filter-group">
                <h4>Price Range</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                  <input type="number" min="0" placeholder="Min price" value={minPrice} onChange={(e) => { setMinPrice(e.target.value); setPageFromUrl(1); }} className="form-input" />
                  <input type="number" min="0" placeholder="Max price" value={maxPrice} onChange={(e) => { setMaxPrice(e.target.value); setPageFromUrl(1); }} className="form-input" />
                </div>
              </div>
              <div className="filter-group">
                <h4>Rating</h4>
                <select value={minRating} onChange={(e) => { setMinRating(e.target.value); setPageFromUrl(1); }} className="form-select">
                  <option value="">All ratings</option>
                  <option value="4">⭐⭐⭐⭐+ (4 & up)</option>
                  <option value="3">⭐⭐⭐+ (3 & up)</option>
                  <option value="2">⭐⭐+ (2 & up)</option>
                  <option value="1">⭐+ (1 & up)</option>
                </select>
              </div>
              <div className="filter-group">
                <h4>Availability</h4>
                <select value={availability} onChange={(e) => { setAvailability(e.target.value); setPageFromUrl(1); }} className="form-select">
                  <option value="all">All products</option>
                  <option value="in-stock">In stock</option>
                  <option value="out-of-stock">Out of stock</option>
                </select>
              </div>
              <Button size="lg" style={{ width: '100%', marginTop: '1rem' }} onClick={() => setFilterOpen(false)}>Show results</Button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <div>
        <div className="products-filter-header">
          <h3 className="products-filter-title">Filters</h3>
          {activeFiltersCount > 0 && (
            <button className="filter-toggle-button" onClick={clearFilters}>
              Clear all
            </button>
          )}
        </div>

        {/* CATEGORY FILTER */}
        <div className="filter-group">
          <h4>Category</h4>
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPageFromUrl(1); }}
            className="form-select"
          >
            <option value="all">All categories</option>
            {categories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>

        {/* BRAND FILTER */}
        <div className="filter-group">
          <h4>Brand</h4>
          <select
            value={brand}
            onChange={(e) => { setBrand(e.target.value); setPageFromUrl(1); }}
            className="form-select"
          >
            <option value="all">All brands</option>
            {brands.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>

        {/* PRICE FILTER */}
        <div className="filter-group">
          <h4>Price Range</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
            <input
              type="number"
              min="0"
              placeholder="Min price"
              value={minPrice}
              onChange={(e) => { setMinPrice(e.target.value); setPageFromUrl(1); }}
              className="form-input"
            />
            <input
              type="number"
              min="0"
              placeholder="Max price"
              value={maxPrice}
              onChange={(e) => { setMaxPrice(e.target.value); setPageFromUrl(1); }}
              className="form-input"
            />
          </div>
        </div>

        {/* RATING FILTER */}
        <div className="filter-group">
          <h4>Rating</h4>
          <select
            value={minRating}
            onChange={(e) => { setMinRating(e.target.value); setPageFromUrl(1); }}
            className="form-select"
          >
            <option value="">All ratings</option>
            <option value="4">⭐⭐⭐⭐+ (4 & up)</option>
            <option value="3">⭐⭐⭐+ (3 & up)</option>
            <option value="2">⭐⭐+ (2 & up)</option>
            <option value="1">⭐+ (1 & up)</option>
          </select>
        </div>

        {/* AVAILABILITY FILTER */}
        <div className="filter-group">
          <h4>Availability</h4>
          <select
            value={availability}
            onChange={(e) => { setAvailability(e.target.value); setPageFromUrl(1); }}
            className="form-select"
          >
            <option value="all">All products</option>
            <option value="in-stock">In stock</option>
            <option value="out-of-stock">Out of stock</option>
          </select>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div>
        {/* HEADER WITH SEARCH & SORT */}
        <div className="products-catalog-controls">
          <div className="products-catalog-left">
            <Button onClick={() => setFilterOpen(!filterOpen)} variant="outline" size="sm">
              <FaFilter /> Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </Button>
            <span className="muted">
              {pagination.total || 0} products found
            </span>
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="form-select products-sort-select"
          >
            <option value="featured">Featured</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="newest">Newest</option>
            <option value="rating">Best Rated</option>
          </select>
        </div>

        {/* SEARCH BAR */}
        <div className="card products-search-bar">
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', position: 'relative' }}>
            <FaSearch className="products-search-icon" />
            <input
              type="search"
              placeholder="Search in products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="products-search-input"
            />
            {suggestions.length > 0 && (
              <div className="catalog-suggestions" style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '0.5rem', borderRadius: 'var(--radius-md)', overflow: 'hidden', zIndex: 50 }}>
                {suggestions.map((suggestion) => (
                  <Link key={suggestion._id} to={`/products/${suggestion._id}`} onClick={() => setSuggestions([])} className="catalog-suggestion">
                    <img src={suggestion.image || 'https://via.placeholder.com/48x48'} alt="" />
                    <span><strong>{suggestion.name}</strong><small>{suggestion.brand} · ₹{suggestion.price}</small></span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
            {error}
          </div>
        )}

        {/* COMPARE FLOATING BAR */}
        {compareIds.length > 0 && (
          <div style={{
            position: 'sticky',
            bottom: '1.5rem',
            zIndex: 80,
            marginBottom: '1.5rem',
            background: 'var(--primary)',
            color: 'white',
            padding: '1rem 1.5rem',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-xl)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <strong>Compare ({compareIds.length}/{MAX_COMPARE})</strong>
              <span style={{ marginLeft: '0.75rem', fontSize: '0.85rem', opacity: 0.9 }}>{compareIds.length < 2 ? 'Select at least 2 products to compare' : 'Ready to compare'}</span>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <button onClick={() => setCompareIds([])} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.4)', color: 'white', borderRadius: 'var(--radius-sm)', padding: '0.4rem 0.75rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>Clear</button>
              <Button onClick={goToCompare} disabled={compareIds.length < 2} size="sm" style={{ background: 'var(--bg-primary)', color: 'var(--primary)', boxShadow: 'var(--shadow-md)' }}>
                Compare Now
              </Button>
            </div>
          </div>
        )}

        {/* PRODUCT GRID */}
        {products.length > 0 ? (
          <div className="product-grid">
            {products.map((product, idx) => {
              const badge = getProductBadge(product, idx);
              const productId = product._id || product.id;
              const isChecked = compareIds.includes(String(productId));
              return (
                  <div className="product-card" key={productId} style={{ position: 'relative' }}>
                    <div className="product-card-image">
                      <Link to={`/products/${productId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <img src={product.image || 'https://via.placeholder.com/240x240'} alt={product.name || 'Product'} loading="lazy" />
                      </Link>
                      {badge && <div className={`product-badge ${badge.class}`}>{badge.text}</div>}
                      <label style={{ position: 'absolute', top: '0.5rem', left: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'var(--bg-primary)', padding: '0.35rem 0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', zIndex: 5, boxShadow: 'var(--shadow-sm)', userSelect: 'none', color: 'var(--text-primary)' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleCompare(productId)}
                          style={{ cursor: 'pointer', width: '14px', height: '14px', accentColor: 'var(--primary)' }}
                        />
                        Compare
                      </label>
                      <button
                        className="quick-view-btn"
                        onClick={() => openQuickView(product)}
                        aria-label="Quick view"
                      >
                        👁 Quick View
                      </button>
                    </div>
                    <div className="product-card-body">
                      <p>{product.brand || 'ShopEase'}</p>
                      <Link to={`/products/${productId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <h3>{product.name || 'Product'}</h3>
                      </Link>
                    <div className="product-rating">
                      <span className="rating-stars">★★★★★</span>
                      <span className="rating-count">{product.rating ? Math.round(product.rating * 10) / 10 : '4.5'}</span>
                    </div>
                    <div className="product-meta">
                      <div className="product-price">
                        <span className="product-price-current">₹{product.price}</span>
                        {product.compareAtPrice && product.compareAtPrice > product.price && (
                          <>
                            <span className="product-price-original">₹{product.compareAtPrice}</span>
                            <span className="product-discount">{Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)}% off</span>
                          </>
                        )}
                      </div>
                      <button onClick={(e) => { e.preventDefault(); addToCart(product, 1); }} className="product-card-add-btn">
                        <FaShoppingCart /> Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>No products found</h3>
            <p>Try adjusting your filters or search terms</p>
            <Button onClick={clearFilters} style={{ marginTop: '1rem' }}>Clear Filters</Button>
          </div>
        )}

        {/* PAGINATION */}
        {pagination.totalPages > 1 && (
          <div className="pagination-controls">
            <Button
              onClick={() => setPageFromUrl(page - 1)}
              disabled={page === 1}
              variant="outline"
            >
              ← Previous
            </Button>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPageFromUrl(p)}
                  className={p === page ? 'active' : ''}
                  aria-label={`Page ${p}`}
                  aria-current={p === page ? 'page' : undefined}
                >
                  {p}
                </button>
              ))}
            </div>
            <Button
              onClick={() => setPageFromUrl(page + 1)}
              disabled={page === pagination.totalPages}
              variant="outline"
            >
              Next →
            </Button>
          </div>
        )}
      </div>

      {/* QUICK VIEW MODAL */}
      {quickViewProduct && (
        <QuickViewModal productId={quickViewProduct._id || quickViewProduct.id} onClose={closeQuickView} />
      )}
    </section>
  );
}

export default Products;
