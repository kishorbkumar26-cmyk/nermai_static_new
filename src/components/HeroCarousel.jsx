import { useState, useEffect, useRef } from 'react'
import { fbFirestore } from '../firebase/firestore'
import { driveStorage } from '../services/driveStorage'
import { LMS_URL } from '../constants'
import { checkSectionVersion } from '../utils/imageCacheVersion'
import { invalidateCachedUrls } from '../utils/imageCache'

const DEFAULT_SLIDES = [
  {
    id: 'default',
    url: 'https://nermaiiasacademy.in/wp-content/uploads/2024/10/UPSC-100424-scaled.jpg',
    title: 'Nermai Education',
    subtitle: 'A definite path to success',
    ctaLink: '/courses'
  }
]

/* Cinematic hero shown when admin has not yet uploaded any slide images */
function HeroCinematicDefault({ cta }) {
  return (
    <div className="hero-cinematic-default">
      <div className="hero-cinematic-grid" aria-hidden="true" />
      <div className="hero-cinematic-radial" aria-hidden="true" />
      <div className="hero-cinematic-content">
        <div className="hero-cinematic-eyebrow">
          <span className="hero-eyebrow-dot" />
          NERMAI IAS ACADEMY · PUDUCHERRY
        </div>
        <h1 className="hero-cinematic-title">
          Prepare with<br /><em>Purpose.</em>
        </h1>
        <p className="hero-cinematic-subtitle">
          Nermai Education · A definite path to success
        </p>
        <p className="hero-cinematic-tagline">
          Serve with Integrity.
        </p>
        <div className="hero-cinematic-actions">
          <a href={cta?.link || '#'} className="btn btn-primary btn-lg" id="hero-enroll-btn">
            {cta?.label || 'Enroll Now'} <i className="fa-solid fa-arrow-right" />
          </a>
          <a href="/why-nermai" className="btn btn-ghost btn-lg">Our Story</a>
        </div>
        <div className="hero-cinematic-meta">
          UPSC · TNPSC · TN POLICE · BANKING · PUDUCHERRY EXAM
        </div>
      </div>
    </div>
  )
}

export default function HeroCarousel() {
  const [slides, setSlides] = useState(DEFAULT_SLIDES)
  const [active, setActive] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [carouselAspect, setCarouselAspect] = useState(null)
  const timerRef = useRef(null)
  const touchStartRef = useRef(null)
  const touchEndRef = useRef(null)
  const carouselRef = useRef(null)

  // Auto-size the carousel to match the loaded image's natural dimensions
  const handleImageLoad = (e) => {
    const img = e.currentTarget
    if (img.naturalWidth && img.naturalHeight) {
      setCarouselAspect(`${img.naturalWidth} / ${img.naturalHeight}`)
    }
  }

  useEffect(() => {
    const unsub = fbFirestore.onHeroSlidesChanged(items => {
      const newSlides = items.length > 0 ? items : DEFAULT_SLIDES
      setSlides(newSlides)

      // Build version-check items from slide image URLs + their updatedAt timestamp
      const versionItems = newSlides.flatMap(slide => {
        const updatedAt = slide.updatedAt?.toMillis?.() || slide.updatedAt || ''
        const out = []
        const desktop = driveStorage.formatImageUrl(slide.urlDesktop || slide.url)
        const mobile  = driveStorage.formatImageUrl(slide.urlMobile  || slide.urlDesktop || slide.url)
        if (desktop) out.push({ url: desktop, updatedAt })
        if (mobile && mobile !== desktop) out.push({ url: mobile, updatedAt })
        return out
      })

      // Invalidate only the specific stale URLs when the DB changes
      const { staleUrls } = checkSectionVersion('hero', versionItems)
      if (staleUrls.length) invalidateCachedUrls(staleUrls)

      // Eagerly preload all slide images in the background
      driveStorage.preloadSlideImages(newSlides, 0)
    })
    return () => unsub()
  }, [])

  const resetTimer = () => {
    clearInterval(timerRef.current)
    if (slides.length <= 1) return
    timerRef.current = setInterval(() => {
      setActive(a => (a + 1) % slides.length)
    }, 5500)
  }

  useEffect(() => {
    resetTimer()
    return () => clearInterval(timerRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides.length])

  const goTo = (i) => {
    if (isTransitioning || i === active) return
    setIsTransitioning(true)
    setTimeout(() => setIsTransitioning(false), 600)
    setActive(i)
    resetTimer()
  }

  const prev = () => goTo((active - 1 + slides.length) % slides.length)
  const next = () => goTo((active + 1) % slides.length)

  // Touch/Swipe support for mobile & iOS
  const handleTouchStart = (e) => {
    touchStartRef.current = e.targetTouches[0].clientX
    touchEndRef.current = null
  }
  const handleTouchMove = (e) => {
    touchEndRef.current = e.targetTouches[0].clientX
  }
  const handleTouchEnd = () => {
    if (!touchStartRef.current || !touchEndRef.current) return
    const diff = touchStartRef.current - touchEndRef.current
    const minSwipeDistance = 50
    if (Math.abs(diff) > minSwipeDistance) {
      if (diff > 0) next()  // swipe left → next
      else prev()             // swipe right → prev
    }
    touchStartRef.current = null
    touchEndRef.current = null
  }

  return (
    <section className="hero-carousel-section" id="home" aria-label="Hero slideshow">
      <div
        ref={carouselRef}
        className="hero-carousel"
        style={carouselAspect ? { aspectRatio: carouselAspect } : undefined}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >

        {/* Slides */}
        {slides.map((slide, i) => {
          const desktopUrl = driveStorage.formatImageUrl(slide.urlDesktop || slide.url)
          const mobileUrl = driveStorage.formatImageUrl(slide.urlMobile || slide.urlDesktop || slide.url)
          const isActive = i === active

          return (
            <div
              key={slide.id}
              className={`hero-slide${isActive ? ' hero-slide--active' : ''}`}
              aria-hidden={!isActive}
            >
              {/* Image: uses <picture> for responsive PC vs Mobile images */}
              {(desktopUrl || mobileUrl) ? (
                <picture className="hero-slide-picture">
                  {mobileUrl && (
                    <source
                      media="(max-width: 768px)"
                      srcSet={mobileUrl}
                    />
                  )}
                  <img
                    src={desktopUrl || mobileUrl}
                    alt={slide.title || `Nermai Academy slide ${i + 1}`}
                    className="hero-slide-img"
                    crossOrigin="anonymous"
                    onLoad={i === 0 ? handleImageLoad : undefined}
                    onError={(e) => driveStorage.handleImageError(e, '')}
                    loading={i === 0 ? 'eager' : 'lazy'}
                  />
                </picture>
              ) : (
                /* Cinematic editorial default — admin hasn't uploaded images yet */
                <HeroCinematicDefault cta={slide.cta ? { label: slide.cta, link: slide.ctaLink } : null} />
              )}

              {/* Text overlay — only shown when there's an image + caption */}
              {(desktopUrl || mobileUrl) && (slide.title || slide.subtitle) && (
                <div className="hero-slide-text-overlay">
                  <div className="container-wide">
                    <div className="hero-slide-label">NERMAI IAS ACADEMY</div>
                    {slide.title && (
                      <h2 className="hero-slide-title">{slide.title}</h2>
                    )}
                    {slide.subtitle && (
                      <p className="hero-slide-sub">{slide.subtitle}</p>
                    )}
                    {slide.cta && (
                      <a
                        href={slide.ctaLink || LMS_URL}
                        className="btn btn-primary hero-slide-cta"
                        target={slide.ctaLink && slide.ctaLink !== '#' ? '_blank' : undefined}
                        rel="noopener noreferrer"
                      >
                        {slide.cta} <i className="fa-solid fa-arrow-right" style={{ marginLeft: '8px' }} />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {/* Prev / Next arrows */}
        {slides.length > 1 && (
          <>
            <button
              className="hero-arrow hero-arrow--prev"
              onClick={prev}
              aria-label="Previous slide"
            >
              <i className="fa-solid fa-chevron-left" />
            </button>
            <button
              className="hero-arrow hero-arrow--next"
              onClick={next}
              aria-label="Next slide"
            >
              <i className="fa-solid fa-chevron-right" />
            </button>
          </>
        )}

        {/* Progress bar */}
        {slides.length > 1 && (
          <div className="hero-progress-bar">
            <div
              className="hero-progress-fill"
              key={active}
            />
          </div>
        )}

        {/* Dots */}
        {slides.length > 1 && (
          <div className="hero-dots" role="tablist" aria-label="Slide navigation">
            {slides.map((_, i) => (
              <button
                key={i}
                role="tab"
                aria-selected={i === active}
                className={`hero-dot${i === active ? ' hero-dot--active' : ''}`}
                onClick={() => goTo(i)}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        )}

        {/* Slide counter */}
        {slides.length > 1 && (
          <div className="hero-counter" aria-live="polite">
            <span className="hero-counter-current">{String(active + 1).padStart(2, '0')}</span>
            <span className="hero-counter-sep">/</span>
            <span className="hero-counter-total">{String(slides.length).padStart(2, '0')}</span>
          </div>
        )}
      </div>
    </section>
  )
}
