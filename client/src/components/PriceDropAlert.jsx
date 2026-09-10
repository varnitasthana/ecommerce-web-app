import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

function PriceDropAlert({ productId, productName, currentPrice, oldPrice, onClose }) {
  const [enabled, setEnabled] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    api.get(`/wishlist/${productId}/price-alert`)
      .then((response) => {
        if (mounted) setEnabled(response.data.enabled);
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, [productId]);

  const toggleAlert = async () => {
    setSaving(true);
    try {
      const { data } = await api.post(`/wishlist/${productId}/price-alert`);
      setEnabled(data.enabled);
    } catch (err) {
      // handled by toast
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="price-drop-alert" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'var(--success-light)', borderRadius: 'var(--radius-md)', border: '1px solid var(--success)', marginTop: '0.75rem' }}>
      <div style={{ flex: 1 }}>
        <p style={{ margin: '0 0 0.25rem', fontWeight: 700, fontSize: '0.9rem', color: 'var(--success)' }}>💰 Price Drop Alert</p>
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {productName} is now <strong style={{ color: 'var(--primary)' }}>{currentPrice}</strong> (was {oldPrice})
        </p>
      </div>
      <button onClick={toggleAlert} disabled={saving} style={{ padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: enabled ? 'var(--success)' : 'var(--bg-primary)', color: enabled ? 'white' : 'var(--text-primary)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
        {enabled ? '✓ Alerts On' : 'Notify Me'}
      </button>
      {onClose && (
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
      )}
    </div>
  );
}

export default PriceDropAlert;
