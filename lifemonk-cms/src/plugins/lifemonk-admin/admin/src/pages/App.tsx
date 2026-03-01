import React, { useState } from 'react';
import DashboardPage from './DashboardPage';
import CoursesPage from './CoursesPage';
import CategoriesPage from './CategoriesPage';
import StudentsPage from './StudentsPage';
import SchoolsPage from './SchoolsPage';
import CourseMappingPage from './CourseMappingPage';
import SettingsPage from './SettingsPage';

export const App = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarExpanded, setSidebarExpanded] = useState({
    content: true,
    users: true,
  });

  const sidebarStyle: React.CSSProperties = {
    position: 'fixed',
    left: 0,
    top: 0,
    bottom: 0,
    width: 240,
    background: '#1e2235',
    color: '#8892a4',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 100,
  };

  const mainStyle: React.CSSProperties = {
    marginLeft: 240,
    background: '#f4f6f8',
    minHeight: '100vh',
    padding: 24,
  };

  const navItemStyle = (active: boolean): React.CSSProperties => ({
    display: 'block',
    padding: '10px 24px',
    color: active ? '#1e2235' : '#8892a4',
    textDecoration: 'none',
    fontSize: 14,
    cursor: 'pointer',
    background: active ? '#fff' : 'transparent',
    borderRadius: 6,
    margin: '0 12px',
    fontWeight: active ? 600 : 400,
  });

  const navItemHoverStyle = (active: boolean): React.CSSProperties =>
    active ? {} : { background: 'rgba(255,255,255,0.05)' };

  return (
    <div style={{ display: 'flex' }}>
      <aside style={sidebarStyle}>
        <div style={{ padding: 24, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 4 }}>LifeMonk Admin</div>
          <div style={{ color: '#8892a4', fontSize: 11 }}>Course Management System</div>
        </div>
        <nav style={{ flex: 1, padding: '16px 0', overflowY: 'auto' }}>
          <div
            style={navItemStyle(currentPage === 'dashboard')}
            onClick={() => setCurrentPage('dashboard')}
            onMouseEnter={(e) => !(currentPage === 'dashboard') && (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = currentPage === 'dashboard' ? '#fff' : 'transparent')}
          >
            ▦ Dashboard
          </div>
          <div style={{ marginTop: 4 }}>
            <div
              style={{ ...navItemStyle(false), marginBottom: 0 }}
              onClick={() => setSidebarExpanded((s) => ({ ...s, content: !s.content }))}
            >
              {sidebarExpanded.content ? '▼' : '▶'} Content Manager
            </div>
            {sidebarExpanded.content && (
              <>
                <div
                  style={{ ...navItemStyle(currentPage === 'courses'), marginLeft: 20 }}
                  onClick={() => setCurrentPage('courses')}
                >
                  ▣ Courses
                </div>
                <div
                  style={{ ...navItemStyle(currentPage === 'categories'), marginLeft: 20 }}
                  onClick={() => setCurrentPage('categories')}
                >
                  ⊞ Categories
                </div>
              </>
            )}
          </div>
          <div style={{ marginTop: 4 }}>
            <div
              style={{ ...navItemStyle(false), marginBottom: 0 }}
              onClick={() => setSidebarExpanded((s) => ({ ...s, users: !s.users }))}
            >
              {sidebarExpanded.users ? '▼' : '▶'} User Management
            </div>
            {sidebarExpanded.users && (
              <>
                <div
                  style={{ ...navItemStyle(currentPage === 'students'), marginLeft: 20 }}
                  onClick={() => setCurrentPage('students')}
                >
                  ◎ Students
                </div>
                <div
                  style={{ ...navItemStyle(currentPage === 'schools'), marginLeft: 20 }}
                  onClick={() => setCurrentPage('schools')}
                >
                  ⬡ Schools
                </div>
              </>
            )}
          </div>
          <div
            style={navItemStyle(currentPage === 'course-mapping')}
            onClick={() => setCurrentPage('course-mapping')}
          >
            ⟷ Course Mapping
          </div>
          <div
            style={navItemStyle(currentPage === 'settings')}
            onClick={() => setCurrentPage('settings')}
          >
            ⚙ Settings
          </div>
        </nav>
        <div style={{ padding: 16, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, background: '#3a4155', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14 }}>
            A
          </div>
          <div>
            <div style={{ color: '#fff', fontSize: 13 }}>Admin User</div>
            <div style={{ color: '#8892a4', fontSize: 11 }}>Super Admin</div>
          </div>
        </div>
      </aside>
      <main style={mainStyle}>
        {currentPage === 'dashboard' && <DashboardPage setCurrentPage={setCurrentPage} />}
        {currentPage === 'courses' && <CoursesPage setCurrentPage={setCurrentPage} />}
        {currentPage === 'categories' && <CategoriesPage setCurrentPage={setCurrentPage} />}
        {currentPage === 'students' && <StudentsPage setCurrentPage={setCurrentPage} />}
        {currentPage === 'schools' && <SchoolsPage setCurrentPage={setCurrentPage} />}
        {currentPage === 'course-mapping' && <CourseMappingPage setCurrentPage={setCurrentPage} />}
        {currentPage === 'settings' && <SettingsPage setCurrentPage={setCurrentPage} />}
      </main>
    </div>
  );
};

export default App;
