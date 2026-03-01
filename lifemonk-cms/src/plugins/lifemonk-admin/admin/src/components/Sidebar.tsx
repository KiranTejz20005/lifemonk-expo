import React from 'react';

type SidebarProps = {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  sidebarExpanded: { content: boolean; users: boolean };
  setSidebarExpanded: React.Dispatch<React.SetStateAction<{ content: boolean; users: boolean }>>;
};

export default function Sidebar({ currentPage, setCurrentPage, sidebarExpanded, setSidebarExpanded }: SidebarProps) {
  return (
    <aside style={{ position: 'fixed', left: 0, top: 0, bottom: 0, width: 240, background: '#1e2235', color: '#8892a4', display: 'flex', flexDirection: 'column', zIndex: 100 }}>
      <div style={{ padding: 24, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 4 }}>LifeMonk Admin</div>
        <div style={{ color: '#8892a4', fontSize: 11 }}>Course Management System</div>
      </div>
      <nav style={{ flex: 1, padding: '16px 0', overflowY: 'auto' }}>
        <div onClick={() => setCurrentPage('dashboard')} style={{ display: 'block', padding: '10px 24px', margin: '0 12px', cursor: 'pointer', fontSize: 14, background: currentPage === 'dashboard' ? '#fff' : 'transparent', color: currentPage === 'dashboard' ? '#1e2235' : '#8892a4', borderRadius: 6, fontWeight: currentPage === 'dashboard' ? 600 : 400 }}>▦ Dashboard</div>
        <div onClick={() => setSidebarExpanded((s) => ({ ...s, content: !s.content }))} style={{ display: 'block', padding: '10px 24px', margin: '0 12px', cursor: 'pointer', fontSize: 14, color: '#8892a4' }}>{sidebarExpanded.content ? '▼' : '▶'} Content Manager</div>
        {sidebarExpanded.content && (
          <>
            <div onClick={() => setCurrentPage('courses')} style={{ display: 'block', padding: '10px 24px', marginLeft: 20, cursor: 'pointer', fontSize: 14, background: currentPage === 'courses' ? '#fff' : 'transparent', color: currentPage === 'courses' ? '#1e2235' : '#8892a4', borderRadius: 6, fontWeight: currentPage === 'courses' ? 600 : 400 }}>▣ Courses</div>
            <div onClick={() => setCurrentPage('categories')} style={{ display: 'block', padding: '10px 24px', marginLeft: 20, cursor: 'pointer', fontSize: 14, background: currentPage === 'categories' ? '#fff' : 'transparent', color: currentPage === 'categories' ? '#1e2235' : '#8892a4', borderRadius: 6, fontWeight: currentPage === 'categories' ? 600 : 400 }}>⊞ Categories</div>
          </>
        )}
        <div onClick={() => setSidebarExpanded((s) => ({ ...s, users: !s.users }))} style={{ display: 'block', padding: '10px 24px', margin: '0 12px', cursor: 'pointer', fontSize: 14, color: '#8892a4' }}>{sidebarExpanded.users ? '▼' : '▶'} User Management</div>
        {sidebarExpanded.users && (
          <>
            <div onClick={() => setCurrentPage('students')} style={{ display: 'block', padding: '10px 24px', marginLeft: 20, cursor: 'pointer', fontSize: 14, background: currentPage === 'students' ? '#fff' : 'transparent', color: currentPage === 'students' ? '#1e2235' : '#8892a4', borderRadius: 6, fontWeight: currentPage === 'students' ? 600 : 400 }}>◎ Students</div>
            <div onClick={() => setCurrentPage('schools')} style={{ display: 'block', padding: '10px 24px', marginLeft: 20, cursor: 'pointer', fontSize: 14, background: currentPage === 'schools' ? '#fff' : 'transparent', color: currentPage === 'schools' ? '#1e2235' : '#8892a4', borderRadius: 6, fontWeight: currentPage === 'schools' ? 600 : 400 }}>⬡ Schools</div>
          </>
        )}
        <div onClick={() => setCurrentPage('course-mapping')} style={{ display: 'block', padding: '10px 24px', margin: '0 12px', cursor: 'pointer', fontSize: 14, background: currentPage === 'course-mapping' ? '#fff' : 'transparent', color: currentPage === 'course-mapping' ? '#1e2235' : '#8892a4', borderRadius: 6, fontWeight: currentPage === 'course-mapping' ? 600 : 400 }}>⟷ Course Mapping</div>
        <div onClick={() => setCurrentPage('settings')} style={{ display: 'block', padding: '10px 24px', margin: '0 12px', cursor: 'pointer', fontSize: 14, background: currentPage === 'settings' ? '#fff' : 'transparent', color: currentPage === 'settings' ? '#1e2235' : '#8892a4', borderRadius: 6, fontWeight: currentPage === 'settings' ? 600 : 400 }}>⚙ Settings</div>
      </nav>
      <div style={{ padding: 16, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, background: '#3a4155', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14 }}>A</div>
        <div>
          <div style={{ color: '#fff', fontSize: 13 }}>Admin User</div>
          <div style={{ color: '#8892a4', fontSize: 11 }}>Super Admin</div>
        </div>
      </div>
    </aside>
  );
}
