/**
 * mapping-control  —  MappingPage.tsx
 *
 * 4-step wizard:
 *   Step 1 – Select Audience
 *   Step 2 – Select Assets (multi-select)
 *   Step 3 – Assignment Rules
 *   Step 4 – Preview & Confirm
 *
 * Uses @strapi/design-system for a native Strapi admin look.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Flex,
  Typography,
  Button,
  TextInput,
  SingleSelect,
  SingleSelectOption,
  DatePicker,
  Checkbox,
  Divider,
  Badge,
  Grid,
  Alert,
  Loader,
} from '@strapi/design-system';
import { XANO_URL } from '../constants';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Asset {
  id: number;
  name: string;
  type: 'course' | 'workshop' | 'book' | 'content-category';
}

interface AudienceState {
  userType: string;
  grade: string;
  searchQuery: string;
  specificUsers: { id: number; name: string }[];
}

interface RulesState {
  accessType: string;
  expiryDate: string;
  assignmentMode: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const STRAPI_BASE = ''; // relative — same origin

async function fetchJson(url: string) {
  const res = await fetch(`${STRAPI_BASE}${url}`, {
    headers: { Authorization: `Bearer ${window.sessionStorage.getItem('jwtToken') ?? ''}` },
  });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? json;
}

const GRADES = Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`);

const USER_TYPES = [
  'All Basic',
  'All Premium',
  'All Ultra',
  'School',
  'Specific Users',
];

/* ------------------------------------------------------------------ */
/*  Shared styles                                                      */
/* ------------------------------------------------------------------ */

const card: React.CSSProperties = {
  background: '#fff',
  borderRadius: 8,
  padding: 24,
  boxShadow: '0 1px 4px rgba(0,0,0,.08)',
};

const stepBadge = (active: boolean, done: boolean): React.CSSProperties => ({
  width: 32,
  height: 32,
  borderRadius: '50%',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 700,
  fontSize: 14,
  color: active || done ? '#fff' : '#8892a4',
  background: done ? '#328048' : active ? '#4945ff' : '#e6e9ed',
  marginRight: 8,
  flexShrink: 0,
});

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function MappingPage() {
  /* ----- wizard state ----- */
  const [step, setStep] = useState(1);

  /* Step 1 */
  const [audience, setAudience] = useState<AudienceState>({
    userType: '',
    grade: '',
    searchQuery: '',
    specificUsers: [],
  });

  /* Step 2 */
  const [courses, setCourses] = useState<Asset[]>([]);
  const [workshops, setWorkshops] = useState<Asset[]>([]);
  const [books, setBooks] = useState<Asset[]>([]);
  const [categories, setCategories] = useState<Asset[]>([]);
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());

  /* Step 3 */
  const [rules, setRules] = useState<RulesState>({
    accessType: 'Immediate Access',
    expiryDate: '',
    assignmentMode: 'Add to Existing',
  });

  /* Step 4 */
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<null | { ok: boolean; count: number }>(null);

  /* ----- system overview ----- */
  const [courseCount, setCourseCount] = useState<number>(0);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState<boolean>(true);

  const totalUsers = users.length;
  const premiumUsers = users.filter(
    (u) => (u.subscription_type ?? u.user_type ?? '').toLowerCase() === 'premium'
  ).length;
  const ultraUsers = users.filter(
    (u) => (u.subscription_type ?? u.user_type ?? '').toLowerCase() === 'ultra'
  ).length;

  /* ----- derived audience count ----- */
  const audienceCount = useCallback(() => {
    if (audience.userType === 'Specific Users') return audience.specificUsers.length;
    if (audience.userType === 'School') return audience.grade ? 120 : 0; // placeholder
    if (audience.userType.startsWith('All')) return '∞ (all matching)';
    return 0;
  }, [audience]);

  /* ----- load system overview on mount ----- */
  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoadingStats(true);

        const res = await fetch(`${STRAPI_BASE}/api/courses?pagination[pageSize]=1`, {
          headers: { Authorization: `Bearer ${window.sessionStorage.getItem('jwtToken') ?? ''}` },
        });
        const courseData = await res.json();
        setCourseCount(courseData?.meta?.pagination?.total ?? 0);

        if (XANO_URL) {
          const userData = await fetch(`${XANO_URL}/get_all_users`).then((r) => r.json()).catch(() => []);
          setUsers(Array.isArray(userData) ? userData : []);
        } else {
          setUsers([]);
        }
      } catch (err) {
        console.error('System overview load failed:', err);
      } finally {
        setLoadingStats(false);
      }
    };
    loadStats();
  }, []);

  /* ----- fetch assets on mount ----- */
  useEffect(() => {
    (async () => {
      const [c, w] = await Promise.all([
        fetchJson('/api/courses'),
        fetchJson('/api/workshops'),
      ]);
      setCourses(c.map((x: any) => ({ id: x.id, name: x.name ?? x.title ?? `Course #${x.id}`, type: 'course' as const })));
      setWorkshops(w.map((x: any) => ({ id: x.id, name: x.name ?? x.title ?? `Workshop #${x.id}`, type: 'workshop' as const })));

      // Books + Categories — static placeholders until APIs exist
      setBooks([
        { id: 1, name: 'Atomic Habits', type: 'book' },
        { id: 2, name: 'Deep Work', type: 'book' },
        { id: 3, name: 'Mindset', type: 'book' },
      ]);
      setCategories([
        { id: 1, name: 'Motivation Bytes', type: 'content-category' },
        { id: 2, name: 'Current Affairs', type: 'content-category' },
        { id: 3, name: 'Daily Inspiration', type: 'content-category' },
      ]);
    })();
  }, []);

  /* ----- asset toggle ----- */
  const toggleAsset = (a: Asset) => {
    const key = `${a.type}::${a.id}`;
    setSelectedAssets((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const isSelected = (a: Asset) => selectedAssets.has(`${a.type}::${a.id}`);

  /* ----- user search stub ----- */
  const handleUserSearch = async () => {
    if (!audience.searchQuery.trim()) return;
    // In production: call /api/users-permissions/users?filters[username][$containsi]=...
    const fakeResults = [
      { id: 101, name: `User "${audience.searchQuery}"` },
      { id: 102, name: `${audience.searchQuery} (match 2)` },
    ];
    setAudience((a) => ({
      ...a,
      specificUsers: [
        ...a.specificUsers,
        ...fakeResults.filter((u) => !a.specificUsers.find((s) => s.id === u.id)),
      ],
    }));
  };

  const removeUser = (id: number) =>
    setAudience((a) => ({ ...a, specificUsers: a.specificUsers.filter((u) => u.id !== id) }));

  /* ----- resolve selected assets for preview ----- */
  const allAssets = [...courses, ...workshops, ...books, ...categories];
  const selectedList = allAssets.filter((a) => isSelected(a));

  /* ----- submit ----- */
  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      const payload = {
        audience: {
          userType: audience.userType,
          grade: audience.grade || null,
          specificUsers: audience.specificUsers.map((u) => u.id),
        },
        assets: selectedList.map((a) => ({ id: a.id, name: a.name, type: a.type })),
        rules,
      };

      const res = await fetch(`${STRAPI_BASE}/api/mapping-control/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${window.sessionStorage.getItem('jwtToken') ?? ''}`,
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      setSubmitResult({ ok: !!json.ok, count: json.created ?? 0 });
    } catch {
      setSubmitResult({ ok: false, count: 0 });
    } finally {
      setSubmitting(false);
    }
  };

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */

  const renderStepIndicator = () => (
    <Flex gap={4} style={{ marginBottom: 24 }}>
      {['Select Audience', 'Select Assets', 'Assignment Rules', 'Preview & Confirm'].map(
        (label, i) => {
          const n = i + 1;
          return (
            <Flex
              key={n}
              alignItems="center"
              style={{ cursor: n < step ? 'pointer' : 'default', opacity: n > step ? 0.5 : 1 }}
              onClick={() => n < step && setStep(n)}
            >
              <span style={stepBadge(n === step, n < step)}>{n < step ? '✓' : n}</span>
              <Typography
                variant="sigma"
                textColor={n === step ? 'primary600' : 'neutral600'}
                style={{ whiteSpace: 'nowrap' }}
              >
                {label}
              </Typography>
            </Flex>
          );
        },
      )}
    </Flex>
  );

  /* ---------- STEP 1 ---------- */
  const renderStep1 = () => (
    <Box style={card}>
      <Typography variant="beta" style={{ marginBottom: 16 }}>
        Step 1 — Select Audience
      </Typography>

      <Flex gap={4} wrap="wrap" style={{ marginBottom: 16 }}>
        <Box style={{ flex: 1, minWidth: 220 }}>
          <SingleSelect
            label="User Type"
            placeholder="Choose audience…"
            value={audience.userType}
            onChange={(v: string) => setAudience((a) => ({ ...a, userType: v, grade: '', specificUsers: [] }))}
          >
            {USER_TYPES.map((t) => (
              <SingleSelectOption key={t} value={t}>
                {t}
              </SingleSelectOption>
            ))}
          </SingleSelect>
        </Box>

        <Box style={{ flex: 1, minWidth: 220 }}>
          <SingleSelect
            label="Select Grades"
            placeholder="Choose grade…"
            value={audience.grade}
            onChange={(v: string) => setAudience((a) => ({ ...a, grade: v }))}
            disabled={audience.userType !== 'School'}
          >
            {GRADES.map((g) => (
              <SingleSelectOption key={g} value={g}>
                {g}
              </SingleSelectOption>
            ))}
          </SingleSelect>
        </Box>
      </Flex>

      {audience.userType === 'Specific Users' && (
        <Box style={{ marginBottom: 16 }}>
          <Flex gap={2}>
            <Box style={{ flex: 1 }}>
              <TextInput
                label="Search Users"
                placeholder="Name or User ID…"
                value={audience.searchQuery}
                onChange={(e: any) =>
                  setAudience((a) => ({ ...a, searchQuery: e.target.value }))
                }
              />
            </Box>
            <Button onClick={handleUserSearch} style={{ alignSelf: 'flex-end' }}>
              Search
            </Button>
          </Flex>

          {audience.specificUsers.length > 0 && (
            <Flex gap={2} wrap="wrap" style={{ marginTop: 12 }}>
              {audience.specificUsers.map((u) => (
                <Badge key={u.id} backgroundColor="primary100" textColor="primary700">
                  {u.name}{' '}
                  <span style={{ cursor: 'pointer', marginLeft: 4 }} onClick={() => removeUser(u.id)}>
                    ✕
                  </span>
                </Badge>
              ))}
            </Flex>
          )}
        </Box>
      )}

      <Divider style={{ margin: '16px 0' }} />

      <Typography variant="omega" textColor="neutral800" fontWeight="bold">
        Selected Audience Count:{' '}
        <span style={{ color: '#4945ff' }}>{audienceCount()} Users</span>
      </Typography>
    </Box>
  );

  /* ---------- STEP 2 ---------- */
  const renderAssetList = (title: string, items: Asset[]) => (
    <Box style={{ ...card, flex: 1, minWidth: 240 }}>
      <Typography variant="delta" style={{ marginBottom: 12 }}>
        {title}
      </Typography>
      {items.length === 0 && (
        <Typography variant="omega" textColor="neutral500">
          No items loaded
        </Typography>
      )}
      <Box style={{ maxHeight: 260, overflowY: 'auto' }}>
        {items.map((a) => (
          <Box key={`${a.type}-${a.id}`} style={{ padding: '6px 0' }}>
            <Checkbox checked={isSelected(a)} onCheckedChange={() => toggleAsset(a)}>
              {a.name}
            </Checkbox>
          </Box>
        ))}
      </Box>
    </Box>
  );

  const renderStep2 = () => (
    <Box>
      <Typography variant="beta" style={{ marginBottom: 16 }}>
        Step 2 — Select Assets
      </Typography>
      <Typography variant="omega" textColor="neutral600" style={{ marginBottom: 16 }}>
        Select multiple items from each list. Currently selected:{' '}
        <strong>{selectedAssets.size}</strong>
      </Typography>

      <Flex gap={4} wrap="wrap">
        {renderAssetList('Courses', courses)}
        {renderAssetList('Workshops', workshops)}
        {renderAssetList('Books', books)}
        {renderAssetList('Motivation / Bytes / Current Affairs', categories)}
      </Flex>
    </Box>
  );

  /* ---------- STEP 3 ---------- */
  const renderStep3 = () => (
    <Box style={card}>
      <Typography variant="beta" style={{ marginBottom: 16 }}>
        Step 3 — Assignment Rules
      </Typography>

      <Flex gap={4} wrap="wrap" style={{ marginBottom: 16 }}>
        <Box style={{ flex: 1, minWidth: 220 }}>
          <SingleSelect
            label="Access Type"
            value={rules.accessType}
            onChange={(v: string) => setRules((r) => ({ ...r, accessType: v }))}
          >
            <SingleSelectOption value="Immediate Access">Immediate Access</SingleSelectOption>
            <SingleSelectOption value="Scheduled">Scheduled</SingleSelectOption>
          </SingleSelect>
        </Box>

        <Box style={{ flex: 1, minWidth: 220 }}>
          <SingleSelect
            label="Assignment Mode"
            value={rules.assignmentMode}
            onChange={(v: string) => setRules((r) => ({ ...r, assignmentMode: v }))}
          >
            <SingleSelectOption value="Add to Existing">Add to Existing</SingleSelectOption>
            <SingleSelectOption value="Replace Existing">Replace Existing</SingleSelectOption>
          </SingleSelect>
        </Box>
      </Flex>

      <Box style={{ maxWidth: 280 }}>
        <Typography variant="omega" style={{ marginBottom: 4 }}>
          Expiry Date
        </Typography>
        <input
          type="date"
          value={rules.expiryDate}
          onChange={(e) => setRules((r) => ({ ...r, expiryDate: e.target.value }))}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #dcdce4',
            borderRadius: 4,
            fontSize: 14,
          }}
        />
      </Box>
    </Box>
  );

  /* ---------- STEP 4 ---------- */
  const renderStep4 = () => (
    <Box style={card}>
      <Typography variant="beta" style={{ marginBottom: 16 }}>
        Step 4 — Preview & Confirm
      </Typography>

      {submitResult && (
        <Box style={{ marginBottom: 16 }}>
          <Alert
            closeLabel="Close"
            title={submitResult.ok ? 'Success' : 'Error'}
            variant={submitResult.ok ? 'success' : 'danger'}
          >
            {submitResult.ok
              ? `${submitResult.count} mapping(s) created successfully.`
              : 'Failed to create mappings. Check the server logs.'}
          </Alert>
        </Box>
      )}

      {/* Audience summary */}
      <Box
        style={{
          background: '#f6f6f9',
          borderRadius: 6,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <Typography variant="delta" style={{ marginBottom: 8 }}>
          Audience
        </Typography>
        <Typography variant="omega">
          <strong>Type:</strong> {audience.userType || '—'}
        </Typography>
        {audience.grade && (
          <Typography variant="omega">
            <strong>Grade:</strong> {audience.grade}
          </Typography>
        )}
        {audience.specificUsers.length > 0 && (
          <Typography variant="omega">
            <strong>Specific Users:</strong> {audience.specificUsers.map((u) => u.name).join(', ')}
          </Typography>
        )}
        <Typography variant="omega">
          <strong>Count:</strong> {audienceCount()} Users
        </Typography>
      </Box>

      {/* Assets summary */}
      <Box
        style={{
          background: '#f6f6f9',
          borderRadius: 6,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <Typography variant="delta" style={{ marginBottom: 8 }}>
          Assets ({selectedList.length})
        </Typography>
        {selectedList.length === 0 ? (
          <Typography variant="omega" textColor="neutral500">
            No assets selected.
          </Typography>
        ) : (
          <Box style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {selectedList.map((a) => (
              <Badge key={`${a.type}-${a.id}`} backgroundColor="primary100" textColor="primary700">
                [{a.type}] {a.name}
              </Badge>
            ))}
          </Box>
        )}
      </Box>

      {/* Rules summary */}
      <Box
        style={{
          background: '#f6f6f9',
          borderRadius: 6,
          padding: 16,
          marginBottom: 24,
        }}
      >
        <Typography variant="delta" style={{ marginBottom: 8 }}>
          Rules
        </Typography>
        <Typography variant="omega">
          <strong>Access:</strong> {rules.accessType}
        </Typography>
        <Typography variant="omega">
          <strong>Expiry:</strong> {rules.expiryDate || 'No expiry'}
        </Typography>
        <Typography variant="omega">
          <strong>Mode:</strong> {rules.assignmentMode}
        </Typography>
      </Box>

      <Button
        onClick={handleConfirm}
        disabled={submitting || selectedList.length === 0 || !audience.userType}
        loading={submitting}
        size="L"
      >
        {submitting ? 'Submitting…' : 'Confirm Assignment'}
      </Button>
    </Box>
  );

  /* ---------- MAIN PAGE ---------- */
  return (
    <Box padding={8} background="neutral100" style={{ minHeight: '100vh' }}>
      <Typography variant="alpha" style={{ marginBottom: 8 }}>
        Mapping Control
      </Typography>
      <Typography variant="epsilon" textColor="neutral600" style={{ marginBottom: 24 }}>
        Assign courses, workshops, books & content to audiences in 4 easy steps.
      </Typography>

      <Box
        padding={6}
        background="neutral100"
        hasRadius
        shadow="filterShadow"
        marginBottom={6}
      >
        <Typography variant="alpha" fontWeight="bold">
          System Overview
        </Typography>
        <Flex gap={4} marginTop={4}>
          <Box background="neutral200" padding={4} hasRadius>
            <Typography>Total Courses</Typography>
            <Typography variant="beta">
              {loadingStats ? '...' : courseCount}
            </Typography>
          </Box>
          <Box background="neutral200" padding={4} hasRadius>
            <Typography>Total Users</Typography>
            <Typography variant="beta">
              {loadingStats ? '...' : totalUsers}
            </Typography>
          </Box>
          <Box background="danger100" padding={4} hasRadius>
            <Typography>Premium Users</Typography>
            <Typography variant="beta">
              {loadingStats ? '...' : premiumUsers}
            </Typography>
          </Box>
          <Box background="warning100" padding={4} hasRadius>
            <Typography>Ultra Users</Typography>
            <Typography variant="beta">
              {loadingStats ? '...' : ultraUsers}
            </Typography>
          </Box>
        </Flex>
      </Box>

      {renderStepIndicator()}

      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4()}

      {/* Navigation */}
      <Flex justifyContent="space-between" style={{ marginTop: 24 }}>
        <Button variant="tertiary" disabled={step === 1} onClick={() => setStep((s) => s - 1)}>
          ← Back
        </Button>
        {step < 4 ? (
          <Button onClick={() => setStep((s) => s + 1)}>Next →</Button>
        ) : null}
      </Flex>
    </Box>
  );
}
