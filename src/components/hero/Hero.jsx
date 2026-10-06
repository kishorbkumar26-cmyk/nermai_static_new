import React, { useState, useEffect } from 'react';
import BannerSlide from './BannerSlide';
import BannerIndicators from './BannerIndicators';
import { fbFirestore } from '../../firebase/firestore';
import { driveStorage } from '../../services/driveStorage';

import HeroCinematicDefault from './HeroCinematicDefault';

export default function Hero({ autoPlayInterval = 6000 }) {
  const [banners, setBanners] = useState(() => {
    try {
      const cached = localStorage.getItem('nermai_hero_banners_cache');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(() => {
    try {
      const cached = localStorage.getItem('nermai_hero_banners_cache');
      return !cached || JSON.parse(cached).length === 0;
    } catch {
      return true;
    }
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  // Track which slide indices had all their CDN fallbacks fail
  const [failedSlides, setFailedSlides] = useState({});

  const markSlideFailed = (idx) => {
    setFailedSlides(prev => ({ ...prev, [idx]: true }))
  }

  useEffect(() => {
    const unsub = fbFirestore.onHeroSlidesChanged(items => {
      const formattedBanners = (items || []).map(item => {
        const rawDesktop = item.urlDesktop || item.url || ''
        const rawMobile  = item.urlMobile  || item.urlDesktop || item.url || ''
        const desktopUrl = driveStorage.formatImageUrl(rawDesktop, 1920)
        const mobileUrl  = driveStorage.formatImageUrl(rawMobile,  1200)
        return {
          id: item.id,
          bgImage:        desktopUrl || mobileUrl,
          bgImageMobile:  mobileUrl  || desktopUrl,
          rawDesktop,
          rawMobile,
          ctaLink: item.ctaLink
        };
      });
      setBanners(formattedBanners);
      setLoading(false);
      setFailedSlides({}); // reset on fresh data
      try {
        localStorage.setItem('nermai_hero_banners_cache', JSON.stringify(formattedBanners));
      } catch (e) {
        console.error(e);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, autoPlayInterval);
    return () => clearInterval(timer);
  }, [banners.length, autoPlayInterval]);

  if (loading && banners.length === 0) {
    return (
      <section className="hero-banner-container">
        <div style={{ width: '100%', minHeight: '400px', background: 'linear-gradient(135deg, #2b0b0e 0%, #150507 100%)' }} />
      </section>
    );
  }

  if (!banners || banners.length === 0) {
    return <HeroCinematicDefault />;
  }

  // If the current slide's image has completely failed, show the cinematic default
  if (failedSlides[currentIndex]) {
    return <HeroCinematicDefault />;
  }

  return (
    <section className="hero-banner-container">
      {/* Slide Image Viewport */}
      <div className="hero-slide-viewport">
        <BannerSlide
          key={currentIndex}
          banner={banners[currentIndex]}
          isActive={true}
          onAllFailed={() => markSlideFailed(currentIndex)}
        />
      </div>

      {/* Hero Bottom Controls: Prev Arrow, Indicators, Next Arrow */}
      {banners.length > 1 && (
        <div className="hero-bottom-controls">
          <button
            type="button"
            className="hero-arrow hero-arrow--prev"
            onClick={() => setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length)}
            aria-label="Previous slide"
            title="Previous slide"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>

          <BannerIndicators
            total={banners.length}
            current={currentIndex}
            onChange={setCurrentIndex}
          />

          <button
            type="button"
            className="hero-arrow hero-arrow--next"
            onClick={() => setCurrentIndex((prev) => (prev + 1) % banners.length)}
            aria-label="Next slide"
            title="Next slide"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
      )}
    </section>
  );
}

