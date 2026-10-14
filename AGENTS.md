This is an Expo / React Native application. Prefer mobile-first patterns, performance, and cross-platform behavior.

## Expo moves

Expo ships breaking changes every SDK release. Before writing code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt and follow its links.

## Commands

```bash
npx expo install <package>
npx expo start
npx tsc --noEmit
```

Use `npx expo install` so the version matches the SDK.

## Navigation

Routes live in `app/`. Non-route code stays in `src/`. Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.

## Rules

- If `ios/` and `android/` do not exist, they are generated. Do not create or edit them by hand. Configure native behavior in `app.json`.
- Customer-facing Spanish copy belongs in `src/i18n/strings.ts` with English keys.
- Do not call production Odoo. `productionBlocked()` refuses `libertariocoffee.odoo.com`.
- Do not deploy this demo.
