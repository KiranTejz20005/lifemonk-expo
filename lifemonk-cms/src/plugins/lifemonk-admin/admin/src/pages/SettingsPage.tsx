import React, { useState } from 'react';
import { STRAPI_URL, XANO_URL } from '../constants';

export default function SettingsPage({ setCurrentPage }: { setCurrentPage: (p: string) => void }) {
  const [strapiStatus, setStrapiStatus] = useState<'idle' | 'ok' | 'fail'>('idle');
  const [xanoStatus, setXanoStatus] = useState<'idle' | 'ok' | 'fail'>('idle');

  function testStrapi() {
    setStrapiStatus('idle');
    fetch(`${STRAPI_URL}/api/courses?pagination[pageSize]=1`)
      .then((r) => (r.ok ? setStrapiStatus('ok') : setStrapiStatus('fail')))
      .catch(() => setStrapiStatus('fail'));
  }

  function testXano() {
    setXanoStatus('idle');
    fetch(`${XANO_URL}/get_all_users`)
      .then((r) => (r.ok ? setXanoStatus('ok') : setXanoStatus('fail')))
      .catch(() => setXanoStatus('fail'));
  }

  return (
    <>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Settings</h1>
      <p style={{ fontSize: 14, color: '#718096', marginBottom: 24 }}>System configuration and connection status</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
        <div style={{ background: '#fff', border: '1px solid #e8ecf0', borderRadius: 8, padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Strapi CMS</h3>
          <p style={{ fontSize: 13, color: '#718096', marginBottom: 8 }}>URL: {STRAPI_URL}</p>
          <button type="button" onClick={testStrapi} style={{ border: '1px solid #1e2235', background: '#fff', color: '#1e2235', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>Test connection</button>
          {strapiStatus === 'ok' && <span style={{ marginLeft: 12, color: '#38a169' }}>✓ Connected</span>}
          {strapiStatus === 'fail' && <span style={{ marginLeft: 12, color: '#e53e3e' }}>✗ Failed</span>}
        </div>
        <div style={{ background: '#fff', border: '1px solid #e8ecf0', borderRadius: 8, padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Xano Backend</h3>
          <p style={{ fontSize: 13, color: '#718096', marginBottom: 8 }}>URL: {XANO_URL}</p>
          <button type="button" onClick={testXano} style={{ border: '1px solid #1e2235', background: '#fff', color: '#1e2235', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>Test connection</button>
          {xanoStatus === 'ok' && <span style={{ marginLeft: 12, color: '#38a169' }}>✓ Connected</span>}
          {xanoStatus === 'fail' && <span style={{ marginLeft: 12, color: '#e53e3e' }}>✗ Failed</span>}
        </div>
      </div>
    </>
  );
}
