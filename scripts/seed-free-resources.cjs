/**
 * seed-free-resources.cjs
 * Seeds authentic initial resources and full word customization into nermaistatic Firestore.
 * Run: node scripts/seed-free-resources.cjs
 */
const path = require('path')
const { initializeApp, cert } = require('firebase-admin/app')
const { getFirestore, FieldValue } = require('firebase-admin/firestore')

const keyPath = path.resolve(__dirname, '../nermaistatic-firebase-adminsdk-fbsvc-40686bcf86.json')
const serviceAccount = require(keyPath)

const app = initializeApp({
  credential: cert(serviceAccount)
})
const db = getFirestore(app)

const DEFAULT_SETTINGS = {
  eyebrow: 'FREE RESOURCES',
  title: 'Learn. Prepare. Grow.',
  highlightWord: 'For free.',
  description: 'Access high-quality study materials, daily updates, magazines and more — shared by Nermai for every aspirant.',
  badges: [
    { id: 'b1', icon: 'fa-shield-halved', label: 'Curated by Experts' },
    { id: 'b2', icon: 'fa-file-lines', label: 'Updated Regularly' },
    { id: 'b3', icon: 'fa-users', label: 'All in One Place' },
    { id: 'b4', icon: 'fa-database', label: 'Direct from Official Sources' },
  ],
  sloganRight: 'Knowledge Today, A Stronger Tomorrow',
  heroBgUrl: '',
  heroSideImgUrl: '',

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
}

// Drive IDs and public PDF resources
const RESOURCES = [
  {
    title: 'Daily Current Affairs 23 September 2026',
    category: 'Current Affairs',
    resourceType: 'Daily Content',
    date: '2026-09-23',
    issueInfo: '23 Sep 2026',
    driveFileId: '1mQhq5ObXFC2Xuu55zHTGfa7iJZebiDCG',
    url: 'https://drive.google.com/file/d/1mQhq5ObXFC2Xuu55zHTGfa7iJZebiDCG/view',
    thumbnailUrl: 'https://drive.google.com/thumbnail?id=1mQhq5ObXFC2Xuu55zHTGfa7iJZebiDCG&sz=w800',
    sizeBytes: 2516582, // 2.4 MB
    pages: 12,
    format: 'PDF',
    isFeatured: true,
    isPopular: false,
    downloadsCount: 342,
    description: 'Daily in-depth coverage of National, International, Economy, Tamil Nadu events with MCQs.'
  },
  {
    title: 'The Hindu Analysis Notes',
    category: 'General Studies',
    resourceType: 'Daily Content',
    date: '2026-09-23',
    issueInfo: '23 Sep 2026',
    driveFileId: '1x1SuM8hvV1zUyzZTcrv-2lyLEM1BiDcZ',
    url: 'https://drive.google.com/file/d/1x1SuM8hvV1zUyzZTcrv-2lyLEM1BiDcZ/view',
    thumbnailUrl: 'https://drive.google.com/thumbnail?id=1x1SuM8hvV1zUyzZTcrv-2lyLEM1BiDcZ&sz=w800',
    sizeBytes: 1887436, // 1.8 MB
    pages: 10,
    format: 'PDF',
    isFeatured: true,
    isPopular: false,
    downloadsCount: 289,
    description: 'Curated editorial summaries, mains perspective points, and static GS syllabus linkages.'
  },
  {
    title: 'Tamil Nadu Daily Bulletin',
    category: 'Tamil Nadu (TN)',
    resourceType: 'Daily Content',
    date: '2026-09-23',
    issueInfo: '23 Sep 2026',
    driveFileId: '16WmSlxVMFoSZ3ctIPFPFDWGxuDWtBbOQ',
    url: 'https://drive.google.com/file/d/16WmSlxVMFoSZ3ctIPFPFDWGxuDWtBbOQ/view',
    thumbnailUrl: 'https://drive.google.com/thumbnail?id=16WmSlxVMFoSZ3ctIPFPFDWGxuDWtBbOQ&sz=w800',
    sizeBytes: 1258291, // 1.2 MB
    pages: 8,
    format: 'PDF',
    isFeatured: false,
    isPopular: false,
    downloadsCount: 215,
    description: 'State government schemes, TN legislative assembly updates, and district development reports.'
  },
  {
    title: 'Daily MCQs (50 Questions)',
    category: 'General Studies',
    resourceType: 'Daily Content',
    date: '2026-09-23',
    issueInfo: '23 Sep 2026',
    driveFileId: '1KTO8zOM5179WBEbNVI3onkecw3uLy6DN',
    url: 'https://drive.google.com/file/d/1KTO8zOM5179WBEbNVI3onkecw3uLy6DN/view',
    thumbnailUrl: 'https://drive.google.com/thumbnail?id=1KTO8zOM5179WBEbNVI3onkecw3uLy6DN&sz=w800',
    sizeBytes: 1153433, // 1.1 MB
    pages: 15,
    format: 'PDF',
    isFeatured: false,
    isPopular: false,
    downloadsCount: 198,
    description: 'High-yield practice questions with detailed explanations for UPSC Prelims & TNPSC Group 1.'
  },
  {
    title: 'Important Editorial Summary',
    category: 'Current Affairs',
    resourceType: 'Daily Content',
    date: '2026-09-23',
    issueInfo: '23 Sep 2026',
    driveFileId: '1mQhq5ObXFC2Xuu55zHTGfa7iJZebiDCG',
    url: 'https://drive.google.com/file/d/1mQhq5ObXFC2Xuu55zHTGfa7iJZebiDCG/view',
    thumbnailUrl: 'https://drive.google.com/thumbnail?id=1mQhq5ObXFC2Xuu55zHTGfa7iJZebiDCG&sz=w800',
    sizeBytes: 1003520, // 980 KB
    pages: 6,
    format: 'PDF',
    isFeatured: false,
    isPopular: false,
    downloadsCount: 174,
    description: 'Analysis of key opinion pieces across leading national dailies with pros, cons and way forward.'
  },
  {
    title: 'The Week (Highlights)',
    category: 'Current Affairs',
    resourceType: 'Weekly Magazine',
    date: '2026-09-21',
    issueInfo: 'Week 3 Sep 2026',
    driveFileId: '1x1SuM8hvV1zUyzZTcrv-2lyLEM1BiDcZ',
    url: 'https://drive.google.com/file/d/1x1SuM8hvV1zUyzZTcrv-2lyLEM1BiDcZ/view',
    thumbnailUrl: 'https://drive.google.com/thumbnail?id=1x1SuM8hvV1zUyzZTcrv-2lyLEM1BiDcZ&sz=w800',
    sizeBytes: 5872025, // 5.6 MB
    pages: 32,
    format: 'PDF',
    isFeatured: true,
    isPopular: false,
    downloadsCount: 412,
    description: 'Comprehensive weekly compilation of all major events, constitutional developments, and treaties.'
  },
  {
    title: 'Yojana Compilation',
    category: 'General Studies',
    resourceType: 'Weekly Magazine',
    date: '2026-09-21',
    issueInfo: 'Week 3 Sep 2026',
    driveFileId: '16WmSlxVMFoSZ3ctIPFPFDWGxuDWtBbOQ',
    url: 'https://drive.google.com/file/d/16WmSlxVMFoSZ3ctIPFPFDWGxuDWtBbOQ/view',
    thumbnailUrl: 'https://drive.google.com/thumbnail?id=16WmSlxVMFoSZ3ctIPFPFDWGxuDWtBbOQ&sz=w800',
    sizeBytes: 5033164, // 4.8 MB
    pages: 28,
    format: 'PDF',
    isFeatured: false,
    isPopular: false,
    downloadsCount: 388,
    description: 'Theme-focused digest on socio-economic development, rural upliftment, and public policy.'
  },
  {
    title: 'Kurukshetra Digest',
    category: 'General Studies',
    resourceType: 'Weekly Magazine',
    date: '2026-09-14',
    issueInfo: 'Week 2 Sep 2026',
    driveFileId: '1KTO8zOM5179WBEbNVI3onkecw3uLy6DN',
    url: 'https://drive.google.com/file/d/1KTO8zOM5179WBEbNVI3onkecw3uLy6DN/view',
    thumbnailUrl: 'https://drive.google.com/thumbnail?id=1KTO8zOM5179WBEbNVI3onkecw3uLy6DN&sz=w800',
    sizeBytes: 4404019, // 4.2 MB
    pages: 24,
    format: 'PDF',
    isFeatured: false,
    isPopular: false,
    downloadsCount: 310,
    description: 'Essential insights into agriculture, rural infrastructure, cooperative federalism, and panchayats.'
  },
  {
    title: 'Yojana Monthly Edition',
    category: 'General Studies',
    resourceType: 'Monthly Magazine',
    date: '2026-09-01',
    issueInfo: 'September 2026',
    driveFileId: '1mQhq5ObXFC2Xuu55zHTGfa7iJZebiDCG',
    url: 'https://drive.google.com/file/d/1mQhq5ObXFC2Xuu55zHTGfa7iJZebiDCG/view',
    thumbnailUrl: 'https://drive.google.com/thumbnail?id=1mQhq5ObXFC2Xuu55zHTGfa7iJZebiDCG&sz=w800',
    sizeBytes: 7130316, // 6.8 MB
    pages: 64,
    format: 'PDF',
    isFeatured: true,
    isPopular: false,
    downloadsCount: 890,
    description: 'Complete September edition covering governance reforms, technological innovations, and budget priorities.'
  },
  {
    title: 'Kurukshetra Monthly Edition',
    category: 'General Studies',
    resourceType: 'Monthly Magazine',
    date: '2026-09-01',
    issueInfo: 'September 2026',
    driveFileId: '1x1SuM8hvV1zUyzZTcrv-2lyLEM1BiDcZ',
    url: 'https://drive.google.com/file/d/1x1SuM8hvV1zUyzZTcrv-2lyLEM1BiDcZ/view',
    thumbnailUrl: 'https://drive.google.com/thumbnail?id=1x1SuM8hvV1zUyzZTcrv-2lyLEM1BiDcZ&sz=w800',
    sizeBytes: 6186598, // 5.9 MB
    pages: 56,
    format: 'PDF',
    isFeatured: false,
    isPopular: false,
    downloadsCount: 742,
    description: 'Complete monthly issue analyzing sustainable agricultural practices and village economy resilience.'
  },
  {
    title: 'PRS India Monthly Review',
    category: 'Polity',
    resourceType: 'Monthly Magazine',
    date: '2026-09-01',
    issueInfo: 'September 2026',
    driveFileId: '16WmSlxVMFoSZ3ctIPFPFDWGxuDWtBbOQ',
    url: 'https://drive.google.com/file/d/16WmSlxVMFoSZ3ctIPFPFDWGxuDWtBbOQ/view',
    thumbnailUrl: 'https://drive.google.com/thumbnail?id=16WmSlxVMFoSZ3ctIPFPFDWGxuDWtBbOQ&sz=w800',
    sizeBytes: 3565158, // 3.4 MB
    pages: 38,
    format: 'PDF',
    isFeatured: false,
    isPopular: false,
    downloadsCount: 520,
    description: 'Parliamentary policy briefing, new bills passed, committee recommendations, and legal reforms.'
  },
  {
    title: 'UPSC Previous Year Papers (2013 - 2024)',
    category: 'General Studies',
    resourceType: 'Previous Year Questions',
    date: '2026-08-15',
    issueInfo: 'Complete Compendium',
    driveFileId: '1KTO8zOM5179WBEbNVI3onkecw3uLy6DN',
    url: 'https://drive.google.com/file/d/1KTO8zOM5179WBEbNVI3onkecw3uLy6DN/view',
    thumbnailUrl: 'https://drive.google.com/thumbnail?id=1KTO8zOM5179WBEbNVI3onkecw3uLy6DN&sz=w800',
    sizeBytes: 125829120, // 120 MB
    pages: 340,
    format: 'PDF',
    isFeatured: true,
    isPopular: true,
    popularRank: 1,
    downloadsCount: 3820,
    description: 'Year-wise solved prelims & mains papers with authentic answer keys and trend analysis.'
  },
  {
    title: 'Polity Handwritten Notes (Complete)',
    category: 'Polity',
    resourceType: 'Notes',
    date: '2026-08-20',
    issueInfo: 'Syllabus Master Notes',
    driveFileId: '1mQhq5ObXFC2Xuu55zHTGfa7iJZebiDCG',
    url: 'https://drive.google.com/file/d/1mQhq5ObXFC2Xuu55zHTGfa7iJZebiDCG/view',
    thumbnailUrl: 'https://drive.google.com/thumbnail?id=1mQhq5ObXFC2Xuu55zHTGfa7iJZebiDCG&sz=w800',
    sizeBytes: 8912896, // 8.5 MB
    pages: 180,
    format: 'PDF',
    isFeatured: true,
    isPopular: true,
    popularRank: 2,
    downloadsCount: 2950,
    description: 'Comprehensive handwritten classroom notes covering Indian Constitution, Judiciary, and Governance.'
  },
  {
    title: 'Economy Revision Notes',
    category: 'Economy',
    resourceType: 'Notes',
    date: '2026-08-25',
    issueInfo: 'Quick Revision Guide',
    driveFileId: '1x1SuM8hvV1zUyzZTcrv-2lyLEM1BiDcZ',
    url: 'https://drive.google.com/file/d/1x1SuM8hvV1zUyzZTcrv-2lyLEM1BiDcZ/view',
    thumbnailUrl: 'https://drive.google.com/thumbnail?id=1x1SuM8hvV1zUyzZTcrv-2lyLEM1BiDcZ&sz=w800',
    sizeBytes: 6501171, // 6.2 MB
    pages: 120,
    format: 'PDF',
    isFeatured: false,
    isPopular: true,
    popularRank: 3,
    downloadsCount: 2410,
    description: 'Macroeconomics concepts, monetary policy instruments, external trade, and Economic Survey summaries.'
  },
  {
    title: 'Daily Current Affairs 22 Sep 2026',
    category: 'Current Affairs',
    resourceType: 'Daily Content',
    date: '2026-09-22',
    issueInfo: '22 Sep 2026',
    driveFileId: '16WmSlxVMFoSZ3ctIPFPFDWGxuDWtBbOQ',
    url: 'https://drive.google.com/file/d/16WmSlxVMFoSZ3ctIPFPFDWGxuDWtBbOQ/view',
    thumbnailUrl: 'https://drive.google.com/thumbnail?id=16WmSlxVMFoSZ3ctIPFPFDWGxuDWtBbOQ&sz=w800',
    sizeBytes: 2202009, // 2.1 MB
    pages: 12,
    format: 'PDF',
    isFeatured: false,
    isPopular: false,
    downloadsCount: 310,
    description: 'Current affairs compilation for 22 September 2026.'
  },
  {
    title: 'Daily Current Affairs 21 Sep 2026',
    category: 'Current Affairs',
    resourceType: 'Daily Content',
    date: '2026-09-21',
    issueInfo: '21 Sep 2026',
    driveFileId: '1KTO8zOM5179WBEbNVI3onkecw3uLy6DN',
    url: 'https://drive.google.com/file/d/1KTO8zOM5179WBEbNVI3onkecw3uLy6DN/view',
    thumbnailUrl: 'https://drive.google.com/thumbnail?id=1KTO8zOM5179WBEbNVI3onkecw3uLy6DN&sz=w800',
    sizeBytes: 2411724, // 2.3 MB
    pages: 14,
    format: 'PDF',
    isFeatured: false,
    isPopular: false,
    downloadsCount: 295,
    description: 'Current affairs compilation for 21 September 2026.'
  },
  {
    title: 'Daily Current Affairs 20 Sep 2026',
    category: 'Current Affairs',
    resourceType: 'Daily Content',
    date: '2026-09-20',
    issueInfo: '20 Sep 2026',
    driveFileId: '1mQhq5ObXFC2Xuu55zHTGfa7iJZebiDCG',
    url: 'https://drive.google.com/file/d/1mQhq5ObXFC2Xuu55zHTGfa7iJZebiDCG/view',
    thumbnailUrl: 'https://drive.google.com/thumbnail?id=1mQhq5ObXFC2Xuu55zHTGfa7iJZebiDCG&sz=w800',
    sizeBytes: 2097152, // 2.0 MB
    pages: 11,
    format: 'PDF',
    isFeatured: false,
    isPopular: false,
    downloadsCount: 270,
    description: 'Current affairs compilation for 20 September 2026.'
  },
  {
    title: 'Daily Current Affairs 19 Sep 2026',
    category: 'Current Affairs',
    resourceType: 'Daily Content',
    date: '2026-09-19',
    issueInfo: '19 Sep 2026',
    driveFileId: '1x1SuM8hvV1zUyzZTcrv-2lyLEM1BiDcZ',
    url: 'https://drive.google.com/file/d/1x1SuM8hvV1zUyzZTcrv-2lyLEM1BiDcZ/view',
    thumbnailUrl: 'https://drive.google.com/thumbnail?id=1x1SuM8hvV1zUyzZTcrv-2lyLEM1BiDcZ&sz=w800',
    sizeBytes: 2306867, // 2.2 MB
    pages: 12,
    format: 'PDF',
    isFeatured: false,
    isPopular: false,
    downloadsCount: 285,
    description: 'Current affairs compilation for 19 September 2026.'
  },
  {
    title: 'Daily Current Affairs 18 Sep 2026',
    category: 'Current Affairs',
    resourceType: 'Daily Content',
    date: '2026-09-18',
    issueInfo: '18 Sep 2026',
    driveFileId: '16WmSlxVMFoSZ3ctIPFPFDWGxuDWtBbOQ',
    url: 'https://drive.google.com/file/d/16WmSlxVMFoSZ3ctIPFPFDWGxuDWtBbOQ/view',
    thumbnailUrl: 'https://drive.google.com/thumbnail?id=16WmSlxVMFoSZ3ctIPFPFDWGxuDWtBbOQ&sz=w800',
    sizeBytes: 1992294, // 1.9 MB
    pages: 10,
    format: 'PDF',
    isFeatured: false,
    isPopular: false,
    downloadsCount: 260,
    description: 'Current affairs compilation for 18 September 2026.'
  },
  {
    title: 'Daily Current Affairs 17 Sep 2026',
    category: 'Current Affairs',
    resourceType: 'Daily Content',
    date: '2026-09-17',
    issueInfo: '17 Sep 2026',
    driveFileId: '1KTO8zOM5179WBEbNVI3onkecw3uLy6DN',
    url: 'https://drive.google.com/file/d/1KTO8zOM5179WBEbNVI3onkecw3uLy6DN/view',
    thumbnailUrl: 'https://drive.google.com/thumbnail?id=1KTO8zOM5179WBEbNVI3onkecw3uLy6DN&sz=w800',
    sizeBytes: 2516582, // 2.4 MB
    pages: 13,
    format: 'PDF',
    isFeatured: false,
    isPopular: false,
    downloadsCount: 290,
    description: 'Current affairs compilation for 17 September 2026.'
  }
]

async function seed() {
  console.log('Seeding freeResourcesPage settings into nermai_settings/main...')
  await db.collection('nermai_settings').doc('main').set({
    freeResourcesPage: DEFAULT_SETTINGS
  }, { merge: true })
  console.log('  Settings successfully saved.')

  console.log(`Seeding ${RESOURCES.length} resources into "resources" collection...`)
  const batch = db.batch()
  const colRef = db.collection('resources')

  // Check if resources already exist
  const existing = await colRef.get()
  if (!existing.empty) {
    console.log(`  Found ${existing.size} existing resources, clearing old ones first...`)
    existing.forEach(doc => batch.delete(doc.ref))
    await batch.commit()
    console.log('  Cleared old resources.')
  }

  // Insert in batches
  for (const item of RESOURCES) {
    const docRef = colRef.doc()
    await docRef.set({
      ...item,
      createdAt: FieldValue.serverTimestamp()
    })
    console.log(`  Added: ${item.title} (${item.category} / ${item.resourceType})`)
  }

  console.log('\nAll free resources and word customization settings successfully seeded in Firestore!')
  process.exit(0)
}

seed().catch(err => {
  console.error('Seeding failed:', err)
  process.exit(1)
})
