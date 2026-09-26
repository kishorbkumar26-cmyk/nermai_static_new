import { useState, useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { fbFirestore } from './firebase/firestore'
import { WHATSAPP_NUMBER } from './constants'

// Home loads immediately (first page visitors see)
import Home from './pages/Home'

// All other pages load on-demand (only when navigated to)
const WhyNermaiPage    = lazy(() => import('./pages/WhyNermaiPage'))
const CoursesPage      = lazy(() => import('./pages/CoursesPage'))
const CourseDetailPage = lazy(() => import('./pages/CourseDetailPage'))
const ContactPage      = lazy(() => import('./pages/ContactPage'))
const FaqPage          = lazy(() => import('./pages/FaqPage'))
const ResultsPage      = lazy(() => import('./pages/ResultsPage'))
const FreeResourcesPage = lazy(() => import('./pages/FreeResourcesPage'))
const AdminPage        = lazy(() => import('./pages/AdminPage'))
const AdminDashboard   = lazy(() => import('./pages/AdminDashboard'))
const AdminPortal      = lazy(() => import('./components/AdminPortal'))
import LiveBackground from './components/LiveBackground'

// Minimal page-level loading fallback
function PageLoader() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0d0005', color: '#D4AF37', fontSize: '1rem', gap: '0.75rem'
    }}>
      <div style={{
        width: 28, height: 28, border: '3px solid rgba(212,175,55,0.2)',
        borderTop: '3px solid #D4AF37', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      Loading…
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

function VisibilityGuard({ pageKey, children }) {
  const [loading, setLoading] = useState(true)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    fbFirestore.getSettings().then(s => {
      if (s.pageVisibility && s.pageVisibility[pageKey] === false) {
        setVisible(false)
      }
      setLoading(false)
    })
  }, [pageKey])

  if (loading) return null
  if (!visible) return <Navigate to="/" replace />
  return children
}

function FloatingButtons() {
  const waLink = `https://wa.me/${WHATSAPP_NUMBER}`
  return (
    <div className="floating-btns" style={{ zIndex: 9999 }}>
      {/* WhatsApp */}
      <a
        href={waLink}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        title="Chat on WhatsApp"
        style={{
          width: 52, height: 52, borderRadius: '50%',
          background: 'linear-gradient(135deg, #25D366, #128C7E)',
          color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.5rem',
          textDecoration: 'none',
          border: '2px solid var(--gold, #D4AF37)',
          boxShadow: '0 8px 24px rgba(37, 211, 102, 0.4), 0 0 15px rgba(212, 175, 55, 0.4)',
          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'scale(1.15) translateY(-3px)'
          e.currentTarget.style.boxShadow = '0 12px 30px rgba(37, 211, 102, 0.6), 0 0 22px rgba(212, 175, 55, 0.6)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(37, 211, 102, 0.4), 0 0 15px rgba(212, 175, 55, 0.4)'
        }}
      >
        <i className="fa-brands fa-whatsapp" />
      </a>

      {/* Info / FAQ */}
      <a
        href="/contact#faq"
        aria-label="FAQs &amp; Help"
        title="FAQs &amp; Help"
        style={{
          width: 52, height: 52, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--maroon, #7B1B2E), var(--maroon-deep, #4A0E1C))',
          color: 'var(--gold-light, #F5D061)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.4rem',
          textDecoration: 'none',
          border: '2px solid var(--gold, #D4AF37)',
          boxShadow: '0 8px 24px rgba(123, 27, 46, 0.4), 0 0 15px rgba(212, 175, 55, 0.4)',
          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'scale(1.15) translateY(-3px)'
          e.currentTarget.style.boxShadow = '0 12px 30px rgba(123, 27, 46, 0.6), 0 0 22px rgba(212, 175, 55, 0.6)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(123, 27, 46, 0.4), 0 0 15px rgba(212, 175, 55, 0.4)'
        }}
      >
        <i className="fa-solid fa-circle-info" />
      </a>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <FloatingButtons />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* ── Public pages ── */}
          <Route path="/"              element={<Home />} />
          <Route path="/why-nermai"    element={<WhyNermaiPage />} />
          <Route path="/contact"       element={<ContactPage />} />
          <Route path="/results"       element={<ResultsPage />} />
          <Route path="/free-resources" element={<FreeResourcesPage />} />
          <Route path="/free-content"   element={<Navigate to="/free-resources" replace />} />
          <Route path="/resources"      element={<Navigate to="/free-resources" replace />} />
          {/* FAQ integrated into Contact page */}
          <Route path="/faq"           element={<Navigate to="/contact#faq" replace />} />

          {/* ── Protected pages (controlled via admin Site Visibility) ── */}
          <Route
            path="/courses"
            element={<VisibilityGuard pageKey="courses"><CoursesPage /></VisibilityGuard>}
          />
          <Route
            path="/courses/:slug"
            element={<VisibilityGuard pageKey="courses"><CourseDetailPage /></VisibilityGuard>}
          />

          {/* ── Admin pages ── */}
          <Route path="/admin"           element={<AdminPage />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />

          {/* Fallback */}
          <Route path="*" element={<Home />} />
        </Routes>
      </Suspense>


    </BrowserRouter>
  )
}

