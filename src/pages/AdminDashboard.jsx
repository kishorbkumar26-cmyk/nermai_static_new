import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AdminPanelContent } from '../components/AdminPortal'
import CourseContentSection from '../components/admin/CourseContentSection'
import ResultsGallerySection from '../components/admin/ResultsGallerySection'
import FooterContentSection from '../components/admin/FooterContentSection'
import OfficeLocationsSection from '../components/admin/OfficeLocationsSection'
import FaqAdminSection from '../components/admin/FaqAdminSection'
import TopBarAdminSection from '../components/admin/TopBarAdminSection'
import WhyNermaiAdminSection from '../components/admin/WhyNermaiAdminSection'
import ContactAdminSection from '../components/admin/ContactAdminSection'
import FreeResourcesAdminSection from '../components/admin/FreeResourcesAdminSection'
import { fbFirestore } from '../firebase/firestore'

/* ─── Toast ─────────────────────────────────────────────────────────────── */
function useToast() {
  const [toasts, setToasts] = useState([])
  const add = (msg, type = 'success') => {
    const id = Date.now()
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000)
  }
  return { toasts, success: m => add(m, 'success'), error: m => add(m, 'error'), info: m => add(m, 'info') }
}

/* ─── All Sections ───────────────────────────────────────────────────────── */
const SECTIONS = [
  { id: 'homecontent',  label: 'Home Content',   icon: 'fa-solid fa-house',                group: 'Content' },
  { id: 'contact',      label: 'Contact Page',   icon: 'fa-solid fa-address-book',         group: 'Content' },
  { id: 'topbar',       label: 'Top Bar / Header', icon: 'fa-solid fa-heading',            group: 'Content' },
  { id: 'resources',    label: 'Resources Desk', icon: 'fa-solid fa-book-open',            group: 'Content' },
  { id: 'footer',       label: 'Footer Editor',  icon: 'fa-solid fa-shoe-prints',          group: 'Content' },
  { id: 'officeLocs',   label: 'Office Locations',icon: 'fa-solid fa-map-location-dot',    group: 'Content' },
  { id: 'toppers',      label: 'Toppers & Results',icon: 'fa-solid fa-trophy',             group: 'Content' },
  { id: 'whynermai',    label: 'Why Nermai Card', icon: 'fa-solid fa-chess-king',          group: 'Content' },
  { id: 'courses',      label: 'Course Pages',   icon: 'fa-solid fa-graduation-cap',       group: 'Content' },
  { id: 'faq',          label: 'FAQ Manager',    icon: 'fa-solid fa-circle-question',      group: 'Content' },
  { id: 'results',      label: 'Results Posters',icon: 'fa-solid fa-images',               group: 'Content' },
  { id: 'hero',         label: 'Hero Slides',    icon: 'fa-solid fa-film',                 group: 'Media' },
  { id: 'gallery',      label: 'Gallery',        icon: 'fa-solid fa-camera',               group: 'Media' },
  { id: 'notices',      label: 'Notices',        icon: 'fa-solid fa-bell',                 group: 'Updates' },
  { id: 'testimonials', label: 'Testimonials',   icon: 'fa-solid fa-quote-right',           group: 'Updates' },
  { id: 'siteinfo',     label: 'Site Info',      icon: 'fa-solid fa-circle-info',           group: 'Settings' },
  { id: 'siteVisibility',label:'Site Visibility', icon: 'fa-solid fa-eye',                 group: 'Settings' },
  { id: 'drive',        label: 'Drive Config',   icon: 'fa-brands fa-google-drive',         group: 'Settings' },
  { id: 'settings',     label: 'Passcode',       icon: 'fa-solid fa-lock',                  group: 'Settings' },
]

const GROUPS = ['Content', 'Media', 'Updates', 'Settings']

/* ─── Settings Section ───────────────────────────────────────────────────── */
function SettingsSection({ toast }) {
  const [newPass, setNewPass] = useState('')
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()

  const handleSave = async () => {
    if (!newPass.trim() || newPass.length < 6) {
      toast.error('Passcode must be at least 6 characters.')
      return
    }
    setSaving(true)
    try {
      await fbFirestore.updateSettings({ passcode: newPass.trim() })
      toast.success('Passcode updated! Use it next time you log in.')
      setNewPass('')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h2 className="ap-section-title"><i className="fa-solid fa-lock" /> Admin Passcode</h2>
      <div className="ap-card" style={{ marginBottom: '1rem' }}>
        <div style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '0.9rem' }}>Change Admin Passcode</div>
        <div className="ap-form-group">
          <label>New Passcode (minimum 6 characters)</label>
          <input
            type="password"
            className="ap-input"
            placeholder="Enter new passcode..."
            value={newPass}
            onChange={e => setNewPass(e.target.value)}
            style={{ letterSpacing: '0.2em', fontFamily: 'var(--font-mono)' }}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
          />
        </div>
        <button className="ap-btn ap-btn-primary" onClick={handleSave} disabled={saving}>
          {saving
            ? <><i className="fa-solid fa-spinner fa-spin" /> Saving...</>
            : <><i className="fa-solid fa-key" /> Update Passcode</>
          }
        </button>
      </div>
      <div className="ap-card">
        <div style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.9rem' }}>Session Info</div>
        <div className="dash-info-row">
          <span className="dash-info-label">Login URL</span>
          <code className="dash-info-value">/admin</code>
        </div>
        <div className="dash-info-row">
          <span className="dash-info-label">Session</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: '#16a34a' }}>✓ Active (browser session)</span>
        </div>
        <p style={{ marginTop: '1rem', fontSize: '0.78rem', color: 'var(--gray-400)', lineHeight: 1.6 }}>
          Admin session expires when you close the browser or click Logout. Keep the passcode safe — it is not displayed anywhere on the public site.
        </p>
      </div>
    </div>
  )
}

function SiteVisibilitySection({ toast }) {
  const [visibility, setVisibility] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fbFirestore.getSettings().then(s => {
      setVisibility(s.pageVisibility || {
        courses: true, results: true, notices: true, gallery: true, toppers: true, testimonials: true
      })
      setLoading(false)
    })
  }, [])

  const update = (key, val) => setVisibility(prev => ({ ...prev, [key]: val }))

  const handleSave = async () => {
    setSaving(true)
    try {
      await fbFirestore.updateSettings({ pageVisibility: visibility })
      toast.success('Site visibility updated! Refresh the page to see changes on the public site.')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  const PAGES = [
    { key: 'courses', label: 'Course Pages (/courses)' },
    { key: 'results', label: 'Results Gallery (/results)' },
    { key: 'notices', label: 'Notices (/notices)' },
    { key: 'gallery', label: 'Photo Gallery (/gallery)' },
    { key: 'toppers', label: 'Toppers (/toppers)' },
    { key: 'testimonials', label: 'Testimonials (/testimonials)' }
  ]

  if (loading) return <div style={{ padding: '2rem', color: 'var(--gray-400)' }}><i className="fa-solid fa-spinner fa-spin" /> Loading...</div>

  return (
    <div>
      <h2 className="ap-section-title"><i className="fa-solid fa-eye" /> Site Visibility</h2>
      <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)', marginBottom: '1.5rem' }}>
        Toggle the overall visibility of entire pages on the public website. If hidden, links in the navigation bar will disappear and direct access will redirect to the homepage.
      </p>
      
      <div className="ap-card" style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {PAGES.map(page => (
          <label key={page.key} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
            <input 
              type="checkbox" 
              checked={visibility[page.key] !== false} 
              onChange={e => update(page.key, e.target.checked)} 
              style={{ cursor: 'pointer' }} 
            />
            {page.label}
          </label>
        ))}
      </div>
      
      <button className="ap-btn ap-btn-primary" onClick={handleSave} disabled={saving}>
        {saving ? <><i className="fa-solid fa-spinner fa-spin" /> Saving...</> : 'Save Changes'}
      </button>
    </div>
  )
}

/* ─── Sidebar ────────────────────────────────────────────────────────────── */
function Sidebar({ active, onSelect, onLogout }) {
  return (
    <aside className="dash-sidebar">
      <div className="dash-sidebar-logo">
        <img src="/nermai-logo.png" alt="Nermai Logo" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
        <div>
          <div className="dash-sidebar-name">NERMAI IAS</div>
          <div className="dash-sidebar-sub">Master Admin Dashboard</div>
        </div>
      </div>

      <nav className="dash-sidebar-nav">
        {GROUPS.map(group => (
          <div key={group}>
            <div style={{ padding: '0.6rem 1rem 0.2rem', fontSize: '0.62rem', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              {group}
            </div>
            {SECTIONS.filter(s => s.group === group).map(s => (
              <button
                key={s.id}
                className={`dash-nav-item${active === s.id ? ' active' : ''}`}
                onClick={() => onSelect(s.id)}
              >
                <i className={s.icon} style={{ width: 16, textAlign: 'center' }} />
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="dash-sidebar-footer">
        <a href="/" className="dash-footer-link" target="_blank" rel="noopener noreferrer">
          <i className="fa-solid fa-arrow-up-right-from-square" /> View Live Site
        </a>
        <button className="dash-footer-link dash-logout-btn" onClick={onLogout}>
          <i className="fa-solid fa-right-from-bracket" /> Logout
        </button>
      </div>
    </aside>
  )
}

/* ─── Main AdminDashboard ───────────────────────────────────────────────── */
export default function AdminDashboard() {
  const [active, setActive]           = useState('homecontent')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { toasts, success, error, info } = useToast()
  const toast = { success, error, info }
  const navigate = useNavigate()

  // Auth guard
  useEffect(() => {
    if (sessionStorage.getItem('nermai_admin') !== '1') {
      navigate('/admin')
    }
  }, [navigate])

  const handleLogout = () => {
    sessionStorage.removeItem('nermai_admin')
    navigate('/admin')
  }

  const currentSection = SECTIONS.find(s => s.id === active)

  return (
    <div className="dash-layout">
      {/* Mobile bar */}
      <div className="dash-mobile-bar">
        <button className="dash-icon-btn" onClick={() => setSidebarOpen(o => !o)}>
          <i className="fa-solid fa-bars" />
        </button>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.8)' }}>
          NERMAI MASTER ADMIN
        </span>
        <button className="dash-icon-btn" onClick={handleLogout} title="Logout">
          <i className="fa-solid fa-right-from-bracket" />
        </button>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="dash-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`dash-sidebar-wrap${sidebarOpen ? ' open' : ''}`}>
        <Sidebar
          active={active}
          onSelect={id => { setActive(id); setSidebarOpen(false) }}
          onLogout={handleLogout}
        />
      </div>

      {/* Main */}
      <main className="dash-main">
        {/* Top bar */}
        <div className="dash-topbar">
          <div className="dash-breadcrumb">
            <i className="fa-solid fa-house" style={{ color: 'var(--gray-400)' }} />
            <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.65rem', color: 'var(--gray-300)' }} />
            <span>{currentSection?.group}</span>
            <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.65rem', color: 'var(--gray-300)' }} />
            <span>{currentSection?.label || 'Dashboard'}</span>
          </div>
          <a href="/" target="_blank" rel="noopener noreferrer"
            style={{ fontSize: '0.75rem', color: 'var(--maroon)', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <i className="fa-solid fa-arrow-up-right-from-square" /> View Site
          </a>
        </div>

        {/* Content */}
        <div className="dash-content">
          {/* Custom sections */}
          {active === 'contact'  && <ContactAdminSection toast={toast} />}
          {active === 'topbar'   && <TopBarAdminSection toast={toast} />}
          {active === 'whynermai' && <WhyNermaiAdminSection toast={toast} />}
          {active === 'courses'  && <CourseContentSection toast={toast} />}
          {active === 'faq'      && <FaqAdminSection toast={toast} />}
          {active === 'results'  && <ResultsGallerySection toast={toast} />}
          {active === 'footer'   && <FooterContentSection toast={toast} />}
          {active === 'resources' && <FreeResourcesAdminSection toast={toast} />}
          {active === 'officeLocs' && <OfficeLocationsSection toast={toast} />}
          {active === 'siteVisibility' && <SiteVisibilitySection toast={toast} />}
          {active === 'settings' && <SettingsSection toast={toast} />}

          {/* Reused from AdminPortal (via named export) */}
          {!['contact', 'topbar', 'whynermai', 'courses', 'faq', 'results', 'footer', 'resources', 'officeLocs', 'siteVisibility', 'settings'].includes(active) && (
            <AdminPanelContent activeSection={active} toast={toast} />
          )}
        </div>
      </main>

      {/* Toasts */}
      <div className="toast-container" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <i className={`fa-solid ${t.type === 'success' ? 'fa-circle-check' : t.type === 'error' ? 'fa-circle-xmark' : 'fa-circle-info'}`} />
            {t.msg}
          </div>
        ))}
      </div>
    </div>
  )
}
