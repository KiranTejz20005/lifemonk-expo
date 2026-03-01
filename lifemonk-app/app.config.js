// URLs must be set via .env (EXPO_PUBLIC_STRAPI_BASE_URL, EXPO_PUBLIC_XANO_BASE_URL, EXPO_PUBLIC_XANO_AUTH_URL).
// Do not commit real API URLs. Copy .env.example to .env and fill in values.
module.exports = {
  extra: {
    STRAPI_BASE_URL: process.env.EXPO_PUBLIC_STRAPI_BASE_URL || 'http://localhost:1337',
    XANO_BASE_URL: process.env.EXPO_PUBLIC_XANO_BASE_URL || '',
    XANO_AUTH_URL: process.env.EXPO_PUBLIC_XANO_AUTH_URL || '',
  }
};
