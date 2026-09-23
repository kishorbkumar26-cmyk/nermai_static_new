import { useState, useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { fbFirestore } from '../firebase/firestore'
import { driveStorage } from '../services/driveStorage'
import { useReveal } from '../hooks/useReveal'
import { ArrowRight, CheckCircle, BookOpen, FileText, UserCircle, Zap, Bookmark, Monitor, GraduationCap, Target, ChevronLeft, ChevronRight } from 'lucide-react'
import './Courses.css'

const ICON_MAP = {
  CheckCircle, BookOpen, FileText, UserCircle, Zap, Bookmark, Monitor, GraduationCap, Target
}

const DEFAULT_COURSES = [
  {
    id: 'upsc-civil-services',
    title: 'UPSC',
    subTitle: 'Civil Services Examination',
    categoryId: 'upsc',
    coverImageUrl: '',
    logoUrl: '',
    badges: ['UPSC', 'OFFLINE', 'ENGLISH & TAMIL'],
    isPopular: true,
    shortDescription: 'Comprehensive coaching for Prelims, Mains & Interview by expert IAS mentors.',
    features: [
      { text: '1000+ hours offline coaching', icon: 'Target' },
      { text: '100+ Prelims/Mains mock tests', icon: 'CheckCircle' },
      { text: 'Comprehensive study materials', icon: 'BookOpen' },
      { text: 'Regular mentor sessions', icon: 'GraduationCap' }
    ],
    price: '₹ 35,000',
    priceLabel: 'Course Price',
    isActive: true,
  },
  {
    id: 'tnpsc-offline',
    title: 'TNPSC',
    subTitle: 'Tamil Nadu Public Service Commission',
    categoryId: 'tnpsc',
    coverImageUrl: '',
    logoUrl: '',
    badges: ['TNPSC', 'OFFLINE', 'TAMIL & ENGLISH'],
    shortDescription: 'Complete preparation for Tamil Nadu Public Service Commission exams.',
    features: [
      { text: 'Subject-wise expert faculty', icon: 'Target' },
      { text: 'Regular test series', icon: 'CheckCircle' },
      { text: 'Current affairs focus', icon: 'BookOpen' },
      { text: 'Interview guidance', icon: 'GraduationCap' }
    ],
    price: '₹ 20,000',
    priceLabel: 'Course Price',
    isActive: true,
  },
  {
    id: 'bank-offline',
    title: 'Banking',
    subTitle: 'Banking & Financial Services',
    categoryId: 'banking',
    coverImageUrl: '',
    logoUrl: '',
    badges: ['BANK', 'OFFLINE', 'TAMIL & ENGLISH'],
    shortDescription: 'Prepare for IBPS, SBI & Insurance exams for all stages with expert faculty.',
    features: [
      { text: 'Covers IBPS, SBI, RRB and more', icon: 'Target' },
      { text: 'Practice tests & previous papers', icon: 'CheckCircle' },
      { text: 'Shortcuts & exam strategies', icon: 'BookOpen' },
      { text: 'Personality development', icon: 'GraduationCap' }
    ],
    price: '₹ 24,000',
    priceLabel: 'Course Price',
    isActive: true,
  },
  {
    id: 'ssc-offline',
    title: 'SSC',
    subTitle: 'Staff Selection Commission',
    categoryId: 'ssc',
    coverImageUrl: '',
    logoUrl: '',
    badges: ['SSC', 'OFFLINE', 'TAMIL & ENGLISH'],
    shortDescription: 'Comprehensive SSC & Central Govt exam preparation with full mock test series.',
    features: [
      { text: 'Complete syllabus coverage', icon: 'Target' },
      { text: 'Topic-wise mock tests', icon: 'CheckCircle' },
      { text: 'Study materials & doubt support', icon: 'BookOpen' },
      { text: 'Exam strategy sessions', icon: 'GraduationCap' }
    ],
    price: '₹ 25,000',
    priceLabel: 'Course Price',
    isActive: true,
  }
]

// Render crisp vector emblem seals for each exam category
function renderCategoryEmblem(courseOrCat) {
  const cat = (typeof courseOrCat === 'string' ? courseOrCat : (courseOrCat?.categoryId || courseOrCat?.title || '')).toLowerCase()
  if (cat.includes('upsc')) {
    return (
      <svg viewBox="0 0 70 70" fill="none" width="56" height="56">
        <circle cx="35" cy="35" r="32" fill="#FFFFFF" stroke="#7B1B2E" strokeWidth="2.5" />
        <circle cx="35" cy="35" r="28" fill="#FFF8F0" />
        <path d="M35 15 L38 22 H32 Z M28 25 C28 21 42 21 42 25 V36 H28 Z M35 38 V43 H26 V45 H44 V43 H35 Z" fill="#7B1B2E" />
        <circle cx="35" cy="29" r="2.5" fill="#D4AF37" />
        <text x="35" y="58" fontSize="8" fontWeight="800" textAnchor="middle" fill="#7B1B2E" letterSpacing="0.6">UPSC</text>
      </svg>
    )
  }
  if (cat.includes('tnpsc')) {
    return (
      <svg viewBox="0 0 70 70" fill="none" width="56" height="56">
        <circle cx="35" cy="35" r="32" fill="#FFFFFF" stroke="#1B6B48" strokeWidth="2.5" />
        <circle cx="35" cy="35" r="28" fill="#F4FAF6" />
        <path d="M35 14 L42 23 H28 Z M30 23 H40 V38 H30 Z M26 38 H44 V42 H26 Z" fill="#1B6B48" />
        <circle cx="35" cy="27" r="2.5" fill="#D4AF37" />
        <text x="35" y="58" fontSize="7.5" fontWeight="800" textAnchor="middle" fill="#1B6B48" letterSpacing="0.5">TNPSC</text>
      </svg>
    )
  }
  if (cat.includes('banking') || cat.includes('bank')) {
    return (
      <svg viewBox="0 0 70 70" fill="none" width="56" height="56">
        <circle cx="35" cy="35" r="32" fill="#FFFFFF" stroke="#1D4ED8" strokeWidth="2.5" />
        <circle cx="35" cy="35" r="28" fill="#F0F4FA" />
        <path d="M22 25 L35 17 L48 25 H22 Z M25 27 H28 V39 H25 Z M33 27 H37 V39 H33 Z M42 27 H45 V39 H42 Z M21 41 H49 V44 H21 Z" fill="#1D4ED8" />
        <text x="35" y="58" fontSize="8" fontWeight="800" textAnchor="middle" fill="#1D4ED8" letterSpacing="0.5">BANK</text>
      </svg>
    )
  }
  if (cat.includes('ssc')) {
    return (
      <svg viewBox="0 0 70 70" fill="none" width="56" height="56">
        <circle cx="35" cy="35" r="32" fill="#FFFFFF" stroke="#C85A17" strokeWidth="2.5" />
        <circle cx="35" cy="35" r="28" fill="#FAF5EF" />
        <path d="M35 17 L46 23 V34 L35 41 L24 34 V23 Z" stroke="#C85A17" strokeWidth="2" fill="#FFF3E8" />
        <path d="M31 28 L34 31 L39 25" stroke="#C85A17" strokeWidth="2.5" strokeLinecap="round" />
        <text x="35" y="58" fontSize="8" fontWeight="800" textAnchor="middle" fill="#C85A17" letterSpacing="0.5">SSC</text>
      </svg>
    )
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
      <GraduationCap size={36} style={{ color: '#7B1B2E' }} />
    </div>
  )
}

// Render designed default banner artwork for each course category
function renderCategoryBanner(course) {
  const cat = (course?.categoryId || course?.title || '').toLowerCase()
  
  if (cat.includes('tnpsc')) {
    return (
      <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: '#F8FAF7', display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingLeft: '22px' }}>
        <div style={{ fontSize: '1.3rem', fontWeight: 800, fontFamily: 'Georgia, serif', color: '#1B2E24', letterSpacing: '-0.01em', lineHeight: 1.1 }}>
          TNPSC Exams
        </div>
        <div style={{ fontSize: '0.66rem', color: '#4A6B58', fontWeight: 600, marginTop: '4px', fontFamily: 'system-ui, sans-serif' }}>
          Tamil Nadu Public Service Commission
        </div>
        {/* Subtle decorative curve */}
        <svg viewBox="0 0 200 60" style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '40px', pointerEvents: 'none' }} preserveAspectRatio="none">
          <path d="M0 35 Q100 5 200 35 L200 60 L0 60 Z" fill="#1B6B48" opacity="0.12" />
          <path d="M0 45 Q100 20 200 45 L200 60 L0 60 Z" fill="#1B6B48" opacity="0.18" />
        </svg>
      </div>
    )
  }

  if (cat.includes('upsc')) {
    return (
      <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #FFF6EE 0%, #F5E8D8 100%)', display: 'flex', alignItems: 'center' }}>
        <div style={{ paddingLeft: '18px', zIndex: 2 }}>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, fontFamily: 'Arial, sans-serif', letterSpacing: '-0.02em', color: '#1A1817', lineHeight: 1.05 }}>UPSC</div>
          <div style={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.05em', color: '#B32B1E', textTransform: 'uppercase', marginTop: '3px' }}>CIVIL SERVICE EXAMINATION</div>
        </div>
        <svg viewBox="0 0 160 150" style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: 'auto', opacity: 0.85 }} fill="none">
          <path d="M120 20 C120 20 100 40 100 80 L160 80 C160 40 140 20 120 20 Z" fill="#D49A58" opacity="0.35" />
          <rect x="80" y="80" width="80" height="70" fill="#C2843E" opacity="0.25" />
          <line x1="95" y1="80" x2="95" y2="150" stroke="#8C4B18" strokeWidth="2" opacity="0.35" />
          <line x1="115" y1="80" x2="115" y2="150" stroke="#8C4B18" strokeWidth="2" opacity="0.35" />
          <line x1="135" y1="80" x2="135" y2="150" stroke="#8C4B18" strokeWidth="2" opacity="0.35" />
        </svg>
      </div>
    )
  }

  if (cat.includes('banking') || cat.includes('bank')) {
    return (
      <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: '#F4F7FC', display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingLeft: '22px' }}>
        <div style={{ fontSize: '1.3rem', fontWeight: 800, fontFamily: 'Georgia, serif', color: '#102A56', letterSpacing: '-0.01em', lineHeight: 1.1 }}>
          Banking Exams
        </div>
        <div style={{ fontSize: '0.66rem', color: '#3B5998', fontWeight: 600, marginTop: '4px', fontFamily: 'system-ui, sans-serif' }}>
          IBPS &bull; SBI &bull; RBI &bull; Insurance
        </div>
        <svg viewBox="0 0 200 60" style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '40px', pointerEvents: 'none' }} preserveAspectRatio="none">
          <path d="M0 35 Q100 5 200 35 L200 60 L0 60 Z" fill="#1D4ED8" opacity="0.1" />
          <path d="M0 45 Q100 20 200 45 L200 60 L0 60 Z" fill="#1D4ED8" opacity="0.18" />
        </svg>
      </div>
    )
  }

  if (cat.includes('ssc')) {
    return (
      <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: '#FAF6F0', display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingLeft: '22px' }}>
        <div style={{ fontSize: '1.3rem', fontWeight: 800, fontFamily: 'Georgia, serif', color: '#3A1E08', letterSpacing: '-0.01em', lineHeight: 1.1 }}>
          SSC Exams
        </div>
        <div style={{ fontSize: '0.66rem', color: '#8C4B18', fontWeight: 600, marginTop: '4px', fontFamily: 'system-ui, sans-serif' }}>
          Staff Selection Commission
        </div>
        <svg viewBox="0 0 200 60" style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '40px', pointerEvents: 'none' }} preserveAspectRatio="none">
          <path d="M0 35 Q100 5 200 35 L200 60 L0 60 Z" fill="#C85A17" opacity="0.1" />
          <path d="M0 45 Q100 20 200 45 L200 60 L0 60 Z" fill="#C85A17" opacity="0.18" />
        </svg>
      </div>
    )
  }

  return (
    <div className={`replicated-banner-fallback cat-${(course.categoryId || 'default').toLowerCase()}`}>
      <span className="banner-fallback-title">{course.title || course.categoryId ? (course.title || course.categoryId).toUpperCase() : 'COURSES'}</span>
    </div>
  )
}

function CourseCardBanner({ course, coverImg, isPopular }) {
  const [hasError, setHasError] = useState(false)
  const title = course?.title || 'Course'

  return (
    <div className="replicated-card-banner">
      {coverImg && !hasError ? (
        <img 
          src={coverImg} 
          alt={title} 
          className="replicated-banner-img" 
          loading="lazy" 
          onError={(e) => {
            const handled = driveStorage.handleImageError(e, '')
            if (handled === false) setHasError(true)
            // If no fallback step was taken (non-Drive URL), also hide
            const step = e.target?.dataset?.fallbackStep
            if (!step) setHasError(true)
          }} 
        />
      ) : (
        renderCategoryBanner(course)
      )}

      {isPopular && (
        <div className="replicated-popular-badge">
          ★ Most Popular
        </div>
      )}
    </div>
  )
}

function CourseCardEmblem({ course, logoImg }) {
  const [hasError, setHasError] = useState(false)
  const title = course?.title || 'Emblem'

  return (
    <div className="replicated-emblem-circle">
      {logoImg && !hasError ? (
        <img 
          src={logoImg} 
          alt={title} 
          className="replicated-emblem-img" 
          onError={(e) => {
            driveStorage.handleImageError(e, '')
            const step = e.target?.dataset?.fallbackStep
            if (!step) setHasError(true)
          }} 
        />
      ) : (
        renderCategoryEmblem(course)
      )}
    </div>
  )
}

export default function Courses({ hideHeader = false, layout = 'grid' }) {
  const [categories, setCategories] = useState([])
  const [courses, setCourses] = useState([])
  const [coursesConfig, setCoursesConfig] = useState({
    tagText: 'OUR COURSES',
    sectionHeading: 'Choose Your Path to a Brighter Future',
    subHeading: 'Structured courses, expert guidance and proven results for every aspirant.',
    sideScripts: {
      leftLine1: 'Learn',
      leftLine2: 'Prepare',
      leftLine3: 'Succeed',
      rightLine1: 'Different Aspirations',
      rightLine2: 'One Destination',
      showLeft: true,
      showRight: true,
    }
  })
  const [activeCategory, setActiveCategory] = useState('all')
  const [activeIdx, setActiveIdx] = useState(0)
  const [perView, setPerView] = useState(4)

  useEffect(() => {
    fbFirestore.getSettings().then(s => {
      if (s && s.homeContent) {
        if (s.homeContent.courseCategories && s.homeContent.courseCategories.length > 0) {
          setCategories(s.homeContent.courseCategories)
        }
        if (s.homeContent.courses && s.homeContent.courses.length > 0) {
          setCourses(s.homeContent.courses)
        } else {
          setCourses(DEFAULT_COURSES)
        }
        if (s.homeContent.coursesConfig) {
          setCoursesConfig(prev => ({
            ...prev,
            ...s.homeContent.coursesConfig,
            sideScripts: {
              ...prev.sideScripts,
              ...(s.homeContent.coursesConfig.sideScripts || {})
            }
          }))
        }
      } else {
        setCourses(DEFAULT_COURSES)
      }
    })
  }, [])

  // Responsive perView logic
  useEffect(() => {
    const updatePerView = () => {
      if (window.innerWidth < 768) {
        setPerView(1)
      } else if (window.innerWidth < 1100) {
        setPerView(2)
      } else {
        setPerView(3)
      }
    }
    updatePerView()
    window.addEventListener('resize', updatePerView)
    return () => window.removeEventListener('resize', updatePerView)
  }, [])

  const displayCourses = courses.length > 0 ? courses : DEFAULT_COURSES

  const filteredCourses = useMemo(() => {
    let filtered = displayCourses.filter(c => c.isActive !== false)
    if (activeCategory !== 'all') {
      filtered = filtered.filter(c => {
        if (!c.categoryId) {
          const titleLower = (c.title || '').toLowerCase()
          return titleLower.includes(activeCategory.toLowerCase())
        }
        const cat = c.categoryId.toLowerCase().trim()
        const active = activeCategory.toLowerCase().trim()
        if (cat === active) return true
        const titleLower = (c.title || '').toLowerCase()
        const badgeLower = (c.badges || []).join(' ').toLowerCase()
        return titleLower.includes(active) || badgeLower.includes(active)
      })
    }
    return filtered
  }, [displayCourses, activeCategory])

  useReveal([activeCategory, filteredCourses])

  const renderIcon = (iconName) => {
    const IconComponent = ICON_MAP[iconName] || Target
    return <IconComponent size={15} className="replicated-course-feature-icon" />
  }

  const total = filteredCourses.length
  const maxOffset = Math.max(0, total - perView)
  const currentOffset = Math.min(activeIdx, maxOffset)

  const handlePrev = () => setActiveIdx(prev => (prev === 0 ? maxOffset : prev - 1))
  const handleNext = () => setActiveIdx(prev => (prev >= maxOffset ? 0 : prev + 1))

  const touchStartX = useRef(null)
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
  }
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return
    const diffX = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diffX) > 40) {
      if (diffX > 0) {
        handleNext()
      } else {
        handlePrev()
      }
    }
    touchStartX.current = null
  }

  const isSideScriptsVisible = coursesConfig.sideScripts?.visible !== false
  const showLeft = !hideHeader && isSideScriptsVisible && coursesConfig.sideScripts?.showLeft !== false
  const showRight = !hideHeader && isSideScriptsVisible && coursesConfig.sideScripts?.showRight !== false

  const rowClasses = [
    'replicated-courses-content-row',
    showLeft ? 'has-left-accent' : '',
    showRight ? 'has-right-accent' : '',
    (!showLeft && !showRight) ? 'no-side-accents' : ''
  ].filter(Boolean).join(' ')

  return (
    <section className="replicated-courses-section" id="courses">
      <div className="container" style={{ maxWidth: '1480px' }}>
        
        {/* Section Header */}
        {!hideHeader && (
          <div className="replicated-courses-header">
            <div className="replicated-courses-top-tag">
              <span className="tag-line" />
              <span className="tag-text">{coursesConfig.tagText || 'OUR COURSES'}</span>
              <span className="tag-line" />
            </div>
            <h2 className="replicated-courses-main-title">{coursesConfig.sectionHeading || 'Choose Your Path to a Brighter Future'}</h2>
            <p className="replicated-courses-subtitle">{coursesConfig.subHeading || 'Structured courses, expert guidance and proven results for every aspirant.'}</p>
          </div>
        )}

        {/* Content Row with Left Accent, Filter Tabs + Grid, Right Accent */}
        <div className={rowClasses}>
          
          {/* Far Left Decorative Element */}
          {showLeft && (
            <div className="courses-accent-left" aria-hidden="true">
              <div className="left-handwriting">
                <span>{coursesConfig.sideScripts?.leftLine1 || 'Learn'}</span>
                <span>{coursesConfig.sideScripts?.leftLine2 || 'Prepare'}</span>
                <span className="sub">{coursesConfig.sideScripts?.leftLine3 || 'Succeed'}</span>
              </div>
              <svg className="left-lines-svg" viewBox="0 0 50 20" stroke="#C85A17" strokeWidth="1.5">
                <path d="M5 10 Q25 18 45 10 M10 15 Q25 20 40 15" fill="none" opacity="0.6" />
              </svg>
            </div>
          )}

          {/* Center Content Box: Category Filter Pills + Course Cards Grid */}
          <div className="replicated-courses-center-box">
            
            {/* Category Filter Pills */}
            <div className="replicated-filter-pills-row">
              <button
                className={`replicated-filter-pill ${activeCategory === 'all' ? 'active' : ''}`}
                onClick={() => { setActiveCategory('all'); setActiveIdx(0) }}
              >
                All Courses
              </button>
              {categories.filter(c => c.isVisible && c.id !== 'all').map(cat => (
                <button
                  key={cat.id}
                  className={`replicated-filter-pill ${activeCategory === cat.id ? 'active' : ''}`}
                  onClick={() => { setActiveCategory(cat.id); setActiveIdx(0) }}
                >
                  {cat.shortName || cat.name}
                </button>
              ))}
              {categories.length === 0 && (
                <>
                  <button className={`replicated-filter-pill ${activeCategory === 'upsc' ? 'active' : ''}`} onClick={() => { setActiveCategory('upsc'); setActiveIdx(0) }}>UPSC</button>
                  <button className={`replicated-filter-pill ${activeCategory === 'tnpsc' ? 'active' : ''}`} onClick={() => { setActiveCategory('tnpsc'); setActiveIdx(0) }}>TNPSC</button>
                  <button className={`replicated-filter-pill ${activeCategory === 'banking' ? 'active' : ''}`} onClick={() => { setActiveCategory('banking'); setActiveIdx(0) }}>Banking</button>
                  <button className={`replicated-filter-pill ${activeCategory === 'ssc' ? 'active' : ''}`} onClick={() => { setActiveCategory('ssc'); setActiveIdx(0) }}>SSC</button>
                  <button className={`replicated-filter-pill ${activeCategory === 'puducherry' ? 'active' : ''}`} onClick={() => { setActiveCategory('puducherry'); setActiveIdx(0) }}>Puducherry Govt.</button>
                </>
              )}
            </div>

            {/* Course Cards Carousel / Slider */}
            <div className="replicated-carousel-wrapper">
              
              {/* Left Nav Arrow */}
              {total > perView && (
                <button className="replicated-nav-arrow arrow-left" onClick={handlePrev} aria-label="Previous Courses">
                  <ChevronLeft size={20} />
                </button>
              )}

              {/* Viewport & Track */}
              <div 
                className="replicated-cards-viewport"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                <div 
                  className="replicated-cards-track"
                  style={{
                    transform: perView === 1
                      ? `translateX(-${currentOffset * 100}%)`
                      : `translateX(calc(-${currentOffset} * ((100% - ${(perView - 1) * 1.25}rem) / ${perView} + 1.25rem)))`,
                    transition: 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                >
                  {filteredCourses.map((course, i) => {
                    const coverImg = driveStorage.formatImageUrl(course.coverImageUrl || course.bannerImage || course.imageUrl)
                    const logoImg = course.logoUrl ? driveStorage.formatImageUrl(course.logoUrl) : null
                    const isPopular = course.isPopular || course.isFeatured || (course.badges && course.badges.some(b => b.toLowerCase().includes('popular'))) || i === 0
                    const isHighlighted = i === activeIdx

                    const courseTitle = course.title || course.name || 'Competitive Exam Course'
                    const courseSub = course.subTitle || (course.categoryId ? `${course.categoryId.toUpperCase()} Preparation` : 'Civil Services Examination')
                    const featuresList = (course.features && course.features.length > 0) ? course.features : [
                      { text: 'Comprehensive offline coaching', icon: 'Target' },
                      { text: 'Prelims & Mains mock test series', icon: 'CheckCircle' },
                      { text: 'Structured study materials & notes', icon: 'BookOpen' },
                      { text: 'Regular mentor guidance sessions', icon: 'GraduationCap' }
                    ]

                    return (
                      <div 
                        key={course.id || i}
                        className={`replicated-course-card ${isHighlighted || isPopular ? 'active-highlight' : ''}`}
                        style={{
                          flex: perView === 1 
                            ? '0 0 100%' 
                            : `0 0 calc((100% - ${(perView - 1) * 1.25}rem) / ${perView})`
                        }}
                        onClick={() => setActiveIdx(i)}
                      >
                        {/* Top Cover Banner */}
                        <CourseCardBanner course={course} coverImg={coverImg} isPopular={isPopular} />

                        {/* Circular Logo Emblem overlapping boundary */}
                        <CourseCardEmblem course={course} logoImg={logoImg} />

                        {/* Card Body */}
                        <div className="replicated-card-body">
                          
                          <h3 className="replicated-card-title">{courseTitle}</h3>
                          <div className="replicated-card-sub">{courseSub}</div>

                          {/* 4 Feature Items */}
                          <div className="replicated-card-features">
                            {featuresList.slice(0, 4).map((feat, fIdx) => (
                              <div key={fIdx} className="replicated-feature-item">
                                {renderIcon(feat.icon)}
                                <span>{feat.text}</span>
                              </div>
                            ))}
                          </div>

                          {/* Bottom CTA Pill Button */}
                          <div className="replicated-card-cta-row">
                            <Link 
                              to={`/courses/${course.id || course.slug}`} 
                              className={`replicated-details-btn ${isHighlighted || isPopular ? 'btn-solid-maroon' : 'btn-outline-maroon'}`}
                            >
                              <span>View Details</span>
                              <ArrowRight size={14} />
                            </Link>
                          </div>

                        </div>

                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Right Nav Arrow */}
              {total > perView && (
                <button className="replicated-nav-arrow arrow-right" onClick={handleNext} aria-label="Next Courses">
                  <ChevronRight size={20} />
                </button>
              )}

            </div>

            {/* Pagination Dots */}
            {total > perView && (
              <div className="replicated-courses-dots">
                {Array.from({ length: maxOffset + 1 }).map((_, idx) => (
                  <button
                    key={idx}
                    className={`courses-dot ${idx === currentOffset ? 'active' : ''}`}
                    onClick={() => setActiveIdx(idx)}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            )}

          </div>

          {/* Far Right Tilted Script Accent */}
          {showRight && (
            <div className="courses-accent-right" aria-hidden="true">
              <div className="right-script-box">
                <span>{coursesConfig.sideScripts?.rightLine1 || 'Different Aspirations'}</span>
                <span className="accent-underline">{coursesConfig.sideScripts?.rightLine2 || 'One Destination'}</span>
              </div>
            </div>
          )}

        </div>

      </div>
    </section>
  )
}
