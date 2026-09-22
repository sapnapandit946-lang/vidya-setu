import React from 'react';
import { BookOpen, GraduationCap, ShieldCheck } from 'lucide-react';

export const LoginPage = ({ onLogin }) => (
  <main className="login-page">
    <section className="login-panel" aria-labelledby="login-title">
      <div className="login-brand-mark"><BookOpen size={26} /></div>
      <span className="login-eyebrow">Vidya Setu Learning Network</span>
      <h1 id="login-title">Welcome back</h1>
      <p className="login-intro">Choose your workspace to continue.</p>

      <div className="login-options">
        <button type="button" className="login-role-card teacher-login-card" onClick={() => onLogin('teacher')}>
          <span className="login-role-icon"><ShieldCheck size={24} /></span>
          <span className="login-role-copy"><strong>Login as Teacher</strong><small>Publish lectures, manage versions, and answer student doubts.</small></span>
          <span className="login-arrow" aria-hidden="true">-&gt;</span>
        </button>
        <button type="button" className="login-role-card student-login-card" onClick={() => onLogin('student')}>
          <span className="login-role-icon"><GraduationCap size={24} /></span>
          <span className="login-role-copy"><strong>Login as Student</strong><small>Study courses, download lessons, take quizzes, and sync offline work.</small></span>
          <span className="login-arrow" aria-hidden="true">-&gt;</span>
        </button>
      </div>

      <p className="login-note">Your learning workspace is connected to the shared Vidya Setu backend.</p>
    </section>
  </main>
);
