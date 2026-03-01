/**
 * App config from env. Set STRAPI_BASE_URL, XANO_BASE_URL, STRAPI_API_TOKEN in app.config.js extra or .env.
 */
import Constants from 'expo-constants';

type Extra = {
  STRAPI_BASE_URL?: string;
  STRAPI_API_TOKEN?: string;
  XANO_BASE_URL?: string;
  XANO_AUTH_URL?: string;
};

function getExtra(): Extra {
  const extra = Constants.expoConfig?.extra as Extra | undefined;
  if (extra && typeof extra === 'object') return extra;
  return {};
}

export function getStrapiBaseUrl(): string {
  return getExtra().STRAPI_BASE_URL ?? process.env.EXPO_PUBLIC_STRAPI_BASE_URL ?? process.env.STRAPI_BASE_URL ?? 'http://192.168.1.5:1337';
}

export function getStrapiApiToken(): string | null {
  return getExtra().STRAPI_API_TOKEN ?? process.env.EXPO_PUBLIC_STRAPI_API_TOKEN ?? process.env.STRAPI_API_TOKEN ?? null;
}

export function getXanoBaseUrl(): string {
  return getExtra().XANO_BASE_URL ?? process.env.EXPO_PUBLIC_XANO_BASE_URL ?? process.env.XANO_BASE_URL ?? '';
}

export function getXanoAuthBaseUrl(): string {
  return getExtra().XANO_AUTH_URL ?? process.env.EXPO_PUBLIC_XANO_AUTH_URL ?? process.env.XANO_AUTH_URL ?? getXanoBaseUrl();
}
