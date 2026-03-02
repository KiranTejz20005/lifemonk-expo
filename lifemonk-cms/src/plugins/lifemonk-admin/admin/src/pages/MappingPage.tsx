/**
 * Mapping Page — 3-step flow: WHO (users to map) → WHAT (assets) → Save to Mapping collection.
 * Uses Strapi Mapping API. One mapping entry per asset per user group.
 */
import React, { useState, useEffect } from 'react';
import { STRAPI_URL, XANO_URL } from '../constants';

type WhoOption = 'subscription' | 'users_filter' | 'school' | 'grade' | 'school_grade';
const SUBSCRIPTION_TYPES = ['all', 'basic', 'premium', 'ultra', 'school'] as const;
const GRADES = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const ASSET_TYPES = [
  { key: 'course', label: 'Courses', api: '/api/courses' },
  { key: 'workshop', label: 'Workshops', api: '' },
  { key: 'byte', label: 'Bytes', api: '' },
  { key: 'quiz', label: 'Quizzes', api: '/api/quizzes' },
] as const;

function getAttr(item: any, key: string): any {
  if (item?.attributes?.[key] !== undefined) return item.attributes[key];
  return item?.[key];
}

function getDocId(item: any): string | number {
  return item?.documentId ?? item?.id ?? '';
}

export default function MappingPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 — WHO
  const [whoOption, setWhoOption] = useState<WhoOption>('subscription');
  const [subscriptionType, setSubscriptionType] = useState<string>('all');
  const [userFilterLimit, setUserFilterLimit] = useState<string>('250');
  const [schools, setSchools] = useState<any[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<string>('');
  const [selectedGrades, setSelectedGrades] = useState<number[]>([]);
  const [selectedSchoolGrade, setSelectedSchoolGrade] = useState<string>('');
  const [selectedGradesCombo, setSelectedGradesCombo] = useState<number[]>([]);

  // Step 2 — WHAT
  const [selectedAssetType, setSelectedAssetType] = useState<string>('course');
  const [courses, setCourses] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [selectedCourseIds, setSelectedCourseIds] = useState<Set<string | number>>(new Set());
  const [selectedQuizIds, setSelectedQuizIds] = useState<Set<string | number>>(new Set());
  const [workshops, setWorkshops] = useState<any[]>([]);
  const [bytes, setBytes] = useState<any[]>([]);

  // Step 3 — Save
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', isError: false });

  const baseUrl = typeof STRAPI_URL === 'string' && STRAPI_URL ? STRAPI_URL : '';

  useEffect(() => {
    if (!baseUrl) return;
    fetch(`${baseUrl}/api/courses?pagination[pageSize]=200&populate=category`)
      .then((r) => r.json())
      .then((d) => setCourses(Array.isArray(d?.data) ? d.data : d?.data?.data ?? []))
      .catch(() => setCourses([]));
    fetch(`${baseUrl}/api/quizzes?pagination[pageSize]=200`)
      .then((r) => r.json())
      .then((d) => setQuizzes(Array.isArray(d?.data) ? d.data : d?.data?.data ?? []))
      .catch(() => setQuizzes([]));
  }, [baseUrl]);

  useEffect(() => {
    if (XANO_URL) {
      fetch(`${XANO_URL}/get_all_schools`)
        .then((r) => r.json())
        .then((d) => setSchools(Array.isArray(d) ? d : []))
        .catch(() => setSchools([]));
    }
  }, []);

  function showToast(msg: string, isError = false) {
    setToast({ show: true, message: msg, isError });
    setTimeout(() => setToast({ show: false, message: '', isError: false }), 4000);
  }

  function toggleCourse(id: string | number) {
    setSelectedCourseIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleQuiz(id: string | number) {
    setSelectedQuizIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleGradeCombo(g: number) {
    setSelectedGradesCombo((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );
  }

  function buildWhoSummary(): string {
    if (whoOption === 'subscription') return `Subscription: ${subscriptionType}`;
    if (whoOption === 'users_filter') return `Filter: ${userFilterLimit} users (e.g. premium)`;
    if (whoOption === 'school') return `School: ${selectedSchool || '—'}`;
    if (whoOption === 'grade') return `Grades: ${selectedGrades.length ? selectedGrades.join(', ') : '—'}`;
    if (whoOption === 'school_grade') return `School: ${selectedSchoolGrade || '—'}, Grades: ${selectedGradesCombo.join(', ') || '—'}`;
    return '—';
  }

  function getSelectedAssets(): { asset_type: string; asset_id: number; asset_name: string }[] {
    const out: { asset_type: string; asset_id: number; asset_name: string }[] = [];
    if (selectedAssetType === 'course' || selectedCourseIds.size) {
      courses.forEach((c) => {
        const id = getDocId(c);
        if (!selectedCourseIds.has(id)) return;
        const numId = typeof id === 'number' ? id : parseInt(String(id), 10);
        if (!Number.isNaN(numId)) out.push({ asset_type: 'course', asset_id: numId, asset_name: getAttr(c, 'title') ?? 'Course' });
      });
    }
    if (selectedAssetType === 'quiz' || selectedQuizIds.size) {
      quizzes.forEach((q) => {
        const id = getDocId(q);
        if (!selectedQuizIds.has(id)) return;
        const numId = typeof id === 'number' ? id : parseInt(String(id), 10);
        if (!Number.isNaN(numId)) out.push({ asset_type: 'quiz', asset_id: numId, asset_name: getAttr(q, 'title') ?? 'Quiz' });
      });
    }
    return out;
  }

  async function handleSave() {
    const assets = getSelectedAssets();
    if (!assets.length) {
      showToast('Select at least one asset (Step 2).', true);
      return;
    }
    setSaving(true);
    try {
      const subscription = subscriptionType;
      const gradesToSave: number[] = whoOption === 'grade' ? selectedGrades : whoOption === 'school_grade' ? selectedGradesCombo : [];
      const schoolName = whoOption === 'school' ? selectedSchool : whoOption === 'school_grade' ? selectedSchoolGrade : null;
      const singleGrade = gradesToSave.length ? null : (whoOption === 'grade' && selectedGrades.length ? selectedGrades[0] : whoOption === 'school_grade' && selectedGradesCombo.length ? selectedGradesCombo[0] : null);

      let created = 0;
      for (const asset of assets) {
        const gradeList = gradesToSave.length ? gradesToSave : singleGrade != null ? [singleGrade] : [null];
        for (const g of gradeList) {
          const res = await fetch(`${baseUrl}/api/mappings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              data: {
                asset_type: asset.asset_type,
                asset_id: asset.asset_id,
                asset_name: asset.asset_name,
                subscription_type: subscription,
                grade: g ?? undefined,
                school_name: schoolName ?? undefined,
                is_active: true,
              },
            },
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error((err as any)?.error?.message ?? `Failed to create mapping for ${asset.asset_name}`);
          }
          created++;
        }
      }
      showToast(`Saved ${created} mapping(s) successfully.`);
      setStep(1);
      setSelectedCourseIds(new Set());
      setSelectedQuizIds(new Set());
    } catch (e: any) {
      showToast(e?.message ?? 'Failed to save mappings.', true);
    } finally {
      setSaving(false);
    }
  }

  const selectedCount = selectedCourseIds.size + selectedQuizIds.size;

  return (
    <div style={{ padding: 32, maxWidth: 960, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Mapping</h1>
      <p style={{ fontSize: 14, color: '#718096', marginBottom: 24 }}>
        Map assets (courses, workshops, etc.) to users by subscription, grade, or school.
      </p>

      {/* Step indicator */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
        {([1, 2, 3] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStep(s)}
            style={{
              padding: '10px 20px',
              border: `2px solid ${step === s ? '#4945ff' : '#e8ecf0'}`,
              background: step === s ? '#4945ff' : '#fff',
              color: step === s ? '#fff' : '#32324d',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Step {s} {s === 1 ? '— Who' : s === 2 ? '— What' : '— Save'}
          </button>
        ))}
      </div>

      {/* Step 1: WHO */}
      {step === 1 && (
        <div style={{ background: '#fff', border: '1px solid #e8ecf0', borderRadius: 12, padding: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Select who to map (users)</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
            {[
              { value: 'subscription' as const, label: 'All users of a subscription type', sub: 'all / basic / premium / ultra' },
              { value: 'users_filter' as const, label: 'Filter specific users', sub: 'e.g. first 250 premium users' },
              { value: 'school' as const, label: 'Select a school', sub: 'Dropdown of schools' },
              { value: 'grade' as const, label: 'Select by grade', sub: 'Grade 5, 9, etc.' },
              { value: 'school_grade' as const, label: 'School + Grade', sub: 'e.g. Delhi School + Grade 5 and 9' },
            ].map((opt) => (
              <label key={opt.value} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="who"
                  checked={whoOption === opt.value}
                  onChange={() => setWhoOption(opt.value)}
                />
                <div>
                  <div style={{ fontWeight: 600 }}>{opt.label}</div>
                  <div style={{ fontSize: 12, color: '#718096' }}>{opt.sub}</div>
                </div>
              </label>
            ))}
          </div>

          {whoOption === 'subscription' && (
            <div style={{ marginTop: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Subscription type</label>
              <select
                value={subscriptionType}
                onChange={(e) => setSubscriptionType(e.target.value)}
                style={{ padding: '10px 14px', border: '1px solid #e8ecf0', borderRadius: 8, minWidth: 200 }}
              >
                {SUBSCRIPTION_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          )}
          {whoOption === 'users_filter' && (
            <div style={{ marginTop: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Limit (e.g. 250 premium users)</label>
              <input
                type="text"
                value={userFilterLimit}
                onChange={(e) => setUserFilterLimit(e.target.value)}
                placeholder="250"
                style={{ padding: '10px 14px', border: '1px solid #e8ecf0', borderRadius: 8, width: 120 }}
              />
            </div>
          )}
          {whoOption === 'school' && (
            <div style={{ marginTop: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>School</label>
              <select
                value={selectedSchool}
                onChange={(e) => setSelectedSchool(e.target.value)}
                style={{ padding: '10px 14px', border: '1px solid #e8ecf0', borderRadius: 8, minWidth: 240 }}
              >
                <option value="">Select school</option>
                {schools.map((s) => (
                  <option key={s.id ?? s.documentId} value={String(s.id ?? s.documentId ?? '')}>
                    {s.name ?? s.id ?? '—'}
                  </option>
                ))}
              </select>
            </div>
          )}
          {whoOption === 'grade' && (
            <div style={{ marginTop: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Grades</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {GRADES.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setSelectedGrades((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]))}
                    style={{
                      padding: '8px 14px',
                      border: `1px solid ${selectedGrades.includes(g) ? '#4945ff' : '#e8ecf0'}`,
                      background: selectedGrades.includes(g) ? '#4945ff' : '#fff',
                      color: selectedGrades.includes(g) ? '#fff' : '#32324d',
                      borderRadius: 6,
                      cursor: 'pointer',
                    }}
                  >
                    Grade {g}
                  </button>
                ))}
              </div>
            </div>
          )}
          {whoOption === 'school_grade' && (
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>School</label>
                <select
                  value={selectedSchoolGrade}
                  onChange={(e) => setSelectedSchoolGrade(e.target.value)}
                  style={{ padding: '10px 14px', border: '1px solid #e8ecf0', borderRadius: 8, minWidth: 240 }}
                >
                  <option value="">Select school</option>
                  {schools.map((s) => (
                    <option key={s.id ?? s.documentId} value={String(s.name ?? s.id ?? '')}>
                      {s.name ?? s.id ?? '—'}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Grades</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {GRADES.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => toggleGradeCombo(g)}
                      style={{
                        padding: '8px 14px',
                        border: `1px solid ${selectedGradesCombo.includes(g) ? '#4945ff' : '#e8ecf0'}`,
                        background: selectedGradesCombo.includes(g) ? '#4945ff' : '#fff',
                        color: selectedGradesCombo.includes(g) ? '#fff' : '#32324d',
                        borderRadius: 6,
                        cursor: 'pointer',
                      }}
                    >
                      Grade {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div style={{ marginTop: 24 }}>
            <button
              type="button"
              onClick={() => setStep(2)}
              style={{
                padding: '12px 24px',
                background: '#4945ff',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Next: Select assets →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: WHAT */}
      {step === 2 && (
        <div style={{ background: '#fff', border: '1px solid #e8ecf0', borderRadius: 12, padding: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Select assets to assign</h2>
          <p style={{ fontSize: 13, color: '#718096', marginBottom: 16 }}>You can select multiple courses and quizzes.</p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {ASSET_TYPES.map((a) => (
              <button
                key={a.key}
                type="button"
                onClick={() => setSelectedAssetType(a.key)}
                style={{
                  padding: '8px 16px',
                  border: `1px solid ${selectedAssetType === a.key ? '#4945ff' : '#e8ecf0'}`,
                  background: selectedAssetType === a.key ? '#4945ff' : '#fff',
                  color: selectedAssetType === a.key ? '#fff' : '#32324d',
                  borderRadius: 6,
                  cursor: 'pointer',
                }}
              >
                {a.label}
              </button>
            ))}
          </div>

          {(selectedAssetType === 'course' || selectedAssetType === 'workshop') && (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Courses</h3>
              <div style={{ maxHeight: 280, overflowY: 'auto', border: '1px solid #e8ecf0', borderRadius: 8, padding: 8 }}>
                {courses.length === 0 && <p style={{ color: '#718096', padding: 16 }}>No courses found.</p>}
                {courses.map((c) => {
                  const id = getDocId(c);
                  const checked = selectedCourseIds.has(id);
                  return (
                    <label key={String(id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={checked} onChange={() => toggleCourse(id)} />
                      <span>{getAttr(c, 'title') ?? 'Untitled'}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {(selectedAssetType === 'quiz' || selectedAssetType === 'byte') && (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Quizzes</h3>
              <div style={{ maxHeight: 280, overflowY: 'auto', border: '1px solid #e8ecf0', borderRadius: 8, padding: 8 }}>
                {quizzes.length === 0 && <p style={{ color: '#718096', padding: 16 }}>No quizzes found.</p>}
                {quizzes.map((q) => {
                  const id = getDocId(q);
                  const checked = selectedQuizIds.has(id);
                  return (
                    <label key={String(id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={checked} onChange={() => toggleQuiz(id)} />
                      <span>{getAttr(q, 'title') ?? 'Untitled Quiz'}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {selectedAssetType === 'workshop' && (
            <p style={{ color: '#718096', padding: 16 }}>Workshops collection not configured yet.</p>
          )}
          {selectedAssetType === 'byte' && (
            <p style={{ color: '#718096', padding: 16 }}>Bytes collection not configured yet.</p>
          )}

          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button type="button" onClick={() => setStep(1)} style={{ padding: '12px 24px', border: '1px solid #e8ecf0', background: '#fff', borderRadius: 8, cursor: 'pointer' }}>
              ← Back
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              style={{
                padding: '12px 24px',
                background: '#4945ff',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Next: Save mapping →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Save */}
      {step === 3 && (
        <div style={{ background: '#fff', border: '1px solid #e8ecf0', borderRadius: 12, padding: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Review and save</h2>
          <div style={{ background: '#f6f6f9', padding: 16, borderRadius: 8, marginBottom: 16 }}>
            <div style={{ fontSize: 13, marginBottom: 4 }}><strong>Who:</strong> {buildWhoSummary()}</div>
            <div style={{ fontSize: 13 }}><strong>Assets selected:</strong> {selectedCount} item(s)</div>
            {getSelectedAssets().length > 0 && (
              <ul style={{ marginTop: 8, paddingLeft: 20, fontSize: 13 }}>
                {getSelectedAssets().slice(0, 10).map((a, i) => (
                  <li key={i}>{a.asset_name} ({a.asset_type})</li>
                ))}
                {getSelectedAssets().length > 10 && <li>... and {getSelectedAssets().length - 10} more</li>}
              </ul>
            )}
          </div>
          <p style={{ fontSize: 13, color: '#718096', marginBottom: 20 }}>
            This will create one mapping entry per selected asset in the Mapping collection.
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button type="button" onClick={() => setStep(2)} style={{ padding: '12px 24px', border: '1px solid #e8ecf0', background: '#fff', borderRadius: 8, cursor: 'pointer' }}>
              ← Back
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || selectedCount === 0}
              style={{
                padding: '12px 24px',
                background: selectedCount === 0 || saving ? '#c0c0cf' : '#4945ff',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                cursor: selectedCount === 0 || saving ? 'not-allowed' : 'pointer',
                fontWeight: 600,
              }}
            >
              {saving ? 'Saving...' : 'Save mapping'}
            </button>
          </div>
        </div>
      )}

      {toast.show && (
        <div
          style={{
            position: 'fixed',
            top: 24,
            right: 24,
            zIndex: 9999,
            background: toast.isError ? '#ee5e52' : '#328048',
            color: '#fff',
            padding: '14px 20px',
            borderRadius: 8,
            fontSize: 14,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
