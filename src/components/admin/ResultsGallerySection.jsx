import { useState, useEffect, useRef } from 'react'
import { fbFirestore } from '../../firebase/firestore'
import { driveStorage } from '../../services/driveStorage'
import AdminImageUpload from './AdminImageUpload'

const DEFAULT_COLORS = ['#7b1b2e','#e65c00','#1d4ed8','#047857','#6b21a8','#b45309','#0f766e','#9f1239']

export default function ResultsGallerySection({ toast }) {
  const [categories, setCategories] = useState([])
  const [images, setImages]         = useState([])
  const [activeTab, setActiveTab]   = useState('gallery')
  const [newCatName, setNewCatName] = useState('')
  const [newCatColor, setNewCatColor] = useState('#7b1b2e')
  const [selectedCat, setSelectedCat] = useState('all')
  const [uploadCat, setUploadCat]   = useState('')
  const [uploadCaption, setUploadCaption] = useState('')
  const [urlInput, setUrlInput]     = useState('')
  const [loading, setLoading]       = useState(true)
  const [previewImage, setPreviewImage] = useState(null)
  const [editingImage, setEditingImage] = useState(null)
  const [isVisible, setIsVisible]   = useState(true)
  const [savingVisibility, setSavingVisibility] = useState(false)

  useEffect(() => {
    Promise.all([
      fbFirestore.getResultCategories(),
      fbFirestore.getGallery(),
      fbFirestore.getSettings(),
    ]).then(([cats, imgs, s]) => {
      setCategories(cats || [])
      setImages(imgs || [])
      if (s) {
        if (s.galleryConfig?.visible !== undefined) {
          setIsVisible(s.galleryConfig.visible)
        } else if (s.galleryVisibility !== undefined) {
          setIsVisible(s.galleryVisibility)
        } else if (s.homeContent?.visibility?.gallery !== undefined) {
          setIsVisible(s.homeContent.visibility.gallery)
        }
      }
      if (cats && cats.length > 0 && !uploadCat) setUploadCat(cats[0].slug)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const handleToggleVisibility = async (e) => {
    const nextVal = e.target.checked
    setIsVisible(nextVal)
    setSavingVisibility(true)
    try {
      const s = await fbFirestore.getSettings() || {}
      const updatedHomeContent = {
        ...(s.homeContent || {}),
        visibility: {
          ...(s.homeContent?.visibility || {}),
          gallery: nextVal
        }
      }
      await fbFirestore.updateSettings({
        galleryVisibility: nextVal,
        galleryConfig: {
          ...(s.galleryConfig || {}),
          visible: nextVal
        },
        homeContent: updatedHomeContent
      })
      toast.success(nextVal ? '🟢 Classroom Moments / Gallery section is now VISIBLE on homepage' : '🔴 Classroom Moments / Gallery section is now HIDDEN from homepage')
    } catch (err) {
      toast.error('Failed to update visibility: ' + err.message)
      setIsVisible(!nextVal)
    } finally {
      setSavingVisibility(false)
    }
  }

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return
    try {
      await fbFirestore.addResultCategory({ name: newCatName.trim(), color: newCatColor })
      const cats = await fbFirestore.getResultCategories()
      setCategories(cats || [])
      setNewCatName('')
      toast.success('Category added!')
    } catch (e) { toast.error(e.message) }
  }

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Delete this category?')) return
    try {
      await fbFirestore.deleteResultCategory(id)
      setCategories(c => c.filter(x => x.id !== id))
      toast.success('Category deleted.')
    } catch (e) { toast.error(e.message) }
  }

  const handleAddImage = async () => {
    if (!urlInput.trim()) { toast.error('Please upload an image or enter an image URL first.'); return }
    const catToUse = uploadCat || (categories[0]?.slug) || 'all'
    try {
      await fbFirestore.addGalleryImage({
        url: urlInput.trim(),
        caption: uploadCaption.trim() || 'Achievement Poster',
        category: catToUse,
        storageType: urlInput.includes('drive.google.com') ? 'drive' : (urlInput.startsWith('data:') ? 'base64' : 'url')
      })
      setImages(await fbFirestore.getGallery())
      setUrlInput('')
      setUploadCaption('')
      toast.success('Image banner added to results gallery!')
      setActiveTab('gallery')
    } catch (e) { toast.error(e.message) }
  }

  const handleStartEdit = (img) => {
    setEditingImage({
      id: img.id,
      url: img.url || '',
      caption: img.caption || '',
      category: img.category || categories[0]?.slug || 'all'
    })
  }

  const handleSaveEdit = async () => {
    if (!editingImage || !editingImage.id) return
    if (!editingImage.url?.trim()) { toast.error('Please provide an image URL or upload an image.'); return }
    try {
      await fbFirestore.updateGalleryImage(editingImage.id, {
        url: editingImage.url.trim(),
        caption: editingImage.caption?.trim() || 'Achievement Poster',
        category: editingImage.category || 'all',
        storageType: editingImage.url.includes('drive.google.com') ? 'drive' : (editingImage.url.startsWith('data:') ? 'base64' : 'url')
      })
      setImages(await fbFirestore.getGallery())
      setEditingImage(null)
      toast.success('Result poster updated successfully!')
    } catch (e) { toast.error(e.message) }
  }

  const handleDeleteImage = async (id) => {
    if (!window.confirm('Delete this image?')) return
    try {
      await fbFirestore.deleteGalleryImage(id)
      setImages(imgs => imgs.filter(i => i.id !== id))
      if (previewImage?.id === id) setPreviewImage(null)
      if (editingImage?.id === id) setEditingImage(null)
      toast.success('Image deleted.')
    } catch (e) { toast.error(e.message) }
  }

  const filteredImages = selectedCat === 'all'
    ? images
    : images.filter(img => img.category === selectedCat)

  if (loading) return <div style={{ padding: '2rem', color: 'var(--gray-400)' }}><i className="fa-solid fa-spinner fa-spin" /> Loading...</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h2 className="ap-section-title" style={{ margin: 0 }}><i className="fa-solid fa-images" /> Results Gallery & Banners</h2>
        <button
          className="ap-btn ap-btn-primary"
          onClick={() => setActiveTab('upload')}
          style={{ fontSize: '0.82rem', padding: '0.45rem 0.9rem' }}
        >
          <i className="fa-solid fa-cloud-arrow-up" /> Upload New Result Banner
        </button>
      </div>

      <p style={{ fontSize: '0.82rem', color: 'var(--gray-500)', marginBottom: '1.25rem' }}>
        Manage achievement posters, batch result banners, and marksheets. These are showcased on both the Homepage <strong>"Results Gallery"</strong> banner section and the dedicated Results page with interactive full-screen preview.
      </p>

      {/* ── Section Visibility Switch Card ── */}
      <div
        style={{
          borderRadius: '12px',
          border: '1.5px solid var(--gray-200)',
          marginBottom: '1.5rem',
          padding: '1.25rem 1.5rem',
          borderLeft: isVisible ? '5px solid #10b981' : '5px solid #ef4444',
          background: isVisible ? '#f0fdf4' : '#fef2f2',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontSize: '1.2rem' }}>{isVisible ? '🟢' : '🔴'}</span>
              <strong style={{ fontSize: '1rem', color: isVisible ? '#065f46' : '#991b1b' }}>
                {isVisible ? 'Classroom Moments / Gallery Section is VISIBLE' : 'Classroom Moments / Gallery Section is HIDDEN'}
              </strong>
            </div>
            <p style={{ margin: '0.25rem 0 0 1.8rem', fontSize: '0.82rem', color: isVisible ? '#047857' : '#b91c1c' }}>
              Controls the visibility of the "Classroom Moments" photo gallery on the website homepage.
            </p>
          </div>

          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', background: 'white', padding: '0.6rem 1.25rem', borderRadius: '8px', border: '1.5px solid #d1d5db', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', fontWeight: 700, fontSize: '0.9rem' }}>
            <input
              type="checkbox"
              checked={isVisible}
              onChange={handleToggleVisibility}
              disabled={savingVisibility}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            {isVisible ? 'Section: ON' : 'Section: OFF'}
          </label>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '1.25rem', borderBottom: '2px solid var(--gray-200)', paddingBottom: '0.5rem' }}>
        {[
          { id: 'gallery', label: `🖼️ View Gallery (${images.length})` },
          { id: 'upload', label: '⬆️ Upload Banners / Posters' },
          { id: 'categories', label: `🏷️ Manage Categories (${categories.length})` }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: '0.45rem 1rem',
              borderRadius: 4,
              border: activeTab === t.id ? '2px solid var(--maroon)' : '1px solid var(--gray-200)',
              background: activeTab === t.id ? 'var(--maroon)' : 'var(--white)',
              color: activeTab === t.id ? 'var(--white)' : 'var(--gray-600)',
              fontWeight: 600,
              fontSize: '0.82rem',
              cursor: 'pointer'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ════════ GALLERY TAB ════════ */}
      {activeTab === 'gallery' && (
        <div>
          {/* Category filter */}
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '1rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--gray-600)', marginRight: '4px' }}>Filter:</span>
            <button
              onClick={() => setSelectedCat('all')}
              style={{
                padding: '0.35rem 0.8rem',
                borderRadius: 9999,
                border: selectedCat === 'all' ? '2px solid var(--maroon)' : '1px solid var(--gray-300)',
                background: selectedCat === 'all' ? 'var(--maroon)' : 'var(--white)',
                color: selectedCat === 'all' ? 'var(--white)' : 'var(--gray-600)',
                fontWeight: 600,
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              All ({images.length})
            </button>
            {categories.map(cat => (
              <button
                key={cat.slug}
                onClick={() => setSelectedCat(cat.slug)}
                style={{
                  padding: '0.35rem 0.8rem',
                  borderRadius: 9999,
                  border: selectedCat === cat.slug ? `2px solid ${cat.color}` : '1px solid var(--gray-300)',
                  background: selectedCat === cat.slug ? cat.color : 'var(--white)',
                  color: selectedCat === cat.slug ? 'var(--white)' : 'var(--gray-600)',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  cursor: 'pointer'
                }}
              >
                {cat.name} ({images.filter(i => i.category === cat.slug).length})
              </button>
            ))}
          </div>

          {filteredImages.length === 0 ? (
            <div className="ap-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: 'var(--gray-400)' }}>
              <i className="fa-regular fa-images" style={{ fontSize: '2.5rem', color: 'var(--gray-300)', marginBottom: '0.75rem' }} />
              <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--gray-600)' }}>No banners or posters in this category</div>
              <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Upload your first result banner or poster to display it on the website.</p>
              <button className="ap-btn ap-btn-primary" onClick={() => setActiveTab('upload')} style={{ marginTop: '0.5rem', display: 'inline-flex' }}>
                <i className="fa-solid fa-plus" /> Upload Poster Now
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
              {filteredImages.map(img => {
                const formattedUrl = driveStorage.formatImageUrl(img.url, 800) || img.url
                const catObj = categories.find(c => c.slug === img.category)
                return (
                  <div
                    key={img.id}
                    className="ap-card"
                    style={{
                      position: 'relative',
                      border: '1px solid var(--gray-200)',
                      borderRadius: 8,
                      overflow: 'hidden',
                      padding: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      cursor: 'pointer',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                    }}
                    onClick={() => setPreviewImage(img)}
                    title="Click for full-screen preview"
                  >
                    <div style={{ position: 'relative', width: '100%', height: 140, background: '#200308', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {formattedUrl ? (
                        <img
                          src={formattedUrl}
                          alt={img.caption || ''}
                          referrerPolicy="no-referrer"
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          onError={e => driveStorage.handleImageError(e, '')}
                        />
                      ) : (
                        <div style={{ color: '#F5D061', fontSize: '2rem' }}>
                          <i className="fa-regular fa-image" />
                        </div>
                      )}
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'rgba(0,0,0,0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: 0,
                          transition: 'opacity 0.2s ease'
                        }}
                        onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                        onMouseLeave={e => e.currentTarget.style.opacity = '0'}
                      >
                        <span style={{ background: 'rgba(255,255,255,0.95)', color: '#111', padding: '4px 10px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 700 }}>
                          <i className="fa-solid fa-expand" /> Preview
                        </span>
                      </div>

                      <div style={{ position: 'absolute', top: '0.4rem', right: '0.4rem', zIndex: 2 }}>
                        <span style={{ background: catObj?.color || 'var(--maroon)', color: '#fff', fontSize: '0.62rem', fontWeight: 700, padding: '2px 7px', borderRadius: 3, letterSpacing: '0.04em' }}>
                          {catObj?.name || img.category || 'Banner'}
                        </span>
                      </div>
                    </div>

                    <div style={{ padding: '0.6rem 0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--white)', flex: 1 }}>
                      <div style={{ fontSize: '0.78rem', color: 'var(--gray-700)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, marginRight: '0.5rem' }}>
                        {img.caption || 'Achievement Poster'}
                      </div>
                      <div style={{ display: 'flex', gap: '0.35rem' }} onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          className="ap-btn"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}
                          onClick={() => handleStartEdit(img)}
                          title="Edit poster"
                        >
                          <i className="fa-solid fa-pen-to-square" />
                        </button>
                        <button
                          type="button"
                          className="ap-btn"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', background: 'var(--gray-100)', color: 'var(--gray-600)', border: '1px solid var(--gray-200)' }}
                          onClick={() => setPreviewImage(img)}
                          title="Preview full size"
                        >
                          <i className="fa-solid fa-eye" />
                        </button>
                        <button
                          type="button"
                          className="ap-btn"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5' }}
                          onClick={() => handleDeleteImage(img.id)}
                          title="Delete poster"
                        >
                          <i className="fa-solid fa-trash" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ════════ UPLOAD TAB ════════ */}
      {activeTab === 'upload' && (
        <div>
          <div className="ap-card" style={{ padding: '1.25rem', maxWidth: 800 }}>
            <h4 style={{ color: 'var(--maroon)', fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '1px solid var(--gray-200)', paddingBottom: '0.5rem' }}>
              <i className="fa-solid fa-cloud-arrow-up" style={{ marginRight: '6px' }} /> Upload New Result Banner / Poster
            </h4>

            <div className="ap-form-group">
              <label>Category *</label>
              <select className="ap-input" value={uploadCat} onChange={e => setUploadCat(e.target.value)} style={{ width: '100%' }}>
                <option value="">— Select Category —</option>
                {categories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              </select>
            </div>

            <div className="ap-form-group">
              <label>Caption / Title (displayed under poster and in preview)</label>
              <input
                className="ap-input"
                value={uploadCaption}
                onChange={e => setUploadCaption(e.target.value)}
                placeholder="e.g. TNPSC Group II / IIA Results 2026 — Batch Selections"
              />
            </div>

            {/* Dimension guide */}
            <div className="ap-hero-dim-guide" style={{ marginBottom: '1.25rem' }}>
              <div className="ap-hero-dim-badge ap-hero-dim-badge--desk" style={{ width: '100%', background: 'rgba(123,27,46,0.06)', border: '1px solid rgba(123,27,46,0.2)' }}>
                <i className="fa-solid fa-ruler-combined" style={{ color: 'var(--maroon)' }}></i>
                <div>
                  <div className="ap-hero-dim-label">📸 Recommended Results Poster / Banner Dimensions</div>
                  <div className="ap-hero-dim-size">Landscape Banner or Portrait Poster • Recommended: <strong>1600 × 1000 px</strong> or <strong>1200 × 1600 px</strong></div>
                  <div className="ap-hero-dim-hint">Works with Google Drive share links, direct image URLs, or file uploads. Automatically converted for high-res web display.</div>
                </div>
              </div>
            </div>

            <AdminImageUpload
              label="Result / Certificate / Poster Image"
              value={urlInput}
              onChange={val => setUrlInput(val)}
              subFolderName="nermai-results"
              maxWidth={1800}
              aspectRatio="auto"
              hint="Landscape 16:10 or Portrait 3:4 • High Resolution"
              placeholder="Paste Google Drive share link, File ID or image URL..."
              toast={toast}
            />

            {/* Live Preview of Uploaded Image */}
            {urlInput && (
              <div style={{ marginTop: '1rem', padding: '0.85rem', background: 'var(--gray-50)', borderRadius: 8, border: '1px solid var(--gray-200)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--gray-700)', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span><i className="fa-solid fa-eye" /> Live Preview</span>
                  <button
                    type="button"
                    className="ap-btn"
                    style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                    onClick={() => setPreviewImage({ url: urlInput, caption: uploadCaption || 'Preview', category: uploadCat })}
                  >
                    <i className="fa-solid fa-expand" /> Full-Screen Preview
                  </button>
                </div>
                <div style={{ maxHeight: 220, overflow: 'hidden', borderRadius: 6, display: 'flex', justifyContent: 'center', background: '#111' }}>
                  <img
                    src={driveStorage.formatImageUrl(urlInput, 1000) || urlInput}
                    alt="Preview"
                    style={{ maxWidth: '100%', maxHeight: 220, objectFit: 'contain' }}
                    onError={(e) => driveStorage.handleImageError(e, '')}
                  />
                </div>
              </div>
            )}

            <button
              className="ap-btn ap-btn-primary"
              onClick={handleAddImage}
              style={{ width: '100%', marginTop: '1.25rem', padding: '0.75rem', fontSize: '0.9rem', justifyContent: 'center' }}
            >
              <i className="fa-solid fa-plus" /> Add Image to Results Gallery
            </button>
          </div>
        </div>
      )}

      {/* ════════ CATEGORIES TAB ════════ */}
      {activeTab === 'categories' && (
        <div>
          <div className="ap-card" style={{ marginBottom: '1rem', padding: '1rem', maxWidth: 800 }}>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.75rem' }}>➕ Add New Category</div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div className="ap-form-group" style={{ flex: 1, minWidth: 160, margin: 0 }}>
                <label>Category Name (e.g. UPSC, UDC, LDC, Banking)</label>
                <input className="ap-input" value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="UPSC Results" onKeyDown={e => e.key === 'Enter' && handleAddCategory()} />
              </div>
              <div className="ap-form-group" style={{ margin: 0 }}>
                <label>Badge Color</label>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.3rem' }}>
                  {DEFAULT_COLORS.map(c => (
                    <div key={c} onClick={() => setNewCatColor(c)} style={{ width: 24, height: 24, background: c, cursor: 'pointer', border: newCatColor === c ? '3px solid var(--ink)' : '1px solid rgba(0,0,0,0.1)', flexShrink: 0, borderRadius: 3 }} />
                  ))}
                </div>
              </div>
              <button className="ap-btn ap-btn-primary" onClick={handleAddCategory} style={{ marginBottom: '0.1rem', whiteSpace: 'nowrap' }}>
                <i className="fa-solid fa-plus" /> Add
              </button>
            </div>
          </div>

          {categories.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-400)', fontSize: '0.85rem' }}>No categories yet. Add your first category above.</div>
          ) : (
            <div className="ap-card" style={{ padding: '0.5rem', maxWidth: 800 }}>
              {categories.map(cat => (
                <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0.75rem', borderBottom: '1px solid var(--gray-100)' }}>
                  <div style={{ width: 14, height: 14, background: cat.color, flexShrink: 0, border: '1px solid rgba(0,0,0,0.1)', borderRadius: 2 }} />
                  <span style={{ flex: 1, fontWeight: 600, fontSize: '0.88rem' }}>{cat.name}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)', fontFamily: 'var(--font-mono)' }}>{images.filter(i => i.category === cat.slug).length} images</span>
                  <button className="ap-btn" style={{ padding: '0.3rem 0.6rem', fontSize: '0.72rem', background: 'none', border: '1px solid var(--gray-200)', color: 'var(--gray-400)', cursor: 'pointer' }}
                    onClick={() => handleDeleteCategory(cat.id)}>
                    <i className="fa-solid fa-trash" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ════════ EDIT POSTER MODAL ════════ */}
      {editingImage && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem'
          }}
          onClick={() => setEditingImage(null)}
        >
          <div
            className="ap-card"
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 680,
              maxHeight: '90vh',
              overflowY: 'auto',
              background: '#ffffff',
              borderRadius: 12,
              padding: '1.5rem',
              boxShadow: '0 20px 50px rgba(0,0,0,0.4)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--gray-200)', paddingBottom: '0.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--maroon)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="fa-solid fa-pen-to-square" /> Edit Result Poster / Banner
              </h3>
              <button
                onClick={() => setEditingImage(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--gray-400)' }}
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <div className="ap-form-group">
              <label>Category *</label>
              <select
                className="ap-input"
                value={editingImage.category || ''}
                onChange={e => setEditingImage(prev => ({ ...prev, category: e.target.value }))}
                style={{ width: '100%' }}
              >
                {categories.map(c => (
                  <option key={c.slug} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="ap-form-group">
              <label>Caption / Title</label>
              <input
                className="ap-input"
                value={editingImage.caption || ''}
                onChange={e => setEditingImage(prev => ({ ...prev, caption: e.target.value }))}
                placeholder="e.g. TNPSC Group II / IIA Results 2026"
              />
            </div>

            <AdminImageUpload
              label="Replace Poster / Banner Image"
              value={editingImage.url || ''}
              onChange={val => setEditingImage(prev => ({ ...prev, url: val }))}
              subFolderName="nermai-results"
              maxWidth={1800}
              aspectRatio="auto"
              hint="Landscape 16:10 or Portrait 3:4"
              placeholder="Paste Google Drive URL or upload image..."
              toast={toast}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', borderTop: '1px solid var(--gray-200)', paddingTop: '1rem' }}>
              <button
                type="button"
                className="ap-btn"
                style={{ background: 'var(--gray-100)', color: 'var(--gray-700)', border: '1px solid var(--gray-300)', padding: '0.55rem 1.25rem' }}
                onClick={() => setEditingImage(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="ap-btn ap-btn-primary"
                style={{ padding: '0.55rem 1.4rem' }}
                onClick={handleSaveEdit}
              >
                <i className="fa-solid fa-floppy-disk" /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════ PREVIEW MODAL ════════ */}
      {previewImage && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem'
          }}
          onClick={() => setPreviewImage(null)}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              background: '#150207',
              border: '1.5px solid #F5D061',
              borderRadius: 12,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 60px rgba(0,0,0,0.9)'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setPreviewImage(null)}
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.7)',
                color: '#F5D061',
                border: '1px solid #F5D061',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
                zIndex: 10
              }}
            >
              <i className="fa-solid fa-xmark" />
            </button>

            {/* Main Preview Image */}
            <div style={{ maxHeight: 'calc(90vh - 70px)', overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a' }}>
              <img
                src={driveStorage.formatImageUrl(previewImage.url, 1800) || previewImage.url}
                alt={previewImage.caption || 'Result Preview'}
                referrerPolicy="no-referrer"
                style={{ maxWidth: '100%', maxHeight: 'calc(90vh - 70px)', objectFit: 'contain', display: 'block' }}
                onError={(e) => driveStorage.handleImageError(e, '')}
              />
            </div>

            {/* Footer Bar with Details */}
            <div style={{ padding: '0.75rem 1.25rem', background: '#1D0308', borderTop: '1px solid rgba(245, 208, 97, 0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ background: '#F5D061', color: '#150207', padding: '2px 8px', borderRadius: 4, fontWeight: 800, fontSize: '0.72rem', textTransform: 'uppercase' }}>
                  {categories.find(c => c.slug === previewImage.category)?.name || previewImage.category || 'Banner'}
                </span>
                <span style={{ color: '#FAF7F2', fontWeight: 600, fontSize: '0.88rem' }}>
                  {previewImage.caption || 'Achievement Poster'}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {previewImage.id && (
                  <button
                    type="button"
                    className="ap-btn"
                    style={{ background: '#2563eb', color: '#fff', fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}
                    onClick={() => {
                      const imgToEdit = previewImage
                      setPreviewImage(null)
                      handleStartEdit(imgToEdit)
                    }}
                  >
                    <i className="fa-solid fa-pen-to-square" /> Edit
                  </button>
                )}
                {previewImage.id && (
                  <button
                    type="button"
                    className="ap-btn"
                    style={{ background: '#dc2626', color: '#fff', fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}
                    onClick={() => handleDeleteImage(previewImage.id)}
                  >
                    <i className="fa-solid fa-trash" /> Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

