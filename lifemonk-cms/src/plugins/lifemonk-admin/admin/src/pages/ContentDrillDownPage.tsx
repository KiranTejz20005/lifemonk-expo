/**
 * Content drill-down: Category → Courses → Chapters.
 * Single page with table navigation: list categories → click row → list courses under that category → click row → list chapters under that course.
 */
import React, { useState, useEffect } from 'react';
import { STRAPI_URL } from '../constants';

type View = 'categories' | 'courses' | 'chapters';
function getAttr(item: any, key: string): any {
  if (item?.attributes?.[key] !== undefined) return item.attributes[key];
  return item?.[key];
}
function getDocId(item: any): string | number {
  return item?.documentId ?? item?.id ?? '';
}

export default function ContentDrillDownPage() {
  const [view, setView] = useState<View>('categories');
  const [categories, setCategories] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const baseUrl = typeof STRAPI_URL === 'string' && STRAPI_URL ? STRAPI_URL : '';

  useEffect(() => {
    if (!baseUrl) return;
    setLoading(true);
    fetch(`${baseUrl}/api/categories?pagination[pageSize]=100`)
      .then((r) => r.json())
      .then((d) => setCategories(Array.isArray(d?.data) ? d.data : d?.data?.data ?? []))
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, [baseUrl]);

  useEffect(() => {
    if (view !== 'courses' || !selectedCategory || !baseUrl) return;
    const catId = getDocId(selectedCategory);
    setLoading(true);
    fetch(`${baseUrl}/api/courses?filters[category][documentId][$eq]=${encodeURIComponent(String(catId))}&pagination[pageSize]=100&populate=category`)
      .then((r) => r.json())
      .then((d) => setCourses(Array.isArray(d?.data) ? d.data : d?.data?.data ?? []))
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, [view, selectedCategory, baseUrl]);

  useEffect(() => {
    if (view !== 'chapters' || !selectedCourse || !baseUrl) return;
    const courseId = getDocId(selectedCourse);
    setLoading(true);
    fetch(`${baseUrl}/api/chapters?filters[course][documentId][$eq]=${encodeURIComponent(String(courseId))}&pagination[pageSize]=100&sort=order:asc`)
      .then((r) => r.json())
      .then((d) => setChapters(Array.isArray(d?.data) ? d.data : d?.data?.data ?? []))
      .catch(() => setChapters([]))
      .finally(() => setLoading(false));
  }, [view, selectedCourse, baseUrl]);

  function openCourses(cat: any) {
    setSelectedCategory(cat);
    setSelectedCourse(null);
    setView('courses');
  }
  function openChapters(course: any) {
    setSelectedCourse(course);
    setView('chapters');
  }
  function backToCategories() {
    setView('categories');
    setSelectedCategory(null);
    setSelectedCourse(null);
    setCourses([]);
    setChapters([]);
  }
  function backToCourses() {
    setView('courses');
    setSelectedCourse(null);
    setChapters([]);
  }

  const breadcrumb = [
    view === 'categories' && 'Categories',
    view === 'courses' && selectedCategory && (getAttr(selectedCategory, 'name') ?? 'Category'),
    view === 'chapters' && selectedCourse && (getAttr(selectedCourse, 'title') ?? 'Course'),
  ].filter(Boolean);

  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Content</h1>
      <p style={{ fontSize: 14, color: '#718096', marginBottom: 24 }}>
        Drill down: Categories → Courses → Chapters
      </p>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={backToCategories}
          style={{
            padding: '6px 12px',
            border: '1px solid #e8ecf0',
            background: '#fff',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          Categories
        </button>
        {view !== 'categories' && (
          <>
            <span style={{ color: '#8e8ea9' }}>/</span>
            <button
              type="button"
              onClick={view === 'chapters' ? backToCourses : undefined}
              style={{
                padding: '6px 12px',
                border: 'none',
                background: 'transparent',
                cursor: view === 'chapters' ? 'pointer' : 'default',
                fontSize: 13,
                color: view === 'chapters' ? '#4945ff' : '#32324d',
                fontWeight: view === 'courses' ? 600 : 400,
              }}
            >
              {selectedCategory ? (getAttr(selectedCategory, 'name') ?? 'Category') : '—'}
            </button>
          </>
        )}
        {view === 'chapters' && (
          <>
            <span style={{ color: '#8e8ea9' }}>/</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{selectedCourse ? (getAttr(selectedCourse, 'title') ?? 'Course') : '—'}</span>
          </>
        )}
      </div>

      {loading && (
        <p style={{ color: '#718096', marginBottom: 16 }}>Loading…</p>
      )}

      {/* Table: Categories */}
      {view === 'categories' && !loading && (
        <div style={{ background: '#fff', border: '1px solid #e8ecf0', borderRadius: 8, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f6f6f9' }}>
              <tr>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#8e8ea9', textTransform: 'uppercase' }}>Name</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#8e8ea9', textTransform: 'uppercase' }}>Visibility</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#8e8ea9', textTransform: 'uppercase' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ padding: 40, textAlign: 'center', color: '#718096' }}>No categories</td>
                </tr>
              )}
              {categories.map((c) => (
                <tr key={getDocId(c)} style={{ borderTop: '1px solid #e8ecf0' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 500 }}>{getAttr(c, 'name') ?? '—'}</td>
                  <td style={{ padding: '14px 16px', color: '#666' }}>{getAttr(c, 'visibility') ?? 'all'}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <button
                      type="button"
                      onClick={() => openCourses(c)}
                      style={{
                        padding: '6px 14px',
                        background: '#4945ff',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 13,
                      }}
                    >
                      View courses →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Table: Courses */}
      {view === 'courses' && !loading && (
        <div style={{ background: '#fff', border: '1px solid #e8ecf0', borderRadius: 8, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f6f6f9' }}>
              <tr>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#8e8ea9', textTransform: 'uppercase' }}>Course title</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#8e8ea9', textTransform: 'uppercase' }}>Visibility</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#8e8ea9', textTransform: 'uppercase' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {courses.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ padding: 40, textAlign: 'center', color: '#718096' }}>No courses in this category</td>
                </tr>
              )}
              {courses.map((c) => (
                <tr key={getDocId(c)} style={{ borderTop: '1px solid #e8ecf0' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 500 }}>{getAttr(c, 'title') ?? '—'}</td>
                  <td style={{ padding: '14px 16px', color: '#666' }}>{getAttr(c, 'user_type_visibility') ?? 'all'}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <button
                      type="button"
                      onClick={() => openChapters(c)}
                      style={{
                        padding: '6px 14px',
                        background: '#4945ff',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 13,
                      }}
                    >
                      View chapters →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Table: Chapters */}
      {view === 'chapters' && !loading && (
        <div style={{ background: '#fff', border: '1px solid #e8ecf0', borderRadius: 8, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f6f6f9' }}>
              <tr>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#8e8ea9', textTransform: 'uppercase' }}>Order</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#8e8ea9', textTransform: 'uppercase' }}>Chapter title</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#8e8ea9', textTransform: 'uppercase' }}>Type</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#8e8ea9', textTransform: 'uppercase' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {chapters.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: 40, textAlign: 'center', color: '#718096' }}>No chapters in this course</td>
                </tr>
              )}
              {chapters.map((ch) => (
                <tr key={getDocId(ch)} style={{ borderTop: '1px solid #e8ecf0' }}>
                  <td style={{ padding: '14px 16px' }}>{getAttr(ch, 'order') ?? '—'}</td>
                  <td style={{ padding: '14px 16px', fontWeight: 500 }}>{getAttr(ch, 'title') ?? '—'}</td>
                  <td style={{ padding: '14px 16px', color: '#666' }}>{getAttr(ch, 'chapter_type') ?? '—'}</td>
                  <td style={{ padding: '14px 16px' }}>
                    {getAttr(ch, 'is_active') !== false ? (
                      <span style={{ color: '#328048' }}>Active</span>
                    ) : (
                      <span style={{ color: '#8e8ea9' }}>Inactive</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
