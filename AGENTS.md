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

## Web app (`web/`)

- Los textos para el invitado viven en `src/i18n/strings.ts` (español, claves en inglés). El inglés es un override parcial en `web/src/i18n/en.ts`; lo que falte lo llena el español. No se escribe copy dentro de las pantallas.
- La lógica pura de `web/src/core` no toca `window`, `document` ni el DOM. Las únicas excepciones son los adaptadores de storage (`storage.ts`) y de mercado (`market.ts`), y el cargador de Google Identity (`google.ts`). Tiempo y azar se inyectan (`Clock`), no se leen dentro del reducer.
- Superficies, botones, pantallas y hojas se construyen con `Glass`, `Press`, `Screen` y `Sheet` de `web/src/ui`, no con `div` y `button` sueltos.
- Todo elemento interactivo lleva `data-testid`.
- Los módulos compartidos por el alias `@` (`src/data/program.ts`, `src/data/menu.*`, `src/i18n/strings.ts`, `src/format.ts`) alimentan las dos apps. Después de cualquier cambio se corre `npx tsc --noEmit` en `web/` y en la raíz.
- `EXPO_PUBLIC_ODOO_URL` nunca apunta a producción. `productionBlocked()` también rige en la web: Vite inyecta esa variable con `define`.
- No se despliega la app web.
