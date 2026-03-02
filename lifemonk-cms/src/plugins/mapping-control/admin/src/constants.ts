export const XANO_URL =
  typeof process !== 'undefined' && process.env?.XANO_BASE_URL
    ? process.env.XANO_BASE_URL
    : '';
