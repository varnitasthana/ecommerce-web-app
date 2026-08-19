import { useState } from 'react';

const faqs = [
  ['Where is my order?', 'Sign in and open Orders to view payment and fulfilment status. Delivery estimates appear on the order confirmation.'],
  ['How do returns work?', 'Open our Returns and refunds policy, then contact support with your order number and reason for return.'],
  ['Is checkout secure?', 'Payments are completed on Stripe-hosted Checkout. ShopEase does not collect or store your card number.'],
  ['Can I sell on ShopEase?', 'Use Sell with us to submit your brand, catalog, and contact details for partnership review.']
];

function Support() {
  const [open, setOpen] = useState(null);

  return <section className="page-block support-page"><div className="support-heading"><div><p className="eyebrow">Customer care</p><h1>How can we help?</h1><p className="legal-intro">Answers for orders, payments, returns, and partnerships.</p></div><a className="primary-btn" href="mailto:support@shopease.example">Email support</a></div><div className="faq-list">{faqs.map(([question, answer], index) => <article key={question} className="faq-item"><button onClick={() => setOpen(open === index ? null : index)} aria-expanded={open === index}>{question}<span>{open === index ? '−' : '+'}</span></button>{open === index && <p>{answer}</p>}</article>)}</div></section>;
}

export default Support;
