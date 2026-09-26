/**
 * Firestore data layer for NERMAI
 * Collections: hero_slides, notices, toppers, testimonials, settings
 */
import {
  collection, doc, addDoc, getDoc, getDocs, setDoc,
  updateDoc, deleteDoc, onSnapshot, orderBy, query,
  serverTimestamp, limit as fsLimit
} from 'firebase/firestore'
import { db } from './config'

const COLLECTIONS = {
  HERO_SLIDES:       'nermai_hero_slides',
  NOTICES:           'nermai_notices',
  TOPPERS:           'nermai_toppers',
  TESTIMONIALS:      'nermai_testimonials',
  GALLERY:           'nermai_gallery',
  SETTINGS:          'nermai_settings',
  COURSE_CONTENT:    'nermai_course_content',
  RESULT_CATEGORIES: 'nermai_result_categories',
  RESULTS:           'nermai_results'
}

const heroCol            = () => collection(db, COLLECTIONS.HERO_SLIDES)
const noticesCol         = () => collection(db, COLLECTIONS.NOTICES)
const toppersCol         = () => collection(db, COLLECTIONS.TOPPERS)
const testimonialsCol    = () => collection(db, COLLECTIONS.TESTIMONIALS)
const galleryCol         = () => collection(db, COLLECTIONS.GALLERY)
const courseContentDoc   = (slug) => doc(db, COLLECTIONS.COURSE_CONTENT, slug)
const resultCategoriesCol = () => collection(db, COLLECTIONS.RESULT_CATEGORIES)
const resultsCol          = () => collection(db, COLLECTIONS.RESULTS)
const settingsDoc    = () => doc(db, COLLECTIONS.SETTINGS, 'main')

// ─── DEFAULT DATA ─────────────────────────────────────────────────────────────

export const DEFAULT_WHY_NERMAI = {
  eyebrow: 'OUR STRENGTH',
  titlePrefix: 'Why',
  titleHighlight: 'NermaiIAS?',
  subtitleLine1: 'Quality mentorship. Accessible learning. Proven results.',
  subtitleLine2: "That's the Nermai difference.",
  heroImageUrl: '/assets/why-nermai-right-banner.png',
  heroImageFit: 'cover',
  showCustomScript: false,
  topScriptLine1: 'Same Commitment',
  topScriptLine2: 'A Brighter India',
  bottomScriptLine1: 'Students Today',
  bottomScriptLine2: 'A Stronger Tomorrow',
  mottoWords: ['Learn', 'Prepare', 'Serve', 'Succeed'],
  pillars: [
    {
      id: 'p1',
      number: '01',
      icon: 'Trophy',
      title: 'Proven Results',
      desc: '**243+** Nermai students cleared government exams in 2022–26, including **105** in Police recruitments, **15** Sub-Inspector, **7** Deputy Tahsildar, **29** LDC, **25** UDC.'
    },
    {
      id: 'p2',
      number: '02',
      icon: 'Users',
      title: 'Experienced Mentors',
      desc: 'Every class is taught by a dedicated mentor with at least **15 years** of experience.'
    },
    {
      id: 'p3',
      number: '03',
      icon: 'HandCoins',
      title: 'Non-Commercial Initiative',
      desc: "Quality coaching at an **affordable fee**, so money is never the reason an aspirant can't prepare."
    },
    {
      id: 'p4',
      number: '04',
      icon: 'Laptop',
      title: 'Hybrid Classes',
      desc: 'Learn in our **classroom or online**. It is the same class, recorded for revision.'
    },
    {
      id: 'p5',
      number: '05',
      icon: 'TrendingUp',
      title: 'Result-Driven Learning',
      desc: 'Daily and weekly tests and **full mock tests**, with in-depth teaching that covers the complete syllabus.'
    }
  ]
}

export const DEFAULT_WHY_NERMAI_SHOWCASE = {
  eyebrow: 'OUR FEATURES',
  title: 'What Makes Nermai Different',
  subtitle: 'Every aspect of our academy is designed around one purpose — your success.',
  steps: [
    {
      id: 'step_1',
      num: '01',
      circleStyle: 'circle-maroon',
      icon: 'Heart',
      title: 'Non Profit Initiative',
      desc: 'Run entirely by volunteers. Our sole mission is to empower rural and economically weaker youth — not to profit from their aspirations.'
    },
    {
      id: 'step_2',
      num: '02',
      circleStyle: 'circle-cream',
      icon: 'BookOpen',
      title: 'Comprehensive Syllabus Coverage',
      desc: 'Every topic from Prelims to Mains is covered systematically. No gaps, no shortcuts — structured preparation from day one.'
    },
    {
      id: 'step_3',
      num: '03',
      circleStyle: 'circle-maroon',
      icon: 'ClipboardCheck',
      title: 'Regular Test Practice',
      desc: 'Frequent mock tests and topic-wise tests that closely mirror the actual exam pattern to build speed and accuracy.'
    },
    {
      id: 'step_4',
      num: '04',
      circleStyle: 'circle-cream',
      icon: 'UserCheck',
      title: 'Personal Guidance & Counseling',
      desc: 'One-on-one mentoring sessions to assess your strengths, address weaknesses, and keep you on the right track.'
    },
    {
      id: 'step_5',
      num: '05',
      circleStyle: 'circle-maroon',
      icon: 'Laptop',
      title: 'Offline & Online',
      desc: 'Attend classes at our Puducherry centre or learn from anywhere via our online platform — flexible learning your way.'
    },
    {
      id: 'step_6',
      num: '06',
      circleStyle: 'circle-cream',
      icon: 'Trophy',
      title: 'Result Driven Learning',
      desc: '187+ successful candidates across UPSC, TNPSC, Police and Puducherry Recruitments prove that our approach works.'
    }
  ],
  showBottomBar: true,
  showQuote: true,
  bottomQuote: "Education is not a business for us, it's a responsibility.",
  bottomAuthor: 'NERMAI',
  showMetric1: true,
  stat1Num: '187+',
  stat1Label: 'Successful Candidates',
  showMetric2: true,
  stat2Num: '14+',
  stat2Label: 'Years of Impact',
  showMetric3: true,
  stat3Num: 'Stronger',
  stat3Label: 'Rural Youth, Brighter India',
  showCursive: true,
  cursiveLine1: 'Same Dedication.',
  cursiveLine2: 'A Brighter Tomorrow.',
  showCta: true,
  ctaText: 'JOIN NERMAI TODAY',
  ctaLink: '#contact'
}

export const DEFAULT_SUCCESS_STORIES_CONFIG = {
  eyebrow: 'NERMAI SUCCESS STORIES',
  titlePrefix: 'From Aspirants to',
  titleHighlight: 'Achievers',
  subtitle: 'Real journeys. Real people. Real results. Be inspired by our students who turned their dreams into reality with Nermai.',
  scriptTopLeft: 'Learn\nPrepare\nSucceed',
  scriptTopRight: 'Different\nAspirations\nOne\nDestination',

  toppersSubheading: 'OUR TOPPERS',
  toppersDesc: 'Meet our achievers who made it happen with dedication, guidance and the Nermai way.',
  toppersViewAllText: 'View All Toppers',
  toppersViewAllLink: '/results',

  testimonialsHeading: 'TESTIMONIALS',
  testimonialsSubtitle: 'Honest feedback from our students.',
  testimonialsScript: 'Real Stories Real Impact'
}

export const DEFAULT_FREE_RESOURCES_SETTINGS = {
  homeSectionVisible: true,
  eyebrow: 'FREE RESOURCES',
  title: 'Learn. Prepare. Grow.',
  highlightWord: 'For Free.',
  description: 'Access high-quality study materials, daily updates, magazines and more — shared by Nermai for every aspirant.',
  badges: [
    { id: 'b1', icon: 'fa-shield-halved', label: 'Curated by Experts' },
    { id: 'b2', icon: 'fa-file-lines', label: 'Updated Regularly' },
    { id: 'b3', icon: 'fa-users', label: 'All in One Place' },
    { id: 'b4', icon: 'fa-database', label: 'Direct from Official Sources' },
  ],
  sloganRight: 'Knowledge\nToday\nA Stronger\nTomorrow',
  heroBgUrl: '/free-resources-books.png',
  heroSideImgUrl: '/free-resources-books.png',

  searchPlaceholder: 'Search resources (e.g. Polity Notes, CA PDF, Monthly Magazine...)',
  filterDayLabel: 'Day',
  filterMonthLabel: 'Month',
  filterYearLabel: 'Year',
  filterSubjectLabel: 'Subject',
  filterTypeLabel: 'Resource Type',
  applyBtnText: 'Apply',
  resetBtnText: 'Reset',

  quickFiltersTitle: 'Quick Filters',
  quickFilterToday: "Today's Resources",
  quickFilterWeek: 'This Week',
  quickFilterMonth: 'This Month',
  quickFilterAll: 'All Resources',
  subjectsTitle: 'Subjects',
  resourceTypesTitle: 'Resource Type',

  todaysTitle: "Today's Resources",
  todaysArchiveLinkText: 'View Full Daily Archive',

  weeklyTitle: 'Weekly Magazines',
  weeklySubtitle: 'Curated weekly compilations for comprehensive revision.',
  weeklyViewAllText: 'View All',

  monthlyTitle: 'Monthly Magazines',
  monthlySubtitle: 'Access monthly current affairs and subject-wise compilations.',
  monthlyViewAllText: 'View All',

  archiveTitle: 'Past Resources Archive',
  archiveSubtitle: 'Browse all previous resources by date, month or year.',
  archiveViewAllText: 'View All',
  tabDaily: 'Daily Content',
  tabWeekly: 'Weekly Magazines',
  tabMonthly: 'Monthly Magazines',
  tabYear: 'Year-wise',
  tabSubject: 'Subject-wise',

  popularTitle: 'Popular Resources',
  popularViewAllText: 'View All',

  previewBtnText: 'Preview',
  downloadBtnText: 'Download',
  viewFullScreenBtnText: 'View Full Screen',
  relatedResourcesTitle: 'Related Resources',

  noResultsTitle: 'No resources found',
  noResultsDesc: 'Try adjusting your search keywords or filter selections.',
  downloadSuccessTitle: 'Download Started',
  downloadSuccessMsg: 'Your PDF file is downloading. Check your browser downloads.',

  // Admin Customizable Subjects & Types
  customSubjects: [
    'Current Affairs',
    'General Studies (GS)',
    'Polity',
    'History',
    'Geography',
    'Economy',
    'Science & Technology',
    'Environment & Ecology',
    'Tamil Nadu (TN)',
    'Previous Year Papers',
    'Others'
  ],
  customTypes: [
    'Daily Content',
    'Weekly Magazine',
    'Monthly Magazine',
    'Notes',
    'Previous Year Questions',
    'Test Series',
    'Infographics',
    'Editorial',
    'Others'
  ],
}

const DEFAULT_SETTINGS = {
  freeResourcesVisibility: true,
  freeResourcesPage: DEFAULT_FREE_RESOURCES_SETTINGS,
  whyNermai: DEFAULT_WHY_NERMAI,
  whyNermaiShowcase: DEFAULT_WHY_NERMAI_SHOWCASE,
  successStories: DEFAULT_SUCCESS_STORIES_CONFIG,
  passcode: 'nermai2024',
  pageVisibility: {
    courses: true,
    results: true,
    notices: true,
    gallery: true,
    toppers: true,
    testimonials: true,
    freeResources: true
  },
  driveConfig: {
    appsScriptUrl: '',
    folderId: '',
    accessToken: '',
    maxWidth: 1600,
    quality: 0.85
  },
  siteInfo: {
    phone: '+91 8903 189000',
    email: 'nermaiasacademy@gmail.com',
    address: 'No. 156 / 3, (1st & 2nd Floor), Nanbargal Nagar, Pondy – Villianur Main Road, Oulgaret, Puducherry – 605 010',
    whatsapp: '918903189000',
    instagram: 'https://instagram.com',
    facebook: 'https://facebook.com',
    youtube: 'https://youtube.com',
    telegram: 'https://t.me/'
  },
  topBar: {
    visible: true,
    location: 'Puducherry, India',
    locationLink: '',
    showLocation: true,
    contacts: [
      { id: 'c1', value: '+91 8903 189000', label: 'Primary', visible: true }
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
  },
  branding: {
    logoUrl: '/nermai-logo.png',
    title: 'NERMAI',
    subtitle: 'IAS ACADEMY',
    showMotto: true,
    mottoLine1: 'Learn',
    mottoLine2: 'Compete',
    mottoLine3: 'Serve'
  },
  footer: {
    cta: { heading: '', sub: '', btnText: '', btnLink: '' },
    brand: { desc: '', badge: '' },
    contact: { address: '', phones: '', email: '' },
    usefulLinks: [],
    notifications: [],
    coursesLinks: [],
    bottom: { meta: '' }
  },
  officeLocations: {
    visible: true,
    eyebrow: '📍 OUR LOCATION',
    title: 'Our Office Locations',
    subtitle: 'Visit our centre to experience a supportive learning environment, expert guidance, and a community that believes in your potential.',
    leftScriptLine1: 'Accessible',
    leftScriptLine2: 'Supportive',
    leftScriptLine3: 'Always Near You',
    rightScriptLine1: 'Same City.',
    rightScriptLine2: 'Bigger Aspirations.',
    feature1Icon: 'fa-graduation-cap',
    feature1Title: 'Easy Access',
    feature1Desc: 'Centrally located with convenient transport options',
    feature2Icon: 'fa-users',
    feature2Title: 'Student Friendly',
    feature2Desc: 'A welcoming space designed for aspirants',
    feature3Icon: 'fa-shield-halved',
    feature3Title: 'A Supportive Community',
    feature3Desc: 'More than a coaching centre — a place to grow',
    mottoLine1: 'EMPOWERING ASPIRANTS.',
    mottoLine2: 'STRENGTHENING THE NATION.',
    locations: [
      {
        id: 'loc_main',
        name: 'Main Office – Puducherry',
        tagline: 'MAIN OFFICE',
        address: 'No. 156 / 3, (1st & 2nd Floor), Nanbargal Nagar,\nPondy – Villianur Main Road, Oulgaret, Puducherry – 605 010',
        phone: '+91 8903 108000',
        phoneLabel: 'Call Us',
        email: 'nermaiiasacademy@gmail.com',
        emailLabel: 'Email Us',
        hoursDays: 'Mon – Sat',
        hoursTime: '9:00 AM – 6:00 PM',
        mapEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3903.6262799342416!2d79.7997576!3d11.9309786!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a5361a93fffe92f%3A0x6b449b2513f51175!2sNermai%20IAS%20Academy!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin',
        directionsUrl: 'https://maps.google.com/maps?daddr=Nermai+IAS+Academy+Puducherry',
        directionsButtonText: 'Get Directions on Google Maps',
        quote: 'A space to learn, grow and achieve together.',
        visible: true
      }
    ]
  },
  coursesHero: {
    visible: true,
    eyebrow: 'ACADEMIC PROGRAMS & COURSES',
    eyebrowIcon: 'fa-building-columns',
    titleLine1: 'Choose Your Path to',
    titleLine2: 'Government Service',
    subtitle: 'Renowned coaching for UPSC (Civil Services), Puducherry UDC, LDC, Sub-Inspector, Deputy Tahsildar, TNPSC Group I/II/IV and other competitive examinations.',
    leftScriptLine1: 'Learn',
    leftScriptLine2: 'Prepare',
    leftScriptLine3: 'Succeed',
    rightScriptLine1: 'Different',
    rightScriptLine2: 'Aspirations',
    rightScriptLine3: 'One',
    rightScriptLine4: 'Destination',
    feature1Icon: 'fa-graduation-cap',
    feature1Title: 'Expert Faculty',
    feature1Sub: '15+ Years of Experience',
    feature2Icon: 'fa-file-lines',
    feature2Title: 'Structured Learning',
    feature2Sub: 'From Basics to Advanced',
    feature3Icon: 'fa-chart-column',
    feature3Title: 'Proven Results',
    feature3Sub: 'Guiding Aspirants to Success',
    book1Title: 'DISCIPLINE',
    book2Title: 'KNOWLEDGE',
    book3Title: 'SERVICE',
    book4Title: 'A BETTER TOMORROW',
    showScripts: true,
    showFeatures: true,
    showArtwork: true
  },
  homeContent: {
    visibility: {
      stats: true,
      about: true,
      features: true,
      courses: true,
      steps: true,
      results: true,
      gallery: true,
      testimonials: true,
      faq: true,
      events: true
    },
    events: [
      { date: '2026-08-31', title: 'Short NIQ', subtitle: 'for construction of Selfie Point - Last date', url: '', visible: true },
      { date: '2026-08-31', title: 'Short NIQ', subtitle: 'for Toilet repair work - Last date', url: '', visible: true },
      { date: '2026-09-15', title: 'NSPC 2026 - QUIZ', subtitle: 'Students/Scholars/Faculty/Staff can participate in this nationwide online quiz', url: '', visible: true },
      { date: '2026-11-12', title: 'ICAISDA 26', subtitle: 'Two days International Conference organized by CSE', url: '', visible: true }
    ],
    stats: [
      { num: '5000+', label: 'Students',  sublabel: 'From towns, cities and rural communities' },
      { num: '15+',   label: 'Years',     sublabel: 'Of academic excellence and trust' },
      { num: '28+',   label: 'Batches',   sublabel: 'Across competitive examinations' },
      { num: 'Highest', label: 'Success', sublabel: 'Consistent results, brighter futures' }
    ],
    featuresConfig: {
      eyebrow: 'NERMAI CLASS PLATFORM',
      title: 'Everything You Need to Succeed',
      subtitle: 'A complete learning ecosystem designed for Tamil-medium aspirants, with expert guidance, structured preparation and continuous support.',
      highlights: [
        { icon: 'Tv', title: 'Live + Recorded', sub: 'FLEXIBLE LEARNING' },
        { icon: 'GraduationCap', title: 'Expert Faculty', sub: '15+ YEARS EXPERIENCE' },
        { icon: 'ShieldCheck', title: 'Exam Focused', sub: 'RESULT ORIENTED' },
        { icon: 'Globe', title: 'Tamil & English', sub: 'BILINGUAL SUPPORT' }
      ]
    },
    featureDetails: [
      {
        number: '01',
        icon: 'GraduationCap',
        title: 'Structured Classes',
        subtitle: 'Daily scheduled classes with expert faculty in Tamil & English medium.',
        tag: 'FEATURE 01',
        caption: 'Learn from the best, at your own pace.',
        desc: 'Daily scheduled classes covering the complete syllabus with expert faculty in Tamil and English medium. Includes live interactive sessions, recorded classes, doubt clearing and revision sessions.',
        checkpoints: [
          'Expert faculty with years of experience',
          'Live + recorded classes',
          'Tamil & English medium',
          'Exam-oriented teaching approach',
          'Doubt clearing sessions'
        ],
        primaryCta: 'EXPLORE CLASSES',
        primaryCtaLink: '',
        secondaryCta: 'View Sample Class',
        secondaryCtaLink: '',
        imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop',
        calloutNote: 'Your classroom anywhere, anytime',
        quote: 'Well-structured classes made it easy for me to understand complex topics.',
        author: '— M. Karthik, TNPSC Group II (2024)',
        visible: true
      },
      {
        number: '02',
        icon: 'BookOpen',
        title: 'Study Materials',
        subtitle: 'Comprehensive study notes and question banks aligned to exam pattern.',
        tag: 'FEATURE 02',
        caption: 'Comprehensive notes tailored for civil service exams.',
        desc: 'Access structured study materials, topic-wise PDFs, hand-curated question banks, and standard reference materials updated according to the latest exam pattern.',
        checkpoints: [
          'Comprehensive Tamil & English PDF notes',
          'Topic-wise previous year questions',
          'Curated standard textbook summaries',
          'Regular current affairs updates',
          'Downloadable for offline learning'
        ],
        primaryCta: 'GET STUDY MATERIALS',
        primaryCtaLink: '',
        secondaryCta: 'View Sample PDF',
        secondaryCtaLink: '',
        imageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=1200&auto=format&fit=crop',
        calloutNote: 'Curated for Tamil Medium',
        quote: 'The study materials provided by Nermai were concise, exam-focused, and easy to review.',
        author: '— S. Priyadharshini, TNPSC Group I Selected',
        visible: true
      },
      {
        number: '03',
        icon: 'PenTool',
        title: 'Mock Tests',
        subtitle: 'Weekly full-length tests and sectional tests with detailed analysis.',
        tag: 'FEATURE 03',
        caption: 'Simulate the real exam experience before test day.',
        desc: 'Take weekly full-length mock tests and sectional practice tests. Get instant performance analytics, detailed solutions, and rank comparisons.',
        checkpoints: [
          'Weekly full-length exam simulations',
          'Sectional and subject-wise test series',
          'Detailed answer keys & explanations',
          'All-Puducherry & Tamil Nadu rank tracking',
          'Personalized weak-area analysis'
        ],
        primaryCta: 'TAKE MOCK TEST',
        primaryCtaLink: '',
        secondaryCta: 'View Test Schedule',
        secondaryCtaLink: '',
        imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=1200&auto=format&fit=crop',
        calloutNote: 'Real Exam Simulation',
        quote: 'Weekly mock tests helped me eliminate exam fear and manage my time effectively.',
        author: '— R. Vimal, TNPSC Group II Rank 14',
        visible: true
      },
      {
        number: '04',
        icon: 'LineChart',
        title: 'Progress Tracking',
        subtitle: 'Personal performance dashboard to monitor strengths and weaknesses.',
        tag: 'FEATURE 04',
        caption: 'Data-driven insights for smarter preparation.',
        desc: 'Monitor your study hours, score trends, and subject mastery over time with our intuitive student analytics dashboard.',
        checkpoints: [
          'Subject-wise mastery percentages',
          'Time management & speed analytics',
          'Score trend graphs over weeks',
          'Personalized study plan recommendations',
          'Direct feedback from course mentors'
        ],
        primaryCta: 'VIEW DASHBOARD',
        primaryCtaLink: '',
        secondaryCta: 'Learn More',
        secondaryCtaLink: '',
        imageUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=1200&auto=format&fit=crop',
        calloutNote: 'AI-Powered Insights',
        quote: 'Tracking my weekly scores helped me focus exactly where I was losing marks.',
        author: '— A. Soundarya, Sub-Inspector Exam 2024',
        visible: true
      },
      {
        number: '05',
        icon: 'CalendarCheck',
        title: 'Class Schedule',
        subtitle: 'Flexible batch timings for students, working professionals and rural aspirants.',
        tag: 'FEATURE 05',
        caption: 'Study on your timeline without compromising quality.',
        desc: 'Choose from weekday regular batches, weekend batches for working professionals, or evening online sessions designed for maximum flexibility.',
        checkpoints: [
          'Morning & Evening live batch timings',
          'Special weekend batches for professionals',
          '24/7 access to recorded lectures',
          'Flexible batch transfer options',
          'Structured weekly timetable updates'
        ],
        primaryCta: 'VIEW TIMETABLE',
        primaryCtaLink: '',
        secondaryCta: 'Batch Details',
        secondaryCtaLink: '',
        imageUrl: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?q=80&w=1200&auto=format&fit=crop',
        calloutNote: 'Weekday & Weekend Batches',
        quote: 'As a working professional, the flexible weekend schedule made my preparation possible.',
        author: '— K. Venkatesh, VAO Selected',
        visible: true
      },
      {
        number: '06',
        icon: 'UserCircle',
        title: 'Academic Guidance',
        subtitle: 'One-on-one mentoring sessions with IAS/IPS selected alumni faculty.',
        tag: 'FEATURE 06',
        caption: 'Direct 1-on-1 mentorship throughout your journey.',
        desc: 'Get guidance from selected officers, experienced faculty, and subject experts to clear strategy doubts, stay motivated, and refine your approach.',
        checkpoints: [
          '1-on-1 personal mentorship sessions',
          'Strategy planning with selected alumni',
          'Regular progress reviews & feedback',
          'Answer writing evaluation & review',
          'Motivation and stress management support'
        ],
        primaryCta: 'BOOK MENTOR SESSION',
        primaryCtaLink: '',
        secondaryCta: 'Our Faculty',
        secondaryCtaLink: '',
        imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200&auto=format&fit=crop',
        calloutNote: '1-on-1 Officer Guidance',
        quote: 'One-on-one sessions with faculty kept me focused during tough phases of preparation.',
        author: '— P. Divya, TNPSC Group I Mains Aspirant',
        visible: true
      }
    ],
    features: [
      { icon: 'GraduationCap', title: 'Structured Classes',  desc: 'Daily scheduled classes with expert faculty in Tamil & English medium.', imageUrl: '', visible: true },
      { icon: 'BookOpen',      title: 'Study Materials',     desc: 'Comprehensive study notes and question banks aligned to exam pattern.', imageUrl: '', visible: true },
      { icon: 'PenTool',       title: 'Mock Tests',          desc: 'Weekly full-length tests and sectional tests with detailed analysis.', imageUrl: '', visible: true },
      { icon: 'LineChart',     title: 'Progress Tracking',   desc: 'Personal performance dashboard to monitor strengths and weaknesses.', imageUrl: '', visible: true },
      { icon: 'CalendarCheck', title: 'Class Schedule',      desc: 'Flexible batch timings for students, working professionals and rural aspirants.', imageUrl: '', visible: true },
      { icon: 'UserCircle',    title: 'Academic Guidance',   desc: 'One-on-one mentoring sessions with IAS/IPS selected alumni faculty.', imageUrl: '', visible: true }
    ],
    courses: [
      { icon: '🏛️', name: 'UPSC Civil Service',  subname: 'IAS / IPS / IFS',                      desc: "India's most prestigious exam. Comprehensive coaching for Prelims, Mains & Interview.", tags: ['CIVIL SERVICES','IAS','IPS','IFS'],                         slug: 'upsc' },
      { icon: '📋', name: 'TNPSC / Railways',    subname: 'GROUP I · II · IV · VAO',               desc: 'Complete preparation for Tamil Nadu Public Service Commission and Railway recruitment exams.', tags: ['GROUP I','GROUP II / IIA','GROUP IV','VAO'],             slug: 'tnpsc' },
      { icon: '📁', name: 'UDC / LDC / VAO',     subname: 'CLERICAL & REVENUE SERVICES',           desc: 'Focused coaching for Upper Division Clerk, Lower Division Clerk and Village Administrative Officer.', tags: ['UDC','LDC','VAO'],                             slug: 'udc-ldc' },
      { icon: '🏦', name: 'Banking',              subname: 'IBPS · SBI · RBI',                      desc: 'Structured coaching for IBPS PO, Clerk, SBI PO/Clerk, RBI Grade B and other banking exams.', tags: ['IBPS PO','IBPS CLERK','SBI PO','RBI GRADE B'],         slug: 'banking' },
      { icon: '🌿', name: 'Puducherry Exam',      subname: 'UDC · LDC · DEPUTY TAHSILDAR · SI',    desc: 'Specialised coaching for Puducherry Government recruitment — Deputy Tahsildar, Sub-Inspector, UDC, LDC.', tags: ['DEPUTY TAHSILDAR','SUB-INSPECTOR','UDC','LDC'], slug: 'puducherry' },
      { icon: '⚖️', name: 'SSC / PC / DT / SI',  subname: 'CENTRAL & STATE COMBINED',              desc: 'Coaching for SSC CGL, CHSL, Police Constable, Deputy Tahsildar and Sub-Inspector exams.', tags: ['SSC CGL','SSC CHSL','POLICE CONSTABLE','SUB-INSPECTOR'], slug: 'ssc' }
    ],
    about: {
      eyebrow: 'About Nermai',
      title: 'Built in Puducherry.\nDriven by purpose.',
      para1: 'Quality coaching should not be a privilege. A handful of youth from Puducherry started NERMAI IAS ACADEMY to change this — making serious civil services preparation accessible to every aspirant, regardless of background.',
      para2: 'The civil services examination is the most prestigious and most demanding exam in the country. Nermai exists to make the path clearer, the preparation more structured, and the journey less lonely.',
      imageUrl: 'https://nermaiiasacademy.in/wp-content/uploads/2024/11/WhatsApp-Image-2024-11-16-at-10.34.22-PM-2-1.jpeg',
      imageLabel: '187+ RESULTS · 2022–25',
      badges: [
        { num: '187+',  label: 'Results' },
        { num: '14+',   label: 'Years' },
        { num: '2400+', label: 'Students' }
      ]
    },
    steps: [
      { num: '01', title: 'Choose Your Goal', desc: 'Choose from TNPSC, UPSC, Police or Banking on our Website.' },
      { num: '02', title: 'Choose Your Course',        desc: 'Find the right batch and course structure for your needs.' },
      { num: '03', title: 'Enroll / Login',           desc: 'Access your student dashboard and course materials.' },
      { num: '04', title: 'Training + Tests',                   desc: 'Attend classes, take mock tests, and track your progress.' },
      { num: '05', title: 'Achieve Your Goal',                    desc: 'Clear the exam and become a Government Officer.' }
    ],
    ticker: {
      visible: true,
      items: [
        { text: 'Classroom GS PCM 2027 - Admission Open', link: '#' },
        { text: 'Online GS PCM 2027 - Admission Open', link: '#' },
        { text: 'StepUp Mentorship 2027 - Admission Open', link: '#' }
      ]
    },
    testimonialsConfig: {
      eyebrow: 'STUDENT REVIEWS',
      title: 'Hear What They Say',
      subtitle: 'Honest feedback from successful Nermai students.',
      leftNoteLine1: 'Same Dedication.',
      leftNoteLine2: 'A Brighter Tomorrow.',
      rightScriptLine1: 'Real Aspirants',
      rightScriptLine2: 'Real Stories',
      rightScriptLine3: 'Real Success',
      bottomTagline: 'THOUSANDS OF DREAMS. A STRONGER INDIA.'
    }
  },
  footer: {
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
      phones: "919876543210, +91 9999999999",
      email: "info@nermai.in"
    },
    usefulLinks: [
      { label: 'Examinations', link: '/#examinations' },
      { label: 'Gallery', link: '/#gallery' },
      { label: 'About Us', link: '/why-nermai' },
      { label: 'Contact Us', link: '/contact' },
      { label: 'All Courses', link: '/courses' }
    ],
    notifications: [
      { label: 'Banking', link: 'https://lms.nermai.in' },
      { label: 'Exam Notifications', link: 'https://lms.nermai.in' },
      { label: 'Study Material', link: 'https://lms.nermai.in' },
      { label: 'Pondicherry Recruitments', link: 'https://lms.nermai.in' },
      { label: 'Central Recruitments', link: 'https://lms.nermai.in' }
    ],
    coursesLinks: [
      { label: 'UPSC Civil Service', link: '/courses/upsc' },
      { label: 'TNPSC / Railways', link: '/courses/tnpsc' },
      { label: 'UDC / LDC / VAO', link: '/courses/udc-ldc' },
      { label: 'Banking', link: '/courses/banking' }
    ],
    bottom: {
      meta: "Non Profit | Non Commercial"
    }
  }
}

const DEFAULT_NOTICES = [
  { title: 'TNPSC Group IV Exam Notification 2024', content: 'Applications for TNPSC Group IV exam are being accepted. Last date: 30 September 2024.', priority: 'high', date: new Date().toISOString().split('T')[0] },
  { title: 'New Batch Starts — October 2024', content: 'New batch for UPSC Prelims 2025 starts from October 1st. Limited seats.', priority: 'normal', date: new Date().toISOString().split('T')[0] },
  { title: 'TN Police SI Exam Application', content: 'Model questions for Tamil Nadu Police Sub-Inspector exam are available.', priority: 'normal', date: new Date().toISOString().split('T')[0] }
]

const DEFAULT_RESULTS = [
  {
    id: 'res-1',
    name: 'Arjun Kumar',
    exam: 'UPSC Civil Services',
    year: '2026',
    rank: '01',
    category: 'upsc',
    quote: 'A journey of discipline leads to a life of purpose.',
    story: 'Comprehensive guidance for Prelims and Mains along with individual answer writing evaluation at Nermai played a critical role in clearing UPSC Civil Services.',
    photo: '',
    isFeatured: true,
    visible: true
  },
  {
    id: 'res-2',
    name: 'Priya S.',
    exam: 'TNPSC Group I',
    year: '2026',
    rank: '01',
    category: 'tnpsc-g1',
    quote: 'Consistent effort creates extraordinary results.',
    story: 'Nermai Academy structured test series, daily current affairs analysis, and personalized mentorship helped me secure State Rank 1.',
    photo: '',
    isFeatured: true,
    visible: true
  },
  {
    id: 'res-3',
    name: 'Karthik R.',
    exam: 'Banking (IBPS PO)',
    year: '2026',
    rank: '01',
    category: 'banking',
    quote: 'Dream. Prepare. Achieve.',
    story: 'The shortcut techniques in Quantitative Aptitude and speed test batches helped me clear both Prelims and Mains on my first attempt.',
    photo: '',
    isFeatured: true,
    visible: true
  },
  {
    id: 'res-4',
    name: 'Vignesh M.',
    exam: 'UPSC Civil Services',
    year: '2026',
    rank: '45',
    category: 'upsc',
    quote: 'The faculty were more than teachers — they were mentors.',
    story: 'Daily answer writing and individual mentoring sessions at Nermai built my confidence to secure AIR 45.',
    photo: '',
    isFeatured: true,
    visible: true
  },
  {
    id: 'res-5',
    name: 'Divya S.',
    exam: 'TNPSC Group II',
    year: '2026',
    rank: '03',
    category: 'tnpsc-g2',
    quote: 'Nermai gave me the right direction and the confidence to stay consistent.',
    story: 'From foundational coaching to final revision batches, Nermai provided the exact roadmap needed.',
    photo: '',
    isFeatured: true,
    visible: true
  },
  {
    id: 'res-6',
    name: 'Suresh K.',
    exam: 'TNPSC Group II',
    year: '2026',
    rank: '07',
    category: 'tnpsc-g2',
    quote: 'Constant motivation and regular doubt-clearing sessions.',
    story: 'Weekly tests and faculty feedback helped me continuously improve my score.',
    photo: '',
    isFeatured: true,
    visible: true
  },
  {
    id: 'res-7',
    name: 'Anitha R.',
    exam: 'TNPSC Group IV',
    year: '2026',
    rank: '12',
    category: 'tnpsc-g4',
    quote: 'Mock tests at Nermai made me exam-ready and fearless.',
    story: 'Tamil medium materials and general studies classes were exceptionally structured.',
    photo: '',
    isFeatured: false,
    visible: true
  },
  {
    id: 'res-8',
    name: 'V. Anbuselvan',
    exam: 'Puducherry UDC/LDC',
    year: '2024',
    rank: '03',
    category: 'puducherry',
    quote: 'Focused coaching and structured test series made all the difference.',
    story: 'Clearing Puducherry government exam required thorough coverage of local syllabus and current affairs.',
    photo: '',
    isFeatured: false,
    visible: true
  },
  {
    id: 'res-9',
    name: 'Selvam K.',
    exam: 'TN Police SI',
    year: '2024',
    rank: '02',
    category: 'police',
    quote: 'Physical training guidance along with academics made the difference.',
    story: 'Nermai provided both top quality classroom sessions and physical ground training support.',
    photo: '',
    isFeatured: false,
    visible: true
  }
]

const DEFAULT_TOPPERS = DEFAULT_RESULTS

const DEFAULT_TESTIMONIALS = [
  { name: 'Anitha Devi', role: 'TNPSC Group IV Aspirant', quote: 'I succeeded in my first attempt by studying at Nermai. The dedication of the teachers is outstanding.' },
  { name: 'Rajkumar P.', role: 'TN Police Constable', quote: 'The study materials and mock tests were exactly aligned with the exam pattern. Highly recommend!' },
  { name: 'Lakshmi N.', role: 'UPSC Aspirant', quote: 'Getting UPSC training in Tamil is very rare. Nermai made it possible.' },
  { name: 'Vikram S.', role: 'TNPSC Group II', quote: 'Excellent current affairs coverage and daily tests kept me on track throughout my preparation.' }
]

// ─── FIRESTORE OPERATIONS ───────────────────────────────────────────────────

export const fbFirestore = {

  // ── SETTINGS ──
  async getSettings() {
    try {
      const snap = await getDoc(settingsDoc())
      if (!snap.exists()) {
        await setDoc(settingsDoc(), DEFAULT_SETTINGS, { merge: true })
        return DEFAULT_SETTINGS
      }
      return { ...DEFAULT_SETTINGS, ...snap.data() }
    } catch {
      return DEFAULT_SETTINGS
    }
  },

  async updateSettings(data) {
    try {
      await setDoc(settingsDoc(), data, { merge: true })
    } catch (e) { console.error('updateSettings error', e) }
  },

  onSettingsChanged(callback) {
    return onSnapshot(settingsDoc(), (snap) => {
      if (snap.exists()) callback({ ...DEFAULT_SETTINGS, ...snap.data() })
      else callback(DEFAULT_SETTINGS)
    }, () => callback(DEFAULT_SETTINGS))
  },

  // Verify admin passcode against Firestore
  async verifyPasscode(inputCode) {
    try {
      const settings = await this.getSettings()
      return (settings.passcode || DEFAULT_SETTINGS.passcode) === inputCode.trim()
    } catch {
      return inputCode.trim() === DEFAULT_SETTINGS.passcode
    }
  },

  // ── HERO SLIDES ──
  async getHeroSlides() {
    try {
      const q = query(heroCol(), orderBy('order', 'asc'))
      const snap = await getDocs(q)
      return snap.docs.map(d => ({ id: d.id, ...d.data() }))
    } catch {
      return []
    }
  },

  onHeroSlidesChanged(callback) {
    const q = query(heroCol(), orderBy('order', 'asc'))
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    }, () => callback([]))
  },

  async addHeroSlide(data) {
    const slides = await this.getHeroSlides()
    const desktopUrl = data.urlDesktop || data.url || ''
    return await addDoc(heroCol(), {
      // Legacy field for backward compat — mirrors urlDesktop
      url: desktopUrl,
      // Responsive image fields
      urlDesktop: desktopUrl,                   // PC banner: 1920 × 600 px
      urlMobile:  data.urlMobile || '',          // Mobile poster: 768 × 1024 px
      title:      data.title    || '',
      subtitle:   data.subtitle || '',
      cta:        data.cta      || '',
      ctaLink:    data.ctaLink  || '#',
      order:      slides.length,
      storageType: data.storageType || 'url',
      createdAt:  serverTimestamp()
    })
  },

  async updateHeroSlide(id, data) {
    await updateDoc(doc(db, COLLECTIONS.HERO_SLIDES, id), data)
  },

  async deleteHeroSlide(id) {
    await deleteDoc(doc(db, COLLECTIONS.HERO_SLIDES, id))
  },

  // ── NOTICES ──
  async getNotices() {
    try {
      const q = query(noticesCol(), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      return snap.docs.map(d => ({ id: d.id, ...d.data() }))
    } catch {
      return DEFAULT_NOTICES.map((n, i) => ({ id: `default_${i}`, ...n }))
    }
  },

  onNoticesChanged(callback) {
    const q = query(noticesCol(), orderBy('createdAt', 'desc'))
    return onSnapshot(q, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      callback(items.length > 0 ? items : DEFAULT_NOTICES.map((n, i) => ({ id: `default_${i}`, ...n })))
    }, () => callback(DEFAULT_NOTICES.map((n, i) => ({ id: `default_${i}`, ...n }))))
  },

  async addNotice(data) {
    return await addDoc(noticesCol(), {
      title: data.title || '',
      content: data.content || '',
      priority: data.priority || 'normal',
      date: data.date || new Date().toISOString().split('T')[0],
      createdAt: serverTimestamp()
    })
  },

  async updateNotice(id, data) {
    await updateDoc(doc(db, COLLECTIONS.NOTICES, id), data)
  },

  async deleteNotice(id) {
    await deleteDoc(doc(db, COLLECTIONS.NOTICES, id))
  },

  // ── TOPPERS & RESULTS (Unified Collection) ──
  async getToppers() {
    return await this.getResults()
  },

  onToppersChanged(callback) {
    return this.onResultsChanged(callback)
  },

  async addTopper(data) {
    return await this.addResult(data)
  },

  async updateTopper(id, data) {
    return await this.updateResult(id, data)
  },

  async deleteTopper(id) {
    return await this.deleteResult(id)
  },

  // ── TESTIMONIALS ──
  async getTestimonials() {
    try {
      const q = query(testimonialsCol(), orderBy('createdAt', 'asc'))
      const snap = await getDocs(q)
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      return items.length > 0 ? items : DEFAULT_TESTIMONIALS.map((t, i) => ({ id: `default_${i}`, ...t }))
    } catch {
      return DEFAULT_TESTIMONIALS.map((t, i) => ({ id: `default_${i}`, ...t }))
    }
  },

  onTestimonialsChanged(callback) {
    const q = query(testimonialsCol(), orderBy('createdAt', 'asc'))
    return onSnapshot(q, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      callback(items.length > 0 ? items : DEFAULT_TESTIMONIALS.map((t, i) => ({ id: `default_${i}`, ...t })))
    }, () => callback(DEFAULT_TESTIMONIALS.map((t, i) => ({ id: `default_${i}`, ...t }))))
  },

  async addTestimonial(data) {
    return await addDoc(testimonialsCol(), {
      name: data.name || '',
      role: data.role || '',
      quote: data.quote || '',
      createdAt: serverTimestamp()
    })
  },

  async updateTestimonial(id, data) {
    await updateDoc(doc(db, COLLECTIONS.TESTIMONIALS, id), data)
  },

  async deleteTestimonial(id) {
    await deleteDoc(doc(db, COLLECTIONS.TESTIMONIALS, id))
  },

  // ── GALLERY ──
  async getGallery() {
    try {
      const q = query(galleryCol(), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      return snap.docs.map(d => ({ id: d.id, ...d.data() }))
    } catch {
      return []
    }
  },

  onGalleryChanged(callback) {
    const q = query(galleryCol(), orderBy('createdAt', 'desc'))
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    }, () => callback([]))
  },

  async addGalleryImage(data) {
    return await addDoc(galleryCol(), {
      url: data.url || '',
      caption: data.caption || '',
      category: data.category || 'all',
      storageType: data.storageType || 'url',
      createdAt: serverTimestamp()
    })
  },

  async updateGalleryImage(id, data) {
    await updateDoc(doc(db, COLLECTIONS.GALLERY, id), data)
  },

  async deleteGalleryImage(id) {
    await deleteDoc(doc(db, COLLECTIONS.GALLERY, id))
  },

  // ── COURSE CONTENT (per-course detail pages) ──
  async getCourseContent(slug) {
    try {
      const snap = await getDoc(courseContentDoc(slug))
      if (!snap.exists()) return null
      return { slug, ...snap.data() }
    } catch { return null }
  },

  // ── RESOURCES ──
  async getResources() {
    try {
      const snap = await getDocs(query(collection(db, 'resources')))
      return snap.docs.map(d => ({id: d.id, ...d.data()}))
    } catch { return [] }
  },
  onResourcesChanged(callback) { return onSnapshot(query(collection(db, 'resources')), snap => callback(snap.docs.map(d => ({id: d.id, ...d.data()}))), () => callback([])) },
  async addResource(data) {
    return await addDoc(collection(db, 'resources'), {
      ...data,
      createdAt: serverTimestamp()
    })
  },
  async updateResource(id, data) {
    await updateDoc(doc(db, 'resources', id), data)
  },
  async deleteResource(id) {
    await deleteDoc(doc(db, 'resources', id))
  },
  async getFreeResourcesSettings() {
    try {
      const s = await this.getSettings()
      return s?.freeResourcesPage || DEFAULT_FREE_RESOURCES_SETTINGS
    } catch {
      return DEFAULT_FREE_RESOURCES_SETTINGS
    }
  },
  async updateFreeResourcesSettings(data) {
    return await this.updateSettings({ freeResourcesPage: data })
  },


  async saveCourseContent(slug, data) {
    await setDoc(courseContentDoc(slug), {
      ...data,
      slug,
      updatedAt: serverTimestamp()
    }, { merge: true })
  },

  async getAllCourseContent() {
    try {
      const snap = await getDocs(collection(db, COLLECTIONS.COURSE_CONTENT))
      return snap.docs.map(d => ({ id: d.id, ...d.data() }))
    } catch { return [] }
  },

  // ── RESULT CATEGORIES ──
  async getResultCategories() {
    try {
      const q = query(resultCategoriesCol(), orderBy('order', 'asc'))
      const snap = await getDocs(q)
      return snap.docs.map(d => ({ id: d.id, ...d.data() }))
    } catch { return [] }
  },

  onResultCategoriesChanged(callback) {
    const q = query(resultCategoriesCol(), orderBy('order', 'asc'))
    return onSnapshot(q, snap => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    }, () => callback([]))
  },

  async addResultCategory(data) {
    const existing = await this.getResultCategories()
    return await addDoc(resultCategoriesCol(), {
      name:  data.name  || 'New Category',
      slug:  data.slug  || data.name?.toLowerCase().replace(/\s+/g, '-') || 'category',
      color: data.color || '#7b1b2e',
      order: existing.length,
      createdAt: serverTimestamp()
    })
  },

  async updateResultCategory(id, data) {
    await updateDoc(doc(db, COLLECTIONS.RESULT_CATEGORIES, id), data)
  },

  async deleteResultCategory(id) {
    await deleteDoc(doc(db, COLLECTIONS.RESULT_CATEGORIES, id))
  },

  // Gallery images with category support
  async getGalleryByCategory(category) {
    try {
      const snap = await getDocs(galleryCol())
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      if (!category || category === 'all') return all
      return all.filter(img => img.category === category)
    } catch { return [] }
  },

  // ── RESULTS (dedicated results page entries) ──
  async getResults() {
    try {
      const q = query(resultsCol(), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      return snap.docs.map(d => ({ id: d.id, ...d.data() }))
    } catch { return [] }
  },

  onResultsChanged(callback) {
    const q = query(resultsCol(), orderBy('createdAt', 'desc'))
    return onSnapshot(q, snap => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    }, () => callback([]))
  },

  async addResult(data) {
    return await addDoc(resultsCol(), {
      name:       data.name       || '',
      rank:       data.rank       || '',
      exam:       data.exam       || '',
      year:       data.year       || new Date().getFullYear().toString(),
      photo:      data.photo      || '',
      quote:      data.quote      || '',
      story:      data.story      || '',
      category:   data.category   || 'upsc',
      isFeatured: data.isFeatured === true,
      visible:    data.visible !== false,
      storageType: data.storageType || 'url',
      createdAt:  serverTimestamp()
    })
  },

  async updateResult(id, data) {
    await updateDoc(doc(db, COLLECTIONS.RESULTS, id), data)
  },

  async deleteResult(id) {
    await deleteDoc(doc(db, COLLECTIONS.RESULTS, id))
  },

  COLLECTIONS
}

import { firebaseConfig } from './config'
const isDemo = firebaseConfig.projectId === 'nermai-demo' || !firebaseConfig.projectId

if (isDemo) {
  console.log('Firebase not configured. Using LocalStorage fallback.')
  
  const ls = {
    get: (k, def) => { try { return JSON.parse(localStorage.getItem('nermai_' + k)) || def } catch { return def } },
    set: (k, v) => localStorage.setItem('nermai_' + k, JSON.stringify(v)),
    genId: () => Math.random().toString(36).substr(2, 9)
  }

  const mockCol = (key, defaultData = []) => {
    const getEv = () => 'nermai_db_' + key
    return {
      get: async () => ls.get(key, defaultData),
      on: (cb) => {
        const trig = () => cb(ls.get(key, defaultData))
        trig()
        window.addEventListener(getEv(), trig)
        return () => window.removeEventListener(getEv(), trig)
      },
      add: async (data) => {
        const items = ls.get(key, defaultData)
        const id = ls.genId()
        items.push({ id, ...data, createdAt: new Date().toISOString() })
        ls.set(key, items)
        window.dispatchEvent(new Event(getEv()))
        return { id }
      },
      update: async (id, data) => {
        const items = ls.get(key, defaultData)
        const idx = items.findIndex(x => x.id === id)
        if (idx >= 0) {
          items[idx] = { ...items[idx], ...data }
          ls.set(key, items)
          window.dispatchEvent(new Event(getEv()))
        }
      },
      del: async (id) => {
        const items = ls.get(key, defaultData)
        ls.set(key, items.filter(x => x.id !== id))
        window.dispatchEvent(new Event(getEv()))
      }
    }
  }

  const getStoredResults = () => {
    const r = ls.get('results', null)
    const t = ls.get('toppers', null)
    if (r !== null && Array.isArray(r) && r.length > 0) return r
    if (t !== null && Array.isArray(t) && t.length > 0) return t
    return DEFAULT_RESULTS
  }

  const resultsColHandler = {
    get: async () => getStoredResults(),
    on: (cb) => {
      const trig = () => cb(getStoredResults())
      trig()
      window.addEventListener('nermai_db_results', trig)
      window.addEventListener('nermai_db_toppers', trig)
      return () => {
        window.removeEventListener('nermai_db_results', trig)
        window.removeEventListener('nermai_db_toppers', trig)
      }
    },
    add: async (data) => {
      const items = getStoredResults()
      const id = ls.genId()
      const newItem = { id, ...data, createdAt: new Date().toISOString() }
      items.unshift(newItem)
      ls.set('results', items)
      ls.set('toppers', items)
      window.dispatchEvent(new Event('nermai_db_results'))
      window.dispatchEvent(new Event('nermai_db_toppers'))
      return { id }
    },
    update: async (id, data) => {
      const items = getStoredResults()
      const idx = items.findIndex(x => x.id === id)
      if (idx >= 0) {
        items[idx] = { ...items[idx], ...data }
        ls.set('results', items)
        ls.set('toppers', items)
        window.dispatchEvent(new Event('nermai_db_results'))
        window.dispatchEvent(new Event('nermai_db_toppers'))
      }
    },
    del: async (id) => {
      const items = getStoredResults()
      const filtered = items.filter(x => x.id !== id)
      ls.set('results', filtered)
      ls.set('toppers', filtered)
      window.dispatchEvent(new Event('nermai_db_results'))
      window.dispatchEvent(new Event('nermai_db_toppers'))
    }
  }

  const heroes = mockCol('hero', [])
  const notices = mockCol('notices', DEFAULT_NOTICES.map((n,i) => ({id:`def_${i}`, ...n})))
  const results = resultsColHandler
  const testimonials = mockCol('testimonials', DEFAULT_TESTIMONIALS.map((t,i) => ({id:`def_${i}`, ...t})))
  const gallery = mockCol('gallery', [])
  const resultCats = mockCol('resultCats', [])
  const resources = mockCol('resources', [])

  Object.assign(fbFirestore, {
    async getSettings() { return ls.get('settings', DEFAULT_SETTINGS) },
    async updateSettings(data) {
      const cur = await this.getSettings()
      ls.set('settings', { ...cur, ...data })
      window.dispatchEvent(new Event('nermai_db_settings'))
    },
    onSettingsChanged(cb) {
      const trig = () => cb(ls.get('settings', DEFAULT_SETTINGS))
      trig()
      window.addEventListener('nermai_db_settings', trig)
      return () => window.removeEventListener('nermai_db_settings', trig)
    },
    async verifyPasscode(code) {
      const s = await this.getSettings()
      return (s.passcode || DEFAULT_SETTINGS.passcode) === code.trim()
    },

    getHeroSlides: heroes.get, onHeroSlidesChanged: heroes.on,
    addHeroSlide: async (data) => {
      const all = await heroes.get()
      return heroes.add({ ...data, urlDesktop: data.urlDesktop || data.url || '', urlMobile: data.urlMobile || '', order: all.length })
    },
    updateHeroSlide: heroes.update, deleteHeroSlide: heroes.del,

    getNotices: notices.get, onNoticesChanged: notices.on, addNotice: notices.add, updateNotice: notices.update, deleteNotice: notices.del,
    
    getToppers: results.get, onToppersChanged: results.on, 
    addTopper: async (data) => results.add({ 
      name: data.name||'', rank: data.rank||'', exam: data.exam||'', year: data.year||new Date().getFullYear().toString(), 
      photo: data.photo||'', quote: data.quote||'', story: data.story||'', category: data.category||'upsc', 
      isFeatured: data.isFeatured === true, visible: data.visible !== false, storageType: data.storageType||'url' 
    }), 
    updateTopper: results.update, deleteTopper: results.del,
    
    getTestimonials: testimonials.get, onTestimonialsChanged: testimonials.on, addTestimonial: testimonials.add, updateTestimonial: testimonials.update, deleteTestimonial: testimonials.del,
    
    getGallery: gallery.get, onGalleryChanged: gallery.on, addGalleryImage: gallery.add, updateGalleryImage: gallery.update, deleteGalleryImage: gallery.del,
    async getGalleryByCategory(cat) {
      const all = await gallery.get()
      return cat === 'all' ? all : all.filter(x => x.categoryId === cat)
    },
    async getFaqs() {
      // Returns empty by default so FaqPage uses DEFAULT_FAQS fallback
      return []
    },

    getResources: resources.get, onResourcesChanged: resources.on, addResource: resources.add, updateResource: resources.update, deleteResource: resources.del,

    getResultCategories: resultCats.get, onResultCategoriesChanged: resultCats.on, updateResultCategory: resultCats.update, deleteResultCategory: resultCats.del,
    addResultCategory: async (data) => {
      const all = await resultCats.get()
      return resultCats.add({ name: data.name || 'Category', slug: data.slug || data.name?.toLowerCase().replace(/\s+/g,'-') || 'cat', color: data.color || '#7b1b2e', order: all.length })
    },

    getResults: results.get, onResultsChanged: results.on, deleteResult: results.del,
    addResult: async (data) => results.add({ 
      name: data.name||'', rank: data.rank||'', exam: data.exam||'', year: data.year||new Date().getFullYear().toString(), 
      photo: data.photo||'', quote: data.quote||'', story: data.story||'', category: data.category||'upsc', 
      isFeatured: data.isFeatured === true, visible: data.visible !== false, storageType: data.storageType||'url' 
    }),
    updateResult: results.update,

    async getCourseContent(slug) {
      const map = ls.get('courses', {})
      return map[slug] || null
    },
    async saveCourseContent(slug, data) {
      const map = ls.get('courses', {})
      map[slug] = { ...data, slug, updatedAt: new Date().toISOString() }
      ls.set('courses', map)
    },
    async getAllCourseContent() {
      const map = ls.get('courses', {})
      return Object.values(map)
    }
  })
}
