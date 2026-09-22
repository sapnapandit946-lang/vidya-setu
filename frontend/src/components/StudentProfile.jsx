import React from 'react';
import { Wifi } from 'lucide-react';

export const StudentProfile = () => (
  <div style={{ maxWidth: '720px', margin: '0 auto' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
      <h2>Student Profile</h2>
    </div>
    <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.5rem', background: '#ffffff' }}>
      <h3 style={{ marginTop: 0 }}>Rahul</h3>
      <p style={{ color: '#64748b' }}>Student</p>
      <dl style={{ display: 'grid', gridTemplateColumns: 'max-content 1fr', gap: '0.75rem 1.5rem' }}>
        <dt>Student ID</dt><dd>VS-STU-001</dd>
        <dt>Class</dt><dd>Class 10</dd>
        <dt>Status</dt><dd><Wifi size={14} style={{ verticalAlign: 'middle' }} /> Online</dd>
        <dt>syncStatus</dt><dd>Synced</dd>
      </dl>
    </div>
  </div>
);

export default StudentProfile;
