import React, { useState, useEffect } from 'react';
import { STRAPI_URL } from '../constants';

function gradesDisplay(grades: number[] | undefined) {
  if (!grades || !grades.length) return '-';
  const nums = grades.map(Number).filter((n) => !isNaN(n));
  if (!nums.length) return '-';
  return Math.min(...nums) + '-' + Math.max(...nums);
}

export default function CoursesPage({ setCurrentPage }: { setCurrentPage: (p: string) => void }) {
  const [courses, setCourses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterVisibility, setFilterVisibility] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editCourse, setEditCourse] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    categoryId: '',
    visibility: 'all',
    grades: [] as number[],
    description: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' });

  function showToastMessage(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ show: true, message: msg, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  }

  function loadCourses() {
    fetch(`${STRAPI_URL}/api/courses?populate=category&pagination[pageSize]=100`)
      .then((r) => r.json())
      .then((data) => setCourses(data?.data ?? []))
      .catch(() => setCourses([]));
  }

  function loadCategories() {
    fetch(`${STRAPI_URL}/api/categories?pagination[pageSize]=100`)
      .then((r) => r.json())
      .then((data) => setCategories(data?.data ?? []))
      .catch(() => setCategories([]));
  }

  useEffect(() => {
    loadCourses();
    loadCategories();
    setLoading(false);
  }, []);

  const filteredCourses = courses.filter((c) => {
    const title = (c.title ?? c.attributes?.title ?? '').toString().toLowerCase();
    const matchSearch = title.includes(search.toLowerCase());
    const catId = c.category?.documentId ?? c.category?.data?.documentId ?? c.category;
    const matchCat = !filterCategory || catId === filterCategory;
    const vis = c.user_type_visibility ?? c.attributes?.user_type_visibility ?? '';
    const matchVis = !filterVisibility || vis === filterVisibility;
    return matchSearch && matchCat && matchVis;
  });

  function resetForm() {
    setFormData({ title: '', categoryId: '', visibility: 'all', grades: [], description: '' });
    setEditCourse(null);
    setError('');
  }

  function openEditModal(course: any) {
    setEditCourse(course);
    setFormData({
      title: course.title ?? course.attributes?.title ?? '',
      categoryId: course.category?.documentId ?? course.category?.data?.documentId ?? course.category ?? '',
      visibility: course.user_type_visibility ?? course.attributes?.user_type_visibility ?? 'all',
      grades: course.grades ?? course.attributes?.grades ?? [],
      description: course.short_description ?? course.attributes?.short_description ?? '',
    });
    setShowEditModal(true);
    setError('');
  }

  async function createCourse() {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${STRAPI_URL}/api/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            title: formData.title,
            category: formData.categoryId || null,
            user_type_visibility: formData.visibility || 'all',
            grades: formData.grades,
            short_description: formData.description,
            is_active: true,
          },
        },
      });
      const created = await res.json();
      if (!res.ok) throw new Error((created as any).error?.message || 'Failed to create');
      const docId = created?.data?.documentId ?? created?.data?.id;
      if (docId) {
        await fetch(`${STRAPI_URL}/api/courses/${docId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: { publishedAt: new Date().toISOString() } }),
        });
      }
      setShowCreateModal(false);
      resetForm();
      loadCourses();
      showToastMessage('Course created successfully!');
    } catch (e: any) {
      setError(e?.message ?? 'Failed');
    } finally {
      setSaving(false);
    }
  }

  async function saveEditCourse() {
    if (!editCourse) return;
    const docId = editCourse.documentId ?? editCourse.id;
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${STRAPI_URL}/api/courses/${docId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            title: formData.title,
            category: formData.categoryId || null,
            user_type_visibility: formData.visibility || 'all',
            grades: formData.grades,
            short_description: formData.description,
          },
        },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error((err as any).error?.message || 'Failed to update');
      }
      setShowEditModal(false);
      resetForm();
      loadCourses();
      showToastMessage('Course updated.');
    } catch (e: any) {
      setError(e?.message ?? 'Failed');
    } finally {
      setSaving(false);
    }
  }

  async function deleteCourse(documentId: string) {
    if (!window.confirm('Delete this course? This cannot be undone.')) return;
    await fetch(`${STRAPI_URL}/api/courses/${documentId}`, { method: 'DELETE' });
    loadCourses();
    showToastMessage('Course deleted.');
  }

  function toggleGrade(grade: number) {
    setFormData((prev) => ({
      ...prev,
      grades: prev.grades.includes(grade) ? prev.grades.filter((g) => g !== grade) : [...prev.grades, grade],
    }));
  }

  const GRADES = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Courses</h1>
          <p style={{ fontSize: 14, color: '#718096' }}>Manage all course content and assignments</p>
        </div>
        <button
          type="button"
          onClick={() => { setShowCreateModal(true); resetForm(); }}
          style={{ background: '#1e2235', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 500 }}
        >
          + Create Course
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Search courses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #e8ecf0', borderRadius: 6, fontSize: 14, width: 300 }}
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #e8ecf0', borderRadius: 6, fontSize: 14 }}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.documentId ?? c.id} value={c.documentId ?? c.id}>
              {c.name ?? c.attributes?.name}
            </option>
          ))}
        </select>
        <select
          value={filterVisibility}
          onChange={(e) => setFilterVisibility(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #e8ecf0', borderRadius: 6, fontSize: 14 }}
        >
          <option value="">All Visibility</option>
          <option value="all">All</option>
          <option value="premium_ultra">Premium+</option>
          <option value="ultra_only">Ultra Only</option>
        </select>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e8ecf0', borderRadius: 8, overflow: 'hidden', width: '100%' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f7fafc' }}>
            <tr>
              <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 600, color: '#718096', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'left', borderBottom: '1px solid #e8ecf0' }}>ID</th>
              <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 600, color: '#718096', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'left', borderBottom: '1px solid #e8ecf0' }}>COURSE TITLE</th>
              <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 600, color: '#718096', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'left', borderBottom: '1px solid #e8ecf0' }}>CATEGORY</th>
              <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 600, color: '#718096', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'left', borderBottom: '1px solid #e8ecf0' }}>GRADES</th>
              <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 600, color: '#718096', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'left', borderBottom: '1px solid #e8ecf0' }}>VISIBILITY</th>
              <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 600, color: '#718096', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'left', borderBottom: '1px solid #e8ecf0' }}>STATUS</th>
              <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 600, color: '#718096', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'left', borderBottom: '1px solid #e8ecf0' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredCourses.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#718096' }}>
                  No courses found
                </td>
              </tr>
            ) : (
              filteredCourses.map((c) => {
                const docId = c.documentId ?? c.id;
                const title = c.title ?? c.attributes?.title ?? '';
                const catName = c.category?.name ?? c.category?.data?.name ?? 'Uncategorized';
                const grades = c.grades ?? c.attributes?.grades ?? [];
                const vis = c.user_type_visibility ?? c.attributes?.user_type_visibility ?? 'all';
                const publishedAt = c.publishedAt ?? c.attributes?.publishedAt;
                return (
                  <tr key={docId} style={{ borderBottom: '1px solid #e8ecf0' }}>
                    <td style={{ padding: '12px 16px', fontSize: 14, color: '#2d3748' }}>{docId}</td>
                    <td style={{ padding: '12px 16px', fontSize: 14, color: '#2d3748', fontWeight: 500 }}>{title}</td>
                    <td style={{ padding: '12px 16px', fontSize: 14, color: '#2d3748' }}>
                      <span style={{ border: '1px solid #cbd5e0', borderRadius: 20, padding: '3px 10px', fontSize: 12, color: '#4a5568' }}>{catName}</span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 14, color: '#2d3748' }}>{gradesDisplay(grades)}</td>
                    <td style={{ padding: '12px 16px', fontSize: 14, color: '#2d3748' }}>
                      {vis === 'all' && <span style={{ background: '#1e2235', color: '#fff', borderRadius: 20, padding: '3px 10px', fontSize: 12 }}>All</span>}
                      {vis === 'premium_ultra' && <span style={{ background: '#4a5568', color: '#fff', borderRadius: 20, padding: '3px 10px', fontSize: 12 }}>Premium+</span>}
                      {vis === 'ultra_only' && <span style={{ border: '1px solid #1e2235', color: '#1e2235', borderRadius: 20, padding: '3px 10px', fontSize: 12 }}>Ultra Only</span>}
                      {!['all', 'premium_ultra', 'ultra_only'].includes(vis) && <span style={{ fontSize: 12 }}>{vis}</span>}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 14, color: '#2d3748' }}>
                      {publishedAt ? <span style={{ color: '#38a169', fontSize: 13 }}>● Published</span> : <span style={{ color: '#718096', fontSize: 13 }}>○ Draft</span>}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button type="button" onClick={() => alert(JSON.stringify(c, null, 2))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#718096' }} title="View">👁</button>
                        <button type="button" onClick={() => openEditModal(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#718096' }} title="Edit">✏️</button>
                        <button type="button" onClick={() => deleteCourse(docId)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e53e3e' }} title="Delete">🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 32, width: 560, maxWidth: '90vw', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>Create New Course</h3>
            {error && <p style={{ color: '#e53e3e', marginBottom: 12 }}>{error}</p>}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 500 }}>Course Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #e8ecf0', borderRadius: 6, fontSize: 14 }}
              />
            </div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 500 }}>Category</label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData((p) => ({ ...p, categoryId: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #e8ecf0', borderRadius: 6 }}
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.documentId ?? c.id} value={c.documentId ?? c.id}>{c.name ?? c.attributes?.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 500 }}>Visibility</label>
                <select
                  value={formData.visibility}
                  onChange={(e) => setFormData((p) => ({ ...p, visibility: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #e8ecf0', borderRadius: 6 }}
                >
                  <option value="">Select visibility</option>
                  <option value="all">All Users</option>
                  <option value="premium_ultra">Premium + Ultra</option>
                  <option value="ultra_only">Ultra Only</option>
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 500 }}>Applicable Grades</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {GRADES.map((g) => (
                  <label key={g} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, cursor: 'pointer' }}>
                    <input type="checkbox" checked={formData.grades.includes(g)} onChange={() => toggleGrade(g)} />
                    <span>{g}</span>
                  </label>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 500 }}>Description</label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #e8ecf0', borderRadius: 6, fontSize: 14, resize: 'vertical' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
              <button type="button" onClick={() => { setShowCreateModal(false); resetForm(); }} style={{ border: '1px solid #e8ecf0', background: '#fff', padding: '10px 20px', borderRadius: 6, cursor: 'pointer' }}>Cancel</button>
              <button type="button" onClick={createCourse} disabled={saving} style={{ background: '#1e2235', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 6, cursor: 'pointer' }}>{saving ? 'Saving...' : 'Create Course'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editCourse && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 32, width: 560, maxWidth: '90vw', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>Edit Course</h3>
            {error && <p style={{ color: '#e53e3e', marginBottom: 12 }}>{error}</p>}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 500 }}>Course Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #e8ecf0', borderRadius: 6, fontSize: 14 }}
              />
            </div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 500 }}>Category</label>
                <select value={formData.categoryId} onChange={(e) => setFormData((p) => ({ ...p, categoryId: e.target.value }))} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e8ecf0', borderRadius: 6 }}>
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.documentId ?? c.id} value={c.documentId ?? c.id}>{c.name ?? c.attributes?.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 500 }}>Visibility</label>
                <select value={formData.visibility} onChange={(e) => setFormData((p) => ({ ...p, visibility: e.target.value }))} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e8ecf0', borderRadius: 6 }}>
                  <option value="all">All Users</option>
                  <option value="premium_ultra">Premium + Ultra</option>
                  <option value="ultra_only">Ultra Only</option>
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 500 }}>Applicable Grades</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {GRADES.map((g) => (
                  <label key={g} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, cursor: 'pointer' }}>
                    <input type="checkbox" checked={formData.grades.includes(g)} onChange={() => toggleGrade(g)} />
                    <span>{g}</span>
                  </label>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 500 }}>Description</label>
              <textarea rows={4} value={formData.description} onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e8ecf0', borderRadius: 6, fontSize: 14, resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
              <button type="button" onClick={() => { setShowEditModal(false); resetForm(); }} style={{ border: '1px solid #e8ecf0', background: '#fff', padding: '10px 20px', borderRadius: 6, cursor: 'pointer' }}>Cancel</button>
              <button type="button" onClick={saveEditCourse} disabled={saving} style={{ background: '#1e2235', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 6, cursor: 'pointer' }}>{saving ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}

      {toast.show && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 9999,
            background: toast.type === 'success' ? '#38a169' : '#e53e3e',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: 8,
            fontSize: 14,
          }}
        >
          {toast.message}
        </div>
      )}
    </>
  );
}
