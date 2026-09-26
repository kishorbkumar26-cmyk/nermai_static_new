import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { fbFirestore, DEFAULT_FREE_RESOURCES_SETTINGS } from '../firebase/firestore'
import { driveStorage } from '../services/driveStorage'
import { extractGoogleDriveId } from '../utils/imageOptimizer'
import Header from '../components/Header'
import Footer from '../components/Footer'
import OfficeLocations from '../components/OfficeLocations'
import './FreeResourcesPage.css'

function ScrollProgress() {
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement
      const scrolled = el.scrollTop
      const total = el.scrollHeight - el.clientHeight
      setProgress(total > 0 ? (scrolled / total) * 100 : 0)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <div className="scroll-progress-bar" style={{ width: `${progress}%` }} aria-hidden="true" />
  )
}

// ── Format Helper ─────────────────────────────────────────────────────────────
function formatFileSize(bytes) {
  if (!bytes || Number(bytes) <= 0) return '2.4 MB'
  const mb = Number(bytes) / (1024 * 1024)
  if (mb >= 1) return `${mb.toFixed(1)} MB`
  const kb = Number(bytes) / 1024
  return `${Math.round(kb)} KB`
}

function formatDateStr(dateVal) {
  if (!dateVal) return '23 Sep 2026'
  try {
    const d = new Date(dateVal)
    if (isNaN(d.getTime())) return dateVal
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return dateVal
  }
}

// ── Google Drive CDN Thumbnail Resolver ───────────────────────────────────────
function getThumbnailUrl(res) {
  if (!res) return null
  if (res.thumbnailUrl && typeof res.thumbnailUrl === 'string' && res.thumbnailUrl.trim()) {
    return res.thumbnailUrl
  }
  const driveId = extractGoogleDriveId(res.url || res.driveUrl || res.driveFileId)
  if (driveId) {
    // Official Google Drive CDN thumbnail endpoint
    return `https://drive.google.com/thumbnail?id=${driveId}&sz=w800`
  }
  return null
}

function getEmbedPreviewUrl(res) {
  if (!res) return ''
  const driveId = extractGoogleDriveId(res.url || res.driveUrl || res.driveFileId)
  if (driveId) {
    return `https://drive.google.com/file/d/${driveId}/preview`
  }
  if (res.url) {
    return `https://docs.google.com/viewer?url=${encodeURIComponent(res.url)}&embedded=true`
  }
  return ''
}

export default function FreeResourcesPage() {
  const [resources, setResources] = useState([])
  const [settings, setSettings] = useState(DEFAULT_FREE_RESOURCES_SETTINGS)
  const [loading, setLoading] = useState(true)

  // Filters State
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDay, setSelectedDay] = useState('ALL')
  const [selectedMonth, setSelectedMonth] = useState('ALL')
  const [selectedYear, setSelectedYear] = useState('ALL')
  const [selectedSubject, setSelectedSubject] = useState('ALL')
  const [selectedType, setSelectedType] = useState('ALL')
  const [quickFilter, setQuickFilter] = useState('today') // 'today' | 'week' | 'month' | 'all'
  const [activeTimeTab, setActiveTimeTab] = useState('Daily') // 'Daily' | 'Weekly' | 'Monthly' | 'Year-wise'
  const [activeSubjectPill, setActiveSubjectPill] = useState('ALL')
  const [subjectCheckboxes, setSubjectCheckboxes] = useState({})
  const [typeCheckboxes, setTypeCheckboxes] = useState({})

  // Archive & Carousel State
  const [activeArchiveTab, setActiveArchiveTab] = useState('Daily Content')
  const [selectedArchiveDate, setSelectedArchiveDate] = useState('')

  // Modals State
  const [previewResource, setPreviewResource] = useState(null)
  const [previewZoom, setPreviewZoom] = useState(100)
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const [downloadToast, setDownloadToast] = useState(null)

  // Carousel Refs
  const weeklyCarouselRef = useRef(null)
  const monthlyCarouselRef = useRef(null)
  const scrubberRef = useRef(null)

  // ── Firestore Subscriptions ──────────────────────────────────────────────────
  useEffect(() => {
    // 1. Resources listener
    const unsubRes = fbFirestore.onResourcesChanged(data => {
      setResources(data || [])
      setLoading(false)
    })

    // 2. Settings listener (for admin custom words)
    const unsubSettings = fbFirestore.onSettingsChanged(s => {
      if (s?.freeResourcesPage) {
        setSettings(prev => ({ ...DEFAULT_FREE_RESOURCES_SETTINGS, ...s.freeResourcesPage }))
      }
    })

    return () => {
      if (typeof unsubRes === 'function') unsubRes()
      if (typeof unsubSettings === 'function') unsubSettings()
    }
  }, [])

  // ── Public Resources (Only visible items) ──────────────────────────────────
  const publicResources = useMemo(() => {
    return resources.filter(r => r.isPublic !== false && r.visible !== false && r.status !== 'draft')
  }, [resources])

  // Count items per subject among public resources
  const subjectCounts = useMemo(() => {
    const counts = {}
    publicResources.forEach(r => {
      const cat = r.category || 'Others'
      counts[cat] = (counts[cat] || 0) + 1
    })
    return counts
  }, [publicResources])

  // Count items per type among public resources
  const typeCounts = useMemo(() => {
    const counts = {}
    publicResources.forEach(r => {
      const t = r.resourceType || 'Others'
      counts[t] = (counts[t] || 0) + 1
    })
    return counts
  }, [publicResources])

  // ── Unique Filter Options strictly from available public resources ──────────
  const { subjectsList, typesList, yearsList, monthsList, daysList } = useMemo(() => {
    const subjects = new Set()
    const types = new Set()
    const years = new Set()
    const months = new Set()
    const days = new Set()

    publicResources.forEach(r => {
      if (r.category && subjectCounts[r.category] > 0) subjects.add(r.category)
      if (r.resourceType && typeCounts[r.resourceType] > 0) types.add(r.resourceType)
      if (r.date) {
        const d = new Date(r.date)
        if (!isNaN(d.getTime())) {
          years.add(d.getFullYear().toString())
          months.add(d.toLocaleString('en-US', { month: 'short' }))
          days.add(d.getDate().toString().padStart(2, '0'))
        }
      }
    })

    return {
      subjectsList: Array.from(subjects).sort(),
      typesList: Array.from(types).sort(),
      yearsList: Array.from(years).sort().reverse(),
      monthsList: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      daysList: Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'))
    }
  }, [publicResources, subjectCounts, typeCounts])

  // ── Filter Application Logic ─────────────────────────────────────────────────
  const isSearchOrFilterActive = useMemo(() => {
    return Boolean(
      searchQuery.trim() ||
      selectedDay !== 'ALL' ||
      selectedMonth !== 'ALL' ||
      selectedYear !== 'ALL' ||
      selectedSubject !== 'ALL' ||
      selectedType !== 'ALL' ||
      activeSubjectPill !== 'ALL' ||
      quickFilter === 'all' ||
      quickFilter === 'week' ||
      quickFilter === 'month' ||
      Object.values(subjectCheckboxes).some(Boolean) ||
      Object.values(typeCheckboxes).some(Boolean)
    )
  }, [searchQuery, selectedDay, selectedMonth, selectedYear, selectedSubject, selectedType, activeSubjectPill, quickFilter, subjectCheckboxes, typeCheckboxes])

  const filteredResources = useMemo(() => {
    return publicResources.filter(res => {
      // 1. Text Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchTitle = (res.title || '').toLowerCase().includes(q)
        const matchDesc = (res.description || '').toLowerCase().includes(q)
        const matchCat = (res.category || '').toLowerCase().includes(q)
        const matchType = (res.resourceType || '').toLowerCase().includes(q)
        if (!matchTitle && !matchDesc && !matchCat && !matchType) return false
      }

      // 2. Dropdown / Checkbox Subjects
      const activeSubjects = Object.keys(subjectCheckboxes).filter(k => subjectCheckboxes[k])
      if (activeSubjects.length > 0) {
        if (!activeSubjects.includes(res.category)) return false
      } else if (selectedSubject !== 'ALL') {
        if (res.category !== selectedSubject) return false
      } else if (activeSubjectPill !== 'ALL') {
        if (res.category !== activeSubjectPill) return false
      }

      // 3. Dropdown / Checkbox Types
      const activeTypes = Object.keys(typeCheckboxes).filter(k => typeCheckboxes[k])
      if (activeTypes.length > 0) {
        if (!activeTypes.includes(res.resourceType)) return false
      } else if (selectedType !== 'ALL') {
        if (res.resourceType !== selectedType) return false
      }

      // 4. Quick Filters
      if (quickFilter === 'week' && res.date) {
        const d = new Date(res.date)
        const now = new Date()
        const diffDays = (now - d) / (1000 * 60 * 60 * 24)
        if (diffDays > 7 || diffDays < -1) return false
      } else if (quickFilter === 'month' && res.date) {
        const d = new Date(res.date)
        const now = new Date()
        const diffDays = (now - d) / (1000 * 60 * 60 * 24)
        if (diffDays > 31 || diffDays < -1) return false
      }

      // 5. Date components
      if (res.date) {
        const d = new Date(res.date)
        if (!isNaN(d.getTime())) {
          if (selectedYear !== 'ALL' && d.getFullYear().toString() !== selectedYear) return false
          if (selectedMonth !== 'ALL' && d.toLocaleString('en-US', { month: 'short' }) !== selectedMonth) return false
          if (selectedDay !== 'ALL' && d.getDate().toString().padStart(2, '0') !== selectedDay) return false
        }
      }

      return true
    })
  }, [publicResources, searchQuery, selectedDay, selectedMonth, selectedYear, selectedSubject, selectedType, activeSubjectPill, subjectCheckboxes, typeCheckboxes, quickFilter])

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('')
    setSelectedDay('ALL')
    setSelectedMonth('ALL')
    setSelectedYear('ALL')
    setSelectedSubject('ALL')
    setSelectedType('ALL')
    setActiveSubjectPill('ALL')
    setSubjectCheckboxes({})
    setTypeCheckboxes({})
    setQuickFilter('today')
  }

  // ── Dynamic Sections Data ───────────────────────────────────────────────────
  // Today's Resources (Strictly today's calendar date; section hidden if empty)
  const todaysResources = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0]
    return publicResources.filter(r => {
      if (!r.date) return false
      // Match exact YYYY-MM-DD or date substring
      return r.date === todayStr || r.date.startsWith(todayStr)
    })
  }, [publicResources])

  // Weekly Magazines
  const weeklyMagazines = useMemo(() => {
    return publicResources.filter(r => r.resourceType === 'Weekly Magazine')
  }, [publicResources])

  // Monthly Magazines
  const monthlyMagazines = useMemo(() => {
    return publicResources.filter(r => r.resourceType === 'Monthly Magazine')
  }, [publicResources])

  // Popular Resources
  const popularResources = useMemo(() => {
    const list = publicResources.filter(r => r.isPopular || r.popularRank)
    if (list.length > 0) {
      return [...list].sort((a, b) => (a.popularRank || 99) - (b.popularRank || 99)).slice(0, 3)
    }
    return [...publicResources].sort((a, b) => (b.downloadsCount || 0) - (a.downloadsCount || 0)).slice(0, 3)
  }, [publicResources])

  // Dynamic Past Archive dates strictly from real public resources
  const archiveDates = useMemo(() => {
    const dateMap = {}
    publicResources.forEach(r => {
      if (r.date) {
        dateMap[r.date] = (dateMap[r.date] || 0) + 1
      }
    })
    return Object.keys(dateMap).sort().reverse().map(d => {
      const dt = new Date(d)
      return {
        date: d,
        day: !isNaN(dt.getTime()) ? dt.getDate().toString().padStart(2, '0') : d.split('-')[2] || '01',
        month: !isNaN(dt.getTime()) ? dt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Archive',
        count: dateMap[d]
      }
    })
  }, [publicResources])

  // Auto-select first archive date when dates load
  useEffect(() => {
    if (archiveDates.length > 0 && (!selectedArchiveDate || !archiveDates.some(a => a.date === selectedArchiveDate))) {
      setSelectedArchiveDate(archiveDates[0].date)
    }
  }, [archiveDates, selectedArchiveDate])

  // Archive filtered resources
  const archiveFilteredResources = useMemo(() => {
    if (activeArchiveTab === 'Weekly Magazines') return weeklyMagazines
    if (activeArchiveTab === 'Monthly Magazines') return monthlyMagazines
    if (!selectedArchiveDate) return publicResources
    return publicResources.filter(r => r.date === selectedArchiveDate || (r.issueInfo && r.issueInfo.includes(selectedArchiveDate.split('-')[2])))
  }, [publicResources, activeArchiveTab, selectedArchiveDate, weeklyMagazines, monthlyMagazines])

  const todayFormatted = useMemo(() => {
    try {
      return new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    } catch {
      return 'Latest Content'
    }
  }, [])

  // ── Actions: Download & Preview ──────────────────────────────────────────────
  const handleDownload = (res) => {
    if (!res) return
    const driveId = extractGoogleDriveId(res.url || res.driveUrl || res.driveFileId)
    const downloadUrl = driveId
      ? `https://drive.google.com/uc?export=download&id=${driveId}`
      : res.url

    // Trigger download
    const a = document.createElement('a')
    a.href = downloadUrl
    a.target = '_blank'
    a.rel = 'noreferrer'
    a.download = `${res.title || 'Nermai_Resource'}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)

    // Show feedback toast
    setDownloadToast({
      title: res.title || 'Document',
      size: formatFileSize(res.sizeBytes),
      url: downloadUrl
    })
    setTimeout(() => setDownloadToast(null), 4500)
  }

  // Carousel Scroll Handlers
  const scrollCarousel = (ref, dir) => {
    if (ref.current) {
      const scrollAmount = dir === 'left' ? -320 : 320
      ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  // ── Card Category Badge Color Helper ─────────────────────────────────────────
  const getCatClass = (cat) => {
    if (!cat) return 'frp-cat-default'
    const c = cat.toLowerCase()
    if (c.includes('current')) return 'frp-cat-ca'
    if (c.includes('general') || c.includes('gs')) return 'frp-cat-gs'
    if (c.includes('tamil') || c.includes('tn')) return 'frp-cat-tn'
    if (c.includes('polity')) return 'frp-cat-polity'
    return 'frp-cat-default'
  }

  // Cursive script lines parser for top-right slogan
  const scriptLines = useMemo(() => {
    const raw = (settings.sloganRight || 'Knowledge\nToday\nA Stronger\nTomorrow').trim()
    if (raw.includes('\n')) {
      return raw.split('\n').map(s => s.trim()).filter(Boolean)
    }
    if (raw.includes(',')) {
      const parts = raw.split(',')
      return [
        parts[0]?.trim().split(' ')[0] || 'Knowledge',
        parts[0]?.trim().split(' ').slice(1).join(' ') || 'Today',
        parts[1]?.trim().split(' ').slice(0, -1).join(' ') || 'A Stronger',
        parts[1]?.trim().split(' ').slice(-1)[0] || 'Tomorrow'
      ].filter(Boolean)
    }
    return raw.split(' ').map(s => s.trim()).filter(Boolean)
  }, [settings.sloganRight])

  return (
    <div className="frp-page">
      <ScrollProgress />
      <div id="top" />

      {/* Main Header */}
      <Header activePath="/free-resources" />

      {/* ── 1. IMMERSIVE HERO BANNER ── */}
      <section className="frp-immersive-hero">
        {/* Base rich deep maroon background */}
        <div className="frp-hero-base-bg" />

        {/* Clean books & Ashoka emblem artwork on the right with feathered mask */}
        <div
          className="frp-hero-books-layer"
          style={{
            backgroundImage: `url(${driveStorage.formatImageUrl(settings.heroSideImgUrl || settings.heroBgUrl) || '/free-resources-books.png'})`
          }}
        />
        {/* Ambient ruby spotlight beam */}
        <div className="frp-hero-spotlight-beam" />

        <div className="frp-hero-inner-bounds">
          {/* Left Text Block */}
          <div className="frp-hero-text-block">
            
            {/* Eyebrow with gold line */}
            <div className="frp-hero-eyebrow-container">
              <span className="frp-hero-eyebrow-label">{settings.eyebrow || 'FREE RESOURCES'}</span>
              <span className="frp-hero-eyebrow-rule" />
            </div>

            {/* Headline */}
            <h1 className="frp-hero-headline">
              {settings.title || 'Learn. Prepare. Grow.'}{' '}
              <span className="frp-hero-gold-text">{settings.highlightWord || 'For Free.'}</span>
            </h1>

            {/* Description */}
            <p className="frp-hero-desc-para">
              {settings.description || 'Access high-quality study materials, daily updates, magazines and more — shared by Nermai for every aspirant.'}
            </p>

            {/* Badges Strip */}
            <div className="frp-hero-badges-row">
              {settings.badges && settings.badges.map((b, i) => (
                <div key={b.id || i} className="frp-hero-badge-pill">
                  <i className={`fa-solid ${b.icon || 'fa-shield-halved'}`} />
                  <span>{b.label}</span>
                </div>
              ))}
            </div>

          </div>

          {/* Right Script Slogan Callout */}
          <div className="frp-hero-script-callout">
            <div className="frp-script-quote-box">
              {scriptLines.map((line, idx) => (
                <span
                  key={idx}
                  className={`frp-script-line-item ${idx === 1 ? 'frp-script-indent-sm' : ''} ${idx === 3 ? 'frp-script-indent-md' : ''}`}
                >
                  {line}
                </span>
              ))}
              <div className="frp-script-gold-underline" />
            </div>
          </div>

        </div>
      </section>

      {/* ── 2. SEARCH & FILTER STRIP ── */}
      <section id="resources-catalogue" className="frp-search-filter-strip">
        <div className="frp-filter-bar-inner">
          
          {/* Search Box */}
          <div className="frp-search-box">
            <i className="fa-solid fa-magnifying-glass fa-search" />
            <input
              type="text"
              className="frp-search-input"
              placeholder={settings.searchPlaceholder}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="frp-search-clear-btn" onClick={() => setSearchQuery('')}>
                <i className="fa-solid fa-xmark" />
              </button>
            )}
          </div>

          {/* Dropdowns (Desktop) */}
          <div className="frp-dropdown-group">
            {/* Day */}
            <div className="frp-select-wrap">
              <select value={selectedDay} onChange={e => setSelectedDay(e.target.value)}>
                <option value="ALL">{settings.filterDayLabel}</option>
                {daysList.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <i className="fa-solid fa-chevron-down" />
            </div>

            {/* Month */}
            <div className="frp-select-wrap">
              <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
                <option value="ALL">{settings.filterMonthLabel}</option>
                {monthsList.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <i className="fa-solid fa-chevron-down" />
            </div>

            {/* Year */}
            <div className="frp-select-wrap">
              <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
                <option value="ALL">{settings.filterYearLabel}</option>
                {yearsList.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <i className="fa-solid fa-chevron-down" />
            </div>

            {/* Subject */}
            <div className="frp-select-wrap">
              <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
                <option value="ALL">{settings.filterSubjectLabel}</option>
                {subjectsList.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <i className="fa-solid fa-chevron-down" />
            </div>

            {/* Resource Type */}
            <div className="frp-select-wrap">
              <select value={selectedType} onChange={e => setSelectedType(e.target.value)}>
                <option value="ALL">{settings.filterTypeLabel}</option>
                {typesList.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <i className="fa-solid fa-chevron-down" />
            </div>

            <button className="frp-btn-apply" onClick={() => {}}>
              {settings.applyBtnText}
            </button>

            {isSearchOrFilterActive && (
              <button className="frp-btn-reset" onClick={handleResetFilters}>
                {settings.resetBtnText}
              </button>
            )}
          </div>

          {/* Mobile Filter Trigger Button */}
          <button className="frp-mobile-filter-trigger" onClick={() => setFilterDrawerOpen(true)}>
            <i className="fa-solid fa-sliders" />
            Filters {isSearchOrFilterActive && '(Active)'}
          </button>

        </div>
      </section>

      {/* ── 3. MOBILE QUICK TABS & SUBJECT ICONS ── */}
      <div className="frp-mobile-quick-bar">
        {/* Time Tabs */}
        <div className="frp-time-tabs-row">
          {['Daily', 'Weekly', 'Monthly', 'Year-wise'].map(tab => (
            <button
              key={tab}
              className={`frp-time-tab-btn ${activeTimeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTimeTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Subject Circles */}
        <div className="frp-subject-pills-row">
          <div
            className={`frp-subject-pill-circle ${activeSubjectPill === 'ALL' ? 'active' : ''}`}
            onClick={() => setActiveSubjectPill('ALL')}
          >
            <div className="frp-subject-pill-icon">
              <i className="fa-solid fa-layer-group" />
            </div>
            <span className="frp-subject-pill-label">All</span>
          </div>
          {subjectsList.map(subj => (
            <div
              key={subj}
              className={`frp-subject-pill-circle ${activeSubjectPill === subj ? 'active' : ''}`}
              onClick={() => setActiveSubjectPill(subj)}
            >
              <div className="frp-subject-pill-icon">
                <i className="fa-solid fa-book-bookmark" />
              </div>
              <span className="frp-subject-pill-label">{subj}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── 4. MAIN CONTENT LAYOUT ── */}
      <main className="frp-main-content-layout">
        
        {/* Left Sidebar (Desktop Filters) */}
        <aside className="frp-sidebar">
          
          {/* Quick Filters */}
          <div className="frp-sidebar-card">
            <h3 className="frp-sidebar-title">{settings.quickFiltersTitle}</h3>
            <div className="frp-quick-filter-list">
              <button
                className={`frp-quick-filter-btn ${quickFilter === 'today' ? 'active' : ''}`}
                onClick={() => { setQuickFilter('today'); handleResetFilters(); }}
              >
                <i className="fa-regular fa-calendar-check" />
                {settings.quickFilterToday}
              </button>
              <button
                className={`frp-quick-filter-btn ${quickFilter === 'week' ? 'active' : ''}`}
                onClick={() => setQuickFilter('week')}
              >
                <i className="fa-regular fa-calendar-days" />
                {settings.quickFilterWeek}
              </button>
              <button
                className={`frp-quick-filter-btn ${quickFilter === 'month' ? 'active' : ''}`}
                onClick={() => setQuickFilter('month')}
              >
                <i className="fa-regular fa-calendar" />
                {settings.quickFilterMonth}
              </button>
              <button
                className={`frp-quick-filter-btn ${quickFilter === 'all' ? 'active' : ''}`}
                onClick={() => { setQuickFilter('all'); }}
              >
                <i className="fa-solid fa-book-open" />
                {settings.quickFilterAll}
              </button>
            </div>
          </div>

          {/* Subjects Checkboxes */}
          <div className="frp-sidebar-card">
            <div className="frp-sidebar-title">
              <span>{settings.subjectsTitle}</span>
              {Object.values(subjectCheckboxes).some(Boolean) && (
                <button
                  style={{ background: 'none', border: 'none', color: 'var(--maroon)', fontSize: '0.74rem', cursor: 'pointer', fontWeight: 700 }}
                  onClick={() => setSubjectCheckboxes({})}
                >
                  Clear All
                </button>
              )}
            </div>
            <div className="frp-checkbox-list">
              {subjectsList.length > 0 ? (
                subjectsList.map(subj => {
                  const isChecked = Boolean(subjectCheckboxes[subj])
                  return (
                    <label key={subj} className="frp-checkbox-label">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={e => setSubjectCheckboxes({ ...subjectCheckboxes, [subj]: e.target.checked })}
                      />
                      <span>{subj}</span>
                      <span className="count-pill">{subjectCounts[subj] || 0}</span>
                    </label>
                  )
                })
              ) : (
                <div style={{ fontSize: '0.8rem', color: 'var(--gray-400)', padding: '0.35rem 0' }}>
                  No active subjects
                </div>
              )}
            </div>
          </div>

          {/* Resource Types Checkboxes */}
          <div className="frp-sidebar-card">
            <div className="frp-sidebar-title">
              <span>{settings.resourceTypesTitle}</span>
              {Object.values(typeCheckboxes).some(Boolean) && (
                <button
                  style={{ background: 'none', border: 'none', color: 'var(--maroon)', fontSize: '0.74rem', cursor: 'pointer', fontWeight: 700 }}
                  onClick={() => setTypeCheckboxes({})}
                >
                  Clear All
                </button>
              )}
            </div>
            <div className="frp-checkbox-list">
              {typesList.length > 0 ? (
                typesList.map(t => {
                  const isChecked = Boolean(typeCheckboxes[t])
                  return (
                    <label key={t} className="frp-checkbox-label">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={e => setTypeCheckboxes({ ...typeCheckboxes, [t]: e.target.checked })}
                      />
                      <span>{t}</span>
                      <span className="count-pill">{typeCounts[t] || 0}</span>
                    </label>
                  )
                })
              ) : (
                <div style={{ fontSize: '0.8rem', color: 'var(--gray-400)', padding: '0.35rem 0' }}>
                  No active types
                </div>
              )}
            </div>
          </div>

        </aside>

        {/* Right Content Column */}
        <div className="frp-main-column">
          
          {/* A. If user is actively searching or filtering, show direct Filtered Results */}
          {isSearchOrFilterActive ? (
            <section>
              <div className="frp-section-header">
                <div className="frp-section-title-wrap">
                  <h2 className="frp-section-title">
                    <i className="fa-solid fa-filter" /> Search & Filtered Results
                  </h2>
                  <p className="frp-section-subtitle">
                    Showing {filteredResources.length} matching resources
                  </p>
                </div>
                <button className="frp-btn-reset" onClick={handleResetFilters}>
                  {settings.resetBtnText}
                </button>
              </div>

              {filteredResources.length > 0 ? (
                <div className="frp-cards-grid">
                  {filteredResources.map(res => (
                    <ResourceCard
                      key={res.id}
                      res={res}
                      settings={settings}
                      onPreview={() => setPreviewResource(res)}
                      onDownload={() => handleDownload(res)}
                      getCatClass={getCatClass}
                    />
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '3.5rem 1rem', background: '#FFFFFF', borderRadius: '16px', border: '1px solid var(--gray-200)' }}>
                  <i className="fa-solid fa-file-circle-question" style={{ fontSize: '3rem', color: 'var(--gray-300)', marginBottom: '1rem' }} />
                  <h3 style={{ fontSize: '1.25rem', color: 'var(--ink)', margin: '0 0 0.5rem' }}>{settings.noResultsTitle}</h3>
                  <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto 1.5rem' }}>{settings.noResultsDesc}</p>
                  <button className="frp-btn-apply" onClick={handleResetFilters}>Show All Resources</button>
                </div>
              )}
            </section>
          ) : (
            <>
              {publicResources.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 1rem', background: '#FFFFFF', borderRadius: '16px', border: '1px solid var(--gray-200)' }}>
                  <i className="fa-solid fa-folder-open" style={{ fontSize: '3rem', color: 'var(--gray-300)', marginBottom: '1rem' }} />
                  <h3 style={{ fontSize: '1.25rem', color: 'var(--ink)', margin: '0 0 0.5rem' }}>No public resources available yet</h3>
                  <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto' }}>
                    Materials uploaded and published from the admin panel will appear here for aspirants.
                  </p>
                </div>
              ) : (
                <>
                  {/* B. SECTION 1: TODAY'S / LATEST RESOURCES */}
                  {todaysResources.length > 0 && (
                    <section id="todays-resources">
                      <div className="frp-section-header">
                        <div className="frp-section-title-wrap">
                          <h2 className="frp-section-title">
                            <i className="fa-regular fa-calendar-check" />
                            {settings.todaysTitle}
                          </h2>
                          <span className="frp-section-date-pill">
                            <i className="fa-regular fa-clock" /> {todayFormatted}
                          </span>
                        </div>
                        {archiveDates.length > 1 && (
                          <a href="#past-archive" className="frp-view-all-link">
                            {settings.todaysArchiveLinkText} <i className="fa-solid fa-arrow-right" />
                          </a>
                        )}
                      </div>

                      <div className="frp-cards-grid">
                        {todaysResources.map(res => (
                          <ResourceCard
                            key={res.id}
                            res={res}
                            settings={settings}
                            onPreview={() => setPreviewResource(res)}
                            onDownload={() => handleDownload(res)}
                            getCatClass={getCatClass}
                          />
                        ))}
                      </div>
                    </section>
                  )}

                  {/* C. SECTION 2: WEEKLY MAGAZINES (CAROUSEL) */}
                  {weeklyMagazines.length > 0 && (
                    <section id="weekly-magazines">
                      <div className="frp-section-header">
                        <div className="frp-section-title-wrap">
                          <h2 className="frp-section-title">
                            <i className="fa-solid fa-book-open" />
                            {settings.weeklyTitle}
                          </h2>
                          <p className="frp-section-subtitle">{settings.weeklySubtitle}</p>
                        </div>
                        <button
                          onClick={() => { setActiveArchiveTab('Weekly Magazines'); document.getElementById('past-archive')?.scrollIntoView({ behavior: 'smooth' }); }}
                          className="frp-view-all-link"
                          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          {settings.weeklyViewAllText} <i className="fa-solid fa-arrow-right" />
                        </button>
                      </div>

                      <div className="frp-carousel-wrapper">
                        <button className="frp-carousel-nav-btn frp-carousel-prev" onClick={() => scrollCarousel(weeklyCarouselRef, 'left')}>
                          <i className="fa-solid fa-chevron-left" />
                        </button>

                        <div className="frp-carousel-scroll-row" ref={weeklyCarouselRef}>
                          {weeklyMagazines.map(res => (
                            <div key={res.id} className="frp-carousel-card">
                              <ResourceCard
                                res={res}
                                settings={settings}
                                onPreview={() => setPreviewResource(res)}
                                onDownload={() => handleDownload(res)}
                                getCatClass={getCatClass}
                              />
                            </div>
                          ))}
                        </div>

                        <button className="frp-carousel-nav-btn frp-carousel-next" onClick={() => scrollCarousel(weeklyCarouselRef, 'right')}>
                          <i className="fa-solid fa-chevron-right" />
                        </button>
                      </div>
                    </section>
                  )}

                  {/* D. SECTION 3: MONTHLY MAGAZINES (CAROUSEL) */}
                  {monthlyMagazines.length > 0 && (
                    <section id="monthly-magazines">
                      <div className="frp-section-header">
                        <div className="frp-section-title-wrap">
                          <h2 className="frp-section-title">
                            <i className="fa-regular fa-folder-open" />
                            {settings.monthlyTitle}
                          </h2>
                          <p className="frp-section-subtitle">{settings.monthlySubtitle}</p>
                        </div>
                        <button
                          onClick={() => { setActiveArchiveTab('Monthly Magazines'); document.getElementById('past-archive')?.scrollIntoView({ behavior: 'smooth' }); }}
                          className="frp-view-all-link"
                          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          {settings.monthlyViewAllText} <i className="fa-solid fa-arrow-right" />
                        </button>
                      </div>

                      <div className="frp-carousel-wrapper">
                        <button className="frp-carousel-nav-btn frp-carousel-prev" onClick={() => scrollCarousel(monthlyCarouselRef, 'left')}>
                          <i className="fa-solid fa-chevron-left" />
                        </button>

                        <div className="frp-carousel-scroll-row" ref={monthlyCarouselRef}>
                          {monthlyMagazines.map(res => (
                            <div key={res.id} className="frp-carousel-card">
                              <ResourceCard
                                res={res}
                                settings={settings}
                                onPreview={() => setPreviewResource(res)}
                                onDownload={() => handleDownload(res)}
                                getCatClass={getCatClass}
                              />
                            </div>
                          ))}
                        </div>

                        <button className="frp-carousel-nav-btn frp-carousel-next" onClick={() => scrollCarousel(monthlyCarouselRef, 'right')}>
                          <i className="fa-solid fa-chevron-right" />
                        </button>
                      </div>
                    </section>
                  )}

                  {/* E. SECTION 4: PAST RESOURCES ARCHIVE */}
                  {archiveDates.length > 1 && (
                    <section id="past-archive">
                      <div className="frp-section-header">
                        <div className="frp-section-title-wrap">
                          <h2 className="frp-section-title">
                            <i className="fa-regular fa-clock" />
                            {settings.archiveTitle}
                          </h2>
                          <p className="frp-section-subtitle">{settings.archiveSubtitle}</p>
                        </div>
                        <span className="frp-view-all-link">
                          {settings.archiveViewAllText} <i className="fa-solid fa-arrow-right" />
                        </span>
                      </div>

                      {/* Tabs */}
                      <div className="frp-archive-tabs-row">
                        {[
                          { id: 'Daily Content', label: settings.tabDaily },
                          { id: 'Weekly Magazines', label: settings.tabWeekly },
                          { id: 'Monthly Magazines', label: settings.tabMonthly },
                          { id: 'Year-wise', label: settings.tabYear },
                          { id: 'Subject-wise', label: settings.tabSubject },
                        ].map(tab => (
                          <button
                            key={tab.id}
                            className={`frp-archive-tab-btn ${activeArchiveTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveArchiveTab(tab.id)}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>

                      {/* Date Scrubber Row */}
                      {activeArchiveTab === 'Daily Content' && archiveDates.length > 0 && (
                        <div className="frp-date-scrubber-wrapper">
                          <div className="frp-date-scrubber-row" ref={scrubberRef}>
                            {archiveDates.map(item => (
                              <div
                                key={item.date}
                                className={`frp-date-scrubber-card ${selectedArchiveDate === item.date ? 'active' : ''}`}
                                onClick={() => setSelectedArchiveDate(item.date)}
                              >
                                <div className="frp-date-day-num">{item.day}</div>
                                <div className="frp-date-month-str">{item.month}</div>
                                <span className="frp-date-count-label">{item.count} Resources</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Archive Items Grid */}
                      <div className="frp-cards-grid">
                        {archiveFilteredResources.slice(0, 6).map(res => (
                          <ResourceCard
                            key={res.id}
                            res={res}
                            settings={settings}
                            onPreview={() => setPreviewResource(res)}
                            onDownload={() => handleDownload(res)}
                            getCatClass={getCatClass}
                          />
                        ))}
                      </div>
                    </section>
                  )}

                  {/* F. SECTION 5: POPULAR RESOURCES */}
                  {popularResources.length > 0 && publicResources.length > 1 && (
                    <section id="popular-resources">
                      <div className="frp-section-header">
                        <div className="frp-section-title-wrap">
                          <h2 className="frp-section-title">
                            <i className="fa-solid fa-star" style={{ color: 'var(--gold)' }} />
                            {settings.popularTitle}
                          </h2>
                          <p className="frp-section-subtitle">Most downloaded study resources by civil services aspirants</p>
                        </div>
                      </div>

                      <div className="frp-popular-list">
                        {popularResources.map((res, index) => (
                          <div key={res.id} className="frp-popular-item">
                            <div className="frp-popular-rank-badge">{res.popularRank || index + 1}</div>
                            
                            {/* Mini Thumbnail */}
                            {getThumbnailUrl(res) ? (
                              <img
                                src={getThumbnailUrl(res)}
                                alt={res.title}
                                className="frp-popular-thumb"
                                onError={(e) => {
                                  e.target.style.display = 'none'
                                }}
                              />
                            ) : null}

                            <div className="frp-popular-info">
                              <h4 className="frp-popular-title">{res.title}</h4>
                              <div className="frp-popular-meta">
                                <span>{res.format || 'PDF'}</span> • <span>{formatFileSize(res.sizeBytes)}</span>
                                {res.pages && <span> • {res.pages} pages</span>}
                              </div>
                            </div>

                            <button
                              className="frp-popular-download-btn"
                              onClick={() => handleDownload(res)}
                              title={settings.downloadBtnText}
                            >
                              <i className="fa-solid fa-arrow-down-to-bracket" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </>
              )}
            </>
          )}

        </div>
      </main>

      {/* ── 5. RESOURCE PREVIEW MODAL (IN-APP PDF READER) ── */}
      {previewResource && (
        <div className="frp-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setPreviewResource(null); }}>
          <div className="frp-preview-modal-dialog" role="dialog" aria-modal="true">
            
            {/* Header */}
            <div className="frp-modal-header">
              <h3 className="frp-modal-header-title">Resource Preview</h3>
              <button className="frp-modal-close-btn" onClick={() => setPreviewResource(null)}>
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            {/* Toolbar */}
            <div className="frp-preview-toolbar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontWeight: 700, color: 'var(--gray-600)' }}>1 / {previewResource.pages || 12}</span>
              </div>
              <div className="frp-toolbar-zoom-ctrls">
                <button className="frp-toolbar-btn" onClick={() => setPreviewZoom(z => Math.max(50, z - 25))}>-</button>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, minWidth: '40px', textAlign: 'center' }}>{previewZoom}%</span>
                <button className="frp-toolbar-btn" onClick={() => setPreviewZoom(z => Math.min(200, z + 25))}>+</button>
                <button
                  className="frp-toolbar-btn"
                  onClick={() => {
                    const driveId = extractGoogleDriveId(previewResource.url || previewResource.driveUrl || previewResource.driveFileId)
                    if (driveId) window.open(`https://drive.google.com/file/d/${driveId}/view`, '_blank')
                    else if (previewResource.url) window.open(previewResource.url, '_blank')
                  }}
                  title={settings.viewFullScreenBtnText}
                >
                  <i className="fa-solid fa-expand" />
                </button>
              </div>
            </div>

            {/* Preview Frame Body */}
            <div className="frp-preview-body">
              <div className="frp-preview-iframe-wrapper" style={{ transform: `scale(${previewZoom / 100})`, transformOrigin: 'top center' }}>
                <iframe
                  src={getEmbedPreviewUrl(previewResource)}
                  title={previewResource.title}
                  className="frp-preview-iframe"
                  allow="autoplay"
                />
              </div>

              {/* Info Strip Below */}
              <div className="frp-preview-info-strip">
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 0.35rem', color: 'var(--ink)' }}>
                    {previewResource.title}
                  </h3>
                  <div style={{ fontSize: '0.84rem', color: 'var(--gray-500)' }}>
                    <i className="fa-solid fa-file-pdf" style={{ color: '#c0392b', marginRight: '5px' }} />
                    {previewResource.format || 'PDF'} • {formatFileSize(previewResource.sizeBytes)} • {previewResource.pages || 12} Pages
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    className="frp-btn-reset"
                    onClick={() => {
                      const driveId = extractGoogleDriveId(previewResource.url || previewResource.driveUrl || previewResource.driveFileId)
                      if (driveId) window.open(`https://drive.google.com/file/d/${driveId}/view`, '_blank')
                      else if (previewResource.url) window.open(previewResource.url, '_blank')
                    }}
                  >
                    <i className="fa-solid fa-expand" /> {settings.viewFullScreenBtnText}
                  </button>
                  <button className="frp-btn-download" onClick={() => handleDownload(previewResource)}>
                    <i className="fa-solid fa-arrow-down-to-bracket" /> {settings.downloadBtnText}
                  </button>
                </div>
              </div>

              {/* Related Resources */}
              {publicResources.filter(r => r.id !== previewResource.id).length > 0 && (
                <div className="frp-related-list">
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800, margin: '0 0 0.85rem', color: 'var(--ink)' }}>
                    {settings.relatedResourcesTitle}
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {publicResources.filter(r => r.id !== previewResource.id).slice(0, 3).map(rel => (
                      <div key={rel.id} className="frp-popular-item" style={{ padding: '0.65rem 1rem' }}>
                        {getThumbnailUrl(rel) ? (
                          <img
                            src={getThumbnailUrl(rel)}
                            alt={rel.title}
                            className="frp-popular-thumb"
                            style={{ width: '38px', height: '46px' }}
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : null}
                        <div className="frp-popular-info">
                          <div style={{ fontSize: '0.86rem', fontWeight: 750, color: 'var(--ink)' }}>{rel.title}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--gray-400)' }}>
                            PDF • {formatFileSize(rel.sizeBytes)}
                          </div>
                        </div>
                        <button
                          className="frp-popular-download-btn"
                          style={{ width: '32px', height: '32px' }}
                          onClick={() => handleDownload(rel)}
                        >
                          <i className="fa-solid fa-arrow-down-to-bracket" style={{ fontSize: '0.75rem' }} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

          </div>
        </div>
      )}

      {/* ── 6. MOBILE FILTER DRAWER ── */}
      {filterDrawerOpen && (
        <div className="frp-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setFilterDrawerOpen(false); }}>
          <div className="frp-filter-drawer">
            <div className="frp-drawer-handle" />

            <div className="frp-modal-header" style={{ borderBottom: 'none' }}>
              <h3 className="frp-modal-header-title">Filters</h3>
              <button className="frp-modal-close-btn" onClick={() => setFilterDrawerOpen(false)}>
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <div className="frp-drawer-content">
              {/* Subjects */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <strong style={{ fontSize: '0.88rem' }}>{settings.subjectsTitle}</strong>
                  <button
                    style={{ background: 'none', border: 'none', color: 'var(--maroon)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 700 }}
                    onClick={() => setSubjectCheckboxes({})}
                  >
                    Clear All
                  </button>
                </div>
                <div className="frp-checkbox-list" style={{ maxHeight: '180px' }}>
                  {subjectsList.map(s => (
                    <label key={s} className="frp-checkbox-label">
                      <input
                        type="checkbox"
                        checked={Boolean(subjectCheckboxes[s])}
                        onChange={e => setSubjectCheckboxes({ ...subjectCheckboxes, [s]: e.target.checked })}
                      />
                      <span>{s}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Resource Types */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <strong style={{ fontSize: '0.88rem' }}>{settings.resourceTypesTitle}</strong>
                  <button
                    style={{ background: 'none', border: 'none', color: 'var(--maroon)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 700 }}
                    onClick={() => setTypeCheckboxes({})}
                  >
                    Clear All
                  </button>
                </div>
                <div className="frp-checkbox-list" style={{ maxHeight: '180px' }}>
                  {typesList.map(t => (
                    <label key={t} className="frp-checkbox-label">
                      <input
                        type="checkbox"
                        checked={Boolean(typeCheckboxes[t])}
                        onChange={e => setTypeCheckboxes({ ...typeCheckboxes, [t]: e.target.checked })}
                      />
                      <span>{t}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="frp-drawer-footer">
              <button
                className="frp-btn-reset"
                style={{ flex: 1 }}
                onClick={() => { handleResetFilters(); setFilterDrawerOpen(false); }}
              >
                {settings.resetBtnText}
              </button>
              <button
                className="frp-btn-apply"
                style={{ flex: 2 }}
                onClick={() => setFilterDrawerOpen(false)}
              >
                {settings.applyBtnText} ({filteredResources.length})
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── 7. DOWNLOAD STARTED FEEDBACK TOAST ── */}
      {downloadToast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: 'var(--white)',
          border: '1.5px solid #22c55e',
          boxShadow: '0 12px 35px rgba(0, 0, 0, 0.15)',
          borderRadius: '16px',
          padding: '1rem 1.25rem',
          zIndex: 10001,
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          maxWidth: '380px',
          animation: 'frpSlideUp 0.3s ease-out'
        }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: '50%',
            background: 'rgba(34, 197, 94, 0.12)', color: '#22c55e',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.25rem', flexShrink: 0
          }}>
            <i className="fa-solid fa-circle-check" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--ink)' }}>
              {settings.downloadSuccessTitle}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              "{downloadToast.title}" ({downloadToast.size})
            </div>
          </div>
          <button
            onClick={() => setDownloadToast(null)}
            style={{ background: 'none', border: 'none', color: 'var(--gray-400)', cursor: 'pointer', padding: '0.2rem' }}
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
      )}

      {/* Integrated Office Locations and Footer */}
      <OfficeLocations />
      <Footer />
    </div>
  )
}

// ── Resource Card Component ───────────────────────────────────────────────────
function ResourceCard({ res, settings, onPreview, onDownload, getCatClass }) {
  const [imgError, setImgError] = useState(false)
  const thumbnailSrc = getThumbnailUrl(res)

  return (
    <div className="frp-resource-card">
      {/* Thumbnail Container */}
      <div className="frp-card-thumb-container" onClick={onPreview} style={{ cursor: 'pointer' }}>
        {thumbnailSrc && !imgError ? (
          <img
            src={thumbnailSrc}
            alt={res.title}
            className="frp-card-thumb-img"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="frp-card-thumb-fallback">
            <span className="frp-fallback-watermark">NERMAI IAS ACADEMY</span>
            <h4 className="frp-fallback-title">{res.title}</h4>
            <div className="frp-fallback-footer">
              <span>{res.category || 'STUDY MATERIAL'}</span>
              <span>{res.format || 'PDF'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Category Pill */}
      <div>
        <span className={`frp-card-cat-pill ${getCatClass(res.category)}`}>
          {res.category || 'General Studies'}
        </span>
      </div>

      {/* Title */}
      <h3 className="frp-card-title" title={res.title}>
        {res.title}
      </h3>

      {/* Meta */}
      <div className="frp-card-meta">
        <span>{res.format || 'PDF'}</span>
        <span>•</span>
        <span>{formatFileSize(res.sizeBytes)}</span>
        {res.pages && (
          <>
            <span>•</span>
            <span>{res.pages} pages</span>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="frp-card-actions">
        <button className="frp-btn-preview" onClick={onPreview} title={settings.previewBtnText}>
          <i className="fa-regular fa-eye" />
          {settings.previewBtnText}
        </button>
        <button className="frp-btn-download" onClick={onDownload} title={settings.downloadBtnText}>
          <i className="fa-solid fa-arrow-down-to-bracket" />
          {settings.downloadBtnText}
        </button>
      </div>
    </div>
  )
}
