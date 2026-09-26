import React, { useState, useEffect } from 'react'
import { fbFirestore, DEFAULT_FREE_RESOURCES_SETTINGS } from '../../firebase/firestore'
import { driveStorage } from '../../services/driveStorage'
import { extractGoogleDriveId } from '../../utils/imageOptimizer'
import { inspectPdfFile, formatBytes } from '../../utils/pdfInspector'
import AdminImageUpload from './AdminImageUpload'

export default function FreeResourcesAdminSection({ toast }) {
  const [activeTab, setActiveTab] = useState('words') // 'words' | 'catalogue' | 'drive'
  const [settings, setSettings] = useState(DEFAULT_FREE_RESOURCES_SETTINGS)
  const [resources, setResources] = useState([])
  const [savingSettings, setSavingSettings] = useState(false)
  const [_loading, setLoading] = useState(true)
  const [isVisible, setIsVisible] = useState(true)
  const [savingVisibility, setSavingVisibility] = useState(false)

  // Add / Edit Resource Form State
  const [showResourceModal, setShowResourceModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [inspectingPdf, setInspectingPdf] = useState(false)
  const [detectedInfo, setDetectedInfo] = useState(null)
  const [resourceForm, setResourceForm] = useState({
    title: '',
    category: 'Current Affairs',
    resourceType: 'Daily Content',
    date: new Date().toISOString().split('T')[0],
    issueInfo: '',
    url: '',
    driveFileId: '',
    thumbnailUrl: '',
    sizeBytes: 2500000,
    pages: 12,
    format: 'PDF',
    isFeatured: false,
    isPopular: false,
    popularRank: '',
    description: '',
    isPublic: true
  })

  // Taxonomy management state (Subjects & Types)
  const [newSubjectInput, setNewSubjectInput] = useState('')
  const [newTypeInput, setNewTypeInput] = useState('')

  // Search in catalogue
  const [catSearch, setCatSearch] = useState('')

  // ── Load Settings & Resources ──────────────────────────────────────────────
  useEffect(() => {
    // 1. Fetch current settings & visibility
    fbFirestore.getFreeResourcesSettings().then(s => {
      if (s) {
        setSettings({ ...DEFAULT_FREE_RESOURCES_SETTINGS, ...s })
        if (s.homeSectionVisible !== undefined) {
          setIsVisible(s.homeSectionVisible)
        }
      }
    }).catch(console.warn)

    fbFirestore.getSettings().then(s => {
      if (s) {
        if (s.freeResourcesPage?.homeSectionVisible !== undefined) {
          setIsVisible(s.freeResourcesPage.homeSectionVisible)
        } else if (s.freeResourcesVisibility !== undefined) {
          setIsVisible(s.freeResourcesVisibility)
        } else if (s.homeContent?.visibility?.freeResources !== undefined) {
          setIsVisible(s.homeContent.visibility.freeResources)
        }
      }
    }).catch(console.warn)

    // 2. Real-time resources listener
    const unsub = fbFirestore.onResourcesChanged(data => {
      setResources(data || [])
      setLoading(false)
    })

    return () => {
      if (typeof unsub === 'function') unsub()
    }
  }, [])

  // ── Toggle Home Section Visibility ──────────────────────────────────────────
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
          freeResources: nextVal
        }
      }
      const updatedFreeResSettings = {
        ...(s.freeResourcesPage || DEFAULT_FREE_RESOURCES_SETTINGS),
        ...settings,
        homeSectionVisible: nextVal
      }
      setSettings(updatedFreeResSettings)
      await fbFirestore.updateSettings({
        freeResourcesVisibility: nextVal,
        freeResourcesPage: updatedFreeResSettings,
        homeContent: updatedHomeContent
      })
      if (toast) {
        toast.success(nextVal ? '🟢 Study Notes & Question Banks section is now VISIBLE on homepage' : '🔴 Study Notes & Question Banks section is now HIDDEN from homepage')
      }
    } catch (err) {
      if (toast) toast.error('Failed to update visibility: ' + err.message)
      setIsVisible(!nextVal)
    } finally {
      setSavingVisibility(false)
    }
  }

  // ── Taxonomy Handlers: Add/Remove Subjects and Types ─────────────────────────
  const handleAddSubject = async () => {
    const val = newSubjectInput.trim()
    if (!val) return
    const currentList = settings.customSubjects || DEFAULT_FREE_RESOURCES_SETTINGS.customSubjects || []
    if (currentList.some(s => s.toLowerCase() === val.toLowerCase())) {
      if (toast) toast.info(`Subject "${val}" already exists.`)
      return
    }
    const updated = [...currentList, val]
    const newSettings = { ...settings, customSubjects: updated }
    setSettings(newSettings)
    setNewSubjectInput('')
    try {
      await fbFirestore.updateFreeResourcesSettings(newSettings)
      if (toast) toast.success(`Subject "${val}" added!`)
    } catch (err) {
      if (toast) toast.error('Failed to save subject: ' + err.message)
    }
  }

  const handleRemoveSubject = async (subjectToRemove) => {
    if (!window.confirm(`Are you sure you want to remove subject "${subjectToRemove}"?`)) return
    const currentList = settings.customSubjects || DEFAULT_FREE_RESOURCES_SETTINGS.customSubjects || []
    const updated = currentList.filter(s => s !== subjectToRemove)
    const newSettings = { ...settings, customSubjects: updated }
    setSettings(newSettings)
    try {
      await fbFirestore.updateFreeResourcesSettings(newSettings)
      if (toast) toast.success(`Subject "${subjectToRemove}" removed.`)
    } catch (err) {
      if (toast) toast.error('Failed to update: ' + err.message)
    }
  }

  const handleAddType = async () => {
    const val = newTypeInput.trim()
    if (!val) return
    const currentList = settings.customTypes || DEFAULT_FREE_RESOURCES_SETTINGS.customTypes || []
    if (currentList.some(t => t.toLowerCase() === val.toLowerCase())) {
      if (toast) toast.info(`Resource Type "${val}" already exists.`)
      return
    }
    const updated = [...currentList, val]
    const newSettings = { ...settings, customTypes: updated }
    setSettings(newSettings)
    setNewTypeInput('')
    try {
      await fbFirestore.updateFreeResourcesSettings(newSettings)
      if (toast) toast.success(`Resource Type "${val}" added!`)
    } catch (err) {
      if (toast) toast.error('Failed to save resource type: ' + err.message)
    }
  }

  const handleRemoveType = async (typeToRemove) => {
    if (!window.confirm(`Are you sure you want to remove resource type "${typeToRemove}"?`)) return
    const currentList = settings.customTypes || DEFAULT_FREE_RESOURCES_SETTINGS.customTypes || []
    const updated = currentList.filter(t => t !== typeToRemove)
    const newSettings = { ...settings, customTypes: updated }
    setSettings(newSettings)
    try {
      await fbFirestore.updateFreeResourcesSettings(newSettings)
      if (toast) toast.success(`Resource Type "${typeToRemove}" removed.`)
    } catch (err) {
      if (toast) toast.error('Failed to update: ' + err.message)
    }
  }

  // Quick toggle public / draft status directly from catalogue table
  const handleTogglePublic = async (res) => {
    const newStatus = res.isPublic === false ? true : false
    try {
      await fbFirestore.updateResource(res.id, { isPublic: newStatus })
      if (toast) {
        if (newStatus) toast.success(`"${res.title}" is now Public for aspirants!`)
        else toast.info(`"${res.title}" is now Draft (hidden from public view).`)
      }
    } catch (err) {
      if (toast) toast.error('Failed to update visibility: ' + err.message)
    }
  }

  // ── Save Page Words Customization ──────────────────────────────────────────
  const handleSaveSettings = async (e) => {
    e?.preventDefault()
    setSavingSettings(true)
    try {
      await fbFirestore.updateFreeResourcesSettings(settings)
      if (toast) toast.success('Page words & customization saved successfully! Live site updated.')
    } catch (err) {
      if (toast) toast.error('Failed to save settings: ' + err.message)
    } finally {
      setSavingSettings(false)
    }
  }

  // Word fields update helper
  const updateSetting = (key, val) => {
    setSettings(prev => ({ ...prev, [key]: val }))
  }

  const updateBadge = (idx, field, val) => {
    const list = [...(settings.badges || [])]
    if (list[idx]) {
      list[idx] = { ...list[idx], [field]: val }
      setSettings(prev => ({ ...prev, badges: list }))
    }
  }

  // ── Resource File Upload with Auto-Inspection ──────────────────────────────
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingFile(true)
    setInspectingPdf(true)

    try {
      // 1. Immediately read PDF locally to extract pages, size, title, and first-page thumbnail!
      let detectedPages = 1
      let detectedSize = file.size
      let detectedThumb = null

      try {
        const inspectResult = await inspectPdfFile(file)
        detectedPages = inspectResult.pageCount || 1
        detectedSize = inspectResult.fileSizeBytes || file.size
        detectedThumb = inspectResult.thumbnailDataUrl

        setDetectedInfo({
          fileName: file.name,
          pages: detectedPages,
          sizeBytes: detectedSize,
          sizeFormatted: formatBytes(detectedSize),
          thumbnail: detectedThumb
        })

        // Auto-fill form fields
        setResourceForm(f => ({
          ...f,
          title: f.title || inspectResult.cleanTitle || file.name.replace(/\.[^/.]+$/, ''),
          pages: detectedPages,
          sizeBytes: detectedSize,
          format: file.name.split('.').pop()?.toUpperCase() || 'PDF',
          thumbnailUrl: detectedThumb || f.thumbnailUrl
        }))
      } catch (inspectErr) {
        console.warn('Local PDF inspection error:', inspectErr)
      }

      // 2. Upload file to Google Drive
      const result = await driveStorage.processAndUploadFile(file, { subFolderName: 'nermai-resources' })
      if (result && result.fileId) {
        const driveCdnThumb = `https://drive.google.com/thumbnail?id=${result.fileId}&sz=w800`
        setResourceForm(f => ({
          ...f,
          url: result.driveUrl || `https://drive.google.com/file/d/${result.fileId}/view`,
          driveFileId: result.fileId,
          thumbnailUrl: detectedThumb || driveCdnThumb || f.thumbnailUrl
        }))
        if (toast) toast.success(`✓ Auto-detected ${detectedPages} pages (${formatBytes(detectedSize)}) & uploaded to Drive!`)
      } else if (result && result.storageType === 'local_base64') {
        // When Google Drive credentials/Apps Script are not configured,
        // storing a multi-megabyte base64 PDF string directly in Firestore exceeds Firestore's 1,048,487 byte document limit.
        setResourceForm(f => ({
          ...f,
          thumbnailUrl: detectedThumb || f.thumbnailUrl
        }))
        if (toast) toast.warning('PDF read successfully! Please paste the Google Drive share link in the Resource URL field (Drive Apps Script not configured).')
      } else if (result && result.url) {
        setResourceForm(f => ({
          ...f,
          url: result.url,
          thumbnailUrl: detectedThumb || f.thumbnailUrl
        }))
        if (toast) toast.success(`✓ Auto-detected ${detectedPages} pages (${formatBytes(detectedSize)})!`)
      }
    } catch (err) {
      if (toast) toast.error('Upload failed: ' + err.message)
    } finally {
      setUploadingFile(false)
      setInspectingPdf(false)
    }
  }

  // Handle URL change to auto-extract Drive ID & Auto-Inspect
  const handleResourceUrlChange = async (val) => {
    const driveId = extractGoogleDriveId(val)
    const cdnThumb = driveId ? `https://drive.google.com/thumbnail?id=${driveId}&sz=w800` : ''
    setResourceForm(f => ({
      ...f,
      url: val,
      driveFileId: driveId || f.driveFileId,
      thumbnailUrl: f.thumbnailUrl || cdnThumb
    }))

    // If a Google Drive link was pasted, auto-detect pages via backend inspection
    if (driveId) {
      try {
        const resp = await fetch(`/api/inspect-drive-pdf?id=${driveId}`)
        if (resp.ok) {
          const data = await resp.json()
          if (data && data.pageCount) {
            setResourceForm(f => ({
              ...f,
              pages: data.pageCount,
              sizeBytes: data.fileSizeBytes || f.sizeBytes,
              thumbnailUrl: data.thumbnailUrl || f.thumbnailUrl
            }))
            setDetectedInfo({
              fileName: 'Google Drive Document',
              pages: data.pageCount,
              sizeBytes: data.fileSizeBytes,
              sizeFormatted: formatBytes(data.fileSizeBytes),
              isDrive: true
            })
            if (toast) toast.success(`✓ Auto-detected ${data.pageCount} pages from Google Drive!`)
          }
        }
      } catch {
        // Silently continue if backend fetch unavailable
      }
    }
  }

  // Open Edit Modal
  const openEditModal = (res) => {
    setEditingId(res.id)
    setDetectedInfo({
      fileName: res.title || 'Resource PDF',
      pages: res.pages || 1,
      sizeBytes: res.sizeBytes || 0,
      isExisting: true
    })
    setResourceForm({
      title: res.title || '',
      category: res.category || (settings.customSubjects?.[0] || 'Current Affairs'),
      resourceType: res.resourceType || (settings.customTypes?.[0] || 'Daily Content'),
      date: res.date || new Date().toISOString().split('T')[0],
      issueInfo: res.issueInfo || '',
      url: res.url || '',
      driveFileId: res.driveFileId || '',
      thumbnailUrl: res.thumbnailUrl || '',
      sizeBytes: res.sizeBytes || 2500000,
      pages: res.pages || 12,
      format: res.format || 'PDF',
      isFeatured: Boolean(res.isFeatured),
      isPopular: Boolean(res.isPopular),
      popularRank: res.popularRank || '',
      description: res.description || '',
      isPublic: res.isPublic !== false
    })
    setShowResourceModal(true)
  }

  // Open Add Modal
  const openAddModal = () => {
    setEditingId(null)
    setDetectedInfo(null)
    setInspectingPdf(false)
    setResourceForm({
      title: '',
      category: settings.customSubjects?.[0] || 'Current Affairs',
      resourceType: settings.customTypes?.[0] || 'Daily Content',
      date: new Date().toISOString().split('T')[0],
      issueInfo: '',
      url: '',
      driveFileId: '',
      thumbnailUrl: '',
      sizeBytes: 2500000,
      pages: 12,
      format: 'PDF',
      isFeatured: false,
      isPopular: false,
      popularRank: '',
      description: '',
      isPublic: true
    })
    setShowResourceModal(true)
  }

  const [savingResource, setSavingResource] = useState(false)

  // Save / Submit Resource
  const handleResourceSubmit = async (e) => {
    e.preventDefault()
    if (savingResource) return

    if (!resourceForm.title.trim() || !resourceForm.url.trim()) {
      if (toast) toast.error('Title and Resource File URL are required.')
      return
    }

    setSavingResource(true)
    try {
      const payload = {
        ...resourceForm,
        sizeBytes: Number(resourceForm.sizeBytes) || 0,
        pages: Number(resourceForm.pages) || 1,
        popularRank: resourceForm.popularRank ? Number(resourceForm.popularRank) : null,
        isPublic: resourceForm.isPublic !== false
      }

      if (editingId) {
        await fbFirestore.updateResource(editingId, payload)
        if (toast) toast.success('Resource updated successfully!')
      } else {
        await fbFirestore.addResource(payload)
        if (toast) toast.success('Resource added to library!')
      }
      setShowResourceModal(false)
      setEditingId(null)
      setDetectedInfo(null)
    } catch (err) {
      if (toast) toast.error('Error saving resource: ' + err.message)
    } finally {
      setSavingResource(false)
    }
  }

  // Delete Resource
  const handleDeleteResource = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return
    try {
      await fbFirestore.deleteResource(id)
      if (toast) toast.success('Resource deleted.')
    } catch (err) {
      if (toast) toast.error('Failed to delete: ' + err.message)
    }
  }

  // Filtered resources in admin table
  const displayedResources = resources.filter(r => {
    if (!catSearch.trim()) return true
    const q = catSearch.toLowerCase()
    return (r.title || '').toLowerCase().includes(q) || (r.category || '').toLowerCase().includes(q)
  })

  return (
    <div className="ap-section">
      
      {/* Header */}
      <div className="ap-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 className="ap-section-title">
            <i className="fa-solid fa-book-open" style={{ color: 'var(--gold)', marginRight: '8px' }} />
            Free Resources & Study Materials Manager
          </h2>
          <p className="ap-section-desc">
            Full word-for-word page customization, Google Drive PDF CDN thumbnail previews, and resource catalogue management.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <a
            href="/free-resources"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}
          >
            <i className="fa-solid fa-arrow-up-right-from-square" /> View Live Page
          </a>
        </div>
      </div>

      {/* ── Home Section Visibility Switch Card ── */}
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
                {isVisible ? 'Study Notes & Question Banks (Home Section) is VISIBLE' : 'Study Notes & Question Banks (Home Section) is HIDDEN'}
              </strong>
            </div>
            <p style={{ margin: '0.25rem 0 0 1.8rem', fontSize: '0.82rem', color: isVisible ? '#047857' : '#b91c1c' }}>
              Controls the visibility of the "FREE LEARNING RESOURCES — Study Notes & Question Banks" card on the website homepage.
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

      {/* Navigation Sub-Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid var(--gray-200)', marginBottom: '1.75rem', paddingBottom: '0.25rem' }}>
        <button
          onClick={() => setActiveTab('words')}
          style={{
            background: 'none', border: 'none',
            padding: '0.6rem 1.2rem',
            fontWeight: 700, fontSize: '0.9rem',
            color: activeTab === 'words' ? 'var(--maroon)' : 'var(--gray-500)',
            borderBottom: activeTab === 'words' ? '3px solid var(--maroon)' : 'none',
            cursor: 'pointer'
          }}
        >
          <i className="fa-solid fa-pen-nib" style={{ marginRight: '6px' }} />
          Word-for-Word Page Customization
        </button>

        <button
          onClick={() => setActiveTab('catalogue')}
          style={{
            background: 'none', border: 'none',
            padding: '0.6rem 1.2rem',
            fontWeight: 700, fontSize: '0.9rem',
            color: activeTab === 'catalogue' ? 'var(--maroon)' : 'var(--gray-500)',
            borderBottom: activeTab === 'catalogue' ? '3px solid var(--maroon)' : 'none',
            cursor: 'pointer'
          }}
        >
          <i className="fa-solid fa-list-check" style={{ marginRight: '6px' }} />
          Resource Catalogue ({resources.length})
        </button>

        <button
          onClick={() => setActiveTab('taxonomy')}
          style={{
            background: 'none', border: 'none',
            padding: '0.6rem 1.2rem',
            fontWeight: 700, fontSize: '0.9rem',
            color: activeTab === 'taxonomy' ? 'var(--maroon)' : 'var(--gray-500)',
            borderBottom: activeTab === 'taxonomy' ? '3px solid var(--maroon)' : 'none',
            cursor: 'pointer'
          }}
        >
          <i className="fa-solid fa-tags" style={{ marginRight: '6px' }} />
          Subjects & Resource Types
        </button>

        <button
          onClick={() => setActiveTab('drive')}
          style={{
            background: 'none', border: 'none',
            padding: '0.6rem 1.2rem',
            fontWeight: 700, fontSize: '0.9rem',
            color: activeTab === 'drive' ? 'var(--maroon)' : 'var(--gray-500)',
            borderBottom: activeTab === 'drive' ? '3px solid var(--maroon)' : 'none',
            cursor: 'pointer'
          }}
        >
          <i className="fa-brands fa-google-drive" style={{ marginRight: '6px' }} />
          Drive CDN & Architecture
        </button>
      </div>

      {/* ─── TAB 1: WORD-FOR-WORD CUSTOMIZATION ─── */}
      {activeTab === 'words' && (
        <form onSubmit={handleSaveSettings}>
          
          {/* Section A: Hero Banner */}
          <div className="ap-card" style={{ marginBottom: '1.5rem' }}>
            <h3 className="ap-card-title"><i className="fa-solid fa-flag" /> Hero Banner Text</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginBottom: '1rem' }}>
              <div className="ap-form-group">
                <label>Eyebrow Tag</label>
                <input
                  type="text" className="ap-input"
                  value={settings.eyebrow || ''}
                  onChange={e => updateSetting('eyebrow', e.target.value)}
                  placeholder="FREE RESOURCES"
                />
              </div>

              <div className="ap-form-group">
                <label>Main Headline</label>
                <input
                  type="text" className="ap-input"
                  value={settings.title || ''}
                  onChange={e => updateSetting('title', e.target.value)}
                  placeholder="Learn. Prepare. Grow."
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div className="ap-form-group">
                <label>Highlight Word (Gold Accent)</label>
                <input
                  type="text" className="ap-input"
                  value={settings.highlightWord || ''}
                  onChange={e => updateSetting('highlightWord', e.target.value)}
                  placeholder="For Free."
                />
              </div>

              <div className="ap-form-group">
                <label>Right Golden Script Slogan (Cursive Lines)</label>
                <textarea
                  className="ap-input" rows={2}
                  value={settings.sloganRight || ''}
                  onChange={e => updateSetting('sloganRight', e.target.value)}
                  placeholder="Knowledge&#10;Today&#10;A Stronger&#10;Tomorrow"
                />
                <span style={{ fontSize: '0.74rem', color: 'var(--gray-400)' }}>Enter text with line breaks for the handwritten gold script in upper right.</span>
              </div>
            </div>

            <div className="ap-form-group" style={{ marginBottom: '1.5rem' }}>
              <label>Hero Description Paragraph</label>
              <textarea
                className="ap-input" rows={2}
                value={settings.description || ''}
                onChange={e => updateSetting('description', e.target.value)}
                placeholder="Access high-quality study materials, daily updates..."
              />
            </div>

            <div className="ap-form-group" style={{ marginBottom: '1.5rem' }}>
              <label>Hero Panorama Background Artwork (Composite with Books & Emblem)</label>
              <p style={{ fontSize: '0.78rem', color: 'var(--gray-400)', margin: '0 0 0.5rem' }}>
                Full-width panoramic banner artwork with books, Ashoka emblem, and deep maroon lighting.
              </p>
              <AdminImageUpload
                value={settings.heroSideImgUrl || settings.heroBgUrl || '/free-resources-books.png'}
                onChange={url => {
                  updateSetting('heroSideImgUrl', url)
                  updateSetting('heroBgUrl', url)
                }}
                subFolderName="resources-hero"
                hint="Landscape artwork with books & emblem (e.g. 1200x600px)"
                aspectRatio="16/9"
                previewHeight={130}
              />
            </div>

            {/* Badges List */}
            <label style={{ fontWeight: 700, fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>
              Hero 4 Feature Badges (Icons & Labels)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
              {settings.badges && settings.badges.map((b, i) => (
                <div key={b.id || i} style={{ background: 'var(--gray-50)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--gray-200)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)', fontWeight: 700 }}>Badge {i + 1}</span>
                    <i className={`fa-solid ${b.icon || 'fa-check'}`} style={{ color: 'var(--gold)', fontSize: '0.85rem' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '6px' }}>
                    <input
                      type="text" className="ap-input" style={{ fontSize: '0.75rem' }}
                      value={b.icon || ''}
                      onChange={e => updateBadge(i, 'icon', e.target.value)}
                      placeholder="fa-shield"
                      title="FontAwesome class"
                    />
                    <input
                      type="text" className="ap-input" style={{ fontSize: '0.82rem' }}
                      value={b.label || ''}
                      onChange={e => updateBadge(i, 'label', e.target.value)}
                      placeholder="Badge label"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section B: Search & Filter Labels */}
          <div className="ap-card" style={{ marginBottom: '1.5rem' }}>
            <h3 className="ap-card-title"><i className="fa-solid fa-magnifying-glass" /> Search Bar & Filter Labels</h3>
            
            <div className="ap-form-group" style={{ marginBottom: '1rem' }}>
              <label>Search Placeholder Text</label>
              <input
                type="text" className="ap-input"
                value={settings.searchPlaceholder || ''}
                onChange={e => updateSetting('searchPlaceholder', e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
              <div className="ap-form-group">
                <label>Day Label</label>
                <input type="text" className="ap-input" value={settings.filterDayLabel || ''} onChange={e => updateSetting('filterDayLabel', e.target.value)} />
              </div>
              <div className="ap-form-group">
                <label>Month Label</label>
                <input type="text" className="ap-input" value={settings.filterMonthLabel || ''} onChange={e => updateSetting('filterMonthLabel', e.target.value)} />
              </div>
              <div className="ap-form-group">
                <label>Year Label</label>
                <input type="text" className="ap-input" value={settings.filterYearLabel || ''} onChange={e => updateSetting('filterYearLabel', e.target.value)} />
              </div>
              <div className="ap-form-group">
                <label>Subject Label</label>
                <input type="text" className="ap-input" value={settings.filterSubjectLabel || ''} onChange={e => updateSetting('filterSubjectLabel', e.target.value)} />
              </div>
              <div className="ap-form-group">
                <label>Resource Type Label</label>
                <input type="text" className="ap-input" value={settings.filterTypeLabel || ''} onChange={e => updateSetting('filterTypeLabel', e.target.value)} />
              </div>
              <div className="ap-form-group">
                <label>Apply Button Text</label>
                <input type="text" className="ap-input" value={settings.applyBtnText || ''} onChange={e => updateSetting('applyBtnText', e.target.value)} />
              </div>
              <div className="ap-form-group">
                <label>Reset Button Text</label>
                <input type="text" className="ap-input" value={settings.resetBtnText || ''} onChange={e => updateSetting('resetBtnText', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Section C: Sidebar & Section Headings */}
          <div className="ap-card" style={{ marginBottom: '1.5rem' }}>
            <h3 className="ap-card-title"><i className="fa-solid fa-heading" /> Section Titles & Headings</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div className="ap-form-group">
                <label>Today's Resources Title</label>
                <input type="text" className="ap-input" value={settings.todaysTitle || ''} onChange={e => updateSetting('todaysTitle', e.target.value)} />
              </div>
              <div className="ap-form-group">
                <label>View Full Daily Archive Link</label>
                <input type="text" className="ap-input" value={settings.todaysArchiveLinkText || ''} onChange={e => updateSetting('todaysArchiveLinkText', e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div className="ap-form-group">
                <label>Weekly Magazines Title</label>
                <input type="text" className="ap-input" value={settings.weeklyTitle || ''} onChange={e => updateSetting('weeklyTitle', e.target.value)} />
              </div>
              <div className="ap-form-group">
                <label>Weekly Subtitle</label>
                <input type="text" className="ap-input" value={settings.weeklySubtitle || ''} onChange={e => updateSetting('weeklySubtitle', e.target.value)} />
              </div>
              <div className="ap-form-group">
                <label>Weekly "View All" Text</label>
                <input type="text" className="ap-input" value={settings.weeklyViewAllText || ''} onChange={e => updateSetting('weeklyViewAllText', e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div className="ap-form-group">
                <label>Monthly Magazines Title</label>
                <input type="text" className="ap-input" value={settings.monthlyTitle || ''} onChange={e => updateSetting('monthlyTitle', e.target.value)} />
              </div>
              <div className="ap-form-group">
                <label>Monthly Subtitle</label>
                <input type="text" className="ap-input" value={settings.monthlySubtitle || ''} onChange={e => updateSetting('monthlySubtitle', e.target.value)} />
              </div>
              <div className="ap-form-group">
                <label>Monthly "View All" Text</label>
                <input type="text" className="ap-input" value={settings.monthlyViewAllText || ''} onChange={e => updateSetting('monthlyViewAllText', e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div className="ap-form-group">
                <label>Past Archive Title</label>
                <input type="text" className="ap-input" value={settings.archiveTitle || ''} onChange={e => updateSetting('archiveTitle', e.target.value)} />
              </div>
              <div className="ap-form-group">
                <label>Past Archive Subtitle</label>
                <input type="text" className="ap-input" value={settings.archiveSubtitle || ''} onChange={e => updateSetting('archiveSubtitle', e.target.value)} />
              </div>
              <div className="ap-form-group">
                <label>Popular Resources Title</label>
                <input type="text" className="ap-input" value={settings.popularTitle || ''} onChange={e => updateSetting('popularTitle', e.target.value)} />
              </div>
            </div>

            {/* Past Archive Tabs */}
            <label style={{ fontWeight: 700, fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>
              Past Archive 5 Category Tabs
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
              <input type="text" className="ap-input" value={settings.tabDaily || ''} onChange={e => updateSetting('tabDaily', e.target.value)} placeholder="Daily Content" />
              <input type="text" className="ap-input" value={settings.tabWeekly || ''} onChange={e => updateSetting('tabWeekly', e.target.value)} placeholder="Weekly Magazines" />
              <input type="text" className="ap-input" value={settings.tabMonthly || ''} onChange={e => updateSetting('tabMonthly', e.target.value)} placeholder="Monthly Magazines" />
              <input type="text" className="ap-input" value={settings.tabYear || ''} onChange={e => updateSetting('tabYear', e.target.value)} placeholder="Year-wise" />
              <input type="text" className="ap-input" value={settings.tabSubject || ''} onChange={e => updateSetting('tabSubject', e.target.value)} placeholder="Subject-wise" />
            </div>
          </div>

          {/* Section D: Buttons & Modals */}
          <div className="ap-card" style={{ marginBottom: '1.75rem' }}>
            <h3 className="ap-card-title"><i className="fa-solid fa-square-check" /> Buttons & Feedback Texts</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div className="ap-form-group">
                <label>Card Preview Button</label>
                <input type="text" className="ap-input" value={settings.previewBtnText || ''} onChange={e => updateSetting('previewBtnText', e.target.value)} />
              </div>
              <div className="ap-form-group">
                <label>Card Download Button</label>
                <input type="text" className="ap-input" value={settings.downloadBtnText || ''} onChange={e => updateSetting('downloadBtnText', e.target.value)} />
              </div>
              <div className="ap-form-group">
                <label>Full Screen Button</label>
                <input type="text" className="ap-input" value={settings.viewFullScreenBtnText || ''} onChange={e => updateSetting('viewFullScreenBtnText', e.target.value)} />
              </div>
              <div className="ap-form-group">
                <label>Related Resources Title</label>
                <input type="text" className="ap-input" value={settings.relatedResourcesTitle || ''} onChange={e => updateSetting('relatedResourcesTitle', e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="ap-form-group">
                <label>Download Started Alert Title</label>
                <input type="text" className="ap-input" value={settings.downloadSuccessTitle || ''} onChange={e => updateSetting('downloadSuccessTitle', e.target.value)} />
              </div>
              <div className="ap-form-group">
                <label>No Results Title</label>
                <input type="text" className="ap-input" value={settings.noResultsTitle || ''} onChange={e => updateSetting('noResultsTitle', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={savingSettings}
              style={{ padding: '0.75rem 2rem', fontSize: '0.95rem' }}
            >
              {savingSettings ? (
                <><i className="fa-solid fa-spinner fa-spin" /> Saving Changes...</>
              ) : (
                <><i className="fa-solid fa-floppy-disk" /> Save Page Words & Settings</>
              )}
            </button>
          </div>

        </form>
      )}

      {/* ─── TAB 2: RESOURCE CATALOGUE ─── */}
      {activeTab === 'catalogue' && (
        <div>
          {/* Top Bar: Search & Add */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ position: 'relative', width: '320px' }}>
              <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--gray-400)' }} />
              <input
                type="text"
                className="ap-input"
                style={{ paddingLeft: '34px' }}
                placeholder="Search catalogue by title or category..."
                value={catSearch}
                onChange={e => setCatSearch(e.target.value)}
              />
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={openAddModal}
            >
              <i className="fa-solid fa-plus" /> Add New Resource
            </button>
          </div>

          {/* Table */}
          <div className="ap-card" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: 'var(--gray-50)', borderBottom: '2px solid var(--gray-200)', color: 'var(--gray-600)' }}>
                  <th style={{ padding: '0.85rem 1rem' }}>Thumbnail Preview</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Title & Description</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Category & Type</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Date & Size</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Visibility</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedResources.map(res => {
                  const driveId = extractGoogleDriveId(res.url || res.driveFileId)
                  const thumb = res.thumbnailUrl || (driveId ? `https://drive.google.com/thumbnail?id=${driveId}&sz=w200` : '')

                  return (
                    <tr key={res.id} style={{ borderBottom: '1px solid var(--gray-200)' }}>
                      {/* Thumbnail Preview */}
                      <td style={{ padding: '0.85rem 1rem', width: '80px' }}>
                        {thumb ? (
                          <img
                            src={thumb}
                            alt=""
                            style={{ width: '60px', height: '45px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--gray-200)' }}
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div style={{ width: '60px', height: '45px', background: 'var(--gray-100)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-400)', fontSize: '0.75rem' }}>
                            PDF
                          </div>
                        )}
                      </td>

                      {/* Title */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 750, color: 'var(--ink)' }}>{res.title}</div>
                        {res.description && (
                          <div style={{ fontSize: '0.76rem', color: 'var(--gray-500)', maxWidth: '320px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {res.description}
                          </div>
                        )}
                      </td>

                      {/* Category & Type */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ fontSize: '0.74rem', fontWeight: 700, background: 'rgba(123, 27, 46, 0.08)', color: 'var(--maroon)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                          {res.category || 'General'}
                        </span>
                        <div style={{ fontSize: '0.74rem', color: 'var(--gray-500)', marginTop: '4px' }}>
                          {res.resourceType || 'Daily Content'}
                        </div>
                      </td>

                      {/* Date & Size */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div>{res.date || '—'}</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--gray-400)' }}>
                          {(Number(res.sizeBytes || 0) / 1024 / 1024).toFixed(1)} MB • {res.pages || 1} pages
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        {res.isFeatured && (
                          <span style={{ fontSize: '0.7rem', fontWeight: 800, background: 'rgba(230, 92, 0, 0.12)', color: 'var(--saffron-dark)', padding: '0.15rem 0.45rem', borderRadius: '4px', marginRight: '4px' }}>
                            FEATURED
                          </span>
                        )}
                        {res.isPopular && (
                          <span style={{ fontSize: '0.7rem', fontWeight: 800, background: 'rgba(212, 175, 55, 0.15)', color: '#b45309', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                            RANK #{res.popularRank || 1}
                          </span>
                        )}
                      </td>

                      {/* Visibility Status (One-Click Toggle) */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <button
                          type="button"
                          onClick={() => handleTogglePublic(res)}
                          style={{
                            background: res.isPublic !== false ? 'rgba(34, 197, 94, 0.12)' : 'rgba(234, 88, 12, 0.12)',
                            color: res.isPublic !== false ? '#15803d' : '#c2410c',
                            border: `1px solid ${res.isPublic !== false ? '#86efac' : '#fdba74'}`,
                            padding: '0.3rem 0.65rem',
                            borderRadius: '20px',
                            fontSize: '0.76rem',
                            fontWeight: 750,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                          title="Click to toggle Public / Draft status"
                        >
                          <i className={`fa-solid ${res.isPublic !== false ? 'fa-eye' : 'fa-eye-slash'}`} />
                          {res.isPublic !== false ? 'Public' : 'Draft / Hidden'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          <button
                            type="button"
                            className="btn btn-outline"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                            onClick={() => openEditModal(res)}
                            title="Edit"
                          >
                            <i className="fa-solid fa-pen" />
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', color: '#dc2626', borderColor: '#fca5a5' }}
                            onClick={() => handleDeleteResource(res.id, res.title)}
                            title="Delete"
                          >
                            <i className="fa-solid fa-trash-can" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}

                {displayedResources.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-400)' }}>
                      No resources found in catalogue.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB: SUBJECTS & RESOURCE TYPES MANAGER ─── */}
      {activeTab === 'taxonomy' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          
          <div style={{ background: '#FFFDF9', border: '1px solid var(--gray-200)', borderRadius: '12px', padding: '1.25rem' }}>
            <h3 style={{ margin: '0 0 0.4rem', fontSize: '1.1rem', color: 'var(--ink)', fontWeight: 800 }}>
              <i className="fa-solid fa-tags" style={{ color: 'var(--gold)', marginRight: '8px' }} />
              Subjects & Resource Types Manager
            </h3>
            <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--gray-600)', lineHeight: 1.5 }}>
              Manage customizable Subjects and Resource Types. To keep the student experience fast and clutter-free, <strong>only subjects and types that have active, public resources available will appear in public filters</strong>. Empty categories with 0 items are automatically hidden from aspirants.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
            
            {/* 1. Subjects Manager */}
            <div className="ap-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>
                  <i className="fa-solid fa-book-bookmark" style={{ color: 'var(--maroon)', marginRight: '6px' }} />
                  Custom Subjects ({(settings.customSubjects || DEFAULT_FREE_RESOURCES_SETTINGS.customSubjects || []).length})
                </h4>
              </div>

              {/* Add Input */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <input
                  type="text"
                  className="ap-input"
                  placeholder="e.g. Ethics, Tamil Literature, Sociology..."
                  value={newSubjectInput}
                  onChange={e => setNewSubjectInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubject(); } }}
                />
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleAddSubject}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  <i className="fa-solid fa-plus" /> Add
                </button>
              </div>

              {/* Badges List */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {(settings.customSubjects || DEFAULT_FREE_RESOURCES_SETTINGS.customSubjects || []).map(subj => {
                  const usageCount = resources.filter(r => r.category === subj && r.isPublic !== false).length
                  return (
                    <div
                      key={subj}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: usageCount > 0 ? 'rgba(123, 27, 46, 0.08)' : 'var(--gray-100)',
                        border: `1px solid ${usageCount > 0 ? 'rgba(123, 27, 46, 0.2)' : 'var(--gray-300)'}`,
                        color: usageCount > 0 ? 'var(--maroon)' : 'var(--gray-700)',
                        padding: '0.4rem 0.75rem',
                        borderRadius: '20px',
                        fontSize: '0.84rem',
                        fontWeight: 650
                      }}
                    >
                      <span>{subj}</span>
                      <span style={{
                        background: usageCount > 0 ? 'var(--maroon)' : 'var(--gray-400)',
                        color: '#fff',
                        fontSize: '0.72rem',
                        borderRadius: '10px',
                        padding: '0.1rem 0.45rem',
                        fontWeight: 800
                      }}>
                        {usageCount}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubject(subj)}
                        style={{
                          background: 'none', border: 'none', color: 'var(--gray-400)',
                          cursor: 'pointer', fontSize: '0.9rem', padding: '0 2px'
                        }}
                        title={`Remove ${subj}`}
                      >
                        <i className="fa-solid fa-xmark" />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 2. Resource Types Manager */}
            <div className="ap-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>
                  <i className="fa-solid fa-layer-group" style={{ color: 'var(--maroon)', marginRight: '6px' }} />
                  Custom Resource Types ({(settings.customTypes || DEFAULT_FREE_RESOURCES_SETTINGS.customTypes || []).length})
                </h4>
              </div>

              {/* Add Input */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <input
                  type="text"
                  className="ap-input"
                  placeholder="e.g. Mindmaps, Solved Question Papers..."
                  value={newTypeInput}
                  onChange={e => setNewTypeInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddType(); } }}
                />
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleAddType}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  <i className="fa-solid fa-plus" /> Add
                </button>
              </div>

              {/* Badges List */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {(settings.customTypes || DEFAULT_FREE_RESOURCES_SETTINGS.customTypes || []).map(t => {
                  const usageCount = resources.filter(r => r.resourceType === t && r.isPublic !== false).length
                  return (
                    <div
                      key={t}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: usageCount > 0 ? 'rgba(37, 99, 235, 0.08)' : 'var(--gray-100)',
                        border: `1px solid ${usageCount > 0 ? 'rgba(37, 99, 235, 0.2)' : 'var(--gray-300)'}`,
                        color: usageCount > 0 ? '#1d4ed8' : 'var(--gray-700)',
                        padding: '0.4rem 0.75rem',
                        borderRadius: '20px',
                        fontSize: '0.84rem',
                        fontWeight: 650
                      }}
                    >
                      <span>{t}</span>
                      <span style={{
                        background: usageCount > 0 ? '#1d4ed8' : 'var(--gray-400)',
                        color: '#fff',
                        fontSize: '0.72rem',
                        borderRadius: '10px',
                        padding: '0.1rem 0.45rem',
                        fontWeight: 800
                      }}>
                        {usageCount}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveType(t)}
                        style={{
                          background: 'none', border: 'none', color: 'var(--gray-400)',
                          cursor: 'pointer', fontSize: '0.9rem', padding: '0 2px'
                        }}
                        title={`Remove ${t}`}
                      >
                        <i className="fa-solid fa-xmark" />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ─── TAB 4: DRIVE & ARCHITECTURE ─── */}
      {activeTab === 'drive' && (
        <div className="ap-card">
          <h3 className="ap-card-title"><i className="fa-brands fa-google-drive" /> Google Drive CDN Architecture</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--gray-600)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
            NERMAI Free Resources utilizes Google Drive as PDF document storage and Google's high-speed CDN for first-page thumbnail previews:
          </p>

          <div style={{ background: 'var(--gray-50)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--gray-200)', marginBottom: '1.5rem' }}>
            <div style={{ fontWeight: 700, marginBottom: '0.5rem', color: 'var(--ink)' }}>Recommended Flow:</div>
            <code style={{ display: 'block', background: '#1e293b', color: '#f8fafc', padding: '1rem', borderRadius: '8px', fontSize: '0.85rem', lineHeight: 1.5, fontFamily: 'var(--font-mono)' }}>
              Google Drive PDF &rarr; Google Drive File ID &rarr; Drive thumbnail CDN (lh3 / thumbnail API) &rarr; Free Resources UI (First-Page Thumbnail)
            </code>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div style={{ background: '#FFFDF9', padding: '1rem', borderRadius: '10px', border: '1px solid var(--gray-200)' }}>
              <strong style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--maroon)' }}>
                <i className="fa-solid fa-bolt" /> Instant First-Page Thumbnails
              </strong>
              <p style={{ fontSize: '0.84rem', color: 'var(--gray-600)', margin: 0 }}>
                When any PDF is uploaded to Google Drive, Google automatically renders the first page image via <code>https://drive.google.com/thumbnail?id=FILE_ID&sz=w800</code>. Aspirants view crisp document covers without opening the file!
              </p>
            </div>

            <div style={{ background: '#FFFDF9', padding: '1rem', borderRadius: '10px', border: '1px solid var(--gray-200)' }}>
              <strong style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--maroon)' }}>
                <i className="fa-solid fa-server" /> Fast Multi-Criteria Filtering
              </strong>
              <p style={{ fontSize: '0.84rem', color: 'var(--gray-600)', margin: 0 }}>
                Document metadata (title, category, date, type, file size, pages) is indexed in Firestore, enabling instant sub-millisecond filtering across hundreds of study materials.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── ADD / EDIT RESOURCE MODAL ─── */}
      {showResourceModal && (
        <div className="ap-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowResourceModal(false); }} style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 99999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem'
        }}>
          <div style={{
            background: '#FFFFFF', borderRadius: '16px',
            width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto',
            padding: '1.75rem', boxShadow: '0 20px 50px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                {editingId ? 'Edit Resource' : 'Add New Resource'}
              </h3>
              <button
                type="button"
                onClick={() => setShowResourceModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--gray-400)' }}
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <form onSubmit={handleResourceSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Title */}
              <div className="ap-form-group">
                <label>Resource Title *</label>
                <input
                  type="text" className="ap-input" required
                  value={resourceForm.title}
                  onChange={e => setResourceForm({ ...resourceForm, title: e.target.value })}
                  placeholder="e.g. Daily Current Affairs 23 September 2026"
                />
              </div>

              {/* Category & Resource Type */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="ap-form-group">
                  <label>Subject / Category *</label>
                  <select
                    className="ap-input"
                    value={resourceForm.category}
                    onChange={e => setResourceForm({ ...resourceForm, category: e.target.value })}
                  >
                    {(settings.customSubjects || DEFAULT_FREE_RESOURCES_SETTINGS.customSubjects || []).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                    {resourceForm.category && !(settings.customSubjects || DEFAULT_FREE_RESOURCES_SETTINGS.customSubjects || []).includes(resourceForm.category) && (
                      <option value={resourceForm.category}>{resourceForm.category}</option>
                    )}
                  </select>
                </div>

                <div className="ap-form-group">
                  <label>Resource Type *</label>
                  <select
                    className="ap-input"
                    value={resourceForm.resourceType}
                    onChange={e => setResourceForm({ ...resourceForm, resourceType: e.target.value })}
                  >
                    {(settings.customTypes || DEFAULT_FREE_RESOURCES_SETTINGS.customTypes || []).map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                    {resourceForm.resourceType && !(settings.customTypes || DEFAULT_FREE_RESOURCES_SETTINGS.customTypes || []).includes(resourceForm.resourceType) && (
                      <option value={resourceForm.resourceType}>{resourceForm.resourceType}</option>
                    )}
                  </select>
                </div>
              </div>

              {/* Optional Quick Add Subject / Type */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '-0.4rem' }}>
                <div>
                  <input
                    type="text"
                    className="ap-input"
                    style={{ fontSize: '0.8rem', padding: '0.35rem 0.65rem' }}
                    placeholder="+ Or type custom subject..."
                    onBlur={e => {
                      const val = e.target.value.trim()
                      if (val) {
                        setResourceForm(f => ({ ...f, category: val }))
                        e.target.value = ''
                      }
                    }}
                  />
                </div>
                <div>
                  <input
                    type="text"
                    className="ap-input"
                    style={{ fontSize: '0.8rem', padding: '0.35rem 0.65rem' }}
                    placeholder="+ Or type custom type..."
                    onBlur={e => {
                      const val = e.target.value.trim()
                      if (val) {
                        setResourceForm(f => ({ ...f, resourceType: val }))
                        e.target.value = ''
                      }
                    }}
                  />
                </div>
              </div>

              {/* Publish Visibility Toggle */}
              <div style={{
                background: resourceForm.isPublic ? 'rgba(34, 197, 94, 0.08)' : 'rgba(234, 88, 12, 0.08)',
                border: `1.5px solid ${resourceForm.isPublic ? '#86efac' : '#fdba74'}`,
                padding: '0.85rem 1rem',
                borderRadius: '10px'
              }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', margin: 0 }}>
                  <input
                    type="checkbox"
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#16a34a' }}
                    checked={resourceForm.isPublic}
                    onChange={e => setResourceForm({ ...resourceForm, isPublic: e.target.checked })}
                  />
                  <div>
                    <strong style={{ fontSize: '0.9rem', color: resourceForm.isPublic ? '#15803d' : '#c2410c' }}>
                      {resourceForm.isPublic ? '✓ Live & Available to Public' : '⚠ Draft / Hidden (Internal Only)'}
                    </strong>
                    <div style={{ fontSize: '0.78rem', color: 'var(--gray-600)' }}>
                      {resourceForm.isPublic
                        ? 'Resource is visible to aspirants on the Free Resources page and included in filter dropdowns.'
                        : 'Resource is hidden from the live website. Subject and type filters will not show this item.'}
                    </div>
                  </div>
                </label>
              </div>

              {/* Date & Issue Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="ap-form-group">
                  <label>Publication Date</label>
                  <input
                    type="date" className="ap-input"
                    value={resourceForm.date}
                    onChange={e => setResourceForm({ ...resourceForm, date: e.target.value })}
                  />
                </div>

                <div className="ap-form-group">
                  <label>Issue Info (e.g. Week 3 Sep 2026)</label>
                  <input
                    type="text" className="ap-input"
                    value={resourceForm.issueInfo}
                    onChange={e => setResourceForm({ ...resourceForm, issueInfo: e.target.value })}
                    placeholder="Week 3 Sep 2026"
                  />
                </div>
              </div>

              {/* Upload to Google Drive */}
              <div className="ap-form-group" style={{ background: 'var(--gray-50)', padding: '1rem', borderRadius: '10px', border: '1px dashed var(--gray-300)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className="fa-brands fa-google-drive" style={{ color: '#2563eb' }} />
                  Upload PDF to Google Drive (Auto-extracts Pages, Size & Thumbnail)
                </label>
                <input
                  type="file"
                  id="pdf-upload-input"
                  style={{ display: 'none' }}
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileUpload}
                />
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '6px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => document.getElementById('pdf-upload-input')?.click()}
                    disabled={uploadingFile || inspectingPdf}
                    style={{ padding: '0.55rem 1.15rem' }}
                  >
                    {uploadingFile || inspectingPdf ? (
                      <><i className="fa-solid fa-spinner fa-spin" /> Auto-reading PDF & Uploading...</>
                    ) : (
                      <><i className="fa-solid fa-file-pdf" /> Select PDF File</>
                    )}
                  </button>
                  <span style={{ fontSize: '0.82rem', color: 'var(--gray-600)' }}>
                    ⚡ Automatically extracts <strong>Total Pages</strong>, <strong>File Size</strong> &amp; <strong>Thumbnail</strong>
                  </span>
                </div>
              </div>

              {/* ⚡ AUTO-DETECTED SUMMARY CARD */}
              {detectedInfo && (
                <div style={{
                  background: '#f0fdf4',
                  border: '1.5px solid #86efac',
                  borderRadius: '12px',
                  padding: '0.9rem 1.15rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  {resourceForm.thumbnailUrl ? (
                    <img
                      src={resourceForm.thumbnailUrl}
                      alt="Cover Preview"
                      style={{
                        width: '50px',
                        height: '66px',
                        objectFit: 'cover',
                        borderRadius: '6px',
                        border: '1px solid #bbf7d0',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                        background: '#fff'
                      }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div style={{
                      width: '50px', height: '66px',
                      background: '#dcfce7', borderRadius: '6px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#15803d', fontSize: '1.5rem', flexShrink: 0
                    }}>
                      <i className="fa-solid fa-file-pdf" />
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <span style={{
                        background: '#16a34a', color: '#fff', fontSize: '0.68rem',
                        fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '12px'
                      }}>
                        ⚡ AUTO-DETECTED
                      </span>
                      <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#166534', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        📄 {detectedInfo.fileName}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.84rem', flexWrap: 'wrap' }}>
                      <div>
                        <span style={{ color: '#166534' }}>Total Pages: </span>
                        <strong style={{ color: '#15803d', fontSize: '0.95rem' }}>{resourceForm.pages} pages</strong>
                        <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 700, marginLeft: '5px' }}>← AUTO</span>
                      </div>
                      <div>
                        <span style={{ color: '#166534' }}>File Size: </span>
                        <strong style={{ color: '#15803d', fontSize: '0.95rem' }}>{formatBytes(resourceForm.sizeBytes)}</strong>
                        <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 700, marginLeft: '5px' }}>← AUTO</span>
                      </div>
                      <div>
                        <span style={{ color: '#166534' }}>First Page: </span>
                        <strong style={{ color: '#15803d' }}>Ready</strong>
                        <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 700, marginLeft: '5px' }}>← AUTO</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* URL & Drive File ID */}
              <div className="ap-form-group">
                <label>Resource URL or Google Drive Link *</label>
                <input
                  type="url" className="ap-input" required
                  value={resourceForm.url}
                  onChange={e => handleResourceUrlChange(e.target.value)}
                  placeholder="https://drive.google.com/file/d/..."
                />
              </div>

              {/* Pages & Size */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="ap-form-group">
                  <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Total Pages</span>
                    <span style={{ color: '#16a34a', fontSize: '0.75rem', fontWeight: 700 }}>
                      ⚡ Auto-filled ({resourceForm.pages} pages)
                    </span>
                  </label>
                  <input
                    type="number" className="ap-input" min={1}
                    value={resourceForm.pages}
                    onChange={e => setResourceForm({ ...resourceForm, pages: e.target.value })}
                    style={{ borderColor: detectedInfo ? '#86efac' : undefined }}
                  />
                </div>

                <div className="ap-form-group">
                  <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>File Size (Bytes)</span>
                    <span style={{ color: '#16a34a', fontSize: '0.75rem', fontWeight: 700 }}>
                      ⚡ {formatBytes(resourceForm.sizeBytes)}
                    </span>
                  </label>
                  <input
                    type="number" className="ap-input"
                    value={resourceForm.sizeBytes}
                    onChange={e => setResourceForm({ ...resourceForm, sizeBytes: e.target.value })}
                    style={{ borderColor: detectedInfo ? '#86efac' : undefined }}
                  />
                </div>
              </div>

              {/* Featured & Popular Checkboxes */}
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', background: 'var(--gray-50)', padding: '0.75rem 1rem', borderRadius: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', cursor: 'pointer', userSelect: 'none' }}>
                  <input
                    type="checkbox"
                    checked={resourceForm.isFeatured}
                    onChange={e => setResourceForm({ ...resourceForm, isFeatured: e.target.checked })}
                  />
                  <strong>Featured Resource</strong>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', cursor: 'pointer', userSelect: 'none' }}>
                  <input
                    type="checkbox"
                    checked={resourceForm.isPopular}
                    onChange={e => setResourceForm({ ...resourceForm, isPopular: e.target.checked })}
                  />
                  <strong>Popular (Ranked)</strong>
                </label>

                {resourceForm.isPopular && (
                  <input
                    type="number" className="ap-input" style={{ width: '80px', padding: '0.2rem 0.5rem' }}
                    placeholder="Rank #"
                    min={1} max={10}
                    value={resourceForm.popularRank}
                    onChange={e => setResourceForm({ ...resourceForm, popularRank: e.target.value })}
                  />
                )}
              </div>

              {/* Description */}
              <div className="ap-form-group">
                <label>Description / Highlights</label>
                <textarea
                  className="ap-input" rows={2}
                  value={resourceForm.description}
                  onChange={e => setResourceForm({ ...resourceForm, description: e.target.value })}
                  placeholder="Key topics covered, syllabus linkages..."
                />
              </div>

              {/* Submit / Cancel Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowResourceModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={uploadingFile || savingResource}
                  style={{ minWidth: '140px' }}
                >
                  {savingResource ? (
                    <><i className="fa-solid fa-spinner fa-spin" /> Saving...</>
                  ) : (
                    editingId ? 'Update Resource' : 'Add to Library'
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  )
}
