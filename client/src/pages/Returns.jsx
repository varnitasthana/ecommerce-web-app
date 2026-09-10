import { useEffect, useState } from 'react';
import api from '../services/api';
import Button from '../components/Button';
import Breadcrumb from '../components/Breadcrumb';
import { Skeleton } from '../components/Skeleton';
import { formatDate } from '../utils/formatters';

function Returns() {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/returns/my')
      .then(({ data }) => setReturns(data.returns || []))
      .catch(() => setReturns([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="page-block" style={{ maxWidth: '900px', margin: '0 auto' }}>
        <Breadcrumb items={[{ label: 'Home', path: '/' }, { label: 'Returns' }]} />
        <Skeleton height="200px" style={{ marginBottom: '1rem' }} />
        <Skeleton height="200px" />
      </section>
    );
  }

  return (
    <section className="page-block" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <Breadcrumb items={[{ label: 'Home', path: '/' }, { label: 'Returns' }]} />
      <h2>My Returns</h2>
      <p className="muted" style={{ marginBottom: '2rem' }}>Track and manage your return requests</p>
      {!returns.length ? (
        <div className="card text-center" style={{ padding: '3rem 2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>↩️</div>
          <h3 style={{ margin: '0 0 0.5rem', color: 'var(--text-primary)' }}>No returns yet</h3>
          <p className="muted" style={{ marginBottom: '1.5rem' }}>When you request a return, it will appear here.</p>
          <Button to="/orders" size="lg">View Orders</Button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {returns.map((ret) => (
            <div key={ret._id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', padding: '1.25rem' }}>
              <div>
                <h3 style={{ margin: '0 0 0.25rem' }}>Return #{ret._id.slice(-8).toUpperCase()}</h3>
                <p className="muted" style={{ margin: 0, fontSize: '0.85rem' }}>Order #{ret.order?._id?.slice(-8).toUpperCase()} · {formatDate(ret.createdAt)}</p>
                <p className="muted" style={{ margin: '0.25rem 0 0', fontSize: '0.85rem' }}>Reason: {ret.reason || 'N/A'}</p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span className={`status status-${ret.status}`}>{ret.status}</span>
                <strong style={{ minWidth: '80px', textAlign: 'right' }}>₹{ret.refundAmount || 0}</strong>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default Returns;
