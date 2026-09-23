import React, { useState, useEffect } from 'react'
import { fbFirestore } from '../firebase/firestore'
import { driveStorage } from '../services/driveStorage'
import './CoursesHero.css'

export const DEFAULT_COURSES_HERO = {
  visible: true,
  eyebrow: 'ACADEMIC PROGRAMS & COURSES',
  eyebrowIcon: 'fa-building-columns',
  titleLine1: 'Choose Your Path to',
  titleLine2: 'Government Service',
  subtitle: 'Renowned coaching for UPSC (Civil Services), Puducherry UDC, LDC, Sub-Inspector, Deputy Tahsildar, TNPSC Group I/II/IV and other competitive examinations.',
  leftScriptLine1: 'Learn',
  leftScriptLine2: 'Prepare',
  leftScriptLine3: 'Succeed',
  rightScriptLine1: 'Different',
  rightScriptLine2: 'Aspirations',
  rightScriptLine3: 'One',
  rightScriptLine4: 'Destination',
  feature1Icon: 'fa-graduation-cap',
  feature1Title: 'Expert Faculty',
  feature1Sub: '15+ Years of Experience',
  feature2Icon: 'fa-file-lines',
  feature2Title: 'Structured Learning',
  feature2Sub: 'From Basics to Advanced',
  feature3Icon: 'fa-chart-column',
  feature3Title: 'Proven Results',
  feature3Sub: 'Guiding Aspirants to Success',
  artworkImageUrl: '', // Empty means fallback to default asset image
  showScripts: true,
  showFeatures: true,
  showArtwork: true
}

export const DEFAULT_COURSES_ARTWORK_ASSET = '/courses-hero-artwork.jpg'

export default function CoursesHero({ customConfig }) {
  const [config, setConfig] = useState(customConfig || DEFAULT_COURSES_HERO)

  useEffect(() => {
    fbFirestore.getSettings().then(s => {
      if (s?.coursesHero) {
        setConfig(prev => ({ ...DEFAULT_COURSES_HERO, ...s.coursesHero }))
      }
    })

    const unsub = fbFirestore.onSettingsChanged?.(s => {
      if (s?.coursesHero) {
        setConfig(prev => ({ ...DEFAULT_COURSES_HERO, ...s.coursesHero }))
      }
    })

    return () => unsub && unsub()
  }, [])

  if (config.visible === false) return null

  // Clean empty-aware values
  const eyebrow = config.eyebrow !== undefined ? config.eyebrow : DEFAULT_COURSES_HERO.eyebrow
  const eyebrowIcon = config.eyebrowIcon || 'fa-building-columns'
  const titleLine1 = config.titleLine1 !== undefined ? config.titleLine1 : DEFAULT_COURSES_HERO.titleLine1
  const titleLine2 = config.titleLine2 !== undefined ? config.titleLine2 : DEFAULT_COURSES_HERO.titleLine2
  const subtitle = config.subtitle !== undefined ? config.subtitle : DEFAULT_COURSES_HERO.subtitle

  // Floating scripts
  const showScripts = config.showScripts !== false
  const leftScript1 = config.leftScriptLine1 !== undefined ? config.leftScriptLine1 : DEFAULT_COURSES_HERO.leftScriptLine1
  const leftScript2 = config.leftScriptLine2 !== undefined ? config.leftScriptLine2 : DEFAULT_COURSES_HERO.leftScriptLine2
  const leftScript3 = config.leftScriptLine3 !== undefined ? config.leftScriptLine3 : DEFAULT_COURSES_HERO.leftScriptLine3

  const rightScript1 = config.rightScriptLine1 !== undefined ? config.rightScriptLine1 : DEFAULT_COURSES_HERO.rightScriptLine1
  const rightScript2 = config.rightScriptLine2 !== undefined ? config.rightScriptLine2 : DEFAULT_COURSES_HERO.rightScriptLine2
  const rightScript3 = config.rightScriptLine3 !== undefined ? config.rightScriptLine3 : DEFAULT_COURSES_HERO.rightScriptLine3
  const rightScript4 = config.rightScriptLine4 !== undefined ? config.rightScriptLine4 : DEFAULT_COURSES_HERO.rightScriptLine4

  const hasLeftScript = showScripts && Boolean((leftScript1 ?? '').trim() || (leftScript2 ?? '').trim() || (leftScript3 ?? '').trim())
  const hasRightScript = showScripts && Boolean((rightScript1 ?? '').trim() || (rightScript2 ?? '').trim() || (rightScript3 ?? '').trim() || (rightScript4 ?? '').trim())

  // Feature pills
  const showFeatures = config.showFeatures !== false
  const f1Title = config.feature1Title !== undefined ? config.feature1Title : DEFAULT_COURSES_HERO.feature1Title
  const f1Sub = config.feature1Sub !== undefined ? config.feature1Sub : DEFAULT_COURSES_HERO.feature1Sub
  const f1Icon = config.feature1Icon || 'fa-graduation-cap'

  const f2Title = config.feature2Title !== undefined ? config.feature2Title : DEFAULT_COURSES_HERO.feature2Title
  const f2Sub = config.feature2Sub !== undefined ? config.feature2Sub : DEFAULT_COURSES_HERO.feature2Sub
  const f2Icon = config.feature2Icon || 'fa-file-lines'

  const f3Title = config.feature3Title !== undefined ? config.feature3Title : DEFAULT_COURSES_HERO.feature3Title
  const f3Sub = config.feature3Sub !== undefined ? config.feature3Sub : DEFAULT_COURSES_HERO.feature3Sub
  const f3Icon = config.feature3Icon || 'fa-chart-column'

  const hasF1 = showFeatures && Boolean((f1Title ?? '').trim() || (f1Sub ?? '').trim())
  const hasF2 = showFeatures && Boolean((f2Title ?? '').trim() || (f2Sub ?? '').trim())
  const hasF3 = showFeatures && Boolean((f3Title ?? '').trim() || (f3Sub ?? '').trim())
  const hasFeaturesRow = hasF1 || hasF2 || hasF3

  // Artwork image: Uploaded by Drive / URL, or fallback to asset image
  const showArtwork = config.showArtwork !== false
  const rawArtwork = (config.artworkImageUrl || '').trim()
  const displayArtworkUrl = rawArtwork ? driveStorage.formatImageUrl(rawArtwork) : DEFAULT_COURSES_ARTWORK_ASSET

  return (
    <section className="courses-hero-banner" aria-label="Academic Programs & Courses">

      {/* Full-bleed background image */}
      <img
        src={displayArtworkUrl}
        alt=""
        className="courses-hero-bg-img"
        crossOrigin="anonymous"
        aria-hidden="true"
        onError={(e) => {
          // First try Drive CDN fallbacks if this is a Drive URL
          const step = e.currentTarget.dataset.fallbackStep
          if (!step && e.currentTarget.src !== DEFAULT_COURSES_ARTWORK_ASSET) {
            driveStorage.handleImageError(e, DEFAULT_COURSES_ARTWORK_ASSET)
          } else if (e.currentTarget.src !== DEFAULT_COURSES_ARTWORK_ASSET) {
            e.currentTarget.src = DEFAULT_COURSES_ARTWORK_ASSET
          }
        }}
      />

      <div className="courses-hero-container">

        {/* Main Content */}
        <div className="courses-hero-content">

          {/* Eyebrow Badge */}
          {Boolean((eyebrow ?? '').trim()) && (
            <div className="courses-hero-eyebrow-wrapper">
              <span className="courses-hero-eyebrow-line" />
              <div className="courses-hero-eyebrow-badge">
                <i className={`fa-solid ${eyebrowIcon}`} />
                <span>{eyebrow}</span>
              </div>
              <span className="courses-hero-eyebrow-line right" />
            </div>
          )}

          {/* Heading */}
          {(Boolean((titleLine1 ?? '').trim()) || Boolean((titleLine2 ?? '').trim())) && (
            <h1 className="courses-hero-title">
              {Boolean((titleLine1 ?? '').trim()) && <span>{titleLine1} </span>}
              {Boolean((titleLine2 ?? '').trim()) && <span className="title-gold">{titleLine2}</span>}
            </h1>
          )}

          {/* Subtitle */}
          {Boolean((subtitle ?? '').trim()) && (
            <p className="courses-hero-subtitle">{subtitle}</p>
          )}

          {/* 3 Feature Pills Row */}
          {hasFeaturesRow && (
            <div className="courses-hero-features-row">
              {hasF1 && (
                <div className="courses-hero-feature-item">
                  <div className="courses-hero-feature-icon-circle">
                    <i className={`fa-solid ${f1Icon}`} />
                  </div>
                  <div className="courses-hero-feature-text">
                    {Boolean((f1Title ?? '').trim()) && <div className="courses-hero-feature-title">{f1Title}</div>}
                    {Boolean((f1Sub ?? '').trim()) && <div className="courses-hero-feature-sub">{f1Sub}</div>}
                  </div>
                </div>
              )}

              {hasF2 && (
                <div className="courses-hero-feature-item">
                  <div className="courses-hero-feature-icon-circle">
                    <i className={`fa-solid ${f2Icon}`} />
                  </div>
                  <div className="courses-hero-feature-text">
                    {Boolean((f2Title ?? '').trim()) && <div className="courses-hero-feature-title">{f2Title}</div>}
                    {Boolean((f2Sub ?? '').trim()) && <div className="courses-hero-feature-sub">{f2Sub}</div>}
                  </div>
                </div>
              )}

              {hasF3 && (
                <div className="courses-hero-feature-item">
                  <div className="courses-hero-feature-icon-circle">
                    <i className={`fa-solid ${f3Icon}`} />
                  </div>
                  <div className="courses-hero-feature-text">
                    {Boolean((f3Title ?? '').trim()) && <div className="courses-hero-feature-title">{f3Title}</div>}
                    {Boolean((f3Sub ?? '').trim()) && <div className="courses-hero-feature-sub">{f3Sub}</div>}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

      </div>

      {/* Smooth Organic Wave Divider into page content */}
      <div className="courses-hero-wave-divider" aria-hidden="true">
        <svg viewBox="0 0 1440 90" fill="none" preserveAspectRatio="none">
          {/* Subtle gold shimmer accent wave line */}
          <path
            d="M0,45 C280,75 520,15 800,50 C1080,85 1320,30 1440,60 L1440,90 L0,90 Z"
            fill="none"
            stroke="rgba(245, 208, 97, 0.45)"
            strokeWidth="2.5"
          />
          {/* Main cream background wave */}
          <path
            d="M0,50 C320,85 640,20 960,65 C1200,95 1360,40 1440,70 L1440,90 L0,90 Z"
            fill="#FFFDF9"
          />
        </svg>
      </div>

    </section>
  )
}
