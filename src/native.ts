/**
 * The web build leaves these off. They wait for a native binary, once the
 * Apple and Google accounts exist. Nothing here is deployed.
 */
export const nativeFlags = {
  geofence: false,
  alert: false,
  wallet: false,
} as const;
