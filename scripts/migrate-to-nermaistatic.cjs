/**
 * migrate-to-nermaistatic.cjs
 * Migrates all Nermai Firestore data from nermai-static → nermaistatic
 * Run: node scripts/migrate-to-nermaistatic.cjs
 */
const path = require("path")
const { initializeApp, cert } = require("firebase-admin/app")
const { getFirestore } = require("firebase-admin/firestore")

// ── Source (nermai-static) ──────────────────────────────────────────────────
const sourceKey = require(path.resolve(__dirname, "../nermai-static-firebase-adminsdk-fbsvc-abdaba28ad.json"))
const sourceApp = initializeApp(
  { credential: cert(sourceKey) },
  "source"
)
const sourceDb = getFirestore(sourceApp)

// ── Target (nermaistatic) ───────────────────────────────────────────────────
const targetKey = require(path.resolve(__dirname, "../nermaistatic-firebase-adminsdk-fbsvc-40686bcf86.json"))
const targetApp = initializeApp(
  { credential: cert(targetKey) },
  "target"
)
const targetDb = getFirestore(targetApp)

const COLLECTIONS = [
  "nermai_hero_slides",
  "nermai_notices",
  "nermai_toppers",
  "nermai_testimonials",
  "nermai_gallery",
  "nermai_course_content",
  "nermai_result_categories",
  "nermai_results",
]

async function migrateCollection(colName) {
  const snap = await sourceDb.collection(colName).get()
  if (snap.empty) {
    console.log(`  ⚠  ${colName}: empty — skipped`)
    return
  }
  const batch = targetDb.batch()
  snap.forEach((d) => {
    batch.set(targetDb.collection(colName).doc(d.id), d.data())
  })
  await batch.commit()
  console.log(`  ✓  ${colName}: ${snap.size} docs migrated`)
}

async function migrateSettings() {
  const snap = await sourceDb.collection("nermai_settings").doc("main").get()
  if (!snap.exists) {
    console.log("  ⚠  nermai_settings/main: not found — skipped")
    return
  }
  await targetDb.collection("nermai_settings").doc("main").set(snap.data())
  console.log("  ✓  nermai_settings/main: migrated")
}

async function main() {
  console.log("\n🚀 Migrating Nermai data: nermai-static → nermaistatic\n")
  await migrateSettings()
  for (const col of COLLECTIONS) {
    await migrateCollection(col)
  }
  console.log("\n✅ Migration complete!\n")
  process.exit(0)
}

main().catch((e) => {
  console.error("Migration failed:", e)
  process.exit(1)
})
