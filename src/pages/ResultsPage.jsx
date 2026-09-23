import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { fbFirestore } from '../firebase/firestore'
import { driveStorage } from '../services/driveStorage'

/* ── Exam category config ─────────────────────────────────────────────────── */
const EXAM_CATEGORIES = [
  { id: 'all',        label: 'All Results',       slug: 'all',        icon: 'fa-star',             color: '#7b1b2e' },
  { id: 'upsc',       label: 'UPSC',              slug: 'upsc',       icon: 'fa-landmark',         color: '#7b1b2e' },
  { id: 'tnpsc-g1',   label: 'TNPSC Group I',     slug: 'tnpsc-g1',   icon: 'fa-building-columns', color: '#9b2335' },
  { id: 'tnpsc-g2',   label: 'TNPSC Group II',    slug: 'tnpsc-g2',   icon: 'fa-building',         color: '#7b1b2e' },
  { id: 'tnpsc-g4',   label: 'TNPSC Group IV',    slug: 'tnpsc-g4',   icon: 'fa-file-alt',        color: '#5c1220' },
  { id: 'puducherry', label: 'Puducherry Govt.',  slug: 'puducherry', icon: 'fa-landmark-flag',   color: '#b45309' },
  { id: 'police',     label: 'Police (SI/PC)',    slug: 'police',     icon: 'fa-shield-halved',    color: '#3d4b8c' },
  { id: 'banking',    label: 'Banking',           slug: 'banking',    icon: 'fa-building-columns', color: '#1a6b4a' },
  { id: 'ssc',        label: 'SSC',               slug: 'ssc',        icon: 'fa-certificate',     color: '#7b5c00' },
]

/* ── Avatar fallback ──────────────────────────────────────────────────────── */
function AvatarImg({ photo, name, size = 130 }) {
  const [err, setErr] = useState(false)
  const url = photo && !err ? driveStorage.formatImageUrl(photo) : null
  const initial = name ? name.trim().charAt(0).toUpperCase() : '★'

  if (!url) {
    return (
      <div 
        className="rp-avatar-fallback"
        style={{
          width: size, 
          height: size, 
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #7b1b2e 0%, #4a0e1c 100%)',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: '#f5d061', 
          fontWeight: 800, 
          fontSize: `${Math.max(16, Math.round(size * 0.42))}px`,
          flexShrink: 0, 
          border: '4px solid #d4af37',
          outline: '3px solid rgba(212, 175, 55, 0.3)',
          outlineOffset: '4px',
          boxShadow: '0 8px 24px rgba(123,27,46,0.25)',
          userSelect: 'none',
          transition: 'transform 0.3s ease'
        }}
      >
        {initial}
      </div>
    )
  }
  return (
    <img 
      src={url} 
      alt={name || 'Achiever'}
      crossOrigin="anonymous"
      onError={(e) => { driveStorage.handleImageError(e, '') || setErr(true); const s = e.target?.dataset?.fallbackStep; if (!s) setErr(true) }}
      style={{ 
        width: size, 
        height: size, 
        borderRadius: '50%', 
        objectFit: 'cover', 
        flexShrink: 0, 
        border: '4px solid #d4af37',
        outline: '3px solid rgba(212, 175, 55, 0.3)',
        outlineOffset: '4px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        transition: 'transform 0.3s ease'
      }}
    />
  )
}

/* ── Featured Achiever Card ───────────────────────────────────────────────── */
function FeaturedCard({ result, isCenter, onClick }) {
  return (
    <div 
      className={`rp-featured-card${isCenter ? ' rp-featured-card--center' : ''}`}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      {isCenter && <div className="rp-topper-badge"><i className="fa-solid fa-crown" /> Our Topper</div>}
      <div className="rp-featured-card-inner">
        <div className="rp-featured-exam-badge">{result.exam}</div>
        <div className="rp-avatar-focus-wrap">
          <AvatarImg photo={result.photo} name={result.name} size={isCenter ? 150 : 130} />
        </div>
        <div className="rp-featured-rank-badge">
          <span className="rp-rank-label">RANK</span>
          <span className="rp-rank-num">{result.rank || '–'}</span>
        </div>
        <div className="rp-featured-name">{result.name}</div>
        <div className="rp-featured-meta">{result.exam} · {result.year}</div>
        {result.quote && (
          <p className="rp-featured-quote">"{result.quote}"</p>
        )}
        <button 
          className="rp-story-link-btn"
          type="button"
        >
          View Journey <i className="fa-solid fa-arrow-right" />
        </button>
      </div>
    </div>
  )
}

/* ── Exam Summary Card ────────────────────────────────────────────────────── */
function ExamSummaryCard({ cat, results, onFilter }) {
  const catResults = results.filter(r => {
    if (r.category === cat.slug) return true
    const examLower = (r.exam || '').toLowerCase()
    if (cat.slug === 'police' && examLower.includes('police')) return true
    if (cat.slug === 'banking' && (examLower.includes('bank') || examLower.includes('sbi') || examLower.includes('ibps'))) return true
    if (cat.slug === 'puducherry' && (examLower.includes('puducherry') || examLower.includes('udc') || examLower.includes('ldc'))) return true
    if (cat.slug === 'upsc' && examLower.includes('upsc')) return true
    if (cat.slug === 'tnpsc-g1' && (examLower.includes('group 1') || examLower.includes('group i') || examLower.includes('group-1') || examLower.includes('group-i'))) return true
    if (cat.slug === 'tnpsc-g2' && (examLower.includes('group 2') || examLower.includes('group ii') || examLower.includes('group-2') || examLower.includes('group-ii'))) return true
    if (cat.slug === 'tnpsc-g4' && (examLower.includes('group 4') || examLower.includes('group iv') || examLower.includes('group-4') || examLower.includes('group-iv'))) return true
    if (cat.slug === 'ssc' && examLower.includes('ssc')) return true
    return false
  })
  if (catResults.length === 0) return null
  const topRank = catResults
    .map(r => parseInt(r.rank))
    .filter(n => !isNaN(n))
    .sort((a, b) => a - b)[0]
  const facePile = catResults.slice(0, 4)

  return (
    <div className="rp-exam-card" onClick={() => onFilter(cat.slug)}>
      <div className="rp-exam-card-header">
        <div className="rp-exam-icon"><i className={`fa-solid ${cat.icon}`} /></div>
        <div>
          <div className="rp-exam-name">{cat.label}</div>
        </div>
        <div className="rp-exam-year-badge">{new Date().getFullYear()}</div>
      </div>
      <div className="rp-exam-stats">
        <div>
          <div className="rp-exam-stat-num">{catResults.length}+</div>
          <div className="rp-exam-stat-label">Selections</div>
        </div>
        {topRank && (
          <div>
            <div className="rp-exam-stat-num">#{topRank}</div>
            <div className="rp-exam-stat-label">Top Rank</div>
          </div>
        )}
        <div className="rp-exam-face-pile">
          {facePile.map((r, i) => (
            <AvatarImg key={r.id || i} photo={r.photo} name={r.name} size={30} />
          ))}
          {catResults.length > 4 && (
            <div className="rp-face-more">+{catResults.length - 4}</div>
          )}
        </div>
      </div>
      <button className="rp-exam-view-btn" type="button" onClick={e => { e.stopPropagation(); onFilter(cat.slug) }}>
        View Selections <i className="fa-solid fa-arrow-right" />
      </button>
    </div>
  )
}

/* ── Selection Row ────────────────────────────────────────────────────────── */
function SelectionRow({ result, onClick }) {
  const cat = EXAM_CATEGORIES.find(c => c.slug === result.category)
  return (
    <div className="rp-selection-row" onClick={onClick} style={{ cursor: 'pointer' }}>
      <AvatarImg photo={result.photo} name={result.name} size={46} />
      <div className="rp-selection-info">
        <div className="rp-selection-name">{result.name}</div>
        <div className="rp-selection-exam">{result.exam || cat?.label}</div>
      </div>
      <div className="rp-selection-right">
        {result.rank && <div className="rp-selection-rank">Rank #{result.rank}</div>}
        <div className="rp-selection-year">{result.year}</div>
      </div>
    </div>
  )
}

/* ── Main ResultsPage ─────────────────────────────────────────────────────── */
export default function ResultsPage() {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')
  const [yearFilter, setYearFilter] = useState('all')
  const [selectedStory, setSelectedStory] = useState(null)
  const heroRef = useRef(null)

  useEffect(() => {
    const unsub = fbFirestore.onResultsChanged(data => {
      setResults(data || [])
      setLoading(false)
    })
    return () => unsub()
  }, [])

  /* Derived data */
  const visibleResults = results.filter(r => r.visible !== false)
  const allYears = [...new Set(visibleResults.map(r => r.year).filter(Boolean))].sort((a, b) => b - a)

  const filtered = visibleResults.filter(r => {
    let matchCat = activeTab === 'all' || r.category === activeTab
    if (!matchCat && activeTab !== 'all') {
      const examLower = (r.exam || '').toLowerCase()
      if (activeTab === 'police' && examLower.includes('police')) matchCat = true
      if (activeTab === 'banking' && (examLower.includes('bank') || examLower.includes('sbi') || examLower.includes('ibps'))) matchCat = true
      if (activeTab === 'puducherry' && (examLower.includes('puducherry') || examLower.includes('udc') || examLower.includes('ldc'))) matchCat = true
      if (activeTab === 'upsc' && examLower.includes('upsc')) matchCat = true
      if (activeTab === 'tnpsc-g1' && (examLower.includes('group 1') || examLower.includes('group i') || examLower.includes('group-1') || examLower.includes('group-i'))) matchCat = true
      if (activeTab === 'tnpsc-g2' && (examLower.includes('group 2') || examLower.includes('group ii') || examLower.includes('group-2') || examLower.includes('group-ii'))) matchCat = true
      if (activeTab === 'tnpsc-g4' && (examLower.includes('group 4') || examLower.includes('group iv') || examLower.includes('group-4') || examLower.includes('group-iv'))) matchCat = true
      if (activeTab === 'ssc' && examLower.includes('ssc')) matchCat = true
    }
    const matchYear = yearFilter === 'all' || r.year === yearFilter
    const matchSearch = !search || [r.name, r.exam, r.rank, r.quote, r.story].some(
      v => v?.toLowerCase().includes(search.toLowerCase())
    )
    return matchCat && matchYear && matchSearch
  })

  // Filter featured achievers based on active tab and search
  const featured = filtered.filter(r => r.isFeatured === true).slice(0, 5)

  const totalSelections = visibleResults.length > 0 ? visibleResults.length : 187
  const uniqueYears = allYears.length

  // Filter exam categories for "Results by Examination"
  const visibleExamCats = EXAM_CATEGORIES.filter(c => {
    if (c.slug === 'all') return false
    if (activeTab === 'all') return true
    return c.slug === activeTab
  })

  if (loading) return (
    <>
      <Header activePath="/results" />
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#7b1b2e', fontWeight: 700 }}>
          <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2.5rem', marginBottom: '1rem', display: 'block', color: '#7b1b2e' }} />
          Loading results & achievers...
        </div>
      </div>
      <Footer />
    </>
  )

  return (
    <>
      <Header activePath="/results" />
      <main>

        {/* ── Hero Banner ─────────────────────────────────────────────────── */}
        <section className="rp-hero" ref={heroRef}>
          <div className="rp-hero-bg-pattern" aria-hidden="true" />
          <div className="rp-hero-overlay" aria-hidden="true" />
          <div className="container">
            <nav className="rp-breadcrumb">
              <Link to="/">Home</Link>
              <i className="fa-solid fa-chevron-right" />
              <span>Results &amp; Toppers Wall</span>
            </nav>
            <div className="rp-hero-inner">
              <div className="rp-hero-left">
                <h1 className="rp-hero-title">Hall of Fame &amp; Results</h1>
                <p className="rp-hero-sub">Celebrating every aspirant who turned dedication into top ranks and public service careers.</p>
                <div className="rp-hero-tags">
                  <span><i className="fa-solid fa-graduation-cap" /> Hard Work</span>
                  <span><i className="fa-solid fa-users" /> Expert Guidance</span>
                  <span><i className="fa-solid fa-chart-bar" /> 187+ Verified Selections</span>
                </div>
              </div>
              <div className="rp-hero-stats">
                <div className="rp-hero-stat">
                  <div className="rp-hero-stat-num">{totalSelections}+</div>
                  <div className="rp-hero-stat-label">RESULTS</div>
                  <div className="rp-hero-stat-sub">Lives Transformed</div>
                </div>
                <div className="rp-hero-stat">
                  <div className="rp-hero-stat-num">{uniqueYears > 0 ? uniqueYears + '+' : '14+'}</div>
                  <div className="rp-hero-stat-label">YEARS</div>
                  <div className="rp-hero-stat-sub">Of Academic Excellence</div>
                </div>
                <div className="rp-hero-stat">
                  <div className="rp-hero-stat-num">2400+</div>
                  <div className="rp-hero-stat-label">STUDENTS</div>
                  <div className="rp-hero-stat-sub">Building a Brighter India</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Category Tabs + Year Filter ──────────────────────────────────── */}
        <div className="rp-filter-bar">
          <div className="container">
            <div className="rp-filter-inner">
              <div className="rp-tabs">
                {EXAM_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    className={`rp-tab${activeTab === cat.slug ? ' rp-tab--active' : ''}`}
                    onClick={() => setActiveTab(cat.slug)}
                    type="button"
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
              {allYears.length > 0 && (
                <div className="rp-year-select-wrap">
                  <i className="fa-regular fa-calendar" />
                  <select
                    className="rp-year-select"
                    value={yearFilter}
                    onChange={e => setYearFilter(e.target.value)}
                  >
                    <option value="all">All Years</option>
                    {allYears.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="container">

          {/* ── Featured Achievers ────────────────────────────────────────── */}
          {featured.length > 0 && (
            <section className="rp-section">
              <div className="rp-section-header">
                <h2 className="rp-section-title">⭐ Featured Achievers &amp; Top Ranks</h2>
                <p className="rp-section-sub">Outstanding individual performances across civil services and government recruitment exams.</p>
              </div>
              <div className="rp-featured-grid">
                {featured.map((r, i) => (
                  <FeaturedCard 
                    key={r.id || i} 
                    result={r} 
                    isCenter={i === 0 || featured.length === 1} 
                    onClick={() => setSelectedStory(r)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* ── Results by Examination ────────────────────────────────────── */}
          {visibleResults.length > 0 && (
            <section className="rp-section">
              <div className="rp-section-header">
                <h2 className="rp-section-title">Results by Examination</h2>
                <p className="rp-section-sub">Explore our selections across various competitive examinations.</p>
              </div>
              <div className="rp-exam-grid">
                {visibleExamCats.map(cat => (
                  <ExamSummaryCard
                    key={cat.id}
                    cat={cat}
                    results={yearFilter === 'all' ? visibleResults : visibleResults.filter(r => r.year === yearFilter)}
                    onFilter={slug => setActiveTab(slug)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* ── All Selections ────────────────────────────────────────────── */}
          <section className="rp-section">
            <div className="rp-all-selections-header">
              <div>
                <h2 className="rp-section-title" style={{ marginBottom: '0.25rem' }}>All Achievers &amp; Selections</h2>
                <p className="rp-section-sub" style={{ margin: 0 }}>A complete list of our successful candidates. Click on any student to read their full journey.</p>
              </div>
              <div className="rp-search-bar">
                <i className="fa-solid fa-magnifying-glass" />
                <input
                  type="search"
                  placeholder="Search by student name, rank or exam..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                {search && (
                  <button 
                    onClick={() => setSearch('')}
                    type="button"
                    style={{ background: 'none', border: 'none', color: '#7b1b2e', cursor: 'pointer', padding: '0 4px', fontSize: '1rem' }}
                    title="Clear search"
                  >
                    <i className="fa-solid fa-xmark" />
                  </button>
                )}
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="rp-empty">
                <div className="rp-empty-icon"><i className="fa-solid fa-award" /></div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1a1008', marginBottom: '0.5rem' }}>
                  No results found
                </h3>
                <p style={{ color: '#555', marginBottom: '1.25rem', fontSize: '0.95rem' }}>
                  {visibleResults.length === 0 
                    ? 'Results will appear here once added by admin.' 
                    : `No selections match ${activeTab !== 'all' ? `"${EXAM_CATEGORIES.find(c => c.slug === activeTab)?.label || activeTab}"` : ''}${yearFilter !== 'all' ? ` (Year ${yearFilter})` : ''}${search ? ` for "${search}"` : ''}.`}
                </p>
                {(activeTab !== 'all' || yearFilter !== 'all' || search) && (
                  <button 
                    className="rp-clear-btn"
                    type="button"
                    onClick={() => { setActiveTab('all'); setYearFilter('all'); setSearch(''); }}
                  >
                    <i className="fa-solid fa-rotate-left" style={{ marginRight: '6px' }} />
                    Reset Filters &amp; View All Results
                  </button>
                )}
              </div>
            ) : (
              <div className="rp-selections-grid">
                {filtered.map(r => (
                  <SelectionRow 
                    key={r.id} 
                    result={r} 
                    onClick={() => setSelectedStory(r)}
                  />
                ))}
              </div>
            )}

            {filtered.length > 0 && (
              <div className="rp-results-count">
                Showing {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                {activeTab !== 'all' && ` · ${EXAM_CATEGORIES.find(c => c.slug === activeTab)?.label}`}
                {yearFilter !== 'all' && ` · ${yearFilter}`}
              </div>
            )}
          </section>

        </div>

        {/* ── Story Modal ─────────────────────────────────────────────────── */}
        {selectedStory && (
          <div className="toppers-modal-overlay" onClick={() => setSelectedStory(null)}>
            <div className="toppers-modal-content" onClick={e => e.stopPropagation()}>
              <button className="toppers-modal-close" onClick={() => setSelectedStory(null)}>
                <i className="fa-solid fa-xmark" />
              </button>

              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '1.5rem' }}>
                <AvatarImg photo={selectedStory.photo} name={selectedStory.name} size={90} />
                <div>
                  <h3 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)', color: '#fff', marginBottom: '4px' }}>
                    {selectedStory.name}
                  </h3>
                  <div style={{ color: 'var(--gold-light, #f5d061)', fontWeight: 700, fontSize: '1rem' }}>
                    {selectedStory.exam} {selectedStory.year ? `(${selectedStory.year})` : ''} {selectedStory.rank ? `• AIR / State Rank #${selectedStory.rank}` : ''}
                  </div>
                </div>
              </div>

              {selectedStory.quote && (
                <blockquote style={{ 
                  fontStyle: 'italic', color: '#f5d061', fontSize: '1.05rem',
                  borderLeft: '3px solid #d4af37', paddingLeft: '1rem', margin: '1rem 0 1.5rem 0',
                  background: 'rgba(212, 175, 55, 0.12)', padding: '1rem', borderRadius: '0 12px 12px 0'
                }}>
                  "{selectedStory.quote}"
                </blockquote>
              )}

              <div style={{ color: 'rgba(255,255,255,0.92)', lineHeight: 1.7, fontSize: '0.98rem' }}>
                <div style={{ fontWeight: 700, color: '#f5d061', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.85rem' }}>
                  Preparation Story &amp; Strategy
                </div>
                <p style={{ color: '#ffffff', opacity: 0.95 }}>
                  {selectedStory.story || selectedStory.quote || 'From foundational preparation to mock tests, individual mentoring and answer writing at Nermai IAS Academy proved instrumental in achieving this milestone.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}
