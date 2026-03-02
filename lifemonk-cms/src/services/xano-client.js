'use strict';

/**
 * Centralized Xano HTTP client. All Strapi → Xano calls should go through this module.
 * - Reads baseURL from env (XANO_BASE_URL, XANO_COURSES_BASE_URL, XANO_MEMBERS_BASE_URL).
 * - Optional Authorization header when XANO_API_KEY is set.
 * - Logs every request and response; on 404/400/CORS logs actionable hints.
 */

const env = typeof process !== 'undefined' ? process.env : {};
const DEFAULT_TIMEOUT_MS = 15000;

function getBaseUrl(which = 'default') {
  if (which === 'courses') {
    return (env.XANO_COURSES_BASE_URL || env.XANO_BASE_URL || '').trim();
  }
  if (which === 'members') {
    return (env.XANO_MEMBERS_BASE_URL || env.XANO_GET_ALL_BASE_URL || env.XANO_BASE_URL || '').trim();
  }
  return (env.XANO_BASE_URL || '').trim();
}

function getAuthHeader() {
  const key = (env.XANO_API_KEY || '').trim();
  return key ? { Authorization: `Bearer ${key}` } : {};
}

/**
 * @param {string} baseUrl - Base URL (e.g. from getBaseUrl('courses'))
 * @returns {boolean} true if client can make requests
 */
function hasValidBase(baseUrl) {
  return typeof baseUrl === 'string' && baseUrl.length > 0 && (baseUrl.startsWith('http://') || baseUrl.startsWith('https://'));
}

/**
 * @param {string} path - Path (e.g. '/sync_course' or 'get_all_users')
 * @param {RequestInit} options - fetch options (method, headers, body)
 * @param {{ base?: 'default'|'courses'|'members', timeout?: number }} config - base URL key, timeout ms
 * @returns {Promise<Response>}
 */
async function request(path, options = {}, config = {}) {
  const base = config.base || 'default';
  const baseUrl = getBaseUrl(base);
  const timeout = config.timeout != null ? config.timeout : DEFAULT_TIMEOUT_MS;

  if (!hasValidBase(baseUrl)) {
    console.warn('[Strapi→Xano] XANO_BASE_URL (or XANO_COURSES_BASE_URL / XANO_MEMBERS_BASE_URL) not set — skipping request', path);
    return null;
  }

  const url = `${baseUrl.replace(/\/$/, '')}${path.startsWith('/') ? path : '/' + path}`;
  const method = (options.method || 'GET').toUpperCase();
  const body = options.body;
  const payloadSize = body ? (typeof body === 'string' ? body.length : JSON.stringify(body).length) : 0;

  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers || {}),
  };

  console.log('[Strapi→Xano] request', method, path, payloadSize ? `body=${payloadSize}b` : '');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const text = await res.text();
      if (res.status === 404) {
        console.error('[Strapi→Xano] 404 — Check XANO_BASE_URL and API group (courses vs Members & Accounts). Path:', path, 'Base:', base);
      } else if (res.status === 400) {
        console.error('[Strapi→Xano] 400 — Compare payload keys to Xano table/endpoint input. Response:', text.slice(0, 500));
      } else if (res.status === 403 || res.status === 401) {
        console.error('[Strapi→Xano]', res.status, '— Check XANO_API_KEY and Xano endpoint auth.');
      } else {
        console.error('[Strapi→Xano]', res.status, path, text.slice(0, 300));
      }
    } else {
      console.log('[Strapi→Xano]', res.status, path);
    }

    return res;
  } catch (e) {
    clearTimeout(timeoutId);
    if (e.name === 'AbortError') {
      console.error('[Strapi→Xano] timeout after', timeout, 'ms', path);
    } else {
      const msg = (e && e.message) || String(e);
      if (msg.toLowerCase().includes('cors') || msg.toLowerCase().includes('network')) {
        console.error('[Strapi→Xano] CORS or network error — Check Xano CORS settings and Strapi middleware. Message:', msg);
      } else {
        console.error('[Strapi→Xano] request failed:', path, msg);
      }
    }
    return null;
  }
}

/**
 * GET and parse JSON. Returns parsed data or null on failure.
 * @param {string} path
 * @param {{ base?: 'default'|'courses'|'members' }} config
 * @returns {Promise<any>}
 */
async function get(path, config = {}) {
  const res = await request(path, { method: 'GET' }, config);
  if (!res || !res.ok) return null;
  try {
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * POST JSON and optionally parse response.
 * @param {string} path
 * @param {object} body
 * @param {{ base?: 'default'|'courses'|'members' }} config
 * @returns {Promise<{ ok: boolean, status: number, data?: any }>}
 */
async function post(path, body, config = {}) {
  const res = await request(path, { method: 'POST', body: JSON.stringify(body) }, config);
  if (!res) return { ok: false, status: 0 };
  let data;
  try {
    const text = await res.text();
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  return { ok: res.ok, status: res.status, data };
}

/**
 * PATCH JSON and optionally parse response.
 */
async function patch(path, body, config = {}) {
  const res = await request(path, { method: 'PATCH', body: JSON.stringify(body) }, config);
  if (!res) return { ok: false, status: 0 };
  let data;
  try {
    const text = await res.text();
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  return { ok: res.ok, status: res.status, data };
}

module.exports = {
  getBaseUrl,
  getAuthHeader,
  hasValidBase,
  request,
  get,
  post,
  patch,
};
