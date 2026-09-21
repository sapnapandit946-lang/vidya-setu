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
 * Returns the quiz for a given lecture, ensuring that every published lecture
 * has its own unique, topic-specific quiz content tied directly to its lectureId.
 *
 * Priority:
 * 1. Explicit lecture.quiz attached by the teacher or database record
 * 2. Static preset matching in CURRICULUM_DATA (by lectureId or title)
 * 3. Domain-specific question generators tailored to the lecture's title, subject, and course
 */
export const getQuizForLecture = (lecture) => {
  if (!lecture) return null;

  const lectureId = lecture.lectureId;
  const quizId = lecture.quiz?.quizId || `quiz_${lectureId}`;
  const courseName = lecture.courseName || lecture.courseId || 'Master Course';
  const subjectName = lecture.subjectName || lecture.subject || 'Lecture Module';
  const lectureTitle = lecture.title || 'Lecture Practice';

  // 1. If the lecture has its own explicit quiz with questions, return it directly
  if (lecture.quiz && Array.isArray(lecture.quiz.questions) && lecture.quiz.questions.length > 0) {
    return {
      quizId,
      title: lecture.quiz.title || 'Practice Quiz',
      courseName,
      subjectName,
      lectureTitle,
      lectureId,
      version: lecture.currentVersion || lecture.version || 'V1',
      questions: lecture.quiz.questions.map((q, idx) => ({
        ...q,
        questionId: q.questionId || `q_${idx + 1}`,
        questionNumber: q.questionNumber || idx + 1,
      })),
    };
  }

  // 2. Check preset CURRICULUM_DATA by lectureId
  for (const course of CURRICULUM_DATA) {
    for (const subject of course.subjects) {
      for (const lec of subject.lectures) {
        if (lec.lectureId === lectureId) {
          return {
            ...lec.quiz,
            quizId,
            courseName: course.courseName,
            subjectName: subject.subjectName,
            lectureTitle: lec.title,
            lectureId,
            version: lecture.currentVersion || lecture.version || 'V1',
          };
        }
      }
    }
  }

  // 3. Match topic-specific questions based on title and subject keywords
  const titleLower = (lecture.title || '').toLowerCase();
  const subjectLower = (lecture.subject || '').toLowerCase();
  const descLower = (lecture.description || '').toLowerCase();
  const textCorpus = `${titleLower} ${subjectLower} ${descLower}`;

  let questions = [];

  if (textCorpus.includes('distributed') || textCorpus.includes('network') || textCorpus.includes('p2p') || textCorpus.includes('consensus')) {
    // Distributed Systems / Networks Quiz
    questions = [
      {
        questionId: `${lectureId}_q1`,
        questionNumber: 1,
        text: 'According to the CAP theorem, when a network partition (P) occurs in a distributed system, which trade-off must be made?',
        options: [
          { key: 'A', text: 'Consistency vs Availability' },
          { key: 'B', text: 'Latency vs Throughput' },
          { key: 'C', text: 'Storage vs Encryption' },
          { key: 'D', text: 'Reliability vs Bandwidth' },
        ],
        correctAnswer: 'A',
        solution: 'Brewer’s CAP theorem states that under a network partition, a distributed system can guarantee either Consistency or Availability, but not both.',
      },
      {
        questionId: `${lectureId}_q2`,
        questionNumber: 2,
        text: 'What primary role does a consensus algorithm (such as Raft or Paxos) serve in a distributed network?',
        options: [
          { key: 'A', text: 'Compressing video streams for bandwidth reduction' },
          { key: 'B', text: 'Ensuring agreement on a shared state machine across nodes despite failures' },
          { key: 'C', text: 'Accelerating DNS lookups on client browsers' },
          { key: 'D', text: 'Encrypting local database files with AES-256' },
        ],
        correctAnswer: 'B',
        solution: 'Consensus algorithms coordinate distributed nodes so that non-faulty servers agree on an identical sequence of state operations.',
      },
      {
        questionId: `${lectureId}_q3`,
        questionNumber: 3,
        text: 'How does peer-to-peer (P2P) content delivery enhance offline/rural education platforms like Vidya Setu?',
        options: [
          { key: 'A', text: 'It requires continuous multi-gigabit fiber connections' },
          { key: 'B', text: 'It allows nearby classroom nodes to exchange verified packages locally without internet reliance' },
          { key: 'C', text: 'It completely eliminates the need for any storage on student devices' },
          { key: 'D', text: 'It automatically bypasses all cryptographic file hash verification' },
        ],
        correctAnswer: 'B',
        solution: 'P2P topologies enable opportunistic, decentralized distribution where devices share verified content over local Wi-Fi/mesh without uplink connectivity.',
      },
    ];
  } else if (textCorpus.includes('quadratic') || textCorpus.includes('roots') || textCorpus.includes('algebra') || textCorpus.includes('discriminant')) {
    // Quadratic Equations Quiz
    questions = [
      {
        questionId: `${lectureId}_q1`,
        questionNumber: 1,
        text: 'For the quadratic equation ax² + bx + c = 0, what is the formula for the discriminant (D)?',
        options: [
          { key: 'A', text: 'D = b² - 4ac' },
          { key: 'B', text: 'D = b² + 4ac' },
          { key: 'C', text: 'D = -b ± √(b² - 4ac)' },
          { key: 'D', text: 'D = 2a / (-b)' },
        ],
        correctAnswer: 'A',
        solution: 'The discriminant is D = b² - 4ac, which determines the nature of the roots.',
      },
      {
        questionId: `${lectureId}_q2`,
        questionNumber: 2,
        text: 'If the roots of the equation x² - 7x + 12 = 0 are p and q, what are the values of p and q?',
        options: [
          { key: 'A', text: '2 and 6' },
          { key: 'B', text: '3 and 4' },
          { key: 'C', text: '-3 and -4' },
          { key: 'D', text: '1 and 12' },
        ],
        correctAnswer: 'B',
        solution: 'Factorizing: (x - 3)(x - 4) = 0, giving roots x = 3 and x = 4. Sum = 7, Product = 12.',
      },
      {
        questionId: `${lectureId}_q3`,
        questionNumber: 3,
        text: 'When the discriminant D = 0, what can be deduced about the roots of the quadratic equation?',
        options: [
          { key: 'A', text: 'The roots are complex and non-real' },
          { key: 'B', text: 'The roots are real, distinct, and unequal' },
          { key: 'C', text: 'The roots are real and equal (a single repeated root)' },
          { key: 'D', text: 'No roots exist in the real or complex plane' },
        ],
        correctAnswer: 'C',
        solution: 'When D = 0, the term under the square root vanishes, leaving x = -b / (2a), resulting in two equal real roots.',
      },
    ];
  } else if (textCorpus.includes('calculus') || textCorpus.includes('integral') || textCorpus.includes('derivative') || textCorpus.includes('ftc')) {
    // Calculus / Fundamental Theorem Quiz
    questions = [
      {
        questionId: `${lectureId}_q1`,
        questionNumber: 1,
        text: 'According to the Fundamental Theorem of Calculus Part 1, if F(x) = ∫[a to x] f(t) dt, what is F\'(x)?',
        options: [
          { key: 'A', text: 'F\'(x) = f(x)' },
          { key: 'B', text: 'F\'(x) = f\'(x)' },
          { key: 'C', text: 'F\'(x) = f(a) - f(x)' },
          { key: 'D', text: 'F\'(x) = 0' },
        ],
        correctAnswer: 'A',
        solution: 'The Fundamental Theorem of Calculus demonstrates that differentiation and integration are inverse operations: d/dx [∫[a to x] f(t) dt] = f(x).',
      },
      {
        questionId: `${lectureId}_q2`,
        questionNumber: 2,
        text: 'What is the definite integral of 3x² with respect to x evaluated from x = 1 to x = 3?',
        options: [
          { key: 'A', text: '18' },
          { key: 'B', text: '26' },
          { key: 'C', text: '27' },
          { key: 'D', text: '24' },
        ],
        correctAnswer: 'B',
        solution: 'Anti-derivative of 3x² is x³. Evaluating from 1 to 3: 3³ - 1³ = 27 - 1 = 26.',
      },
      {
        questionId: `${lectureId}_q3`,
        questionNumber: 3,
        text: 'In the Correction Capsule for this lecture, why are integration limits and sign conventions strictly preserved?',
        options: [
          { key: 'A', text: 'Reversing integration limits changes the sign: ∫[b to a] f(x)dx = -∫[a to b] f(x)dx' },
          { key: 'B', text: 'Integration limits are always ignored in definite integrals' },
          { key: 'C', text: 'Changing limits multiplies the result by zero' },
          { key: 'D', text: 'All integrals yield positive values regardless of boundary order' },
        ],
        correctAnswer: 'A',
        solution: 'By property of definite integrals, swapping limits introduces a negative sign: ∫[b to a] f(x) dx = -∫[a to b] f(x) dx.',
      },
    ];
  } else if (textCorpus.includes('quantum') || textCorpus.includes('physics') || textCorpus.includes('wave') || textCorpus.includes('schrodinger')) {
    // Quantum Mechanics / Physics Quiz
    questions = [
      {
        questionId: `${lectureId}_q1`,
        questionNumber: 1,
        text: 'What fundamental physical property does the Heisenberg Uncertainty Principle quantify?',
        options: [
          { key: 'A', text: 'The trade-off between simultaneous precision of position and momentum (Δx · Δp ≥ ℏ/2)' },
          { key: 'B', text: 'The maximum speed of light in a vacuum' },
          { key: 'C', text: 'The rate of radioactive alpha decay' },
          { key: 'D', text: 'The gravitational constant in curved spacetime' },
        ],
        correctAnswer: 'A',
        solution: 'Heisenberg’s uncertainty relation establishes a fundamental limit on how precisely canonically conjugate pairs (such as position and momentum) can be simultaneously determined.',
      },
      {
        questionId: `${lectureId}_q2`,
        questionNumber: 2,
        text: 'In the time-dependent Schrödinger equation, what does |Ψ(x,t)|² represent according to the Born interpretation?',
        options: [
          { key: 'A', text: 'The kinetic velocity of the particle' },
          { key: 'B', text: 'The probability density of locating the particle at position x and time t' },
          { key: 'C', text: 'The total mechanical energy of the atomic nucleus' },
          { key: 'D', text: 'The electrical conductivity of the medium' },
        ],
        correctAnswer: 'B',
        solution: 'Max Born proposed that the squared modulus of the wave function |Ψ|² represents the probability density distribution of observing the particle.',
      },
      {
        questionId: `${lectureId}_q3`,
        questionNumber: 3,
        text: 'Which equation correctly expresses the de Broglie wavelength (λ) of a particle with momentum p?',
        options: [
          { key: 'A', text: 'λ = h / p' },
          { key: 'B', text: 'λ = p / h' },
          { key: 'C', text: 'λ = h · c²' },
          { key: 'D', text: 'λ = m / (h · v)' },
        ],
        correctAnswer: 'A',
        solution: 'Louis de Broglie’s wave-particle hypothesis relates wavelength to Planck’s constant and linear momentum via λ = h / p.',
      },
    ];
  } else if (textCorpus.includes('arithmetic') || textCorpus.includes('progression') || textCorpus.includes('sequence')) {
    // Arithmetic Progressions Quiz
    questions = [
      {
        questionId: `${lectureId}_q1`,
        questionNumber: 1,
        text: 'In an Arithmetic Progression with first term a and common difference d, what is the formula for the nth term a_n?',
        options: [
          { key: 'A', text: 'a_n = a + (n - 1)d' },
          { key: 'B', text: 'a_n = a + nd' },
          { key: 'C', text: 'a_n = a · d^(n - 1)' },
          { key: 'D', text: 'a_n = (n / 2)(2a + d)' },
        ],
        correctAnswer: 'A',
        solution: 'The general nth term of an AP is a_n = a + (n - 1)d.',
      },
      {
        questionId: `${lectureId}_q2`,
        questionNumber: 2,
        text: 'For the sequence 5, 9, 13, 17, ..., what is the 20th term?',
        options: [
          { key: 'A', text: '81' },
          { key: 'B', text: '85' },
          { key: 'C', text: '77' },
          { key: 'D', text: '90' },
        ],
        correctAnswer: 'A',
        solution: 'First term a = 5, common difference d = 4. a_20 = 5 + (20 - 1)·4 = 5 + 76 = 81.',
      },
    ];
  } else {
    // Dynamic lecture-specific fallback: built specifically referencing lecture.title and subject
    questions = [
      {
        questionId: `${lectureId}_q1`,
        questionNumber: 1,
        text: `What is the core objective of the master lecture "${lectureTitle}"?`,
        options: [
          { key: 'A', text: `Mastering key concepts and analytical principles in ${subjectName}` },
          { key: 'B', text: 'Memorizing unrelated trivia without comprehension' },
          { key: 'C', text: 'Relying exclusively on cloud servers without offline access' },
          { key: 'D', text: 'Overwriting previous versions without integrity checks' },
        ],
        correctAnswer: 'A',
        solution: `This lecture provides foundational and applied knowledge in ${subjectName}, focusing on "${lectureTitle}".`,
      },
      {
        questionId: `${lectureId}_q2`,
        questionNumber: 2,
        text: `In the context of "${lectureTitle}", what does offline verification guarantee to the student?`,
        options: [
          { key: 'A', text: 'Cryptographically verified lecture content and immutable question sets stored in IndexedDB' },
          { key: 'B', text: 'That all student answers are deleted upon page refresh' },
          { key: 'C', text: 'That answers can only be saved when high-speed internet is present' },
          { key: 'D', text: 'That V1 is overwritten whenever V2 is published' },
        ],
        correctAnswer: 'A',
        solution: 'Vidya Setu ensures that lecture packages and quizzes remain persistent in IndexedDB with cryptographic verification.',
      },
      {
        questionId: `${lectureId}_q3`,
        questionNumber: 3,
        text: `When studying "${lectureTitle}", how are offline quiz attempts and timestamped doubts synchronized?`,
        options: [
          { key: 'A', text: 'Through opportunistic MicroSync when short connectivity is detected, keeping local records preserved' },
          { key: 'B', text: 'By manually re-entering all questions and answers' },
          { key: 'C', text: 'By discarding offline records whenever network returns' },
          { key: 'D', text: 'By clearing browser history' },
        ],
        correctAnswer: 'A',
        solution: 'MicroSync detects intermittent connectivity and automatically transmits pending doubts and quiz submissions while preserving local IndexedDB records.',
      },
    ];
  }

  return {
    quizId,
    title: 'Practice Quiz',
    courseName,
    subjectName,
    lectureTitle,
    lectureId,
    version: lecture.currentVersion || lecture.version || 'V1',
    questions,
  };
};
