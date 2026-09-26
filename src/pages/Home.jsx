import { useEffect, useState, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import Header from '../components/Header'
import Hero from '../components/hero/Hero'
import TopTicker from '../components/TopTicker'
import StatsBar from '../components/StatsBar'
import Courses from '../components/Courses'
import WhyNermai from '../components/WhyNermai'
import WhatYouGet from '../components/WhatYouGet'
import Gallery from '../components/Gallery'
import GoogleReviews from '../components/GoogleReviews'
import SuccessStoriesSection from '../components/SuccessStoriesSection'
import OfficeLocations from '../components/OfficeLocations'
import Footer from '../components/Footer'
import EventsCalendar from '../components/EventsCalendar'
import ResourcesDesk from '../components/ResourcesDesk'
import { fbFirestore } from '../firebase/firestore'

const DEFAULT_ABOUT = {
  eyebrow: 'About Nermai',
  title: 'Built in Puducherry.\nDriven by purpose.',
  para1: 'Quality coaching should not be a privilege. A handful of youth from Puducherry started NERMAI IAS ACADEMY to change this — making serious civil services preparation accessible to every aspirant, regardless of background.',
  para2: 'The civil services examination is the most prestigious and most demanding exam in the country. Nermai exists to make the path clearer, the preparation more structured, and the journey less lonely.',
  imageUrl: 'https://nermaiiasacademy.in/wp-content/uploads/2024/11/WhatsApp-Image-2024-11-16-at-10.34.22-PM-2-1.jpeg',
  imageLabel: '187+ RESULTS · 2022–25',
  badges: [
    { num: '187+',  label: 'Results' },
    { num: '14+',   label: 'Years' },
    { num: '2400+', label: 'Students' },
  ]
}

const DEFAULT_TICKER = {
  visible: true,
  items: [
    { text: 'Classroom GS PCM 2027 - Admission Open', link: '#' },
    { text: 'Online GS PCM 2027 - Admission Open', link: '#' },
    { text: 'StepUp Mentorship 2027 - Admission Open', link: '#' }
  ]
}

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

function initReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('visible')
      })
    },
    { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
  )
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el))
  return () => observer.disconnect()
}

export default function Home() {
  const [about, setAbout] = useState(DEFAULT_ABOUT)
  const [stats, setStats] = useState([])
  const [ticker, setTicker] = useState(DEFAULT_TICKER)
  const [journeySteps, setJourneySteps] = useState(undefined)
  const [visibility, setVisibility] = useState({
    stats: true, about: true, features: true, courses: true, steps: true,
    results: true, gallery: true, testimonials: true, freeResources: true
  })

  const location = useLocation()

  useEffect(() => {
    const unsub = fbFirestore.onSettingsChanged(s => {
      if (!s) return
      if (s.homeContent?.ticker) setTicker(s.homeContent.ticker)
      if (s.homeContent?.about) setAbout(ab => ({ ...DEFAULT_ABOUT, ...s.homeContent.about }))
      if (s.homeContent?.stats && Array.isArray(s.homeContent.stats)) setStats(s.homeContent.stats)
      if (s.homeContent?.visibility) setVisibility(v => ({ ...v, ...s.homeContent.visibility }))
      if (s.freeResourcesPage?.homeSectionVisible !== undefined) {
        setVisibility(v => ({ ...v, freeResources: s.freeResourcesPage.homeSectionVisible }))
      } else if (s.freeResourcesVisibility !== undefined) {
        setVisibility(v => ({ ...v, freeResources: s.freeResourcesVisibility }))
      }
      if (s.homeContent?.journeySteps) setJourneySteps(s.homeContent.journeySteps)
    })
    return () => { if (typeof unsub === 'function') unsub() }
  }, [])

  // Calculate active gold badges (Synchronized with StatsBar or Admin customized)
  const goldBadges = useMemo(() => {
    if (about.syncWithStats && stats && stats.length > 0) {
      const visibleStats = stats.filter(s => s.visible !== false)
      if (visibleStats.length > 0) {
        return visibleStats.slice(0, 3).map(s => ({
          num: s.num,
          label: s.label
        }))
      }
    }
    if (about.badges && Array.isArray(about.badges) && about.badges.length > 0) {
      return about.badges
    }
    if (stats && stats.length > 0) {
      const visibleStats = stats.filter(s => s.visible !== false)
      if (visibleStats.length > 0) {
        return visibleStats.slice(0, 3).map(s => ({
          num: s.num,
          label: s.label
        }))
      }
    }
    return DEFAULT_ABOUT.badges
  }, [about.syncWithStats, about.badges, stats])

  useEffect(() => {
    const cleanup = initReveal()
    return () => { cleanup() }
  }, [about])

  useEffect(() => {
    if (location.hash === '#free-resources' || window.location.hash === '#free-resources') {
      const timer = setTimeout(() => {
        const el = document.getElementById('free-resources')
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' })
        }
      }, 250)
      return () => clearTimeout(timer)
    }
  }, [location])

  return (
    <>
      {/* Scroll progress indicator */}
      <ScrollProgress />

      <div id="top" />
      <Header activePath="/" />

      <main>
        {/* ── HERO: Full-Width Cinematic Banners ── */}
        <Hero />

        {/* ── STATS BAR ── */}
        {visibility.stats !== false && <StatsBar />}

        {/* ── ABOUT + INTRO ── */}
        {visibility.about !== false && (
          <section className="section about-intro-section" id="about">
            <div className="container">
              <div className={`about-intro-grid ${visibility.events !== false && about.eventsData?.length !== 0 ? 'has-events' : ''}`}>
                
                {/* Left: Introduction text + Image/Badges group */}
                <div className={`reveal about-intro-text ${visibility.events !== false ? 'events-active' : 'events-inactive'}`}>
                  <span className="eyebrow">{about.eyebrow || 'About Nermai'}</span>
                  <h2 className="about-main-heading">
                    {(about.title || DEFAULT_ABOUT.title).split('\n').map((line, i) => (
                      <span key={i}>{line}{i === 0 && <br />}</span>
                    ))}
                  </h2>
                  <div className="about-divider" />
                  <p className="about-para">{about.para1}</p>
                  <p className="about-para">{about.para2}</p>
                  
                  <a href="/why-nermai" className="btn btn-outline about-cta-btn">
                    Our Story <i className="fa-solid fa-arrow-right" style={{ marginLeft: '8px' }} />
                  </a>
                  
                  {/* Optional Image Frame */}
                  {about.imageUrl && (
                    <div className="about-img-group" style={{ marginTop: '2rem', width: '100%', maxWidth: '500px' }}>
                      <div className="about-img-frame">
                        <img
                          src={about.imageUrl}
                          alt={about.imageLabel || 'Nermai IAS Academy Results'}
                          style={{ width: '100%', display: 'block', objectFit: 'cover' }}
                          onError={e => { e.currentTarget.style.display = 'none' }}
                        />
                        <div className="about-img-label">{about.imageLabel}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column: Events Calendar + Yellow Stat Badges */}
                <div className="reveal" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', justifyContent: 'flex-start' }}>
                  {visibility.events !== false && <EventsCalendar />}

                  {/* Yellow Stat Badges moved below Upcoming Events */}
                  {about.showBadges !== false && (
                    <div className="about-badges-row" style={{ marginTop: 0 }}>
                      {goldBadges.map((b, i) => (
                        <div key={i} className="about-badge-v2">
                          <span className="about-badge-num">{b.num}</span>
                          <span className="about-badge-label">{b.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                
              </div>
            </div>
          </section>
        )}

        {/* ── COURSES ── */}
        {visibility.courses !== false && <Courses />}

        {/* ── UNIFIED SUCCESS STORIES & TESTIMONIALS (TOPPERS LIST) ── */}
        {visibility.results !== false && visibility.toppers !== false && <SuccessStoriesSection />}

        {/* ── WHAT YOU GET (Features / Nermai Class Platform) ── */}
        {visibility.features !== false && <WhatYouGet />}

        {/* ── WHY NERMAI ── */}
        <WhyNermai />

        {/* ── GALLERY ── */}
        {visibility.gallery !== false && <Gallery />}

        {/* ── GOOGLE REVIEWS (Elfsight Widget) ── */}
        {visibility.googleReviews !== false && <GoogleReviews />}

        {/* ── FREE LEARNING RESOURCES (Study Notes & Question Banks) ── */}
        {visibility.freeResources !== false && (
          <section id="free-resources" className="section free-resources-section" style={{ background: 'var(--cream)', scrollMarginTop: '110px' }}>
            <div className="container free-resources-container" style={{ maxWidth: '1440px', margin: '0 auto' }}>
              <ResourcesDesk isWidget={true} />
            </div>
          </section>
        )}
      </main>

      <OfficeLocations />
      <Footer />
    </>
  )
}
