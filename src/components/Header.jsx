import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { fbFirestore } from '../firebase/firestore'
import { LMS_URL, CONTACT, WHATSAPP_NUMBER } from '../constants'
import { 
  MapPin, Phone, Mail, Send, 
  Search, Home as HomeIcon, ArrowRight, X
} from 'lucide-react'
import TopTicker from './TopTicker'
import { driveStorage } from '../services/driveStorage'
import './Header.css'

const DEFAULT_TOPBAR_DATA = {
  visible: true,
  location: 'Puducherry, India',
  locationLink: '',
  showLocation: true,
  contacts: [
    { id: 'c1', value: '+91 8903 189000', label: '', visible: true }
  ],
  email: 'nermaiasacademy@gmail.com',
  showEmail: true,
  tagline: 'Empowering Aspirants. Strengthening the Nation.',
  showTagline: true,
  socials: {
    youtube: 'https://youtube.com',
    instagram: 'https://instagram.com',
    telegram: 'https://t.me/',
    facebook: 'https://facebook.com'
  },
  socialsVisibility: {
    youtube: true,
    instagram: true,
    telegram: true,
    facebook: true
  }
}

const DEFAULT_BRANDING = {
  logoUrl: '/nermai-logo.png',
  title: 'NERMAI',
  subtitle: 'IAS ACADEMY',
  showMotto: true,
  mottoLine1: 'Learn',
  mottoLine2: 'Compete',
  mottoLine3: 'Serve'
}

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [topBarData, setTopBarData] = useState(DEFAULT_TOPBAR_DATA)
  const [branding, setBranding] = useState(DEFAULT_BRANDING)
  const [tickerData, setTickerData] = useState({
    visible: true,
    items: []
  })

  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const unsub = fbFirestore.onSettingsChanged(s => {
      if (s.homeContent?.ticker) setTickerData(s.homeContent.ticker)
      if (s.branding) {
        setBranding({ ...DEFAULT_BRANDING, ...s.branding })
      }
      if (s.topBar) {
        const formattedContacts = Array.isArray(s.topBar.contacts)
          ? s.topBar.contacts.map((c, idx) => typeof c === 'string' ? { id: `c_${idx}`, value: c, visible: true } : c)
          : (s.siteInfo?.phone ? [{ id: 'c1', value: s.siteInfo.phone, visible: true }] : DEFAULT_TOPBAR_DATA.contacts)

        setTopBarData({
          ...DEFAULT_TOPBAR_DATA,
          ...s.topBar,
          contacts: formattedContacts.length > 0 ? formattedContacts : DEFAULT_TOPBAR_DATA.contacts,
          socials: { ...DEFAULT_TOPBAR_DATA.socials, ...(s.topBar.socials || (s.siteInfo ? {
            youtube: s.siteInfo.youtube || '',
            instagram: s.siteInfo.instagram || '',
            telegram: s.siteInfo.telegram || '',
            facebook: s.siteInfo.facebook || ''
          } : {})) },
          socialsVisibility: { ...DEFAULT_TOPBAR_DATA.socialsVisibility, ...(s.topBar.socialsVisibility || {}) }
        })
      } else if (s.siteInfo) {
        setTopBarData(prev => ({
          ...prev,
          email: s.siteInfo.email || prev.email,
          contacts: [{ id: 'c1', value: s.siteInfo.phone || CONTACT.phones[0], visible: true }],
          socials: {
            youtube: s.siteInfo.youtube || prev.socials.youtube,
            instagram: s.siteInfo.instagram || prev.socials.instagram,
            telegram: s.siteInfo.telegram || prev.socials.telegram,
            facebook: s.siteInfo.facebook || prev.socials.facebook
          }
        }))
      }
    })
    return () => { if (typeof unsub === 'function') unsub() }
  }, [])

  // Lock/unlock body scroll for mobile nav
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  const closeMobileNav = useCallback(() => setMobileOpen(false), [])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    setSearchOpen(false)
    navigate(`/courses?q=${encodeURIComponent(searchQuery.trim())}`)
  }

  const handleFreeContentClick = (e) => {
    closeMobileNav()
    if (location.pathname === '/') {
      e.preventDefault()
      const el = document.getElementById('free-resources')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' })
        window.history.pushState(null, '', '#free-resources')
      }
    }
  }

  const primaryPhone = topBarData.contacts?.find(c => c && c.visible !== false && c.value)?.value || CONTACT.phones[0]
  const waLink = `https://wa.me/${primaryPhone.replace(/\D/g, '') || WHATSAPP_NUMBER}`

  return (
    <div className="site-header-wrapper" id="site-header">
      
      {/* Tier 1: Top Contact & Social Bar (Deep Maroon) */}
      {topBarData.visible !== false && (
        <div className="top-bar-strip">
          <div className="container" style={{ maxWidth: '1560px' }}>
            <div className="top-bar-inner">
              
              {/* Left Contact Info */}
              <div className="top-bar-left">
                {/* Location */}
                {topBarData.showLocation !== false && topBarData.location && (
                  <>
                    {topBarData.locationLink ? (
                      <a href={topBarData.locationLink} target="_blank" rel="noopener noreferrer" className="top-bar-item">
                        <MapPin size={13} style={{ color: '#F5D061' }} /> {topBarData.location}
                      </a>
                    ) : (
                      <span className="top-bar-item">
                        <MapPin size={13} style={{ color: '#F5D061' }} /> {topBarData.location}
                      </span>
                    )}
                  </>
                )}

                {/* Multiple Contacts */}
                {topBarData.contacts
                  ?.filter(c => c && c.visible !== false && c.value)
                  .map((c, idx) => (
                    <span key={c.id || idx} style={{ display: 'inline-flex', alignItems: 'center', gap: '1.25rem' }}>
                      <div className="top-bar-divider" />
                      <a href={`tel:${c.value.replace(/\s+/g, '')}`} className="top-bar-item" title={c.label ? `${c.label}: ${c.value}` : `Call ${c.value}`}>
                        <Phone size={13} style={{ color: '#F5D061' }} />
                        <span>{c.value}</span>
                        {c.label && <span className="top-bar-item-tag">{c.label}</span>}
                      </a>
                    </span>
                  ))}

                {/* Email */}
                {topBarData.showEmail !== false && topBarData.email && (
                  <>
                    <div className="top-bar-divider" />
                    <a href={`mailto:${topBarData.email}`} className="top-bar-item top-bar-email" title={`Email: ${topBarData.email}`}>
                      <Mail size={13} style={{ color: '#F5D061' }} /> {topBarData.email}
                    </a>
                  </>
                )}
              </div>

              {/* Right Slogan & Social Links */}
              <div className="top-bar-right">
                {topBarData.showTagline !== false && topBarData.tagline && (
                  <div className="top-bar-tagline">
                    {topBarData.tagline}
                  </div>
                )}
                <div className="top-bar-socials">
                  {topBarData.socialsVisibility?.youtube !== false && topBarData.socials?.youtube && (
                    <a href={topBarData.socials.youtube} target="_blank" rel="noopener noreferrer" className="top-bar-social-link" title="YouTube" aria-label="YouTube">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                    </a>
                  )}
                  {topBarData.socialsVisibility?.instagram !== false && topBarData.socials?.instagram && (
                    <a href={topBarData.socials.instagram} target="_blank" rel="noopener noreferrer" className="top-bar-social-link" title="Instagram" aria-label="Instagram">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                    </a>
                  )}
                  {topBarData.socialsVisibility?.telegram !== false && topBarData.socials?.telegram && (
                    <a href={topBarData.socials.telegram} target="_blank" rel="noopener noreferrer" className="top-bar-social-link" title="Telegram" aria-label="Telegram">
                      <Send size={14} />
                    </a>
                  )}
                  {topBarData.socialsVisibility?.facebook !== false && topBarData.socials?.facebook && (
                    <a href={topBarData.socials.facebook} target="_blank" rel="noopener noreferrer" className="top-bar-social-link" title="Facebook" aria-label="Facebook">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    </a>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Tier 2: Main Navigation Bar (Warm Cream) */}
      <header className="main-nav-strip">
        <div className="container" style={{ maxWidth: '1560px' }}>
          <div className="main-nav-inner">
            
            {/* Brand Logo & Motto */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Link to="/" className="brand-group" aria-label={`${branding.title || 'NERMAI'} ${branding.subtitle || 'IAS ACADEMY'} Home`}>
                <img src={branding.logoUrl || '/nermai-logo.png'} alt={`${branding.title || 'NERMAI'} Logo`} className="brand-logo-img" onError={(e) => driveStorage.handleImageError(e, '/nermai-logo.png')} />
                <div className="brand-titles">
                  <span className="brand-name">{branding.title || 'NERMAI'}</span>
                  <span className="brand-sub">{branding.subtitle || 'IAS ACADEMY'}</span>
                </div>
              </Link>

              {branding.showMotto !== false && (
                <>
                  <div className="brand-divider" />
                  <div className="brand-motto">
                    <span>{branding.mottoLine1 || 'Learn'}</span>
                    <span>{branding.mottoLine2 || 'Compete'}</span>
                    <span>{branding.mottoLine3 || 'Serve'}</span>
                  </div>
                </>
              )}
            </div>

            {/* Center Navigation Items — Direct Links to Existing Pages */}
            <nav className="nav-links-row" aria-label="Primary Navigation">
              
              {/* Home */}
              <Link 
                to="/" 
                className={`nav-link-btn ${location.pathname === '/' && !location.hash ? 'active nav-active-pill' : ''}`}
              >
                <HomeIcon size={16} style={{ marginRight: '2px' }} /> Home
              </Link>

              {/* Why Nermai */}
              <Link 
                to="/why-nermai" 
                className={`nav-link-btn ${location.pathname === '/why-nermai' ? 'active nav-active-pill' : ''}`}
              >
                Why Nermai
              </Link>

              {/* Courses */}
              <Link 
                to="/courses" 
                className={`nav-link-btn ${location.pathname.startsWith('/courses') ? 'active nav-active-pill' : ''}`}
              >
                Courses
              </Link>

              {/* Free Content (Moves to Free Resource part above location on Home) */}
              <Link 
                to="/#free-resources" 
                onClick={handleFreeContentClick}
                className={`nav-link-btn ${location.hash === '#free-resources' ? 'active nav-active-pill' : ''}`}
              >
                Free Content
              </Link>

              {/* Results */}
              <Link 
                to="/results" 
                className={`nav-link-btn ${location.pathname === '/results' ? 'active nav-active-pill' : ''}`}
              >
                Results
              </Link>

              {/* FAQ */}
              <Link 
                to="/contact#faq" 
                className={`nav-link-btn ${location.hash === '#faq' ? 'active nav-active-pill' : ''}`}
              >
                FAQ
              </Link>

              {/* Contact Us */}
              <Link 
                to="/contact" 
                className={`nav-link-btn ${location.pathname === '/contact' && location.hash !== '#faq' ? 'active nav-active-pill' : ''}`}
              >
                Contact Us
              </Link>

            </nav>

            {/* Right Action Controls */}
            <div className="nav-actions-right">
              {/* Search Circle Button */}
              <button 
                className="action-circle-btn"
                onClick={() => setSearchOpen(true)}
                title="Search Courses & Notes"
                aria-label="Search"
              >
                <Search size={18} />
              </button>

              {/* WhatsApp Green Circle */}
              <a 
                href={waLink} 
                target="_blank" 
                rel="noreferrer" 
                className="action-wa-circle"
                title="Chat on WhatsApp"
                aria-label="WhatsApp"
              >
                <i className="fa-brands fa-whatsapp" style={{ fontSize: '1.25rem' }} />
              </a>

              {/* Golden ENROLL / LOGIN CTA Button */}
              <a href={LMS_URL} target="_blank" rel="noreferrer" className="enroll-gold-btn">
                ENROLL / LOGIN <ArrowRight size={16} />
              </a>

              {/* Mobile Hamburger */}
              <button
                className="header-hamburger"
                onClick={() => setMobileOpen(true)}
                aria-label="Open Navigation Menu"
              >
                <span /><span /><span />
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Tier 3: Bottom Ticker Bar (Latest Updates) */}
      <TopTicker ticker={tickerData} />

      {/* Search Modal Overlay */}
      {searchOpen && (
        <div className="search-modal-overlay" onClick={() => setSearchOpen(false)}>
          <div className="search-modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: '#7B1B2E', fontFamily: 'var(--font-display)' }}>Search Nermai IAS Academy</h3>
              <button onClick={() => setSearchOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#635345' }}>
                <X size={22} />
              </button>
            </div>
            
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search courses, syllabus, mock tests..."
                autoFocus
                style={{
                  flex: 1, padding: '0.85rem 1.1rem', borderRadius: '12px',
                  border: '1px solid rgba(212, 175, 55, 0.4)', background: '#FFFFFF',
                  fontSize: '1rem', outline: 'none'
                }}
              />
              <button type="submit" className="enroll-gold-btn" style={{ borderRadius: '12px', padding: '0.85rem 1.5rem' }}>
                Search
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="mobile-overlay" onClick={closeMobileNav} aria-hidden="true" />
      )}
      <nav className={`mobile-nav${mobileOpen ? ' open' : ''}`} aria-label="Mobile navigation">
        <div className="mobile-nav-header" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img src={branding.logoUrl || '/nermai-logo.png'} alt={`${branding.title || 'NERMAI'} Logo`} style={{ width: '42px', height: '42px', objectFit: 'contain', borderRadius: '50%' }} onError={(e) => driveStorage.handleImageError(e, '/nermai-logo.png')} />
          <span style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '0.05em', color: '#FFF' }}>
            {branding.title || 'NERMAI'} {branding.subtitle || 'IAS ACADEMY'}
          </span>
          <button className="mobile-nav-close" onClick={closeMobileNav} aria-label="Close menu">
            <X size={24} />
          </button>
        </div>

        <div className="mobile-nav-links" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
          <Link to="/" className="mobile-nav-link" onClick={closeMobileNav}>Home</Link>
          <Link to="/why-nermai" className="mobile-nav-link" onClick={closeMobileNav}>Why Nermai</Link>
          <Link to="/courses" className="mobile-nav-link" onClick={closeMobileNav}>Courses</Link>
          <Link to="/#free-resources" className="mobile-nav-link" onClick={handleFreeContentClick}>Free Content</Link>
          <Link to="/results" className="mobile-nav-link" onClick={closeMobileNav}>Results</Link>
          <Link to="/contact#faq" className="mobile-nav-link" onClick={closeMobileNav}>FAQ</Link>
          <Link to="/contact" className="mobile-nav-link" onClick={closeMobileNav}>Contact Us</Link>
        </div>

        <div className="mobile-nav-footer" style={{ marginTop: 'auto', paddingTop: '2rem' }}>
          <a href={LMS_URL} target="_blank" rel="noreferrer" className="enroll-gold-btn" style={{ width: '100%', justifyContent: 'center' }}>
            ENROLL / LOGIN <ArrowRight size={16} />
          </a>
        </div>
      </nav>

    </div>
  )
}
