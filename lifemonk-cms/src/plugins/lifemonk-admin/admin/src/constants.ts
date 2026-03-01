export const STRAPI_URL = 'http://localhost:1337';
// Set via env when building Strapi admin, or replace with your Xano base URL. Do not commit real URLs.
export const XANO_URL = typeof process !== 'undefined' && process.env?.XANO_BASE_URL ? process.env.XANO_BASE_URL : '';
