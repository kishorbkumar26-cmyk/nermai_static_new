import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { fbFirestore } from '../firebase/firestore'

export default function AdminPage() {
  const [passcode, setPasscode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (sessionStorage.getItem('nermai_admin') === '1') navigate('/admin/dashboard')
  }, [navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!passcode.trim()) return
    setLoading(true); setError('')
    try {
      const ok = await fbFirestore.verifyPasscode(passcode)
      if (ok) {
        sessionStorage.setItem('nermai_admin', '1')
        navigate('/admin/dashboard')
      } else {
        setError('Incorrect passcode. Please try again.')
        inputRef.current?.select()
      }
    } catch (err) {
      setError('Connection error — ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="alp-root">
      <div className="alp-orb alp-orb-1" />
      <div className="alp-orb alp-orb-2" />
      <div className="alp-orb alp-orb-3" />

      <aside className="alp-brand">
        <div className="alp-brand-inner">
          <div className="alp-ring-wrap">
            <div className="alp-ring" />
            <img src="/nermai-logo.png" alt="Nermai IAS Academy" className="alp-logo-img" />
          </div>
          <h1 className="alp-brand-name">Nermai<br />IAS Academy</h1>
          <p className="alp-brand-tagline">
            Shaping tomorrow&apos;s civil servants —<br />one determined mind at a time.
          </p>
          <div className="alp-brand-stats">
            <div className="alp-stat">
              <span className="alp-stat-num">2400+</span>
              <span className="alp-stat-lbl">Students</span>
            </div>
            <div className="alp-stat-div" />
            <div className="alp-stat">
              <span className="alp-stat-num">98%</span>
              <span className="alp-stat-lbl">Success Rate</span>
            </div>
            <div className="alp-stat-div" />
            <div className="alp-stat">
              <span className="alp-stat-num">14+</span>
              <span className="alp-stat-lbl">Years</span>
            </div>
          </div>
        </div>
        <div className="alp-brand-footer">Puducherry · Tamil Nadu</div>
      </aside>

      <main className="alp-form-panel">
        <div className="alp-form-card">
          <div className="alp-mobile-logo">
            <img src="/nermai-logo.png" alt="Nermai" className="alp-mobile-logo-img" />
            <span className="alp-mobile-logo-name">NERMAI IAS ACADEMY</span>
          </div>

          <div className="alp-form-header">
            <div className="alp-form-eyebrow">
              <span className="alp-eyebrow-dot" />
              ADMIN PORTAL · v2.0
            </div>
            <h2 className="alp-form-title">Welcome back</h2>
            <p className="alp-form-desc">
              Enter your passcode to manage the content dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="alp-form" noValidate>
            <div className="alp-field">
              <label className="alp-field-label" htmlFor="alp-passcode">Passcode</label>
              <div className="alp-input-wrap">
                <i className="fa-solid fa-key alp-input-icon" />
                <input
                  id="alp-passcode"
                  ref={inputRef}
                  type={showPass ? 'text' : 'password'}
                  className={`alp-input${error ? ' alp-input--error' : ''}`}
                  placeholder="Enter your admin passcode"
                  value={passcode}
                  onChange={e => { setPasscode(e.target.value); setError('') }}
                  autoFocus
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="alp-toggle-pass"
                  onClick={() => setShowPass(v => !v)}
                  aria-label={showPass ? 'Hide passcode' : 'Show passcode'}
                  tabIndex={-1}
                >
                  <i className={`fa-solid ${showPass ? 'fa-eye-slash' : 'fa-eye'}`} />
                </button>
              </div>
              {error && (
                <div className="alp-error" role="alert">
                  <i className="fa-solid fa-circle-exclamation" />
                  {error}
                </div>
              )}
            </div>

            <button
              type="submit"
              id="alp-submit"
              className="alp-submit"
              disabled={loading || !passcode.trim()}
            >
              {loading ? (
                <><i className="fa-solid fa-spinner fa-spin" /> Verifying&hellip;</>
              ) : (
                <><i className="fa-solid fa-arrow-right-to-bracket" /> Access Dashboard</>
              )}
            </button>
          </form>

          <div className="alp-hint">
            <i className="fa-solid fa-shield-halved" />
            Authorised access only
          </div>
        </div>
      </main>
    </div>
  )
}
