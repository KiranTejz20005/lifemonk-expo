import React, { useState, useEffect } from 'react';
import { STRAPI_URL } from '../constants';

function gradeRangeForCategory(category: any): string {
  const courses = category?.courses?.data ?? category?.courses ?? [];
  const allGrades: number[] = [];
  courses.forEach((c: any) => {
    const g = c.grades ?? c.attributes?.grades ?? [];
    if (Array.isArray(g)) allGrades.push(...g.map(Number).filter((n) => !isNaN(n)));
  });
  if (!allGrades.length) return 'N/A';
  return Math.min(...allGrades) + '-' + Math.max(...allGrades);
}

export default function CategoriesPage({ setCurrentPage }: { setCurrentPage: (p: string) => void }) {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', visibility: 'all', order: 0 });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '' });

  function loadCategories() {
    fetch(`${STRAPI_URL}/api/categories?populate=courses&pagination[pageSize]=100`)
      .then((r) => r.json())
      .then((data) => setCategories(data?.data ?? []))
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadCategories();
  }, []);

  function openEditModal(cat: any) {
    setEditingId(cat.documentId ?? cat.id);
    setFormData({
      name: cat.name ?? cat.attributes?.name ?? '',
      description: cat.description ?? cat.attributes?.description ?? '',
      visibility: cat.visibility ?? cat.attributes?.visibility ?? 'all',
      order: cat.order ?? cat.attributes?.order ?? 0,
    });
    setShowModal(true);
  }

  function showToastMsg(msg: string) {
    setToast({ show: true, message: msg });
    setTimeout(() => setToast({ show: false, message: '' }), 3000);
  }

  async function saveCategory() {
    setSaving(true);
    try {
      if (editingId) {
        await fetch(`${STRAPI_URL}/api/categories/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: { ...formData } }),
        });
        showToastMsg('Category updated.');
      } else {
        const res = await fetch(`${STRAPI_URL}/api/categories`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: { ...formData, is_active: true },
          }),
        });
        const created = await res.json();
        const docId = created?.data?.documentId ?? created?.data?.id;
        if (docId) {
          await fetch(`${STRAPI_URL}/api/categories/${docId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: { publishedAt: new Date().toISOString() } }),
          });
        }
        showToastMsg('Category added.');
      }
      setShowModal(false);
      setEditingId(null);
      setFormData({ name: '', description: '', visibility: 'all', order: 0 });
      loadCategories();
    } catch (e) {
      showToastMsg('Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteCategory(cat: any) {
    if (!window.confirm('Delete this category?')) return;
    const id = cat.documentId ?? cat.id;
    await fetch(`${STRAPI_URL}/api/categories/${id}`, { method: 'DELETE' });
    loadCategories();
    showToastMsg('Category deleted.');
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Course Categories</h1>
          <p style={{ fontSize: 14, color: '#718096' }}>Organize courses into frontend-visible sections</p>
        </div>
        <button
          type="button"
          onClick={() => { setEditingId(null); setFormData({ name: '', description: '', visibility: 'all', order: 0 }); setShowModal(true); }}
          style={{ background: '#1e2235', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}
        >
          + Add Category
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
        {categories.length === 0 && !loading && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: '#718096' }}>No categories yet.</div>
        )}
        {categories.map((cat) => {
          const name = cat.name ?? cat.attributes?.name ?? '';
          const desc = cat.description ?? cat.attributes?.description ?? '';
          const vis = cat.visibility ?? cat.attributes?.visibility ?? 'all';
          const courses = cat.courses?.data ?? cat.courses ?? [];
          return (
            <div
              key={cat.documentId ?? cat.id}
              style={{ background: '#fff', border: '1px solid #e8ecf0', borderRadius: 8, padding: 24, borderLeft: '4px solid #1e2235', position: 'relative' }}
            >
              <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => openEditModal(cat)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#718096' }} title="Edit">✏️</button>
                <button type="button" onClick={() => deleteCategory(cat)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e53e3e' }} title="Delete">🗑️</button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: '#1a202c' }}>{name}</span>
                <span style={{ fontSize: 12, border: vis === 'all' ? '1px solid #e8ecf0' : 'none', background: vis !== 'all' ? (vis === 'ultra_only' ? '#1e2235' : '#4a5568') : 'transparent', color: vis !== 'all' ? '#fff' : '#4a5568', borderRadius: 20, padding: '2px 10px' }}>
                  {vis === 'all' ? 'All' : vis === 'premium_ultra' ? 'Premium+' : 'Ultra Only'}
                </span>
              </div>
              <div style={{ fontSize: 13, color: '#718096', marginTop: 8, marginBottom: 16, maxHeight: 40, overflow: 'hidden' }}>{desc}</div>
              <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#718096' }}>
                <span>{courses.length} courses</span>
                <span>Grades {gradeRangeForCategory(cat)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 32, width: 560, maxWidth: '90vw' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>{editingId ? 'Edit Category' : 'Add Category'}</h3>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 500 }}>Name</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e8ecf0', borderRadius: 6 }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 500 }}>Description</label>
              <textarea value={formData.description} onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))} rows={3} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e8ecf0', borderRadius: 6 }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 500 }}>Visibility</label>
              <select value={formData.visibility} onChange={(e) => setFormData((p) => ({ ...p, visibility: e.target.value }))} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e8ecf0', borderRadius: 6 }}>
                <option value="all">All</option>
                <option value="premium_ultra">Premium+</option>
                <option value="ultra_only">Ultra Only</option>
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 500 }}>Order</label>
              <input type="number" value={formData.order} onChange={(e) => setFormData((p) => ({ ...p, order: Number(e.target.value) || 0 }))} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e8ecf0', borderRadius: 6 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
              <button type="button" onClick={() => setShowModal(false)} style={{ border: '1px solid #e8ecf0', background: '#fff', padding: '10px 20px', borderRadius: 6, cursor: 'pointer' }}>Cancel</button>
              <button type="button" onClick={saveCategory} disabled={saving} style={{ background: '#1e2235', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 6, cursor: 'pointer' }}>{saving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Category'}</button>
            </div>
          </div>
        </div>
      )}

      {toast.show && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: '#38a169', color: '#fff', padding: '12px 20px', borderRadius: 8, fontSize: 14 }}>{toast.message}</div>
      )}
    </>
  );
}
