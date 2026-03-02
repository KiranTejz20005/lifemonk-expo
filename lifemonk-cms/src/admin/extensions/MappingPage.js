import React from 'react';

const getCategoryId = (cat) => cat?.documentId ?? cat?.id ?? '';
const getCategoryName = (cat) => cat?.name ?? cat?.attributes?.name ?? 'Uncategorized';
const getCourseCategoryId = (c) => {
  const cat = c?.category ?? c?.attributes?.category;
  if (typeof cat === 'string' && cat.trim()) return cat.trim();
  const data = cat?.data ?? (typeof cat === 'object' && cat !== null ? cat : null);
  return data ? (data.documentId ?? data.id ?? '') : null;
};
const getCourseTitle = (c) => c?.attributes?.title ?? c?.title ?? 'Untitled';

const MappingPage = () => {
  const [userGroup, setUserGroup] = React.useState('');
  const [selectedGrades, setSelectedGrades] = React.useState([]);
  const [selectedSchools, setSelectedSchools] = React.useState([]);
  const [gradesList, setGradesList] = React.useState([]);
  const [schoolsList, setSchoolsList] = React.useState([]);
  const [schoolsLoading, setSchoolsLoading] = React.useState(false);
  const [gradesOpen, setGradesOpen] = React.useState(false);
  const [schoolsOpen, setSchoolsOpen] = React.useState(false);
  const [categories, setCategories] = React.useState([]);
  const [courses, setCourses] = React.useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = React.useState('');
  const [selectedAssets, setSelectedAssets] = React.useState([]);
  const [userCount, setUserCount] = React.useState(null);
  const [userCountLoading, setUserCountLoading] = React.useState(false);
  const [previewUserCount, setPreviewUserCount] = React.useState(null);
  const [previewUserCountLoading, setPreviewUserCountLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const gradesRef = React.useRef(null);
  const schoolsRef = React.useRef(null);

  React.useEffect(() => {
    const strapiCategoriesPromise = fetch('/api/categories?pagination[pageSize]=100').then(r => r.json()).then(d => d.data || []).catch(() => []);
    const strapiCoursesPromise = fetch('/api/courses?populate=category&pagination[pageSize]=100').then(r => r.json()).then(d => d.data || []).catch(() => []);
    const xanoCategoriesPromise = fetch('/api/mapping-control/xano/categories', { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then(d => (Array.isArray(d) ? d : (d?.data && Array.isArray(d.data) ? d.data : [])))
      .catch(() => []);
    const xanoCoursesPromise = fetch('/api/mapping-control/xano/courses', { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then(d => (Array.isArray(d) ? d : (d?.data && Array.isArray(d.data) ? d.data : [])))
      .catch(() => []);

    Promise.all([strapiCategoriesPromise, strapiCoursesPromise, xanoCategoriesPromise, xanoCoursesPromise]).then(([strapiCats, strapiCrs, xanoCats, xanoCrs]) => {
      const byName = new Map();
      (xanoCats || []).forEach(c => { const n = getCategoryName(c); const id = getCategoryId(c); if (n && !byName.has(n)) byName.set(n, { id, name: n }); });
      (strapiCats || []).forEach(c => { const n = getCategoryName(c); const id = getCategoryId(c); if (n && !byName.has(n)) byName.set(n, { id, name: n }); });
      setCategories(Array.from(byName.values()));
      const allCourses = [...(Array.isArray(strapiCrs) ? strapiCrs : []), ...(Array.isArray(xanoCrs) ? xanoCrs : [])];
      setCourses(allCourses);
    });
  }, []);

  React.useEffect(() => {
    fetch('/api/mapping-control/xano/grades', { credentials: 'include' })
      .then(r => {
        if (!r.ok) return Promise.reject(new Error(r.status));
        return r.json();
      })
      .then(d => setGradesList(Array.isArray(d) ? d : (d && Array.isArray(d.data) ? d.data : [])))
      .catch(() => setGradesList([]));
  }, []);

  React.useEffect(() => {
    if (userGroup !== 'school') {
      setSchoolsList([]);
      return;
    }
    setSchoolsLoading(true);
    fetch('/api/mapping-control/xano/schools', { credentials: 'include' })
      .then(r => {
        if (!r.ok) return Promise.reject(new Error(r.status));
        return r.json();
      })
      .then(d => setSchoolsList(Array.isArray(d) ? d : (d && Array.isArray(d.data) ? d.data : [])))
      .catch(() => setSchoolsList([]))
      .finally(() => setSchoolsLoading(false));
  }, [userGroup]);

  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (gradesRef.current && !gradesRef.current.contains(e.target)) setGradesOpen(false);
      if (schoolsRef.current && !schoolsRef.current.contains(e.target)) setSchoolsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  React.useEffect(() => {
    if (!userGroup || userGroup === 'school') {
      setUserCount(null);
      setUserCountLoading(false);
      return;
    }
    setUserCountLoading(true);
    let url = '/api/users?pagination[pageSize]=1&pagination[page]=1';
    if (userGroup === 'premium') url += '&filters[subscription_type][$eq]=premium';
    else if (userGroup === 'ultra') url += '&filters[subscription_type][$eq]=ultra';
    if (selectedGrades.length > 0) {
      url += selectedGrades.map(g => '&filters[grade][$in][]=' + g).join('');
    }
    fetch(url)
      .then(r => r.json())
      .then(d => {
        const total = d?.meta?.pagination?.total ?? d?.pagination?.total ?? null;
        setUserCount(typeof total === 'number' ? total : null);
      })
      .catch(() => setUserCount(null))
      .finally(() => setUserCountLoading(false));
  }, [userGroup, selectedGrades]);

  React.useEffect(() => {
    if (!userGroup) {
      setPreviewUserCount(null);
      setPreviewUserCountLoading(false);
      return;
    }
    setPreviewUserCountLoading(true);
    const params = new URLSearchParams({ userGroup });
    if (selectedGrades.length) params.set('grades', selectedGrades.join(','));
    if (userGroup === 'school' && selectedSchools.length) params.set('schools', selectedSchools.join(','));
    fetch('/api/mapping-control/xano/user-count?' + params.toString(), { credentials: 'include' })
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(r.status))))
      .then(d => setPreviewUserCount(typeof d?.count === 'number' ? d.count : 0))
      .catch(() => setPreviewUserCount(0))
      .finally(() => setPreviewUserCountLoading(false));
  }, [userGroup, selectedGrades, selectedSchools]);

  const getGradeId = (g) => {
    if (g == null) return null;
    if (typeof g === 'number' || typeof g === 'string') return g;
    return g.id ?? g.number ?? g.level_number ?? null;
  };
  const getGradeSortKey = (g) => {
    if (g == null) return Infinity;
    const id = getGradeId(g);
    if (typeof id === 'number' && Number.isFinite(id)) return id;
    if (typeof id === 'string') {
      const n = parseInt(id, 10);
      if (!Number.isNaN(n)) return n;
    }
    const num = g?.level_number ?? g?.number;
    if (typeof num === 'number' && Number.isFinite(num)) return num;
    return Infinity;
  };
  const getGradeLabel = (g) => {
    if (g == null) return 'Grade';
    if (typeof g === 'string') return g;
    if (typeof g === 'number') return 'Grade ' + g;
    const name = g.name ?? g.attributes?.name;
    if (name != null && String(name).trim()) return String(name).trim();
    const num = g.level_number ?? g.number;
    if (typeof num === 'number') return 'Grade ' + num;
    const id = getGradeId(g);
    return id != null ? 'Grade ' + id : 'Grade';
  };
  const sortedGradesList = React.useMemo(() =>
    [...gradesList].sort((a, b) => getGradeSortKey(a) - getGradeSortKey(b)),
    [gradesList]
  );

  const toggleGrade = (gradeId) => {
    setSelectedGrades(prev => prev.includes(gradeId) ? prev.filter(x => x !== gradeId) : [...prev, gradeId]);
  };
  const gradesSelectAll = () => {
    const ids = gradesList.map(getGradeId);
    setSelectedGrades(selectedGrades.length === ids.length ? [] : ids);
  };
  const toggleSchool = (idOrName) => {
    setSelectedSchools(prev => prev.includes(idOrName) ? prev.filter(x => x !== idOrName) : [...prev, idOrName]);
  };
  const getSchoolId = (s) => {
    if (s == null) return null;
    if (typeof s === 'number' || typeof s === 'string') return s;
    return s.id ?? s.documentId ?? s.name ?? null;
  };
  const getSchoolName = (s) => {
    if (s == null) return 'School';
    if (typeof s === 'string') return s;
    const name = s.name ?? s.attributes?.name;
    if (name != null && String(name).trim()) return String(name).trim();
    const id = getSchoolId(s);
    return id != null ? 'School ' + id : 'School';
  };
  const schoolsSelectAll = () => {
    const ids = schoolsList.map(getSchoolId);
    setSelectedSchools(selectedSchools.length === ids.length ? [] : ids);
  };

  const toggleAsset = (name) => {
    setSelectedAssets(prev =>
      prev.includes(name) ? prev.filter(a => a !== name) : [...prev, name]
    );
  };

  const removeAsset = (name) => {
    setSelectedAssets(prev => prev.filter(a => a !== name));
  };

  const confirm = async () => {
    const gradeVal = selectedGrades.length === 1 ? (Number(selectedGrades[0]) || selectedGrades[0]) : null;
    const schoolVal = userGroup === 'school' ? (selectedSchools.length > 0 ? selectedSchools.join(',') : null) : null;
    for (const asset of selectedAssets) {
      await fetch('/api/mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            asset_type: 'course',
            asset_name: asset,
            asset_id: 1,
            subscription_type: userGroup || 'premium',
            grade: gradeVal,
            school_name: schoolVal,
            is_active: true
          }
        })
      });
    }
    setSuccess(true);
  };

  const coursesByCategory = React.useMemo(() => {
    const map = { uncategorized: [] };
    categories.forEach(cat => { map[getCategoryId(cat)] = []; });
    courses.forEach(c => {
      const catId = getCourseCategoryId(c);
      const key = catId && map[catId] ? catId : 'uncategorized';
      if (!map[key]) map[key] = [];
      map[key].push(c);
    });
    return map;
  }, [categories, courses]);

  const coursesInSelectedCategory = selectedCategoryId ? (coursesByCategory[selectedCategoryId] || []) : [];
  const courseTitlesInCategory = coursesInSelectedCategory.map(c => getCourseTitle(c));
  const selectedCourseTitles = selectedAssets.filter(a => courseTitlesInCategory.includes(a));

  const onCourseMultiChange = (e) => {
    const selected = Array.from(e.target.selectedOptions).map(o => o.value);
    setSelectedAssets(prev => [
      ...prev.filter(a => !courseTitlesInCategory.includes(a)),
      ...selected
    ]);
  };

  const dropdownStyle = {
    width: '100%',
    background: '#ffffff',
    color: '#32324d',
    border: '1px solid #dcdce4',
    borderRadius: 4,
    padding: '0 12px',
    fontSize: 14,
    boxSizing: 'border-box'
  };
  const categorySelectStyle = { ...dropdownStyle, height: 42 };
  const courseSelectStyle = { ...dropdownStyle, height: 120 };

  const pageStyle = {
    padding: 32,
    background: '#f6f6f9',
    minHeight: '100vh',
    maxWidth: 900,
    margin: '0 auto',
    boxSizing: 'border-box'
  };
  const cardStyle = {
    background: '#ffffff',
    borderRadius: 8,
    padding: 32,
    marginBottom: 24,
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    border: '1px solid #dcdce4'
  };
  const headingStyle = { color: '#32324d', fontSize: 20, fontWeight: 700, marginBottom: 24 };
  const labelStyle = { color: '#666687', fontSize: 14, marginBottom: 8, display: 'block', fontWeight: 500 };
  const inputSelectStyle = {
    background: '#ffffff',
    color: '#32324d',
    border: '1px solid #dcdce4',
    borderRadius: 4,
    padding: '0 12px',
    width: '100%',
    maxWidth: 400,
    height: 40,
    fontSize: 14,
    marginBottom: 16,
    boxSizing: 'border-box'
  };
  const checkboxStyle = { width: 16, height: 16, marginRight: 10, cursor: 'pointer', flexShrink: 0 };
  const checkboxLabelStyle = { color: '#32324d', fontSize: 14, display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '10px 16px' };
  const otherGridStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 };
  const summaryBoxStyle = {
    background: '#f6f6f9',
    border: '1px solid #dcdce4',
    borderRadius: 6,
    padding: 20,
    marginBottom: 24,
    fontSize: 14,
    color: '#32324d'
  };
  const userCountBoxStyle = {
    background: '#e8e8f0',
    border: '1px solid #4945ff',
    borderRadius: 6,
    padding: 16,
    marginBottom: 24,
    fontSize: 14,
    color: '#32324d',
    fontWeight: 500
  };
  const btnStyle = {
    background: '#4945ff',
    color: 'white',
    border: 'none',
    borderRadius: 4,
    padding: '12px 32px',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
    width: '100%',
    boxSizing: 'border-box'
  };
  const mutedText = { color: '#666687', fontSize: 14 };
  const successText = { color: '#328048', fontSize: 14, marginBottom: 16 };
  const tagStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    background: '#f6f6f9',
    border: '1px solid #dcdce4',
    borderRadius: 4,
    padding: '4px 10px',
    fontSize: 14,
    color: '#32324d',
    marginRight: 8,
    marginBottom: 8
  };
  const tagRemoveStyle = { cursor: 'pointer', color: '#666687', fontSize: 14, border: 'none', background: 'none', padding: 0, lineHeight: 1 };

  const getAudienceLabel = () => {
    if (userGroup === 'school') return selectedSchools.length > 0 ? selectedSchools.length + ' school(s)' : 'All Schools';
    if (userGroup === 'all') return 'All User Groups';
    if (userGroup === 'premium') return 'Premium';
    if (userGroup === 'ultra') return 'Ultra';
    return 'Select';
  };

  const panelStyle = {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    background: '#fff',
    border: '1px solid #dcdce4',
    borderRadius: 6,
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    maxHeight: 280,
    overflowY: 'auto',
    zIndex: 1000,
    padding: 8
  };
  const triggerStyle = {
    ...inputSelectStyle,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  };
  const rowStyle = { display: 'flex', alignItems: 'center', padding: '8px 12px', cursor: 'pointer' };

  return React.createElement('div', { style: pageStyle },
    React.createElement('h1', { style: { color: '#32324d', fontSize: 24, fontWeight: 700, marginBottom: 8 } }, 'Mapping Control Center'),
    React.createElement('p', { style: { ...mutedText, marginBottom: 32 } }, 'Assign assets to audiences by user type, school, or grade.'),

    React.createElement('div', { style: cardStyle },
      React.createElement('h2', { style: headingStyle }, '1. Select Audience'),
      React.createElement('div', { style: { display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 16 } },
        React.createElement('div', { style: { flex: 1, minWidth: 200 } },
          React.createElement('label', { style: labelStyle }, 'Select User Group'),
          React.createElement('select', {
            style: { ...inputSelectStyle, cursor: 'pointer' },
            value: userGroup,
            onChange: e => setUserGroup(e.target.value)
          },
            React.createElement('option', { value: '' }, 'Select'),
            React.createElement('option', { value: 'all' }, 'All User Groups'),
            React.createElement('option', { value: 'premium' }, 'Premium'),
            React.createElement('option', { value: 'ultra' }, 'Ultra'),
            React.createElement('option', { value: 'school' }, 'Select School'),
          )
        ),
        userGroup !== 'school' && userGroup !== '' && React.createElement('div', { style: { flex: 1, minWidth: 200, position: 'relative' }, ref: gradesRef },
          React.createElement('label', { style: labelStyle }, 'Select Grades'),
          React.createElement('div',
            {
              style: triggerStyle,
              onClick: () => setGradesOpen(!gradesOpen),
              'aria-expanded': gradesOpen
            },
            React.createElement('span', null, selectedGrades.length === 0 ? 'Select' : selectedGrades.length === gradesList.length && gradesList.length > 0 ? 'All Grades' : selectedGrades.map(id => gradesList.find(g => getGradeId(g) === id)).filter(Boolean).map(getGradeLabel).join(', ') || selectedGrades.length + ' selected'),
            React.createElement('span', { style: { fontSize: 12 } }, gradesOpen ? '▲' : '▼')
          ),
          gradesOpen && React.createElement('div', { style: panelStyle },
            React.createElement('label', { style: rowStyle },
              React.createElement('input', { type: 'checkbox', checked: gradesList.length > 0 && selectedGrades.length === gradesList.length, onChange: gradesSelectAll, style: checkboxStyle }),
              'Select All'
            ),
            gradesList.length === 0
              ? React.createElement('div', { style: { padding: 12, color: '#666687' } }, 'No grades from Xano. Set XANO_BASE_URL (and XANO_MEMBERS_BASE_URL) in Strapi .env to your Members & Accounts API base (e.g. https://your-instance.n7.xano.io/api:GROUP_ID) and ensure get_all_grades is deployed there.')
              : sortedGradesList.map(g =>
                  React.createElement('label', { key: getGradeId(g), style: rowStyle },
                    React.createElement('input', { type: 'checkbox', checked: selectedGrades.includes(getGradeId(g)), onChange: () => toggleGrade(getGradeId(g)), style: checkboxStyle }),
                    React.createElement('span', { style: { marginLeft: 8, color: '#32324d', fontSize: 14 } }, getGradeLabel(g))
                  )
                )
          )
        ),
        userGroup === 'school' && React.createElement('div', { style: { flex: 1, minWidth: 200, position: 'relative' }, ref: schoolsRef },
          React.createElement('label', { style: labelStyle }, 'Select Schools'),
          React.createElement('div',
            {
              style: triggerStyle,
              onClick: () => setSchoolsOpen(!schoolsOpen),
              'aria-expanded': schoolsOpen
            },
            React.createElement('span', null, selectedSchools.length === 0 ? 'All Schools' : selectedSchools.length === schoolsList.length ? 'All Schools' : selectedSchools.length + ' school(s) selected'),
            React.createElement('span', { style: { fontSize: 12 } }, schoolsOpen ? '▲' : '▼')
          ),
          schoolsOpen && React.createElement('div', { style: panelStyle },
            React.createElement('label', { style: rowStyle },
              React.createElement('input', { type: 'checkbox', checked: schoolsList.length > 0 && selectedSchools.length === schoolsList.length, onChange: schoolsSelectAll, style: checkboxStyle }),
              'Select All'
            ),
            schoolsLoading
              ? React.createElement('div', { style: { padding: 12, color: '#666687' } }, 'Loading schools from Xano…')
              : schoolsList.length === 0
                ? React.createElement('div', { style: { padding: 12, color: '#666687' } }, 'No schools in Xano. Set XANO_BASE_URL in .env and restart Strapi.')
                : schoolsList.map(s =>
                  React.createElement('label', { key: getSchoolId(s), style: rowStyle },
                    React.createElement('input', { type: 'checkbox', checked: selectedSchools.includes(getSchoolId(s)), onChange: () => toggleSchool(getSchoolId(s)), style: checkboxStyle }),
                    React.createElement('span', { style: { marginLeft: 8, color: '#32324d', fontSize: 14 } }, getSchoolName(s))
                  )
                )
          )
        )
      )
    ),

    React.createElement('div', { style: cardStyle },
      React.createElement('h2', { style: headingStyle }, '2. Select Assets'),
      React.createElement('div', { style: { display: 'flex', gap: '4%', marginBottom: 16, flexWrap: 'wrap' } },
        React.createElement('div', { style: { width: '48%', boxSizing: 'border-box', minWidth: 0 } },
          React.createElement('label', { style: labelStyle }, 'Category'),
          React.createElement('select', {
            style: { ...categorySelectStyle, cursor: 'pointer' },
            value: selectedCategoryId,
            onChange: e => setSelectedCategoryId(e.target.value)
          },
            React.createElement('option', { value: '' }, '-- Select Category --'),
            categories.map(cat =>
              React.createElement('option', { key: getCategoryId(cat), value: getCategoryId(cat) }, getCategoryName(cat))
            )
          )
        ),
        React.createElement('div', { style: { width: '48%', boxSizing: 'border-box', minWidth: 0 } },
          React.createElement('label', { style: labelStyle }, 'Course'),
          React.createElement('select', {
            multiple: true,
            style: { ...courseSelectStyle, cursor: 'pointer' },
            value: selectedCourseTitles,
            onChange: onCourseMultiChange,
            disabled: !selectedCategoryId,
            title: !selectedCategoryId ? 'Select a category first' : '-- Select Course --'
          },
            coursesInSelectedCategory.map(c =>
              React.createElement('option', { key: c.id ?? c.documentId ?? getCourseTitle(c), value: getCourseTitle(c) }, getCourseTitle(c))
            )
          )
        )
      ),
      React.createElement('div', { style: { marginBottom: 24 } },
        React.createElement('span', { style: { ...mutedText, marginRight: 8 } }, 'Selected:'),
        selectedAssets.length === 0
          ? React.createElement('span', { style: mutedText }, 'None')
          : selectedAssets.map(name =>
              React.createElement('span', { key: name, style: tagStyle },
                name,
                React.createElement('button', { type: 'button', style: tagRemoveStyle, onClick: () => removeAsset(name), 'aria-label': 'Remove' }, '✕')
              )
            )
      ),
      React.createElement('p', { style: { ...mutedText, marginBottom: 16, fontSize: 14 } }, 'Other Assets'),
      React.createElement('div', { style: otherGridStyle },
        ['Workshop', 'Book', 'Byte', 'Brain Teaser', 'Current Affairs'].map(a =>
          React.createElement('label', { key: a, style: { ...checkboxLabelStyle, marginBottom: 12 } },
            React.createElement('input', {
              type: 'checkbox',
              checked: selectedAssets.includes(a),
              onChange: () => toggleAsset(a),
              style: checkboxStyle
            }),
            a
          )
        )
      )
    ),

    React.createElement('div', { style: cardStyle },
      React.createElement('h2', { style: headingStyle }, '3. Preview & Confirm'),
      React.createElement('div', { style: summaryBoxStyle },
        React.createElement('p', { style: { marginBottom: 8, fontWeight: 600 } }, 'Audience Type:', ' ', (() => {
          if (!userGroup) return 'Select';
          const gLabels = selectedGrades.length ? selectedGrades.map(id => gradesList.find(g => getGradeId(g) === id)).filter(Boolean).map(getGradeLabel) : [];
          const gradePart = gLabels.length === 1 ? gLabels[0] : (gLabels.length > 1 ? gLabels.join(', ') : '');
          if (userGroup === 'school') return 'School' + (gradePart ? ' - ' + gradePart : '') + (selectedSchools.length ? ' (' + selectedSchools.length + ' school(s))' : '');
          if (userGroup === 'all') return 'All User Groups' + (gradePart ? ' - ' + gradePart : '');
          const label = userGroup === 'premium' ? 'Premium' : userGroup === 'ultra' ? 'Ultra' : userGroup;
          return label + (gradePart ? ' - ' + gradePart : '');
        })()),
        React.createElement('p', { style: { marginBottom: 12, fontWeight: 600 } }, 'Total Users: ', previewUserCountLoading ? '…' : (previewUserCount !== null ? String(previewUserCount) : '—')),
        React.createElement('p', { style: { marginBottom: 6, fontWeight: 600 } }, 'Assets to be Assigned:'),
        selectedAssets.length === 0
          ? React.createElement('p', { style: { margin: 0, paddingLeft: 16, color: '#666687' } }, 'None selected')
          : React.createElement('ul', { style: { margin: 0, paddingLeft: 20 } },
              selectedAssets.map(name => React.createElement('li', { key: name, style: { marginBottom: 4 } }, name))
            )
      ),
      success && React.createElement('p', { style: successText }, 'Mapping saved successfully.'),
      React.createElement('button', { style: btnStyle, onClick: confirm }, 'Confirm Assignment')
    )
  );
};

export default MappingPage;
