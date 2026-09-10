import { useEffect, useState } from 'react';
import api from '../services/api';
import Button from '../components/Button';
import { formatDate } from '../utils/formatters';

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/notifications')
      .then(({ data }) => setNotifications(data.notifications || []))
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    api.post('/notifications/read-all')
      .then(() => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        window.dispatchEvent(new CustomEvent('notifications-updated'));
      })
      .catch((err) => console.error('Failed to mark all notifications as read:', err));
  }, []);

  const markAsRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, read: true } : n));
      window.dispatchEvent(new CustomEvent('notifications-updated'));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      window.dispatchEvent(new CustomEvent('notifications-updated'));
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  if (loading) {
    return (
      <section className="page-block" style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div className="skeleton-card" style={{ height: '200px', marginBottom: '1rem' }} />
        <div className="skeleton-card" style={{ height: '200px' }} />
      </section>
    );
  }

  return (
    <section className="page-block" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2>Notifications</h2>
          <p className="muted">{notifications.filter((n) => !n.read).length} unread</p>
        </div>
        {notifications.some((n) => !n.read) && <Button variant="secondary" size="sm" onClick={markAllAsRead}>Mark all as read</Button>}
      </div>
      {!notifications.length ? (
        <div className="card text-center" style={{ padding: '3rem 2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔔</div>
          <h3 style={{ margin: '0 0 0.5rem', color: 'var(--text-primary)' }}>No notifications yet</h3>
          <p className="muted" style={{ marginBottom: '1.5rem' }}>We'll notify you when something important happens.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {notifications.map((n) => (
            <div key={n._id} onClick={() => !n.read && markAsRead(n._id)} style={{ padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', border: `1px solid ${n.read ? 'var(--border)' : 'var(--primary)'}`, background: n.read ? 'var(--bg-secondary)' : 'var(--primary-light)', cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: n.read ? 'var(--bg-secondary)' : 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1rem' }}>
                {n.type === 'order' ? '📦' : n.type === 'payment' ? '💳' : n.type === 'shipping' ? '🚚' : n.type === 'return' ? '↩️' : '🔔'}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: '0 0 0.25rem', fontWeight: 600 }}>{n.title}</p>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{n.message}</p>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{formatDate(n.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default Notifications;
