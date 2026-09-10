import { useEffect, useRef, useState } from 'react';
import api from '../services/api';

function CloudinaryUpload({ value, onChange, folder = 'shopease/products', accept = 'image/*', label = 'Product image' }) {
  const [preview, setPreview] = useState(value || '');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    setPreview(value || '');
  }, [value]);

  const requestSignature = async () => {
    const { data } = await api.get('/media/signature', { params: { folder } });
    return data;
  };

  const uploadToCloudinary = async (file) => {
    setUploading(true);
    setError('');

    try {
      const { timestamp, signature, apiKey, cloudName } = await requestSignature();
      const form = new FormData();
      form.append('file', file);
      form.append('api_key', apiKey);
      form.append('timestamp', String(timestamp));
      form.append('folder', folder);
      form.append('signature', signature);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: form
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Upload failed (${response.status}): ${text}`);
      }

      const result = await response.json();
      const url = result.secure_url || result.url;
      setPreview(url);
      onChange?.(url);
    } catch (err) {
      setError(err.message || 'Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await uploadToCloudinary(file);
    event.target.value = '';
  };

  const handlePaste = async (event) => {
    const item = event.clipboardData?.items?.find((entry) => entry.type.startsWith('image/'));
    if (!item) return;
    const file = item.getAsFile();
    if (!file) return;
    await uploadToCloudinary(file);
  };

  const clearImage = () => {
    setPreview('');
    onChange?.('');
  };

  return (
    <div>
      <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{label}</label>
      <div
        onClick={() => inputRef.current?.click()}
        onPaste={handlePaste}
        tabIndex={0}
        role="button"
        aria-label={`Upload ${label}`}
        style={{
          border: '2px dashed var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem',
          textAlign: 'center',
          cursor: 'pointer',
          background: 'var(--bg-secondary)',
          transition: 'all 0.2s ease',
          minHeight: '160px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem'
        }}
      >
        {preview ? (
          <>
            <img src={preview} alt={label} style={{ maxHeight: '140px', maxWidth: '100%', borderRadius: 'var(--radius-md)', objectFit: 'contain' }} />
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  inputRef.current?.click();
                }}
                style={{ padding: '0.4rem 0.9rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--border)', background: 'var(--bg-primary)', cursor: 'pointer', color: 'var(--text-primary)' }}
              >
                Replace
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  clearImage();
                }}
                style={{ padding: '0.4rem 0.9rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--danger)', background: 'var(--danger-light)', cursor: 'pointer', color: 'var(--danger)' }}
              >
                Remove
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: '2.5rem' }}>📁</div>
            <div>
              <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>Click or paste an image to upload</p>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>PNG, JPG, WEBP up to 10MB</p>
            </div>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      {uploading && <p className="muted" style={{ marginTop: '0.5rem' }}>Uploading image...</p>}
      {error && <p style={{ color: 'var(--danger)', marginTop: '0.5rem' }}>{error}</p>}
    </div>
  );
}

export default CloudinaryUpload;
