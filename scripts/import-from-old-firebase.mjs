/**
 * import-from-old-firebase.mjs
 * Directly imports all Firestore data from old project (nermai-static)
 * into new project (nermaistatic).
 */
import { initializeApp as initClient } from 'firebase/app';
import { getFirestore as getClientFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { initializeApp as initAdmin, cert } from 'firebase-admin/app';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 1. Old project source (Client SDK)
const sourceApp = initClient({
  apiKey: 'AIzaSyCq4wMkyvTArGkUTA56p3yQWHLCYMkFcec',
  authDomain: 'nermai-static.firebaseapp.com',
  projectId: 'nermai-static',
}, 'source_client');
const sourceDb = getClientFirestore(sourceApp);

// 2. New project target (Admin SDK)
const targetKeyFile = path.resolve(__dirname, '../nermaistatic-firebase-adminsdk-fbsvc-40686bcf86.json');
const targetKey = JSON.parse(fs.readFileSync(targetKeyFile, 'utf8'));
const targetApp = initAdmin({ credential: cert(targetKey) }, 'target_admin');
const targetDb = getAdminFirestore(targetApp);

const COLLECTIONS = [
  'nermai_settings',
  'nermai_hero_slides',
  'nermai_notices',
  'nermai_toppers',
  'nermai_testimonials',
  'nermai_gallery',
  'nermai_course_content',
  'nermai_result_categories',
  'nermai_results',
];

import { Timestamp as AdminTimestamp } from 'firebase-admin/firestore';

function sanitizeForAdmin(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (typeof obj.toMillis === 'function') {
    return AdminTimestamp.fromMillis(obj.toMillis());
  }
  if (obj.seconds !== undefined && obj.nanoseconds !== undefined) {
    return new AdminTimestamp(obj.seconds, obj.nanoseconds);
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeForAdmin);
  }
  const clean = {};
  for (const [k, v] of Object.entries(obj)) {
    clean[k] = sanitizeForAdmin(v);
  }
  return clean;
}

async function migrate() {
  console.log('🚀 Starting import from nermai-static -> nermaistatic...\n');

  for (const colName of COLLECTIONS) {
    try {
      const snap = await getDocs(collection(sourceDb, colName));
      if (snap.empty) {
        console.log(`  ⚪ ${colName}: 0 documents (skipped)`);
        continue;
      }

      console.log(`  📦 ${colName}: found ${snap.size} documents, copying...`);
      const batch = targetDb.batch();

      snap.forEach((documentSnap) => {
        const docId = documentSnap.id;
        const data = sanitizeForAdmin(documentSnap.data());
        const targetRef = targetDb.collection(colName).doc(docId);
        batch.set(targetRef, data);
        console.log(`     -> [${docId}]`);
      });

      await batch.commit();
      console.log(`  ✅ ${colName}: Successfully migrated ${snap.size} documents\n`);
    } catch (err) {
      console.error(`  ❌ Error migrating ${colName}:`, err);
    }
  }

  console.log('🎉 Migration completed successfully!');
  process.exit(0);
}

migrate().catch(e => {
  console.error('Fatal error during migration:', e);
  process.exit(1);
});
