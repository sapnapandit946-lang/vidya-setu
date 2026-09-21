import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testV2Workflow() {
  const BASE_URL = 'http://localhost:5000/api';
  console.log('--- Starting Vidya Setu Part 2 (V2 Update) Verification Tests ---');

  // Step 1: Create a Lecture ("Quadratic Equations")
  console.log('\n[1] Creating Lecture: Quadratic Equations...');
  const createRes = await fetch(`${BASE_URL}/lectures`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      courseId: 'MATH101',
      title: 'Quadratic Equations',
      subject: 'Algebra',
      description: 'Understanding roots, factoring, and the quadratic formula.',
    }),
  });
  const createData = await createRes.json();
  if (!createData.success) throw new Error(createData.message);
  const lectureId = createData.lecture.lectureId;
  console.log(`✓ Lecture created with ID: ${lectureId}`);

  // Step 2: Publish V1 with sample-v1.txt
  console.log('\n[2] Publishing V1...');
  const v1FilePath = path.join(__dirname, 'temp-v1.txt');
  fs.writeFileSync(v1FilePath, 'Content of Lecture Quadratic Equations Version 1.0 (Initial Publish).');

  const v1Form = new FormData();
  const v1Blob = new Blob([fs.readFileSync(v1FilePath)], { type: 'text/plain' });
  v1Form.append('file', v1Blob, 'quadratic-equations-v1.txt');
  v1Form.append('versionNumber', 'V1');

  const v1Res = await fetch(`${BASE_URL}/lectures/${lectureId}/versions`, {
    method: 'POST',
    body: v1Form,
  });
  const v1Data = await v1Res.json();
  if (!v1Data.success) throw new Error(v1Data.message);

  const v1Record = v1Data.version;
  console.log('✓ V1 Published successfully:');
  console.log(`  V1 versionId: ${v1Record.versionId}`);
  console.log(`  V1 fileHash:  ${v1Record.fileHash}`);
  console.log(`  V1 isActive:  ${v1Record.isActive}`);
  console.log(`  V1 status:    ${v1Record.verificationStatus}`);
  console.log(`  Lecture currentVersion: ${v1Data.lecture.currentVersion}`);

  // Step 3: Publish V2 with new content (quadratic-equations-v2.txt)
  console.log('\n[3] Publishing V2 (Update Lecture)...');
  const v2FilePath = path.join(__dirname, 'temp-v2.txt');
  fs.writeFileSync(v2FilePath, 'Content of Lecture Quadratic Equations Version 2.0 (Updated with Advanced Discriminant Applications).');

  const v2Form = new FormData();
  const v2Blob = new Blob([fs.readFileSync(v2FilePath)], { type: 'text/plain' });
  v2Form.append('file', v2Blob, 'quadratic-equations-v2.txt');
  v2Form.append('versionNumber', 'V2');
  v2Form.append('title', 'Quadratic Equations & Complex Roots');
  v2Form.append('description', 'Updated syllabus covering standard discriminant and complex conjugates.');

  const v2Res = await fetch(`${BASE_URL}/lectures/${lectureId}/versions`, {
    method: 'POST',
    body: v2Form,
  });
  const v2Data = await v2Res.json();
  if (!v2Data.success) throw new Error(v2Data.message);

  const v2Record = v2Data.version;
  console.log('✓ V2 Published successfully:');
  console.log(`  V2 versionId: ${v2Record.versionId}`);
  console.log(`  V2 fileHash:  ${v2Record.fileHash}`);
  console.log(`  V2 isActive:  ${v2Record.isActive}`);
  console.log(`  V2 status:    ${v2Record.verificationStatus}`);
  console.log(`  Lecture currentVersion: ${v2Data.lecture.currentVersion}`);
  console.log(`  Lecture updated title:  ${v2Data.lecture.title}`);

  // Step 4: Verify Both Versions in Database
  console.log('\n[4] Verifying V1 & V2 separation and immutability...');
  const versionsRes = await fetch(`${BASE_URL}/lectures/${lectureId}/versions`);
  const versionsData = await versionsRes.json();
  const versions = versionsData.versions;

  console.log(`✓ Total versions retrieved: ${versions.length}`);

  const v1InDb = versions.find((v) => v.versionId === v1Record.versionId);
  const v2InDb = versions.find((v) => v.versionId === v2Record.versionId);

  // Assertions
  if (!v1InDb) throw new Error('Assertion failed: V1 record missing from database!');
  if (!v2InDb) throw new Error('Assertion failed: V2 record missing from database!');

  console.log('\n[5] Checking immutability of V1:');
  console.log(`  Original V1 hash: ${v1Record.fileHash}`);
  console.log(`  In-DB V1 hash:    ${v1InDb.fileHash}`);
  if (v1Record.fileHash !== v1InDb.fileHash) throw new Error('V1 fileHash was modified!');
  if (v1Record.fileName !== v1InDb.fileName) throw new Error('V1 fileName was modified!');
  if (v1InDb.isActive !== false) throw new Error('Expected V1 isActive to be false after V2 publish!');
  console.log('✓ V1 file and metadata are completely preserved!');

  console.log('\n[6] Checking separation of V2:');
  console.log(`  V1 versionId: ${v1Record.versionId}`);
  console.log(`  V2 versionId: ${v2Record.versionId}`);
  if (v1Record.versionId === v2Record.versionId) throw new Error('V1 and V2 have the same versionId!');
  if (v1Record.fileHash === v2Record.fileHash) throw new Error('V1 and V2 have identical fileHash!');
  if (v2InDb.isActive !== true) throw new Error('Expected V2 isActive to be true!');
  console.log('✓ V2 is a distinct version with unique ID and unique hash!');

  // Step 7: Check latest-version endpoint
  console.log('\n[7] Checking GET /api/lectures/:lectureId/latest-version:');
  const latestRes = await fetch(`${BASE_URL}/lectures/${lectureId}/latest-version`);
  const latestData = await latestRes.json();
  console.log(`  Latest Version Number: ${latestData.currentVersion}`);
  console.log(`  Latest versionId:     ${latestData.latestVersion?.versionId}`);
  if (latestData.currentVersion !== 'V2') throw new Error('Expected latest version to be V2!');
  if (latestData.latestVersion?.versionId !== v2Record.versionId) throw new Error('Expected latest versionId to match V2!');
  console.log('✓ latest-version API successfully returns V2 as current!');

  // Cleanup temp files
  if (fs.existsSync(v1FilePath)) fs.unlinkSync(v1FilePath);
  if (fs.existsSync(v2FilePath)) fs.unlinkSync(v2FilePath);

  console.log('\n======================================================');
  console.log('🎉 ALL PART 2 (V2 UPDATE) VERIFICATION TESTS PASSED! 🎉');
  console.log('======================================================');
}

testV2Workflow().catch((err) => {
  console.error('✗ Verification failed:', err);
  process.exit(1);
});
