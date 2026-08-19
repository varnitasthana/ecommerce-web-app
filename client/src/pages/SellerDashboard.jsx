import { useEffect, useState } from 'react';
import api from '../services/api';

function SellerDashboard() {
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    api.get('/sellers/my-applications').then(({ data }) => setApplications(data)).catch(() => setApplications([]));
  }, []);

  return (
    <section className="page-block">
      <p className="eyebrow">Seller workspace</p>
      <h1>Partner dashboard</h1>
      <p className="muted">Manage your onboarding status here. Product and inventory tools can be added after seller approval.</p>
      <div className="orders-list">
        {applications.length ? applications.map((application) => (
          <article className="order-item" key={application._id}>
            <div><h3>{application.brandName}</h3><p className="muted">{application.category}</p></div>
            <span className={`status status-${application.status}`}>{application.status}</span>
          </article>
        )) : <p className="empty-state">No seller applications are linked to this account yet.</p>}
      </div>
    </section>
  );
}

export default SellerDashboard;
