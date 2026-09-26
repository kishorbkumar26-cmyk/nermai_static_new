import React, { useState, useEffect } from 'react'
import { fbFirestore } from '../../firebase/firestore'
import { driveStorage } from '../../services/driveStorage'
import AdminImageUpload from './AdminImageUpload'

/* ── tiny helpers ─────────────────────────────────────────────────────────── */
function Field({ label, value, onChange, type = 'text', placeholder = '', options = [] }) {
  return (
    <div className="ap-form-group">
      <label>{label}</label>
      {type === 'textarea' ? (
        <textarea className="ap-input ap-textarea" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} />
      ) : type === 'select' ? (
        <select className="ap-input" value={value} onChange={e => onChange(e.target.value)}>
          {options.map(opt => <option key={opt.value || opt} value={opt.value || opt}>{opt.label || opt}</option>)}
        </select>
      ) : (
        <input type={type} className="ap-input" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
      )}
    </div>
  )
}

function Toggle({ label, checked, onChange }) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={{ cursor: 'pointer' }} />
      {label}
    </label>
  )
}

/* ── Section Visibility Editor ───────────────────────────────────────────── */
function VisibilityEditor({ visibility = {}, onChange }) {
  const update = (key, val) => onChange({ ...visibility, [key]: val })
  
  const SECTIONS = [
    { key: 'stats', label: 'Stats Banner (Orange Numbers)' },
    { key: 'features', label: 'Features Grid (What You Get)' },
    { key: 'courses', label: 'Courses Section' },
    { key: 'about', label: 'About Nermai Section' },
    { key: 'steps', label: 'How It Works (Steps)' },
    { key: 'results', label: 'Results & Marquee' },
    { key: 'toppers', label: 'Toppers Carousel' },
    { key: 'gallery', label: 'Gallery Section' },
    { key: 'googleReviews', label: 'Google Reviews (Elfsight Widget)' },
    { key: 'freeResources', label: 'Free Resources (Study Notes & Question Banks)' },
    { key: 'faq', label: 'FAQ Section' }
  ]

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--gray-400)', marginBottom: '1.25rem' }}>
        Show or hide entire sections on the public homepage.
      </p>
      <div className="ap-card" style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
        {SECTIONS.map(sec => (
          <Toggle 
            key={sec.key} 
            label={sec.label} 
            checked={visibility[sec.key] !== false} 
            onChange={v => update(sec.key, v)} 
          />
        ))}
      </div>
    </div>
  )
}

/* ── Stats Editor ─────────────────────────────────────────────────────────── */
function StatsEditor({ stats = [], visibility = {}, onChange, onChangeVisibility }) {
  const isStatsVisible = visibility.stats !== false
  const updateVisibility = (val) => onChangeVisibility && onChangeVisibility({ ...visibility, stats: val })

  const update = (i, key, val) => {
    const next = stats.map((s, idx) => idx === i ? { ...s, [key]: val } : s)
    onChange(next)
  }
  const add = () => onChange([...stats, { num: '', label: '', sublabel: '', visible: true }])
  const remove = (i) => onChange(stats.filter((_, idx) => idx !== i))

  return (
    <div>
      {/* Top Overall Visibility Card */}
      <div
        className="ap-card"
        style={{
          marginBottom: '1.5rem',
          padding: '1.25rem 1.5rem',
          borderLeft: isStatsVisible ? '5px solid #10b981' : '5px solid #ef4444',
          background: isStatsVisible ? '#f0fdf4' : '#fef2f2',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.2rem' }}>{isStatsVisible ? '🟢' : '🔴'}</span>
            <strong style={{ fontSize: '1rem', color: isStatsVisible ? '#065f46' : '#991b1b' }}>
              {isStatsVisible ? 'Stats Banner is VISIBLE on Homepage' : 'Stats Banner is HIDDEN on Homepage'}
            </strong>
          </div>
          <p style={{ margin: '0.25rem 0 0 1.8rem', fontSize: '0.8rem', color: isStatsVisible ? '#047857' : '#b91c1c' }}>
            Controls the main maroon banner with orange numbers right below the hero carousel.
          </p>
        </div>

        <Toggle 
          label={isStatsVisible ? 'Banner: ON' : 'Banner: OFF'} 
          checked={isStatsVisible} 
          onChange={updateVisibility} 
        />
      </div>

      <p style={{ fontSize: '0.82rem', color: 'var(--gray-400)', marginBottom: '1.25rem' }}>
        Edit the impact stats and success terms (e.g. 5000+, 15+, 28+, Highest) displayed in the maroon card on the homepage.
      </p>
      {stats.map((stat, i) => (
        <div key={i} className="ap-card" style={{ marginBottom: '0.75rem', padding: '1rem', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--maroon)' }}>
                Stat {i + 1}
              </div>
              <Toggle label="Visible" checked={stat.visible !== false} onChange={v => update(i, 'visible', v)} />
            </div>
            {stats.length > 1 && (
              <button 
                onClick={() => remove(i)} 
                title="Remove Stat"
                className="btn"
                style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #f87171', padding: '0.25rem 0.75rem', fontSize: '0.75rem', borderRadius: '4px' }}
              >
                <i className="fa-solid fa-trash" style={{ marginRight: '6px' }} />
                Delete
              </button>
            )}
          </div>
          <div className="ap-form-row">
            <Field label="Number / Value (e.g. 5000+ or Highest)" value={stat.num} onChange={v => update(i, 'num', v)} placeholder="e.g. 5000+ or Highest" />
            <Field label="Label" value={stat.label} onChange={v => update(i, 'label', v)} placeholder="e.g. Students or Success" />
          </div>
          <Field label="Sub-Label / Description" value={stat.sublabel} onChange={v => update(i, 'sublabel', v)} placeholder="e.g. Consistent results, brighter futures" />
        </div>
      ))}
      <button 
        onClick={add}
        className="btn" 
        style={{ marginTop: '0.5rem', width: '100%', justifyContent: 'center', background: 'var(--gray-100)', color: 'var(--gray-700)', border: '1px dashed var(--gray-300)' }}
      >
        <i className="fa-solid fa-plus" style={{ marginRight: '8px' }} />
        Add Stat
      </button>
    </div>
  )
}

/* ── Features Editor (Class Platform / Everything You Need to Succeed) ────── */
const DEFAULT_FEATURES_CONFIG = {
  eyebrow: 'NERMAI CLASS PLATFORM',
  title: 'Everything You Need to Succeed',
  subtitle: 'A complete learning ecosystem designed for Tamil-medium aspirants, with expert guidance, structured preparation and continuous support.',
  highlights: [
    { icon: 'Tv', title: 'Live + Recorded', sub: 'FLEXIBLE LEARNING' },
    { icon: 'GraduationCap', title: 'Expert Faculty', sub: '15+ YEARS EXPERIENCE' },
    { icon: 'ShieldCheck', title: 'Exam Focused', sub: 'RESULT ORIENTED' },
    { icon: 'Globe', title: 'Tamil & English', sub: 'BILINGUAL SUPPORT' }
  ]
}

const DEFAULT_FEATURE_DETAILS = [
  {
    number: '01',
    icon: 'GraduationCap',
    title: 'Structured Classes',
    subtitle: 'Daily scheduled classes with expert faculty in Tamil & English medium.',
    tag: 'FEATURE 01',
    caption: 'Learn from the best, at your own pace.',
    desc: 'Daily scheduled classes covering the complete syllabus with expert faculty in Tamil and English medium. Includes live interactive sessions, recorded classes, doubt clearing and revision sessions.',
    checkpoints: [
      'Expert faculty with years of experience',
      'Live + recorded classes',
      'Tamil & English medium',
      'Exam-oriented teaching approach',
      'Doubt clearing sessions'
    ],
    primaryCta: 'EXPLORE CLASSES',
    primaryCtaLink: '',
    secondaryCta: 'View Sample Class',
    secondaryCtaLink: '',
    imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop',
    calloutNote: 'Your classroom anywhere, anytime',
    quote: 'Well-structured classes made it easy for me to understand complex topics.',
    author: '— M. Karthik, TNPSC Group II (2024)',
    visible: true
  },
  {
    number: '02',
    icon: 'BookOpen',
    title: 'Study Materials',
    subtitle: 'Comprehensive study notes and question banks aligned to exam pattern.',
    tag: 'FEATURE 02',
    caption: 'Comprehensive notes tailored for civil service exams.',
    desc: 'Access structured study materials, topic-wise PDFs, hand-curated question banks, and standard reference materials updated according to the latest exam pattern.',
    checkpoints: [
      'Comprehensive Tamil & English PDF notes',
      'Topic-wise previous year questions',
      'Curated standard textbook summaries',
      'Regular current affairs updates',
      'Downloadable for offline learning'
    ],
    primaryCta: 'GET STUDY MATERIALS',
    primaryCtaLink: '',
    secondaryCta: 'View Sample PDF',
    secondaryCtaLink: '',
    imageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=1200&auto=format&fit=crop',
    calloutNote: 'Curated for Tamil Medium',
    quote: 'The study materials provided by Nermai were concise, exam-focused, and easy to review.',
    author: '— S. Priyadharshini, TNPSC Group I Selected',
    visible: true
  },
  {
    number: '03',
    icon: 'PenTool',
    title: 'Mock Tests',
    subtitle: 'Weekly full-length tests and sectional tests with detailed analysis.',
    tag: 'FEATURE 03',
    caption: 'Simulate the real exam experience before test day.',
    desc: 'Take weekly full-length mock tests and sectional practice tests. Get instant performance analytics, detailed solutions, and rank comparisons.',
    checkpoints: [
      'Weekly full-length exam simulations',
      'Sectional and subject-wise test series',
      'Detailed answer keys & explanations',
      'All-Puducherry & Tamil Nadu rank tracking',
      'Personalized weak-area analysis'
    ],
    primaryCta: 'TAKE MOCK TEST',
    primaryCtaLink: '',
    secondaryCta: 'View Test Schedule',
    secondaryCtaLink: '',
    imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=1200&auto=format&fit=crop',
    calloutNote: 'Real Exam Simulation',
    quote: 'Weekly mock tests helped me eliminate exam fear and manage my time effectively.',
    author: '— R. Vimal, TNPSC Group II Rank 14',
    visible: true
  },
  {
    number: '04',
    icon: 'LineChart',
    title: 'Progress Tracking',
    subtitle: 'Personal performance dashboard to monitor strengths and weaknesses.',
    tag: 'FEATURE 04',
    caption: 'Data-driven insights for smarter preparation.',
    desc: 'Monitor your study hours, score trends, and subject mastery over time with our intuitive student analytics dashboard.',
    checkpoints: [
      'Subject-wise mastery percentages',
      'Time management & speed analytics',
      'Score trend graphs over weeks',
      'Personalized study plan recommendations',
      'Direct feedback from course mentors'
    ],
    primaryCta: 'VIEW DASHBOARD',
    primaryCtaLink: '',
    secondaryCta: 'Learn More',
    secondaryCtaLink: '',
    imageUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=1200&auto=format&fit=crop',
    calloutNote: 'AI-Powered Insights',
    quote: 'Tracking my weekly scores helped me focus exactly where I was losing marks.',
    author: '— A. Soundarya, Sub-Inspector Exam 2024',
    visible: true
  },
  {
    number: '05',
    icon: 'CalendarCheck',
    title: 'Class Schedule',
    subtitle: 'Flexible batch timings for students, working professionals and rural aspirants.',
    tag: 'FEATURE 05',
    caption: 'Study on your timeline without compromising quality.',
    desc: 'Choose from weekday regular batches, weekend batches for working professionals, or evening online sessions designed for maximum flexibility.',
    checkpoints: [
      'Morning & Evening live batch timings',
      'Special weekend batches for professionals',
      '24/7 access to recorded lectures',
      'Flexible batch transfer options',
      'Structured weekly timetable updates'
    ],
    primaryCta: 'VIEW TIMETABLE',
    primaryCtaLink: '',
    secondaryCta: 'Batch Details',
    secondaryCtaLink: '',
    imageUrl: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?q=80&w=1200&auto=format&fit=crop',
    calloutNote: 'Weekday & Weekend Batches',
    quote: 'As a working professional, the flexible weekend schedule made my preparation possible.',
    author: '— K. Venkatesh, VAO Selected',
    visible: true
  },
  {
    number: '06',
    icon: 'UserCircle',
    title: 'Academic Guidance',
    subtitle: 'One-on-one mentoring sessions with IAS/IPS selected alumni faculty.',
    tag: 'FEATURE 06',
    caption: 'Direct 1-on-1 mentorship throughout your journey.',
    desc: 'Get guidance from selected officers, experienced faculty, and subject experts to clear strategy doubts, stay motivated, and refine your approach.',
    checkpoints: [
      '1-on-1 personal mentorship sessions',
      'Strategy planning with selected alumni',
      'Regular progress reviews & feedback',
      'Answer writing evaluation & review',
      'Motivation and stress management support'
    ],
    primaryCta: 'BOOK MENTOR SESSION',
    primaryCtaLink: '',
    secondaryCta: 'Our Faculty',
    secondaryCtaLink: '',
    imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200&auto=format&fit=crop',
    calloutNote: '1-on-1 Officer Guidance',
    quote: 'One-on-one sessions with faculty kept me focused during tough phases of preparation.',
    author: '— P. Divya, TNPSC Group I Mains Aspirant',
    visible: true
  }
]

function FeaturesEditor({ config, details, onChangeConfig, onChangeDetails, toast }) {
  const [activeTab, setActiveTab] = useState(0)

  const cfg = { ...DEFAULT_FEATURES_CONFIG, ...(config || {}) }
  const feats = Array.isArray(details) && details.length > 0 ? details : DEFAULT_FEATURE_DETAILS

  const updateCfg = (key, val) => {
    onChangeConfig({ ...cfg, [key]: val })
  }

  const updateHighlight = (idx, key, val) => {
    const list = [...(cfg.highlights || DEFAULT_FEATURES_CONFIG.highlights)]
    list[idx] = { ...list[idx], [key]: val }
    onChangeConfig({ ...cfg, highlights: list })
  }

  const updateFeat = (i, key, val) => {
    const next = feats.map((f, idx) => idx === i ? { ...f, [key]: val } : f)
    onChangeDetails(next)
  }

  const updateCheckpoint = (featIdx, checkIdx, val) => {
    const next = feats.map((f, idx) => {
      if (idx !== featIdx) return f
      const cps = [...(f.checkpoints || [])]
      cps[checkIdx] = val
      return { ...f, checkpoints: cps }
    })
    onChangeDetails(next)
  }

  const addCheckpoint = (featIdx) => {
    const next = feats.map((f, idx) => {
      if (idx !== featIdx) return f
      return { ...f, checkpoints: [...(f.checkpoints || []), 'New key highlight / benefit'] }
    })
    onChangeDetails(next)
  }

  const removeCheckpoint = (featIdx, checkIdx) => {
    const next = feats.map((f, idx) => {
      if (idx !== featIdx) return f
      return { ...f, checkpoints: (f.checkpoints || []).filter((_, ci) => ci !== checkIdx) }
    })
    onChangeDetails(next)
  }

  const addFeat = () => {
    const newIdx = feats.length + 1
    const newFeat = {
      number: String(newIdx).padStart(2, '0'),
      icon: 'GraduationCap',
      title: `Feature ${newIdx}`,
      subtitle: 'Feature subtitle description',
      tag: `FEATURE ${String(newIdx).padStart(2, '0')}`,
      caption: 'Feature highlight caption tagline',
      desc: 'Detailed description of this platform feature.',
      checkpoints: ['Key point 1', 'Key point 2', 'Key point 3'],
      primaryCta: 'LEARN MORE',
      primaryCtaLink: '',
      secondaryCta: 'View Details',
      secondaryCtaLink: '',
      imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop',
      calloutNote: 'Classroom note',
      quote: 'Student quote praising this feature.',
      author: '— Student Name',
      visible: true
    }
    onChangeDetails([...feats, newFeat])
    setActiveTab(feats.length)
  }

  const removeFeat = (i) => {
    if (feats.length <= 1) return
    const next = feats.filter((_, idx) => idx !== i)
    onChangeDetails(next)
    if (activeTab >= next.length) setActiveTab(next.length - 1)
  }

  const curFeat = feats[activeTab] || feats[0]

  const ICON_OPTIONS = [
    'GraduationCap', 'BookOpen', 'PenTool', 'LineChart', 
    'CalendarCheck', 'UserCircle', 'Tv', 'ShieldCheck', 
    'Globe', 'Star', 'Trophy', 'Users', 'Target', 
    'Lightbulb', 'Zap', 'Rocket', 'CheckCircle', 'FileText', 
    'Monitor', 'Bookmark', 'Award', 'Clock', 'Compass', 'Heart'
  ]

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--gray-400)', marginBottom: '1.25rem' }}>
        Fully customize all words, titles, interactive tabs, bullet points, CTA buttons, images, quotes, and highlights in the "Class Platform / Everything You Need to Succeed" section.
      </p>

      {/* ── 1. Section Header ── */}
      <div className="ap-card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <h4 style={{ color: 'var(--maroon)', fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '1px solid var(--gray-200)', paddingBottom: '0.5rem' }}>
          <i className="fa-solid fa-heading" style={{ marginRight: '6px' }} /> 1. Section Header (Top Titles)
        </h4>
        <div className="ap-form-row">
          <Field
            label="Eyebrow Tag (e.g. NERMAI CLASS PLATFORM)"
            value={cfg.eyebrow}
            onChange={v => updateCfg('eyebrow', v)}
            placeholder="NERMAI CLASS PLATFORM"
          />
          <Field
            label="Main Section Heading (e.g. Everything You Need to Succeed)"
            value={cfg.title}
            onChange={v => updateCfg('title', v)}
            placeholder="Everything You Need to Succeed"
          />
        </div>
        <Field
          label="Subtitle / Description Paragraph"
          value={cfg.subtitle}
          onChange={v => updateCfg('subtitle', v)}
          type="textarea"
          placeholder="A complete learning ecosystem designed for Tamil-medium aspirants..."
        />
      </div>

      {/* ── 2. Interactive Feature Cards (01 to 06) ── */}
      <div className="ap-card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--gray-200)', paddingBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h4 style={{ color: 'var(--maroon)', fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>
            <i className="fa-solid fa-layer-group" style={{ marginRight: '6px' }} /> 2. Interactive Feature Cards (01 to 06)
          </h4>
          <button type="button" onClick={addFeat} className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}>
            <i className="fa-solid fa-plus" style={{ marginRight: '4px' }} /> Add New Feature
          </button>
        </div>

        {/* Feature Sub-Tabs Selector */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          {feats.map((f, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveTab(i)}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                border: activeTab === i ? '2px solid var(--maroon)' : '1px solid var(--gray-300)',
                background: activeTab === i ? 'var(--maroon)' : '#FFFFFF',
                color: activeTab === i ? '#FFFFFF' : 'var(--gray-800)',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>{f.number || String(i + 1).padStart(2, '0')}.</span>
              <span>{f.title || `Feature ${i + 1}`}</span>
              {f.visible === false && <span style={{ opacity: 0.6 }}>(Hidden)</span>}
            </button>
          ))}
        </div>

        {/* Active Feature Edit Card */}
        {curFeat && (
          <div style={{ background: 'var(--gray-50)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--gray-200)' }}>
            
            {/* Top Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--gray-200)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontWeight: 800, color: 'var(--maroon)', fontSize: '0.95rem' }}>
                  Editing Feature {curFeat.number || String(activeTab + 1).padStart(2, '0')}: {curFeat.title}
                </span>
                <Toggle label="Visible" checked={curFeat.visible !== false} onChange={v => updateFeat(activeTab, 'visible', v)} />
              </div>
              {feats.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeFeat(activeTab)}
                  className="btn"
                  style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #f87171', padding: '0.25rem 0.75rem', fontSize: '0.75rem', borderRadius: '4px' }}
                >
                  <i className="fa-solid fa-trash" style={{ marginRight: '6px' }} /> Delete Feature
                </button>
              )}
            </div>

            {/* Basic Info */}
            <div className="ap-form-row">
              <Field label="Feature Number (e.g. 01)" value={curFeat.number} onChange={v => updateFeat(activeTab, 'number', v)} placeholder="01" />
              <Field label="Icon" type="select" value={curFeat.icon} onChange={v => updateFeat(activeTab, 'icon', v)} options={ICON_OPTIONS} />
              <Field label="Tag Badge (e.g. FEATURE 01)" value={curFeat.tag} onChange={v => updateFeat(activeTab, 'tag', v)} placeholder="FEATURE 01" />
            </div>

            <div className="ap-form-row">
              <Field label="Title (e.g. Structured Classes)" value={curFeat.title} onChange={v => updateFeat(activeTab, 'title', v)} placeholder="Structured Classes" />
              <Field label="Left Tab Subtitle / Short Summary" value={curFeat.subtitle} onChange={v => updateFeat(activeTab, 'subtitle', v)} placeholder="Daily scheduled classes with expert faculty..." />
            </div>

            <Field label="Middle Caption / Tagline" value={curFeat.caption} onChange={v => updateFeat(activeTab, 'caption', v)} placeholder="Learn from the best, at your own pace." />
            
            <Field label="Full Detailed Description Paragraph" value={curFeat.desc} onChange={v => updateFeat(activeTab, 'desc', v)} type="textarea" placeholder="Daily scheduled classes covering the complete syllabus..." />

            {/* Checkpoints / Bullet Points */}
            <div style={{ marginTop: '1rem', marginBottom: '1.25rem', background: '#FFFFFF', padding: '1rem', borderRadius: '8px', border: '1px solid var(--gray-200)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <label style={{ fontWeight: 700, fontSize: '0.82rem', margin: 0 }}>
                  <i className="fa-solid fa-circle-check" style={{ color: 'var(--maroon)', marginRight: '6px' }} /> Checkpoints / Key Highlights Bullet List
                </label>
                <button type="button" onClick={() => addCheckpoint(activeTab)} className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}>
                  + Add Point
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {(curFeat.checkpoints || []).map((cp, ci) => (
                  <div key={ci} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="text"
                      className="ap-input"
                      value={cp}
                      onChange={e => updateCheckpoint(activeTab, ci, e.target.value)}
                      placeholder={`Key highlight ${ci + 1}...`}
                      style={{ fontSize: '0.85rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => removeCheckpoint(activeTab, ci)}
                      className="btn"
                      style={{ background: '#fee2e2', color: '#dc2626', padding: '0.45rem 0.65rem', border: 'none', borderRadius: '6px' }}
                      title="Delete point"
                    >
                      <i className="fa-solid fa-trash" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Buttons / CTA */}
            <div className="ap-form-row">
              <Field label="Primary Button Text" value={curFeat.primaryCta} onChange={v => updateFeat(activeTab, 'primaryCta', v)} placeholder="EXPLORE CLASSES" />
              <Field label="Primary Button Link URL (Optional)" value={curFeat.primaryCtaLink} onChange={v => updateFeat(activeTab, 'primaryCtaLink', v)} placeholder="Leave blank for LMS link" />
            </div>

            <div className="ap-form-row">
              <Field label="Secondary Button Text (Optional)" value={curFeat.secondaryCta} onChange={v => updateFeat(activeTab, 'secondaryCta', v)} placeholder="View Sample Class" />
              <Field label="Secondary Button Link URL (Optional)" value={curFeat.secondaryCtaLink} onChange={v => updateFeat(activeTab, 'secondaryCtaLink', v)} placeholder="Leave blank for LMS link" />
            </div>

            {/* Image, Floating Badge & Testimonial Quote */}
            <div style={{ marginTop: '1rem', background: '#FFFFFF', padding: '1rem', borderRadius: '8px', border: '1px solid var(--gray-200)' }}>
              <label style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: '0.5rem', display: 'block' }}>
                Right-Side Mockup Image & Floating Badges
              </label>
              
              <AdminImageUpload
                value={curFeat.imageUrl || ''}
                onChange={url => updateFeat(activeTab, 'imageUrl', url)}
                label="Feature Mockup / Card Image"
                subFolderName="nermai-features"
                previewHeight={140}
                toast={toast}
              />

              <div style={{ marginTop: '1rem' }}>
                <Field label="Top-Right Floating Note" value={curFeat.calloutNote} onChange={v => updateFeat(activeTab, 'calloutNote', v)} placeholder="e.g. Your classroom anywhere, anytime" />
              </div>

              <div className="ap-form-row">
                <Field label="Bottom Testimonial Quote Text" value={curFeat.quote} onChange={v => updateFeat(activeTab, 'quote', v)} placeholder="Well-structured classes made it easy..." />
                <Field label="Testimonial Author" value={curFeat.author} onChange={v => updateFeat(activeTab, 'author', v)} placeholder="— M. Karthik, TNPSC Group II" />
              </div>
            </div>

          </div>
        )}
      </div>

      {/* ── 3. Bottom 4 Highlights Bar ── */}
      <div className="ap-card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <h4 style={{ color: 'var(--maroon)', fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '1px solid var(--gray-200)', paddingBottom: '0.5rem' }}>
          <i className="fa-solid fa-bolt" style={{ marginRight: '6px' }} /> 3. Bottom 4 Feature Highlights Bar
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {(cfg.highlights || DEFAULT_FEATURES_CONFIG.highlights).map((hl, hi) => (
            <div key={hi} style={{ background: 'var(--gray-50)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--gray-200)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--maroon)', marginBottom: '0.5rem' }}>
                Highlight #{hi + 1}
              </div>
              <Field label="Icon" type="select" value={hl.icon} onChange={v => updateHighlight(hi, 'icon', v)} options={ICON_OPTIONS} />
              <Field label="Title" value={hl.title} onChange={v => updateHighlight(hi, 'title', v)} placeholder="Live + Recorded" />
              <Field label="Subtitle / Tag" value={hl.sub} onChange={v => updateHighlight(hi, 'sub', v)} placeholder="FLEXIBLE LEARNING" />
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

/* ── Course Categories Editor ────────────────────────────────────────────── */
function CourseCategoriesEditor({ categories = [], onChange }) {
  const update = (i, key, val) => onChange(categories.map((c, idx) => idx === i ? { ...c, [key]: val } : c))
  const add = () => onChange([...categories, { id: 'cat-' + Date.now(), name: '', shortName: '', iconUrl: '', isVisible: true }])
  const remove = (i) => onChange(categories.filter((_, idx) => idx !== i))

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--gray-400)', marginBottom: '1.25rem' }}>
        Manage the category filter tabs (e.g., UPSC, TNPSC) shown above the courses.
      </p>
      {categories.map((cat, i) => (
        <div key={cat.id || i} className="ap-card" style={{ marginBottom: '1rem', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-primary, var(--maroon))' }}>
                Category {i + 1}
              </div>
              <Toggle label="Visible" checked={cat.isVisible !== false} onChange={v => update(i, 'isVisible', v)} />
            </div>
            {categories.length > 1 && (
              <button onClick={() => remove(i)} className="btn" style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #f87171', padding: '0.25rem 0.75rem', fontSize: '0.75rem', borderRadius: '4px' }}>
                <i className="fa-solid fa-trash" style={{ marginRight: '6px' }} /> Delete
              </button>
            )}
          </div>
          <div className="ap-form-row">
            <Field label="Full Name" value={cat.name} onChange={v => update(i, 'name', v)} placeholder="e.g. UPSC & Civil Services" />
            <Field label="Short Name (Filter Label)" value={cat.shortName} onChange={v => update(i, 'shortName', v)} placeholder="e.g. UPSC" />
          </div>
          <div style={{ width: '100%', maxWidth: '300px', marginTop: '0.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.8rem', color: 'var(--gray-700)' }}>
              Category Icon (Circle)
            </label>
            <AdminImageUpload
              value={cat.iconUrl}
              onChange={(url) => update(i, 'iconUrl', url)}
              subFolderName="categories"
              hint="Recommended: 120x120px (1:1 Ratio)"
              aspectRatio="1/1"
              previewHeight={80}
            />
          </div>
        </div>
      ))}
      <button onClick={add} className="btn" style={{ marginTop: '0.5rem', width: '100%', justifyContent: 'center', background: 'var(--gray-100)', color: 'var(--gray-700)', border: '1px dashed var(--gray-300)' }}>
        <i className="fa-solid fa-plus" style={{ marginRight: '8px' }} /> Add Category
      </button>
    </div>
  )
}

/* ── Courses Editor ──────────────────────────────────────────────────────── */
function CoursesEditor({ courses = [], config = {}, categories = [], onChangeCourses, onChangeConfig, onChangeCategories }) {
  const update = (i, key, val) => onChangeCourses(courses.map((c, idx) => idx === i ? { ...c, [key]: val } : c))
  const add = () => onChangeCourses([...courses, { id: 'course-' + Date.now(), title: '', categoryId: 'all', coverImageUrl: '', logoUrl: '', badges: [], shortDescription: '', features: [], price: '', priceLabel: 'Course Price', isActive: true }])
  const remove = (i) => onChangeCourses(courses.filter((_, idx) => idx !== i))
  const [showCats, setShowCats] = React.useState(false)

  const updateConfig = (key, val) => onChangeConfig({ ...config, [key]: val })
  const updateCat = (i, key, val) => onChangeCategories(categories.map((c, idx) => idx === i ? { ...c, [key]: val } : c))
  const addCat = () => onChangeCategories([...categories, { id: 'cat-' + Date.now(), name: '', shortName: '', iconUrl: '', isVisible: true }])
  const removeCat = (i) => onChangeCategories(categories.filter((_, idx) => idx !== i))

  const updateFeature = (courseIdx, featIdx, key, val) => {
    const nextFeatures = [...(courses[courseIdx].features || [])]
    nextFeatures[featIdx] = { ...nextFeatures[featIdx], [key]: val }
    update(courseIdx, 'features', nextFeatures)
  }
  const addFeature = (courseIdx) => {
    const nextFeatures = [...(courses[courseIdx].features || []), { text: '', icon: 'CheckCircle' }]
    update(courseIdx, 'features', nextFeatures)
  }
  const removeFeature = (courseIdx, featIdx) => {
    const nextFeatures = (courses[courseIdx].features || []).filter((_, idx) => idx !== featIdx)
    update(courseIdx, 'features', nextFeatures)
  }

  const handleCustomCategoryChange = (courseIdx, val) => {
    const nextCourses = courses.map((c, idx) => {
      if (idx === courseIdx) {
        return { ...c, customCategoryName: val }
      }
      return c
    })
    onChangeCourses(nextCourses)
  }

  const handleSaveCustomCategory = (courseIdx, rawCatName) => {
    const catName = (rawCatName || '').trim()
    if (!catName) return

    // Generate clean slug ID e.g. "puducherry-govt"
    const slug = catName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || ('cat-' + Date.now())

    // Check if category already exists in categories list
    const existing = categories.find(c => 
      c.id.toLowerCase() === slug || 
      (c.name && c.name.toLowerCase() === catName.toLowerCase()) ||
      (c.shortName && c.shortName.toLowerCase() === catName.toLowerCase())
    )

    const finalCatId = existing ? existing.id : slug

    // If new category, add to categories list for future addition
    if (!existing) {
      const newCat = {
        id: slug,
        name: catName,
        shortName: catName,
        iconUrl: '',
        isVisible: true
      }
      onChangeCategories([...categories, newCat])
    }

    // Update current course categoryId to this category
    const nextCourses = courses.map((c, idx) => {
      if (idx === courseIdx) {
        return {
          ...c,
          categoryId: finalCatId,
          customCategoryName: catName
        }
      }
      return c
    })
    onChangeCourses(nextCourses)
  }

  const updateSideScript = (key, val) => {
    const prevSide = config?.sideScripts || {
      leftLine1: 'Learn',
      leftLine2: 'Prepare',
      leftLine3: 'Succeed',
      rightLine1: 'Different Aspirations',
      rightLine2: 'One Destination',
      showLeft: true,
      showRight: true,
    }
    onChangeConfig({
      ...config,
      sideScripts: {
        ...prevSide,
        [key]: val
      }
    })
  }

  return (
    <div>
      <div className="ap-card" style={{ marginBottom: '2rem', padding: '1.5rem', background: '#FFFDF9', border: '1.5px solid #F3E8DF', borderRadius: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem', borderBottom: '1px solid #EAD8C7', paddingBottom: '0.75rem' }}>
          <i className="fa-solid fa-pen-nib" style={{ color: '#C85A17', fontSize: '1.1rem' }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#7B1B2E' }}>
              Courses Section Titles &amp; Side Cursive Writing
            </div>
            <div style={{ fontSize: '0.8rem', color: '#8C7E74' }}>
              Customize the section title, subtitle, and the left/right decorative cursive handwriting shown on the homepage.
            </div>
          </div>
        </div>

        {/* Section Header Text Fields */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#2C221E', marginBottom: '0.75rem' }}>
            1. Main Section Titles
          </div>
          <div className="ap-form-row">
            <Field label="Top Tag Line (e.g. OUR COURSES)" value={config.tagText ?? 'OUR COURSES'} onChange={v => updateConfig('tagText', v)} placeholder="OUR COURSES" />
            <Field label="Main Heading" value={config.sectionHeading ?? 'Choose Your Path to a Brighter Future'} onChange={v => updateConfig('sectionHeading', v)} placeholder="Choose Your Path to a Brighter Future" />
          </div>
          <Field label="Sub Heading / Description" value={config.subHeading ?? 'Structured courses, expert guidance and proven results for every aspirant.'} onChange={v => updateConfig('subHeading', v)} placeholder="Structured courses, expert guidance and proven results for every aspirant." />
        </div>

        {/* Side Cursive Writing Editor */}
        <div style={{ borderTop: '1px dashed #E5D5C5', paddingTop: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem', background: '#F8F4EE', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #EAE0D3' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#2C221E' }}>
                2. Decorative Side Cursive Writing (Left &amp; Right)
              </div>
              <div style={{ fontSize: '0.78rem', color: '#736B63' }}>
                Master toggle to show or hide all floating side handwriting on the homepage.
              </div>
            </div>
            <Toggle 
              label="Enable Side Cursive Text" 
              checked={config.sideScripts?.visible !== false} 
              onChange={v => updateSideScript('visible', v)} 
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '1.25rem', opacity: config.sideScripts?.visible !== false ? 1 : 0.5, pointerEvents: config.sideScripts?.visible !== false ? 'auto' : 'none' }}>
            {/* Left Cursive Accent Box */}
            <div style={{ background: '#FFF8F2', padding: '1.1rem', borderRadius: '8px', border: '1px solid #F0D5C0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid #F5DECE', paddingBottom: '0.5rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#9C4B13' }}>
                  ✍️ Left Cursive Script (3 Lines)
                </span>
                <Toggle 
                  label="Visible" 
                  checked={config.sideScripts?.showLeft !== false} 
                  onChange={v => updateSideScript('showLeft', v)} 
                />
              </div>
              <Field label="Line 1" value={config.sideScripts?.leftLine1 ?? 'Learn'} onChange={v => updateSideScript('leftLine1', v)} placeholder="Learn" />
              <Field label="Line 2" value={config.sideScripts?.leftLine2 ?? 'Prepare'} onChange={v => updateSideScript('leftLine2', v)} placeholder="Prepare" />
              <Field label="Line 3 (Highlighted)" value={config.sideScripts?.leftLine3 ?? 'Succeed'} onChange={v => updateSideScript('leftLine3', v)} placeholder="Succeed" />
              
              <div style={{ marginTop: '0.75rem', padding: '0.6rem', background: '#ffffff', borderRadius: '6px', border: '1px dashed #E0C0A8', fontFamily: 'Georgia, serif', fontStyle: 'italic', color: '#9C4B13', fontSize: '0.88rem', textAlign: 'center' }}>
                Preview: {config.sideScripts?.leftLine1 ?? 'Learn'} &bull; {config.sideScripts?.leftLine2 ?? 'Prepare'} &bull; <strong>{config.sideScripts?.leftLine3 ?? 'Succeed'}</strong>
              </div>
            </div>

            {/* Right Cursive Accent Box */}
            <div style={{ background: '#FDF2F4', padding: '1.1rem', borderRadius: '8px', border: '1px solid #F3CFD7' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid #F8D8DF', paddingBottom: '0.5rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#8A263B' }}>
                  ✍️ Right Cursive Script (Tilted)
                </span>
                <Toggle 
                  label="Visible" 
                  checked={config.sideScripts?.showRight !== false} 
                  onChange={v => updateSideScript('showRight', v)} 
                />
              </div>
              <Field label="Top Line" value={config.sideScripts?.rightLine1 ?? 'Different Aspirations'} onChange={v => updateSideScript('rightLine1', v)} placeholder="Different Aspirations" />
              <Field label="Bottom Line (Underlined)" value={config.sideScripts?.rightLine2 ?? 'One Destination'} onChange={v => updateSideScript('rightLine2', v)} placeholder="One Destination" />
              
              <div style={{ marginTop: '0.75rem', padding: '0.6rem', background: '#ffffff', borderRadius: '6px', border: '1px dashed #E5B2BD', fontFamily: 'Georgia, serif', fontStyle: 'italic', color: '#8A263B', fontSize: '0.88rem', textAlign: 'center' }}>
                Preview: {config.sideScripts?.rightLine1 ?? 'Different Aspirations'} / <span style={{ borderBottom: '2px solid #8A263B' }}>{config.sideScripts?.rightLine2 ?? 'One Destination'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p style={{ fontSize: '0.82rem', color: 'var(--gray-400)', marginBottom: '1.25rem' }}>
        Manage the individual course cards. Assign them to categories to make the filtering work.
      </p>
      {courses.map((course, i) => {
        const isCustomCat = course.categoryId === 'others' || (Boolean(course.categoryId) && course.categoryId !== 'all' && !categories.some(c => c.id === course.categoryId))
        const activeCustomVal = course.customCategoryName || (isCustomCat && course.categoryId !== 'others' ? course.categoryId : '')

        return (
          <div key={course.id || i} className="ap-card" style={{ marginBottom: '1.5rem', padding: '1.5rem', borderLeft: '4px solid var(--color-primary, var(--maroon))' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--gray-200)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-primary, var(--maroon))' }}>
                  Course: {course.title || `Item ${i + 1}`}
                </div>
                <Toggle label="Active" checked={course.isActive !== false} onChange={v => update(i, 'isActive', v)} />
              </div>
              <button onClick={() => remove(i)} className="btn" style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #f87171', padding: '0.25rem 0.75rem', fontSize: '0.75rem', borderRadius: '4px' }}>
                <i className="fa-solid fa-trash" style={{ marginRight: '6px' }} /> Delete Course
              </button>
            </div>

            <div className="ap-form-row">
              <Field label="Course Title" value={course.title} onChange={v => update(i, 'title', v)} placeholder="e.g. UPSC Offline Course" />
              <Field 
                label="Category" 
                type="select" 
                value={course.categoryId || 'all'} 
                onChange={v => {
                  update(i, 'categoryId', v)
                }} 
                options={[ 
                  { value: 'all', label: 'All Courses (Default)' }, 
                  ...categories
                    .filter(c => c.id !== 'all' && c.id !== 'others')
                    .map(c => ({ value: c.id, label: c.name || c.shortName || c.id })),
                  ...(isCustomCat && course.categoryId !== 'others'
                    ? [{ value: course.categoryId, label: `${course.customCategoryName || course.categoryId} (Custom)` }]
                    : []),
                  { value: 'others', label: 'Other Courses / + Specify New Category...' }
                ]} 
              />
            </div>

            {/* Manual Category Specification Block (shown when 'others' is selected or custom category is active) */}
            {isCustomCat && (
              <div style={{
                marginTop: '0.85rem',
                padding: '0.95rem 1.15rem',
                background: '#fffdf7',
                border: '1.5px dashed #f59e0b',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(245, 158, 11, 0.08)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <label style={{ fontWeight: 700, fontSize: '0.82rem', color: '#92400e', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="fa-solid fa-tag" style={{ color: '#d97706' }} /> Specify Category Name (Manually):
                  </label>
                  <span style={{ fontSize: '0.72rem', color: '#b45309', background: '#fef3c7', padding: '2px 8px', borderRadius: '4px', fontWeight: 600, border: '1px solid #fde68a' }}>
                    <i className="fa-solid fa-sparkles" style={{ marginRight: '4px' }} /> Will be added for future addition
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.55rem', alignItems: 'center' }}>
                  <input
                    type="text"
                    className="ap-input"
                    style={{
                      flex: 1,
                      background: '#ffffff',
                      border: '1.5px solid #fcd34d',
                      padding: '0.55rem 0.85rem',
                      fontSize: '0.88rem'
                    }}
                    value={activeCustomVal}
                    placeholder="e.g. Puducherry Govt, Police SI/PC, Railways, TN Forest..."
                    onChange={e => handleCustomCategoryChange(i, e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleSaveCustomCategory(i, e.target.value)
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveCustomCategory(i, activeCustomVal)}
                    disabled={!activeCustomVal.trim()}
                    style={{
                      padding: '0.55rem 1.15rem',
                      background: activeCustomVal.trim()
                        ? 'var(--color-primary, var(--maroon))'
                        : '#cbd5e1',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: activeCustomVal.trim() ? 'pointer' : 'not-allowed',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                    }}
                  >
                    <i className="fa-solid fa-plus-circle" /> Add Category to List
                  </button>
                </div>
                <p style={{ margin: '0.45rem 0 0 0', fontSize: '0.75rem', color: '#78350f', lineHeight: 1.4 }}>
                  Specify the category name and click <strong>Add Category to List</strong> (or save changes). It will be saved into the Category list so you can easily select it for future courses.
                </p>
              </div>
            )}

          <div className="ap-form-row" style={{ marginTop: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.8rem', color: 'var(--gray-700)' }}>
                Cover Image (Top Banner)
              </label>
              <AdminImageUpload value={course.coverImageUrl} onChange={(url) => update(i, 'coverImageUrl', url)} subFolderName="courses" hint="16:9 Ratio (e.g. 800x450px)" aspectRatio="16/9" previewHeight={120} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.8rem', color: 'var(--gray-700)' }}>
                Inset Logo (Optional Circle)
              </label>
              <AdminImageUpload value={course.logoUrl} onChange={(url) => update(i, 'logoUrl', url)} subFolderName="courses" hint="1:1 Ratio (e.g. 150x150px)" aspectRatio="1/1" previewHeight={120} />
            </div>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <Field
              label="Badges (comma-separated, e.g. UPSC, OFFLINE, TAMIL)"
              value={(course.badges || []).join(', ')}
              onChange={v => update(i, 'badges', v.split(',').map(t => t.trim()).filter(Boolean))}
            />
            <Field label="Short Description (160-220 chars)" value={course.shortDescription} onChange={v => update(i, 'shortDescription', v)} type="textarea" placeholder="Comprehensive preparation..." />
          </div>

          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--gray-50)', borderRadius: '8px', border: '1px solid var(--gray-200)' }}>
            <div style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '0.85rem' }}>Features List (Max 5 recommended)</div>
            {(course.features || []).map((feat, fIdx) => (
              <div key={fIdx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'flex-start' }}>
                <div style={{ width: '140px' }}>
                  <select className="ap-input" value={feat.icon || 'CheckCircle'} onChange={e => updateFeature(i, fIdx, 'icon', e.target.value)}>
                    <option value="CheckCircle">Check (Default)</option>
                    <option value="BookOpen">Book</option>
                    <option value="FileText">Document</option>
                    <option value="UserCircle">Mentor</option>
                    <option value="Zap">Zap/Speed</option>
                    <option value="Bookmark">Bookmark</option>
                    <option value="Monitor">Monitor</option>
                    <option value="GraduationCap">Graduation</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <input className="ap-input" value={feat.text} onChange={e => updateFeature(i, fIdx, 'text', e.target.value)} placeholder="Feature text..." />
                </div>
                <button onClick={() => removeFeature(i, fIdx)} className="btn" style={{ padding: '0.5rem', color: '#dc2626', background: 'none' }} title="Remove Feature">
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>
            ))}
            <button onClick={() => addFeature(i)} className="btn" style={{ marginTop: '0.5rem', fontSize: '0.8rem', padding: '0.4rem 0.75rem', background: 'var(--white)', border: '1px solid var(--gray-300)' }}>
              <i className="fa-solid fa-plus" style={{ marginRight: '6px' }} /> Add Feature
            </button>
          </div>

          <div className="ap-form-row" style={{ marginTop: '1.5rem' }}>
            <Field label="Price (e.g. ₹ 25,000)" value={course.price} onChange={v => update(i, 'price', v)} placeholder="₹ 25,000" />
            <Field label="Price Label" value={course.priceLabel} onChange={v => update(i, 'priceLabel', v)} placeholder="Course Price" />
          </div>
        </div>
      )
    })}
      <button onClick={add} className="btn" style={{ marginTop: '0.5rem', width: '100%', justifyContent: 'center', background: 'var(--gray-100)', color: 'var(--gray-700)', border: '1px dashed var(--gray-300)', padding: '1rem' }}>
        <i className="fa-solid fa-plus" style={{ marginRight: '8px' }} /> Add Course
      </button>
    </div>
  )
}

/* ── About Editor ────────────────────────────────────────────────────────── */
function AboutEditor({ about = {}, stats = [], onChange }) {
  const update = (key, val) => onChange({ ...about, [key]: val })
  
  const badges = (about.badges && Array.isArray(about.badges) && about.badges.length > 0)
    ? about.badges
    : [
        { num: '187+', label: 'Results' },
        { num: '14+', label: 'Years' },
        { num: '2400+', label: 'Students' }
      ]

  const isSync = about.syncWithStats === true

  const updateBadge = (i, key, val) => {
    const next = badges.map((b, idx) => idx === i ? { ...b, [key]: val } : b)
    onChange({ ...about, badges: next })
  }

  const addBadge = () => {
    onChange({ ...about, badges: [...badges, { num: '', label: '' }] })
  }

  const removeBadge = (i) => {
    onChange({ ...about, badges: badges.filter((_, idx) => idx !== i) })
  }

  const handleCopyFromStats = () => {
    if (stats && stats.length > 0) {
      const visibleStats = stats.filter(s => s.visible !== false)
      const copied = (visibleStats.length > 0 ? visibleStats : stats).slice(0, 3).map(s => ({
        num: s.num || '',
        label: s.label || ''
      }))
      onChange({ ...about, badges: copied, syncWithStats: false })
    }
  }

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--gray-400)', marginBottom: '1.25rem' }}>
        Edit the About / Introduction section on the homepage with image, text, and small gold stat badges.
      </p>

      {/* 1. Text Content */}
      <div className="ap-card" style={{ marginBottom: '1rem', padding: '1.25rem' }}>
        <div style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.9rem', color: '#7B1B2E' }}>📝 Text Content</div>
        <div className="ap-form-row">
          <Field label="Eyebrow Label" value={about.eyebrow || ''} onChange={v => update('eyebrow', v)} placeholder="About Nermai" />
          <Field label="Section Title" value={about.title || ''} onChange={v => update('title', v)} placeholder="Introduction to Nermai IAS" />
        </div>
        <Field label="Paragraph 1" value={about.para1 || ''} onChange={v => update('para1', v)} type="textarea" />
        <Field label="Paragraph 2" value={about.para2 || ''} onChange={v => update('para2', v)} type="textarea" />
      </div>

      {/* 2. Image */}
      <div className="ap-card" style={{ marginBottom: '1rem', padding: '1.25rem' }}>
        <div style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.9rem', color: '#7B1B2E' }}>🖼️ Image &amp; Overlay Label</div>
        <Field label="Image URL" value={about.imageUrl || ''} onChange={v => update('imageUrl', v)} placeholder="https://..." />
        <Field label="Image Label (shown as overlay banner)" value={about.imageLabel || ''} onChange={v => update('imageLabel', v)} placeholder="187+ RESULTS · 2022–25" />
        {about.imageUrl && (
          <img src={about.imageUrl} alt="preview" style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', marginTop: '0.75rem', borderRadius: '6px', border: '1px solid var(--gray-200)' }} onError={e => e.target.style.display='none'} />
        )}
      </div>

      {/* 3. Small Gold Stat Badges */}
      <div className="ap-card" style={{ padding: '1.25rem', background: '#FFFDF9', border: '1.5px solid #F3E8DF', borderRadius: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem', borderBottom: '1px solid #EAD8C7', paddingBottom: '0.75rem' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#B35900' }}>
              🏅 Small Gold Stat Badges (Count / Numbers)
            </div>
            <div style={{ fontSize: '0.8rem', color: '#8C7E74' }}>
              Displayed as 3 white cards with gold numbers below Upcoming Events on the homepage.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <Toggle 
              label="👁️ Show Badges on Homepage" 
              checked={about.showBadges !== false} 
              onChange={v => update('showBadges', v)} 
            />
            <Toggle 
              label="⚡ Auto-Sync with Main Stats Bar" 
              checked={isSync} 
              onChange={v => update('syncWithStats', v)} 
            />
          </div>
        </div>

        {about.showBadges === false && (
          <div style={{ background: '#FEF2F2', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #FCA5A5', color: '#991B1B', fontSize: '0.82rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <i className="fa-solid fa-eye-slash" /> Small gold stat badges are currently <strong>HIDDEN</strong> on the homepage. Turn on "Show Badges on Homepage" above to display them.
          </div>
        )}

        <div style={{ opacity: about.showBadges !== false ? 1 : 0.5, pointerEvents: about.showBadges !== false ? 'auto' : 'none' }}>
        {isSync ? (
          <div style={{ background: '#FFF8F2', padding: '1rem', borderRadius: '8px', border: '1px solid #F0D5C0', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#9C4B13', fontWeight: 700, fontSize: '0.88rem', marginBottom: '0.5rem' }}>
              <i className="fa-solid fa-arrows-rotate" /> Synchronized Mode Active
            </div>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#736B63', lineHeight: 1.5 }}>
              These 3 gold badge counts are automatically synchronizing with the top <strong>Stats Banner</strong> values (e.g. {stats.slice(0, 3).map(s => s.num).filter(Boolean).join(', ') || '5000+, 15+, 28+'}). Any update made in the <strong>Stats Banner</strong> tab will instantly reflect here.
            </p>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.82rem', color: '#736B63', fontWeight: 600 }}>Custom Gold Badges Mode:</span>
              <button 
                type="button" 
                onClick={handleCopyFromStats}
                className="btn"
                style={{ background: '#FFF0E5', color: '#C85A17', border: '1px solid #F0D5C0', fontSize: '0.78rem', padding: '0.35rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 700 }}
              >
                <i className="fa-solid fa-copy" style={{ marginRight: '6px' }} /> Copy values from Stats Bar
              </button>
            </div>

            {badges.map((badge, i) => (
              <div key={i} className="ap-card" style={{ marginBottom: '0.75rem', padding: '0.85rem 1rem', background: '#FFFFFF', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <strong style={{ fontSize: '0.8rem', color: '#B35900', textTransform: 'uppercase' }}>Gold Badge {i + 1}</strong>
                  {badges.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => removeBadge(i)}
                      style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #f87171', padding: '0.2rem 0.5rem', fontSize: '0.72rem', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      <i className="fa-solid fa-trash" /> Delete
                    </button>
                  )}
                </div>
                <div className="ap-form-row">
                  <Field label="Stat Number / Value" value={badge.num} onChange={v => updateBadge(i, 'num', v)} placeholder="187+" />
                  <Field label="Stat Label" value={badge.label} onChange={v => updateBadge(i, 'label', v)} placeholder="RESULTS" />
                </div>
              </div>
            ))}

            <button 
              type="button" 
              onClick={addBadge}
              className="btn" 
              style={{ marginTop: '0.5rem', width: '100%', justifyContent: 'center', background: '#F8F4EE', color: '#7B1B2E', border: '1px dashed #D5C0A8', padding: '0.6rem', fontWeight: 700, fontSize: '0.85rem' }}
            >
              <i className="fa-solid fa-plus" style={{ marginRight: '8px' }} /> Add Another Badge
            </button>
          </div>
        )}
        </div>

        {/* Live Visual Preview of Badges */}
        <div style={{ marginTop: '1.25rem', borderTop: '1px dashed #E5D5C5', paddingTop: '1rem' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#736B63', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            Live Badge Preview on Homepage
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {(isSync && stats.length > 0 ? stats.slice(0, 3) : badges).map((b, idx) => (
              <div key={idx} style={{ flex: 1, minWidth: '100px', textAlign: 'center', padding: '0.85rem 0.5rem', background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <span style={{ display: 'block', fontSize: '1.4rem', fontWeight: 800, color: '#E65C00', lineHeight: 1.1 }}>{b.num || '0'}</span>
                <span style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B7280', marginTop: '0.25rem' }}>{b.label || 'LABEL'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Events Editor ───────────────────────────────────────────────────────── */
function EventsEditor({ events = [], onChange }) {
  const update = (i, key, val) => onChange(events.map((e, idx) => idx === i ? { ...e, [key]: val } : e))
  const add = () => onChange([...events, { date: new Date().toISOString().split('T')[0], title: '', subtitle: '', url: '', visible: true }])
  const remove = (i) => onChange(events.filter((_, idx) => idx !== i))

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--gray-400)', marginBottom: '1.25rem' }}>
        Edit the Upcoming Events calendar displayed on the homepage.
      </p>
      {events.map((ev, i) => (
        <div key={i} className="ap-card" style={{ marginBottom: '0.75rem', padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--maroon)' }}>
                Event {i + 1}
              </div>
              <Toggle label="Visible" checked={ev.visible !== false} onChange={v => update(i, 'visible', v)} />
            </div>
            <button onClick={() => remove(i)} className="btn" style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #f87171', padding: '0.25rem 0.75rem', fontSize: '0.75rem', borderRadius: '4px' }}>
              <i className="fa-solid fa-trash" style={{ marginRight: '6px' }} /> Delete
            </button>
          </div>
          <div className="ap-form-row">
            <Field label="Event Date" type="date" value={ev.date} onChange={v => update(i, 'date', v)} />
          </div>
          <Field label="Title" value={ev.title} onChange={v => update(i, 'title', v)} placeholder="Short NIQ" />
          <Field label="URL (Optional, turns title into a link)" value={ev.url} onChange={v => update(i, 'url', v)} placeholder="https://..." />
          <Field label="Subtitle / Description" value={ev.subtitle} onChange={v => update(i, 'subtitle', v)} type="textarea" placeholder="for construction of Selfie Point - Last date" />
        </div>
      ))}
      <button onClick={add} className="btn" style={{ marginTop: '0.5rem', width: '100%', justifyContent: 'center', background: 'var(--gray-100)', color: 'var(--gray-700)', border: '1px dashed var(--gray-300)' }}>
        <i className="fa-solid fa-plus" style={{ marginRight: '8px' }} /> Add Event
      </button>
    </div>
  )
}

/* ── Journey Steps Editor ────────────────────────────────────────────────── */
function JourneyStepsEditor({ steps = [], onChange }) {
  const update = (i, key, val) => onChange(steps.map((s, idx) => idx === i ? { ...s, [key]: val } : s))
  const add = () => onChange([...steps, { id: Date.now(), title: '', description: '', imageUrl: '' }])
  const remove = (i) => onChange(steps.filter((_, idx) => idx !== i))

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--gray-400)', marginBottom: '1.25rem' }}>
        Edit the "Your Journey with Nermai" flow diagram steps. You can upload an image for each step which will be shown on hover.
      </p>
      {steps.map((step, i) => (
        <div key={step.id || i} className="ap-card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--gray-200)' }}>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--maroon)' }}>
              Flow Step {i + 1}
            </div>
            {steps.length > 1 && (
              <button onClick={() => remove(i)} className="btn" style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #f87171', padding: '0.25rem 0.75rem', fontSize: '0.75rem', borderRadius: '4px' }}>
                <i className="fa-solid fa-trash" style={{ marginRight: '6px' }} /> Delete
              </button>
            )}
          </div>
          <div className="ap-form-row">
            <div style={{ flex: 1 }}>
              <Field label="Title" value={step.title} onChange={v => update(i, 'title', v)} placeholder="e.g. Choose Your Goal" />
              <Field label="Description" value={step.description} onChange={v => update(i, 'description', v)} type="textarea" placeholder="e.g. Choose from TNPSC, UPSC..." />
            </div>
            <div style={{ width: '320px', flexShrink: 0 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.8rem', color: 'var(--gray-700)' }}>
                Step Image (Hover Reveal)
              </label>
              <AdminImageUpload
                value={step.imageUrl || ''}
                onChange={(url) => update(i, 'imageUrl', url)}
                subFolderName="journey_steps"
                hint="Recommended: 800x600px (Desktop/Mobile). 4:3 Ratio."
                aspectRatio="4/3"
                previewHeight={180}
              />
            </div>
          </div>
        </div>
      ))}
      {steps.length < 5 && (
        <button onClick={add} className="btn" style={{ marginTop: '0.5rem', width: '100%', justifyContent: 'center', background: 'var(--gray-100)', color: 'var(--gray-700)', border: '1px dashed var(--gray-300)' }}>
          <i className="fa-solid fa-plus" style={{ marginRight: '8px' }} /> Add Step
        </button>
      )}
    </div>
  )
}

/* ── Ticker Editor ───────────────────────────────────────────────────────── */
function TickerEditor({ ticker = { visible: true, items: [] }, onChange }) {
  const updateItems = (newItems) => onChange({ ...ticker, items: newItems })
  const updateVis = (v) => onChange({ ...ticker, visible: v })
  
  const updateItem = (i, key, val) => {
    const next = ticker.items.map((it, idx) => idx === i ? { ...it, [key]: val } : it)
    updateItems(next)
  }
  const add = () => updateItems([...ticker.items, { text: '', link: '' }])
  const remove = (i) => updateItems(ticker.items.filter((_, idx) => idx !== i))

  const updateSpeed = (v) => onChange({ ...ticker, speed: Number(v) || 35 })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <p style={{ fontSize: '0.82rem', color: 'var(--gray-400)', margin: 0 }}>
          Manage the running ticker that appears above the Hero banner.
        </p>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gray-600)' }}>Speed (Seconds):</label>
            <input 
              type="number" 
              className="ap-input" 
              style={{ width: '80px', padding: '0.25rem 0.5rem', height: 'auto' }} 
              value={ticker.speed || 35} 
              onChange={e => updateSpeed(e.target.value)} 
              min="5" 
              max="150" 
            />
          </div>
          <Toggle label="Enable Ticker on Homepage" checked={ticker.visible !== false} onChange={updateVis} />
        </div>
      </div>
      
      {ticker.items.map((item, i) => (
        <div key={i} className="ap-card" style={{ marginBottom: '0.75rem', padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div style={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--maroon)' }}>
              Message {i + 1}
            </div>
            <button onClick={() => remove(i)} className="btn" style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #f87171', padding: '0.25rem 0.75rem', fontSize: '0.75rem', borderRadius: '4px' }}>
              <i className="fa-solid fa-trash" style={{ marginRight: '6px' }} /> Delete
            </button>
          </div>
          <div className="ap-form-row">
            <Field label="Scrolling Text" value={item.text} onChange={v => updateItem(i, 'text', v)} placeholder="e.g. Admission Open for GS 2027" />
            <Field label="Link URL (Optional)" value={item.link} onChange={v => updateItem(i, 'link', v)} placeholder="https://... or /contact" />
          </div>
        </div>
      ))}
      <button onClick={add} className="btn" style={{ marginTop: '0.5rem', width: '100%', justifyContent: 'center', background: 'var(--gray-100)', color: 'var(--gray-700)', border: '1px dashed var(--gray-300)' }}>
        <i className="fa-solid fa-plus" style={{ marginRight: '8px' }} /> Add Message
      </button>
    </div>
  )
}


/* ── Toppers Wall / Unified Success Stories & Results Gallery Card Editor ──── */
function ToppersWallEditor({ data = {}, onChange }) {
  const cfg = {
    eyebrow: data.eyebrow ?? 'NERMAI SUCCESS STORIES',
    titlePrefix: data.titlePrefix ?? 'From Aspirants to',
    titleHighlight: data.titleHighlight ?? 'Achievers',
    subtitle: data.subtitle ?? 'Real journeys. Real people. Real results. Be inspired by our students who turned their dreams into reality with Nermai.',
    scriptTopLeft: data.scriptTopLeft ?? 'Learn\nPrepare\nSucceed',
    scriptTopRight: data.scriptTopRight ?? 'Different\nAspirations\nOne\nDestination',

    toppersSubheading: data.toppersSubheading ?? 'OUR TOPPERS',
    toppersDesc: data.toppersDesc ?? 'Meet our achievers who made it happen with dedication, guidance and the Nermai way.',
    toppersViewAllText: data.toppersViewAllText ?? 'View All Toppers',
    toppersViewAllLink: data.toppersViewAllLink ?? '/results',

    resultsGalleryHeading: data.resultsGalleryHeading ?? 'RESULTS GALLERY',
    resultsGalleryDesc: data.resultsGalleryDesc ?? 'Various batch results, selections and achievement posters from Nermai IAS Academy.',
    resultsGalleryViewAllText: data.resultsGalleryViewAllText ?? 'View Full Gallery',
    resultsGalleryViewAllLink: data.resultsGalleryViewAllLink ?? '/results',
    showResultsGallery: data.showResultsGallery !== false,

    feature1Icon: data.feature1Icon ?? 'fa-trophy',
    feature1Title: data.feature1Title ?? 'Expert Guidance',
    feature1Desc: data.feature1Desc ?? 'By experienced faculty and mentors',
    feature2Icon: data.feature2Icon ?? 'fa-book-open',
    feature2Title: data.feature2Title ?? 'Structured Learning',
    feature2Desc: data.feature2Desc ?? 'From basics to advanced',
    feature3Icon: data.feature3Icon ?? 'fa-chart-line',
    feature3Title: data.feature3Title ?? 'Proven Results',
    feature3Desc: data.feature3Desc ?? 'Across competitive exams',
    feature4Icon: data.feature4Icon ?? 'fa-users',
    feature4Title: data.feature4Title ?? 'Diverse Backgrounds',
    feature4Desc: data.feature4Desc ?? 'Students from towns, cities and rural areas',

    showScriptTopLeft: data.showScriptTopLeft !== false,
    showBottomFeatures: data.showBottomFeatures !== false,
    ...data
  }

  const update = (key, val) => onChange({ ...cfg, [key]: val })

  return (
    <div>
      <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)', marginBottom: '1.5rem' }}>
        Customize every heading, cursive accent, achiever topper label, and Results Gallery banner section on the homepage <strong>"From Aspirants to Achievers"</strong> unified heritage section.
      </p>

      {/* 1. Main Header & Cursive Scripts */}
      <div className="ap-card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--gray-200)', paddingBottom: '0.5rem' }}>
          <h4 style={{ color: 'var(--maroon)', fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>
            <i className="fa-solid fa-heading" style={{ marginRight: '6px' }} /> 1. Section Header & Cursive Script Accents
          </h4>
          <Toggle label="Show Cursive Accents" checked={cfg.showScriptTopLeft} onChange={v => update('showScriptTopLeft', v)} />
        </div>

        <div className="ap-form-row">
          <Field label="Eyebrow Badge Pill" value={cfg.eyebrow} onChange={v => update('eyebrow', v)} placeholder="NERMAI SUCCESS STORIES" />
          <Field label="Top-Left Cursive Script (Enter for new lines)" value={cfg.scriptTopLeft} onChange={v => update('scriptTopLeft', v)} type="textarea" placeholder="Learn&#10;Prepare&#10;Succeed" />
          <Field label="Top-Right Cursive Script (Enter for new lines)" value={cfg.scriptTopRight} onChange={v => update('scriptTopRight', v)} type="textarea" placeholder="Different&#10;Aspirations&#10;One&#10;Destination" />
        </div>

        <div className="ap-form-row">
          <Field label="Main Heading Prefix" value={cfg.titlePrefix} onChange={v => update('titlePrefix', v)} placeholder="From Aspirants to" />
          <Field label="Highlighted Gold Word" value={cfg.titleHighlight} onChange={v => update('titleHighlight', v)} placeholder="Achievers" />
        </div>

        <Field label="Subtitle / Description Paragraph" value={cfg.subtitle} onChange={v => update('subtitle', v)} type="textarea" placeholder="Real journeys. Real people. Real results..." />
      </div>

      {/* 2. Our Toppers Carousel Header */}
      <div className="ap-card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <h4 style={{ color: 'var(--maroon)', fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '1px solid var(--gray-200)', paddingBottom: '0.5rem' }}>
          <i className="fa-solid fa-crown" style={{ marginRight: '6px' }} /> 2. Our Toppers Row Header & Links
        </h4>
        <div className="ap-form-row">
          <Field label="Toppers Subheading" value={cfg.toppersSubheading} onChange={v => update('toppersSubheading', v)} placeholder="OUR TOPPERS" />
          <Field label="View All Button Text" value={cfg.toppersViewAllText} onChange={v => update('toppersViewAllText', v)} placeholder="View All Toppers" />
          <Field label="View All Link URL" value={cfg.toppersViewAllLink} onChange={v => update('toppersViewAllLink', v)} placeholder="/results" />
        </div>
        <Field label="Toppers Description Line" value={cfg.toppersDesc} onChange={v => update('toppersDesc', v)} placeholder="Meet our achievers who made it happen with dedication..." />
        <p style={{ fontSize: '0.8rem', color: 'var(--gray-400)', marginTop: '0.5rem' }}>
          💡 <em>Note: Achievers with their ranks and photos are managed directly in the <strong>Results Portal</strong> and automatically sync live!</em>
        </p>
      </div>

      {/* 3. Results Gallery Banner Section Header */}
      <div className="ap-card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--gray-200)', paddingBottom: '0.5rem' }}>
          <h4 style={{ color: 'var(--maroon)', fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>
            <i className="fa-regular fa-images" style={{ marginRight: '6px' }} /> 3. Results Gallery Banners Row Header
          </h4>
          <Toggle label="Show Results Gallery Row" checked={cfg.showResultsGallery} onChange={v => update('showResultsGallery', v)} />
        </div>

        <div className="ap-form-row">
          <Field label="Section Heading" value={cfg.resultsGalleryHeading} onChange={v => update('resultsGalleryHeading', v)} placeholder="RESULTS GALLERY" />
          <Field label="View All Button Text" value={cfg.resultsGalleryViewAllText} onChange={v => update('resultsGalleryViewAllText', v)} placeholder="View Full Gallery" />
          <Field label="View All Link URL" value={cfg.resultsGalleryViewAllLink} onChange={v => update('resultsGalleryViewAllLink', v)} placeholder="/results" />
        </div>
        <Field label="Description Line" value={cfg.resultsGalleryDesc} onChange={v => update('resultsGalleryDesc', v)} placeholder="Various batch results, selections and achievement posters..." />
        <p style={{ fontSize: '0.8rem', color: 'var(--gray-400)', marginTop: '0.5rem' }}>
          💡 <em>Note: Result posters and banners are uploaded in the <strong>Results Gallery</strong> admin section with instant preview!</em>
        </p>
      </div>

      {/* 4. Bottom 4 Feature Pillars Bar */}
      <div className="ap-card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--gray-200)', paddingBottom: '0.5rem' }}>
          <h4 style={{ color: 'var(--maroon)', fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>
            <i className="fa-solid fa-layer-group" style={{ marginRight: '6px' }} /> 4. Bottom 4 Feature Pillars
          </h4>
          <Toggle label="Show Bottom Feature Highlights" checked={cfg.showBottomFeatures} onChange={v => update('showBottomFeatures', v)} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {/* Feature 1 */}
          <div style={{ background: 'var(--gray-50)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--gray-200)' }}>
            <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--maroon)', marginBottom: '0.5rem' }}>🏆 Feature 1</div>
            <Field label="Title" value={cfg.feature1Title} onChange={v => update('feature1Title', v)} placeholder="Expert Guidance" />
            <Field label="Description" value={cfg.feature1Desc} onChange={v => update('feature1Desc', v)} placeholder="By experienced faculty and mentors" />
          </div>

          {/* Feature 2 */}
          <div style={{ background: 'var(--gray-50)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--gray-200)' }}>
            <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--maroon)', marginBottom: '0.5rem' }}>📖 Feature 2</div>
            <Field label="Title" value={cfg.feature2Title} onChange={v => update('feature2Title', v)} placeholder="Structured Learning" />
            <Field label="Description" value={cfg.feature2Desc} onChange={v => update('feature2Desc', v)} placeholder="From basics to advanced" />
          </div>

          {/* Feature 3 */}
          <div style={{ background: 'var(--gray-50)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--gray-200)' }}>
            <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--maroon)', marginBottom: '0.5rem' }}>📈 Feature 3</div>
            <Field label="Title" value={cfg.feature3Title} onChange={v => update('feature3Title', v)} placeholder="Proven Results" />
            <Field label="Description" value={cfg.feature3Desc} onChange={v => update('feature3Desc', v)} placeholder="Across competitive exams" />
          </div>

          {/* Feature 4 */}
          <div style={{ background: 'var(--gray-50)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--gray-200)' }}>
            <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--maroon)', marginBottom: '0.5rem' }}>👥 Feature 4</div>
            <Field label="Title" value={cfg.feature4Title} onChange={v => update('feature4Title', v)} placeholder="Diverse Backgrounds" />
            <Field label="Description" value={cfg.feature4Desc} onChange={v => update('feature4Desc', v)} placeholder="Students from towns, cities and rural areas" />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Main HomeContentSection ─────────────────────────────────────────────── */
const TABS = [
  { id: 'visibility', icon: 'fa-eye',           label: 'Visibility' },
  { id: 'ticker',     icon: 'fa-bullhorn',      label: 'Top Ticker' },
  { id: 'toppersWall',icon: 'fa-trophy',        label: 'Success Stories Card' },
  { id: 'stats',      icon: 'fa-chart-simple',  label: 'Stats Bar' },
  { id: 'features',   icon: 'fa-bolt',          label: 'Features' },
  { id: 'courses',    icon: 'fa-book-bookmark', label: 'Courses' },
  { id: 'events',     icon: 'fa-calendar-days', label: 'Events' },
  { id: 'about',      icon: 'fa-address-card',  label: 'About' },
  { id: 'journeySteps', icon: 'fa-stairs',      label: 'Your Journey' }
]

const DEFAULTS = {
  visibility: { stats: true, about: true, features: true, courses: true, steps: true, results: true, gallery: true, googleReviews: true, faq: true, events: true, toppers: true, freeResources: true },
  ticker: { visible: true, speed: 35, items: [] },
  toppersWall: {
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
    feature4Desc: 'Students from towns, cities and rural areas',

    showScriptTopLeft: true,
    showBottomFeatures: true,
    showToppers: true
  },
  events: [
    { date: '2026-08-31', title: 'Short NIQ', subtitle: 'for construction of Selfie Point - Last date', url: '', visible: true },
  ],
  stats: [
    { num: '5000+', label: 'Students',  sublabel: 'From towns, cities and rural communities', visible: true },
    { num: '15+',   label: 'Years',     sublabel: 'Of academic excellence and trust', visible: true },
    { num: '28+',   label: 'Batches',   sublabel: 'Across competitive examinations', visible: true },
    { num: 'Highest', label: 'Success', sublabel: 'Consistent results, brighter futures', visible: true },
  ],
  features: [
    { icon: 'fa-solid fa-graduation-cap', title: 'Structured Classes',  desc: 'Daily scheduled classes with expert faculty.' },
    { icon: 'fa-solid fa-book-open',      title: 'Study Materials',     desc: 'Comprehensive notes and question banks.' },
    { icon: 'fa-solid fa-file-pen',       title: 'Mock Tests',          desc: 'Weekly full-length tests with analysis.' },
    { icon: 'fa-solid fa-chart-line',     title: 'Progress Tracking',   desc: 'Personal performance dashboard.' },
    { icon: 'fa-regular fa-calendar-check', title: 'Class Schedule',    desc: 'Flexible batch timings.' },
    { icon: 'fa-solid fa-user-tie',       title: 'Academic Guidance',   desc: 'One-on-one mentoring sessions.' },
  ],
  featuresConfig: DEFAULT_FEATURES_CONFIG,
  featureDetails: DEFAULT_FEATURE_DETAILS,
  courseCategories: [
    { id: 'all', name: 'All Courses', shortName: 'ALL', iconUrl: '', isVisible: true },
    { id: 'upsc', name: 'UPSC & Civil Services', shortName: 'UPSC', iconUrl: '', isVisible: true },
    { id: 'tnpsc', name: 'TNPSC & State Exams', shortName: 'TNPSC', iconUrl: '', isVisible: true },
    { id: 'banking', name: 'Banking Exams', shortName: 'Banking', iconUrl: '', isVisible: true },
    { id: 'ssc', name: 'SSC & Central Govt.', shortName: 'SSC', iconUrl: '', isVisible: true },
    { id: 'others', name: 'Other Courses', shortName: 'Others', iconUrl: '', isVisible: true },
  ],
  coursesConfig: {
    sectionHeading: 'Courses in NERMAI IAS Puducherry',
    highlightedWord: 'NERMAI IAS Puducherry',
    subHeading: 'Get expert coaching for Bank, Insurance, SSC and Railways exams at the best coaching institute in Puducherry from expert faculty and regular mentor sessions'
  },
  courses: [
    {
      id: 'bank-offline',
      title: 'Bank Offline Course',
      categoryId: 'banking',
      coverImageUrl: '',
      logoUrl: '',
      badges: ['BANK', 'OFFLINE', 'TAMIL'],
      shortDescription: 'Prepare for major Bank/Insurance exams for all stages of exam from our expert faculty & mentors',
      features: [
        { text: '1000+ hours offline coaching', icon: 'Monitor' },
        { text: '100+ Prelims/Mains mock tests', icon: 'CheckCircle' },
        { text: '5+ Bank Preparatory Books', icon: 'BookOpen' },
        { text: 'Regular mentor sessions', icon: 'GraduationCap' }
      ],
      price: '₹ 24,000',
      priceLabel: 'Course Price',
      isActive: true,
    },
    {
      id: 'ssc-offline',
      title: 'SSC Offline Course',
      categoryId: 'ssc',
      coverImageUrl: '',
      logoUrl: '',
      badges: ['SSC', 'OFFLINE', 'TAMIL'],
      shortDescription: 'Prepare for major SSC & Central Govt. exams for all stages of exam from our expert faculty & mentors',
      features: [
        { text: '1000+ hours offline coaching', icon: 'Monitor' },
        { text: '100+ Prelims/Mains mock tests', icon: 'CheckCircle' },
        { text: '5+ Bank Preparatory Books', icon: 'BookOpen' },
        { text: 'Regular mentor sessions', icon: 'GraduationCap' }
      ],
      price: '₹ 25,000',
      priceLabel: 'Course Price',
      isActive: true,
    },
    {
      id: 'railways-offline',
      title: 'Railways Offline Course',
      categoryId: 'all',
      coverImageUrl: '',
      logoUrl: '',
      badges: ['RAILWAYS', 'OFFLINE', 'TAMIL'],
      shortDescription: 'Prepare for major Railways & State Govt. exams for all stages of exam from our expert faculty & mentors',
      features: [
        { text: '1000+ hours offline coaching', icon: 'Monitor' },
        { text: '30+ RRB exam full mock tests', icon: 'CheckCircle' },
        { text: 'RRB exam study materials', icon: 'BookOpen' },
        { text: 'Regular mentor sessions', icon: 'GraduationCap' }
      ],
      price: '₹ 23,000',
      priceLabel: 'Course Price',
      isActive: true,
    },
    {
      id: 'tnpsc-offline',
      title: 'TNPSC Offline Course',
      categoryId: 'tnpsc',
      coverImageUrl: '',
      logoUrl: '',
      badges: ['TNPSC', 'OFFLINE', 'TAMIL'],
      shortDescription: 'Complete preparation for Tamil Nadu Public Service Commission exams.',
      features: [
        { text: '800+ hours offline coaching', icon: 'Monitor' },
        { text: 'Weekly mock tests', icon: 'CheckCircle' },
        { text: 'Tamil medium materials', icon: 'BookOpen' },
        { text: 'Regular mentor sessions', icon: 'GraduationCap' }
      ],
      price: '₹ 20,000',
      priceLabel: 'Course Price',
      isActive: true,
    },
    {
      id: 'tnusrb-offline',
      title: 'TNUSRB SI/PC Offline Course',
      categoryId: 'tnpsc',
      coverImageUrl: '',
      logoUrl: '',
      badges: ['TNUSRB SI PC', 'OFFLINE', 'TAMIL'],
      shortDescription: 'Prepare for major Police & State Govt. exams for all stages of exam from our expert faculty & mentors',
      features: [
        { text: '800+ hours offline coaching', icon: 'Monitor' },
        { text: 'Weekly mock tests', icon: 'CheckCircle' },
        { text: 'Study materials', icon: 'BookOpen' },
        { text: 'Regular mentor sessions', icon: 'GraduationCap' }
      ],
      price: '₹ 18,000',
      priceLabel: 'Course Price',
      isActive: true,
    },
    {
      id: 'tntet-hybrid',
      title: 'TNTET Online Hybrid Coaching Course',
      categoryId: 'all',
      coverImageUrl: '',
      logoUrl: '',
      badges: ['TN TET', 'HYBRID', 'TAMIL'],
      shortDescription: 'Prepare for TNTET exams for all stages of exam from our expert faculty & mentors',
      features: [
        { text: '500+ hours coaching', icon: 'Monitor' },
        { text: 'Weekly mock tests', icon: 'CheckCircle' },
        { text: 'Study materials', icon: 'BookOpen' },
        { text: 'Regular mentor sessions', icon: 'GraduationCap' }
      ],
      price: '₹ 15,000',
      priceLabel: 'Course Price',
      isActive: true,
    }
  ],
  about: {
    eyebrow: 'About Nermai', title: 'Introduction to Nermai IAS',
    para1: 'The very basic purpose of starting this academy is that the civil services exam is considered to be the highest and most prestigious job of the country.',
    para2: 'A handful of youth from Puducherry started NERMAI IAS ACADEMY to make quality coaching accessible to all aspirants.',
    imageUrl: '', imageLabel: '187+ RESULTS · 2022–25',
    badges: [{ num: '187+', label: 'Results' }, { num: '14+', label: 'Years' }, { num: '2400+', label: 'Students' }]
  },
  journeySteps: [
    { id: 1, title: 'Choose Your Goal', description: 'Select the competitive examination you want to prepare for.', imageUrl: '' },
    { id: 2, title: 'Find Your Course', description: 'Explore the right batch, programme and learning structure for your needs.', imageUrl: '' },
    { id: 3, title: 'Begin Your Learning', description: 'Join classes and access structured study resources.', imageUrl: '' },
    { id: 4, title: 'Practice & Progress', description: 'Attend tests, evaluate performance and improve continuously.', imageUrl: '' },
    { id: 5, title: 'Achieve Your Goal', description: 'Complete your preparation journey with confidence and become a successful government officer.', imageUrl: '' },
  ]
}

export default function HomeContentSection({ toast }) {
  const [activeTab, setActiveTab] = useState('visibility')
  const [content, setContent] = useState(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fbFirestore.getSettings().then(s => {
      if (s.homeContent) {
        setContent(prev => ({
          visibility: s.homeContent.visibility || prev.visibility,
          ticker:     s.homeContent.ticker     || prev.ticker,
          events:     s.homeContent.events     || prev.events,
          stats:      s.homeContent.stats      || prev.stats,
          features:   s.homeContent.features   || prev.features,
          featuresConfig: s.homeContent.featuresConfig || prev.featuresConfig,
          featureDetails: s.homeContent.featureDetails || prev.featureDetails,
          courseCategories: s.homeContent.courseCategories || prev.courseCategories,
          coursesConfig: s.homeContent.coursesConfig || prev.coursesConfig,
          courses:    s.homeContent.courses    || prev.courses,
          about:      { ...prev.about, ...s.homeContent.about },
          toppersWall: { ...prev.toppersWall, ...(s.homeContent.toppersWall || {}) },
          journeySteps: (s.homeContent.journeySteps || prev.journeySteps).map((step, idx) => {
            const def = prev.journeySteps[idx % prev.journeySteps.length] || { title: 'Step', description: '' }
            const cleanTitle = (step.title && /[\u0B80-\u0BFF]/.test(step.title)) ? def.title : (step.title || def.title)
            const cleanDesc = (step.description && /[\u0B80-\u0BFF]/.test(step.description)) ? def.description : (step.description || def.description)
            return {
              ...step,
              title: cleanTitle,
              description: cleanDesc
            }
          }),
        }))
      }
      setLoading(false)
    })
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      // Automatically register any manually specified custom categories into courseCategories for future use
      let updatedCategories = [...(content.courseCategories || [])]
      let categoriesChanged = false

      const updatedCourses = (content.courses || []).map(course => {
        const customName = (course.customCategoryName || '').trim()
        if (customName && (course.categoryId === 'others' || !course.categoryId || course.categoryId === 'all' || !updatedCategories.some(c => c.id === course.categoryId))) {
          const slug = customName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || ('cat-' + Date.now())
          const exists = updatedCategories.find(c => 
            c.id.toLowerCase() === slug || 
            (c.name && c.name.toLowerCase() === customName.toLowerCase()) ||
            (c.shortName && c.shortName.toLowerCase() === customName.toLowerCase())
          )
          if (!exists) {
            updatedCategories.push({
              id: slug,
              name: customName,
              shortName: customName,
              iconUrl: '',
              isVisible: true
            })
            categoriesChanged = true
          }
          return { ...course, categoryId: exists ? exists.id : slug }
        }
        return course
      })

      const finalContent = {
        ...content,
        courses: updatedCourses,
        courseCategories: updatedCategories
      }

      await fbFirestore.updateSettings({ homeContent: finalContent })
      setContent(finalContent)
      toast.success('Home content saved! Please refresh the page.')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div style={{ padding: '2rem', color: 'var(--gray-400)' }}><i className="fa-solid fa-spinner fa-spin" /> Loading...</div>

  return (
    <div>
      <h2 className="ap-section-title">
        <i className="fa-solid fa-house" /> Home Page Content
      </h2>
      <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)', marginBottom: '1.5rem' }}>
        Edit all homepage sections. Click <strong>Save Changes</strong> to publish — changes appear live after page refresh.
      </p>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '1.5rem', borderBottom: '2px solid var(--gray-200)', paddingBottom: '0.75rem' }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '0.45rem 1rem',
              borderRadius: 0,
              border: activeTab === tab.id ? '2px solid var(--maroon)' : '2px solid var(--gray-200)',
              background: activeTab === tab.id ? 'var(--maroon)' : 'var(--white)',
              color: activeTab === tab.id ? 'var(--white)' : 'var(--gray-600)',
              fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              transition: 'all 0.15s'
            }}
          >
            <i className={`fa-solid ${tab.icon}`} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'visibility' && <VisibilityEditor visibility={content.visibility} onChange={v => setContent(c => ({ ...c, visibility: v }))} />}
      {activeTab === 'ticker'   && <TickerEditor   ticker={content.ticker}       onChange={v => setContent(c => ({ ...c, ticker: v }))} />}
      {activeTab === 'toppersWall' && <ToppersWallEditor data={content.toppersWall} onChange={v => setContent(c => ({ ...c, toppersWall: v }))} />}
      {activeTab === 'stats'    && <StatsEditor    stats={content.stats} visibility={content.visibility} onChange={v => setContent(c => ({ ...c, stats: v }))} onChangeVisibility={v => setContent(c => ({ ...c, visibility: v }))} />}
      {activeTab === 'features' && (
        <FeaturesEditor 
          config={content.featuresConfig} 
          details={content.featureDetails} 
          onChangeConfig={v => setContent(c => ({ ...c, featuresConfig: v }))} 
          onChangeDetails={v => setContent(c => ({ ...c, featureDetails: v }))} 
          toast={toast} 
        />
      )}
      {activeTab === 'courseCategories' && <CourseCategoriesEditor categories={content.courseCategories} onChange={v => setContent(c => ({ ...c, courseCategories: v }))} />}
      {activeTab === 'courses'  && <CoursesEditor  courses={content.courses} config={content.coursesConfig} categories={content.courseCategories} onChangeCourses={v => setContent(c => ({ ...c, courses: v }))} onChangeConfig={v => setContent(c => ({ ...c, coursesConfig: v }))} onChangeCategories={v => setContent(c => ({ ...c, courseCategories: v }))} />}
      {activeTab === 'events'   && <EventsEditor   events={content.events}       onChange={v => setContent(c => ({ ...c, events: v }))} />}
      {activeTab === 'about'    && <AboutEditor    about={content.about} stats={content.stats} onChange={v => setContent(c => ({ ...c, about: v }))} />}
      {activeTab === 'journeySteps' && <JourneyStepsEditor steps={content.journeySteps} onChange={v => setContent(c => ({ ...c, journeySteps: v }))} />}

      {/* Save button */}
      <div style={{ position: 'sticky', bottom: '1rem', zIndex: 10, marginTop: '1.5rem' }}>
        <button
          className="ap-btn ap-btn-primary"
          onClick={handleSave}
          disabled={saving}
          style={{ width: '100%', padding: '1rem', fontSize: '1rem' }}
        >
          {saving
            ? <><i className="fa-solid fa-spinner fa-spin" /> Saving...</>
            : <><i className="fa-solid fa-floppy-disk" /> Save All Changes</>
          }
        </button>
      </div>
    </div>
  )
}
