import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { fbFirestore } from '../firebase/firestore'
import { driveStorage } from '../services/driveStorage'
import './SuccessStoriesSection.css'

export const DEFAULT_SUCCESS_STORIES_CONFIG = {
  eyebrow: 'NERMAI SUCCESS STORIES',
  titlePrefix: 'From Aspirants to',
  titleHighlight: 'Achievers',
  subtitle: 'Real journeys. Real people. Real results. Be inspired by our students who turned their dreams into reality with Nermai.',
  scriptTopLeft: 'Learn\nPrepare\nSucceed',
  scriptTopRight: 'Different\nAspirations\nOne\nDestination',

  toppersSubheading: 'OUR TOPPERS',
  toppersDesc: 'Meet our achievers who made it happen with dedication, guidance and the Nermai way.',
  toppersViewAllText: 'View All Toppers',
  toppersViewAllLink: '/results',

  resultsGalleryHeading: 'RESULTS GALLERY',
  resultsGalleryDesc: 'Various batch results, selections and achievement posters from Nermai IAS Academy.',
  resultsGalleryViewAllText: 'View Full Gallery',
  resultsGalleryViewAllLink: '/results',
  showResultsGallery: true,

  feature1Icon: 'fa-trophy',
  feature1Title: 'Expert Guidance',
  feature1Desc: 'By experienced faculty and mentors',
  feature2Icon: 'fa-book-open',
  feature2Title: 'Structured Learning',
  feature2Desc: 'From basics to advanced',
  feature3Icon: 'fa-chart-line',
  feature3Title: 'Proven Results',
  feature3Desc: 'Across competitive exams',
  feature4Icon: 'fa-users',
  feature4Title: 'Diverse Backgrounds',
  feature4Desc: 'Students from towns, cities and rural areas'
}

const BASE_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'upsc', label: 'UPSC' },
  { id: 'tnpsc', label: 'TNPSC' },
  { id: 'banking', label: 'Banking' },
  { id: 'puducherry', label: 'Puducherry Govt.' },
  { id: 'ssc', label: 'SSC' },
  { id: 'others', label: 'Others' }
]

function matchCategory(topper, targetCategoryId) {
  if (!topper || topper.visible === false) return false
  if (targetCategoryId === 'all') return true

  const catId = (topper.category || topper.categoryId || '').toLowerCase().trim()
  const exam = (topper.exam || '').toLowerCase().trim()
  const target = targetCategoryId.toLowerCase().trim()

  if (catId && (catId === target || catId.includes(target))) {
    return true
  }

  const examClean = exam.replace(/[^a-z0-9\s]/g, '')
  const examWords = examClean.split(/\s+/)
  if (examWords.includes(target) || examClean.startsWith(target)) {
    return true
  }

  if (target === 'upsc') return exam.includes('upsc') || catId === 'upsc' || exam.includes('civil') || exam.includes('ias') || exam.includes('ips')
  if (target === 'tnpsc') return exam.includes('tnpsc') || exam.includes('group') || catId.startsWith('tnpsc') || catId.includes('tnpsc')
  if (target === 'banking') return exam.includes('bank') || exam.includes('sbi') || exam.includes('ibps') || exam.includes('rbi') || exam.includes('po') || exam.includes('clerk') || catId === 'banking'
  if (target === 'puducherry') return exam.includes('puducherry') || exam.includes('udc') || exam.includes('ldc') || exam.includes('tahsildar') || catId === 'puducherry'
  if (target === 'ssc') return exam.includes('ssc') || exam.includes('cgl') || exam.includes('chsl') || catId === 'ssc'

  if (target === 'others') {
    return !matchCategory(topper, 'upsc') &&
           !matchCategory(topper, 'tnpsc') &&
           !matchCategory(topper, 'banking') &&
           !matchCategory(topper, 'puducherry') &&
           !matchCategory(topper, 'ssc')
  }

  return false
}

export default function SuccessStoriesSection({ customConfig }) {
  const [config, setConfig] = useState(customConfig || DEFAULT_SUCCESS_STORIES_CONFIG)
  const [toppers, setToppers] = useState([])
  const [galleryImages, setGalleryImages] = useState([])
  const [activeCategory, setActiveCategory] = useState('all')
  const [topperIndex, setTopperIndex] = useState(0)
  const [galleryIndex, setGalleryIndex] = useState(0)
  const [selectedStory, setSelectedStory] = useState(null)
  const [previewPoster, setPreviewPoster] = useState(null)
  const [windowWidth, setWindowWidth] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1200))
  
  const topperTouchStartX = useRef(null)
  const galleryTouchStartX = useRef(null)

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Dynamic responsive items per view
  const isMobile = windowWidth <= 768
  const topperItemsPerView = windowWidth >= 1200 ? 6 : windowWidth >= 960 ? 4 : windowWidth >= 640 ? 2 : 1
  const galleryItemsPerView = windowWidth >= 768 ? 2 : 1

  // ── Load Settings and Live Data (Actual Firestore Data Only) ──
  useEffect(() => {
    // 1. Settings from Firestore
    fbFirestore.getSettings().then(s => {
      const saved = s?.homeContent?.successStories || s?.successStories || s?.homeContent?.toppersWall || s?.toppersWall
      if (saved) {
        setConfig(prev => ({ ...DEFAULT_SUCCESS_STORIES_CONFIG, ...saved }))
      }
    }).catch(err => console.warn('Could not load successStories settings', err))

    const unsubSettings = fbFirestore.onSettingsChanged?.(s => {
      const saved = s?.homeContent?.successStories || s?.successStories || s?.homeContent?.toppersWall || s?.toppersWall
      if (saved) {
        setConfig(prev => ({ ...DEFAULT_SUCCESS_STORIES_CONFIG, ...saved }))
      }
    })

    // 2. Toppers Data (Actual live results data from Admin/Firestore)
    const unsubResults = fbFirestore.onResultsChanged?.(items => {
      if (items && Array.isArray(items)) {
        setToppers(items.filter(i => i && i.visible !== false))
      } else {
        fbFirestore.getResults?.().then(res => {
          if (res && Array.isArray(res)) {
            setToppers(res.filter(i => i && i.visible !== false))
          } else {
            setToppers([])
          }
        }).catch(() => setToppers([]))
      }
    })

    // 3. Gallery Posters / Banners Data (Actual live gallery data from Admin/Firestore)
    const unsubGallery = fbFirestore.onGalleryChanged?.(items => {
      if (items && Array.isArray(items)) {
        setGalleryImages(items.filter(i => i && i.url))
      } else {
        fbFirestore.getGallery?.().then(res => {
          if (res && Array.isArray(res)) {
            setGalleryImages(res.filter(i => i && i.url))
          } else {
            setGalleryImages([])
          }
        }).catch(() => setGalleryImages([]))
      }
    })

    return () => {
      unsubSettings && unsubSettings()
      unsubResults && unsubResults()
      unsubGallery && unsubGallery()
    }
  }, [])

  // ── Toppers Filtering & Carousel Logic ──
  const filteredToppers = toppers.filter(t => matchCategory(t, activeCategory))
  const totalToppers = filteredToppers.length
  const maxTopperIndex = Math.max(0, totalToppers - topperItemsPerView)

  useEffect(() => {
    if (topperIndex > maxTopperIndex) {
      setTopperIndex(0)
    }
  }, [topperItemsPerView, maxTopperIndex, activeCategory])

  const handlePrevTopper = () => {
    if (totalToppers <= topperItemsPerView) return
    setTopperIndex(prev => (prev <= 0 ? maxTopperIndex : prev - 1))
  }

  const handleNextTopper = () => {
    if (totalToppers <= topperItemsPerView) return
    setTopperIndex(prev => (prev >= maxTopperIndex ? 0 : prev + 1))
  }

  const handleTopperTouchStart = (e) => {
    topperTouchStartX.current = e.touches[0].clientX
  }

  const handleTopperTouchEnd = (e) => {
    if (topperTouchStartX.current === null) return
    const diffX = topperTouchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diffX) > 40) {
      if (diffX > 0) {
        handleNextTopper()
      } else {
        handlePrevTopper()
      }
    }
    topperTouchStartX.current = null
  }

  const visibleTopperCards = totalToppers > topperItemsPerView
    ? filteredToppers.slice(topperIndex, topperIndex + topperItemsPerView)
    : filteredToppers

  // ── Results Gallery Banners Carousel Logic ──
  const totalGallery = galleryImages.length
  const maxGalleryIndex = Math.max(0, totalGallery - galleryItemsPerView)

  useEffect(() => {
    if (galleryIndex > maxGalleryIndex) {
      setGalleryIndex(0)
    }
  }, [galleryItemsPerView, maxGalleryIndex])

  const handlePrevGallery = () => {
    if (totalGallery <= galleryItemsPerView) return
    setGalleryIndex(prev => (prev <= 0 ? maxGalleryIndex : prev - 1))
  }

  const handleNextGallery = () => {
    if (totalGallery <= galleryItemsPerView) return
    setGalleryIndex(prev => (prev >= maxGalleryIndex ? 0 : prev + 1))
  }

  const handleGalleryTouchStart = (e) => {
    galleryTouchStartX.current = e.touches[0].clientX
  }

  const handleGalleryTouchEnd = (e) => {
    if (galleryTouchStartX.current === null) return
    const diffX = galleryTouchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diffX) > 40) {
      if (diffX > 0) {
        handleNextGallery()
      } else {
        handlePrevGallery()
      }
    }
    galleryTouchStartX.current = null
  }

  const visibleGalleryCards = totalGallery > galleryItemsPerView
    ? galleryImages.slice(galleryIndex, galleryIndex + galleryItemsPerView)
    : galleryImages

  return (
    <section className="ss-unified-section" id="success-stories">
      {/* Background Image Merged with Gradient Overlay */}
      <div className="ss-bg-layer" aria-hidden="true" />

      <div className="ss-container">

        {/* ════════ TOP HEADER BLOCK ════════ */}
        <div className="ss-header-block">
          {/* Top-Left Floating Cursive Script Accent */}
          <div className="ss-script-top-left" aria-hidden="true">
            <div className="ss-script-text">
              {(config.scriptTopLeft || 'Learn\nPrepare\nSucceed').split('\n').filter(Boolean).map((line, lIdx) => (
                <span key={lIdx}>{line}</span>
              ))}
              <svg className="ss-script-curve" viewBox="0 0 70 12" fill="none">
                <path d="M2 9C22 2 48 2 68 9" stroke="#F5D061" strokeWidth="2.2" strokeLinecap="round"/>
              </svg>
            </div>
          </div>

          {/* Top-Right Floating Cursive Script Accent */}
          <div className="ss-script-top-right" aria-hidden="true">
            <div className="ss-script-text">
              {(config.scriptTopRight || 'Different\nAspirations\nOne\nDestination').split('\n').filter(Boolean).map((line, lIdx) => (
                <span key={lIdx}>{line}</span>
              ))}
            </div>
          </div>

          {/* Centered Pill Eyebrow */}
          <div className="ss-eyebrow-pill">
            <span>{config.eyebrow || 'NERMAI SUCCESS STORIES'}</span>
          </div>

          {/* Main Display Heading */}
          <h2 className="ss-main-heading">
            {config.titlePrefix || 'From Aspirants to'}{' '}
            <span className="ss-title-gold">{config.titleHighlight || 'Achievers'}</span>
          </h2>

          {/* Subtitle */}
          <p className="ss-subtitle">
            {config.subtitle || 'Real journeys. Real people. Real results. Be inspired by our students who turned their dreams into reality with Nermai.'}
          </p>
        </div>

        {/* ════════ ROW 1: OUR TOPPERS ════════ */}
        <div className="ss-toppers-section">
          <div className="ss-section-header-row">
            <div className="ss-section-title-wrap">
              <div className="ss-section-badge-title">
                <i className="fa-solid fa-crown ss-crown-icon" />
                <span>{config.toppersSubheading || 'OUR TOPPERS'}</span>
                <span className="ss-title-line" />
              </div>
              <p className="ss-section-desc">
                {config.toppersDesc || 'Meet our achievers who made it happen with dedication, guidance and the Nermai way.'}
              </p>
            </div>

            <Link to={config.toppersViewAllLink || '/results'} className="ss-view-all-link">
              <span>{config.toppersViewAllText || 'View All Toppers'}</span>
              <i className="fa-solid fa-arrow-right" />
            </Link>
          </div>

          {/* Category Filter Pills */}
          <div className="ss-category-pills-bar">
            {BASE_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                type="button"
                className={`ss-cat-pill ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveCategory(cat.id)
                  setTopperIndex(0)
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Toppers Cards Carousel Row */}
          <div
            className="ss-toppers-carousel-row"
            onTouchStart={handleTopperTouchStart}
            onTouchEnd={handleTopperTouchEnd}
          >
            <button
              type="button"
              className="ss-carousel-arrow-btn ss-topper-prev"
              onClick={handlePrevTopper}
              disabled={totalToppers <= topperItemsPerView}
              title="Previous achiever"
              aria-label="Previous achiever"
            >
              <i className="fa-solid fa-chevron-left" />
            </button>

            <div className="ss-toppers-grid-wrapper">
              {visibleTopperCards.length > 0 ? (
                <div className="ss-toppers-grid">
                  {visibleTopperCards.map((t, idx) => {
                    const photoUrl = t.photo ? driveStorage.formatImageUrl(t.photo, 1000) : null
                    let rankNum = (t.rank || '1').toString().replace(/[^0-9]/g, '')
                    if (!rankNum) rankNum = t.rank || '1'
                    const isAir = t.isAir !== false && (t.rankType === 'air' || !t.rankType || String(t.rank).toLowerCase().includes('air'))

                    return (
                      <div
                        key={t.id || idx}
                        className="ss-topper-card"
                        onClick={() => setSelectedStory(t)}
                      >
                        {/* Top: Photo with Gold Rank Badge */}
                        <div className="ss-topper-photo-wrap">
                          {photoUrl ? (
                            <img
                              src={photoUrl}
                              alt={t.name}
                              className="ss-topper-photo"
                              referrerPolicy="no-referrer"
                              onError={(e) => driveStorage.handleImageError(e, '')}
                            />
                          ) : (
                            <div className="ss-topper-photo-fallback">
                              <span>{t.name ? t.name.charAt(0) : '★'}</span>
                            </div>
                          )}

                          <div className="ss-topper-rank-badge">
                            {isAir && <i className="fa-solid fa-crown ss-badge-crown" />}
                            <span className="ss-rank-air-lbl">{isAir ? 'AIR' : 'Rank'}</span>
                            <span className="ss-rank-number">{rankNum}</span>
                          </div>
                        </div>

                        {/* Bottom: Info Bar */}
                        <div className="ss-topper-info-wrap">
                          <h3 className="ss-topper-name">{t.name}</h3>
                          <div className="ss-topper-exam">
                            {t.exam || 'Civil Services'}{t.year ? ` (${t.year})` : ''}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="ss-no-toppers-box">
                  <i className="fa-solid fa-graduation-cap" style={{ fontSize: '1.75rem', color: '#F5D061', marginBottom: '0.5rem' }} />
                  <h4>No Achievers in this Category</h4>
                  <p>Achievers added in the Results portal will appear here automatically.</p>
                  {activeCategory !== 'all' && (
                    <button type="button" className="ss-cat-pill active" onClick={() => setActiveCategory('all')} style={{ marginTop: '0.5rem' }}>
                      View All Categories
                    </button>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              className="ss-carousel-arrow-btn ss-topper-next"
              onClick={handleNextTopper}
              disabled={totalToppers <= topperItemsPerView}
              title="Next achiever"
              aria-label="Next achiever"
            >
              <i className="fa-solid fa-chevron-right" />
            </button>
          </div>

          {/* Topper Carousel Dots */}
          {totalToppers > topperItemsPerView && (
            <div className="ss-topper-dots-row">
              {Array.from({ length: Math.min(6, Math.max(2, totalToppers - topperItemsPerView + 1)) }).map((_, dIdx) => (
                <button
                  key={dIdx}
                  type="button"
                  className={`ss-testi-dot ${topperIndex === dIdx ? 'active' : ''}`}
                  onClick={() => setTopperIndex(dIdx)}
                  aria-label={`Achiever group ${dIdx + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* ════════ ROW 2: RESULTS GALLERY (ADDITIONAL BANNER SECTION) ════════ */}
        {config.showResultsGallery !== false && (
          <div className="ss-gallery-section">
            <div className="ss-section-header-row">
              <div className="ss-section-title-wrap">
                <div className="ss-section-badge-title">
                  <i className="fa-regular fa-images ss-crown-icon" />
                  <span>{config.resultsGalleryHeading || 'RESULTS GALLERY'}</span>
                  <span className="ss-title-line" />
                </div>
                <p className="ss-section-desc">
                  {config.resultsGalleryDesc || 'Various batch results, selections and achievement posters from Nermai IAS Academy.'}
                </p>
              </div>

              <Link to={config.resultsGalleryViewAllLink || '/results'} className="ss-view-all-link">
                <span>{config.resultsGalleryViewAllText || 'View Full Gallery'}</span>
                <i className="fa-solid fa-arrow-right" />
              </Link>
            </div>

            {/* Gallery Carousel Row */}
            <div
              className="ss-gallery-carousel-row"
              onTouchStart={handleGalleryTouchStart}
              onTouchEnd={handleGalleryTouchEnd}
            >
              <div className="ss-gallery-grid-wrapper">
                {visibleGalleryCards.length > 0 ? (
                  <div className="ss-gallery-cards-grid">
                    {visibleGalleryCards.map((item, idx) => {
                      const imgUrl = driveStorage.formatImageUrl(item.url, 1800) || item.url
                      return (
                        <div
                          key={item.id || idx}
                          className="ss-gallery-poster-card"
                          onClick={() => setPreviewPoster(item)}
                          title="Click to preview poster"
                        >
                          <div className="ss-poster-frame">
                            <img
                              src={imgUrl}
                              alt={item.caption || 'Achievement Poster'}
                              className="ss-poster-img"
                              referrerPolicy="no-referrer"
                              onError={(e) => driveStorage.handleImageError(e, '')}
                            />
                            <div className="ss-poster-fallback" style={{ display: 'none', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#F5D061', padding: '1rem' }}>
                              <i className="fa-regular fa-image" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }} />
                              <span style={{ fontSize: '0.85rem', color: '#FAF7F2', fontWeight: 600 }}>{item.caption || 'Achievement Poster'}</span>
                            </div>
                            <div className="ss-poster-overlay">
                              <span className="ss-poster-zoom-btn">
                                <i className="fa-solid fa-expand" /> Preview
                              </span>
                              {item.caption && <span className="ss-poster-caption-tag">{item.caption}</span>}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="ss-no-toppers-box">
                    <i className="fa-regular fa-images" style={{ fontSize: '1.75rem', color: '#F5D061', marginBottom: '0.5rem' }} />
                    <h4>Results & Selection Posters</h4>
                    <p>Posters uploaded in the Admin Results Gallery will automatically appear here.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Navigation Controls: Left Arrow, Dots, Right Arrow */}
            {totalGallery > galleryItemsPerView && (
              <div className="ss-gallery-bottom-controls">
                <button
                  type="button"
                  className="ss-carousel-arrow-btn ss-gallery-prev"
                  onClick={handlePrevGallery}
                  disabled={totalGallery <= galleryItemsPerView}
                  title="Previous poster"
                  aria-label="Previous poster"
                >
                  <i className="fa-solid fa-chevron-left" />
                </button>

                <div className="ss-gallery-dots-row">
                  {Array.from({ length: Math.min(5, Math.max(2, totalGallery - galleryItemsPerView + 1)) }).map((_, dIdx) => (
                    <button
                      key={dIdx}
                      type="button"
                      className={`ss-testi-dot ${galleryIndex === dIdx ? 'active' : ''}`}
                      onClick={() => setGalleryIndex(dIdx)}
                      aria-label={`Gallery page ${dIdx + 1}`}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  className="ss-carousel-arrow-btn ss-gallery-next"
                  onClick={handleNextGallery}
                  disabled={totalGallery <= galleryItemsPerView}
                  title="Next poster"
                  aria-label="Next poster"
                >
                  <i className="fa-solid fa-chevron-right" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ════════ ROW 3: BOTTOM 4 FEATURES BAR ════════ */}
        <div className="ss-bottom-features-bar">
          <div className="ss-feature-col">
            <div className="ss-feature-icon-box">
              <i className={`fa-solid ${config.feature1Icon || 'fa-trophy'}`} />
            </div>
            <div className="ss-feature-info">
              <div className="ss-feature-title">{config.feature1Title || 'Expert Guidance'}</div>
              <div className="ss-feature-desc">{config.feature1Desc || 'By experienced faculty and mentors'}</div>
            </div>
          </div>
          <div className="ss-feature-sep" />

          <div className="ss-feature-col">
            <div className="ss-feature-icon-box">
              <i className={`fa-solid ${config.feature2Icon || 'fa-book-open'}`} />
            </div>
            <div className="ss-feature-info">
              <div className="ss-feature-title">{config.feature2Title || 'Structured Learning'}</div>
              <div className="ss-feature-desc">{config.feature2Desc || 'From basics to advanced'}</div>
            </div>
          </div>
          <div className="ss-feature-sep" />

          <div className="ss-feature-col">
            <div className="ss-feature-icon-box">
              <i className={`fa-solid ${config.feature3Icon || 'fa-chart-line'}`} />
            </div>
            <div className="ss-feature-info">
              <div className="ss-feature-title">{config.feature3Title || 'Proven Results'}</div>
              <div className="ss-feature-desc">{config.feature3Desc || 'Across competitive exams'}</div>
            </div>
          </div>
          <div className="ss-feature-sep" />

          <div className="ss-feature-col">
            <div className="ss-feature-icon-box">
              <i className={`fa-solid ${config.feature4Icon || 'fa-users'}`} />
            </div>
            <div className="ss-feature-info">
              <div className="ss-feature-title">{config.feature4Title || 'Diverse Backgrounds'}</div>
              <div className="ss-feature-desc">{config.feature4Desc || 'Students from towns, cities and rural areas'}</div>
            </div>
          </div>
        </div>

      </div>

      {/* ── Full Size Poster Lightbox Modal ── */}
      {previewPoster && (
        <div className="ss-lightbox-overlay" onClick={() => setPreviewPoster(null)}>
          <div className="ss-lightbox-content" onClick={e => e.stopPropagation()}>
            <button className="ss-lightbox-close" onClick={() => setPreviewPoster(null)} type="button" aria-label="Close preview">
              <i className="fa-solid fa-xmark" />
            </button>
            <div className="ss-lightbox-img-wrap">
              <img
                src={driveStorage.formatImageUrl(previewPoster.url, 1800) || previewPoster.url}
                alt={previewPoster.caption || 'Result Poster'}
                className="ss-lightbox-img"
                referrerPolicy="no-referrer"
                onError={(e) => driveStorage.handleImageError(e, '')}
              />
            </div>
            {previewPoster.caption && (
              <div className="ss-lightbox-caption">
                <i className="fa-solid fa-award ss-lightbox-icon" />
                <span>{previewPoster.caption}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Topper Story Modal ── */}
      {selectedStory && (
        <div className="rp-modal-overlay" onClick={() => setSelectedStory(null)}>
          <div className="rp-modal" onClick={e => e.stopPropagation()}>
            <button className="rp-modal-close" onClick={() => setSelectedStory(null)} type="button">
              <i className="fa-solid fa-xmark" />
            </button>
            <div className="rp-modal-header">
              {selectedStory.photo && (
                <img
                  src={driveStorage.formatImageUrl(selectedStory.photo, 1000)}
                  alt={selectedStory.name}
                  className="rp-modal-photo"
                  referrerPolicy="no-referrer"
                  onError={(e) => driveStorage.handleImageError(e, '')}
                />
              )}
              <div className="rp-modal-header-info">
                <div className="rp-modal-exam-badge">{selectedStory.exam}</div>
                <h3 className="rp-modal-name">{selectedStory.name}</h3>
                <div className="rp-modal-meta">
                  {selectedStory.rank && <span className="rp-modal-rank">AIR #{selectedStory.rank}</span>}
                  {selectedStory.year && <span>{selectedStory.year}</span>}
                </div>
              </div>
            </div>
            {selectedStory.quote && (
              <div className="rp-modal-quote">
                <i className="fa-solid fa-quote-left" />
                <p>"{selectedStory.quote}"</p>
              </div>
            )}
            {selectedStory.story ? (
              <div className="rp-modal-story">
                <h4>Preparation Journey</h4>
                <p>{selectedStory.story}</p>
              </div>
            ) : (
              <div className="rp-modal-story">
                <h4>Preparation Journey</h4>
                <p>{selectedStory.name} prepared with dedication and cleared {selectedStory.exam} with an outstanding rank through structured classroom guidance and mentor support at Nermai IAS Academy.</p>
              </div>
            )}
          </div>
        </div>
      )}

    </section>
  )
}

