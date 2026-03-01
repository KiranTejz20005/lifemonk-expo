import React, { useState, useEffect } from 'react';
import { XANO_URL } from '../constants';

export default function StudentsPage({ setCurrentPage }: { setCurrentPage: (p: string) => void }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', user_type: 'school', grade: '' });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '' });

  useEffect(() => {
    setError('');
    fetch(`${XANO_URL}/get_all_users`)
      .then((r) => r.json())
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch(() => setError('Unable to load students. Make sure Xano get_all_users endpoint is configured.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter((u) => {
    const name = ((u.name ?? '') + ' ' + (u.first_name ?? '') + ' ' + (u.last_name ?? '')).toLowerCase();
    const email = (u.email ?? '').toLowerCase();
    const q = search.toLowerCase();
    return !q || name.includes(q) || email.includes(q);
  });

  function showToastMsg(msg: string) {
    setToast({ show: true, message: msg });
    setTimeout(() => setToast({ show: false, message: '' }), 3000);
  }

  async function addStudent() {
    setSaving(true);
    try {
      const res = await fetch(`${XANO_URL}/create_user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          user_type: formData.user_type,
          grade: formData.grade || null,
        }),
      });
      if (!res.ok) throw new Error('Failed to create user');
      setShowAddModal(false);
      setFormData({ name: '', email: '', password: '', user_type: 'school', grade: '' });
      const data = await fetch(`${XANO_URL}/get_all_users`).then((r) => r.json());
      setUsers(Array.isArray(data) ? data : []);
      showToastMsg('Student added.');
    } catch (e) {
      showToastMsg('Failed to add student.');
    } finally {
      setSaving(false);
    }
  }

  const badgeStyle = (userType: string) => {
    if (userType === 'ultra') return { background: '#1e2235', color: '#fff' };
    if (userType === 'premium') return { background: '#4a5568', color: '#fff' };
    return { background: '#e2e8f0', color: '#2d3748' };
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Students</h1>
        <button type="button" onClick={() => setShowAddModal(true)} style={{ background: '#1e2235', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>+ Add Student</button>
      </div>
      <div style={{ marginBottom: 20 }}>
        <input type="text" placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #e8ecf0', borderRadius: 6, fontSize: 14, width: 300 }} />
      </div>
      {error && <div style={{ padding: 12, background: '#fff5f5', color: '#e53e3e', borderRadius: 8, marginBottom: 16 }}>{error}</div>}
      <div style={{ background: '#fff', border: '1px solid #e8ecf0', borderRadius: 8, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f7fafc' }}>
            <tr>
              <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 600, color: '#718096', textTransform: 'uppercase', textAlign: 'left', borderBottom: '1px solid #e8ecf0' }}>ID</th>
              <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 600, color: '#718096', textTransform: 'uppercase', textAlign: 'left', borderBottom: '1px solid #e8ecf0' }}>NAME</th>
              <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 600, color: '#718096', textTransform: 'uppercase', textAlign: 'left', borderBottom: '1px solid #e8ecf0' }}>EMAIL</th>
              <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 600, color: '#718096', textTransform: 'uppercase', textAlign: 'left', borderBottom: '1px solid #e8ecf0' }}>USER TYPE</th>
              <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 600, color: '#718096', textTransform: 'uppercase', textAlign: 'left', borderBottom: '1px solid #e8ecf0' }}>GRADE</th>
              <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 600, color: '#718096', textTransform: 'uppercase', textAlign: 'left', borderBottom: '1px solid #e8ecf0' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: '#718096' }}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: '#718096' }}>No students</td></tr>
            ) : (
              filtered.map((u) => {
                const userType = (u.user_type ?? u.userType ?? '-').toString();
                return (
                  <tr key={u.id ?? u.documentId ?? Math.random()} style={{ borderBottom: '1px solid #e8ecf0' }}>
                    <td style={{ padding: '12px 16px', fontSize: 14, color: '#2d3748' }}>{u.id ?? u.documentId ?? '-'}</td>
                    <td style={{ padding: '12px 16px', fontSize: 14, color: '#2d3748' }}>{(u.name ?? (u.first_name ?? '') + ' ' + (u.last_name ?? '')).trim() || '-'}</td>
                    <td style={{ padding: '12px 16px', fontSize: 14, color: '#2d3748' }}>{u.email ?? '-'}</td>
                    <td style={{ padding: '12px 16px', fontSize: 14, color: '#2d3748' }}>
                      <span style={{ ...badgeStyle(userType), padding: '3px 10px', borderRadius: 20, fontSize: 12 }}>{userType}</span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 14, color: '#2d3748' }}>{u.grade ?? '-'}</td>
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
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>Add Student</h3>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 500 }}>Name</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e8ecf0', borderRadius: 6 }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 500 }}>Email</label>
              <input type="email" value={formData.email} onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e8ecf0', borderRadius: 6 }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 500 }}>Password</label>
              <input type="password" value={formData.password} onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e8ecf0', borderRadius: 6 }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 500 }}>User Type</label>
              <select value={formData.user_type} onChange={(e) => setFormData((p) => ({ ...p, user_type: e.target.value }))} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e8ecf0', borderRadius: 6 }}>
                <option value="school">school</option>
                <option value="premium">premium</option>
                <option value="ultra">ultra</option>
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 500 }}>Grade</label>
              <select value={formData.grade} onChange={(e) => setFormData((p) => ({ ...p, grade: e.target.value }))} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e8ecf0', borderRadius: 6 }}>
                <option value="">—</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((g) => (
                  <option key={g} value={g}>Grade {g}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
              <button type="button" onClick={() => setShowAddModal(false)} style={{ border: '1px solid #e8ecf0', background: '#fff', padding: '10px 20px', borderRadius: 6, cursor: 'pointer' }}>Cancel</button>
              <button type="button" onClick={addStudent} disabled={saving} style={{ background: '#1e2235', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 6, cursor: 'pointer' }}>{saving ? 'Saving...' : 'Add Student'}</button>
            </div>
          </div>
        </div>
      )}

      {toast.show && <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: '#38a169', color: '#fff', padding: '12px 20px', borderRadius: 8, fontSize: 14 }}>{toast.message}</div>}
    </>
  );
}
