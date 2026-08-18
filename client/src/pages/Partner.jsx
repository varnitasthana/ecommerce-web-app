import { useState } from 'react';
import api from '../api';

const initialForm = { brandName: '', contactEmail: '', category: '', website: '', message: '' };

function Partner() {
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await api.post('/sellers/applications', form);
      setForm(initialForm);
      setMessage('Thanks. Our partnerships team will review your application.');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Could not submit application');
    }
  };

  return (
    <section className="page-block auth-page">
      <div className="auth-box">
        <p className="eyebrow">ShopEase Partners</p>
        <h2>Bring your products to more customers</h2>
        <p>Tell us about your brand. Approved partners receive a catalog onboarding call.</p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <input name="brandName" placeholder="Brand name" value={form.brandName} onChange={(event) => setForm({ ...form, brandName: event.target.value })} required />
          <input type="email" name="contactEmail" placeholder="Business email" value={form.contactEmail} onChange={(event) => setForm({ ...form, contactEmail: event.target.value })} required />
          <input name="category" placeholder="Product category" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} required />
          <input type="url" name="website" placeholder="Website or catalog URL" value={form.website} onChange={(event) => setForm({ ...form, website: event.target.value })} />
          <textarea name="message" placeholder="What products and monthly volume can you offer?" value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} required />
          <button type="submit">Apply to partner</button>
        </form>
        {message && <p className="form-message">{message}</p>}
      </div>
    </section>
  );
}

export default Partner;