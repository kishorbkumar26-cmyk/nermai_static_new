import React, { useState } from 'react'
import { Target, BookOpen, MonitorPlay, BarChart2, Trophy, ChevronRight, ArrowRight, Image as ImageIcon } from 'lucide-react'
import { driveStorage } from '../services/driveStorage'
import './JourneySection.css'

const DEFAULT_MOCKUP_STEPS = [
  {
    number: '01',
    title: 'Choose Your Goal',
    description: 'Select the competitive examination you want to prepare for.',
    btnText: 'EXPLORE EXAMS →',
    link: '/courses',
    badgeColor: '#C85A17',
    bgColor: '#FFFBF7',
    btnBg: '#FCEFE6',
    btnColor: '#C85A17',
    icon: <Target size={28} style={{ color: '#C85A17' }} />
  },
  {
    number: '02',
    title: 'Find Your Course',
    description: 'Explore the right batch, programme and learning structure for your needs.',
    btnText: 'VIEW COURSES →',
    link: '/courses',
    badgeColor: '#D48817',
    bgColor: '#FFFDF7',
    btnBg: '#FEF6E6',
    btnColor: '#D48817',
    icon: <BookOpen size={28} style={{ color: '#D48817' }} />
  },
  {
    number: '03',
    title: 'Begin Your Learning',
    description: 'Join classes and access structured study resources.',
    btnText: 'JOIN CLASS PLATFORM →',
    link: 'https://lms.nermaiiasacademy.in',
    badgeColor: '#5C0F1E',
    bgColor: '#FDF6F7',
    btnBg: '#F9EBEF',
    btnColor: '#5C0F1E',
    icon: <MonitorPlay size={28} style={{ color: '#5C0F1E' }} />
  },
  {
    number: '04',
    title: 'Practice & Progress',
    description: 'Attend tests, evaluate performance and improve continuously.',
    btnText: 'TAKE A MOCK TEST →',
    link: '#mock-tests',
    badgeColor: '#756B61',
    bgColor: '#FAF9F7',
    btnBg: '#F0EEE9',
    btnColor: '#5E554D',
    icon: <BarChart2 size={28} style={{ color: '#756B61' }} />
  },
  {
    number: '05',
    title: 'Achieve Your Goal',
    description: 'Complete your preparation journey with confidence and become a successful government officer.',
    btnText: 'OUR SUCCESS STORIES →',
    link: '#success-stories',
    badgeColor: '#1B6B48',
    bgColor: '#F4FAF6',
    btnBg: '#E4F4EA',
    btnColor: '#1B6B48',
    icon: <Trophy size={28} style={{ color: '#1B6B48' }} />
  }
]

const TAMIL_TO_ENGLISH_MAP = {
  'உங்கள் இலக்கை தேர்வு செய்யுங்கள்': 'Choose Your Goal',
  'பயிற்சியை தேர்வு செய்யுங்கள்': 'Find Your Course',
  'பயிற்சி + தேர்வுகள்': 'Classes & Mock Tests',
  'இலக்கை அடையுங்கள்': 'Achieve Your Goal',
}

function toEnglishText(val, fallback) {
  if (!val || typeof val !== 'string') return fallback
  const trimmed = val.trim()
  if (TAMIL_TO_ENGLISH_MAP[trimmed]) return TAMIL_TO_ENGLISH_MAP[trimmed]
  // If contains Tamil script characters, use English fallback
  if (/[\u0B80-\u0BFF]/.test(trimmed)) {
    return fallback
  }
  return trimmed
}

export default function JourneySection({ steps }) {
  const [activeModalImage, setActiveModalImage] = useState(null)

  // Map admin steps dynamically while supporting custom titles, descriptions, image uploads & links
  const renderSteps = (steps && steps.length > 0) ? steps.map((s, i) => {
    const def = DEFAULT_MOCKUP_STEPS[i % DEFAULT_MOCKUP_STEPS.length]
    return {
      id: s.id || i + 1,
      number: String(i + 1).padStart(2, '0'),
      title: toEnglishText(s.title, def.title),
      description: toEnglishText(s.description, def.description),
      btnText: toEnglishText(s.btnText, def.btnText),
      link: s.link || s.href || def.link,
      imageUrl: s.imageUrl || '',
      badgeColor: def.badgeColor,
      bgColor: def.bgColor,
      btnBg: def.btnBg,
      btnColor: def.btnColor,
      icon: def.icon
    }
  }) : DEFAULT_MOCKUP_STEPS

  return (
    <section className="journey-section-wrap" id="journey" aria-label="Your Journey with Nermai">
      <div className="container" style={{ maxWidth: '1440px' }}>
        
        {/* Section Header */}
        <div className="journey-header-box">
          <div className="journey-top-tag">
            <span className="journey-tag-line" />
            <span className="journey-tag-text">YOUR JOURNEY</span>
            <span className="journey-tag-line" />
          </div>
          <h2 className="journey-main-title">Your Journey with Nermai</h2>
          <p className="journey-subtitle">A step-by-step path to turn your aspirations into success.</p>
        </div>

        {/* 5-Step Process Horizontal Cards */}
        <div className="journey-grid-container">
          {renderSteps.map((step, idx) => {
            const isLast = idx === renderSteps.length - 1
            const formattedImg = step.imageUrl ? driveStorage.formatImageUrl(step.imageUrl, 1000) : null

            return (
              <React.Fragment key={step.id || idx}>
                {/* Step Card */}
                <div 
                  className="journey-card-box"
                  style={{ backgroundColor: step.bgColor }}
                >
                  {/* Top Badge Number Circle */}
                  <div 
                    className="journey-card-badge"
                    style={{ backgroundColor: step.badgeColor }}
                  >
                    {step.number}
                  </div>

                  {/* Circle Icon / Admin Image Container */}
                  <div 
                    className="journey-card-icon-circle"
                    onClick={() => formattedImg && setActiveModalImage(formattedImg)}
                    style={{ cursor: formattedImg ? 'pointer' : 'default' }}
                    title={formattedImg ? "Click to view image" : ""}
                  >
                    {formattedImg ? (
                      <img 
                        src={formattedImg} 
                        alt={step.title} 
                        crossOrigin={formattedImg && formattedImg.includes('lh3.google') ? 'anonymous' : undefined}
                        style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
                        onError={(e) => driveStorage.handleImageError(e, '')}
                      />
                    ) : (
                      step.icon
                    )}
                  </div>

                  {/* Card Header & Description */}
                  <h3 className="journey-card-title">{step.title}</h3>
                  <p className="journey-card-desc">{step.description}</p>

                  {/* Card Pill CTA Button */}
                  <div className="journey-card-btn-wrapper">
                    {step.link && step.link.startsWith('http') ? (
                      <a 
                        href={step.link} 
                        target="_blank" 
                        rel="noreferrer"
                        className="journey-card-pill-btn"
                        style={{ backgroundColor: step.btnBg, color: step.btnColor }}
                      >
                        {step.btnText}
                      </a>
                    ) : (
                      <a 
                        href={step.link || '#courses'} 
                        className="journey-card-pill-btn"
                        style={{ backgroundColor: step.btnBg, color: step.btnColor }}
                      >
                        {step.btnText}
                      </a>
                    )}
                  </div>
                </div>

                {/* Connecting Arrow Circle between cards */}
                {!isLast && (
                  <div className="journey-step-connector" aria-hidden="true">
                    <div 
                      className="connector-line-bar"
                      style={{ backgroundColor: `${step.badgeColor}40` }}
                    />
                    <div 
                      className="connector-arrow-circle"
                      style={{ borderColor: step.badgeColor, color: step.badgeColor }}
                    >
                      <ChevronRight size={14} />
                    </div>
                  </div>
                )}
              </React.Fragment>
            )
          })}
        </div>

        {/* Bottom Banner Row: Dome Sketch + CTA + Motto */}
        <div className="journey-footer-row">
          
          {/* Left Building Sketch & Handwritten Text */}
          <div className="journey-footer-left">
            <svg className="journey-building-svg" viewBox="0 0 100 60" fill="none" stroke="#C85A17" strokeWidth="1">
              <path d="M20 55 V35 L50 15 L80 35 V55 H20 Z M50 15 V5 M35 35 H65 M40 55 V42 H60 V55" opacity="0.4" />
              <circle cx="50" cy="25" r="5" stroke="#C85A17" opacity="0.4" />
            </svg>
            <div className="journey-handwriting">
              <span>Same Dedication.</span>
              <span className="handwriting-sub">A Brighter Tomorrow.</span>
            </div>
          </div>

          {/* Center Main CTA Button */}
          <div className="journey-footer-center">
            <a href="#courses" className="journey-main-action-btn">
              <span>START YOUR JOURNEY TODAY</span>
              <ArrowRight size={16} />
            </a>
          </div>

          {/* Right Spaced Motto */}
          <div className="journey-footer-right">
            <span>LEARN</span>
            <span className="motto-dot">•</span>
            <span>PRACTICE</span>
            <span className="motto-dot">•</span>
            <span>IMPROVE</span>
            <span className="motto-dot">•</span>
            <span>SUCCEED</span>
          </div>

        </div>

      </div>

      {/* Admin Image Modal Viewer */}
      {activeModalImage && (
        <div className="search-modal-overlay" onClick={() => setActiveModalImage(null)}>
          <div 
            style={{ 
              maxWidth: '700px', 
              width: '90%', 
              background: '#FFFDF9', 
              padding: '1.5rem', 
              borderRadius: '20px', 
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
              position: 'relative'
            }}
            onClick={e => e.stopPropagation()}
          >
            <img 
              src={activeModalImage} 
              alt="Step Detail" 
              crossOrigin={activeModalImage && activeModalImage.includes('lh3.google') ? 'anonymous' : undefined}
              style={{ width: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: '12px' }} 
            />
            <button 
              onClick={() => setActiveModalImage(null)}
              style={{
                position: 'absolute', top: '15px', right: '15px',
                background: '#7B1B2E', color: '#FFF', border: 'none',
                borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer'
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
