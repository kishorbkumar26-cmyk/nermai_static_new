import React, { useState } from 'react';
import { extractGoogleDriveId } from '../../utils/imageOptimizer';

function getBannerFallbacks(url) {
  const driveId = extractGoogleDriveId(url)
  if (!driveId) return []
  return [
    `https://drive.google.com/thumbnail?id=${driveId}&sz=w1920`,
    `https://lh3.googleusercontent.com/u/0/d/${driveId}=w1920`,
    `https://drive.usercontent.google.com/download?id=${driveId}&export=view`,
    `https://drive.google.com/uc?id=${driveId}&export=view`,
  ]
}

export default function BannerSlide({ banner, isActive }) {
  const [imgSrc, setImgSrc]       = useState(banner.bgImage)
  const [mobSrc, setMobSrc]       = useState(banner.bgImageMobile)
  const [retryStep, setRetryStep] = useState(0)
  const [failed, setFailed]       = useState(false)

  if (!isActive) return null;

  const handleError = () => {
    const fallbacks = getBannerFallbacks(banner.bgImage)
    const next = retryStep + 1
    if (next <= fallbacks.length) {
      setRetryStep(next)
      setImgSrc(fallbacks[next - 1])
      // Also update mobile src
      const mobFallbacks = getBannerFallbacks(banner.bgImageMobile || banner.bgImage)
      if (mobFallbacks[next - 1]) setMobSrc(mobFallbacks[next - 1])
    } else {
      setFailed(true)
    }
  }

  return (
    <div
      style={{
        width: '100%',
        backgroundColor: '#1a0a0a',
        animation: 'heroSlideIn 0.65s cubic-bezier(0.22, 1, 0.36, 1) both',
        // Minimum height prevents layout collapse while image loads or if it fails
        minHeight: failed ? '400px' : undefined,
      }}
    >
      {!failed ? (
        <picture style={{ display: 'block', width: '100%' }}>
          {mobSrc && mobSrc !== imgSrc && (
            <source media="(max-width: 768px)" srcSet={mobSrc} />
          )}
          <img
            key={imgSrc}
            src={imgSrc}
            alt="Promotional Banner"
            style={{ width: '100%', height: 'auto', display: 'block' }}
            draggable="false"
            onError={handleError}
          />
        </picture>
      ) : (
        // Placeholder when image completely fails — keeps layout intact
        <div style={{
          width: '100%', minHeight: '400px',
          background: 'linear-gradient(135deg, #2b0b0e 0%, #150507 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
            <i className="fa-solid fa-image" style={{ fontSize: '3rem', display: 'block', marginBottom: '0.5rem' }} />
            <div style={{ fontSize: '0.85rem' }}>Banner image unavailable</div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes heroSlideIn {
          from { transform: translateX(6%); opacity: 0.5; }
          to   { transform: translateX(0);  opacity: 1; }
        }
      `}</style>
    </div>
  );
}
