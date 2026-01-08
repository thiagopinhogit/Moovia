// Expo dynamic config to allow injecting secrets via env (EAS Secrets / CI)
// https://docs.expo.dev/workflow/configuration/

const base = require('./app.json');

module.exports = ({ config }) => {
  // Prefer the passed config (if any), otherwise fall back to app.json.
  const cfg = config ?? base.expo ?? base;

  const appsFlyerDevKey = process.env.APPSFLYER_DEV_KEY;
  const appsFlyerIosAppId = process.env.APPSFLYER_IOS_APP_ID || '6756393802';

  return {
    ...cfg,
    extra: {
      ...(cfg.extra || {}),
      appsFlyer: {
        devKey: appsFlyerDevKey,
        iosAppId: appsFlyerIosAppId,
      },
    },
  };
};


