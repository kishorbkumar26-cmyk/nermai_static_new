/**
 * sync-google-reviews.cjs
 * ─────────────────────────────────────────────────────────────────────────────
 * Fetches Nermai IAS Academy's Google Reviews via the Places API (New),
 * filters for 4-star and 5-star reviews, and saves them to Firestore.
 *
 * HOW TO RUN:
 *   node scripts/sync-google-reviews.cjs
 *
 * PREREQUISITES:
 *   1. Add to your .env file:
 *        GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
 *        GOOGLE_PLACE_ID=your_nermai_place_id_here
 *
 *   2. Your Google Maps API key must have "Places API (New)" enabled.
 *      Enable at: https://console.cloud.google.com/apis/library/places.googleapis.com
 *
 *   3. How to find your Place ID:
 *      → Go to https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder
 *      → Search "Nermai IAS Academy Puducherry"
 *      → Copy the Place ID (starts with ChIJ...)
 *
 * SECURITY NOTE:
 *   This script runs locally on YOUR machine only. The API key never goes into
 *   the browser. After running, Firestore serves the reviews to the frontend.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const path = require('path')
const fs   = require('fs')

// ── Load .env manually (no dotenv dependency needed) ─────────────────────────
const envPath = path.resolve(__dirname, '../.env')
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed.slice(eqIdx + 1).trim()
    if (!process.env[key]) process.env[key] = val
  }
}

// ── Config ────────────────────────────────────────────────────────────────────
const GOOGLE_API_KEY  = process.env.GOOGLE_MAPS_API_KEY
const PLACE_ID        = process.env.GOOGLE_PLACE_ID
const MIN_STAR_RATING = 4   // Only save reviews with >= 4 stars
const ADMIN_KEY_FILE  = path.resolve(__dirname, '../nermaistatic-firebase-adminsdk-fbsvc-40686bcf86.json')
const COLLECTION_NAME = 'nermai_testimonials'

// ── Validate config ───────────────────────────────────────────────────────────
if (!GOOGLE_API_KEY || GOOGLE_API_KEY === 'your_google_maps_api_key_here') {
  console.error('\n  GOOGLE_MAPS_API_KEY is missing in your .env file.')
  console.error('    Add: GOOGLE_MAPS_API_KEY=your_key_here\n')
  process.exit(1)
}

if (!PLACE_ID || PLACE_ID === 'your_nermai_place_id_here') {
  console.error('\n  GOOGLE_PLACE_ID is missing in your .env file.')
  console.error('    Find your Place ID at:')
  console.error('    https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder')
  console.error('    Search: "Nermai IAS Academy Puducherry"\n')
  process.exit(1)
}

if (!fs.existsSync(ADMIN_KEY_FILE)) {
  console.error('\n  Firebase Admin SDK key file not found:')
  console.error('   ', ADMIN_KEY_FILE)
  process.exit(1)
}

// ── Firebase Admin Setup ──────────────────────────────────────────────────────
const admin = require('firebase-admin')
const serviceAccount = require(ADMIN_KEY_FILE)

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  })
}

const db = admin.firestore()

// ── Fetch Google Reviews via Places API (New) ─────────────────────────────────
async function fetchGoogleReviews() {
  const url = `https://places.googleapis.com/v1/places/${PLACE_ID}`
  const params = new URLSearchParams({ languageCode: 'en' })

  console.log('\n  Fetching reviews from Google Places API...')
  console.log(`    Place ID: ${PLACE_ID}`)

  const response = await fetch(`${url}?${params}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_API_KEY,
      'X-Goog-FieldMask': 'id,displayName,rating,userRatingCount,reviews'
    }
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Google Places API error ${response.status}: ${errorBody}`)
  }

  const data = await response.json()
  return data
}

// ── Map a Google review to Firestore testimonial document ─────────────────────
function mapReview(review) {
  const authorName  = review.authorAttribution?.displayName || 'Google Reviewer'
  const photoUri    = review.authorAttribution?.photoUri    || null
  const rating      = review.rating                         || 5
  const text        = review.text?.text                     || ''
  const publishTime = review.publishTime                    || new Date().toISOString()

  return {
    name:            authorName,
    role:            'Google Review',
    quote:           text,
    rating:          rating,
    profilePhotoUrl: photoUri,
    source:          'google',
    googlePlaceId:   PLACE_ID,
    publishedAt:     publishTime,
    createdAt:       admin.firestore.FieldValue.serverTimestamp()
  }
}

// ── Clear existing Google-sourced testimonials ────────────────────────────────
async function clearGoogleReviews() {
  const snap = await db.collection(COLLECTION_NAME)
    .where('source', '==', 'google')
    .get()

  if (snap.empty) {
    console.log('    No existing Google reviews to clear.')
    return
  }

  const batch = db.batch()
  snap.docs.forEach(d => batch.delete(d.ref))
  await batch.commit()
  console.log(`    Cleared ${snap.docs.length} existing Google review(s).`)
}

// ── Save reviews to Firestore ─────────────────────────────────────────────────
async function saveReviews(reviews) {
  if (reviews.length === 0) {
    console.log('\n  No qualifying reviews to save (all below 4 stars or no text).')
    return
  }

  const batch = db.batch()
  for (const review of reviews) {
    const ref = db.collection(COLLECTION_NAME).doc()
    batch.set(ref, review)
  }
  await batch.commit()
  console.log(`\n  Saved ${reviews.length} review(s) to Firestore -> "${COLLECTION_NAME}"`)
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('===============================================================')
  console.log('  Nermai IAS Academy -- Google Reviews to Firestore Sync')
  console.log('===============================================================')

  try {
    // 1. Fetch from Google
    const placeData = await fetchGoogleReviews()

    const businessName  = placeData.displayName?.text || 'Nermai IAS Academy'
    const overallRating = placeData.rating             || 'N/A'
    const totalRatings  = placeData.userRatingCount    || 0
    const allReviews    = placeData.reviews            || []

    console.log(`\n  Business: ${businessName}`)
    console.log(`  Overall Rating: ${overallRating}/5 (${totalRatings} reviews on Google)`)
    console.log(`  Google returned ${allReviews.length} review(s) this fetch`)

    // 2. Filter >= MIN_STAR_RATING and must have text
    const qualifyingReviews = allReviews.filter(r =>
      (r.rating || 0) >= MIN_STAR_RATING && (r.text?.text || '').trim().length > 10
    )

    console.log(`\n  Filtered to ${qualifyingReviews.length} review(s) with >=${MIN_STAR_RATING} stars and text`)

    if (qualifyingReviews.length === 0) {
      console.log('\n  No reviews passed the filter. Nothing will be saved.')
      console.log('    Tip: Google may not have returned enough reviews for this Place ID.')
      console.log('    Double-check your GOOGLE_PLACE_ID in .env\n')
      process.exit(0)
    }

    // 3. Preview what will be saved
    console.log('\n  Reviews to be saved:')
    qualifyingReviews.forEach((r, i) => {
      const author  = r.authorAttribution?.displayName || 'Unknown'
      const rating  = r.rating
      const preview = (r.text?.text || '').slice(0, 80)
      console.log(`    ${i + 1}. [${rating} stars] ${author}: "${preview}..."`)
    })

    // 4. Clear old Google reviews from Firestore
    console.log('\n  Clearing old Google reviews from Firestore...')
    await clearGoogleReviews()

    // 5. Map and save
    const mapped = qualifyingReviews.map(r => mapReview(r))
    await saveReviews(mapped)

    console.log('\n  Done! Your home page will now show these Google reviews.')
    console.log('    Run this script again anytime to refresh the reviews.\n')

  } catch (err) {
    console.error('\n  Error:', err.message)
    if (err.message.includes('INVALID_ARGUMENT') || err.message.includes('400')) {
      console.error('\n    -> Your Place ID may be incorrect.')
      console.error('      Find it at: https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder')
    }
    if (err.message.includes('REQUEST_DENIED') || err.message.includes('403')) {
      console.error('\n    -> Your API key may not have "Places API (New)" enabled.')
      console.error('      Enable at: https://console.cloud.google.com/apis/library/places.googleapis.com')
    }
    process.exit(1)
  }
}

main()
