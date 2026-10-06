import React, { useState, useEffect } from 'react'
import { fbFirestore, DEFAULT_WHY_NERMAI, DEFAULT_WHY_NERMAI_SHOWCASE } from '../../firebase/firestore'
import AdminImageUpload from './AdminImageUpload'
import WhyNermaiCard from '../WhyNermaiCard'
import WhyNermaiShowcase from '../WhyNermaiShowcase'
import { 
  Plus, Trash2, ArrowUp, ArrowDown, RotateCcw, Save, Eye, Sparkles, 
  Layers, LayoutTemplate, Heart, BookOpen, ClipboardCheck, UserCheck, 
  Laptop, Trophy, Users, GraduationCap, TrendingUp, ShieldCheck, Target, 
  Award, Star, CheckCircle, Flame, Compass, Zap, Image as ImageIcon
} from 'lucide-react'

const ICON_CHOICES = [
  { value: 'Heart', label: 'Heart / Care / Mission' },
  { value: 'BookOpen', label: 'Book / Syllabus' },
  { value: 'ClipboardCheck', label: 'Clipboard / Test Practice' },
  { value: 'UserCheck', label: 'User / Mentorship & Guidance' },
  { value: 'Laptop', label: 'Laptop / Online & Offline' },
  { value: 'Trophy', label: 'Trophy / Result Driven' },
  { value: 'Users', label: 'Users / Faculty' },
  { value: 'GraduationCap', label: 'Graduation Cap' },
  { value: 'TrendingUp', label: 'Trending Up / Growth' },
  { value: 'ShieldCheck', label: 'Shield / Integrity' },
  { value: 'Target', label: 'Target / Focus' },
  { value: 'Award', label: 'Award / Excellence' },
  { value: 'Sparkles', label: 'Sparkles / Special' },
  { value: 'Star', label: 'Star / Top Quality' },
  { value: 'CheckCircle', label: 'Check Circle' },
  { value: 'Flame', label: 'Flame / Passion' },
  { value: 'Compass', label: 'Compass / Direction' },
  { value: 'Zap', label: 'Zap / Speed & Energy' }
]
function ToggleSwitch({ label, checked, onChange, color = '#7B1B2E', subtitle }) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', margin: 0, userSelect: 'none' }}>
      <span style={{
        position: 'relative',
        display: 'inline-block',
        width: '38px',
        height: '20px',
        backgroundColor: checked ? color : '#cbd5e1',
        borderRadius: '20px',
        transition: 'background-color 0.2s ease',
        flexShrink: 0
      }}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
        />
        <span style={{
          position: 'absolute',
          top: '2px',
          left: checked ? '20px' : '2px',
          width: '16px',
          height: '16px',
          backgroundColor: '#ffffff',
          borderRadius: '50%',
          transition: 'left 0.2s ease',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
        }} />
      </span>
      {label && (
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: checked ? '#1f2937' : '#64748b' }}>
          {label}
        </span>
      )}
    </label>
  )
}

export default function WhyNermaiAdminSection({ toast }) {
  const [activeTab, setActiveTab] = useState('showcase') // 'showcase' | 'card'
  const [cardData, setCardData] = useState(DEFAULT_WHY_NERMAI)
  const [showcaseData, setShowcaseData] = useState(DEFAULT_WHY_NERMAI_SHOWCASE)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(true)
  const [isVisible, setIsVisible] = useState(true)
  const [savingVisibility, setSavingVisibility] = useState(false)

  useEffect(() => {
    fbFirestore.getSettings().then((settings) => {
      // Load Inner Page Card
      if (settings?.whyNermai) {
        const storedPillars = Array.isArray(settings.whyNermai.pillars) && settings.whyNermai.pillars.length > 0
          ? settings.whyNermai.pillars
          : (Array.isArray(settings.whyNermai.points) && settings.whyNermai.points.length > 0
              ? settings.whyNermai.points.map(p => ({
                  id: p.id,
                  number: p.number,
                  icon: 'Trophy',
                  title: p.title,
                  desc: p.desc
                }))
              : DEFAULT_WHY_NERMAI.pillars)

        setCardData({
          ...DEFAULT_WHY_NERMAI,
          ...settings.whyNermai,
          heroImageUrl: settings.whyNermai.heroImageUrl || DEFAULT_WHY_NERMAI.heroImageUrl,
          pillars: storedPillars
        })
      } else {
        setCardData(DEFAULT_WHY_NERMAI)
      }

      // Load Homepage Showcase
      if (settings?.whyNermaiShowcase) {
        setShowcaseData({
          ...DEFAULT_WHY_NERMAI_SHOWCASE,
          ...settings.whyNermaiShowcase,
          steps: Array.isArray(settings.whyNermaiShowcase.steps) && settings.whyNermaiShowcase.steps.length > 0
            ? settings.whyNermaiShowcase.steps
            : DEFAULT_WHY_NERMAI_SHOWCASE.steps
        })
      } else {
        setShowcaseData(DEFAULT_WHY_NERMAI_SHOWCASE)
      }

      // Load home section visibility
      if (settings?.homeContent?.visibility?.whyNermai !== undefined) {
        setIsVisible(settings.homeContent.visibility.whyNermai)
      }

      setLoading(false)
    })
  }, [])

  // ── Showcase State Handlers ──
  const handleShowcaseField = (field, value) => {
    setShowcaseData(prev => ({ ...prev, [field]: value }))
  }

  const handleShowcaseStepChange = (index, field, value) => {
    setShowcaseData(prev => {
      const newSteps = [...prev.steps]
      newSteps[index] = { ...newSteps[index], [field]: value }
      return { ...prev, steps: newSteps }
    })
  }

  const handleAddShowcaseStep = () => {
    setShowcaseData(prev => {
      const nextNum = prev.steps.length + 1
      const numStr = nextNum < 10 ? `0${nextNum}` : `${nextNum}`
      const newStep = {
        id: `step_${Date.now()}`,
        num: numStr,
        circleStyle: nextNum % 2 === 1 ? 'circle-maroon' : 'circle-cream',
        icon: 'Trophy',
        title: 'New Feature Title',
        desc: 'Enter detailed description for this feature card here.'
      }
      return { ...prev, steps: [...prev.steps, newStep] }
    })
    toast?.info('Added new step card. Edit its text below.')
  }

  const handleDeleteShowcaseStep = (index) => {
    if (showcaseData.steps.length <= 1) {
      toast?.error('You must keep at least one step in the showcase.')
      return
    }
    setShowcaseData(prev => ({
      ...prev,
      steps: prev.steps.filter((_, idx) => idx !== index)
    }))
  }

  const handleMoveShowcaseStep = (index, direction) => {
    const targetIdx = index + direction
    if (targetIdx < 0 || targetIdx >= showcaseData.steps.length) return
    setShowcaseData(prev => {
      const newSteps = [...prev.steps]
      const temp = newSteps[index]
      newSteps[index] = newSteps[targetIdx]
      newSteps[targetIdx] = temp
      return { ...prev, steps: newSteps }
    })
  }

  // ── Inner Card State Handlers ──
  const handleCardField = (field, value) => {
    setCardData(prev => ({ ...prev, [field]: value }))
  }

  const handlePillarChange = (index, field, value) => {
    setCardData(prev => {
      const newPillars = [...prev.pillars]
      newPillars[index] = { ...newPillars[index], [field]: value }
      return { ...prev, pillars: newPillars }
    })
  }

  const handleAddPillar = () => {
    setCardData(prev => {
      const nextNum = prev.pillars.length + 1
      const numStr = nextNum < 10 ? `0${nextNum}` : `${nextNum}`
      const newPillar = {
        id: `p_${Date.now()}`,
        number: numStr,
        icon: 'Trophy',
        title: 'New Pillar Title',
        desc: 'Enter detailed description with **highlighted keywords** here.'
      }
      return { ...prev, pillars: [...prev.pillars, newPillar] }
    })
    toast?.info('Added new pillar. Edit details below.')
  }

  const handleDeletePillar = (index) => {
    if (cardData.pillars.length <= 1) {
      toast?.error('You must keep at least one pillar in the card.')
      return
    }
    setCardData(prev => ({
      ...prev,
      pillars: prev.pillars.filter((_, idx) => idx !== index)
    }))
  }

  const handleMovePillar = (index, direction) => {
    const targetIdx = index + direction
    if (targetIdx < 0 || targetIdx >= cardData.pillars.length) return
    setCardData(prev => {
      const newPillars = [...prev.pillars]
      const temp = newPillars[index]
      newPillars[index] = newPillars[targetIdx]
      newPillars[targetIdx] = temp
      return { ...prev, pillars: newPillars }
    })
  }

  // ── Reset & Save ──
  const handleReset = () => {
    if (activeTab === 'showcase') {
      if (window.confirm('Reset Homepage "What Makes Nermai Different" section to defaults?')) {
        setShowcaseData(DEFAULT_WHY_NERMAI_SHOWCASE)
        toast?.info('Reset showcase to defaults. Click "Save Changes" to apply.')
      }
    } else {
      if (window.confirm('Reset Inner Page (/why-nermai) card contents to default?')) {
        setCardData(DEFAULT_WHY_NERMAI)
        toast?.info('Reset card to defaults. Click "Save Changes" to apply.')
      }
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (activeTab === 'showcase') {
        await fbFirestore.updateSettings({ whyNermaiShowcase: showcaseData })
        toast?.success('Homepage "What Makes Nermai Different" updated successfully!')
      } else {
        await fbFirestore.updateSettings({ whyNermai: cardData })
        toast?.success('Why Nermai inner page card updated successfully!')
      }
    } catch (err) {
      console.error('Error saving:', err)
      toast?.error(err.message || 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  // ── Toggle Home Section Visibility ────────────────────────────────────────
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
          whyNermai: nextVal
        }
      }
      await fbFirestore.updateSettings({ homeContent: updatedHomeContent })
      if (toast) {
        toast[nextVal ? 'success' : 'info'](
          nextVal
            ? '🟢 "What Makes Nermai Different" section is now VISIBLE on homepage'
            : '🔴 "What Makes Nermai Different" section is now HIDDEN from homepage'
        )
      }
    } catch (err) {
      if (toast) toast.error('Failed to update visibility: ' + err.message)
      setIsVisible(!nextVal)
    } finally {
      setSavingVisibility(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--gray-400)' }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '1.5rem', marginRight: '0.5rem' }} />
        Loading configuration...
      </div>
    )
  }

  return (
    <div className="ap-fade-in" style={{ maxWidth: '1360px', margin: '0 auto' }}>
      
      {/* Title & Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h2 className="ap-section-title" style={{ margin: 0 }}>
            <i className="fa-solid fa-chess-king" style={{ color: 'var(--maroon)', marginRight: '0.5rem' }} />
            Why Nermai & Features Manager
          </h2>
          <p style={{ color: 'var(--gray-500)', fontSize: '0.85rem', margin: '0.35rem 0 0 0' }}>
            Edit every line, step card, metric, quote, and visual element across Homepage and Inner pages.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button 
            className="ap-btn" 
            style={{ background: '#f3f4f6', color: '#374151' }} 
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye size={16} /> {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
          <button 
            className="ap-btn" 
            style={{ background: '#fee2e2', color: '#991b1b' }} 
            onClick={handleReset}
          >
            <RotateCcw size={16} /> Reset
          </button>
          <button 
            className="ap-btn ap-btn-primary" 
            onClick={handleSave} 
            disabled={saving}
          >
            {saving ? (
              <><i className="fa-solid fa-spinner fa-spin" /> Saving...</>
            ) : (
              <><Save size={16} /> Save Changes</>
            )}
          </button>
        </div>
      </div>

      {/* ── Home Section Visibility Banner ── */}
      <div style={{
        background: isVisible ? 'rgba(34, 197, 94, 0.07)' : 'rgba(234, 88, 12, 0.08)',
        border: `1.5px solid ${isVisible ? '#86efac' : '#fdba74'}`,
        borderRadius: '12px',
        padding: '0.9rem 1.25rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        flexWrap: 'wrap'
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
            <span style={{
              width: '10px', height: '10px', borderRadius: '50%',
              background: isVisible ? '#16a34a' : '#ea580c',
              flexShrink: 0,
              boxShadow: isVisible ? '0 0 6px #4ade80' : '0 0 6px #fb923c'
            }} />
            <strong style={{ fontSize: '0.9rem', color: isVisible ? '#15803d' : '#c2410c' }}>
              {isVisible
                ? '"What Makes Nermai Different" Section is VISIBLE on Homepage'
                : '"What Makes Nermai Different" Section is HIDDEN from Homepage'}
            </strong>
          </div>
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--gray-500)' }}>
            {isVisible
              ? 'The Why Nermai features showcase is currently live and visible to all visitors on the homepage.'
              : 'This section is currently hidden from the homepage. Toggle ON to make it visible to visitors.'}
          </p>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', flexShrink: 0 }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--gray-600)' }}>Section:</span>
          <span style={{
            position: 'relative', display: 'inline-block',
            width: '46px', height: '24px',
            background: isVisible ? '#16a34a' : '#cbd5e1',
            borderRadius: '24px',
            transition: 'background 0.2s',
            cursor: savingVisibility ? 'wait' : 'pointer'
          }}>
            <input
              type="checkbox"
              checked={isVisible}
              onChange={handleToggleVisibility}
              disabled={savingVisibility}
              style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
            />
            <span style={{
              position: 'absolute',
              top: '3px',
              left: isVisible ? '25px' : '3px',
              width: '18px', height: '18px',
              background: '#ffffff',
              borderRadius: '50%',
              transition: 'left 0.2s',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
            }} />
          </span>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: isVisible ? '#15803d' : '#9ca3af' }}>
            {savingVisibility ? 'Saving...' : (isVisible ? 'ON' : 'OFF')}
          </span>
        </label>
      </div>

      {/* Main Tab Navigation */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setActiveTab('showcase')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.25rem',
            borderRadius: '8px 8px 0 0',
            border: 'none',
            fontWeight: 700,
            fontSize: '0.92rem',
            cursor: 'pointer',
            background: activeTab === 'showcase' ? '#7B1B2E' : 'transparent',
            color: activeTab === 'showcase' ? '#fff' : '#4b5563',
            transition: 'all 0.2s ease'
          }}
        >
          <LayoutTemplate size={18} />
          1. Homepage Showcase ("What Makes Nermai Different")
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('card')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.25rem',
            borderRadius: '8px 8px 0 0',
            border: 'none',
            fontWeight: 700,
            fontSize: '0.92rem',
            cursor: 'pointer',
            background: activeTab === 'card' ? '#7B1B2E' : 'transparent',
            color: activeTab === 'card' ? '#fff' : '#4b5563',
            transition: 'all 0.2s ease'
          }}
        >
          <Layers size={18} />
          2. Inner Page Card (/why-nermai)
        </button>
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* TAB 1: HOMEPAGE SHOWCASE ("What Makes Nermai Different")      */}
      {/* ──────────────────────────────────────────────────────────── */}
      {activeTab === 'showcase' && (
        <>
          {/* Live Preview Box */}
          {showPreview && (
            <div className="ap-card" style={{ marginBottom: '2rem', background: '#F8F6F0', border: '2px dashed #D4AF37', padding: '1rem', overflowX: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: 'var(--maroon)' }}>
                  <Sparkles size={18} /> Live Homepage Preview
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                  Interactive: Tap cards to flip on mobile, updates in real-time
                </span>
              </div>
              <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(212, 175, 55, 0.25)' }}>
                <WhyNermaiShowcase data={showcaseData} />
              </div>
            </div>
          )}

          {/* 1. Header Section */}
          <div className="ap-card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#111827', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="fa-solid fa-heading" style={{ color: 'var(--maroon)' }} /> 1. Section Header & Subtitle
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              <div className="ap-form-group">
                <label style={{ fontWeight: 600 }}>Gold Eyebrow Text</label>
                <input
                  type="text"
                  className="ap-input"
                  value={showcaseData.eyebrow || ''}
                  onChange={(e) => handleShowcaseField('eyebrow', e.target.value)}
                  placeholder="OUR FEATURES"
                />
              </div>
              <div className="ap-form-group">
                <label style={{ fontWeight: 600 }}>Main Title</label>
                <input
                  type="text"
                  className="ap-input"
                  value={showcaseData.title || ''}
                  onChange={(e) => handleShowcaseField('title', e.target.value)}
                  placeholder="What Makes Nermai Different"
                />
              </div>
            </div>
            <div className="ap-form-group" style={{ marginTop: '0.75rem' }}>
              <label style={{ fontWeight: 600 }}>Subtitle Paragraph</label>
              <input
                type="text"
                className="ap-input"
                value={showcaseData.subtitle || ''}
                onChange={(e) => handleShowcaseField('subtitle', e.target.value)}
                placeholder="Every aspect of our academy is designed around one purpose — your success."
              />
            </div>
          </div>

          {/* 2. Step Cards (Line by Line) */}
          <div className="ap-card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="fa-solid fa-list-ol" style={{ color: 'var(--maroon)' }} /> 2. Step-by-Step Feature Cards ({showcaseData.steps?.length || 0})
              </h3>
              <button
                type="button"
                className="ap-btn ap-btn-primary ap-btn-sm"
                onClick={handleAddShowcaseStep}
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <Plus size={16} /> Add New Step Card
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {(showcaseData.steps || []).map((step, idx) => (
                <div
                  key={step.id || idx}
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    background: idx % 2 === 0 ? '#fff' : '#fcfbf8',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 700, color: '#7B1B2E', fontSize: '0.95rem' }}>
                      Step #{idx + 1} — {step.title || 'Untitled'}
                    </span>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button
                        type="button"
                        className="ap-btn ap-btn-ghost ap-btn-sm"
                        disabled={idx === 0}
                        onClick={() => handleMoveShowcaseStep(idx, -1)}
                        title="Move Up"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        type="button"
                        className="ap-btn ap-btn-ghost ap-btn-sm"
                        disabled={idx === (showcaseData.steps.length - 1)}
                        onClick={() => handleMoveShowcaseStep(idx, 1)}
                        title="Move Down"
                      >
                        <ArrowDown size={14} />
                      </button>
                      <button
                        type="button"
                        className="ap-btn ap-btn-ghost ap-btn-sm"
                        style={{ color: '#dc2626' }}
                        onClick={() => handleDeleteShowcaseStep(idx)}
                        title="Delete Card"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '0.75rem' }}>
                    <div className="ap-form-group">
                      <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Step Number (e.g. 01, 02)</label>
                      <input
                        type="text"
                        className="ap-input"
                        value={step.num || ''}
                        onChange={(e) => handleShowcaseStepChange(idx, 'num', e.target.value)}
                        placeholder={`0${idx + 1}`}
                      />
                    </div>

                    <div className="ap-form-group">
                      <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Card Title / Heading</label>
                      <input
                        type="text"
                        className="ap-input"
                        value={step.title || ''}
                        onChange={(e) => handleShowcaseStepChange(idx, 'title', e.target.value)}
                        placeholder="Non Profit Initiative"
                      />
                    </div>

                    <div className="ap-form-group">
                      <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Icon</label>
                      <select
                        className="ap-input"
                        value={step.icon || 'Trophy'}
                        onChange={(e) => handleShowcaseStepChange(idx, 'icon', e.target.value)}
                      >
                        {ICON_CHOICES.map(icon => (
                          <option key={icon.value} value={icon.value}>{icon.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="ap-form-group">
                      <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Circle Style</label>
                      <select
                        className="ap-input"
                        value={step.circleStyle || 'circle-maroon'}
                        onChange={(e) => handleShowcaseStepChange(idx, 'circleStyle', e.target.value)}
                      >
                        <option value="circle-maroon">Maroon Circle (White Icon)</option>
                        <option value="circle-cream">Cream Circle (Maroon Icon)</option>
                      </select>
                    </div>
                  </div>

                  <div className="ap-form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Card Description Text</label>
                    <textarea
                      className="ap-input"
                      rows={3}
                      value={step.desc || ''}
                      onChange={(e) => handleShowcaseStepChange(idx, 'desc', e.target.value)}
                      placeholder="Enter description text for this step..."
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Bottom Bar: Quote, Metrics & Cursive Note */}
          <div className="ap-card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f3f4f6' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="fa-solid fa-quote-left" style={{ color: 'var(--maroon)' }} /> 3. Bottom Bar Quote & 3 Metrics
              </h3>
              <ToggleSwitch
                label={showcaseData.showBottomBar !== false ? 'Bottom Bar: Visible' : 'Bottom Bar: Hidden'}
                checked={showcaseData.showBottomBar !== false}
                onChange={(val) => handleShowcaseField('showBottomBar', val)}
              />
            </div>

            {showcaseData.showBottomBar === false ? (
              <div style={{ padding: '1rem', background: '#fef2f2', border: '1px dashed #f87171', borderRadius: '8px', color: '#991b1b', fontSize: '0.85rem' }}>
                <i className="fa-solid fa-eye-slash" style={{ marginRight: '6px' }} /> Entire Bottom Bar (Quote, 3 Metrics & Accent Note) is currently <strong>HIDDEN</strong> from the homepage. Turn ON the toggle above to display it.
              </div>
            ) : (
              <>
                {/* Quote Block */}
                <div style={{ border: '1px solid #f3f4f6', borderRadius: '8px', padding: '1rem', background: '#fafafa', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontWeight: 700, color: '#7B1B2E', fontSize: '0.85rem' }}>
                      Featured Quote
                    </span>
                    <ToggleSwitch
                      label={showcaseData.showQuote !== false ? 'Visible' : 'Hidden'}
                      checked={showcaseData.showQuote !== false}
                      onChange={(val) => handleShowcaseField('showQuote', val)}
                    />
                  </div>
                  {showcaseData.showQuote !== false && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                      <div className="ap-form-group" style={{ margin: 0 }}>
                        <label style={{ fontWeight: 600, fontSize: '0.78rem' }}>Featured Quote Text</label>
                        <input
                          type="text"
                          className="ap-input"
                          value={showcaseData.bottomQuote || ''}
                          onChange={(e) => handleShowcaseField('bottomQuote', e.target.value)}
                          placeholder="Education is not a business for us, it's a responsibility."
                        />
                      </div>
                      <div className="ap-form-group" style={{ margin: 0 }}>
                        <label style={{ fontWeight: 600, fontSize: '0.78rem' }}>Quote Author / Label</label>
                        <input
                          type="text"
                          className="ap-input"
                          value={showcaseData.bottomAuthor || ''}
                          onChange={(e) => handleShowcaseField('bottomAuthor', e.target.value)}
                          placeholder="NERMAI"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 3 Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                  {/* Metric 1 */}
                  <div style={{ background: '#fafafa', padding: '1rem', borderRadius: '8px', border: '1px solid #f3f4f6' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span style={{ fontWeight: 700, color: '#7B1B2E', fontSize: '0.85rem' }}>
                        <Users size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Metric 1
                      </span>
                      <ToggleSwitch
                        label={showcaseData.showMetric1 !== false ? 'Visible' : 'Hidden'}
                        checked={showcaseData.showMetric1 !== false}
                        onChange={(val) => handleShowcaseField('showMetric1', val)}
                      />
                    </div>
                    {showcaseData.showMetric1 !== false && (
                      <>
                        <div className="ap-form-group" style={{ marginBottom: '0.5rem' }}>
                          <label style={{ fontSize: '0.78rem' }}>Number / Stat</label>
                          <input
                            type="text"
                            className="ap-input"
                            value={showcaseData.stat1Num || ''}
                            onChange={(e) => handleShowcaseField('stat1Num', e.target.value)}
                            placeholder="187+"
                          />
                        </div>
                        <div className="ap-form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: '0.78rem' }}>Label</label>
                          <input
                            type="text"
                            className="ap-input"
                            value={showcaseData.stat1Label || ''}
                            onChange={(e) => handleShowcaseField('stat1Label', e.target.value)}
                            placeholder="Successful Candidates"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Metric 2 */}
                  <div style={{ background: '#fafafa', padding: '1rem', borderRadius: '8px', border: '1px solid #f3f4f6' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span style={{ fontWeight: 700, color: '#7B1B2E', fontSize: '0.85rem' }}>
                        <GraduationCap size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Metric 2
                      </span>
                      <ToggleSwitch
                        label={showcaseData.showMetric2 !== false ? 'Visible' : 'Hidden'}
                        checked={showcaseData.showMetric2 !== false}
                        onChange={(val) => handleShowcaseField('showMetric2', val)}
                      />
                    </div>
                    {showcaseData.showMetric2 !== false && (
                      <>
                        <div className="ap-form-group" style={{ marginBottom: '0.5rem' }}>
                          <label style={{ fontSize: '0.78rem' }}>Number / Stat</label>
                          <input
                            type="text"
                            className="ap-input"
                            value={showcaseData.stat2Num || ''}
                            onChange={(e) => handleShowcaseField('stat2Num', e.target.value)}
                            placeholder="14+"
                          />
                        </div>
                        <div className="ap-form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: '0.78rem' }}>Label</label>
                          <input
                            type="text"
                            className="ap-input"
                            value={showcaseData.stat2Label || ''}
                            onChange={(e) => handleShowcaseField('stat2Label', e.target.value)}
                            placeholder="Years of Impact"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Metric 3 */}
                  <div style={{ background: '#fafafa', padding: '1rem', borderRadius: '8px', border: '1px solid #f3f4f6' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span style={{ fontWeight: 700, color: '#7B1B2E', fontSize: '0.85rem' }}>
                        <TrendingUp size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Metric 3
                      </span>
                      <ToggleSwitch
                        label={showcaseData.showMetric3 !== false ? 'Visible' : 'Hidden'}
                        checked={showcaseData.showMetric3 !== false}
                        onChange={(val) => handleShowcaseField('showMetric3', val)}
                      />
                    </div>
                    {showcaseData.showMetric3 !== false && (
                      <>
                        <div className="ap-form-group" style={{ marginBottom: '0.5rem' }}>
                          <label style={{ fontSize: '0.78rem' }}>Title / Stat</label>
                          <input
                            type="text"
                            className="ap-input"
                            value={showcaseData.stat3Num || ''}
                            onChange={(e) => handleShowcaseField('stat3Num', e.target.value)}
                            placeholder="Stronger"
                          />
                        </div>
                        <div className="ap-form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: '0.78rem' }}>Label / Description</label>
                          <input
                            type="text"
                            className="ap-input"
                            value={showcaseData.stat3Label || ''}
                            onChange={(e) => handleShowcaseField('stat3Label', e.target.value)}
                            placeholder="Rural Youth, Brighter India"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Handwritten Cursive Note */}
                <div style={{ border: '1px solid #f3f4f6', borderRadius: '8px', padding: '1rem', background: '#fafafa' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#7B1B2E' }}>
                      Right Accent Note (Cursive / Handwritten)
                    </span>
                    <ToggleSwitch
                      label={showcaseData.showCursive !== false ? 'Visible' : 'Hidden'}
                      checked={showcaseData.showCursive !== false}
                      onChange={(val) => handleShowcaseField('showCursive', val)}
                    />
                  </div>
                  {showcaseData.showCursive !== false && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                      <div className="ap-form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: '0.78rem' }}>Line 1</label>
                        <input
                          type="text"
                          className="ap-input"
                          value={showcaseData.cursiveLine1 || ''}
                          onChange={(e) => handleShowcaseField('cursiveLine1', e.target.value)}
                          placeholder="Same Dedication."
                        />
                      </div>
                      <div className="ap-form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: '0.78rem' }}>Line 2</label>
                        <input
                          type="text"
                          className="ap-input"
                          value={showcaseData.cursiveLine2 || ''}
                          onChange={(e) => handleShowcaseField('cursiveLine2', e.target.value)}
                          placeholder="A Brighter Tomorrow."
                        />
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* 4. Action CTA Button */}
          <div className="ap-card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f3f4f6' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="fa-solid fa-arrow-pointer" style={{ color: 'var(--maroon)' }} /> 4. Action Call-to-Action (CTA) Button
              </h3>
              <ToggleSwitch
                label={showcaseData.showCta !== false ? 'CTA Button: Visible' : 'CTA Button: Hidden'}
                checked={showcaseData.showCta !== false}
                onChange={(val) => handleShowcaseField('showCta', val)}
              />
            </div>

            {showcaseData.showCta === false ? (
              <div style={{ padding: '1rem', background: '#fef2f2', border: '1px dashed #f87171', borderRadius: '8px', color: '#991b1b', fontSize: '0.85rem' }}>
                <i className="fa-solid fa-eye-slash" style={{ marginRight: '6px' }} /> The Call-to-Action button is currently <strong>HIDDEN</strong> from the homepage. Turn ON the toggle above to display it.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                <div className="ap-form-group">
                  <label style={{ fontWeight: 600 }}>Button Text</label>
                  <input
                    type="text"
                    className="ap-input"
                    value={showcaseData.ctaText || ''}
                    onChange={(e) => handleShowcaseField('ctaText', e.target.value)}
                    placeholder="JOIN NERMAI TODAY"
                  />
                </div>
                <div className="ap-form-group">
                  <label style={{ fontWeight: 600 }}>Button Link / Destination URL</label>
                  <input
                    type="text"
                    className="ap-input"
                    value={showcaseData.ctaLink || ''}
                    onChange={(e) => handleShowcaseField('ctaLink', e.target.value)}
                    placeholder="#contact or /courses or https://..."
                  />
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* TAB 2: INNER PAGE CARD (/why-nermai)                          */}
      {/* ──────────────────────────────────────────────────────────── */}
      {activeTab === 'card' && (
        <>
          {/* Live Preview Box */}
          {showPreview && (
            <div className="ap-card" style={{ marginBottom: '2rem', background: '#F8F6F0', border: '2px dashed #D4AF37', padding: '1rem', overflowX: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: 'var(--maroon)' }}>
                  <Sparkles size={18} /> Live Section Preview
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                  Rendered in real-time as displayed on /why-nermai
                </span>
              </div>
              <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(212, 175, 55, 0.25)' }}>
                <WhyNermaiCard data={cardData} />
              </div>
            </div>
          )}

          {/* 1. Header & Titles */}
          <div className="ap-card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#111827', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="fa-solid fa-heading" style={{ color: 'var(--maroon)' }} /> 1. Header & Subtitles
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              <div className="ap-form-group">
                <label style={{ fontWeight: 600 }}>Gold Eyebrow Text</label>
                <input
                  type="text"
                  className="ap-input"
                  value={cardData.eyebrow || ''}
                  onChange={(e) => handleCardField('eyebrow', e.target.value)}
                  placeholder="OUR STRENGTH"
                />
              </div>

              <div className="ap-form-group">
                <label style={{ fontWeight: 600 }}>Title Prefix (Dark Serif)</label>
                <input
                  type="text"
                  className="ap-input"
                  value={cardData.titlePrefix || ''}
                  onChange={(e) => handleCardField('titlePrefix', e.target.value)}
                  placeholder="Why"
                />
              </div>

              <div className="ap-form-group">
                <label style={{ fontWeight: 600 }}>Title Highlight (Crimson Maroon)</label>
                <input
                  type="text"
                  className="ap-input"
                  value={cardData.titleHighlight || ''}
                  onChange={(e) => handleCardField('titleHighlight', e.target.value)}
                  placeholder="NermaiIAS?"
                  style={{ fontWeight: 700, color: '#7A1526' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginTop: '0.75rem' }}>
              <div className="ap-form-group">
                <label style={{ fontWeight: 600 }}>Subtitle Line 1</label>
                <input
                  type="text"
                  className="ap-input"
                  value={cardData.subtitleLine1 || ''}
                  onChange={(e) => handleCardField('subtitleLine1', e.target.value)}
                  placeholder="Quality mentorship. Accessible learning. Proven results."
                />
              </div>

              <div className="ap-form-group">
                <label style={{ fontWeight: 600 }}>Subtitle Line 2</label>
                <input
                  type="text"
                  className="ap-input"
                  value={cardData.subtitleLine2 || ''}
                  onChange={(e) => handleCardField('subtitleLine2', e.target.value)}
                  placeholder="That's the Nermai difference."
                />
              </div>
            </div>
          </div>

          {/* 2. Pillars / Points Editor */}
          <div className="ap-card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="fa-solid fa-list-check" style={{ color: 'var(--maroon)' }} /> 2. Five Strategic Pillars ({cardData.pillars?.length || 0})
              </h3>
              <button 
                type="button"
                className="ap-btn ap-btn-primary ap-btn-sm" 
                onClick={handleAddPillar}
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <Plus size={16} /> Add Pillar
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {(cardData.pillars || []).map((p, idx) => (
                <div 
                  key={p.id || idx} 
                  style={{ 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '12px', 
                    padding: '1.25rem', 
                    background: idx % 2 === 0 ? '#fff' : '#fcfbf8',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 700, color: '#7A1526', fontSize: '0.95rem' }}>
                      Pillar #{idx + 1} — {p.title || 'Untitled'}
                    </span>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button 
                        type="button"
                        className="ap-btn ap-btn-ghost ap-btn-sm" 
                        disabled={idx === 0} 
                        onClick={() => handleMovePillar(idx, -1)}
                        title="Move Up"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button 
                        type="button"
                        className="ap-btn ap-btn-ghost ap-btn-sm" 
                        disabled={idx === (cardData.pillars.length - 1)} 
                        onClick={() => handleMovePillar(idx, 1)}
                        title="Move Down"
                      >
                        <ArrowDown size={14} />
                      </button>
                      <button 
                        type="button"
                        className="ap-btn ap-btn-ghost ap-btn-sm" 
                        style={{ color: '#dc2626' }}
                        onClick={() => handleDeletePillar(idx)}
                        title="Delete Pillar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '0.75rem' }}>
                    <div className="ap-form-group">
                      <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Number (e.g. 01, 02)</label>
                      <input
                        type="text"
                        className="ap-input"
                        value={p.number || ''}
                        onChange={(e) => handlePillarChange(idx, 'number', e.target.value)}
                        placeholder={`0${idx + 1}`}
                      />
                    </div>

                    <div className="ap-form-group">
                      <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Pillar Title</label>
                      <input
                        type="text"
                        className="ap-input"
                        value={p.title || ''}
                        onChange={(e) => handlePillarChange(idx, 'title', e.target.value)}
                        placeholder="Proven Results"
                      />
                    </div>

                    <div className="ap-form-group">
                      <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Icon</label>
                      <select
                        className="ap-input"
                        value={p.icon || 'Trophy'}
                        onChange={(e) => handlePillarChange(idx, 'icon', e.target.value)}
                      >
                        {ICON_CHOICES.map(icon => (
                          <option key={icon.value} value={icon.value}>{icon.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="ap-form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                      Description Text <span style={{ color: 'var(--gray-400)', fontWeight: 400 }}>(Wrap words with **stars** for gold bold highlight)</span>
                    </label>
                    <textarea
                      className="ap-input"
                      rows={3}
                      value={p.desc || ''}
                      onChange={(e) => handlePillarChange(idx, 'desc', e.target.value)}
                      placeholder="e.g. Quality coaching at an **affordable fee**..."
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Hero Visual & Side Info Card */}
          <div className="ap-card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#111827', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ImageIcon size={18} style={{ color: 'var(--maroon)' }} /> 3. Chess Visual & Side Cards
            </h3>

            <div style={{ marginBottom: '1.25rem' }}>
              <AdminImageUpload
                label="Section Hero Visual Image (e.g. King Chess Piece / Campus / Academy Emblem)"
                value={cardData.heroImageUrl || ''}
                onChange={(url) => handleCardField('heroImageUrl', url)}
                subFolderName="why-nermai"
                aspectRatio="4/3"
                maxWidth={1200}
                hint="Recommended: 800 × 600 px • Dark themed King Chess image / Gold accents"
                placeholder="Paste image link or upload..."
                toast={toast}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              <div style={{ border: '1px solid #f3f4f6', borderRadius: '8px', padding: '1rem', background: '#fafafa' }}>
                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#7A1526', display: 'block', marginBottom: '0.5rem' }}>
                  Floating Gold Badge (Bottom Left)
                </span>
                <div className="ap-form-group" style={{ marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.78rem' }}>Top Small Text</label>
                  <input
                    type="text"
                    className="ap-input"
                    value={cardData.badgeText || ''}
                    onChange={(e) => handleCardField('badgeText', e.target.value)}
                    placeholder="NERMAI IAS"
                  />
                </div>
                <div className="ap-form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.78rem' }}>Bottom Bold Highlight</label>
                  <input
                    type="text"
                    className="ap-input"
                    value={cardData.badgeHighlight || ''}
                    onChange={(e) => handleCardField('badgeHighlight', e.target.value)}
                    placeholder="ACADEMY"
                  />
                </div>
              </div>

              <div style={{ border: '1px solid #f3f4f6', borderRadius: '8px', padding: '1rem', background: '#fafafa' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#7A1526' }}>
                    Bottom Script Note (Italic Cursive)
                  </span>
                  <ToggleSwitch
                    label={cardData.showCustomScript ? 'Visible' : 'Hidden'}
                    checked={!!cardData.showCustomScript}
                    onChange={(val) => handleCardField('showCustomScript', val)}
                  />
                </div>
                <div className="ap-form-group" style={{ marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.78rem' }}>Line 1</label>
                  <input
                    type="text"
                    className="ap-input"
                    value={cardData.bottomScriptLine1 || ''}
                    onChange={(e) => handleCardField('bottomScriptLine1', e.target.value)}
                    placeholder="Students Today"
                  />
                </div>
                <div className="ap-form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.78rem' }}>Line 2</label>
                  <input
                    type="text"
                    className="ap-input"
                    value={cardData.bottomScriptLine2 || ''}
                    onChange={(e) => handleCardField('bottomScriptLine2', e.target.value)}
                    placeholder="A Stronger Tomorrow"
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Bottom Save Bar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', padding: '1rem 0' }}>
        <button 
          type="button"
          className="ap-btn ap-btn-primary ap-btn-lg" 
          onClick={handleSave} 
          disabled={saving}
          style={{ minWidth: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
        >
          {saving ? (
            <><i className="fa-solid fa-spinner fa-spin" /> Saving...</>
          ) : (
            <><Save size={18} /> Save All Changes</>
          )}
        </button>
      </div>

    </div>
  )
}
