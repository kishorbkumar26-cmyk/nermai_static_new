import React from 'react';

export default function BannerIndicators({ total, current, onChange }) {
  if (total <= 1) return null;

  return (
    <div className="hero-indicators-row">
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          className={`hero-dot-btn ${current === i ? 'active' : ''}`}
          aria-label={`Go to slide ${i + 1}`}
        />
      ))}
    </div>
  );
}
