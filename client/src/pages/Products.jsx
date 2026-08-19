import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api';

function Products({ addToCart }) {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('featured');
  const [searchParams] = useSearchParams();

  useEffect(() => {
    setSearch(searchParams.get('search') || '');
    setCategory(searchParams.get('category') || 'all');
  }, [searchParams]);

  useEffect(() => {
    api.get('/products')
      .then((response) => setProducts(Array.isArray(response.data) ? response.data : []))
      .catch(() => setProducts([]));
  }, []);

  const categories = [...new Set(products.map((product) => product.category).filter(Boolean))];
  const visibleProducts = products
    .filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === 'all' || product.category === category;
      return matchesSearch && matchesCategory;
    })
    .sort((first, second) => {
      if (sort === 'price-low') return first.price - second.price;
      if (sort === 'price-high') return second.price - first.price;
      return 0;
    });

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
          <select value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="featured">Featured</option>
            <option value="price-low">Price: low to high</option>
            <option value="price-high">Price: high to low</option>
          </select>
        </div>
      </div>

      <div className="product-grid">
        {visibleProducts.map((product) => (
          <div className="product-card" key={product._id || product.id}>
            <img src={product.image || 'https://via.placeholder.com/300x220'} alt={product.name} />
            <div className="product-card-body">
              <h3>{product.name}</h3>
              <p>{product.brand} · {product.category}</p>
              <div className="product-meta">
                <span>₹{product.price} {product.rating > 0 && `· ★ ${product.rating}`}</span>
                <Link to={`/products/${product._id}`}>View</Link>
              </div>
              <button className="small-btn" onClick={() => addToCart(product, 1)}>
                Add to cart
              </button>
            </div>
          </div>
        ))}
      </div>
      {!visibleProducts.length && <p className="empty-state">No products match your search.</p>}
    </section>
  );
}

export default Products;
