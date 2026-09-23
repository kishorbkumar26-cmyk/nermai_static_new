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

  testimonialsHeading: 'TESTIMONIALS',
  testimonialsSubtitle: 'Honest feedback from our students.',
  testimonialsScript: 'Real Stories. Real Impact.',
  showTestimonials: true,

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
  const [testimonials, setTestimonials] = useState([])
  const [activeCategory, setActiveCategory] = useState('all')
  const [topperIndex, setTopperIndex] = useState(0)
  const [testiIndex, setTestiIndex] = useState(0)
  const [selectedStory, setSelectedStory] = useState(null)
  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth <= 768 : false))
  const touchStartX = useRef(null)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

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

    // 3. Testimonials Data (Actual live testimonials data from Admin/Firestore)
    const unsubTesti = fbFirestore.onTestimonialsChanged?.(items => {
      if (items && Array.isArray(items)) {
        setTestimonials(items.filter(i => i && i.visible !== false))
      } else {
        fbFirestore.getTestimonials?.().then(res => {
          if (res && Array.isArray(res)) {
            setTestimonials(res.filter(i => i && i.visible !== false))
          } else {
            setTestimonials([])
          }
        }).catch(() => setTestimonials([]))
      }
    })

    return () => {
      unsubSettings && unsubSettings()
      unsubResults && unsubResults()
      unsubTesti && unsubTesti()
    }
  }, [])

  // Filter actual toppers by selected category
  const filteredToppers = toppers.filter(t => matchCategory(t, activeCategory))
  const totalCards = filteredToppers.length

  // Visible toppers: 1 per view on mobile, 3 on desktop
  const topperTouchStartX = useRef(null)
  const topperItemsPerView = isMobile ? 1 : 3
  const maxTopperIndex = Math.max(0, totalCards - topperItemsPerView)

  useEffect(() => {
    if (topperIndex > maxTopperIndex) {
      setTopperIndex(0)
    }
  }, [isMobile, maxTopperIndex, activeCategory])

  const handlePrevTopper = () => {
    if (totalCards <= topperItemsPerView) return
    setTopperIndex(prev => (prev <= 0 ? maxTopperIndex : prev - 1))
  }

  const handleNextTopper = () => {
    if (totalCards <= topperItemsPerView) return
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

  const visibleTopperCards = totalCards > topperItemsPerView
    ? filteredToppers.slice(topperIndex, topperIndex + topperItemsPerView)
    : filteredToppers

  // Testimonials: 1 per view on mobile, 3 on desktop
  const itemsPerView = isMobile ? 1 : 3
  const totalTestis = testimonials.length
  const maxTestiIndex = Math.max(0, totalTestis - itemsPerView)

  useEffect(() => {
    if (testiIndex > maxTestiIndex) {
      setTestiIndex(0)
    }
  }, [isMobile, maxTestiIndex])

  const handlePrevTesti = () => {
    if (totalTestis <= itemsPerView) return
    setTestiIndex(prev => (prev <= 0 ? maxTestiIndex : prev - 1))
  }

  const handleNextTesti = () => {
    if (totalTestis <= itemsPerView) return
    setTestiIndex(prev => (prev >= maxTestiIndex ? 0 : prev + 1))
  }

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return
    const diffX = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diffX) > 40) {
      if (diffX > 0) {
        handleNextTesti()
      } else {
        handlePrevTesti()
      }
    }
    touchStartX.current = null
  }

  const visibleTestimonials = totalTestis > itemsPerView
    ? testimonials.slice(testiIndex, testiIndex + itemsPerView)
    : testimonials

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
              disabled={totalCards <= topperItemsPerView}
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

                    return (
                      <div
                        key={t.id || idx}
                        className="ss-topper-card"
                        onClick={() => setSelectedStory(t)}
                      >
                        {/* Left: Photo */}
                        <div className="ss-topper-photo-wrap">
                          {photoUrl ? (
                            <img
                              src={photoUrl}
                              alt={t.name}
                              className="ss-topper-photo"
                              onError={(e) => driveStorage.handleImageError(e, '')}
                            />
                          ) : (
                            <div className="ss-topper-photo-fallback">
                              <span>{t.name ? t.name.charAt(0) : '★'}</span>
                            </div>
                          )}
                        </div>

                        {/* Right: Info & Gold Rank Badge */}
                        <div className="ss-topper-info-wrap">
                          <div className="ss-topper-rank-badge">
                            <i className="fa-solid fa-crown ss-badge-crown" />
                            <span className="ss-rank-air-lbl">AIR</span>
                            <span className="ss-rank-number">{rankNum}</span>
                          </div>

                          <h3 className="ss-topper-name">{t.name}</h3>
                          <div className="ss-topper-exam">
                            {t.exam || 'Civil Services'}{t.year ? ` (${t.year})` : ''}
                          </div>
                          {t.quote && (
                            <p className="ss-topper-quote">"{t.quote}"</p>
                          )}
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
              disabled={totalCards <= topperItemsPerView}
              title="Next achiever"
              aria-label="Next achiever"
            >
              <i className="fa-solid fa-chevron-right" />
            </button>
          </div>

          {/* Topper Carousel Dots */}
          {totalCards > topperItemsPerView && (
            <div className="ss-topper-dots-row">
              {Array.from({ length: isMobile ? totalCards : Math.min(5, Math.max(1, totalCards - 2)) }).map((_, dIdx) => (
                <button
                  key={dIdx}
                  type="button"
                  className={`ss-testi-dot ${topperIndex === dIdx ? 'active' : ''}`}
                  onClick={() => setTopperIndex(dIdx)}
                  aria-label={`Achiever ${dIdx + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* ════════ ROW 2: TESTIMONIALS ════════ */}
        {config.showTestimonials !== false && <div className="ss-testimonials-section">
          <div className="ss-section-header-row">
            <div className="ss-section-title-wrap">
              <div className="ss-section-badge-title">
                <span className="ss-quote-icon-txt">❝</span>
                <span>{config.testimonialsHeading || 'TESTIMONIALS'}</span>
                <span className="ss-title-line" />
              </div>
              <p className="ss-section-desc">
                {config.testimonialsSubtitle || 'Honest feedback from our students.'}
              </p>
            </div>

            <div className="ss-testi-handwritten-badge" aria-hidden="true">
              {config.testimonialsScript || 'Real Stories. Real Impact.'}
            </div>
          </div>

          {/* Testimonials Carousel Row */}
          <div
            className="ss-testi-carousel-row"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <button
              type="button"
              className="ss-carousel-arrow-btn ss-carousel-prev"
              onClick={handlePrevTesti}
              disabled={totalTestis <= itemsPerView}
              title="Previous testimonial"
              aria-label="Previous testimonial"
            >
              <i className="fa-solid fa-chevron-left" />
            </button>

            <div className="ss-testi-cards-grid">
              {visibleTestimonials.map((t, idx) => {
                const initial = t.name ? t.name.trim().charAt(0).toUpperCase() : '★'
                return (
                  <div key={t.id || (t.name ? t.name + idx : idx)} className="ss-testi-white-card">
                    <div className="ss-card-top-quote-mark">❝</div>
                    <p className="ss-testi-quote-body">
                      {t.quote || t.text || t.content}
                    </p>
                    <div className="ss-testi-author-row">
                      <div className="ss-author-avatar-circle">
                        {initial}
                      </div>
                      <div className="ss-author-details">
                        <div className="ss-author-name">{t.name}</div>
                        <div className="ss-author-role">{t.role || t.exam || 'Nermai Aspirant'}</div>
                      </div>
                    </div>
                    <div className="ss-card-watermark-quote" aria-hidden="true">❞</div>
                  </div>
                )
              })}
            </div>

            <button
              type="button"
              className="ss-carousel-arrow-btn ss-carousel-next"
              onClick={handleNextTesti}
              disabled={totalTestis <= itemsPerView}
              title="Next testimonial"
              aria-label="Next testimonial"
            >
              <i className="fa-solid fa-chevron-right" />
            </button>
          </div>

          {/* Carousel Dots */}
          {totalTestis > itemsPerView && (
            <div className="ss-testi-dots-row">
              {Array.from({ length: isMobile ? totalTestis : Math.min(4, Math.max(1, totalTestis - 2)) }).map((_, dIdx) => (
                <button
                  key={dIdx}
                  type="button"
                  className={`ss-testi-dot ${testiIndex === dIdx ? 'active' : ''}`}
                  onClick={() => setTestiIndex(dIdx)}
                  aria-label={`Slide ${dIdx + 1}`}
                />
              ))}
            </div>
          )}
        </div>}

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
                  crossOrigin={driveStorage.formatImageUrl(selectedStory.photo)?.includes('lh3.google') ? 'anonymous' : undefined}
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
