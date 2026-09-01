import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
  const [searchParams] = useSearchParams();

  useEffect(() => {
    setSearch(searchParams.get('search') || '');
    setCategory(searchParams.get('category') || 'all');
    setBrand(searchParams.get('brand') || 'all');
    setPageFromUrl(Number(searchParams.get('page') || 1));
  }, [searchParams]);

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

  return (
    <section className="page-block">
      <div className="section-heading">
        <h2>Products</h2>
        <div className="catalog-controls">
          <input
            type="search"
            placeholder="Search products"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="all">All categories</option>
            {categories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select value={brand} onChange={(event) => { setBrand(event.target.value); setPageFromUrl(1); }}>
            <option value="all">All brands</option>
            {brands.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <input type="number" min="0" placeholder="Min price" value={minPrice} onChange={(event) => { setMinPrice(event.target.value); setPageFromUrl(1); }} />
          <input type="number" min="0" placeholder="Max price" value={maxPrice} onChange={(event) => { setMaxPrice(event.target.value); setPageFromUrl(1); }} />
          <select value={minRating} onChange={(event) => { setMinRating(event.target.value); setPageFromUrl(1); }}>
            <option value="">Any rating</option>
            {[4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating}+ stars</option>)}
          </select>
          <select value={availability} onChange={(event) => { setAvailability(event.target.value); setPageFromUrl(1); }}>
            <option value="all">All availability</option>
            <option value="in-stock">In stock</option>
            <option value="out-of-stock">Out of stock</option>
          </select>
          <select value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="featured">Featured</option>
            <option value="price-low">Price: low to high</option>
            <option value="price-high">Price: high to low</option>
          </select>
        </div>
      </div>

      {error && <p className="form-message">{error}</p>}
      <p className="muted">{pagination.total || 0} products found</p>
      <div className="product-grid">
        {products.map((product) => (
          <div className="product-card" key={product._id || product.id}>
            <img src={product.image || 'https://via.placeholder.com/300x220'} alt={product.name} />
            <div className="product-card-body">
              <h3>{product.name}</h3>
              <p>{product.brand} · {product.category}</p>
              <div className="product-meta">
                <span>₹{product.price} {product.compareAtPrice > product.price && <del> ₹{product.compareAtPrice}</del>} {product.rating > 0 && `· ★ ${product.rating}`}</span>
                <Link to={`/products/${product._id}`}>View</Link>
              </div>
              <button className="small-btn" onClick={() => addToCart(product, 1)}>
                Add to cart
              </button>
            </div>
          </div>
        ))}
      </div>
      {!products.length && !error && <p className="empty-state">No products match your search.</p>}
      {pagination.totalPages > 1 && <div className="pagination-controls"><button className="secondary-btn" disabled={!pagination.hasPreviousPage} onClick={() => setPageFromUrl(page - 1)}>Previous</button><span>Page {pagination.page} of {pagination.totalPages}</span><button className="secondary-btn" disabled={!pagination.hasNextPage} onClick={() => setPageFromUrl(page + 1)}>Next</button></div>}
    </section>
  );
}

export default Products;
