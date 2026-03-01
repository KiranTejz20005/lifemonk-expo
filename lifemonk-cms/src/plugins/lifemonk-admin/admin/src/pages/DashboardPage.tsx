import React, { useState, useEffect } from 'react';
import { STRAPI_URL, XANO_URL } from '../constants';

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return mins + 'm ago';
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + 'h ago';
  return Math.floor(hrs / 24) + 'd ago';
}

export default function DashboardPage({ setCurrentPage }: { setCurrentPage: (p: string) => void }) {
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeCourses: 0,
    partnerSchools: 0,
    totalCategories: 0,
  });
  const [subscriptionBreakdown, setSubscriptionBreakdown] = useState({
    school: 0,
    premium: 0,
    ultra: 0,
  });
  const [recentCourses, setRecentCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetch(`${STRAPI_URL}/api/courses?pagination[pageSize]=1`).then((r) => r.json()).catch(() => ({ meta: { pagination: { total: 0 } } })),
      fetch(`${STRAPI_URL}/api/categories?pagination[pageSize]=1`).then((r) => r.json()).catch(() => ({ meta: { pagination: { total: 0 } } })),
      fetch(`${XANO_URL}/get_all_users`).then((r) => r.json()).catch(() => []),
      fetch(`${XANO_URL}/get_all_schools`).then((r) => r.json()).catch(() => []),
      fetch(`${STRAPI_URL}/api/courses?sort=createdAt:desc&pagination[pageSize]=5`).then((r) => r.json()).catch(() => ({ data: [] })),
    ])
      .then(([coursesRes, categoriesRes, users, schools, recentRes]) => {
        if (cancelled) return;
        const coursesTotal = coursesRes?.meta?.pagination?.total ?? 0;
        const categoriesTotal = categoriesRes?.meta?.pagination?.total ?? 0;
        const userList = Array.isArray(users) ? users : [];
        const schoolList = Array.isArray(schools) ? schools : [];
        const recent = recentRes?.data ?? [];
        const breakdown = { school: 0, premium: 0, ultra: 0 };
        userList.forEach((u: any) => {
          const t = (u.user_type || u.userType || '').toString().toLowerCase();
          if (t === 'school') breakdown.school++;
          else if (t === 'premium') breakdown.premium++;
          else if (t === 'ultra') breakdown.ultra++;
        });
        setStats({
          totalStudents: userList.length,
          activeCourses: coursesTotal,
          partnerSchools: schoolList.length,
          totalCategories: categoriesTotal,
        });
        setSubscriptionBreakdown(breakdown);
        setRecentCourses(Array.isArray(recent) ? recent : []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <div style={{ width: 40, height: 40, border: '3px solid #e8ecf0', borderTopColor: '#1e2235', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  const totalSubs = subscriptionBreakdown.school + subscriptionBreakdown.premium + subscriptionBreakdown.ultra;
  const segment = (n: number) => (totalSubs ? (n / totalSubs) * 100 : 0);

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Dashboard</h1>
      <p style={{ fontSize: 14, color: '#718096', marginBottom: 24 }}>Overview of your education platform</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 24 }}>
        <div style={{ background: '#fff', border: '1px solid #e8ecf0', borderRadius: 8, padding: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#718096', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>TOTAL STUDENTS</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#1a202c', marginBottom: 4 }}>{stats.totalStudents}</div>
          <div style={{ fontSize: 13, color: '#718096' }}>+{subscriptionBreakdown.school} school users</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e8ecf0', borderRadius: 8, padding: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#718096', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>ACTIVE COURSES</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#1a202c', marginBottom: 4 }}>{stats.activeCourses}</div>
          <div style={{ fontSize: 13, color: '#718096' }}>{stats.totalCategories} categories</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e8ecf0', borderRadius: 8, padding: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#718096', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>PARTNER SCHOOLS</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#1a202c', marginBottom: 4 }}>{stats.partnerSchools}</div>
          <div style={{ fontSize: 13, color: '#718096' }}>registered schools</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e8ecf0', borderRadius: 8, padding: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#718096', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>ACTIVE SUBSCRIPTIONS</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#1a202c', marginBottom: 4 }}>{stats.totalStudents}</div>
          <div style={{ fontSize: 13, color: '#718096' }}>{subscriptionBreakdown.ultra} ultra · {subscriptionBreakdown.premium} premium</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'row', gap: 24 }}>
        <div style={{ flex: 1, background: '#fff', border: '1px solid #e8ecf0', borderRadius: 8, padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Subscription Breakdown</h3>
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, background: '#1e2235', display: 'inline-block' }} />
                School Package
              </span>
              <span style={{ background: '#1e2235', color: '#fff', padding: '2px 10px', borderRadius: 20, fontSize: 12 }}>{subscriptionBreakdown.school}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, background: '#4a5568', display: 'inline-block' }} />
                Premium
              </span>
              <span style={{ background: '#4a5568', color: '#fff', padding: '2px 10px', borderRadius: 20, fontSize: 12 }}>{subscriptionBreakdown.premium}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, background: '#718096', display: 'inline-block' }} />
                Ultra
              </span>
              <span style={{ background: '#718096', color: '#fff', padding: '2px 10px', borderRadius: 20, fontSize: 12 }}>{subscriptionBreakdown.ultra}</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: `${segment(subscriptionBreakdown.school)}%`, background: '#1e2235' }} />
            <div style={{ width: `${segment(subscriptionBreakdown.premium)}%`, background: '#4a5568' }} />
            <div style={{ width: `${segment(subscriptionBreakdown.ultra)}%`, background: '#9da8b9' }} />
          </div>
        </div>
        <div style={{ flex: 1, background: '#fff', border: '1px solid #e8ecf0', borderRadius: 8, padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Recent Activity</h3>
          {recentCourses.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#718096', padding: 24 }}>No recent activity yet</div>
          ) : (
            recentCourses.map((c: any) => {
              const title = c.title ?? c.attributes?.title ?? 'Course';
              const createdAt = c.createdAt ?? c.attributes?.createdAt ?? '';
              return (
                <div key={c.documentId ?? c.id ?? Math.random()} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <span>Course &apos;{title}&apos; was created</span>
                  <span style={{ color: '#718096', fontSize: 12 }}>{timeAgo(createdAt)}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
