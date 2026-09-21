import { getQuizForLecture } from './src/data/curriculumData.js';

console.log('================================================================');
console.log('🧪 TESTING LECTURE-SPECIFIC QUIZ CONTENT INTEGRATION');
console.log('================================================================');

// Case 1: "Solving Quadratic Equations"
const quadLecture = {
  lectureId: 'lec_math10_quad_01',
  title: 'Solving Quadratic Equations',
  subject: 'Algebra',
  courseId: 'class_10_math',
  courseName: 'Class 10 Mathematics',
};
const quadQuiz = getQuizForLecture(quadLecture);

console.log('\n[1] Testing Quadratic Equations Quiz:');
console.log('Quiz ID:', quadQuiz.quizId);
console.log('Lecture ID:', quadQuiz.lectureId);
console.log('Questions count:', quadQuiz.questions.length);
console.log('Sample Q1 text:', quadQuiz.questions[0].text);

if (quadQuiz.lectureId !== quadLecture.lectureId) {
  throw new Error('Lecture ID mismatch for quadratic equations quiz');
}
if (!quadQuiz.questions[0].text.toLowerCase().includes('x²') && !quadQuiz.questions[0].text.toLowerCase().includes('roots') && !quadQuiz.questions[0].text.toLowerCase().includes('quadratic')) {
  throw new Error('Quiz questions are not about quadratic equations');
}
console.log('✓ Quadratic Equations quiz is lecture-specific and appropriate!');

// Case 2: "Introduction to Distributed Networks"
const distLecture = {
  lectureId: 'lec_cs_dist_01',
  title: 'Introduction to Distributed Networks',
  subject: 'Computer Science',
  courseId: 'computer_science',
  courseName: 'Computer Science & Networks',
};
const distQuiz = getQuizForLecture(distLecture);

console.log('\n[2] Testing Distributed Networks Quiz:');
console.log('Quiz ID:', distQuiz.quizId);
console.log('Lecture ID:', distQuiz.lectureId);
console.log('Questions count:', distQuiz.questions.length);
console.log('Sample Q1 text:', distQuiz.questions[0].text);

if (distQuiz.lectureId !== distLecture.lectureId) {
  throw new Error('Lecture ID mismatch for distributed networks quiz');
}
if (!distQuiz.questions[0].text.toLowerCase().includes('cap theorem') && !distQuiz.questions[0].text.toLowerCase().includes('distributed') && !distQuiz.questions[0].text.toLowerCase().includes('network')) {
  throw new Error('Quiz questions are not about distributed networks');
}
if (distQuiz.questions[0].text === quadQuiz.questions[0].text) {
  throw new Error('Distributed Networks quiz displayed identical questions to Quadratic Equations!');
}
console.log('✓ Distributed Networks quiz is distinct, lecture-specific and appropriate!');

// Case 3: "Calculus - Fundamental Theorem"
const calcLecture = {
  lectureId: 'lec_calc_ftc_01',
  title: 'Calculus - Fundamental Theorem',
  subject: 'Mathematics',
  courseId: 'MATH101',
};
const calcQuiz = getQuizForLecture(calcLecture);

console.log('\n[3] Testing Calculus Quiz:');
console.log('Quiz ID:', calcQuiz.quizId);
console.log('Sample Q1 text:', calcQuiz.questions[0].text);
if (!calcQuiz.questions[0].text.toLowerCase().includes('fundamental theorem') && !calcQuiz.questions[0].text.toLowerCase().includes('calculus') && !calcQuiz.questions[0].text.toLowerCase().includes('integral')) {
  throw new Error('Calculus quiz questions not about calculus');
}
if (calcQuiz.questions[0].text === quadQuiz.questions[0].text || calcQuiz.questions[0].text === distQuiz.questions[0].text) {
  throw new Error('Calculus quiz is duplicate!');
}
console.log('✓ Calculus quiz is distinct and topic-specific!');

// Case 4: "Modern Physics - Quantum Mechanics"
const physLecture = {
  lectureId: 'lec_phys_qm_01',
  title: 'Modern Physics - Quantum Mechanics',
  subject: 'Physics',
  courseId: 'PHYS101',
};
const physQuiz = getQuizForLecture(physLecture);

console.log('\n[4] Testing Physics / Quantum Mechanics Quiz:');
console.log('Quiz ID:', physQuiz.quizId);
console.log('Sample Q1 text:', physQuiz.questions[0].text);
if (!physQuiz.questions[0].text.toLowerCase().includes('heisenberg') && !physQuiz.questions[0].text.toLowerCase().includes('uncertainty') && !physQuiz.questions[0].text.toLowerCase().includes('schrödinger')) {
  throw new Error('Quantum mechanics quiz questions not about quantum mechanics');
}
if (physQuiz.questions[0].text === quadQuiz.questions[0].text || physQuiz.questions[0].text === distQuiz.questions[0].text || physQuiz.questions[0].text === calcQuiz.questions[0].text) {
  throw new Error('Physics quiz is duplicate!');
}
console.log('✓ Physics quiz is distinct and topic-specific!');

// Case 5: Custom lecture with explicit quiz object
const customLecture = {
  lectureId: 'lec_custom_bio_01',
  title: 'Cellular Respiration and ATP Synthesis',
  subject: 'Biology',
  courseId: 'BIO101',
  quiz: {
    quizId: 'quiz_custom_bio_01',
    title: 'Cellular Respiration Quiz',
    questions: [
      {
        questionId: 'bio_q1',
        text: 'Where does the Krebs cycle occur inside eukaryotic cells?',
        options: [
          { key: 'A', text: 'Mitochondrial matrix' },
          { key: 'B', text: 'Cytoplasm' },
          { key: 'C', text: 'Nucleolus' },
          { key: 'D', text: 'Endoplasmic reticulum' },
        ],
        correctAnswer: 'A',
        solution: 'The Krebs cycle takes place within the inner mitochondrial matrix.',
      },
    ],
  },
};
const customQuiz = getQuizForLecture(customLecture);

console.log('\n[5] Testing Custom Lecture with Explicit Quiz:');
console.log('Quiz ID:', customQuiz.quizId);
console.log('Sample Q1 text:', customQuiz.questions[0].text);
if (customQuiz.questions[0].text !== 'Where does the Krebs cycle occur inside eukaryotic cells?') {
  throw new Error('Explicit quiz questions were not preserved');
}
console.log('✓ Custom attached quiz preserved accurately!');

console.log('\n================================================================');
console.log('🏆 ALL LECTURE-SPECIFIC QUIZ CONTENT TESTS PASSED! 🏆');
console.log('================================================================');
