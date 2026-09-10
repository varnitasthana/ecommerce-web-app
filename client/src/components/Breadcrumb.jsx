import { Link, useLocation } from 'react-router-dom';

const breadcrumbMap = {
  '/products': 'Shop',
  '/cart': 'Cart',
  '/checkout': 'Checkout',
  '/orders': 'My Orders',
  '/wishlist': 'Wishlist',
  '/admin': 'Admin',
  '/seller': 'Seller Dashboard',
  '/seller/analytics': 'Analytics',
  '/account/addresses': 'Addresses',
  '/returns': 'Returns',
  '/support': 'Support',
  '/partner': 'Sell with Us',
  '/compare': 'Compare',
  '/login': 'Sign In',
  '/register': 'Create Account'
};

function Breadcrumb({ items }) {
  const location = useLocation();

  const generateBreadcrumbs = () => {
    if (items) return items;

    const pathnames = location.pathname.split('/').filter((x) => x);
    const crumbs = [{ label: 'Home', path: '/' }];

    let buildPath = '';
    pathnames.forEach((name, index) => {
      buildPath += `/${name}`;
      const label = breadcrumbMap[buildPath] || name.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
      crumbs.push({ label, path: buildPath });
    });

    return crumbs;
  };

  const crumbs = generateBreadcrumbs();

  if (crumbs.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" style={{ marginBottom: '1.5rem' }}>
      <ol style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', listStyle: 'none', padding: 0, margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
        {crumbs.map((crumb, index) => (
          <li key={crumb.path} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {index > 0 && <span style={{ color: 'var(--text-tertiary)' }}>›</span>}
            {index === crumbs.length - 1 ? (
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }} aria-current="page">{crumb.label}</span>
            ) : (
              <Link to={crumb.path} style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }}>
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export default Breadcrumb;
