import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { fbFirestore } from '../firebase/firestore'
import { driveStorage } from '../services/driveStorage'
import { LMS_URL, CONTACT, COURSES } from '../constants'

export default function Footer() {
  const [footerData, setFooterData] = useState(null)

  useEffect(() => {
    fbFirestore.getSettings().then(s => {
      if (s.footer) {
        setFooterData(s.footer)
      }
    })
  }, [])

  // Provide a safe fallback if Firestore footer data is missing during transition
  const defaultFooter = {
    cta: {
      heading: "Begin It's first step to success",
      sub: "Contact us for registration, seat availability, feedback or complaints",
      btnText: "Contact Us",
      btnLink: "/contact"
    },
    brand: {
      desc: "An institution run & administered by the volunteers of Nermai Trust & Nermai Samuga Iyakkam, with an objective to empower youths especially from rural & Economically/Socially weaker sections in public employment (Government Recruitments).",
      badge: "Non Profit · Non Commercial"
    },
    contact: {
      address: "No. 156 / 3, (1st & 2nd Floor), Nanbargal Nagar,\nPondy – Villianur Main Road, Oulgaret,\nPuducherry – 605 010",
      phones: CONTACT.phones.join(', '),
      email: CONTACT.email
    },
    usefulLinks: [
      { label: 'Examinations', link: '/#examinations' },
      { label: 'Gallery', link: '/#gallery' },
      { label: 'About Us', link: '/why-nermai' },
      { label: 'Contact Us', link: '/contact' },
      { label: 'All Courses', link: '/courses' }
    ],
    notifications: [
      { label: 'Banking', link: LMS_URL },
      { label: 'Exam Notifications', link: LMS_URL },
      { label: 'Study Material', link: LMS_URL },
      { label: 'Pondicherry Recruitments', link: LMS_URL },
      { label: 'Central Recruitments', link: LMS_URL }
    ],
    coursesLinks: COURSES.slice(0, 4).map(c => ({ label: c.name, link: `/courses/${c.slug}` })),
    bottom: {
      meta: "Non Profit | Non Commercial"
    },
    contactCard: {
      heading: '"NERMAI IAS ACADEMY" is ready — download the file or scan the QR code.',
      desc: "Scan the QR with the iPhone Camera app, or Android's Camera/Google Lens — it'll offer to add the contact directly. Or share the downloaded .vcf file instead.",
      qrImage: '/nermai-qr-contact.svg', // Real QR code generated from NERMAI VCF contact data
      vcfUrl: '/NERMAI_IAS_ACADEMY.vcf'
    },
    socialLinks: [
      { name: 'YouTube', link: CONTACT.youtube || '#', iconClass: 'fa-brands fa-youtube', iconUrl: '' },
      { name: 'Instagram', link: CONTACT.instagram || '#', iconClass: 'fa-brands fa-instagram', iconUrl: '' },
      { name: 'Telegram', link: CONTACT.telegram || '#', iconClass: 'fa-brands fa-telegram', iconUrl: '' }
    ]
  }

  const f = footerData ? {
    ...defaultFooter,
    ...footerData,
    // Deep-merge contactCard: uploaded fields override defaults field-by-field
    contactCard: {
      ...defaultFooter.contactCard,
      ...(footerData.contactCard || {}),
      // If Firestore has an empty qrImage, fall back to the local SVG
      qrImage: (footerData.contactCard?.qrImage || '').trim() || defaultFooter.contactCard.qrImage
    }
  } : defaultFooter;

  const showUseful = f.showUsefulLinks !== false && (f.usefulLinks || []).length > 0
  const showNotifs = f.showNotifications !== false && (f.notifications || []).length > 0
  const showCourses = f.showCoursesLinks !== false && (f.coursesLinks || []).length > 0

  return (
    <footer className="site-footer" id="contact">

      {/* CTA Banner */}
      <div className="footer-cta-banner">
        <div className="container">
          <div className="footer-cta-inner">
            <div>
              <h3 className="footer-cta-heading">{f.cta.heading}</h3>
              <p className="footer-cta-sub">{f.cta.sub}</p>
            </div>
            <a href={f.cta.btnLink || "/contact"} className="btn btn-primary footer-cta-btn">
              <i className="fa-solid fa-envelope" style={{ marginRight: '8px' }} />
              {f.cta.btnText}
            </a>
          </div>
        </div>
      </div>

      {/* Main footer grid */}
      <div className="footer-main">
        <div className="container">

          <div className="footer-grid">

            {/* About / Brand */}
            <div className="footer-col footer-brand-col">
              <div className="footer-col-brand">
                <img src="/nermai-logo.png" alt="Nermai IAS Academy Logo" style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.src = '/favicon.png' }} />
                <span className="footer-brand-name">NERMAI IAS ACADEMY</span>
              </div>
              <p className="footer-brand-desc">{f.brand.desc}</p>
              <div className="footer-tagline-badge">{f.brand.badge}</div>
              <div className="footer-socials">
                {(f.socialLinks || []).map((social, i) => (
                  <a key={i} href={social.link || '#'} className="footer-social-btn" aria-label={social.name} rel="noopener noreferrer" target="_blank">
                    {social.iconUrl ? (
                      <img src={driveStorage.formatImageUrl(social.iconUrl) || social.iconUrl} alt={social.name} style={{ width: '20px', height: '20px', objectFit: 'contain' }} onError={(e) => driveStorage.handleImageError(e, '')} />
                    ) : (
                      <i className={social.iconClass || "fa-solid fa-link"} />
                    )}
                  </a>
                ))}
              </div>
            </div>

            {/* Contact Info */}
            <div className="footer-col footer-contact-col">
              <div className="footer-col-title">Contact Information</div>
              <div className="footer-contact-list">
                <div className="footer-contact-item">
                  <i className="fa-solid fa-location-dot footer-contact-icon" />
                  <span style={{ whiteSpace: 'pre-wrap' }}>
                    {f.contact.address}
                  </span>
                </div>
                {(f.contact.phones || '').split(',').map(ph => ph.trim()).filter(Boolean).map(ph => (
                  <div key={ph} className="footer-contact-item">
                    <i className="fa-solid fa-phone footer-contact-icon" />
                    <a href={`tel:${ph.replace(/\s/g, '')}`} className="footer-link">{ph}</a>
                  </div>
                ))}
                <div className="footer-contact-item">
                  <i className="fa-solid fa-envelope footer-contact-icon" />
                  <a href={`mailto:${f.contact.email}`} className="footer-link">{f.contact.email}</a>
                </div>
              </div>
            </div>

            {/* Useful Links */}
            {showUseful && (
              <div className="footer-col footer-useful-col">
                <div className="footer-col-title">Useful Links</div>
                <ul className="footer-links">
                  {(f.usefulLinks || []).map((lnk, i) => (
                    <li key={i}>
                      {lnk.link.startsWith('/') || lnk.link.startsWith('#') ? (
                        <Link to={lnk.link} className="footer-link">{lnk.label}</Link>
                      ) : (
                        <a href={lnk.link} target="_blank" rel="noopener noreferrer" className="footer-link">{lnk.label}</a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Notifications */}
            {showNotifs && (
              <div className="footer-col footer-notifs-col">
                <div className="footer-col-title">Notifications</div>
                <ul className="footer-links">
                  {(f.notifications || []).map((lnk, i) => (
                    <li key={i}>
                      <a href={lnk.link} className="footer-link" target="_blank" rel="noopener noreferrer">{lnk.label}</a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Courses Links */}
            {showCourses && (
              <div className="footer-col footer-courses-col">
                <div className="footer-col-title">Courses</div>
                <ul className="footer-links">
                  {(f.coursesLinks || []).map((lnk, i) => (
                    <li key={i}>
                      {lnk.link.startsWith('/') ? (
                        <Link to={lnk.link} className="footer-link">{lnk.label}</Link>
                      ) : (
                        <a href={lnk.link} className="footer-link">{lnk.label}</a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {/* Contact QR Code Column */}
            {f.contactCard && (f.contactCard.heading || f.contactCard.qrImage) && (
              <div className="footer-col footer-qr-col">
                {f.contactCard.heading && (
                  <div className="footer-col-title footer-qr-heading">
                    {f.contactCard.heading}
                  </div>
                )}
                {/* Always show QR: uploaded image first, fallback to generated SVG */}
                <div className="footer-qr-card">
                  <img
                    src={driveStorage.formatImageUrl(f.contactCard.qrImage) || f.contactCard.qrImage}
                    alt="QR Code - Scan to Save Contact"
                    className="footer-qr-img"
                    onError={(e) => {
                      // Try Drive CDN fallback chain first (for uploaded Drive URLs)
                      const step = e.currentTarget.dataset.fallbackStep
                      if (!step) {
                        driveStorage.handleImageError(e, '/nermai-qr-contact.svg')
                      } else if (e.currentTarget.src !== '/nermai-qr-contact.svg') {
                        // All Drive CDN attempts failed — use the local SVG fallback
                        e.currentTarget.src = '/nermai-qr-contact.svg'
                      }
                    }}
                  />
                  <p className="footer-qr-caption">Scan to Save Contact</p>
                </div>
                {f.contactCard.desc && (
                  <p className="footer-qr-desc">
                    {f.contactCard.desc}
                  </p>
                )}
                <a
                  href={f.contactCard.vcfUrl || '#'}
                  download
                  className="footer-save-contact-btn"
                >
                  <i className="fa-solid fa-address-book" />
                  <span>SAVE CONTACT</span>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="footer-bottom">
        <div className="container">
          <div className="footer-bottom-inner">
            <span className="footer-copyright">
              © {new Date().getFullYear()} Nermai IAS Academy. All rights reserved.
            </span>
            <span className="footer-bottom-meta">
              {f.bottom.meta}
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
