import { useState } from 'react';

function ShareButton({ title, url, description = '', className = '' }) {
  const [copied, setCopied] = useState(false);

  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: title || document.title, url: shareUrl, text: description });
      } catch {
        // User cancelled or share failed
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className={`share-button ${className}`} style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
      <button
        type="button"
        onClick={handleNativeShare}
        aria-label="Share"
        title="Share"
        style={{
          padding: '0.5rem 1rem',
          borderRadius: 'var(--radius-full)',
          border: '1px solid var(--border)',
          background: 'var(--bg-primary)',
          cursor: 'pointer',
          color: 'var(--text-primary)',
          fontSize: '0.875rem',
          fontWeight: 600,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          transition: 'all 0.2s ease'
        }}
      >
        <span>🔗</span>
        <span>Share</span>
      </button>
      {copied && <span style={{ fontSize: '0.8rem', color: 'var(--success)' }}>Copied!</span>}
    </div>
  );
}

export default ShareButton;
