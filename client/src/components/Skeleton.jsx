function Skeleton({ className = '', style = {}, height, width, borderRadius = 'var(--radius-md)' }) {
  return (
    <div
      className={`skeleton-card ${className}`}
      style={{
        height: height || 'auto',
        width: width || '100%',
        borderRadius,
        background: 'linear-gradient(90deg, var(--bg-secondary), var(--bg-primary), var(--bg-secondary))',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
        ...style
      }}
    />
  );
}

function SkeletonText({ className = '', style = {}, width }) {
  return (
    <div
      className={`skeleton-text ${className}`}
      style={{
        width: width || '100%',
        ...style
      }}
    />
  );
}

export { Skeleton, SkeletonText };
