import appsFlyer from 'react-native-appsflyer';
import { Platform } from 'react-native';
import { getAppsFlyerDevKey, getAppsFlyerIosAppId } from '../constants/appsflyer';

let appsFlyerInitialized = false;
let appsFlyerInitInFlight: Promise<boolean> | null = null;

export async function initAppsFlyer(): Promise<boolean> {
  if (appsFlyerInitialized) return true;
  if (appsFlyerInitInFlight) return await appsFlyerInitInFlight;

  appsFlyerInitInFlight = (async () => {
    const devKey = getAppsFlyerDevKey();
    if (!devKey) {
      console.warn('⚠️  [AppsFlyer] Missing Dev Key. Set APPSFLYER_DEV_KEY via env (EAS Secrets) so it is injected into app.config.js.');
      return false;
    }

    const options: any = {
      devKey,
      isDebug: __DEV__,
      onInstallConversionDataListener: true,
      onDeepLinkListener: true,
      // If you add ATT later, you can use this to delay start while waiting for user authorization.
      // timeToWaitForATTUserAuthorization: 60,
    };

    if (Platform.OS === 'ios') {
      options.appId = getAppsFlyerIosAppId();
    }

    try {
      await appsFlyer.initSdk(options);
      appsFlyerInitialized = true;

      if (__DEV__) {
        // Avoid logging sensitive keys; only log that init succeeded.
        console.log('✅ [AppsFlyer] SDK initialized');
      }
      return true;
    } catch (error) {
      // Keep the app running even if tracking fails.
      console.warn('⚠️  [AppsFlyer] init failed:', error);
      return false;
    } finally {
      appsFlyerInitInFlight = null;
    }
  })();

  return await appsFlyerInitInFlight;
}

export async function setAppsFlyerCustomerUserId(userId: string): Promise<void> {
  if (!userId) return;
  const ok = await initAppsFlyer();
  if (!ok) return;

  try {
    appsFlyer.setCustomerUserId(userId, () => {
      if (__DEV__) console.log('✅ [AppsFlyer] Customer User ID set');
    });
  } catch (error) {
    console.warn('⚠️  [AppsFlyer] setCustomerUserId failed:', error);
  }
}

export async function logAppsFlyerEvent(eventName: string, eventValues: Record<string, any> = {}): Promise<boolean> {
  if (!eventName) return;
  const ok = await initAppsFlyer();
  if (!ok) return false;

  try {
    await appsFlyer.logEvent(eventName, eventValues);
    if (__DEV__) console.log(`✅ [AppsFlyer] Event logged: ${eventName}`);
    return true;
  } catch (error) {
    console.warn(`⚠️  [AppsFlyer] logEvent failed (${eventName}):`, error);
    return false;
  }
}

export async function getAppsFlyerUid(): Promise<string | null> {
  const ok = await initAppsFlyer();
  if (!ok) return null;

  return await new Promise((resolve) => {
    try {
      appsFlyer.getAppsFlyerUID((err, uid) => {
        if (err) {
          console.warn('⚠️  [AppsFlyer] getAppsFlyerUID failed:', err);
          resolve(null);
          return;
        }
        resolve(uid || null);
      });
    } catch (error) {
      console.warn('⚠️  [AppsFlyer] getAppsFlyerUID threw:', error);
      resolve(null);
    }
  });
}


