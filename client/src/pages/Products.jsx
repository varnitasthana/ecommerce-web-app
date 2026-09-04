import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FaFilter, FaSearch } from 'react-icons/fa';
import api from '../services/api';

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
  const [searchParams] = useSearchParams();
  const searchParamsString = searchParams.toString();

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

  // Get badge for product
  const getProductBadge = (product, index) => {
    if (product.discount && product.discount > 20) return { text: `${product.discount}% OFF`, class: 'badge-sale' };
    if (index % 4 === 0) return { text: 'POPULAR', class: 'badge-hot' };
    if (!product.rating || product.rating < 3) return { text: 'NEW', class: 'badge-new' };
    return null;
  };

  return (
    <section className="products-page" style={{ display: 'grid', gridTemplateColumns: filterOpen ? '280px 1fr' : '1fr', gap: '2rem', padding: '2rem max(1.5rem, calc((100vw - 1400px) / 2))' }}>
      {/* FILTERS SIDEBAR */}
      <div className="products-filter-panel" style={{
        display: filterOpen ? 'flex' : 'none',
        flexDirection: 'column',
        gap: '1.5rem',
        padding: '1.5rem',
        background: 'white',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        height: 'fit-content',
        position: 'sticky',
        top: '120px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>Filters</h3>
          {activeFiltersCount > 0 && (
            <button
              className="filter-toggle-button"
              onClick={clearFilters}
              style={{
                background: 'transparent',
                color: 'var(--primary)',
                fontSize: '0.85rem',
                fontWeight: '600',
                cursor: 'pointer',
                padding: '0.4rem 0.8rem',
                border: '1px solid var(--border)',
                borderRadius: '6px'
              }}
            >
              Clear all
            </button>
          )}
        </div>

        {/* CATEGORY FILTER */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700' }}>Category</h4>
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPageFromUrl(1); }}
            style={{
              padding: '0.65rem 0.75rem',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              background: 'white',
              cursor: 'pointer'
            }}
          >
            <option value="all">All categories</option>
            {categories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>

        {/* BRAND FILTER */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700' }}>Brand</h4>
          <select
            value={brand}
            onChange={(e) => { setBrand(e.target.value); setPageFromUrl(1); }}
            style={{
              padding: '0.65rem 0.75rem',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              background: 'white',
              cursor: 'pointer'
            }}
          >
            <option value="all">All brands</option>
            {brands.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>

        {/* PRICE FILTER */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700' }}>Price Range</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
            <input
              type="number"
              min="0"
              placeholder="Min price"
              value={minPrice}
              onChange={(e) => { setMinPrice(e.target.value); setPageFromUrl(1); }}
              style={{
                padding: '0.65rem 0.75rem',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                background: 'white'
              }}
            />
            <input
              type="number"
              min="0"
              placeholder="Max price"
              value={maxPrice}
              onChange={(e) => { setMaxPrice(e.target.value); setPageFromUrl(1); }}
              style={{
                padding: '0.65rem 0.75rem',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                background: 'white'
              }}
            />
          </div>
        </div>

        {/* RATING FILTER */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700' }}>Rating</h4>
          <select
            value={minRating}
            onChange={(e) => { setMinRating(e.target.value); setPageFromUrl(1); }}
            style={{
              padding: '0.65rem 0.75rem',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              background: 'white',
              cursor: 'pointer'
            }}
          >
            <option value="">All ratings</option>
            <option value="4">⭐⭐⭐⭐+ (4 & up)</option>
            <option value="3">⭐⭐⭐+ (3 & up)</option>
            <option value="2">⭐⭐+ (2 & up)</option>
            <option value="1">⭐+ (1 & up)</option>
          </select>
        </div>

        {/* AVAILABILITY FILTER */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700' }}>Availability</h4>
          <select
            value={availability}
            onChange={(e) => { setAvailability(e.target.value); setPageFromUrl(1); }}
            style={{
              padding: '0.65rem 0.75rem',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              background: 'white',
              cursor: 'pointer'
            }}
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
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1.5rem',
          marginBottom: '2rem',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              style={{
                background: 'white',
                border: '1px solid var(--border)',
                padding: '0.65rem 1rem',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: '600',
                color: 'var(--primary)'
              }}
            >
              <FaFilter /> Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </button>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              {pagination.total || 0} products found
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              style={{
                padding: '0.65rem 1rem',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                background: 'white',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              <option value="featured">Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="newest">Newest</option>
              <option value="rating">Best Rated</option>
            </select>
          </div>
        </div>

        {/* SEARCH BAR ON PRODUCTS PAGE */}
        <div style={{
          display: 'flex',
          gap: '0.75rem',
          marginBottom: '2rem',
          background: 'white',
          padding: '1rem',
          borderRadius: '12px',
          border: '1px solid var(--border)'
        }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <FaSearch style={{ marginRight: '0.75rem', color: 'var(--text-tertiary)' }} />
            <input
              type="search"
              placeholder="Search in products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '0.95rem'
              }}
            />
          </div>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div style={{
            padding: '1rem',
            marginBottom: '1.5rem',
            background: '#ffebee',
            color: 'var(--danger)',
            borderRadius: '8px',
            border: '1px solid #ffcdd2'
          }}>
            {error}
          </div>
        )}

        {/* PRODUCT GRID */}
        {products.length > 0 ? (
          <div className="product-grid">
            {products.map((product, idx) => (
              <div className="product-card" key={product._id || product.id}>
                <div className="product-card-image">
                  <img src={product.image || 'https://via.placeholder.com/240x240'} alt={product.name} />
                  {getProductBadge(product, idx) && (
                    <div className={`product-badge ${getProductBadge(product, idx).class}`}>
                      {getProductBadge(product, idx).text}
                    </div>
                  )}
                </div>
                <div className="product-card-body">
                  <p>{product.brand || 'Premium Select'}</p>
                  <h3>{product.name}</h3>
                  
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
                    <button onClick={() => addToCart(product, 1)} style={{ fontSize: '0.85rem' }}>
                      Add to Cart
                    </button>
                  </div>
                  
                  <Link
                    to={`/products/${product._id}`}
                    style={{
                      display: 'inline-block',
                      marginTop: '0.75rem',
                      fontSize: '0.9rem',
                      color: 'var(--primary)',
                      fontWeight: '600',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>No products found</h3>
            <p>Try adjusting your filters or search terms</p>
            <button
              onClick={clearFilters}
              style={{
                marginTop: '1rem',
                padding: '0.75rem 1.5rem',
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* PAGINATION */}
        {pagination.totalPages > 1 && (
          <div className="pagination-controls">
            <button
              onClick={() => setPageFromUrl(page - 1)}
              disabled={page === 1}
              style={{
                opacity: page === 1 ? 0.5 : 1,
                cursor: page === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              ← Previous
            </button>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPageFromUrl(p)}
                  style={{
                    padding: '0.5rem 0.75rem',
                    background: p === page ? 'var(--primary)' : 'white',
                    color: p === page ? 'white' : 'var(--text-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: p === page ? '700' : '500'
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
            <button
              onClick={() => setPageFromUrl(page + 1)}
              disabled={page === pagination.totalPages}
              style={{
                opacity: page === pagination.totalPages ? 0.5 : 1,
                cursor: page === pagination.totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export default Products;
