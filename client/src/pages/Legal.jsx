function Legal({ type }) {
  const content = {
    privacy: {
      label: 'Your privacy',
      title: 'Privacy policy',
      intro: 'We collect only the information needed to provide a reliable shopping experience, fulfil orders, prevent fraud, and support customers.',
      sections: [
        ['Information we use', 'Account details, delivery information, order history, and support conversations help us deliver purchases and improve service. Payment card details are handled by our payment provider and are not stored by ShopEase.'],
        ['How we protect it', 'Access is restricted by role, sensitive configuration stays outside Git, and production traffic should run over HTTPS. We never sell personal information.'],
        ['Your choices', 'You may request access, correction, or deletion of your account information by contacting support. Transaction records may be retained where required by law.']
      ]
    },
    terms: {
      label: 'Clear expectations',
      title: 'Terms of service',
      intro: 'By using ShopEase, you agree to provide accurate account and delivery details and to use the marketplace for lawful purchases.',
      sections: [
        ['Orders', 'An order is accepted after payment authorization and inventory confirmation. Product availability, delivery estimates, and pricing may change before confirmation.'],
        ['Marketplace partners', 'Partner products are subject to verification, catalog standards, and applicable consumer protection laws. Sellers remain responsible for accurate product information.'],
        ['Account safety', 'Keep your password private and contact support immediately if you notice unauthorized account activity.']
      ]
    },
    returns: {
      label: 'Shop with confidence',
      title: 'Returns and refunds',
      intro: 'We want every order to feel straightforward. Return eligibility depends on product condition, category, and the policy shown at checkout.',
      sections: [
        ['Start a return', 'Contact support with your order number and reason. Keep the item, packaging, and accessories in the condition required by the product policy.'],
        ['Refund timing', 'After inspection, approved refunds are sent to the original payment method. Bank processing times vary by provider.'],
        ['Exceptions', 'Perishable, personalized, hygiene-sensitive, or used items may have different rules. The product page and order confirmation are the source of truth.']
      ]
    }
  }[type];

  return <section className="page-block legal-page"><p className="eyebrow">{content.label}</p><h1>{content.title}</h1><p className="legal-intro">{content.intro}</p><div className="legal-sections">{content.sections.map(([heading, text]) => <article key={heading}><h3>{heading}</h3><p>{text}</p></article>)}</div><p className="muted">Last updated: August 19, 2026</p></section>;
}

export default Legal;
