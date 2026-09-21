import 'fake-indexeddb/auto';
import {
  saveQuizAttempt,
  getQuizAttempt,
  getAllPendingAttempts,
  getPendingSyncCount,
} from './src/utils/indexedDB.js';

async function testIndexedDBOfflineQuiz() {
  console.log('--- Starting Part 3: Offline Quiz IndexedDB Tests ---');

  // Test 1: Save Answer
  console.log('\n[1] Testing Answer Selection & Offline Saving:');
  const quizId = 'quiz_quadratic_equations';
  const questionId = 'q1';
  const selectedAnswer = 'B'; // "2 and 3"

  const savedRecord = await saveQuizAttempt({
    quizId,
    questionId,
    selectedAnswer,
  });

  console.log('✓ Saved attempt:', savedRecord);
  if (savedRecord.quizId !== quizId) throw new Error('quizId mismatch');
  if (savedRecord.questionId !== questionId) throw new Error('questionId mismatch');
  if (savedRecord.selectedAnswer !== 'B') throw new Error('selectedAnswer mismatch');
  if (savedRecord.status !== 'pending') throw new Error('status is not pending');
  if (!savedRecord.createdAt || !savedRecord.updatedAt) throw new Error('timestamps missing');

  // Test 2: Retrieve Answer (Persisted State / Page Reload simulation)
  console.log('\n[2] Testing Retrieval (Simulating Page Reload):');
  const retrievedRecord = await getQuizAttempt(quizId, questionId);
  console.log('✓ Retrieved attempt:', retrievedRecord);
  if (!retrievedRecord) throw new Error('Could not retrieve saved attempt');
  if (retrievedRecord.selectedAnswer !== 'B') throw new Error('Retrieved answer mismatch');
  if (retrievedRecord.status !== 'pending') throw new Error('Retrieved status is not pending');

  // Test 3: Pending Sync Count
  console.log('\n[3] Testing Pending Sync Count:');
  const count = await getPendingSyncCount();
  console.log(`✓ Pending sync count: ${count}`);
  if (count !== 1) throw new Error(`Expected count 1, got ${count}`);

  // Test 4: Update answer to Option C ("3 and 4")
  console.log('\n[4] Testing Answer Update:');
  const updatedRecord = await saveQuizAttempt({
    quizId,
    questionId,
    selectedAnswer: 'C',
  });
  console.log('✓ Updated attempt:', updatedRecord);
  if (updatedRecord.selectedAnswer !== 'C') throw new Error('Updated answer mismatch');
  if (updatedRecord.createdAt !== savedRecord.createdAt) {
    throw new Error('createdAt should be preserved on answer update');
  }

  // Count should still be 1 because it is the same attempt record
  const countAfterUpdate = await getPendingSyncCount();
  console.log(`✓ Pending sync count after update: ${countAfterUpdate}`);
  if (countAfterUpdate !== 1) throw new Error(`Expected count 1, got ${countAfterUpdate}`);

  // Test 5: Second question answer
  console.log('\n[5] Testing Multi-question Pending Count:');
  await saveQuizAttempt({
    quizId,
    questionId: 'q2',
    selectedAnswer: 'A',
  });
  const countTwo = await getPendingSyncCount();
  console.log(`✓ Pending sync count with 2 questions: ${countTwo}`);
  if (countTwo !== 2) throw new Error(`Expected count 2, got ${countTwo}`);

  console.log('\n======================================================');
  console.log('🎉 ALL PART 3 (OFFLINE QUIZ) TESTS PASSED! 🎉');
  console.log('======================================================');
}

testIndexedDBOfflineQuiz().catch((err) => {
  console.error('✗ Test failed:', err);
  process.exit(1);
});
