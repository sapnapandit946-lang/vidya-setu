/**
 * Curriculum Data for Vidya Setu
 * Implements Course -> Subject -> Lectures -> Individual Lecture Quiz
 */

export const CURRICULUM_DATA = [
  {
    courseId: 'class_10_math',
    courseName: 'Class 10 Mathematics',
    description: 'Core secondary mathematics curriculum aligned with NCERT & state boards.',
    icon: 'Calculator',
    subjects: [
      {
        subjectId: 'quadratic_equations',
        subjectName: 'Quadratic Equations',
        description: 'Standard quadratic forms, factorization, completing squares & discriminant.',
        lectures: [
          {
            lectureId: 'lec_math10_quad_01',
            title: 'Solving Quadratic Equations',
            description: 'Methods of finding roots: factorization, quadratic formula and roots nature.',
            duration: '45 mins',
            version: 'V1',
            quiz: {
              quizId: 'quiz_lec_math10_quad_01',
              title: 'Practice Quiz',
              questions: [
                {
                  questionId: 'q1',
                  questionNumber: 1,
                  text: 'If x² - 5x + 6 = 0, what are the roots?',
                  options: [
                    { key: 'A', text: '1 and 6' },
                    { key: 'B', text: '2 and 3' },
                    { key: 'C', text: '3 and 4' },
                    { key: 'D', text: '2 and 4' },
                  ],
                  correctAnswer: 'B',
                  solution: '(x - 2)(x - 3) = 0\nTherefore x = 2 or x = 3.',
                },
                {
                  questionId: 'q2',
                  questionNumber: 2,
                  text: 'What is the discriminant of the quadratic equation 2x² - 4x + 2 = 0?',
                  options: [
                    { key: 'A', text: '0' },
                    { key: 'B', text: '4' },
                    { key: 'C', text: '-8' },
                    { key: 'D', text: '16' },
                  ],
                  correctAnswer: 'A',
                  solution: 'Discriminant D = b² - 4ac = (-4)² - 4(2)(2) = 16 - 16 = 0.',
                },
                {
                  questionId: 'q3',
                  questionNumber: 3,
                  text: 'If the discriminant D > 0 and is a perfect square, the roots are:',
                  options: [
                    { key: 'A', text: 'Real, unequal and rational' },
                    { key: 'B', text: 'Real and equal' },
                    { key: 'C', text: 'Complex and imaginary' },
                    { key: 'D', text: 'Real, unequal and irrational' },
                  ],
                  correctAnswer: 'A',
                  solution: 'When D > 0 and a perfect square with rational coefficients, roots are real, distinct and rational.',
                },
                {
                  questionId: 'q4',
                  questionNumber: 4,
                  text: 'The sum of the roots of 3x² + 9x - 12 = 0 is:',
                  options: [
                    { key: 'A', text: '3' },
                    { key: 'B', text: '-3' },
                    { key: 'C', text: '-4' },
                    { key: 'D', text: '9' },
                  ],
                  correctAnswer: 'B',
                  solution: 'Sum of roots = -b / a = -9 / 3 = -3.',
                },
                {
                  questionId: 'q5',
                  questionNumber: 5,
                  text: 'If one root of kx² - 14x + 8 = 0 is 2, what is the value of k?',
                  options: [
                    { key: 'A', text: '3' },
                    { key: 'B', text: '5' },
                    { key: 'C', text: '7' },
                    { key: 'D', text: '9' },
                  ],
                  correctAnswer: 'B',
                  solution: 'Substitute x = 2: k(2)² - 14(2) + 8 = 0 => 4k - 28 + 8 = 0 => 4k = 20 => k = 5.',
                },
              ],
            },
          },
          {
            lectureId: 'lec_math10_quad_02',
            title: 'Nature of Roots & Discriminant Analysis',
            description: 'Analyzing real, equal, and non-real roots using the discriminant formula.',
            duration: '38 mins',
            version: 'V1',
            quiz: {
              quizId: 'quiz_lec_math10_quad_02',
              title: 'Practice Quiz',
              questions: [
                {
                  questionId: 'q1',
                  questionNumber: 1,
                  text: 'For what value of k does 2x² + kx + 3 = 0 have equal roots?',
                  options: [
                    { key: 'A', text: '±√24' },
                    { key: 'B', text: '±2√6' },
                    { key: 'C', text: '±6' },
                    { key: 'D', text: 'Both A and B' },
                  ],
                  correctAnswer: 'D',
                  solution: 'For equal roots, D = k² - 4(2)(3) = 0 => k² = 24 => k = ±√24 = ±2√6.',
                },
                {
                  questionId: 'q2',
                  questionNumber: 2,
                  text: 'If b² - 4ac < 0, then the quadratic equation has:',
                  options: [
                    { key: 'A', text: 'No real roots' },
                    { key: 'B', text: 'Two equal real roots' },
                    { key: 'C', text: 'Two distinct real roots' },
                    { key: 'D', text: 'Infinite roots' },
                  ],
                  correctAnswer: 'A',
                  solution: 'When D < 0, the roots are imaginary / non-real complex numbers.',
                },
              ],
            },
          },
        ],
      },
      {
        subjectId: 'arithmetic_progressions',
        subjectName: 'Arithmetic Progressions',
        description: 'Terms of an AP, nth term formula, and sum of first n terms.',
        lectures: [
          {
            lectureId: 'lec_math10_ap_01',
            title: 'Introduction to AP & Common Difference',
            description: 'Defining sequences, common difference, and finding general terms.',
            duration: '40 mins',
            version: 'V1',
            quiz: {
              quizId: 'quiz_lec_math10_ap_01',
              title: 'Practice Quiz',
              questions: [
                {
                  questionId: 'q1',
                  questionNumber: 1,
                  text: 'What is the 10th term of the AP: 2, 7, 12, ...?',
                  options: [
                    { key: 'A', text: '45' },
                    { key: 'B', text: '47' },
                    { key: 'C', text: '50' },
                    { key: 'D', text: '52' },
                  ],
                  correctAnswer: 'B',
                  solution: 'a = 2, d = 5. a_10 = a + (10 - 1)d = 2 + 9(5) = 47.',
                },
              ],
            },
          },
        ],
      },
    ],
  },
  {
    courseId: 'computer_science',
    courseName: 'Computer Science & Networks',
    description: 'Fundamental computer systems, networking protocols, and cloud computing.',
    icon: 'Cpu',
    subjects: [
      {
        subjectId: 'distributed_systems',
        subjectName: 'Distributed Systems',
        description: 'Consensus protocols, CAP theorem, replication, and peer-to-peer architectures.',
        lectures: [
          {
            lectureId: 'lec_cs_dist_01',
            title: 'Introduction to Distributed Networks',
            description: 'Core concepts of peer-to-peer distribution, partition tolerance, and consensus.',
            duration: '50 mins',
            version: 'V1',
            quiz: {
              quizId: 'quiz_lec_cs_dist_01',
              title: 'Practice Quiz',
              questions: [
                {
                  questionId: 'q1',
                  questionNumber: 1,
                  text: 'According to the CAP theorem, in the presence of a network partition, a distributed system must choose between:',
                  options: [
                    { key: 'A', text: 'Consistency and Availability' },
                    { key: 'B', text: 'Latency and Throughput' },
                    { key: 'C', text: 'Durability and Speed' },
                    { key: 'D', text: 'Security and Privacy' },
                  ],
                  correctAnswer: 'A',
                  solution: 'CAP theorem proves that when network partitions (P) occur, a system must trade off between Consistency (C) and Availability (A).',
                },
              ],
            },
          },
        ],
      },
    ],
  },
];

/**
 * Returns the quiz for a given lectureId, supporting both preset curriculum
 * and dynamically matching teacher-published lectures.
 */
export const getQuizForLecture = (lecture) => {
  if (!lecture) return null;

  // 1. Search in curriculum data
  for (const course of CURRICULUM_DATA) {
    for (const subject of course.subjects) {
      for (const lec of subject.lectures) {
        if (lec.lectureId === lecture.lectureId) {
          return {
            ...lec.quiz,
            courseName: course.courseName,
            subjectName: subject.subjectName,
            lectureTitle: lec.title,
            lectureId: lec.lectureId,
          };
        }
      }
    }
  }

  // 2. If the lecture is from Part 1 / Part 2 teacher publish, associate standard practice questions
  return {
    quizId: `quiz_${lecture.lectureId}`,
    title: 'Practice Quiz',
    courseName: lecture.courseId || 'Master Course',
    subjectName: lecture.subject || 'Lecture Module',
    lectureTitle: lecture.title,
    lectureId: lecture.lectureId,
    questions: [
      {
        questionId: 'q1',
        questionNumber: 1,
        text: 'If x² - 5x + 6 = 0, what are the roots?',
        options: [
          { key: 'A', text: '1 and 6' },
          { key: 'B', text: '2 and 3' },
          { key: 'C', text: '3 and 4' },
          { key: 'D', text: '2 and 4' },
        ],
        correctAnswer: 'B',
        solution: '(x - 2)(x - 3) = 0\nTherefore x = 2 or x = 3.',
      },
      {
        questionId: 'q2',
        questionNumber: 2,
        text: 'What is the discriminant of 2x² - 4x + 2 = 0?',
        options: [
          { key: 'A', text: '0' },
          { key: 'B', text: '4' },
          { key: 'C', text: '-8' },
          { key: 'D', text: '16' },
        ],
        correctAnswer: 'A',
        solution: 'Discriminant D = b² - 4ac = (-4)² - 4(2)(2) = 16 - 16 = 0.',
      },
      {
        questionId: 'q3',
        questionNumber: 3,
        text: 'Which principle guarantees that this lecture content remains verifiable offline?',
        options: [
          { key: 'A', text: 'SHA-256 cryptographic hashing' },
          { key: 'B', text: 'Random session IDs' },
          { key: 'C', text: 'Cloud storage caching' },
          { key: 'D', text: 'Unverified local cookies' },
        ],
        correctAnswer: 'A',
        solution: 'Vidya Setu utilizes SHA-256 file hashes to verify package integrity independently of internet access.',
      },
    ],
  };
};
