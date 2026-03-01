import React, { useState, useEffect } from 'react';
import { XANO_URL } from '../constants';

export default function SchoolsPage({ setCurrentPage }: { setCurrentPage: (p: string) => void }) {
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', admin_email: '' });
  const [toast, setToast] = useState({ show: false, message: '' });

  useEffect(() => {
    setError('');
    fetch(`${XANO_URL}/get_all_schools`)
      .then((r) => r.json())
      .then((data) => setSchools(Array.isArray(data) ? data : []))
      .catch(() => setError('Unable to load schools. Check Xano get_all_schools endpoint.'))
      .finally(() => setLoading(false));
  }, []);

  function showToastMsg(msg: string) {
    setToast({ show: true, message: msg });
    setTimeout(() => setToast({ show: false, message: '' }), 3000);
  }

  function addSchool() {
    showToastMsg('Coming soon');
    setShowAddModal(false);
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Schools</h1>
        <button type="button" onClick={() => setShowAddModal(true)} style={{ background: '#1e2235', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>+ Add School</button>
      </div>
      {error && <div style={{ padding: 12, background: '#fff5f5', color: '#e53e3e', borderRadius: 8, marginBottom: 16 }}>{error}</div>}
      <div style={{ background: '#fff', border: '1px solid #e8ecf0', borderRadius: 8, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f7fafc' }}>
            <tr>
              <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 600, color: '#718096', textTransform: 'uppercase', textAlign: 'left', borderBottom: '1px solid #e8ecf0' }}>ID</th>
              <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 600, color: '#718096', textTransform: 'uppercase', textAlign: 'left', borderBottom: '1px solid #e8ecf0' }}>SCHOOL NAME</th>
              <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 600, color: '#718096', textTransform: 'uppercase', textAlign: 'left', borderBottom: '1px solid #e8ecf0' }}>ADMIN EMAIL</th>
              <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 600, color: '#718096', textTransform: 'uppercase', textAlign: 'left', borderBottom: '1px solid #e8ecf0' }}>IS ACTIVE</th>
              <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 600, color: '#718096', textTransform: 'uppercase', textAlign: 'left', borderBottom: '1px solid #e8ecf0' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: '#718096' }}>Loading...</td></tr>
            ) : schools.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: '#718096' }}>No schools</td></tr>
            ) : (
              schools.map((s) => {
                const active = s.active !== false && s.is_active !== false;
                return (
                  <tr key={s.id ?? s.documentId ?? Math.random()} style={{ borderBottom: '1px solid #e8ecf0' }}>
                    <td style={{ padding: '12px 16px', fontSize: 14, color: '#2d3748' }}>{s.id ?? s.documentId ?? '-'}</td>
                    <td style={{ padding: '12px 16px', fontSize: 14, color: '#2d3748' }}>{s.name ?? '-'}</td>
                    <td style={{ padding: '12px 16px', fontSize: 14, color: '#2d3748' }}>{s.admin_email ?? s.adminEmail ?? '-'}</td>
                    <td style={{ padding: '12px 16px', fontSize: 14, color: '#2d3748' }}>{active ? <span style={{ color: '#38a169' }}>● Active</span> : <span style={{ color: '#718096' }}>○ Inactive</span>}</td>
                    <td style={{ padding: '12px 16px', fontSize: 14, color: '#2d3748' }}>-</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 32, width: 480, maxWidth: '90vw' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>Add School</h3>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 500 }}>School Name (required)</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e8ecf0', borderRadius: 6 }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 500 }}>Admin Email (required)</label>
              <input type="email" value={formData.admin_email} onChange={(e) => setFormData((p) => ({ ...p, admin_email: e.target.value }))} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e8ecf0', borderRadius: 6 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
              <button type="button" onClick={() => setShowAddModal(false)} style={{ border: '1px solid #e8ecf0', background: '#fff', padding: '10px 20px', borderRadius: 6, cursor: 'pointer' }}>Cancel</button>
              <button type="button" onClick={addSchool} style={{ background: '#1e2235', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 6, cursor: 'pointer' }}>Add School</button>
            </div>
          </div>
        </div>
      )}

      {toast.show && <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: '#38a169', color: '#fff', padding: '12px 20px', borderRadius: 8, fontSize: 14 }}>{toast.message}</div>}
    </>
  );
}
