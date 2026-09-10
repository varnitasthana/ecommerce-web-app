function SizeGuide({ product, onClose }) {
  const sizeCharts = {
    'Clothing': {
      sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      measurements: {
        chest: ['34', '36', '38', '40', '42', '44'],
        waist: ['28', '30', '32', '34', '36', '38'],
        hips: ['36', '38', '40', '42', '44', '46']
      }
    },
    'Shoes': {
      sizes: ['6', '7', '8', '9', '10', '11', '12'],
      measurements: {
        length: ['24 cm', '25 cm', '26 cm', '27 cm', '28 cm', '29 cm', '30 cm']
      }
    },
    'Watches': {
      sizes: ['S', 'M', 'L'],
      measurements: {
        diameter: ['40 mm', '44 mm', '48 mm']
      }
    }
  };

  const category = product?.category || 'Clothing';
  const chart = sizeCharts[category] || sizeCharts['Clothing'];

  return (
    <div className="size-guide-backdrop" onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'grid', placeItems: 'center', zIndex: 1100, padding: '1rem', backdropFilter: 'blur(2px)' }}>
      <div className="size-guide-modal" onClick={(e) => e.stopPropagation()} style={{ background: 'var(--bg-primary)', borderRadius: 'var(--radius-lg)', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto', position: 'relative', boxShadow: 'var(--shadow-xl)', border: '1px solid var(--border)' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.25rem', fontWeight: 700 }}>Size Guide</h3>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{category} · {product?.name}</p>
          </div>
          <button onClick={onClose} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-full)', width: '36px', height: '36px', display: 'grid', placeItems: 'center', cursor: 'pointer', fontSize: '1rem', color: 'var(--text-secondary)' }}>✕</button>
        </div>

        <div style={{ padding: '1.5rem' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid var(--border)', fontWeight: 700 }}>Size</th>
                  {Object.entries(chart.measurements).map(([key, values]) => (
                    <th key={key} style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid var(--border)', fontWeight: 700, textTransform: 'capitalize' }}>{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {chart.sizes.map((size, idx) => (
                  <tr key={size} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}>{size}</td>
                    {Object.entries(chart.measurements).map(([, values]) => (
                      <td key={values[idx]} style={{ padding: '0.75rem', textAlign: 'center' }}>{values[idx]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <p style={{ margin: '0 0 0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>📏 How to Measure</p>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <li>Chest: Measure around the fullest part of your chest</li>
              <li>Waist: Measure around your natural waistline</li>
              <li>Hips: Measure around the fullest part of your hips</li>
            </ul>
          </div>

          <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-tertiary)', textAlign: 'center' }}>
            Need help? <a href="/support" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>Contact our support team</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SizeGuide;
