import React, { useState, useEffect } from 'react';
import { STRAPI_URL, XANO_URL } from '../constants';

const GRADES = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

const visibilityMap: Record<string, string> = {
  all: 'public',
  premium_ultra: 'restricted',
  ultra_only: 'hidden',
};

function getCourseAttr(c: any, key: string) {
  if (c.attributes && c.attributes[key] !== undefined) return c.attributes[key];
  return c[key];
}

function VisibilityBadge({ vis }: { vis: string }) {
  const v = (vis || 'all').toLowerCase();
  if (v === 'all') return <span style={{ background: '#1e2235', color: '#fff', padding: '2px 8px', borderRadius: 12, fontSize: 11 }}>All</span>;
  if (v === 'premium_ultra') return <span style={{ background: '#4a5568', color: '#fff', padding: '2px 8px', borderRadius: 12, fontSize: 11 }}>Premium+</span>;
  if (v === 'ultra_only') return <span style={{ border: '1px solid #1e2235', color: '#1e2235', padding: '2px 8px', borderRadius: 12, fontSize: 11 }}>Ultra</span>;
  return <span style={{ border: '1px solid #cbd5e0', color: '#4a5568', padding: '2px 8px', borderRadius: 12, fontSize: 11 }}>{vis}</span>;
}

export default function CourseMappingPage({ setCurrentPage }: { setCurrentPage: (p: string) => void }) {
  const [activeTab, setActiveTab] = useState<'courses' | 'workshops' | 'bytes' | 'practice'>('courses');
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [schools, setSchools] = useState<any[]>([]);
  const [courseSearch, setCourseSearch] = useState('');
  const [selectedGrades, setSelectedGrades] = useState<number[]>([]);
  const [selectedVisibility, setSelectedVisibility] = useState('all');
  const [schoolMode, setSchoolMode] = useState<'all' | 'specific'>('all');
  const [selectedSchool, setSelectedSchool] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', isError: false });

  useEffect(() => {
    fetch(`${STRAPI_URL}/api/courses?populate=category&pagination[pageSize]=100`)
      .then((r) => r.json())
      .then((data) => setCourses(data?.data ?? []))
      .catch(() => setCourses([]));
    if (XANO_URL) {
      fetch(`${XANO_URL}/get_all_schools`)
        .then((r) => r.json())
        .then((data) => setSchools(Array.isArray(data) ? data : []))
        .catch(() => setSchools([]));
    }
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      const grades = getCourseAttr(selectedCourse, 'grades') ?? [];
      setSelectedGrades(Array.isArray(grades) ? grades.map(Number).filter((n) => !isNaN(n)) : []);
      setSelectedVisibility(getCourseAttr(selectedCourse, 'user_type_visibility') ?? 'all');
      setSchoolMode('all');
      setSelectedSchool('');
    }
  }, [selectedCourse]);

  const filteredCourses = courses.filter((c) => {
    const title = (getCourseAttr(c, 'title') ?? '').toString().toLowerCase();
    return title.includes(courseSearch.toLowerCase());
  });

  function toggleGrade(g: number) {
    setSelectedGrades((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));
  }

  function showToast(msg: string, isError = false) {
    setToast({ show: true, message: msg, isError });
    setTimeout(() => setToast({ show: false, message: '', isError: false }), 3000);
  }

  async function onSave() {
    if (!selectedCourse) return;
    setSaving(true);
    try {
      const docId = selectedCourse.documentId ?? selectedCourse.id;
      const title = getCourseAttr(selectedCourse, 'title') ?? 'Untitled';
      const categoryName = (() => {
        const cat = getCourseAttr(selectedCourse, 'category');
        if (!cat) return 'general';
        const data = cat?.data ?? cat;
        return data?.name ?? data?.attributes?.name ?? 'general';
      })();

      // Step 1: Update Strapi course
      const putRes = await fetch(`${STRAPI_URL}/api/courses/${docId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: { grades: selectedGrades, user_type_visibility: selectedVisibility },
        }),
      });
      if (!putRes.ok) {
        const err = await putRes.json().catch(() => ({}));
        throw new Error((err as { error?: { message?: string } })?.error?.message ?? 'Strapi update failed');
      }

      if (!XANO_URL) {
        showToast('Strapi course updated. XANO_URL not set, skipping Xano.');
        return;
      }

      // Step 2: POST Xano save_entitlement
      const entRes = await fetch(`${XANO_URL}/save_entitlement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content_type: 'course',
          content_id: docId,
          content_title: title,
          grade_ids: selectedGrades,
          subscription_type: selectedVisibility,
          school_id: schoolMode === 'specific' && selectedSchool ? parseInt(selectedSchool, 10) : 0,
          is_active: true,
          assigned_by: 1,
        }),
      });
      if (!entRes.ok) {
        const errText = await entRes.text();
        throw new Error(errText || 'save_entitlement failed');
      }

      // Step 3: POST Xano sync_course
      const syncRes = await fetch(`${XANO_URL}/sync_course`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strapi_document_id: docId,
          title,
          category: categoryName,
          visibility_level: visibilityMap[selectedVisibility] || 'public',
          grades: selectedGrades,
          is_published: true,
        }),
      });
      if (!syncRes.ok) {
        const errText = await syncRes.text();
        throw new Error(errText || 'sync_course failed');
      }

      showToast('Entitlement saved successfully.');
    } catch (e: any) {
      showToast(e?.message ?? 'Failed to save.', true);
    } finally {
      setSaving(false);
    }
  }

  const courseTitle = selectedCourse ? (getCourseAttr(selectedCourse, 'title') ?? 'Untitled') : '';
  const courseCategory = selectedCourse ? (() => {
    const cat = getCourseAttr(selectedCourse, 'category');
    const data = cat?.data ?? cat;
    return data?.name ?? data?.attributes?.name ?? '—';
  })() : '—';
  const courseVisibility = selectedCourse ? (getCourseAttr(selectedCourse, 'user_type_visibility') ?? 'all') : 'all';

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'row', height: 'calc(100vh - 120px)', background: '#fff' }}>
        {/* LEFT PANEL — Content Library */}
        <div style={{ width: 300, borderRight: '1px solid #e8ecf0', display: 'flex', flexDirection: 'column', background: '#fff' }}>
          <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #e8ecf0' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1a202c', marginBottom: 12 }}>Content Library</div>
            <div style={{ display: 'flex', gap: 4 }}>
              {(['courses', 'workshops', 'bytes', 'practice'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  style={{
                    flex: 1,
                    padding: '8px 6px',
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: 'capitalize',
                    border: '1px solid #e8ecf0',
                    background: activeTab === tab ? '#1e2235' : '#fff',
                    color: activeTab === tab ? '#fff' : '#718096',
                    cursor: 'pointer',
                    borderRadius: 4,
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          {activeTab !== 'courses' && (
            <div style={{ padding: 24, color: '#718096', fontSize: 13, textAlign: 'center' }}>Coming Soon</div>
          )}
          {activeTab === 'courses' && (
            <>
              <input
                type="text"
                placeholder="Search courses..."
                value={courseSearch}
                onChange={(e) => setCourseSearch(e.target.value)}
                style={{ margin: '0 12px 12px', padding: '8px 12px', border: '1px solid #e8ecf0', borderRadius: 6, fontSize: 13 }}
              />
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {filteredCourses.map((c) => {
                  const id = c.documentId ?? c.id;
                  const isSelected = selectedCourse && (selectedCourse.documentId ?? selectedCourse.id) === id;
                  const cat = getCourseAttr(c, 'category');
                  const catData = cat?.data ?? cat;
                  const catName = catData?.name ?? catData?.attributes?.name ?? '—';
                  const vis = getCourseAttr(c, 'user_type_visibility') ?? 'all';
                  return (
                    <div
                      key={id}
                      onClick={() => setSelectedCourse(c)}
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #f0f0f0',
                        cursor: 'pointer',
                        background: isSelected ? '#1e2235' : 'transparent',
                        color: isSelected ? '#fff' : '#2d3748',
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{getCourseAttr(c, 'title') ?? 'Untitled'}</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, opacity: isSelected ? 0.9 : 0.8 }}>{catName}</span>
                        <VisibilityBadge vis={vis} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* RIGHT PANEL — Mapping configuration */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#f8f9fa', position: 'relative' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: 24, paddingBottom: 80 }}>
            {!selectedCourse ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 280, color: '#718096', fontSize: 14 }}>
                ← Select content to configure entitlements
              </div>
            ) : (
              <>
                {/* SECTION 1 — Content Info */}
                <div style={{ marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid #f0f0f0' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#718096', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 12 }}>Content Info</div>
                  <div style={{ background: '#f7fafc', border: '1px solid #e8ecf0', borderRadius: 8, padding: 16 }}>
                    <div style={{ fontSize: 14, color: '#4a5568', marginBottom: 4 }}><strong>Title:</strong> {courseTitle}</div>
                    <div style={{ fontSize: 14, color: '#4a5568', marginBottom: 4 }}><strong>Category:</strong> {courseCategory}</div>
                    <div style={{ fontSize: 14, color: '#4a5568' }}><strong>Current visibility:</strong> <VisibilityBadge vis={courseVisibility} /></div>
                  </div>
                </div>

                {/* SECTION 2 — Grade Assignment */}
                <div style={{ marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid #f0f0f0' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#718096', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 12 }}>Grade Assignment</div>
                  <div style={{ marginBottom: 8, fontSize: 14, color: '#2d3748' }}>Which grades can access this?</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                    {GRADES.map((g) => {
                      const sel = selectedGrades.includes(g);
                      return (
                        <button
                          key={g}
                          type="button"
                          onClick={() => toggleGrade(g)}
                          style={{
                            padding: '12px 16px',
                            fontSize: 14,
                            fontWeight: 500,
                            border: `1px solid ${sel ? '#1e2235' : '#e8ecf0'}`,
                            background: sel ? '#1e2235' : '#fff',
                            color: sel ? '#fff' : '#2d3748',
                            cursor: 'pointer',
                            borderRadius: 6,
                          }}
                        >
                          Grade {g}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* SECTION 3 — Subscription Access */}
                <div style={{ marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid #f0f0f0' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#718096', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 12 }}>Subscription Access</div>
                  <div style={{ marginBottom: 12, fontSize: 14, color: '#2d3748' }}>Who can access this content?</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      { value: 'all', label: 'ALL USERS', sub: 'Free + School + Premium + Ultra' },
                      { value: 'premium_ultra', label: 'PREMIUM & ULTRA', sub: 'Paying subscribers only' },
                      { value: 'ultra_only', label: 'ULTRA ONLY', sub: 'Exclusive content' },
                    ].map((opt) => {
                      const sel = selectedVisibility === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setSelectedVisibility(opt.value)}
                          style={{
                            padding: 14,
                            textAlign: 'left',
                            border: `2px solid ${sel ? '#1e2235' : '#e8ecf0'}`,
                            background: sel ? '#f8f9ff' : '#fff',
                            borderRadius: 8,
                            cursor: 'pointer',
                          }}
                        >
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#1a202c' }}>{opt.label}</div>
                          <div style={{ fontSize: 12, color: '#718096', marginTop: 2 }}>{opt.sub}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* SECTION 4 — School Assignment */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#718096', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 12 }}>School Assignment (Optional)</div>
                  <div style={{ marginBottom: 8, fontSize: 14, color: '#2d3748' }}>Restrict to specific school?</div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                      <input type="radio" name="schoolMode" checked={schoolMode === 'all'} onChange={() => setSchoolMode('all')} />
                      <span>All Schools</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                      <input type="radio" name="schoolMode" checked={schoolMode === 'specific'} onChange={() => setSchoolMode('specific')} />
                      <span>Specific School</span>
                    </label>
                  </div>
                  {schoolMode === 'specific' && (
                    <select
                      value={selectedSchool}
                      onChange={(e) => setSelectedSchool(e.target.value)}
                      style={{ width: '100%', maxWidth: 320, padding: '10px 12px', border: '1px solid #e8ecf0', borderRadius: 6, fontSize: 14 }}
                    >
                      <option value="">Select school</option>
                      {schools.map((s) => (
                        <option key={s.id ?? s.documentId} value={String(s.id ?? s.documentId ?? '')}>{s.name ?? s.id}</option>
                      ))}
                    </select>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Save button — fixed bottom right of right panel */}
          {selectedCourse && (
            <div style={{ position: 'absolute', bottom: 0, right: 0, padding: 16 }}>
              <button
                type="button"
                onClick={onSave}
                disabled={saving}
                style={{
                  background: '#1e2235',
                  color: '#fff',
                  padding: '12px 32px',
                  borderRadius: 6,
                  border: 'none',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                {saving ? 'Saving...' : 'Save Entitlement'}
              </button>
            </div>
          )}
        </div>
      </div>

      {toast.show && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 9999,
            background: toast.isError ? '#e53e3e' : '#38a169',
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
