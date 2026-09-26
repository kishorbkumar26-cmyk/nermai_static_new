import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { fbFirestore } from '../firebase/firestore'

// ── Format metadata helper ────────────────────────────────────────────────────
function getFormatMeta(format) {
  const f = (format || 'PDF').toUpperCase()
  if (f === 'PDF')  return { icon: 'fa-file-pdf',        color: '#c0392b', bg: 'rgba(192,57,43,0.1)',  label: 'PDF'  }
  if (f === 'DOCX' || f === 'DOC')  return { icon: 'fa-file-word',  color: '#2563eb', bg: 'rgba(37,99,235,0.1)',  label: f }
  if (f === 'PPTX' || f === 'PPT')  return { icon: 'fa-file-powerpoint', color: '#d97706', bg: 'rgba(217,119,6,0.1)', label: f }
  if (f === 'XLSX' || f === 'XLS')  return { icon: 'fa-file-excel', color: '#16a34a', bg: 'rgba(22,163,74,0.1)',  label: f }
  if (f === 'ZIP')  return { icon: 'fa-file-zipper',     color: '#7c3aed', bg: 'rgba(124,58,237,0.1)', label: 'ZIP' }
  return { icon: 'fa-file-lines', color: 'var(--gray-600)', bg: 'var(--gray-100)', label: f }
}

// ── Smart view URL — Word/PPT need Google Docs Viewer to render in-browser ────
function getViewUrl(url, format) {
  if (!url) return '#'
  const f = (format || '').toUpperCase()
  const needsViewer = ['DOC','DOCX','PPT','PPTX','XLS','XLSX'].includes(f)
  if (needsViewer) {
    return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=false`
  }
  return url
}

export default function ResourcesDesk({ isWidget = false }) {
  const [resources, setResources] = useState([])
  const [activeTab, setActiveTab] = useState('ALL')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = fbFirestore.onResourcesChanged(data => {
      setResources(data || [])
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const categories = useMemo(() => {
    const cats = new Set(resources.map(r => r.category))
    return ['ALL', ...Array.from(cats).filter(Boolean).sort()]
  }, [resources])

  // Sort: Featured first, then newest date first
  const filtered = useMemo(() => {
    let list = resources
    if (activeTab !== 'ALL') {
      list = list.filter(r => r.category === activeTab)
    }
    return [...list].sort((a, b) => {
      const featA = a.isFeatured ? 1 : 0
      const featB = b.isFeatured ? 1 : 0
      if (featB !== featA) return featB - featA

      const timeA = new Date(a.date || a.createdAt || 0).getTime()
      const timeB = new Date(b.date || b.createdAt || 0).getTime()
      return timeB - timeA
    })
  }, [resources, activeTab])

  if (!loading && resources.length === 0) return null

  const Wrapper = isWidget ? 'div' : 'section'

  return (
    <Wrapper
      className={!isWidget ? "resource-desk-section" : "resource-desk-widget"}
      style={{
        background: isWidget ? 'var(--white)' : 'var(--cream)',
        color: 'var(--ink)',
        padding: isWidget ? '2rem 2.25rem' : '5rem 1.5rem',
        borderRadius: isWidget ? '20px' : '0',
        border: isWidget ? '1px solid var(--gray-200)' : 'none',
        boxShadow: isWidget ? '0 10px 30px rgba(26, 16, 8, 0.04)' : 'none',
        fontFamily: 'var(--font-body)',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      <div className={!isWidget ? "container-narrow" : ""}>
        
        {/* Header */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '0.85rem' }}>
          <div>
            <span style={{ 
              fontSize: '0.75rem', 
              fontWeight: 700, 
              letterSpacing: '0.12em', 
              color: 'var(--maroon)', 
              textTransform: 'uppercase', 
              display: 'block', 
              marginBottom: '0.3rem' 
            }}>
              FREE LEARNING RESOURCES
            </span>
            <h2 style={{ 
              fontFamily: 'var(--font-display)', 
              fontSize: isWidget ? '1.5rem' : '2.25rem', 
              fontWeight: 700, 
              color: 'var(--ink)', 
              margin: '0 0 0.75rem',
              lineHeight: 1.2
            }}>
              Study Notes & Question Banks
            </h2>
            <div style={{ 
              width: '50px', 
              height: '3px', 
              background: 'linear-gradient(90deg, var(--maroon) 0%, var(--saffron) 100%)',
              borderRadius: '2px' 
            }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <Link
              to="/free-resources"
              style={{
                fontSize: '0.84rem',
                color: 'var(--maroon)',
                fontWeight: 700,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'rgba(123, 27, 46, 0.08)',
                padding: '0.4rem 0.95rem',
                borderRadius: '20px',
                border: '1px solid rgba(123, 27, 46, 0.2)',
                transition: 'all 0.2s ease'
              }}
            >
              Open Full Library & Daily Archive <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.72rem' }} />
            </Link>

            {filtered.length > 5 && (
              <span style={{ 
                fontSize: '0.8rem', 
                color: 'var(--gray-600)', 
                fontWeight: 600,
                background: 'var(--gray-100)',
                padding: '0.35rem 0.75rem',
                borderRadius: '20px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}>
                <i className="fa-solid fa-arrow-down" style={{ fontSize: '0.75rem', color: 'var(--maroon)' }} />
                Scroll all ({filtered.length})
              </span>
            )}
          </div>
        </div>

        {/* Category Tabs */}
        {categories.length > 1 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.35rem' }}>
            {categories.map(cat => {
              const isActive = activeTab === cat
              return (
                <button
                  key={cat}
                  onClick={() => setActiveTab(cat)}
                  style={{
                    background: isActive ? 'var(--maroon)' : 'var(--gray-100)',
                    color: isActive ? 'var(--white)' : 'var(--gray-700)',
                    border: isActive ? '1px solid var(--maroon)' : '1px solid var(--gray-200)',
                    fontWeight: isActive ? 600 : 500,
                    fontSize: '0.84rem',
                    letterSpacing: '0.02em',
                    cursor: 'pointer',
                    padding: '0.4rem 1rem',
                    borderRadius: '20px',
                    boxShadow: isActive ? '0 2px 8px rgba(123, 27, 46, 0.2)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {cat}
                </button>
              )
            })}
          </div>
        )}

        {/* Scrollable List — Shows latest 5 and featured, with smooth scroll for remaining */}
        <div 
          className="resource-desk-scroll-container"
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '0.85rem',
            maxHeight: '520px',
            overflowY: 'auto',
            paddingRight: '0.35rem',
            scrollBehavior: 'smooth'
          }}
        >
          {filtered.map(res => (
            <div 
              key={res.id} 
              className="resource-card-item"
              style={{
                background: 'var(--surface)',
                border: res.isFeatured ? '1.5px solid rgba(230, 92, 0, 0.4)' : '1px solid var(--gray-200)',
                borderRadius: '14px',
                padding: '1.15rem 1.35rem',
                position: 'relative',
                transition: 'all 0.25s ease',
                display: 'block',
                boxShadow: res.isFeatured ? '0 4px 14px rgba(230, 92, 0, 0.06)' : '0 2px 8px rgba(0, 0, 0, 0.02)',
                boxSizing: 'border-box',
                width: '100%'
              }}
            >
              <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                {/* Accent Line */}
                <div style={{ 
                  width: '4px', 
                  borderRadius: '4px', 
                  background: res.isFeatured ? 'var(--saffron)' : 'var(--maroon)', 
                  alignSelf: 'stretch',
                  flexShrink: 0 
                }} />
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Top Row: Title + Featured Badge */}
                  <div className="resource-card-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.35rem' }}>
                    <h3 className="resource-card-title" style={{ 
                      fontSize: res.isFeatured ? '1.15rem' : '1.02rem', 
                      fontWeight: 750, 
                      margin: 0, 
                      color: 'var(--ink)', 
                      letterSpacing: '-0.01em',
                      lineHeight: 1.3,
                      wordBreak: 'break-word'
                    }}>
                      {res.title}
                    </h3>
                    {res.isFeatured && (
                      <span style={{ 
                        background: 'rgba(230, 92, 0, 0.12)', 
                        color: 'var(--saffron-dark)', 
                        fontSize: '0.68rem', 
                        fontWeight: 800, 
                        padding: '0.15rem 0.55rem', 
                        borderRadius: '4px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        flexShrink: 0
                      }}>
                        Featured
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  {res.description && (
                    <p style={{ fontSize: '0.86rem', color: 'var(--gray-600)', marginBottom: '0.75rem', lineHeight: 1.45 }}>
                      {res.description}
                    </p>
                  )}
                  
                  {/* Bottom Row: Metadata & View Action Button */}
                  <div className="resource-card-bottom-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.45rem' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', alignItems: 'center' }}>
                      {(() => {
                        const meta = getFormatMeta(res.format)
                        return (
                          <span style={{ 
                            background: meta.bg,
                            color: meta.color,
                            fontSize: '0.74rem', 
                            fontWeight: 750, 
                            padding: '0.18rem 0.55rem', 
                            borderRadius: '6px', 
                            letterSpacing: '0.04em',
                            fontFamily: 'var(--font-mono)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}>
                            <i className={`fa-solid ${meta.icon}`} style={{ fontSize: '0.7rem' }} />
                            {meta.label}
                          </span>
                        )
                      })()}

                      {Boolean(res.sizeBytes && Number(res.sizeBytes) > 0) && (
                        <span style={{ color: 'var(--gray-500)', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          <i className="fa-solid fa-file" style={{ fontSize: '0.72rem', color: 'var(--gray-400)' }} />
                          {(Number(res.sizeBytes) / 1024 / 1024).toFixed(1)} MB
                        </span>
                      )}

                      {res.date && (
                        <span style={{ color: 'var(--gray-500)', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          <i className="fa-regular fa-calendar" style={{ fontSize: '0.72rem', color: 'var(--gray-400)' }} />
                          {new Date(res.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                    </div>

                    <a 
                      href={getViewUrl(res.url, res.format)} 
                      target="_blank" 
                      rel="noreferrer"
                      className="resource-view-btn"
                      style={{
                        background: 'var(--maroon)',
                        color: 'var(--white)',
                        textDecoration: 'none',
                        fontWeight: 700,
                        fontSize: '0.84rem',
                        letterSpacing: '0.02em',
                        padding: '0.45rem 1.1rem',
                        borderRadius: '8px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 6px rgba(123, 27, 46, 0.2)',
                        flexShrink: 0
                      }}
                    >
                      {['DOC','DOCX','PPT','PPTX'].includes((res.format||'').toUpperCase()) ? 'OPEN' : 'VIEW'}
                      <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.72rem' }} />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ color: 'var(--gray-500)', fontStyle: 'italic', padding: '1rem 0' }}>
              No resources available in this category.
            </div>
          )}
        </div>

      </div>

      <style>{`
        .resource-desk-scroll-container {
          scrollbar-width: thin;
          scrollbar-color: rgba(123, 27, 46, 0.35) rgba(0, 0, 0, 0.04);
        }
        .resource-desk-scroll-container::-webkit-scrollbar {
          width: 6px;
        }
        .resource-desk-scroll-container::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.04);
          border-radius: 10px;
        }
        .resource-desk-scroll-container::-webkit-scrollbar-thumb {
          background: rgba(123, 27, 46, 0.35);
          border-radius: 10px;
        }
        .resource-desk-scroll-container::-webkit-scrollbar-thumb:hover {
          background: rgba(123, 27, 46, 0.65);
        }

        @media (max-width: 768px) {
          .resource-desk-widget {
            padding: 1.25rem 0.85rem !important;
            border-radius: 16px !important;
          }
          .resource-card-item {
            padding: 0.95rem 0.85rem !important;
          }
          .resource-card-title {
            font-size: 0.98rem !important;
          }
          .resource-view-btn {
            padding: 0.4rem 0.95rem !important;
            font-size: 0.8rem !important;
          }
        }
      `}</style>
    </Wrapper>
  )
}
