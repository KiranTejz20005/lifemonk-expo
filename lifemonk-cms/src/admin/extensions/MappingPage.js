import React from 'react';

const getCategoryId = (cat) => cat?.documentId ?? cat?.id ?? '';
const getCategoryName = (cat) => cat?.name ?? cat?.attributes?.name ?? 'Uncategorized';
const getCourseCategoryId = (c) => {
  const cat = c?.category ?? c?.attributes?.category;
  const data = cat?.data ?? cat;
  return data ? (data.documentId ?? data.id ?? '') : null;
};
const getCourseTitle = (c) => c?.attributes?.title ?? c?.title ?? 'Untitled';

const MappingPage = () => {
  const [userType, setUserType] = React.useState('premium');
  const [grade, setGrade] = React.useState('');
  const [schoolName, setSchoolName] = React.useState('');
  const [categories, setCategories] = React.useState([]);
  const [courses, setCourses] = React.useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = React.useState('');
  const [selectedAssets, setSelectedAssets] = React.useState([]);
  const [userCount, setUserCount] = React.useState(null);
  const [userCountLoading, setUserCountLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);

  React.useEffect(() => {
    Promise.all([
      fetch('/api/categories?pagination[pageSize]=100').then(r => r.json()).then(d => setCategories(d.data || [])),
      fetch('/api/courses?populate=category&pagination[pageSize]=100').then(r => r.json()).then(d => setCourses(d.data || []))
    ]).catch(() => { setCategories([]); setCourses([]); });
  }, []);

  React.useEffect(() => {
    setUserCount(null);
    setUserCountLoading(true);
    let url = '/api/users?pagination[pageSize]=1&pagination[page]=1';
    if (userType === 'school' && schoolName) {
      url += '&filters[school_name][$eq]=' + encodeURIComponent(schoolName);
    } else if (userType === 'grade' && grade) {
      url += '&filters[grade][$eq]=' + encodeURIComponent(grade);
    } else if (userType === 'premium') {
      url += '&filters[subscription_type][$eq]=premium';
    } else if (userType === 'ultra') {
      url += '&filters[subscription_type][$eq]=ultra';
    } else if (userType === 'basic') {
      url += '&filters[subscription_type][$eq]=basic';
    }
    fetch(url)
      .then(r => r.json())
      .then(d => {
        const total = d?.meta?.pagination?.total ?? d?.pagination?.total ?? null;
        setUserCount(typeof total === 'number' ? total : null);
      })
      .catch(() => setUserCount(null))
      .finally(() => setUserCountLoading(false));
  }, [userType, grade, schoolName]);

  const toggleAsset = (name) => {
    setSelectedAssets(prev =>
      prev.includes(name) ? prev.filter(a => a !== name) : [...prev, name]
    );
  };

  const removeAsset = (name) => {
    setSelectedAssets(prev => prev.filter(a => a !== name));
  };

  const confirm = async () => {
    for (const asset of selectedAssets) {
      await fetch('/api/mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            asset_type: 'course',
            asset_name: asset,
            asset_id: 1,
            subscription_type: userType,
            grade: grade ? parseInt(grade) : null,
            school_name: schoolName || null,
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
    if (userType === 'grade' && grade) return 'Grade ' + grade + ' students';
    if (userType === 'school' && schoolName) return 'School users';
    if (userType === 'all') return 'All users';
    if (userType === 'premium') return 'Premium users';
    if (userType === 'ultra') return 'Ultra users';
    if (userType === 'basic') return 'Basic users';
    return 'Selected audience';
  };

  const userCountLine = userCountLoading
    ? 'Loading user count…'
    : (userCount != null ? getAudienceLabel() + ': ' + userCount + ' users' : getAudienceLabel());

  return React.createElement('div', { style: pageStyle },
    React.createElement('h1', { style: { color: '#32324d', fontSize: 24, fontWeight: 700, marginBottom: 8 } }, 'Mapping Control Center'),
    React.createElement('p', { style: { ...mutedText, marginBottom: 32 } }, 'Assign assets to audiences by user type, school, or grade.'),

    React.createElement('div', { style: cardStyle },
      React.createElement('h2', { style: headingStyle }, '1. Select Audience'),
      React.createElement('label', { style: labelStyle }, 'User Type'),
      React.createElement('select', {
        style: { ...inputSelectStyle, cursor: 'pointer' },
        value: userType,
        onChange: e => setUserType(e.target.value)
      },
        React.createElement('option', { value: 'all' }, 'All Users'),
        React.createElement('option', { value: 'basic' }, 'Basic Users'),
        React.createElement('option', { value: 'premium' }, 'Premium Users'),
        React.createElement('option', { value: 'ultra' }, 'Ultra Users'),
        React.createElement('option', { value: 'school' }, 'School'),
        React.createElement('option', { value: 'grade' }, 'By Grade'),
      ),
      userType === 'school' && React.createElement('div', { style: { marginTop: 16 } },
        React.createElement('label', { style: labelStyle }, 'School Name'),
        React.createElement('input', {
          style: inputSelectStyle,
          placeholder: 'Enter school name',
          value: schoolName,
          onChange: e => setSchoolName(e.target.value)
        })
      ),
      userType === 'grade' && React.createElement('div', { style: { marginTop: 16 } },
        React.createElement('label', { style: labelStyle }, 'Select Grade'),
        React.createElement('select', {
          style: { ...inputSelectStyle, cursor: 'pointer' },
          value: grade,
          onChange: e => setGrade(e.target.value)
        },
          [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(g =>
            React.createElement('option', { key: g, value: String(g) }, 'Grade ' + g)
          )
        )
      ),
      React.createElement('div', { style: userCountBoxStyle },
        '👥 ', userCountLine, ' will receive this mapping.'
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
        React.createElement('p', { style: { marginBottom: 8 } }, 'Audience: ' + userType + (grade ? ' — Grade ' + grade : '') + (schoolName ? ' — ' + schoolName : '')),
        React.createElement('p', { style: { margin: 0 } }, 'Assets: ' + (selectedAssets.length ? selectedAssets.join(', ') : 'None selected'))
      ),
      success && React.createElement('p', { style: successText }, 'Mapping saved successfully.'),
      React.createElement('button', { style: btnStyle, onClick: confirm }, 'Confirm Assignment')
    )
  );
};

export default MappingPage;
