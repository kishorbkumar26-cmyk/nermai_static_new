import { useState, useEffect, useRef } from 'react'
import { fbFirestore } from '../firebase/firestore'
import { driveStorage } from '../services/driveStorage'
import { getGoogleDriveCDNUrl } from '../utils/imageOptimizer'
import HomeContentSection from './admin/HomeContentSection'
import FooterContentSection from './admin/FooterContentSection'
import TopBarAdminSection from './admin/TopBarAdminSection'
import OfficeLocationsSection from './admin/OfficeLocationsSection'
import CourseContentSection from './admin/CourseContentSection'
import AdminImageUpload from './admin/AdminImageUpload'
import ResourceManager from './admin/ResourceManager'
import { DEFAULT_TOPPERS_WALL } from './ToppersWall'
import { DEFAULT_TESTIMONIALS_CONFIG } from './Testimonials'
import { DEFAULT_SUCCESS_STORIES_CONFIG } from './SuccessStoriesSection'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'

const richTextModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    ['link', 'clean']
  ],
}

function RichField({ label, value, onChange }) {
  return (
    <div className="ap-form-group">
      <label>{label}</label>
      <div style={{ background: 'white', color: 'black' }}>
        <ReactQuill 
          theme="snow" 
          value={value || ''} 
          onChange={onChange} 
          modules={richTextModules} 
          style={{ height: '200px', marginBottom: '45px' }}
        />
      </div>
    </div>
  )
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([])
  const add = (msg, type = 'success') => {
    const id = Date.now()
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
  }
  return { toasts, success: m => add(m, 'success'), error: m => add(m, 'error'), info: m => add(m, 'info') }
}

// ─── Image upload drop zone ───────────────────────────────────────────────────
function FileDropZone({ onUpload, uploading, progress }) {
  const [drag, setDrag] = useState(false)
  const inputRef = useRef(null)

  const handleFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) return
    await onUpload(file)
  }

  return (
    <div
      className={`ap-file-drop${drag ? ' drag-over' : ''}`}
      onDragOver={e => { e.preventDefault(); setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onDrop={e => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]) }}
      onClick={() => inputRef.current?.click()}
    >
      <i className={`fa-solid ${uploading ? 'fa-spinner fa-spin' : 'fa-cloud-arrow-up'}`}></i>
      <p>{uploading ? `Uploading... ${progress}%` : 'Drag image here or Click to upload'}</p>
      <p style={{ fontSize: '0.7rem', marginTop: '0.5rem', color: 'var(--gray-400)' }}>PNG, JPG, WebP · max 10MB</p>
      <input ref={inputRef} type="file" accept="image/*" onChange={e => handleFile(e.target.files[0])} />
      {uploading && (
        <div className="ap-upload-progress">
          <div className="ap-upload-progress-bar" style={{ width: `${progress}%` }}></div>
        </div>
      )}
    </div>
  )
}

// ─── Section: Hero Slides (Dual Image: Desktop + Mobile) ─────────────────────
function HeroSection({ toast }) {
  const [slides, setSlides] = useState([])
  const [editingId, setEditingId] = useState(null)   // null = "Add new" mode
  const [form, setForm] = useState({
    urlDesktop: '', urlMobile: '',
    ctaLink: '#', scene: 'none'
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const unsub = fbFirestore.onHeroSlidesChanged(setSlides)
    return () => unsub()
  }, [])

  // ── Start editing an existing slide ──────────────────────────────────────
  const handleStartEdit = (slide) => {
    setEditingId(slide.id)
    setForm({
      urlDesktop: slide.urlDesktop || slide.url || '',
      urlMobile:  slide.urlMobile  || '',
      ctaLink:    slide.ctaLink    || '#',
      scene:      slide.scene      || 'none',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
    toast.info(`✏️ Editing slide "${slide.id.substring(0, 5)}"`)
  }

  // ── Cancel edit — go back to "Add new" mode ───────────────────────────────
  const handleCancelEdit = () => {
    setEditingId(null)
    setForm({ urlDesktop: '', urlMobile: '', ctaLink: '#', scene: 'none' })
  }

  // ── Save (Add new OR Update existing) ────────────────────────────────────
  const handleSave = async () => {
    if (!form.urlDesktop && !form.urlMobile) {
      toast.error('At least one image is required')
      return
    }
    setSaving(true)
    try {
      if (editingId) {
        await fbFirestore.updateHeroSlide(editingId, {
          urlDesktop: form.urlDesktop,
          urlMobile:  form.urlMobile,
          ctaLink:    form.ctaLink,
          scene:      form.scene,
          updatedAt:  new Date(),
        })
        toast.success('✅ Slide updated successfully!')
        handleCancelEdit()
      } else {
        await fbFirestore.addHeroSlide(form)
        setForm({ urlDesktop: '', urlMobile: '', ctaLink: '#', scene: 'none' })
        toast.success('✅ Hero slide added successfully!')
      }
    } catch (e) {
      toast.error('Error: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this slide?')) return
    try {
      await fbFirestore.deleteHeroSlide(id)
      if (editingId === id) handleCancelEdit()
      toast.success('Slide deleted successfully')
    } catch (e) { toast.error(e.message) }
  }

  const handleMoveSlide = async (id, direction) => {
    const currentIndex = slides.findIndex(s => s.id === id);
    if (currentIndex < 0) return;
    const targetIndex = currentIndex + direction;
    if (targetIndex < 0 || targetIndex >= slides.length) return;

    const currentSlide = slides[currentIndex];
    const targetSlide  = slides[targetIndex];

    try {
      await Promise.all([
        fbFirestore.updateHeroSlide(currentSlide.id, { order: targetIndex }),
        fbFirestore.updateHeroSlide(targetSlide.id,  { order: currentIndex })
      ]);
      toast.success('Slide order updated');
    } catch (e) {
      toast.error('Failed to reorder: ' + e.message);
    }
  }

  const isEditing = !!editingId

  return (
    <div>
      <h2 className="ap-section-title"><i className="fa-solid fa-images"></i> Hero Slides</h2>

      {/* ── Upload / Edit Form ── */}
      <div className="ap-card" style={ isEditing ? { border: '2px solid var(--saffron)', boxShadow: '0 0 0 4px rgba(230,160,0,0.08)' } : {} }>

        {/* Form header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: isEditing ? 'var(--saffron)' : 'var(--ink)' }}>
            {isEditing
              ? `✏️ Editing Slide — "${editingId.substring(0, 5)}"`
              : '➕ Add New Slide'}
          </div>
          {isEditing && (
            <button className="ap-btn ap-btn-ghost ap-btn-sm" onClick={handleCancelEdit}>
              <i className="fa-solid fa-xmark"></i> Cancel Edit
            </button>
          )}
        </div>

        {/* Dimension guide */}
        <div className="ap-hero-dim-guide">
          <div className="ap-hero-dim-badge ap-hero-dim-badge--desk">
            <i className="fa-solid fa-desktop"></i>
            <div>
              <div className="ap-hero-dim-label">🖥️ PC / Desktop Banner</div>
              <div className="ap-hero-dim-size">Recommended: <strong>1920 × 600 px</strong></div>
              <div className="ap-hero-dim-hint">Wide landscape image • Any ratio • JPG or PNG</div>
            </div>
          </div>
          <div className="ap-hero-dim-badge ap-hero-dim-badge--mob">
            <i className="fa-solid fa-mobile-screen-button"></i>
            <div>
              <div className="ap-hero-dim-label">📱 Mobile Poster</div>
              <div className="ap-hero-dim-size">Recommended: <strong>768 × 1024 px</strong></div>
              <div className="ap-hero-dim-hint">Portrait image • 3:4 ratio • JPG or PNG</div>
            </div>
          </div>
        </div>

        {/* TWO upload zones side by side */}
        <div className="ap-hero-upload-row">
          {/* Desktop upload */}
          <div className="ap-hero-upload-col">
            <AdminImageUpload
              label="Desktop Hero Image"
              value={form.urlDesktop}
              onChange={val => setForm(f => ({ ...f, urlDesktop: val }))}
              subFolderName="nermai-hero-desktop"
              maxWidth={1920}
              aspectRatio="16/5"
              hint="1920 × 600 px • Desktop Banner"
              placeholder="Paste Google Drive URL / ID or Image link for Desktop..."
              toast={toast}
            />
          </div>

          {/* Mobile upload */}
          <div className="ap-hero-upload-col">
            <AdminImageUpload
              label="Mobile Hero Poster"
              value={form.urlMobile}
              onChange={val => setForm(f => ({ ...f, urlMobile: val }))}
              subFolderName="nermai-hero-mobile"
              maxWidth={768}
              aspectRatio="3/4"
              hint="768 × 1024 px • Mobile Poster"
              placeholder="Paste Google Drive URL / ID or Image link for Mobile..."
              toast={toast}
            />
          </div>
        </div>

        {/* Slide metadata */}
        <div style={{ marginTop: '1.25rem' }}>
          <div className="ap-form-row">
            <div className="ap-form-group">
              <label>Destination Link (If user clicks banner)</label>
              <input className="ap-input" placeholder="/courses or https://..." value={form.ctaLink} onChange={e => setForm(f => ({ ...f, ctaLink: e.target.value }))} />
            </div>
            <div className="ap-form-group">
              <label>3D Enhancement Layer</label>
              <select className="ap-input" value={form.scene} onChange={e => setForm(f => ({ ...f, scene: e.target.value }))}>
                <option value="none">None (Pure Image)</option>
                <option value="admissions">Admissions Depth Layer</option>
                <option value="results">Results Depth Layer</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              className={`ap-btn ${isEditing ? 'ap-btn-warning' : 'ap-btn-primary'}`}
              onClick={handleSave}
              disabled={saving}
            >
              <i className={`fa-solid ${saving ? 'fa-spinner fa-spin' : isEditing ? 'fa-floppy-disk' : 'fa-plus'}`}></i>
              {saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Add Banner to Carousel'}
            </button>
            {isEditing && (
              <button className="ap-btn ap-btn-ghost" onClick={handleCancelEdit}>
                <i className="fa-solid fa-xmark"></i> Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Current slides list ── */}
      <div className="ap-card">
        <div style={{ fontWeight: 700, marginBottom: '1rem', color: 'var(--ink)' }}>
          Current Slides ({slides.length})
        </div>
        {slides.length === 0 ? (
          <div className="ap-empty"><i className="fa-solid fa-image"></i><p>No slides found — Add a new slide above</p></div>
        ) : (
          <div className="ap-items-list">
            {slides.map((slide, i) => {
              const deskUrl = driveStorage.formatImageUrl(slide.urlDesktop || slide.url)
              const mobUrl  = driveStorage.formatImageUrl(slide.urlMobile)
              const isBeingEdited = editingId === slide.id
              return (
                <div
                  key={slide.id}
                  className="ap-item"
                  style={isBeingEdited ? { border: '2px solid var(--saffron)', background: 'rgba(230,160,0,0.04)', borderRadius: '8px' } : {}}
                >
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {deskUrl && (
                      <img src={deskUrl} alt="desktop" className="ap-item-thumb" style={{ aspectRatio: '16/5' }}
                        onError={e => { e.target.style.display = 'none' }} />
                    )}
                    {mobUrl && (
                      <img src={mobUrl} alt="mobile" className="ap-item-thumb" style={{ aspectRatio: '3/4', width: '40px' }}
                        onError={e => { e.target.style.display = 'none' }} />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="ap-item-title">
                      Banner {slide.id.substring(0, 5)}
                      {isBeingEdited && <span style={{ marginLeft: '0.5rem', fontSize: '0.65rem', color: 'var(--saffron)', fontWeight: 700 }}>✏️ EDITING</span>}
                    </div>
                    <div className="ap-item-sub">
                      3D Layer: {slide.scene || 'none'}
                      {slide.ctaLink && ` | Link: ${slide.ctaLink}`}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--gray-400)', marginTop: '2px' }}>
                      {deskUrl ? '🖥️ Desktop ✓' : '🖥️ No desktop'}&nbsp;&nbsp;
                      {mobUrl  ? '📱 Mobile ✓'  : '📱 No mobile'}
                    </div>
                  </div>
                  <div className="ap-item-actions" style={{ display: 'flex', gap: '0.25rem', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button className="ap-btn ap-btn-sm" onClick={() => handleMoveSlide(slide.id, -1)} disabled={i === 0} title="Move Up">
                        <i className="fa-solid fa-arrow-up"></i>
                      </button>
                      <button className="ap-btn ap-btn-sm" onClick={() => handleMoveSlide(slide.id, 1)} disabled={i === slides.length - 1} title="Move Down">
                        <i className="fa-solid fa-arrow-down"></i>
                      </button>
                    </div>
                    <button
                      className={`ap-btn ap-btn-sm ${isBeingEdited ? 'ap-btn-warning' : 'ap-btn-secondary'}`}
                      onClick={() => isBeingEdited ? handleCancelEdit() : handleStartEdit(slide)}
                      title={isBeingEdited ? 'Cancel Edit' : 'Edit Slide'}
                    >
                      <i className={`fa-solid ${isBeingEdited ? 'fa-xmark' : 'fa-pen'}`}></i>
                    </button>
                    <button className="ap-btn ap-btn-danger ap-btn-sm" onClick={() => handleDelete(slide.id)}>
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}


// ─── Section: Notices ─────────────────────────────────────────────────────────
function NoticesSection({ toast }) {
  const [notices, setNotices] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ title: '', content: '', priority: 'normal', date: new Date().toISOString().split('T')[0] })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const unsub = fbFirestore.onNoticesChanged(setNotices)
    return () => unsub()
  }, [])

  const handleStartEdit = (n) => {
    setEditingId(n.id)
    setForm({
      title: n.title || '',
      content: n.content || '',
      priority: n.priority || 'normal',
      date: n.date || new Date().toISOString().split('T')[0]
    })
    toast.info(`Editing notice: "${n.title || ''}"`)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setForm({ title: '', content: '', priority: 'normal', date: new Date().toISOString().split('T')[0] })
  }

  const handleSaveOrAdd = async () => {
    if (!form.title.trim()) { toast.error('Title required'); return }
    setSaving(true)
    try {
      if (editingId) {
        await fbFirestore.updateNotice(editingId, form)
        toast.success('Notice updated successfully!')
        handleCancelEdit()
      } else {
        await fbFirestore.addNotice(form)
        toast.success('Notice added successfully!')
        setForm({ title: '', content: '', priority: 'normal', date: new Date().toISOString().split('T')[0] })
      }
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this notice?')) return
    try {
      await fbFirestore.deleteNotice(id)
      if (editingId === id) handleCancelEdit()
      toast.success('Deleted successfully')
    } catch (e) {
      toast.error(e.message)
    }
  }

  return (
    <div>
      <h2 className="ap-section-title"><i className="fa-solid fa-bell"></i> Notices</h2>

      <div className="ap-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: editingId ? 'var(--saffron)' : 'var(--ink)' }}>
            {editingId ? `✏️ Editing Notice: ${form.title}` : '➕ Add New Notice'}
          </div>
          {editingId && (
            <button className="ap-btn ap-btn-ghost ap-btn-sm" onClick={handleCancelEdit}>
              <i className="fa-solid fa-xmark"></i> Cancel Edit
            </button>
          )}
        </div>

        <div className="ap-form-group">
          <label>Title *</label>
          <input className="ap-input" placeholder="TNPSC Group IV Exam 2024" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
        </div>
        <RichField label="Detailed Content (Supports bullets, bold, tables, etc.)" value={form.content} onChange={v => setForm(f => ({ ...f, content: v }))} />
        <div className="ap-form-row" style={{ marginTop: '0.75rem' }}>
          <div className="ap-form-group">
            <label>Priority</label>
            <select className="ap-input ap-select" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
              <option value="normal">Normal</option>
              <option value="high">High Priority</option>
            </select>
          </div>
          <div className="ap-form-group">
            <label>Date</label>
            <input type="date" className="ap-input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button className="ap-btn ap-btn-primary" onClick={handleSaveOrAdd} disabled={saving}>
            {saving ? (
              <><i className="fa-solid fa-spinner fa-spin"></i> Saving...</>
            ) : editingId ? (
              <><i className="fa-solid fa-floppy-disk"></i> Update Notice</>
            ) : (
              <><i className="fa-solid fa-plus"></i> Add Notice</>
            )}
          </button>
          {editingId && (
            <button className="ap-btn ap-btn-ghost" onClick={handleCancelEdit}>
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="ap-card">
        <div style={{ fontWeight: 700, marginBottom: '1rem' }}>Current Notices ({notices.length})</div>
        {notices.length === 0 ? (
          <div className="ap-empty"><i className="fa-solid fa-bell-slash"></i><p>No Notices</p></div>
        ) : (
          <div className="ap-items-list">
            {notices.map(n => (
              <div key={n.id} className="ap-item">
                <div style={{ flex: 1 }}>
                  <div className="ap-item-title">{n.title}</div>
                  <div className="ap-item-sub">{n.date} · <span className={n.priority === 'high' ? 'ap-badge-high' : 'ap-badge-normal'}>{n.priority}</span></div>
                </div>
                <div className="ap-item-actions" style={{ display: 'flex', gap: '0.4rem' }}>
                  <button className="ap-btn" style={{ background: '#3b82f6', color: 'white', padding: '0.4rem 0.6rem' }} onClick={() => handleStartEdit(n)} title="Edit Notice">
                    <i className="fa-solid fa-pen-to-square"></i>
                  </button>
                  <button className="ap-btn ap-btn-danger" style={{ padding: '0.4rem 0.6rem' }} onClick={() => handleDelete(n.id)} title="Delete Notice">
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Shared Customizer: Success Stories & Testimonials ────────────────────────
function SuccessStoriesCustomizer({ config, setConfig, onSave, saving, contextTitle = "Homepage Card" }) {
  const cfg = { ...DEFAULT_SUCCESS_STORIES_CONFIG, ...config }

  return (
    <div>
      <div style={{ background: 'rgba(212, 175, 55, 0.08)', border: '1px solid rgba(212, 175, 55, 0.3)', borderRadius: '8px', padding: '1rem 1.25rem', marginBottom: '1.5rem', fontSize: '0.88rem', color: 'var(--ink)' }}>
        <div style={{ fontWeight: 700, color: 'var(--maroon)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <i className="fa-solid fa-link"></i> Live Homepage Connected Editor
        </div>
        <div>
          Every heading, cursive script note, topper label, testimonial subtitle, and feature pill you edit below updates the live <strong>"From Aspirants to Achievers"</strong> unified section on the home page.
        </div>
      </div>

      {/* 1. Main Header & Badges */}
      <div className="ap-card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <h4 style={{ color: 'var(--maroon)', fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '1px solid var(--gray-200)', paddingBottom: '0.5rem' }}>
          <i className="fa-solid fa-heading" style={{ marginRight: '6px' }} /> 1. Section Header &amp; Subtitle
        </h4>
        <div className="ap-form-row">
          <div className="ap-form-group">
            <label>Top Eyebrow Badge (e.g. NERMAI SUCCESS STORIES)</label>
            <input className="ap-input" value={cfg.eyebrow || ''} onChange={e => setConfig(c => ({ ...c, eyebrow: e.target.value }))} placeholder="NERMAI SUCCESS STORIES" />
          </div>
          <div className="ap-form-group">
            <label>Main Heading Prefix</label>
            <input className="ap-input" value={cfg.titlePrefix || ''} onChange={e => setConfig(c => ({ ...c, titlePrefix: e.target.value }))} placeholder="From Aspirants to" />
          </div>
        </div>
        <div className="ap-form-row">
          <div className="ap-form-group">
            <label>Highlighted Word (Gold Italic Accent)</label>
            <input className="ap-input" value={cfg.titleHighlight || ''} onChange={e => setConfig(c => ({ ...c, titleHighlight: e.target.value }))} placeholder="Achievers" />
          </div>
          <div className="ap-form-group">
            <label>Subtitle Description</label>
            <input className="ap-input" value={cfg.subtitle || ''} onChange={e => setConfig(c => ({ ...c, subtitle: e.target.value }))} placeholder="Real journeys. Real people. Real results..." />
          </div>
        </div>
      </div>

      {/* 2. Top-Left & Top-Right Handwritten Script Callouts */}
      <div className="ap-card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <h4 style={{ color: 'var(--maroon)', fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '1px solid var(--gray-200)', paddingBottom: '0.5rem' }}>
          <i className="fa-solid fa-signature" style={{ marginRight: '6px' }} /> 2. Handwritten Cursive Callout Notes (Top Corners)
        </h4>
        <div className="ap-form-row">
          <div className="ap-form-group">
            <label>Top-Left Handwritten Script (Press Enter for line breaks)</label>
            <textarea className="ap-input ap-textarea" rows={3} value={cfg.scriptTopLeft || ''} onChange={e => setConfig(c => ({ ...c, scriptTopLeft: e.target.value }))} placeholder="Learn&#10;Prepare&#10;Succeed" />
            <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Renders in tilted cursive on top-left of the section</span>
          </div>
          <div className="ap-form-group">
            <label>Top-Right Handwritten Script (Press Enter for line breaks)</label>
            <textarea className="ap-input ap-textarea" rows={3} value={cfg.scriptTopRight || ''} onChange={e => setConfig(c => ({ ...c, scriptTopRight: e.target.value }))} placeholder="Different&#10;Aspirations&#10;One&#10;Destination" />
            <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Renders in tilted cursive on top-right of the section</span>
          </div>
        </div>
      </div>

      {/* 3. Testimonials Sub-Header & Script */}
      <div className="ap-card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <h4 style={{ color: 'var(--maroon)', fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '1px solid var(--gray-200)', paddingBottom: '0.5rem' }}>
          <i className="fa-solid fa-comments" style={{ marginRight: '6px' }} /> 3. Testimonials Carousel Header &amp; Handwritten Script
        </h4>
        <div className="ap-form-row">
          <div className="ap-form-group">
            <label>Testimonials Sub-Heading</label>
            <input className="ap-input" value={cfg.testimonialsHeading || ''} onChange={e => setConfig(c => ({ ...c, testimonialsHeading: e.target.value }))} placeholder="TESTIMONIALS" />
          </div>
          <div className="ap-form-group">
            <label>Testimonials Subtitle Description</label>
            <input className="ap-input" value={cfg.testimonialsSubtitle || ''} onChange={e => setConfig(c => ({ ...c, testimonialsSubtitle: e.target.value }))} placeholder="Honest feedback from our students." />
          </div>
        </div>
        <div className="ap-form-group">
          <label>Testimonials Cursive Script Badge (Right side of Testimonials header)</label>
          <input className="ap-input" value={cfg.testimonialsScript || ''} onChange={e => setConfig(c => ({ ...c, testimonialsScript: e.target.value }))} placeholder="Real Stories. Real Impact." />
        </div>
      </div>

      {/* 4. Our Toppers Sub-Header & Link */}
      <div className="ap-card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <h4 style={{ color: 'var(--maroon)', fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '1px solid var(--gray-200)', paddingBottom: '0.5rem' }}>
          <i className="fa-solid fa-crown" style={{ marginRight: '6px' }} /> 4. Our Toppers Carousel Header &amp; View All Button
        </h4>
        <div className="ap-form-row">
          <div className="ap-form-group">
            <label>Toppers Sub-Heading</label>
            <input className="ap-input" value={cfg.toppersSubheading || ''} onChange={e => setConfig(c => ({ ...c, toppersSubheading: e.target.value }))} placeholder="OUR TOPPERS" />
          </div>
          <div className="ap-form-group">
            <label>Toppers Description Line</label>
            <input className="ap-input" value={cfg.toppersDesc || ''} onChange={e => setConfig(c => ({ ...c, toppersDesc: e.target.value }))} placeholder="Meet our achievers who made it happen..." />
          </div>
        </div>
        <div className="ap-form-row">
          <div className="ap-form-group">
            <label>View All Button Text</label>
            <input className="ap-input" value={cfg.toppersViewAllText || ''} onChange={e => setConfig(c => ({ ...c, toppersViewAllText: e.target.value }))} placeholder="View All Toppers" />
          </div>
          <div className="ap-form-group">
            <label>View All Link URL</label>
            <input className="ap-input" value={cfg.toppersViewAllLink || ''} onChange={e => setConfig(c => ({ ...c, toppersViewAllLink: e.target.value }))} placeholder="/results" />
          </div>
        </div>
      </div>

      {/* 5. Bottom 4 Feature Highlight Pills */}
      <div className="ap-card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <h4 style={{ color: 'var(--maroon)', fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '1px solid var(--gray-200)', paddingBottom: '0.5rem' }}>
          <i className="fa-solid fa-layer-group" style={{ marginRight: '6px' }} /> 5. Bottom 4 Feature Highlight Pills
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          {/* Feature 1 */}
          <div style={{ background: 'var(--gray-50)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--gray-200)' }}>
            <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--maroon)', marginBottom: '0.5rem' }}>🏆 Feature 1</div>
            <div className="ap-form-group" style={{ marginBottom: '0.5rem' }}>
              <label>Icon (FontAwesome Class)</label>
              <input className="ap-input" value={cfg.feature1Icon || ''} onChange={e => setConfig(c => ({ ...c, feature1Icon: e.target.value }))} placeholder="fa-trophy" />
            </div>
            <div className="ap-form-group" style={{ marginBottom: '0.5rem' }}>
              <label>Title</label>
              <input className="ap-input" value={cfg.feature1Title || ''} onChange={e => setConfig(c => ({ ...c, feature1Title: e.target.value }))} placeholder="Expert Guidance" />
            </div>
            <div className="ap-form-group">
              <label>Description</label>
              <input className="ap-input" value={cfg.feature1Desc || ''} onChange={e => setConfig(c => ({ ...c, feature1Desc: e.target.value }))} placeholder="By experienced faculty and mentors" />
            </div>
          </div>

          {/* Feature 2 */}
          <div style={{ background: 'var(--gray-50)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--gray-200)' }}>
            <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--maroon)', marginBottom: '0.5rem' }}>📖 Feature 2</div>
            <div className="ap-form-group" style={{ marginBottom: '0.5rem' }}>
              <label>Icon (FontAwesome Class)</label>
              <input className="ap-input" value={cfg.feature2Icon || ''} onChange={e => setConfig(c => ({ ...c, feature2Icon: e.target.value }))} placeholder="fa-book-open" />
            </div>
            <div className="ap-form-group" style={{ marginBottom: '0.5rem' }}>
              <label>Title</label>
              <input className="ap-input" value={cfg.feature2Title || ''} onChange={e => setConfig(c => ({ ...c, feature2Title: e.target.value }))} placeholder="Structured Learning" />
            </div>
            <div className="ap-form-group">
              <label>Description</label>
              <input className="ap-input" value={cfg.feature2Desc || ''} onChange={e => setConfig(c => ({ ...c, feature2Desc: e.target.value }))} placeholder="From basics to advanced" />
            </div>
          </div>

          {/* Feature 3 */}
          <div style={{ background: 'var(--gray-50)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--gray-200)' }}>
            <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--maroon)', marginBottom: '0.5rem' }}>📈 Feature 3</div>
            <div className="ap-form-group" style={{ marginBottom: '0.5rem' }}>
              <label>Icon (FontAwesome Class)</label>
              <input className="ap-input" value={cfg.feature3Icon || ''} onChange={e => setConfig(c => ({ ...c, feature3Icon: e.target.value }))} placeholder="fa-chart-line" />
            </div>
            <div className="ap-form-group" style={{ marginBottom: '0.5rem' }}>
              <label>Title</label>
              <input className="ap-input" value={cfg.feature3Title || ''} onChange={e => setConfig(c => ({ ...c, feature3Title: e.target.value }))} placeholder="Proven Results" />
            </div>
            <div className="ap-form-group">
              <label>Description</label>
              <input className="ap-input" value={cfg.feature3Desc || ''} onChange={e => setConfig(c => ({ ...c, feature3Desc: e.target.value }))} placeholder="Across competitive exams" />
            </div>
          </div>

          {/* Feature 4 */}
          <div style={{ background: 'var(--gray-50)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--gray-200)' }}>
            <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--maroon)', marginBottom: '0.5rem' }}>👥 Feature 4</div>
            <div className="ap-form-group" style={{ marginBottom: '0.5rem' }}>
              <label>Icon (FontAwesome Class)</label>
              <input className="ap-input" value={cfg.feature4Icon || ''} onChange={e => setConfig(c => ({ ...c, feature4Icon: e.target.value }))} placeholder="fa-users" />
            </div>
            <div className="ap-form-group" style={{ marginBottom: '0.5rem' }}>
              <label>Title</label>
              <input className="ap-input" value={cfg.feature4Title || ''} onChange={e => setConfig(c => ({ ...c, feature4Title: e.target.value }))} placeholder="Diverse Backgrounds" />
            </div>
            <div className="ap-form-group">
              <label>Description</label>
              <input className="ap-input" value={cfg.feature4Desc || ''} onChange={e => setConfig(c => ({ ...c, feature4Desc: e.target.value }))} placeholder="Students from towns, cities and rural areas" />
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Save Button */}
      <div style={{ position: 'sticky', bottom: '1rem', zIndex: 10, marginTop: '1.5rem' }}>
        <button
          type="button"
          className="ap-btn ap-btn-primary"
          onClick={onSave}
          disabled={saving}
          style={{ width: '100%', padding: '1rem', fontSize: '1rem', boxShadow: '0 4px 14px rgba(123, 27, 46, 0.35)' }}
        >
          {saving
            ? <><i className="fa-solid fa-spinner fa-spin" /> Saving Section Texts...</>
            : <><i className="fa-solid fa-floppy-disk" /> Save {contextTitle} Texts</>
          }
        </button>
      </div>
    </div>
  )
}

// ─── Section: Toppers & Results Manager ───────────────────────────────────────
function ToppersSection({ toast }) {
  const [subTab, setSubTab] = useState('achievers')
  const [wallSettings, setWallSettings] = useState(DEFAULT_SUCCESS_STORIES_CONFIG)
  const [savingWall, setSavingWall] = useState(false)
  const [toppers, setToppers] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCat, setFilterCat] = useState('all')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    rank: '',
    exam: 'TNPSC Group II',
    category: 'tnpsc-g2',
    customExam: '',
    year: new Date().getFullYear().toString(),
    photo: '',
    quote: '',
    story: '',
    isFeatured: true,
    visible: true
  })

  useEffect(() => {
    const unsub = fbFirestore.onResultsChanged(items => {
      setToppers(items || [])
    })
    fbFirestore.getSettings().then(s => {
      const saved = s?.homeContent?.successStories || s?.successStories || s?.homeContent?.toppersWall || s?.toppersWall
      if (saved) {
        setWallSettings(prev => ({ ...DEFAULT_SUCCESS_STORIES_CONFIG, ...saved }))
      }
    })
    return () => unsub()
  }, [])

  const handleSaveWall = async () => {
    setSavingWall(true)
    try {
      const s = await fbFirestore.getSettings()
      const updatedHomeContent = { ...(s.homeContent || {}), successStories: wallSettings, toppersWall: wallSettings }
      await fbFirestore.updateSettings({ homeContent: updatedHomeContent, successStories: wallSettings, toppersWall: wallSettings })
      toast.success('Homepage Success Stories card texts updated! Refresh to view live.')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSavingWall(false)
    }
  }

  const handleStartEdit = (t) => {
    setEditingId(t.id)
    const presetExams = [
      'TNPSC Group I', 'TNPSC Group II', 'TNPSC Group IV', 
      'UPSC CSE', 'TN Police SI', 'TN Police Constable', 
      'Banking (SBI PO)', 'Banking (IBPS PO)', 'Puducherry UDC/LDC', 'SSC CGL'
    ]
    const isPreset = presetExams.includes(t.exam)
    setForm({
      name: t.name || '',
      rank: t.rank || '',
      exam: isPreset ? t.exam : 'Others',
      category: t.category || 'upsc',
      customExam: isPreset ? '' : t.exam || '',
      year: t.year || new Date().getFullYear().toString(),
      photo: t.photo || '',
      quote: t.quote || '',
      story: t.story || '',
      isFeatured: t.isFeatured === true,
      visible: t.visible !== false
    })
    setSubTab('achievers')
    toast.info(`Editing details for ${t.name || 'topper'}. Modify fields and click "Update Topper & Result".`)
    const formEl = document.querySelector('.ap-topper-form-card')
    if (formEl) formEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setForm({
      name: '',
      rank: '',
      exam: 'TNPSC Group II',
      category: 'tnpsc-g2',
      customExam: '',
      year: new Date().getFullYear().toString(),
      photo: '',
      quote: '',
      story: '',
      isFeatured: true,
      visible: true
    })
  }

  const handleExamPresetChange = (selected) => {
    let cat = 'others'
    if (selected.includes('UPSC')) cat = 'upsc'
    else if (selected.includes('Group I')) cat = 'tnpsc-g1'
    else if (selected.includes('Group II')) cat = 'tnpsc-g2'
    else if (selected.includes('Group IV')) cat = 'tnpsc-g4'
    else if (selected.includes('Police')) cat = 'police'
    else if (selected.includes('Banking') || selected.includes('SBI') || selected.includes('IBPS')) cat = 'banking'
    else if (selected.includes('Puducherry') || selected.includes('UDC') || selected.includes('LDC')) cat = 'puducherry'
    else if (selected.includes('SSC')) cat = 'ssc'

    setForm(f => ({ ...f, exam: selected, category: cat }))
  }

  const handleSaveOrAdd = async () => {
    if (!form.name.trim() || !form.rank.toString().trim()) {
      toast.error('Student Name and Rank are required')
      return
    }
    
    let finalExam = form.exam
    if (form.exam === 'Others') {
      if (!form.customExam || !form.customExam.trim()) {
        toast.error('Please specify the exam name manually')
        return
      }
      finalExam = form.customExam.trim()
    }

    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        rank: form.rank.toString().trim(),
        exam: finalExam,
        category: form.category || 'upsc',
        year: form.year.toString().trim(),
        photo: form.photo || '',
        quote: form.quote || '',
        story: form.story || '',
        isFeatured: form.isFeatured === true,
        visible: form.visible !== false,
        storageType: (form.photo && form.photo.includes('drive.google.com')) ? 'google_drive' : 'url'
      }

      if (editingId) {
        await fbFirestore.updateResult(editingId, payload)
        toast.success(`Achiever "${payload.name}" updated successfully!`)
        handleCancelEdit()
      } else {
        await fbFirestore.addResult(payload)
        toast.success(`Achiever "${payload.name}" added successfully!`)
        handleCancelEdit()
      }
    } catch (e) {
      toast.error('Operation failed: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this result/topper?')) return
    try {
      await fbFirestore.deleteResult(id)
      if (editingId === id) handleCancelEdit()
      toast.success('Deleted successfully')
    } catch (e) {
      toast.error(e.message)
    }
  }

  const handleToggleFeatured = async (t) => {
    try {
      const newFeatured = !t.isFeatured
      await fbFirestore.updateResult(t.id, { isFeatured: newFeatured })
      toast.success(newFeatured ? 'Marked as ⭐ Featured on Home Screen' : 'Removed from Featured')
    } catch (e) {
      toast.error(e.message)
    }
  }

  const handleToggleVisibility = async (t) => {
    try { 
      const newVisible = t.visible === false ? true : false
      await fbFirestore.updateResult(t.id, { visible: newVisible })
      toast.success(newVisible ? 'Made visible on public website' : 'Hidden from public website')
    } catch (e) {
      toast.error(e.message)
    }
  }

  // Filtered list
  const filteredToppers = toppers.filter(t => {
    const matchCat = filterCat === 'all' || t.category === filterCat || (filterCat === 'featured' && t.isFeatured)
    const matchSearch = !searchQuery || [t.name, t.exam, t.rank, t.year].some(v => v?.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchCat && matchSearch
  })

  return (
    <div>
      <h2 className="ap-section-title">
        <i className="fa-solid fa-trophy" style={{ marginRight: '8px', color: 'var(--gold, #D4AF37)' }}></i>
        Toppers &amp; Results Manager
      </h2>

      {/* Sub-tab Navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--gray-200)', paddingBottom: '0.75rem' }}>
        <button
          onClick={() => setSubTab('achievers')}
          style={{
            padding: '0.5rem 1.25rem',
            border: subTab === 'achievers' ? '2px solid var(--maroon)' : '2px solid var(--gray-200)',
            background: subTab === 'achievers' ? 'var(--maroon)' : 'var(--white)',
            color: subTab === 'achievers' ? 'var(--white)' : 'var(--gray-600)',
            fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}
        >
          <i className="fa-solid fa-users" /> Achievers &amp; Toppers List ({toppers.length})
        </button>

        <button
          onClick={() => setSubTab('homepageCard')}
          style={{
            padding: '0.5rem 1.25rem',
            border: subTab === 'homepageCard' ? '2px solid var(--maroon)' : '2px solid var(--gray-200)',
            background: subTab === 'homepageCard' ? 'var(--maroon)' : 'var(--white)',
            color: subTab === 'homepageCard' ? 'var(--white)' : 'var(--gray-600)',
            fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}
        >
          <i className="fa-solid fa-pen-to-square" /> Customize Homepage Card (Every Word)
        </button>
      </div>

      {/* TAB 2: Homepage Card Text Customizer */}
      {subTab === 'homepageCard' && (
        <SuccessStoriesCustomizer
          config={wallSettings}
          setConfig={setWallSettings}
          onSave={handleSaveWall}
          saving={savingWall}
          contextTitle="Homepage Card"
        />
      )}

      {/* TAB 1: Achievers & Results */}
      {subTab === 'achievers' && (
        <>
          {/* Helper Box */}
          <div style={{ background: 'rgba(212, 175, 55, 0.08)', border: '1px solid rgba(212, 175, 55, 0.3)', borderRadius: '8px', padding: '0.9rem 1.25rem', marginBottom: '1.25rem', fontSize: '0.85rem', color: 'var(--ink)' }}>
            <strong>Unified Data Source:</strong> Achievers added here appear across the website in both the <strong>Results Page (/results)</strong> and the <strong>Home Screen Toppers Wall</strong>. Check <em>"Show on Home Screen"</em> to spotlight them in the featured carousel.
          </div>

      <div className="ap-card ap-topper-form-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: editingId ? 'var(--saffron)' : 'var(--ink)' }}>
            {editingId ? `✏️ Editing Achiever: ${form.name || 'Student'}` : '➕ Add New Result & Topper'}
          </div>
          {editingId && (
            <button className="ap-btn ap-btn-ghost ap-btn-sm" onClick={handleCancelEdit}>
              <i className="fa-solid fa-xmark"></i> Cancel Edit
            </button>
          )}
        </div>

        <div className="ap-form-row">
          <div className="ap-form-group">
            <label>Student Full Name *</label>
            <input className="ap-input" placeholder="e.g. S. Priya" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="ap-form-group">
            <label>Rank / AIR / Selection Rank *</label>
            <input className="ap-input" placeholder="e.g. 1 or 12 or AIR 45" value={form.rank} onChange={e => setForm(f => ({ ...f, rank: e.target.value }))} />
          </div>
        </div>

        <div className="ap-form-row">
          <div className="ap-form-group">
            <label>Exam Preset</label>
            <select className="ap-input ap-select" value={form.exam} onChange={e => handleExamPresetChange(e.target.value)}>
              <option value="TNPSC Group I">TNPSC Group I</option>
              <option value="TNPSC Group II">TNPSC Group II</option>
              <option value="TNPSC Group IV">TNPSC Group IV</option>
              <option value="UPSC CSE">UPSC CSE</option>
              <option value="Puducherry UDC/LDC">Puducherry UDC/LDC</option>
              <option value="TN Police SI">TN Police SI</option>
              <option value="TN Police Constable">TN Police Constable</option>
              <option value="Banking (SBI PO)">Banking (SBI PO)</option>
              <option value="Banking (IBPS PO)">Banking (IBPS PO)</option>
              <option value="SSC CGL">SSC CGL</option>
              <option value="Others">Others (Custom)</option>
            </select>
            {form.exam === 'Others' && (
              <input 
                className="ap-input" 
                style={{ marginTop: '0.5rem' }} 
                placeholder="Type custom exam name..." 
                value={form.customExam || ''} 
                onChange={e => setForm(f => ({ ...f, customExam: e.target.value }))} 
              />
            )}
          </div>

          <div className="ap-form-group">
            <label>Category Filter Tag</label>
            <select className="ap-input ap-select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              <option value="upsc">UPSC</option>
              <option value="tnpsc-g1">TNPSC Group I</option>
              <option value="tnpsc-g2">TNPSC Group II</option>
              <option value="tnpsc-g4">TNPSC Group IV</option>
              <option value="puducherry">Puducherry Govt.</option>
              <option value="police">Police (SI / Constable)</option>
              <option value="banking">Banking</option>
              <option value="ssc">SSC</option>
              <option value="others">Others</option>
            </select>
          </div>

          <div className="ap-form-group">
            <label>Exam Year</label>
            <input className="ap-input" placeholder="2024" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} />
          </div>
        </div>

        {/* Feature & Visibility Toggles */}
        <div style={{ display: 'flex', gap: '1.5rem', margin: '0.75rem 0 1.25rem 0', flexWrap: 'wrap', padding: '0.85rem', background: 'var(--gray-50, #f9fafb)', borderRadius: '6px', border: '1px solid var(--gray-200)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', color: 'var(--ink)' }}>
            <input 
              type="checkbox" 
              checked={form.isFeatured} 
              onChange={e => setForm(f => ({ ...f, isFeatured: e.target.checked }))} 
              style={{ width: 18, height: 18, accentColor: 'var(--maroon)' }}
            />
            <span>⭐ Feature on Home Screen (Top 6 Spotlight)</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', color: 'var(--ink)' }}>
            <input 
              type="checkbox" 
              checked={form.visible} 
              onChange={e => setForm(f => ({ ...f, visible: e.target.checked }))} 
              style={{ width: 18, height: 18, accentColor: 'var(--maroon)' }}
            />
            <span>👁️ Publicly Visible</span>
          </label>
        </div>

        <AdminImageUpload
          label="Student / Topper Photo"
          value={form.photo}
          onChange={val => setForm(f => ({ ...f, photo: val }))}
          subFolderName="nermai-toppers"
          maxWidth={800}
          aspectRatio="1/1"
          hint="Square 1:1 • 600 × 600 px (Upload file, paste Google Drive ID/link or image URL)"
          placeholder="Paste Google Drive URL / ID or Web photo link..."
          toast={toast}
        />

        <div className="ap-form-group" style={{ marginTop: '1rem' }}>
          <label>Speech Bubble Quote / Short Highlight</label>
          <input className="ap-input" placeholder='e.g. "Nermai gave me the right direction and confidence."' value={form.quote} onChange={e => setForm(f => ({ ...f, quote: e.target.value }))} />
        </div>

        <div className="ap-form-group">
          <label>Detailed Preparation Journey &amp; Strategy (Shown in "Read Story" modal)</label>
          <textarea className="ap-input ap-textarea" style={{ minHeight: '90px' }} placeholder="Detail the student's journey, preparation routine, and mentoring experience..." value={form.story} onChange={e => setForm(f => ({ ...f, story: e.target.value }))} />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '1rem' }}>
          <button className="ap-btn ap-btn-primary" onClick={handleSaveOrAdd} disabled={saving}>
            {saving ? (
              <><i className="fa-solid fa-spinner fa-spin"></i> Saving...</>
            ) : editingId ? (
              <><i className="fa-solid fa-floppy-disk" style={{ marginRight: '6px' }}></i> Update Achiever</>
            ) : (
              <><i className="fa-solid fa-plus" style={{ marginRight: '6px' }}></i> Add Achiever to Wall</>
            )}
          </button>
          {editingId && (
            <button className="ap-btn ap-btn-ghost" onClick={handleCancelEdit}>
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* List Card */}
      <div className="ap-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <span style={{ fontWeight: 700, fontSize: '1rem' }}>All Achievers &amp; Results ({filteredToppers.length})</span>
            <div style={{ fontSize: '0.78rem', color: 'var(--gray-400)', marginTop: '2px' }}>
              Showing {filteredToppers.length} of {toppers.length} total entries
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <input 
              type="search" 
              className="ap-input" 
              placeholder="Search student or exam..." 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '220px', padding: '0.35rem 0.65rem', fontSize: '0.82rem' }}
            />
            <select 
              className="ap-input ap-select" 
              value={filterCat} 
              onChange={e => setFilterCat(e.target.value)}
              style={{ width: '150px', padding: '0.35rem 0.65rem', fontSize: '0.82rem' }}
            >
              <option value="all">All Categories</option>
              <option value="featured">⭐ Featured Only</option>
              <option value="upsc">UPSC</option>
              <option value="tnpsc-g1">TNPSC G1</option>
              <option value="tnpsc-g2">TNPSC G2</option>
              <option value="tnpsc-g4">TNPSC G4</option>
              <option value="puducherry">Puducherry</option>
              <option value="police">Police</option>
              <option value="banking">Banking</option>
              <option value="ssc">SSC</option>
              <option value="others">Others</option>
            </select>
          </div>
        </div>

        {filteredToppers.length === 0 ? (
          <div className="ap-empty">
            <i className="fa-solid fa-trophy" style={{ fontSize: '2rem', color: 'var(--gray-300)', marginBottom: '0.5rem' }}></i>
            <p>No achievers match the filters</p>
          </div>
        ) : (
          <div className="ap-items-list">
            {filteredToppers.map(t => {
              const photoUrl = driveStorage.formatImageUrl(t.photo)
              const isHidden = t.visible === false
              const isFeatured = t.isFeatured === true
              const isBeingEdited = editingId === t.id

              return (
                <div 
                  key={t.id} 
                  className="ap-item" 
                  style={{ 
                    opacity: isHidden ? 0.6 : 1, 
                    border: isBeingEdited ? '2px solid var(--saffron)' : '1px solid var(--gray-100)', 
                    background: isBeingEdited ? 'rgba(212, 175, 55, 0.06)' : undefined 
                  }}
                >
                  {photoUrl ? (
                    <img src={photoUrl} alt={t.name} className="ap-item-thumb" style={{ borderRadius: '50%', width: 48, height: 48, objectFit: 'cover' }} onError={e => { e.target.style.display = 'none' }} />
                  ) : (
                    <div className="ap-item-thumb" style={{ width: 48, height: 48, background: 'linear-gradient(135deg, #7b1b2e, #4a0e1c)', color: '#f5d061', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
                      {(t.name || '?')[0].toUpperCase()}
                    </div>
                  )}

                  <div style={{ flex: 1 }}>
                    <div className="ap-item-title" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700 }}>{t.name}</span>
                      <span style={{ fontSize: '0.75rem', background: 'var(--gold-light, #f5d061)', color: '#1A1008', padding: '1px 6px', borderRadius: '3px', fontWeight: 700 }}>
                        Rank #{t.rank}
                      </span>
                      {isFeatured && (
                        <span style={{ fontSize: '0.7rem', background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d', padding: '1px 6px', borderRadius: '3px', fontWeight: 600 }}>
                          ⭐ Home Featured
                        </span>
                      )}
                      {isHidden && (
                        <span style={{ fontSize: '0.7rem', background: 'var(--gray-200)', padding: '1px 6px', borderRadius: '3px', color: 'var(--gray-600)' }}>
                          Hidden
                        </span>
                      )}
                      {isBeingEdited && (
                        <span style={{ fontSize: '0.7rem', background: 'var(--saffron)', color: 'white', padding: '1px 6px', borderRadius: '3px' }}>
                          Editing
                        </span>
                      )}
                    </div>
                    <div className="ap-item-sub" style={{ marginTop: '3px' }}>
                      <strong>{t.exam}</strong> · {t.year} {t.category ? `(${t.category.toUpperCase()})` : ''}
                      {t.quote && <div style={{ fontStyle: 'italic', fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '2px' }}>"{t.quote}"</div>}
                    </div>
                  </div>

                  <div className="ap-item-actions" style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <button
                      className="ap-btn"
                      style={{ background: '#3b82f6', color: 'white', padding: '0.4rem 0.6rem' }}
                      onClick={() => handleStartEdit(t)}
                      title="Edit Achiever Details"
                    >
                      <i className="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button
                      className="ap-btn"
                      style={{ 
                        background: isFeatured ? '#f59e0b' : 'var(--gray-100)', 
                        color: isFeatured ? 'white' : 'var(--gray-600)', 
                        padding: '0.4rem 0.6rem',
                        border: '1px solid var(--gray-300)'
                      }}
                      onClick={() => handleToggleFeatured(t)}
                      title={isFeatured ? 'Remove from Home Screen Featured' : 'Feature on Home Screen (Top 6)'}
                    >
                      <i className="fa-solid fa-star"></i>
                    </button>
                    <button
                      className="ap-btn"
                      style={{ 
                        background: isHidden ? 'var(--gray-200)' : '#10b981', 
                        color: isHidden ? 'var(--gray-600)' : 'white', 
                        padding: '0.4rem 0.6rem' 
                      }}
                      onClick={() => handleToggleVisibility(t)}
                      title={isHidden ? 'Show on Public Site' : 'Hide from Public Site'}
                    >
                      <i className={`fa-solid ${isHidden ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                    <button
                      className="ap-btn ap-btn-danger"
                      style={{ padding: '0.4rem 0.6rem' }}
                      onClick={() => handleDelete(t.id)}
                      title="Delete Entry"
                    >
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      </>
      )}
    </div>
  )
}

// ─── Section: Testimonials ────────────────────────────────────────────────────
function TestimonialsSection({ toast }) {
  const [items, setItems] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ name: '', role: '', quote: '', imageUrl: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const unsub = fbFirestore.onTestimonialsChanged(setItems)
    return () => unsub()
  }, [])

  const handleStartEdit = (t) => {
    setEditingId(t.id)
    setForm({
      name: t.name || '',
      role: t.role || '',
      quote: t.quote || '',
      imageUrl: t.imageUrl || t.avatar || t.photo || ''
    })
    toast.info(`Editing review for ${t.name || 'student'}`)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setForm({ name: '', role: '', quote: '', imageUrl: '' })
  }

  const handleSaveOrAdd = async () => {
    if (!form.name.trim() || !form.quote.trim()) { toast.error('Name and quote required'); return }
    setSaving(true)
    try {
      if (editingId) {
        await fbFirestore.updateTestimonial(editingId, form)
        toast.success('Testimonial updated successfully!')
        handleCancelEdit()
      } else {
        await fbFirestore.addTestimonial(form)
        toast.success('Testimonial added successfully!')
        setForm({ name: '', role: '', quote: '', imageUrl: '' })
      }
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this testimonial?')) return
    try {
      await fbFirestore.deleteTestimonial(id)
      if (editingId === id) handleCancelEdit()
      toast.success('Deleted successfully')
    } catch (e) {
      toast.error(e.message)
    }
  }

  return (
    <div>
      <h2 className="ap-section-title"><i className="fa-solid fa-quote-right"></i> Testimonials</h2>

      <div className="ap-card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: editingId ? 'var(--saffron)' : 'var(--ink)' }}>
            {editingId ? `✏️ Editing Testimonial: ${form.name}` : '➕ Add New Testimonial'}
          </div>
          {editingId && (
            <button type="button" className="ap-btn ap-btn-ghost ap-btn-sm" onClick={handleCancelEdit}>
              <i className="fa-solid fa-xmark"></i> Cancel Edit
            </button>
          )}
        </div>

        <div className="ap-form-row">
          <div className="ap-form-group">
            <label>Student Name *</label>
            <input className="ap-input" placeholder="Anitha Devi" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="ap-form-group">
            <label>Role / Exam / Subtitle</label>
            <input className="ap-input" placeholder="TNPSC Group IV Aspirant" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} />
          </div>
        </div>

        <div className="ap-form-group">
          <label>Quote / Honest Review *</label>
          <textarea className="ap-input ap-textarea" rows={3} placeholder="Studying at Nermai made complex topics simple..." value={form.quote} onChange={e => setForm(f => ({ ...f, quote: e.target.value }))} />
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.8rem', color: 'var(--gray-700)' }}>
            Student Photo / Avatar (Optional)
          </label>
          <AdminImageUpload
            value={form.imageUrl || ''}
            onChange={url => setForm(f => ({ ...f, imageUrl: url }))}
            subFolderName="testimonials"
            hint="Square 1:1 ratio (e.g. 200x200px)"
            aspectRatio="1/1"
            previewHeight={70}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button type="button" className="ap-btn ap-btn-primary" onClick={handleSaveOrAdd} disabled={saving}>
            {saving ? (
              <><i className="fa-solid fa-spinner fa-spin"></i> Saving...</>
            ) : editingId ? (
              <><i className="fa-solid fa-floppy-disk"></i> Update Testimonial</>
            ) : (
              <><i className="fa-solid fa-plus"></i> Add Testimonial</>
            )}
          </button>
          {editingId && (
            <button type="button" className="ap-btn ap-btn-ghost" onClick={handleCancelEdit}>
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="ap-card">
        <div style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '1rem' }}>All Student Testimonials ({items.length})</div>
        {items.length === 0 ? (
          <div className="ap-empty"><i className="fa-solid fa-comments"></i><p>No Testimonials</p></div>
        ) : (
          <div className="ap-items-list">
            {items.map(t => {
              const avatarUrl = t.imageUrl || t.avatar || t.photo ? driveStorage.formatImageUrl(t.imageUrl || t.avatar || t.photo) : null
              return (
                <div key={t.id} className="ap-item" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={t.name} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none' }} />
                  ) : (
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--maroon)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                      {(t.name || 'A')[0].toUpperCase()}
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div className="ap-item-title" style={{ fontWeight: 700 }}>{t.name}</div>
                    <div className="ap-item-sub" style={{ color: 'var(--gray-500)', fontSize: '0.8rem' }}>{t.role}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--gray-600)', marginTop: '0.25rem', fontStyle: 'italic' }}>"{t.quote?.slice(0, 95)}{t.quote?.length > 95 ? '...' : ''}"</div>
                  </div>
                  <div className="ap-item-actions" style={{ display: 'flex', gap: '0.4rem' }}>
                    <button type="button" className="ap-btn" style={{ background: '#3b82f6', color: 'white', padding: '0.4rem 0.6rem' }} onClick={() => handleStartEdit(t)} title="Edit Testimonial">
                      <i className="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button type="button" className="ap-btn ap-btn-danger" style={{ padding: '0.4rem 0.6rem' }} onClick={() => handleDelete(t.id)} title="Delete Testimonial">
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Section: Gallery ─────────────────────────────────────────────────────────
function GallerySection({ toast }) {
  const [images, setImages] = useState([])
  const [form, setForm] = useState({ url: '', caption: '' })
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const unsub = fbFirestore.onGalleryChanged(setImages)
    return () => unsub()
  }, [])

  const handleUpload = async (file) => {
    setUploading(true); setProgress(20)
    try {
      const result = await driveStorage.processAndUploadImage(file, { subFolderName: 'nermai-gallery' })
      setProgress(90)
      setForm(f => ({ ...f, url: result.url }))
      toast.success('Gallery photo uploaded!')
    } catch (e) { toast.error(e.message) }
    finally { setUploading(false); setProgress(0) }
  }

  const handleAdd = async () => {
    if (!form.url) { toast.error('Image URL is required'); return }
    try {
      await fbFirestore.addGalleryImage(form)
      setForm({ url: '', caption: '' })
      toast.success('Image added successfully!')
    } catch (e) { toast.error(e.message) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this image?')) return
    try { await fbFirestore.deleteGalleryImage(id); toast.success('Deleted successfully') }
    catch (e) { toast.error(e.message) }
  }

  return (
    <div>
      <h2 className="ap-section-title"><i className="fa-solid fa-images"></i> Gallery</h2>
      
      {/* Dimension guide */}
      <div className="ap-hero-dim-guide" style={{ marginBottom: '1.25rem' }}>
        <div className="ap-hero-dim-badge ap-hero-dim-badge--desk" style={{ width: '100%', background: 'rgba(123,27,46,0.06)', border: '1px solid rgba(123,27,46,0.2)' }}>
          <i className="fa-solid fa-ruler-combined" style={{ color: 'var(--maroon)' }}></i>
          <div>
            <div className="ap-hero-dim-label">📸 Recommended Gallery Photo Dimensions</div>
            <div className="ap-hero-dim-size">Landscape 4:3 or 16:9 Aspect Ratio • Recommended: <strong>1200 × 800 px</strong> (min 800 × 600 px)</div>
            <div className="ap-hero-dim-hint">Event, classroom, campus, or felicitation photos • JPG, PNG, WebP format</div>
          </div>
        </div>
      </div>

      <div className="ap-card">
        <AdminImageUpload
          label="Gallery Photo"
          value={form.url}
          onChange={val => setForm(f => ({ ...f, url: val }))}
          subFolderName="nermai-gallery"
          maxWidth={1600}
          aspectRatio="cover"
          hint="1200 × 800 px • Landscape"
          placeholder="Paste Google Drive share link, Drive ID or image URL..."
          toast={toast}
        />
        <div className="ap-form-group">
          <label>Caption (Optional)</label>
          <input className="ap-input" placeholder="Student Felicitation 2024" value={form.caption} onChange={e => setForm(f => ({ ...f, caption: e.target.value }))} />
        </div>
        <button className="ap-btn ap-btn-primary" onClick={handleAdd}>
          <i className="fa-solid fa-plus"></i> Add to Gallery
        </button>
      </div>

      <div className="ap-card">
        <div style={{ fontWeight: 700, marginBottom: '1rem' }}>Photos ({images.length})</div>
        {images.length === 0 ? (
          <div className="ap-empty"><i className="fa-solid fa-image"></i><p>No images</p></div>
        ) : (
          <div className="ap-items-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '1rem' }}>
            {images.map(img => {
              const url = driveStorage.formatImageUrl(img.url)
              return (
                <div key={img.id} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--gray-200)', aspectRatio: '1/1' }}>
                  <img src={url} alt={img.caption} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button 
                    className="ap-btn ap-btn-danger ap-btn-sm" 
                    onClick={() => handleDelete(img.id)}
                    style={{ position: 'absolute', top: 4, right: 4, padding: '4px 8px' }}
                  >
                    <i className="fa-solid fa-trash"></i>
                  </button>
                  {img.caption && (
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.7)', color: 'white', fontSize: '0.7rem', padding: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {img.caption}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Section: Results ─────────────────────────────────────────────────────────
const EXAM_CATEGORY_OPTIONS = [
  { value: 'upsc',     label: 'UPSC' },
  { value: 'tnpsc-g1', label: 'TNPSC Group I' },
  { value: 'tnpsc-g2', label: 'TNPSC Group II' },
  { value: 'tnpsc-g4', label: 'TNPSC Group IV' },
  { value: 'police',   label: 'Police' },
  { value: 'banking',  label: 'Banking' },
  { value: 'ssc',      label: 'SSC' },
]

function ResultsSection({ toast }) {
  const [results, setResults] = useState([])
  const [form, setForm] = useState({
    name: '', rank: '', exam: '', year: new Date().getFullYear().toString(),
    photo: '', quote: '', category: 'upsc', isFeatured: false
  })
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const unsub = fbFirestore.onResultsChanged(setResults)
    return () => unsub()
  }, [])

  const handleStartEdit = (r) => {
    setEditingId(r.id)
    setForm({ name: r.name||'', rank: r.rank||'', exam: r.exam||'', year: r.year||'', photo: r.photo||'', quote: r.quote||'', category: r.category||'upsc', isFeatured: !!r.isFeatured })
  }
  const handleCancelEdit = () => {
    setEditingId(null)
    setForm({ name: '', rank: '', exam: '', year: new Date().getFullYear().toString(), photo: '', quote: '', category: 'upsc', isFeatured: false })
  }

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Student name is required'); return }
    setSaving(true)
    try {
      if (editingId) {
        await fbFirestore.updateResult(editingId, form)
        toast.success('Result updated!')
        handleCancelEdit()
      } else {
        await fbFirestore.addResult(form)
        toast.success('Result added!')
        setForm({ name: '', rank: '', exam: '', year: new Date().getFullYear().toString(), photo: '', quote: '', category: 'upsc', isFeatured: false })
      }
    } catch (e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this result entry?')) return
    try { await fbFirestore.deleteResult(id); toast.success('Deleted') }
    catch (e) { toast.error(e.message) }
  }

  const handleToggleFeatured = async (r) => {
    try {
      await fbFirestore.updateResult(r.id, { isFeatured: !r.isFeatured })
      toast.success(r.isFeatured ? 'Removed from featured' : 'Marked as featured')
    } catch (e) { toast.error(e.message) }
  }

  return (
    <div>
      <h2 className="ap-section-title"><i className="fa-solid fa-medal" /> Results Manager</h2>
      <div style={{ marginBottom: '0.75rem', padding: '0.65rem 1rem', background: 'rgba(123,27,46,0.07)', borderRadius: 6, fontSize: '0.82rem', color: 'var(--maroon)', borderLeft: '3px solid var(--maroon)' }}>
        <i className="fa-solid fa-circle-info" style={{ marginRight: 6 }} />
        Entries added here appear on the <strong>/results</strong> page. Mark up to 5 as <strong>Featured</strong> to appear in the top showcase.
      </div>

      <div className="ap-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: editingId ? 'var(--saffron)' : 'var(--ink)' }}>
            {editingId ? `✏️ Editing: ${form.name}` : '➕ Add New Result'}
          </div>
          {editingId && (
            <button className="ap-btn ap-btn-ghost ap-btn-sm" onClick={handleCancelEdit}>
              <i className="fa-solid fa-xmark" /> Cancel Edit
            </button>
          )}
        </div>

        <div className="ap-form-row">
          <div className="ap-form-group">
            <label>Student Name *</label>
            <input className="ap-input" placeholder="Arjun Kumar" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="ap-form-group">
            <label>Rank</label>
            <input className="ap-input" placeholder="1" value={form.rank} onChange={e => setForm(f => ({ ...f, rank: e.target.value }))} />
          </div>
        </div>

        <div className="ap-form-row">
          <div className="ap-form-group">
            <label>Exam Category</label>
            <select className="ap-input ap-select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {EXAM_CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="ap-form-group">
            <label>Exam Name (display text)</label>
            <input className="ap-input" placeholder="UPSC Civil Services - 2026" value={form.exam} onChange={e => setForm(f => ({ ...f, exam: e.target.value }))} />
          </div>
          <div className="ap-form-group">
            <label>Year</label>
            <input className="ap-input" placeholder="2026" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} />
          </div>
        </div>

        <AdminImageUpload
          label="Student Photo (optional)"
          value={form.photo}
          onChange={val => setForm(f => ({ ...f, photo: val }))}
          subFolderName="nermai-results"
          maxWidth={400}
          aspectRatio="1/1"
          hint="400 × 400 px • Square portrait photo"
          placeholder="Paste Google Drive URL / ID or image link..."
          toast={toast}
        />

        <div className="ap-form-group">
          <label>Quote / Message (optional)</label>
          <textarea className="ap-input ap-textarea" rows={2} placeholder="A journey of discipline leads to a life of purpose." value={form.quote} onChange={e => setForm(f => ({ ...f, quote: e.target.value }))} />
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: '1rem', fontWeight: 600, fontSize: '0.88rem' }}>
          <input
            type="checkbox" checked={form.isFeatured}
            onChange={e => setForm(f => ({ ...f, isFeatured: e.target.checked }))}
            style={{ width: 16, height: 16, accentColor: 'var(--maroon)' }}
          />
          Mark as Featured Achiever (appears in top showcase section)
        </label>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="ap-btn ap-btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <><i className="fa-solid fa-spinner fa-spin" /> Saving...</> : editingId ? <><i className="fa-solid fa-floppy-disk" /> Update Result</> : <><i className="fa-solid fa-plus" /> Add Result</>}
          </button>
          {editingId && <button className="ap-btn ap-btn-ghost" onClick={handleCancelEdit}>Cancel</button>}
        </div>
      </div>

      <div className="ap-card">
        <div style={{ fontWeight: 700, marginBottom: '1rem' }}>Results ({results.length})</div>
        {results.length === 0 ? (
          <div className="ap-empty"><i className="fa-solid fa-trophy" /><p>No results yet. Add the first entry above.</p></div>
        ) : (
          <div className="ap-items-list">
            {results.map(r => (
              <div key={r.id} className="ap-item">
                <div style={{ flex: 1 }}>
                  <div className="ap-item-title">
                    {r.name}
                    {r.isFeatured && <span style={{ marginLeft: 6, background: '#f5d061', color: '#4a0e1c', fontSize: '0.65rem', fontWeight: 800, padding: '2px 6px', borderRadius: 3 }}>★ FEATURED</span>}
                  </div>
                  <div className="ap-item-sub">
                    {r.exam || r.category} · Rank {r.rank || '–'} · {r.year}
                  </div>
                  {r.quote && <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', fontStyle: 'italic', marginTop: 2 }}>"{r.quote?.slice(0, 70)}{r.quote?.length > 70 ? '...' : ''}"</div>}
                </div>
                <div className="ap-item-actions" style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                  <button
                    className="ap-btn ap-btn-sm"
                    style={{ background: r.isFeatured ? '#f5d061' : 'var(--gray-100)', color: r.isFeatured ? '#4a0e1c' : 'var(--gray-500)', padding: '0.4rem 0.6rem', border: '1px solid var(--gray-200)' }}
                    onClick={() => handleToggleFeatured(r)}
                    title={r.isFeatured ? 'Remove from featured' : 'Mark as featured'}
                  >
                    <i className="fa-solid fa-star" />
                  </button>
                  <button className="ap-btn" style={{ background: '#3b82f6', color: 'white', padding: '0.4rem 0.6rem' }} onClick={() => handleStartEdit(r)} title="Edit">
                    <i className="fa-solid fa-pen-to-square" />
                  </button>
                  <button className="ap-btn ap-btn-danger" style={{ padding: '0.4rem 0.6rem' }} onClick={() => handleDelete(r.id)} title="Delete">
                    <i className="fa-solid fa-trash" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Section: Drive Config ────────────────────────────────────────────────────
function DriveSection({ toast }) {
  const [config, setConfig] = useState(driveStorage.getConfig())
  const [pastedUrl, setPastedUrl] = useState('')
  const [convertedUrl, setConvertedUrl] = useState('')
  const [passcode, setPasscode] = useState('')
  const [copiedScript, setCopiedScript] = useState(false)
  const [showScriptCode, setShowScriptCode] = useState(false)
  const [isTesting, setIsTesting] = useState(false)

  const APPS_SCRIPT_TEMPLATE = `/**
 * NERMAI IAS Academy — Google Apps Script Web App
 * ─────────────────────────────────────────────────────────────────────────────
 * PURPOSE
 *   Central upload endpoint for the NERMAI Static website admin panel.
 *   Handles image uploads (with page-based folder organization) and PDF uploads,
 *   with delete and connection-test actions.
 *
 * HOW TO DEPLOY
 *   1. Go to https://script.google.com/ → New Project → paste this code
 *   2. Click Deploy → New Deployment → Web App
 *      • Execute as: "Me (your Google account)"
 *      • Who has access: "Anyone" (required for CORS from browser)
 *   3. Copy the deployment URL → paste in NERMAI Admin → Drive & Storage Settings
 *
 * FOLDER STRUCTURE CREATED IN GOOGLE DRIVE
 *   [Root Folder / Specified Folder]
 *   ├── nermai-home/            ← Hero banners, gallery, about images, etc.
 *   ├── nermai-results/         ← Topper photos, result certificates
 *   ├── nermai-courses/         ← Course thumbnails
 *   ├── nermai-topbar/          ← Ticker, announcements
 *   ├── nermai-testimonials/    ← Review / testimonial images
 *   ├── nermai-contact/         ← Contact page images
 *   ├── nermai-gallery/         ← Gallery section photos
 *   ├── nermai-resources/       ← PDFs, study materials, notes
 *   ├── nermai-why/             ← Why Nermai page images
 *   └── nermai-misc/            ← Everything else
 *
 * FRONTEND REQUEST FIELDS (what driveStorage.js sends)
 *   {
 *     folderId:      string   — root Google Drive folder ID (optional)
 *     subFolderName: string   — page-scoped subfolder (e.g. "nermai-hero-desktop")
 *     filename:      string   — file name with extension
 *     mimeType:      string   — MIME type (image/jpeg, application/pdf, etc.)
 *     base64:        string   — base64-encoded file data (no data-URL prefix)
 *     test:          boolean  — if true, just tests connection
 *     action:        string   — "delete" to trash a file
 *     fileId:        string   — required when action === "delete"
 *     redirectLink:  string   — optional external URL to associate with the upload
 *   }
 *
 * RESPONSE FIELDS
 *   Success upload:
 *   {
 *     status:       "success"
 *     fileId:       string   — Google Drive file ID
 *     url:          string   — CDN thumbnail URL  (lh3.googleusercontent.com)
 *     viewUrl:      string   — Drive shareable view link
 *     directUrl:    string   — drive.google.com/uc?export=view link
 *     previewUrl:   string   — Embeddable preview URL (iframes / PDFs)
 *     downloadUrl:  string   — Direct download URL
 *     redirectLink: string   — Echoed back if provided by caller
 *     mimeType:     string   — File MIME type
 *     isPdf:        boolean  — true if the file is a PDF
 *     fileName:     string   — Stored file name
 *     folder:       string   — Subfolder the file was stored in
 *   }
 * ─────────────────────────────────────────────────────────────────────────────
 */

// @OnlyCurrentDoc false

/* ──────────────────────────────────────────────────────────────────────────────
 * PAGE → SUBFOLDER MAP
 * Maps frontend subFolderName prefixes to organised Drive subdirectories.
 * The lookup is prefix-based, so "nermai-hero-desktop" maps to "nermai-home".
 * ────────────────────────────────────────────────────────────────────────────*/
var PAGE_FOLDER_MAP = {
  'nermai-hero':         'nermai-home',
  'nermai-home':         'nermai-home',
  'nermai-about':        'nermai-home',
  'nermai-gallery':      'nermai-gallery',
  'nermai-results':      'nermai-results',
  'nermai-toppers':      'nermai-results',
  'nermai-topper':       'nermai-results',
  'nermai-success':      'nermai-results',
  'nermai-courses':      'nermai-courses',
  'nermai-course':       'nermai-courses',
  'nermai-testimonials': 'nermai-testimonials',
  'nermai-reviews':      'nermai-testimonials',
  'nermai-topbar':       'nermai-topbar',
  'nermai-contact':      'nermai-contact',
  'nermai-resources':    'nermai-resources',
  'nermai-pdfs':         'nermai-resources',
  'nermai-materials':    'nermai-resources',
  'nermai-why':          'nermai-why',
  'nermai-why-nermai':   'nermai-why'
}

/* ──────────────────────────────────────────────────────────────────────────────
 * Helper: sanitise a folder/file name (remove Drive-illegal chars)
 * ────────────────────────────────────────────────────────────────────────────*/
function sanitiseName(name, maxLen) {
  if (!name) return ''
  var safe = name.toString().replace(/[\\/:*?"<>|]/g, '').trim()
  return maxLen ? safe.substring(0, maxLen) : safe
}

/* ──────────────────────────────────────────────────────────────────────────────
 * Helper: resolve (or create) a named subfolder inside a parent folder.
 * ────────────────────────────────────────────────────────────────────────────*/
function getOrCreateSubfolder(parentFolder, subName) {
  var it = parentFolder.getFoldersByName(subName)
  if (it.hasNext()) return it.next()
  var newFolder = parentFolder.createFolder(subName)
  try {
    newFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW)
  } catch (e) { /* domain restriction — inherits parent */ }
  return newFolder
}

/* ──────────────────────────────────────────────────────────────────────────────
 * Helper: resolve the root Drive folder from a folderId (URL or bare ID)
 * ────────────────────────────────────────────────────────────────────────────*/
function getRootFolder(rawFolderId) {
  var id = (rawFolderId || '').toString().trim()
  // Accept full URLs like https://drive.google.com/drive/folders/FOLDER_ID
  var match = id.match(/[-\\w]{25,}/)
  var cleanId = match ? match[0] : id
  if (cleanId) {
    try { return DriveApp.getFolderById(cleanId) } catch (e) { /* fall through */ }
  }
  return DriveApp.getRootFolder()
}

/* ──────────────────────────────────────────────────────────────────────────────
 * Helper: resolve the target folder for a given subFolderName.
 *
 * Logic:
 *   1. Map the subFolderName prefix to a page-level bucket (nermai-home, etc.)
 *   2. Create/reuse that page bucket inside the root.
 *   3. If the original subFolderName is MORE specific than the bucket
 *      (e.g. "nermai-hero-desktop"), create a further nested folder inside.
 * ────────────────────────────────────────────────────────────────────────────*/
function resolveTargetFolder(rootFolder, rawSubFolderName) {
  var sub = sanitiseName(rawSubFolderName, 80)
  if (!sub) return rootFolder  // No subfolder — upload to root

  // Find longest matching prefix
  var pageBucket = 'nermai-misc'  // default catch-all bucket
  var longestMatch = 0
  var keys = Object.keys(PAGE_FOLDER_MAP)
  for (var i = 0; i < keys.length; i++) {
    var prefix = keys[i]
    if (sub === prefix || sub.indexOf(prefix) === 0) {
      if (prefix.length > longestMatch) {
        longestMatch = prefix.length
        pageBucket = PAGE_FOLDER_MAP[prefix]
      }
    }
  }

  // Level 1: page bucket (e.g. nermai-home)
  var bucketFolder = getOrCreateSubfolder(rootFolder, pageBucket)

  // Level 2: exact subFolderName folder (e.g. nermai-hero-desktop)
  // Only create if it differs from the bucket itself
  if (sub !== pageBucket) {
    return getOrCreateSubfolder(bucketFolder, sub)
  }
  return bucketFolder
}

/* ──────────────────────────────────────────────────────────────────────────────
 * Helper: build all relevant URL variants from a Drive file ID + MIME type
 * ────────────────────────────────────────────────────────────────────────────*/
function buildFileUrls(fileId, mimeType) {
  var isPdf = mimeType === 'application/pdf'
  var isImage = (mimeType || '').indexOf('image/') === 0

  return {
    // CDN thumbnail — fastest for images; falls back to Drive preview for PDFs
    url:         isImage
                   ? 'https://lh3.googleusercontent.com/d/' + fileId + '=w1600'
                   : 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w800',

    // Human-readable shareable link
    viewUrl:     'https://drive.google.com/file/d/' + fileId + '/view',

    // Direct download link (works for both images and PDFs)
    directUrl:   'https://drive.google.com/uc?export=view&id=' + fileId,

    // Embeddable iframe-safe preview (great for PDFs in <iframe> and images)
    previewUrl:  'https://drive.google.com/file/d/' + fileId + '/preview',

    // Force-download link
    downloadUrl: 'https://drive.google.com/uc?export=download&id=' + fileId,

    isPdf: isPdf,
    mimeType: mimeType || ''
  }
}

/* ──────────────────────────────────────────────────────────────────────────────
 * doGet — simple liveness probe (used by browser & curl health checks)
 * ────────────────────────────────────────────────────────────────────────────*/
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status:  'success',
    app:     'NERMAI IAS Academy — Drive Upload Service',
    version: '3.0',
    message: 'Web App is active and ready to receive uploads!'
  })).setMimeType(ContentService.MimeType.JSON)
}

/* ──────────────────────────────────────────────────────────────────────────────
 * doPost — main entry point
 * ────────────────────────────────────────────────────────────────────────────*/
function doPost(e) {
  try {
    /* ── 1. Parse payload ────────────────────────────────────────────── */
    if (!e || !e.postData || !e.postData.contents) {
      return jsonOut({ status: 'error', message: 'No POST payload received' })
    }

    var data
    try {
      data = JSON.parse(e.postData.contents)
    } catch (parseErr) {
      return jsonOut({ status: 'error', message: 'Invalid JSON: ' + parseErr.toString() })
    }

    /* ── 2. Resolve root folder ──────────────────────────────────────── */
    // Frontend sends { folderId } — same key used in the LMS reference script
    var rootFolder = getRootFolder(data.folderId || data.rootFolderId || '')

    /* ── 3. ACTION: test connection ──────────────────────────────────── */
    if (data.test) {
      return jsonOut({
        status:     'success',
        message:    'Google Drive connected successfully! Folder: "' + rootFolder.getName() + '"',
        folderName: rootFolder.getName(),
        folderId:   rootFolder.getId()
      })
    }

    /* ── 4. ACTION: delete file ──────────────────────────────────────── */
    if (data.action === 'delete') {
      if (!data.fileId) {
        return jsonOut({ status: 'error', message: 'fileId is required for delete action' })
      }
      try {
        var toDelete = DriveApp.getFileById(data.fileId)
        toDelete.setTrashed(true)
        return jsonOut({ status: 'success', message: 'File deleted (trashed) successfully', fileId: data.fileId })
      } catch (delErr) {
        return jsonOut({ status: 'error', message: 'Delete failed: ' + delErr.toString() })
      }
    }

    /* ── 5. ACTION: upload file ──────────────────────────────────────── */
    // Validate required fields
    if (!data.base64) {
      return jsonOut({ status: 'error', message: '"base64" field is required for uploads' })
    }

    var mimeType  = (data.mimeType  || 'image/jpeg').toString().trim()
    // Accept both "filename" (frontend) and "fileName" (LMS reference)
    var fileName  = sanitiseName(data.filename || data.fileName || ('upload_' + Date.now()), 200)
    var isPdf     = mimeType === 'application/pdf'

    // For PDFs with no extension, append .pdf
    if (isPdf && fileName.indexOf('.') === -1) {
      fileName = fileName + '.pdf'
    }

    // Resolve the correct subfolder (page-based organisation)
    var rawSub       = (data.subFolderName || data.subPath || '').toString()
    var targetFolder = resolveTargetFolder(rootFolder, rawSub)

    // Decode base64 and create the file
    var decoded = Utilities.base64Decode(data.base64)
    var blob    = Utilities.newBlob(decoded, mimeType, fileName)
    var file    = targetFolder.createFile(blob)

    // Grant public view access (best-effort; silently skips on domain-restricted accounts)
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW)
    } catch (shareErr) { /* domain restriction — folder-level sharing applies */ }

    var fileId = file.getId()
    var urls   = buildFileUrls(fileId, mimeType)

    /* ── 6. Compose response ─────────────────────────────────────────── */
    var response = {
      status:       'success',
      fileId:       fileId,
      fileName:     fileName,
      folder:       targetFolder.getName(),

      // Primary URL (CDN for images, thumbnail for PDFs)
      url:          urls.url,

      // All access modes
      viewUrl:      urls.viewUrl,
      directUrl:    urls.directUrl,
      previewUrl:   urls.previewUrl,
      downloadUrl:  urls.downloadUrl,

      // Flags
      isPdf:        urls.isPdf,
      mimeType:     mimeType,

      // Secondary redirect link: echo back if caller supplied one,
      // otherwise default to the Drive view link
      redirectLink: (data.redirectLink || '').toString().trim() || urls.viewUrl
    }

    return jsonOut(response)

  } catch (err) {
    return jsonOut({
      status:  'error',
      message: err.toString()
    })
  }
}

/* ──────────────────────────────────────────────────────────────────────────────
 * Utility: wrap an object as a JSON ContentService response
 * ────────────────────────────────────────────────────────────────────────────*/
function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON)
}`

  const handleCopyScript = () => {
    navigator.clipboard?.writeText(APPS_SCRIPT_TEMPLATE)
    setCopiedScript(true)
    setTimeout(() => setCopiedScript(false), 2500)
    toast.success('Apps Script code copied to clipboard!')
  }

  const handleSaveDrive = async () => {
    driveStorage.saveConfig(config)
    toast.success('Drive config saved!')
  }

  const handleTestConnection = async () => {
    if (!config.appsScriptUrl) {
      toast.error('Please enter the Apps Script URL first.')
      return
    }
    setIsTesting(true)
    try {
      const res = await fetch(config.appsScriptUrl, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ test: true, folderId: config.folderId })
      })
      const data = await res.json()
      if (data.status === 'success') {
        toast.success(data.message || 'Google Drive connection successful!')
      } else {
        toast.error(data.message || 'Google Drive returned an error.')
      }
    } catch (e) {
      toast.error('Failed to connect: ' + e.message)
    } finally {
      setIsTesting(false)
    }
  }

  const handleSavePasscode = async () => {
    if (!passcode || passcode.length < 4) { toast.error('Minimum 4 characters required'); return }
    try {
      await fbFirestore.updateSettings({ passcode })
      setPasscode('')
      toast.success('Passcode changed!')
    } catch (e) { toast.error(e.message) }
  }

  return (
    <div>
      <h2 className="ap-section-title"><i className="fa-brands fa-google-drive"></i> Drive &amp; Storage Settings</h2>

      {/* Info Notice */}
      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '1rem 1.25rem', marginBottom: '1.25rem', fontSize: '0.85rem', color: '#166534' }}>
        <strong>💡 Direct Uploads are Supported Out of the Box:</strong> You do <em>not</em> need to configure Google Drive to upload photos. On any image upload field, you can simply click <strong>"📁 Click to Browse or Drag Photo Here"</strong> to upload and compress photos directly from your device!
      </div>

      {/* Drive Config */}
      <div className="ap-card">
        <div style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="fa-brands fa-google-drive" style={{ color: '#4285F4', fontSize: '1.2rem' }}></i>
          Google Drive Auto-Upload Integration (Optional)
        </div>
        
        <p style={{ fontSize: '0.82rem', color: 'var(--gray-500)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
          Connect your Google Drive so that photos uploaded in the admin panel are automatically stored in your Google Drive folder and served through fast CDN links.
        </p>

        <div className="ap-form-group">
          <label>Apps Script Web App URL</label>
          <input className="ap-input" placeholder="https://script.google.com/macros/s/.../exec" value={config.appsScriptUrl} onChange={e => setConfig(c => ({ ...c, appsScriptUrl: e.target.value.trim() }))} />
          <div style={{ fontSize: '0.72rem', color: 'var(--gray-400)', marginTop: '4px' }}>
            Google Apps Script → Deploy → New deployment → Web app → Execute as: <strong>Me</strong>, Access: <strong>Anyone</strong>
          </div>
          {/* ⚠️ Critical: Apps Script must set file sharing to public */}
          <div style={{ marginTop: '8px', background: '#fef9c3', border: '1px solid #fde047', borderRadius: '6px', padding: '8px 10px', fontSize: '0.75rem', color: '#713f12' }}>
            <strong>⚠️ Important — your Apps Script must make uploaded files public.</strong><br />
            Add this line inside your Apps Script after uploading the file:<br />
            <code style={{ display: 'block', marginTop: '4px', background: '#fef3c7', padding: '4px 8px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.72rem', wordBreak: 'break-all' }}>
              {'DriveApp.getFileById(file.getId()).setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW)'}
            </code>
            <span style={{ color: '#92400e', marginTop: '4px', display: 'block' }}>Without this, images will be private and won't load on the website.</span>
          </div>
        </div>

        <div className="ap-form-row">
          <div className="ap-form-group">
            <label>Drive Folder ID (optional - target folder in Drive)</label>
            <input className="ap-input" placeholder="1ABC...xyz (from Google Drive folder URL)" value={config.folderId} onChange={e => setConfig(c => ({ ...c, folderId: e.target.value.trim() }))} />
          </div>
        </div>

        <div
          className={`ap-drive-status ${config.appsScriptUrl ? 'ap-drive-ok' : 'ap-drive-warn'}`}
          style={{ marginBottom: '1rem' }}
        >
          <i className={`fa-solid ${config.appsScriptUrl ? 'fa-circle-check' : 'fa-triangle-exclamation'}`}></i>
          {config.appsScriptUrl ? 'Apps Script configured — uploads automatically go to your Google Drive' : 'No Apps Script URL configured — uploads are stored locally with instant compression'}
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          <button className="ap-btn ap-btn-primary" onClick={handleSaveDrive}>
            <i className="fa-solid fa-floppy-disk"></i> Save Drive Config
          </button>
          <button className="ap-btn ap-btn-outline" onClick={handleTestConnection} disabled={isTesting}>
            <i className={`fa-solid ${isTesting ? 'fa-spinner fa-spin' : 'fa-network-wired'}`}></i> 
            {isTesting ? ' Testing Connection...' : ' Test Connection'}
          </button>
        </div>
      </div>

      {/* Google Apps Script Deployment Info Card */}
      <div className="ap-card" style={{ borderLeft: '4px solid #4285F4', background: '#fafbff' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: 36, height: 36, borderRadius: '8px', background: 'rgba(66, 133, 244, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4285F4', fontSize: '1.2rem' }}>
              <i className="fa-solid fa-code"></i>
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--ink)', fontSize: '0.98rem' }}>
                Google Apps Script — Deployment Guide &amp; Code
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                Follow these 4 simple steps to connect Google Drive storage with auto-folder organization
              </div>
            </div>
          </div>
          <button
            className="ap-btn ap-btn-primary"
            onClick={handleCopyScript}
            style={{ fontSize: '0.82rem', padding: '0.5rem 1rem', background: copiedScript ? '#16a34a' : '#4285F4', borderColor: copiedScript ? '#16a34a' : '#4285F4' }}
          >
            <i className={`fa-solid ${copiedScript ? 'fa-check' : 'fa-copy'}`}></i>
            {copiedScript ? ' Copied Script!' : ' Copy Script Code'}
          </button>
        </div>

        {/* Step-by-Step Instructions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.85rem', marginBottom: '1.25rem' }}>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.85rem 1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#1e293b', fontSize: '0.82rem', marginBottom: '4px' }}>
              <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#4285F4', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem' }}>1</span>
              Create Project
            </div>
            <p style={{ margin: 0, fontSize: '0.76rem', color: '#64748b', lineHeight: 1.45 }}>
              Open <a href="https://script.google.com/home/start" target="_blank" rel="noopener noreferrer" style={{ color: '#4285F4', fontWeight: 600, textDecoration: 'underline' }}>Google Apps Script</a> and click <strong>New Project</strong>. Clear any existing code in <code>Code.gs</code>.
            </p>
          </div>

          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.85rem 1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#1e293b', fontSize: '0.82rem', marginBottom: '4px' }}>
              <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#4285F4', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem' }}>2</span>
              Paste Script
            </div>
            <p style={{ margin: 0, fontSize: '0.76rem', color: '#64748b', lineHeight: 1.45 }}>
              Click <strong>"Copy Script Code"</strong> and paste the entire script into the <code>Code.gs</code> editor, then save (<kbd>Ctrl+S</kbd>).
            </p>
          </div>

          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.85rem 1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#1e293b', fontSize: '0.82rem', marginBottom: '4px' }}>
              <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#4285F4', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem' }}>3</span>
              Deploy as Web App
            </div>
            <p style={{ margin: 0, fontSize: '0.76rem', color: '#64748b', lineHeight: 1.45 }}>
              Click <strong>Deploy → New deployment</strong> (blue button). Select type <strong>Web App</strong> (⚙️):<br />
              • Execute as: <strong>Me (your account)</strong><br />
              • Who has access: <strong>Anyone</strong>
            </p>
          </div>

          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.85rem 1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#1e293b', fontSize: '0.82rem', marginBottom: '4px' }}>
              <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#4285F4', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem' }}>4</span>
              Paste &amp; Save
            </div>
            <p style={{ margin: 0, fontSize: '0.76rem', color: '#64748b', lineHeight: 1.45 }}>
              Authorize permissions, copy the <strong>Web App URL</strong> (ending in <code>/exec</code>), paste it into <strong>Apps Script Web App URL</strong> above, and click <strong>Save Drive Config</strong>.
            </p>
          </div>
        </div>

        {/* Automatic Folders Created */}
        <div style={{ background: '#f1f5f9', borderRadius: '8px', padding: '0.85rem 1rem', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <i className="fa-solid fa-folder-tree" style={{ color: '#4285F4' }}></i>
            Automatic Folder Organization in Google Drive:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', fontSize: '0.72rem' }}>
            <span style={{ background: '#fff', padding: '3px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', color: '#475569' }}>📁 nermai-home/</span>
            <span style={{ background: '#fff', padding: '3px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', color: '#475569' }}>📁 nermai-results/</span>
            <span style={{ background: '#fff', padding: '3px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', color: '#475569' }}>📁 nermai-courses/</span>
            <span style={{ background: '#fff', padding: '3px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', color: '#475569' }}>📁 nermai-topbar/</span>
            <span style={{ background: '#fff', padding: '3px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', color: '#475569' }}>📁 nermai-testimonials/</span>
            <span style={{ background: '#fff', padding: '3px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', color: '#475569' }}>📁 nermai-contact/</span>
            <span style={{ background: '#fff', padding: '3px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', color: '#475569' }}>📁 nermai-gallery/</span>
            <span style={{ background: '#fff', padding: '3px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', color: '#475569' }}>📁 nermai-resources/ (PDFs)</span>
            <span style={{ background: '#fff', padding: '3px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', color: '#475569' }}>📁 nermai-why/</span>
          </div>
        </div>

        {/* Expandable Code Box */}
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', background: '#0f172a' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 1rem', background: '#1e293b', borderBottom: '1px solid #334155' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }}></span>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }}></span>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }}></span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: '6px', fontFamily: 'monospace' }}>Code.gs (Apps Script v3.0)</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setShowScriptCode(!showScriptCode)}
                style={{ background: 'transparent', border: '1px solid #475569', color: '#cbd5e1', padding: '3px 10px', borderRadius: '4px', fontSize: '0.72rem', cursor: 'pointer' }}
              >
                <i className={`fa-solid ${showScriptCode ? 'fa-eye-slash' : 'fa-eye'}`} style={{ marginRight: '4px' }}></i>
                {showScriptCode ? 'Hide Code' : 'View Code Snippet'}
              </button>
              <button
                type="button"
                onClick={handleCopyScript}
                style={{ background: copiedScript ? '#16a34a' : '#3b82f6', border: 'none', color: '#fff', padding: '3px 10px', borderRadius: '4px', fontSize: '0.72rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <i className={`fa-solid ${copiedScript ? 'fa-check' : 'fa-copy'}`}></i>
                {copiedScript ? 'Copied!' : 'Copy Code'}
              </button>
            </div>
          </div>

          {showScriptCode && (
            <pre style={{ margin: 0, padding: '1rem', maxHeight: '340px', overflowY: 'auto', fontSize: '0.72rem', color: '#e2e8f0', fontFamily: 'Consolas, Monaco, monospace', lineHeight: 1.5, background: '#090d16' }}>
              <code>{APPS_SCRIPT_TEMPLATE}</code>
            </pre>
          )}
        </div>

        {/* Main Copy Action Bar */}
        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button className="ap-btn ap-btn-primary" onClick={handleCopyScript} style={{ background: copiedScript ? '#16a34a' : '#4285F4', borderColor: copiedScript ? '#16a34a' : '#4285F4' }}>
            <i className={`fa-solid ${copiedScript ? 'fa-check' : 'fa-copy'}`}></i>
            {copiedScript ? ' Full Script Copied to Clipboard!' : ' Copy Full Google Apps Script Code'}
          </button>
        </div>
      </div>

      {/* Drive URL Converter */}
      <div className="ap-card">
        <div style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: '0.5rem' }}>Drive URL → CDN Converter</div>
        <p style={{ fontSize: '0.82rem', color: 'var(--gray-500)', marginBottom: '1rem' }}>
          Convert any Google Drive share link to an embeddable image URL.
        </p>
        <input
          className="ap-input"
          placeholder="https://drive.google.com/file/d/117XHcc-KsaOzXczLLqMsBKV9wdoiEkwv/view"
          value={pastedUrl}
          onChange={e => {
            setPastedUrl(e.target.value)
            const cdn = getGoogleDriveCDNUrl(e.target.value)
            setConvertedUrl(cdn !== e.target.value ? cdn : '')
          }}
        />
        {convertedUrl && (
          <div style={{ marginTop: '0.75rem' }}>
            <div className="ap-url-converter-result" style={{ wordBreak: 'break-all', fontSize: '0.78rem', background: '#f8fafc', padding: '0.5rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
              {convertedUrl}
            </div>
            <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <img src={convertedUrl} alt="CDN Preview" style={{ width: 80, height: 56, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--gray-200)' }} onError={e => { e.target.style.display = 'none' }} />
              <button className="ap-btn ap-btn-ghost" onClick={() => { navigator.clipboard?.writeText(convertedUrl); toast.success('Copied!') }}>
                <i className="fa-solid fa-copy"></i> Copy Embed URL
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Change Passcode */}
      <div className="ap-card">
        <div style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: '1rem' }}>
          <i className="fa-solid fa-lock" style={{ marginRight: '8px' }}></i>
          Change Admin Passcode
        </div>
        <div className="ap-form-group">
          <label>New Passcode</label>
          <input type="password" className="ap-input" placeholder="New passcode..." value={passcode} onChange={e => setPasscode(e.target.value)} style={{ letterSpacing: '0.2em' }} />
        </div>
        <button className="ap-btn ap-btn-primary" onClick={handleSavePasscode}>
          <i className="fa-solid fa-key"></i> Change Passcode
        </button>
      </div>
    </div>
  )
}

// ─── Site Info Section ────────────────────────────────────────────────────────
function SiteInfoSection({ toast }) {
  const [info, setInfo] = useState({
    phone: '', email: '', address: '', whatsapp: '',
    instagram: '', facebook: '', youtube: '', telegram: ''
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fbFirestore.getSettings().then(s => {
      if (s.siteInfo) setInfo(si => ({ ...si, ...s.siteInfo }))
      setLoading(false)
    })
  }, [])

  const handleSave = async () => {
    try {
      await fbFirestore.updateSettings({ siteInfo: info })
      toast.success('Site info saved!')
    } catch (e) { toast.error(e.message) }
  }

  if (loading) return <div style={{ padding: '2rem', color: 'var(--gray-400)' }}>Loading...</div>

  return (
    <div>
      <h2 className="ap-section-title"><i className="fa-solid fa-circle-info"></i> Site Information</h2>
      <div className="ap-card">
        <div className="ap-form-row">
          <div className="ap-form-group">
            <label>Phone</label>
            <input className="ap-input" placeholder="+91 98765 43210" value={info.phone} onChange={e => setInfo(i => ({ ...i, phone: e.target.value }))} />
          </div>
          <div className="ap-form-group">
            <label>Email</label>
            <input className="ap-input" placeholder="info@nermai.in" value={info.email} onChange={e => setInfo(i => ({ ...i, email: e.target.value }))} />
          </div>
        </div>
        <div className="ap-form-group">
          <label>Address (Tamil)</label>
          <textarea className="ap-input ap-textarea" value={info.address} onChange={e => setInfo(i => ({ ...i, address: e.target.value }))} />
        </div>
        <div className="ap-form-row">
          <div className="ap-form-group">
            <label>WhatsApp Number (with country code, no +)</label>
            <input className="ap-input" placeholder="919876543210" value={info.whatsapp} onChange={e => setInfo(i => ({ ...i, whatsapp: e.target.value }))} />
          </div>
          <div className="ap-form-group">
            <label>Facebook URL</label>
            <input className="ap-input" placeholder="https://facebook.com/..." value={info.facebook} onChange={e => setInfo(i => ({ ...i, facebook: e.target.value }))} />
          </div>
        </div>
        <div className="ap-form-row">
          <div className="ap-form-group">
            <label>YouTube URL</label>
            <input className="ap-input" placeholder="https://youtube.com/..." value={info.youtube} onChange={e => setInfo(i => ({ ...i, youtube: e.target.value }))} />
          </div>
          <div className="ap-form-group">
            <label>Telegram URL</label>
            <input className="ap-input" placeholder="https://t.me/..." value={info.telegram} onChange={e => setInfo(i => ({ ...i, telegram: e.target.value }))} />
          </div>
        </div>
        <div className="ap-form-group">
          <label>Instagram URL</label>
          <input className="ap-input" placeholder="https://instagram.com/..." value={info.instagram} onChange={e => setInfo(i => ({ ...i, instagram: e.target.value }))} />
        </div>
        <button className="ap-btn ap-btn-primary" onClick={handleSave}>
          <i className="fa-solid fa-floppy-disk"></i> Save
        </button>
      </div>
    </div>
  )
}

// ─── Main Admin Portal (floating button — hidden on /admin pages) ─────────────
const SECTIONS = [
  { id: 'homecontent',   label: 'Home Content', icon: 'fa-house' },
  { id: 'topbar',        label: 'Top Bar',      icon: 'fa-heading' },
  { id: 'hero',          label: 'Hero Slides',  icon: 'fa-images' },
  { id: 'notices',       label: 'Notices',      icon: 'fa-bell' },
  { id: 'resources',     label: 'Resources',    icon: 'fa-book-open' },
  { id: 'toppers',       label: 'Toppers',      icon: 'fa-trophy' },
  { id: 'testimonials',  label: 'Testimonials', icon: 'fa-quote-right' },
  { id: 'results',       label: 'Results',      icon: 'fa-medal' },
  { id: 'gallery',       label: 'Gallery',      icon: 'fa-images' },
  { id: 'siteinfo',      label: 'Site Info',    icon: 'fa-circle-info' },
  { id: 'courses',       label: 'Courses & Programs', icon: 'fa-graduation-cap' },
  { id: 'officeLocs',    label: 'Office Locations', icon: 'fa-map-location-dot' },
  { id: 'footer',        label: 'Footer',       icon: 'fa-shoe-prints' },
  { id: 'drive',         label: 'Drive',        icon: 'fa-brands fa-google-drive' }
]

// ─── Named export for AdminDashboard (reuses all section editors) ─────────────
export function AdminPanelContent({ activeSection, toast }) {
  return (
    <>
      {activeSection === 'homecontent'  && <HomeContentSection toast={toast} />}
      {activeSection === 'topbar'       && <TopBarAdminSection toast={toast} />}
      {activeSection === 'hero'         && <HeroSection toast={toast} />}
      {activeSection === 'notices'      && <NoticesSection toast={toast} />}
      {activeSection === 'resources'    && <ResourceManager toast={toast} />}
      {activeSection === 'toppers'      && <ToppersSection toast={toast} />}
      {activeSection === 'testimonials' && <TestimonialsSection toast={toast} />}
      {activeSection === 'results'      && <ResultsSection toast={toast} />}
      {activeSection === 'gallery'      && <GallerySection toast={toast} />}
      {activeSection === 'siteinfo'     && <SiteInfoSection toast={toast} />}
      {activeSection === 'courses'      && <CourseContentSection toast={toast} />}
      {activeSection === 'officeLocs'   && <OfficeLocationsSection toast={toast} />}
      {activeSection === 'footer'       && <FooterContentSection toast={toast} />}
      {activeSection === 'drive'        && <DriveSection toast={toast} />}
    </>
  )
}

export default function AdminPortal() {
  const [showPasscode, setShowPasscode] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [showPanel, setShowPanel] = useState(false)
  const [passcode, setPasscode] = useState('')
  const [passcodeError, setPasscodeError] = useState('')
  const [checking, setChecking] = useState(false)
  const [activeSection, setActiveSection] = useState('hero')
  const { toasts, success, error, info } = useToast()
  const toast = { success, error, info }

  // Check session
  useEffect(() => {
    const stored = sessionStorage.getItem('nermai_admin')
    if (stored === '1') setAuthenticated(true)
  }, [])

  const handlePasscodeSubmit = async () => {
    if (!passcode) return
    setChecking(true)
    try {
      const ok = await fbFirestore.verifyPasscode(passcode)
      if (ok) {
        sessionStorage.setItem('nermai_admin', '1')
        setAuthenticated(true)
        setShowPasscode(false)
        setShowPanel(true)
        setPasscode('')
        setPasscodeError('')
      } else {
        setPasscodeError('Incorrect passcode. Please try again.')
      }
    } catch (e) {
      setPasscodeError('Error: ' + e.message)
    } finally {
      setChecking(false)
    }
  }

  const handleAdminBtnClick = () => {
    if (authenticated) { setShowPanel(true) }
    else { setShowPasscode(true) }
  }

  // Don't show floating button on admin pages
  const isAdminPage = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')
  if (isAdminPage) return null

  const handleLogout = () => {
    sessionStorage.removeItem('nermai_admin')
    setAuthenticated(false)
    setShowPanel(false)
  }

  return (
    <>
      {/* Corner Admin Button — subtle, doesn't interfere with site */}
      <button
        className="admin-corner-btn"
        onClick={handleAdminBtnClick}
        title="Admin Portal"
        aria-label="Open Admin Portal"
      >
        <i className="fa-solid fa-lock"></i>
      </button>

      {/* Passcode Modal */}
      {showPasscode && (
        <div className="passcode-overlay" onClick={(e) => { if (e.target === e.currentTarget) { setShowPasscode(false); setPasscode(''); setPasscodeError('') } }}>
          <div className="passcode-modal" role="dialog" aria-modal="true" aria-label="Admin Login">
            <div className="passcode-modal-icon">
              <i className="fa-solid fa-shield-halved"></i>
            </div>
            <h2 className="passcode-modal-title">Nermai Admin</h2>
            <p className="passcode-modal-sub">Enter Admin passcode</p>
            <input
              type="password"
              className={`passcode-input${passcodeError ? ' error' : ''}`}
              placeholder="••••••••"
              value={passcode}
              onChange={e => { setPasscode(e.target.value); setPasscodeError('') }}
              onKeyDown={e => e.key === 'Enter' && handlePasscodeSubmit()}
              autoFocus
            />
            {passcodeError && <div className="passcode-error">{passcodeError}</div>}
            <div className="passcode-actions">
              <button
                className="btn btn-outline"
                onClick={() => { setShowPasscode(false); setPasscode(''); setPasscodeError('') }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handlePasscodeSubmit}
                disabled={checking || !passcode}
              >
                {checking ? <><i className="fa-solid fa-spinner fa-spin"></i> Verifying...</> : <>Login <i className="fa-solid fa-arrow-right"></i></>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Panel */}
      {showPanel && (
        <div className="admin-panel-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowPanel(false) }}>
          <div className="admin-panel" role="dialog" aria-modal="true" aria-label="Admin Panel">
            {/* Header */}
            <div className="ap-header">
              <div className="ap-header-title">
                <i className="fa-solid fa-shield-halved" style={{ color: 'var(--gold-light)' }}></i>
                Nermai Admin Portal
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="ap-header-close" onClick={handleLogout} title="Logout">
                  <i className="fa-solid fa-right-from-bracket"></i>
                </button>
                <button className="ap-header-close" onClick={() => setShowPanel(false)} title="Close">
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            </div>

            {/* Nav */}
            <div className="ap-nav">
              {SECTIONS.map(s => (
                <button
                  key={s.id}
                  className={`ap-nav-btn${activeSection === s.id ? ' active' : ''}`}
                  onClick={() => setActiveSection(s.id)}
                >
                  <i className={`fa-solid ${s.icon.replace('fa-brands ', '')}`}></i>
                  {s.label}
                </button>
              ))}
            </div>

            {/* Body */}
            <div className="ap-body">
              {activeSection === 'homecontent'  && <HomeContentSection toast={toast} />}
              {activeSection === 'topbar'       && <TopBarAdminSection toast={toast} />}
              {activeSection === 'hero'         && <HeroSection toast={toast} />}
              {activeSection === 'notices'      && <NoticesSection toast={toast} />}
              {activeSection === 'resources'    && <ResourceManager toast={toast} />}
              {activeSection === 'toppers'      && <ToppersSection toast={toast} />}
              {activeSection === 'testimonials' && <TestimonialsSection toast={toast} />}
              {activeSection === 'results'      && <ResultsSection toast={toast} />}
              {activeSection === 'gallery'      && <GallerySection toast={toast} />}
              {activeSection === 'siteinfo'     && <SiteInfoSection toast={toast} />}
              {activeSection === 'courses'      && <CourseContentSection toast={toast} />}
              {activeSection === 'officeLocs'   && <OfficeLocationsSection toast={toast} />}
              {activeSection === 'footer'       && <FooterContentSection toast={toast} />}
              {activeSection === 'drive'        && <DriveSection toast={toast} />}
            </div>
          </div>
        </div>
      )}

      {/* Toast Container */}
      <div className="toast-container" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <i className={`fa-solid ${t.type === 'success' ? 'fa-circle-check' : t.type === 'error' ? 'fa-circle-xmark' : 'fa-circle-info'}`}></i>
            {t.msg}
          </div>
        ))}
      </div>
    </>
  )
}
