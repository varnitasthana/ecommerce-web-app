import { useEffect, useState } from 'react';
import api from '../services/api';
import Button from '../components/Button';
import Breadcrumb from '../components/Breadcrumb';

function Addresses() {
  const [addresses, setAddresses] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', phone: '', street: '', city: '', state: '', postalCode: '', country: 'India', type: 'home' });
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');

  const load = () => {
    api.get('/account/addresses').then(({ data }) => setAddresses(Array.isArray(data) ? data : [])).catch(() => setAddresses([]));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      if (editingId) {
        await api.patch(`/account/addresses/${editingId}`, form);
        setMessage('Address updated');
      } else {
        await api.post('/account/addresses', { ...form, isDefault: addresses.length === 0 });
        setMessage('Address added');
      }
      setForm({ name: '', email: '', phone: '', street: '', city: '', state: '', postalCode: '', country: 'India', type: 'home' });
      setEditingId(null);
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Could not save address');
    }
  };

  const editAddress = (addr) => {
    setEditingId(addr._id);
    setForm({ name: addr.name, email: addr.email, phone: addr.phone, street: addr.street, city: addr.city, state: addr.state || '', postalCode: addr.postalCode, country: addr.country || 'India', type: addr.type || 'home' });
  };

  const deleteAddress = async (id) => {
    try {
      await api.delete(`/account/addresses/${id}`);
      setMessage('Address deleted');
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Could not delete address');
    }
  };

  const setDefault = async (id) => {
    try {
      await api.post(`/account/addresses/${id}/set-default`);
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Could not set default');
    }
  };

  return (
    <section className="page-block" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <Breadcrumb items={[{ label: 'Home', path: '/' }, { label: 'Addresses' }]} />
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ margin: '0 0 0.25rem', color: 'var(--text-primary)' }}>My Addresses</h2>
        <p className="muted" style={{ margin: 0 }}>Manage your delivery addresses</p>
      </div>
      {message && <div className={`alert ${message.includes('updated') || message.includes('added') || message.includes('deleted') || message.includes('default') ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: '1.5rem' }}>{message}</div>}
      
      <div className="card" style={{ marginBottom: '2rem', background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
        <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>{editingId ? 'Edit address' : 'Add new address'}</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div className="form-group">
              <label style={{ color: 'var(--text-primary)' }}>Full Name</label>
              <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label style={{ color: 'var(--text-primary)' }}>Email</label>
              <input type="email" className="form-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="form-group">
              <label style={{ color: 'var(--text-primary)' }}>Phone</label>
              <input className="form-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            </div>
            <div className="form-group">
              <label style={{ color: 'var(--text-primary)' }}>Type</label>
              <select className="form-input form-select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="home">Home</option>
                <option value="work">Work</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label style={{ color: 'var(--text-primary)' }}>Street Address</label>
            <input className="form-input" value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div className="form-group">
              <label style={{ color: 'var(--text-primary)' }}>City</label>
              <input className="form-input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
            </div>
            <div className="form-group">
              <label style={{ color: 'var(--text-primary)' }}>State</label>
              <input className="form-input" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
            </div>
            <div className="form-group">
              <label style={{ color: 'var(--text-primary)' }}>Postal Code</label>
              <input className="form-input" value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} required />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label style={{ color: 'var(--text-primary)' }}>Country</label>
            <input className="form-input" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} required />
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Button type="submit" size="md">{editingId ? 'Update' : 'Add Address'}</Button>
            {editingId && <Button type="button" variant="secondary" size="md" onClick={() => { setEditingId(null); setForm({ name: '', email: '', phone: '', street: '', city: '', state: '', postalCode: '', country: 'India', type: 'home' }); }}>Cancel</Button>}
          </div>
        </form>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {addresses.map((addr) => (
          <div key={addr._id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', padding: '1.25rem', background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                <strong style={{ color: 'var(--text-primary)' }}>{addr.name}</strong>
                <span style={{ fontSize: '0.75rem', background: addr.isDefault ? 'var(--primary)' : 'var(--bg-secondary)', color: addr.isDefault ? 'white' : 'var(--text-secondary)', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-full)' }}>{addr.type}</span>
                {addr.isDefault && <span style={{ fontSize: '0.75rem', background: 'var(--success)', color: 'white', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-full)' }}>Default</span>}
              </div>
              <p className="muted" style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{addr.street}, {addr.city}, {addr.state || ''} {addr.postalCode}, {addr.country}</p>
              <p className="muted" style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>📞 {addr.phone} · ✉️ {addr.email}</p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {!addr.isDefault && <Button variant="secondary" size="sm" onClick={() => setDefault(addr._id)}>Set Default</Button>}
              <Button variant="outline" size="sm" onClick={() => editAddress(addr)}>Edit</Button>
              <Button variant="danger" size="sm" onClick={() => deleteAddress(addr._id)}>Delete</Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Addresses;
