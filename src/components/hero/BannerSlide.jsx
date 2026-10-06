import React, { useState, useEffect } from 'react';
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

export default function BannerSlide({ banner, isActive, onAllFailed }) {
  const [imgSrc, setImgSrc]       = useState(banner.bgImage)
  const [mobSrc, setMobSrc]       = useState(banner.bgImageMobile)
  const [retryStep, setRetryStep] = useState(0)
  const [failed, setFailed]       = useState(false)

  useEffect(() => {
    setImgSrc(banner.bgImage)
    setMobSrc(banner.bgImageMobile)
    setRetryStep(0)
    setFailed(false)
  }, [banner.bgImage, banner.bgImageMobile])

  if (!isActive) return null;

  // When image has permanently failed, render nothing — Hero.jsx shows fallback
  if (failed) return null;

  const handleError = () => {
    const rawDesktop = banner.rawDesktop || banner.bgImage
    const fallbacks = getBannerFallbacks(rawDesktop)
    const next = retryStep + 1
    if (next <= fallbacks.length) {
      setRetryStep(next)
      setImgSrc(fallbacks[next - 1])
      const rawMobile = banner.rawMobile || banner.bgImageMobile || rawDesktop
      const mobFallbacks = getBannerFallbacks(rawMobile)
      if (mobFallbacks[next - 1]) setMobSrc(mobFallbacks[next - 1])
    } else {
      setFailed(true)
      if (typeof onAllFailed === 'function') onAllFailed()
    }
  }

  return (
    <div
      style={{
        width: '100%',
        backgroundColor: '#1a0a0a',
        animation: 'heroSlideIn 0.65s cubic-bezier(0.22, 1, 0.36, 1) both',
      }}
    >
      <picture className="hero-slide-picture" style={{ display: 'block', width: '100%' }}>
        {mobSrc && mobSrc !== imgSrc && (
          <source media="(max-width: 768px)" srcSet={mobSrc} />
        )}
        <img
          key={imgSrc}
          src={imgSrc}
          alt="Promotional Banner"
          className="hero-slide-img"
          style={{ width: '100%', height: 'auto', display: 'block' }}
          draggable="false"
          onError={handleError}
        />
      </picture>

      <style>{`
        @keyframes heroSlideIn {
          from { transform: translateX(6%); opacity: 0.5; }
          to   { transform: translateX(0);  opacity: 1; }
        }
      `}</style>
    </div>
  );
}
