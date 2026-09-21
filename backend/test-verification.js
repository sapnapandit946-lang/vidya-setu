import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTests() {
  const BASE_URL = 'http://localhost:5000/api';
  console.log('--- Starting Vidya Setu Part 1 Verification Tests ---');

  // Test 0: Health
  try {
    const healthRes = await fetch('http://localhost:5000/api/health');
    const health = await healthRes.json();
    console.log('✓ Health Check:', health);
  } catch (e) {
    console.error('✗ Health Check failed:', e.message);
    process.exit(1);
  }

  // Test 1: POST /api/lectures
  let lectureId;
  try {
    const createRes = await fetch(`${BASE_URL}/lectures`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        courseId: 'CS101',
        title: 'Introduction to Distributed Networks',
        subject: 'Computer Science',
        description: 'Foundations of p2p networking, consensus algorithms, and fault tolerance.',
      }),
    });
    const createData = await createRes.json();
    console.log('✓ POST /api/lectures result:', createData.success, 'ID:', createData.lecture?.lectureId);
    if (!createData.success) throw new Error(createData.message);
    lectureId = createData.lecture.lectureId;
  } catch (e) {
    console.error('✗ POST /api/lectures failed:', e);
    process.exit(1);
  }

  // Create temporary sample file
  const tempFilePath = path.join(__dirname, 'sample-lecture.txt');
  fs.writeFileSync(tempFilePath, 'Vidya Setu Sample Lecture Content for V1 Publishing Verification.');

  // Test 2: POST /api/lectures/:lectureId/versions
  let versionId;
  try {
    const form = new FormData();
    const fileBlob = new Blob([fs.readFileSync(tempFilePath)], { type: 'text/plain' });
    form.append('file', fileBlob, 'sample-lecture.txt');

    const versionRes = await fetch(`${BASE_URL}/lectures/${lectureId}/versions`, {
      method: 'POST',
      body: form,
    });
    const versionData = await versionRes.json();
    console.log('✓ POST /api/lectures/:lectureId/versions result:');
    console.log('  Success:', versionData.success);
    console.log('  versionId:', versionData.version?.versionId);
    console.log('  fileName:', versionData.version?.fileName);
    console.log('  fileSize:', versionData.version?.fileSize);
    console.log('  fileHash:', versionData.version?.fileHash);
    console.log('  verificationStatus:', versionData.version?.verificationStatus);
    console.log('  isActive:', versionData.version?.isActive);
    if (!versionData.success) throw new Error(versionData.message);
    versionId = versionData.version.versionId;
  } catch (e) {
    console.error('✗ POST /api/lectures/:lectureId/versions failed:', e);
    process.exit(1);
  }

  // Test 3: GET /api/lectures
  try {
    const listRes = await fetch(`${BASE_URL}/lectures`);
    const listData = await listRes.json();
    console.log('✓ GET /api/lectures count:', listData.count);
    const found = listData.lectures?.find(l => l.lectureId === lectureId);
    console.log('  Found created lecture:', !!found);
    console.log('  Version details present:', !!found?.versionDetails);
    console.log('  Current Version:', found?.currentVersion);
  } catch (e) {
    console.error('✗ GET /api/lectures failed:', e);
    process.exit(1);
  }

  // Test 4: GET /api/lectures/:lectureId/latest-version
  try {
    const latestRes = await fetch(`${BASE_URL}/lectures/${lectureId}/latest-version`);
    const latestData = await latestRes.json();
    console.log('✓ GET /api/lectures/:lectureId/latest-version result:');
    console.log('  lectureId:', latestData.lectureId);
    console.log('  currentVersion:', latestData.currentVersion);
    console.log('  latestVersion versionId:', latestData.latestVersion?.versionId);
    console.log('  verificationStatus:', latestData.latestVersion?.verificationStatus);
  } catch (e) {
    console.error('✗ GET /api/lectures/:lectureId/latest-version failed:', e);
    process.exit(1);
  }

  // Cleanup temp file
  if (fs.existsSync(tempFilePath)) {
    fs.unlinkSync(tempFilePath);
  }

  console.log('--- All Vidya Setu Backend Verification Tests Passed! ---');
}

runTests();
