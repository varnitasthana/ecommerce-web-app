import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

function SearchAutocomplete({ value, onChange, onSelect, placeholder = 'Search products, brands and more...' }) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState([]);
  const [trending] = useState([
    { name: 'Wireless Earbuds', category: 'Electronics' },
    { name: 'Running Shoes', category: 'Fashion' },
    { name: 'Coffee Maker', category: 'Home' },
    { name: 'Laptop', category: 'Electronics' }
  ]);
  const wrapperRef = useRef(null);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('recentSearches') || '[]');
      setRecent(stored.slice(0, 5));
    } catch {
      setRecent([]);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!value || value.trim().length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    const timer = window.setTimeout(() => {
      api.get('/search/suggestions', { params: { q: value.trim() } })
        .then((response) => {
          setSuggestions(response.data.suggestions || []);
          setOpen(true);
        })
        .catch(() => setSuggestions([]))
        .finally(() => setLoading(false));
    }, 200);
    return () => window.clearTimeout(timer);
  }, [value]);

  const handleSelect = (item) => {
    const query = item.name || item;
    onSelect(query);
    const updated = [query, ...recent.filter((r) => r !== query)].slice(0, 5);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
    setOpen(false);
  };

  const clearRecent = () => {
    setRecent([]);
    localStorage.removeItem('recentSearches');
  };

  return (
    <div className="search-autocomplete" ref={wrapperRef} style={{ position: 'relative', flex: 1, maxWidth: '640px' }}>
      <div className="search-input-wrapper" style={{ position: 'relative' }}>
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => value.trim().length >= 2 && setOpen(true)}
          className="search-input"
          style={{ width: '100%', padding: '0.85rem 1rem 0.85rem 2.75rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.95rem', transition: 'all 0.2s ease' }}
        />
        <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', fontSize: '1rem' }}>🔍</span>
        {value && (
          <button
            type="button"
            onClick={() => { onChange(''); setSuggestions([]); setOpen(false); }}
            style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: '1rem', padding: '0.25rem' }}
          >
            ✕
          </button>
        )}
      </div>

      {open && (
        <div className="search-dropdown" style={{ position: 'absolute', top: 'calc(100% + 0.5rem)', left: 0, right: 0, background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)', zIndex: 1000, maxHeight: '420px', overflowY: 'auto' }}>
          {loading && (
            <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
              Searching...
            </div>
          )}

          {!loading && suggestions.length > 0 && (
            <div className="search-section" style={{ padding: '0.5rem 0' }}>
              <p style={{ margin: '0 0 0.5rem', padding: '0 1rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08rem', color: 'var(--text-tertiary)', fontWeight: 700 }}>Products</p>
              {suggestions.map((item) => (
                <button
                  key={item._id}
                  type="button"
                  onClick={() => handleSelect(item)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'none', border: 'none', cursor: 'pointer', transition: 'background 0.15s ease', textAlign: 'left', color: 'inherit' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <img src={item.image || 'https://via.placeholder.com/40x40'} alt="" style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', objectFit: 'cover', background: 'var(--bg-secondary)', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name || 'Product'}</p>
                    <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{item.brand || 'ShopEase'} · {item.category || 'General'}</p>
                  </div>
                  {item.price && <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.9rem', flexShrink: 0 }}>₹{item.price}</span>}
                </button>
              ))}
              <Link to={`/products?search=${encodeURIComponent(value.trim())}`} className="search-view-all" onClick={() => setOpen(false)} style={{ display: 'block', padding: '0.75rem 1rem', textAlign: 'center', color: 'var(--primary)', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none', borderTop: '1px solid var(--border)' }}>
                View all results for “{value}”
              </Link>
            </div>
          )}

          {!loading && suggestions.length === 0 && value.trim().length >= 2 && (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
              <p style={{ margin: '0 0 0.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>No suggestions found</p>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>Try a different keyword</p>
            </div>
          )}

          {!value && recent.length > 0 && (
            <div className="search-section" style={{ padding: '0.5rem 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 1rem 0.5rem' }}>
                <p style={{ margin: 0, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08rem', color: 'var(--text-tertiary)', fontWeight: 700 }}>Recent</p>
                <button type="button" onClick={clearRecent} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>Clear</button>
              </div>
              {recent.map((term, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelect(term)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 1rem', background: 'none', border: 'none', cursor: 'pointer', transition: 'background 0.15s ease', textAlign: 'left', color: 'inherit' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>🕒</span>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{term}</span>
                </button>
              ))}
            </div>
          )}

          {!value && (
            <div className="search-section" style={{ padding: '0.5rem 0' }}>
              <p style={{ margin: '0 0 0.5rem', padding: '0 1rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08rem', color: 'var(--text-tertiary)', fontWeight: 700 }}>Trending</p>
              {trending.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => handleSelect(item.name)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 1rem', background: 'none', border: 'none', cursor: 'pointer', transition: 'background 0.15s ease', textAlign: 'left', color: 'inherit' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>🔥</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{item.name}</p>
                    <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{item.category}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchAutocomplete;
