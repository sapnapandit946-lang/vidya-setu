import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runV1V2SafetyVerification() {
  const BASE_URL = 'http://localhost:5000/api';
  console.log('================================================================');
  console.log('🛡️ RUNNING V1 / V2 SAFETY & IMMUTABILITY SUITE');
  console.log('================================================================');

  // Step 1: Create a lecture
  console.log('\n[1] Creating fresh test lecture: Modern Physics (Quantum Theory)...');
  const createRes = await fetch(`${BASE_URL}/lectures`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      courseId: 'PHYS101',
      title: 'Modern Physics - Quantum Mechanics',
      subject: 'Physics',
      description: 'Foundations of wave-particle duality and Schrödinger equation.',
    }),
  });
  const createData = await createRes.json();
  if (!createData.success) throw new Error(createData.message);
  const lectureId = createData.lecture.lectureId;
  console.log(`✓ Lecture created: ${lectureId}`);

  // Step 2: Publish V1
  console.log('\n[2] Publishing V1...');
  const v1Path = path.join(__dirname, 'qa-temp-v1.txt');
  fs.writeFileSync(v1Path, 'Original canonical V1 content for Quantum Mechanics lecture.');

  const v1Form = new FormData();
  const v1Blob = new Blob([fs.readFileSync(v1Path)], { type: 'text/plain' });
  v1Form.append('file', v1Blob, 'quantum-v1.txt');
  v1Form.append('versionNumber', 'V1');

  const v1Res = await fetch(`${BASE_URL}/lectures/${lectureId}/versions`, {
    method: 'POST',
    body: v1Form,
  });
  const v1Data = await v1Res.json();
  if (!v1Data.success) throw new Error(v1Data.message);
  const v1 = v1Data.version;

  console.log('✓ V1 Published:');
  console.log(`  V1 versionId: ${v1.versionId}`);
  console.log(`  V1 fileHash:  ${v1.fileHash}`);
  console.log(`  V1 isActive:  ${v1.isActive}`);
  console.log(`  V1 status:    ${v1.verificationStatus}`);

  // Step 3: Publish V2
  console.log('\n[3] Publishing V2 (Updating lecture)...');
  const v2Path = path.join(__dirname, 'qa-temp-v2.txt');
  fs.writeFileSync(v2Path, 'Updated V2 content with advanced wave function solutions and Heisenberg principle.');

  const v2Form = new FormData();
  const v2Blob = new Blob([fs.readFileSync(v2Path)], { type: 'text/plain' });
  v2Form.append('file', v2Blob, 'quantum-v2.txt');
  v2Form.append('versionNumber', 'V2');
  v2Form.append('title', 'Modern Physics - Quantum Wave Mechanics V2');
  v2Form.append('description', 'Updated with complete matrix mechanics and perturbation models.');

  const v2Res = await fetch(`${BASE_URL}/lectures/${lectureId}/versions`, {
    method: 'POST',
    body: v2Form,
  });
  const v2Data = await v2Res.json();
  if (!v2Data.success) throw new Error(v2Data.message);
  const v2 = v2Data.version;

  console.log('✓ V2 Published:');
  console.log(`  V2 versionId: ${v2.versionId}`);
  console.log(`  V2 fileHash:  ${v2.fileHash}`);
  console.log(`  V2 isActive:  ${v2.isActive}`);
  console.log(`  V2 status:    ${v2.verificationStatus}`);
  console.log(`  Current Version: ${v2Data.lecture.currentVersion}`);

  // Step 4: Strict V1/V2 Safety Assertions
  console.log('\n[4] Performing Strict Safety Assertions:');

  // Query all versions in DB
  const historyRes = await fetch(`${BASE_URL}/lectures/${lectureId}/versions`);
  const historyData = await historyRes.json();
  const versions = historyData.versions;

  const v1InDb = versions.find((v) => v.versionId === v1.versionId);
  const v2InDb = versions.find((v) => v.versionId === v2.versionId);

  // Assertion 1: Verify V1 versionId is unchanged
  if (!v1InDb || v1InDb.versionId !== v1.versionId) {
    throw new Error('FAIL: V1 versionId was modified or missing!');
  }
  console.log('✓ Assertion 1 PASS: V1 versionId is unchanged');

  // Assertion 2: Verify V1 fileHash is unchanged
  if (v1InDb.fileHash !== v1.fileHash) {
    throw new Error('FAIL: V1 fileHash was modified!');
  }
  console.log('✓ Assertion 2 PASS: V1 fileHash is completely unchanged');

  // Assertion 3: Verify V2 has a different versionId
  if (v2.versionId === v1.versionId) {
    throw new Error('FAIL: V2 reused V1 versionId!');
  }
  console.log(`✓ Assertion 3 PASS: V2 has unique versionId (${v2.versionId} != ${v1.versionId})`);

  // Assertion 4: Verify V2 has its own fileHash
  if (v2.fileHash === v1.fileHash) {
    throw new Error('FAIL: V2 reused V1 fileHash!');
  }
  console.log(`✓ Assertion 4 PASS: V2 has distinct fileHash (${v2.fileHash} != ${v1.fileHash})`);

  // Assertion 5: Verify V2 becomes current
  const latestRes = await fetch(`${BASE_URL}/lectures/${lectureId}/latest-version`);
  const latestData = await latestRes.json();
  if (latestData.currentVersion !== 'V2' || latestData.latestVersion?.versionId !== v2.versionId) {
    throw new Error('FAIL: V2 did not become current version!');
  }
  console.log('✓ Assertion 5 PASS: V2 is correctly marked current and active');

  // Assertion 6: Verify V1 remains in version history
  if (versions.length !== 2) {
    throw new Error(`FAIL: Expected 2 versions in history, got ${versions.length}`);
  }
  console.log('✓ Assertion 6 PASS: V1 remains intact in version history (total stored: 2)');

  // Assertion 7: Confirm no V1 + V2 content is mixed
  if (v1InDb.fileName === v2InDb.fileName) {
    throw new Error('FAIL: File names or content mixed between V1 and V2!');
  }
  console.log('✓ Assertion 7 PASS: No V1 and V2 content is mixed');

  // Cleanup temp files
  if (fs.existsSync(v1Path)) fs.unlinkSync(v1Path);
  if (fs.existsSync(v2Path)) fs.unlinkSync(v2Path);

  console.log('\n================================================================');
  console.log('🛡️ ALL 7 V1 / V2 SAFETY ASSERTIONS PASSED WITH ZERO VIOLATIONS! 🛡️');
  console.log('================================================================');
}

runV1V2SafetyVerification().catch((err) => {
  console.error('❌ V1/V2 Safety Verification Failed:', err);
  process.exit(1);
});
