# Libertario loyalty

Local demo of the house account. One Expo project: the web build is a PWA, and the same code is ready for iOS and Android. It does not charge, it does not call Odoo, and it is not deployed.

The numbers are the live program. Every $100 at the register earns one point. The welcome bonus is 1,000. An Americano Paz or Libre is 700, a Cappuccino Paz or Libre is 910, and the almond croissant is 2,000. Rewards can be requested until 31 December 2026. The ledger is written per store, for example Libertario calle 93.

The interface is Libertario, on white. Roast and ink are accents, not the ground. Other apps were read only to see what a guest has to be able to do. Their look and structure were not copied.

Customer-facing sentences live in `src/i18n/strings.ts`, with English keys. The menu catalog in `src/data/menu.json` keeps the printed Spanish names and descriptions as product data.

The points still needed for a reward are `cost - balance`. A balance of 898 against the almond croissant (2,000) is 1,102, not a fixed 1,000.

## Web (Expo)

```bash
npm ci
npm run web
```

It opens on port 8081. The opening plays the roast, then asks for phone, email, name, and ID number.

The counter code is calculated on the phone and stored locally. It is visible offline. Geofence, the arrival alert, and the Wallet pass stay off until the native binary exists and the Apple and Google accounts exist.

To export an installable web build:

```bash
npx expo export -p web
```

The manifest is `public/manifest.json`. The service worker is not registered on localhost.

## Web (PWA en `web/`)

La app web nueva vive en `web/`: Vite 7 + React 19, PWA instalable, pensada para el teléfono y enmarcada como uno en desktop. Comparte con esta app Expo las reglas del programa, la carta y los textos a través del alias `@`. Tampoco cobra, no llama a Odoo y no se despliega.

```bash
cd web
npm install
npm run dev
```

Abre en el puerto 5173. Parámetros de URL, promo de llegada, Google sign-in, PWA y el camino a React Native están en [web/README.md](web/README.md).

## Native

```bash
npm start
```

That opens the same project. On a Mac, `npm run ios`. With an emulator, `npm run android`. A development build is required if a module is added that Expo Go does not ship. On a mid-range Android phone the bottom bar is a solid surface, without blur, so the phone does not spend itself on it. On iOS and on the web the blur is light and only sits on that bar and on the counter card.

`src/native.ts` leaves `geofence`, `alert`, and `wallet` false. They are not turned on for the web.

## What you walk through

1. The roast, on open and when a cup is added.
2. Signup in one step. The welcome bonus is 1,000 points.
3. Home: balance, what expires this month, eight cups, the counter code, what can be redeemed, and the ledger by store.
4. Menu: search, index, price, plant-based, no nuts. "Pasar la carta" opens the book.
5. Table: table code, order, call the floor. Payment does not happen here.

If `EXPO_PUBLIC_ODOO_URL` points at `libertariocoffee.odoo.com`, the demo does not start.

The product notes are in [docs/store-experience.md](docs/store-experience.md), [docs/loyalty-proposal.md](docs/loyalty-proposal.md), and [docs/loyalty-study.md](docs/loyalty-study.md).
