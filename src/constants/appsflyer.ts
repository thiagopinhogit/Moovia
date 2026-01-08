import Constants from 'expo-constants';

/**
 * AppsFlyer Configuration (loaded from Expo config `extra`)
 *
 * Set these via env (recommended):
 * - APPSFLYER_DEV_KEY
 * - APPSFLYER_IOS_APP_ID (numeric, e.g. 6756393802)
 *
 * They are injected into the app at build time by `app.config.js`.
 */

type AppsFlyerExtra = {
  devKey?: string;
  iosAppId?: string;
};

function getExtraAppsFlyer(): AppsFlyerExtra | undefined {
  // expoConfig is the modern API; manifest is fallback for older environments.
  const extra = (Constants.expoConfig as any)?.extra ?? (Constants.manifest as any)?.extra;
  return extra?.appsFlyer as AppsFlyerExtra | undefined;
}

export function getAppsFlyerDevKey(): string | null {
  const devKey = getExtraAppsFlyer()?.devKey;
  return devKey && typeof devKey === 'string' && devKey.trim().length > 0 ? devKey.trim() : null;
}

export function getAppsFlyerIosAppId(): string {
  const appId = getExtraAppsFlyer()?.iosAppId;
  // Default to your known app id so iOS still works even if env isn't set.
  return appId && typeof appId === 'string' && appId.trim().length > 0 ? appId.trim() : '6756393802';
}


