import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runCorrectionCapsuleVerification() {
  const BASE_URL = 'http://localhost:5000/api';
  console.log('================================================================');
  console.log('⚡ RUNNING CORRECTION CAPSULE (V1 -> V2) SUITE');
  console.log('================================================================');

  // Step 1: Create Lecture
  console.log('\n[1] Creating Lecture: Calculus - Fundamental Theorem...');
  const createRes = await fetch(`${BASE_URL}/lectures`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      courseId: 'MATH101',
      title: 'Calculus - Fundamental Theorem',
      subject: 'Mathematics',
      description: 'Definite integrals and the Fundamental Theorem of Calculus.',
    }),
  });
  const createData = await createRes.json();
  if (!createData.success) throw new Error(createData.message);
  const lectureId = createData.lecture.lectureId;
  console.log(`✓ Lecture created with ID: ${lectureId}`);

  // Step 2: Publish V1
  console.log('\n[2] Publishing V1...');
  const v1Path = path.join(__dirname, 'temp-cc-v1.txt');
  fs.writeFileSync(v1Path, 'Calculus Lecture V1 initial content with proof.');

  const v1Form = new FormData();
  const v1Blob = new Blob([fs.readFileSync(v1Path)], { type: 'text/plain' });
  v1Form.append('file', v1Blob, 'calculus-v1.txt');
  v1Form.append('versionNumber', 'V1');

  const v1Res = await fetch(`${BASE_URL}/lectures/${lectureId}/versions`, {
    method: 'POST',
    body: v1Form,
  });
  const v1Data = await v1Res.json();
  if (!v1Data.success) throw new Error(v1Data.message);
  console.log('✓ V1 Published:', v1Data.version.versionId);

  // Step 3: Publish V2 with Correction Capsule
  console.log('\n[3] Publishing V2 with Correction Capsule...');
  const v2Path = path.join(__dirname, 'temp-cc-v2.txt');
  fs.writeFileSync(v2Path, 'Calculus Lecture V2 with corrected sign in anti-derivative evaluation.');

  const v2Form = new FormData();
  const v2Blob = new Blob([fs.readFileSync(v2Path)], { type: 'text/plain' });
  v2Form.append('file', v2Blob, 'calculus-v2.txt');
  v2Form.append('versionNumber', 'V2');
  v2Form.append('title', 'Calculus - Fundamental Theorem (Corrected)');
  v2Form.append('description', 'Updated with corrected integration boundaries.');
  v2Form.append('correctionNote', 'Corrected sign error in FTC Part 2 evaluation');
  v2Form.append('correctionTimestamp', '05:30');
  v2Form.append('correctionSummary', 'Fixed negative boundary transposition at 05:30');
  v2Form.append('previousVersion', 'V1');

  const v2Res = await fetch(`${BASE_URL}/lectures/${lectureId}/versions`, {
    method: 'POST',
    body: v2Form,
  });
  const v2Data = await v2Res.json();
  if (!v2Data.success) throw new Error(v2Data.message);
  console.log('✓ V2 Published with Correction Capsule:');
  console.log(`  V2 versionId: ${v2Data.version.versionId}`);
  console.log(`  Correction note: "${v2Data.version.correctionDetails?.note}"`);
  console.log(`  Correction timestamp: "${v2Data.version.correctionDetails?.timestamp}"`);

  // Step 4: Verification of Correction Capsule Integrity
  console.log('\n[4] Asserting Correction Capsule Properties:');
  if (!v2Data.version.correctionDetails?.hasCorrection) {
    throw new Error('FAIL: hasCorrection should be true on V2');
  }
  if (v2Data.version.correctionDetails?.note !== 'Corrected sign error in FTC Part 2 evaluation') {
    throw new Error('FAIL: correction note mismatch');
  }
  if (v2Data.version.correctionDetails?.timestamp !== '05:30') {
    throw new Error('FAIL: correction timestamp mismatch');
  }
  if (v2Data.version.correctionDetails?.previousVersion !== 'V1') {
    throw new Error('FAIL: previousVersion must be V1');
  }
  console.log('✓ Assertion 1 PASS: Correction capsule fields stored accurately in V2');

  // Verify GET /api/lectures returns enriched version with correctionDetails
  const allLecturesRes = await fetch(`${BASE_URL}/lectures`);
  const allLecturesData = await allLecturesRes.json();
  const savedLec = allLecturesData.lectures.find(l => l.lectureId === lectureId);
  if (!savedLec || savedLec.currentVersion !== 'V2') {
    throw new Error('FAIL: Lecture not found or currentVersion not V2');
  }
  if (!savedLec.versionDetails?.correctionDetails?.hasCorrection) {
    throw new Error('FAIL: versionDetails.correctionDetails missing on GET /api/lectures');
  }
  console.log('✓ Assertion 2 PASS: GET /api/lectures provides correctionDetails to Student flow');

  // Cleanup
  if (fs.existsSync(v1Path)) fs.unlinkSync(v1Path);
  if (fs.existsSync(v2Path)) fs.unlinkSync(v2Path);

  console.log('\n================================================================');
  console.log('🏆 ALL CORRECTION CAPSULE VERIFICATION TESTS PASSED! 🏆');
  console.log('================================================================');
}

runCorrectionCapsuleVerification().catch((err) => {
  console.error('✗ Correction Capsule test failed:', err);
  process.exit(1);
});
