import React, { useState, useEffect } from 'react';
import { STRAPI_URL, XANO_URL } from '../constants';

const GRADES = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export default function CourseMappingPage({ setCurrentPage }: { setCurrentPage: (p: string) => void }) {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [schools, setSchools] = useState<any[]>([]);
  const [courseSearch, setCourseSearch] = useState('');
  const [selectedGrades, setSelectedGrades] = useState<number[]>([]);
  const [selectedVisibility, setSelectedVisibility] = useState('all');
  const [selectedSchool, setSelectedSchool] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: 'success' as 'success' | 'error' });
  const [toast, setToast] = useState({ show: false, message: '' });

  useEffect(() => {
    fetch(`${STRAPI_URL}/api/courses?pagination[pageSize]=100`)
      .then((r) => r.json())
      .then((data) => setCourses(data?.data ?? []))
      .catch(() => setCourses([]));
    fetch(`${XANO_URL}/get_all_schools`)
      .then((r) => r.json())
      .then((data) => setSchools(Array.isArray(data) ? data : []))
      .catch(() => setSchools([]));
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      const grades = selectedCourse.grades ?? selectedCourse.attributes?.grades ?? [];
      setSelectedGrades(Array.isArray(grades) ? grades.map(Number).filter((n) => !isNaN(n)) : []);
      setSelectedVisibility(selectedCourse.user_type_visibility ?? selectedCourse.attributes?.user_type_visibility ?? 'all');
      setSelectedSchool('');
    }
  }, [selectedCourse]);

  const filteredCourses = courses.filter((c) => {
    const title = (c.title ?? c.attributes?.title ?? '').toString().toLowerCase();
    return title.includes(courseSearch.toLowerCase());
  });

  function toggleGrade(g: number) {
    setSelectedGrades((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));
  }

  function showToastMsg(msg: string) {
    setToast({ show: true, message: msg });
    setTimeout(() => setToast({ show: false, message: '' }), 3000);
  }

  async function onSave() {
    if (!selectedCourse) return;
    setSaving(true);
    setMessage({ text: '', type: 'success' });
    try {
      const docId = selectedCourse.documentId ?? selectedCourse.id;
      await fetch(`${STRAPI_URL}/api/courses/${docId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: { grades: selectedGrades, user_type_visibility: selectedVisibility },
        }),
      });
      await fetch(`${XANO_URL}/assign_course`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strapi_course_id: docId,
          assignment_type: selectedSchool ? 'school' : 'grade',
          grade: selectedGrades.join(','),
          user_type: selectedVisibility,
          school_id: selectedSchool ? parseInt(selectedSchool, 10) : null,
          assigned_by: 1,
          is_active: true,
        }),
      });
      setMessage({ text: 'Mapping saved successfully.', type: 'success' });
      showToastMsg('Mapping saved.');
    } catch (e) {
      setMessage({ text: 'Failed to save mapping.', type: 'error' });
      showToastMsg('Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  const title = selectedCourse ? (selectedCourse.title ?? selectedCourse.attributes?.title ?? 'Untitled') : '';

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'row', height: 'calc(100vh - 120px)', gap: 0 }}>
        <div style={{ width: 280, borderRight: '1px solid #e8ecf0', overflowY: 'auto', background: '#fff', borderRadius: 8 }}>
          <div style={{ padding: 16, borderBottom: '1px solid #e8ecf0', fontSize: 14, fontWeight: 700 }}>Select a Course</div>
          <input
            type="text"
            placeholder="Search..."
            value={courseSearch}
            onChange={(e) => setCourseSearch(e.target.value)}
            style={{ width: '100%', padding: '8px 16px', border: 'none', borderBottom: '1px solid #e8ecf0', fontSize: 14, boxSizing: 'border-box' }}
          />
          <div>
            {filteredCourses.map((c) => {
              const id = c.documentId ?? c.id;
              const isSelected = selectedCourse && (selectedCourse.documentId ?? selectedCourse.id) === id;
              return (
                <div
                  key={id}
                  onClick={() => setSelectedCourse(c)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #e8ecf0',
                    cursor: 'pointer',
                    background: isSelected ? '#1e2235' : 'transparent',
                    color: isSelected ? '#fff' : '#2d3748',
                  }}
                >
                  {c.title ?? c.attributes?.title ?? 'Untitled'}
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ flex: 1, padding: 24, overflowY: 'auto', background: '#f4f6f8' }}>
          {!selectedCourse ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200, color: '#718096', textAlign: 'center' }}>
              ← Select a course from the left panel to manage its grade and user type mapping
            </div>
          ) : (
            <>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>{title}</h2>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Applicable Grades</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {GRADES.map((g) => (
                    <label key={g} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14 }}>
                      <input type="checkbox" checked={selectedGrades.includes(g)} onChange={() => toggleGrade(g)} />
                      Grade {g}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 24, marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 12 }}>User Type Visibility</label>
                <div>
                  <label style={{ display: 'block', marginBottom: 8 }}>
                    <input type="radio" name="visibility" value="all" checked={selectedVisibility === 'all'} onChange={() => setSelectedVisibility('all')} /> All Users (School + Premium + Ultra)
                  </label>
                  <label style={{ display: 'block', marginBottom: 8 }}>
                    <input type="radio" name="visibility" value="premium_ultra" checked={selectedVisibility === 'premium_ultra'} onChange={() => setSelectedVisibility('premium_ultra')} /> Premium + Ultra Only
                  </label>
                  <label style={{ display: 'block', marginBottom: 8 }}>
                    <input type="radio" name="visibility" value="ultra_only" checked={selectedVisibility === 'ultra_only'} onChange={() => setSelectedVisibility('ultra_only')} /> Ultra Only
                  </label>
                </div>
              </div>

              <div style={{ marginTop: 24, marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Assign to Specific School (optional)</label>
                <select
                  value={selectedSchool}
                  onChange={(e) => setSelectedSchool(e.target.value)}
                  style={{ width: '100%', maxWidth: 400, padding: '10px 12px', border: '1px solid #e8ecf0', borderRadius: 6 }}
                >
                  <option value="">No specific school</option>
                  {schools.map((s) => (
                    <option key={s.id ?? s.documentId} value={String(s.id ?? s.documentId ?? '')}>{s.name ?? s.id}</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={onSave}
                disabled={saving}
                style={{ background: '#1e2235', color: '#fff', padding: '12px 24px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 14 }}
              >
                {saving ? 'Saving...' : 'Save Mapping'}
              </button>
              {message.text && (
                <div style={{ marginTop: 16, color: message.type === 'error' ? '#e53e3e' : '#38a169', fontSize: 14 }}>{message.text}</div>
              )}
            </>
          )}
        </div>
      </div>

      {toast.show && <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: '#38a169', color: '#fff', padding: '12px 20px', borderRadius: 8, fontSize: 14 }}>{toast.message}</div>}
    </>
  );
}
