# Libertario loyalty, web (PWA)

La app web de la casa Libertario: puntos, tazas, código de mostrador y la carta. Es una PWA instalable (Vite 7 + React 19 + TypeScript, `motion` v12, `react-router` v7, `vite-plugin-pwa`) pensada para el teléfono. En una tableta (720 a 1023 px) se enmarca como un teléfono de 430 px; en un monitor (desde 1024 px) usa un lienzo ancho: las pantallas de texto se leen en una columna de 760 px y la carta se abre a doble página, como un libro.

Comparte con la app Expo de la raíz las reglas del programa, la carta y los textos. El alias `@` apunta a la raíz del repositorio: `@/src/data/program` (puntos, bonos, casas, `productionBlocked()`), `@/src/data/menu` (carta base), `@/src/i18n/strings` (español) y `@/src/format`. Esos módulos están incluidos en el `tsconfig.json` de `web/` y en `server.fs.allow` de Vite. Como la app Expo: no cobra, no llama a Odoo y no se despliega.

## Cómo correr

```bash
cd web
npm install
npm run dev        # http://localhost:5173, con --host para abrirla desde el celular en la misma red
npm run build      # tsc --noEmit + vite build, deja dist/
npm run preview    # sirve dist/ en http://localhost:4173, con service worker
npm run typecheck  # solo tsc --noEmit
```

## Mapa de carpetas

- `src/core/`: lógica pura, sin React. `account.ts` (la cuenta como reducer, con reloj y azar inyectados), `catalog.ts` y `cities.ts` (catálogo por ciudad), `market.ts` (país, moneda, idioma, visita por QR), `promo.ts` (promo de llegada), `stores.ts` (coordenadas de las casas y distancia), `google.ts` (Google Identity), `storage.ts` (puerto clave-valor), `haptics.ts`, `photos.ts`, `visuals.ts`.
- `src/state/`: providers. `LocaleProvider` (en `i18n/`), `CatalogProvider`, `AccountProvider`, `PresenceProvider`. Se anidan en `main.tsx` en ese orden.
- `src/ui/`: componentes Liquid Glass. `Glass`, `Press`, `Screen`, `Sheet`, `TabBar`, `Toast`, `Counter`, `QR`, `Ring`, `Stamps`.
- `src/motion/`: animaciones de café en SVG con `motion`. `Roast` (el tueste, al abrir), `Brew` (V60), `Espresso`, `Liquid`, `Beans`, `Steam`, `Celebrate`.
- `src/book/`: el motor de pasar página de la carta (`Book`, `pages.tsx`). Una página en el teléfono, pliego doble en pantalla ancha; se arrastra con el pulgar, se toca cerca del borde o se usan las flechas del teclado.
- `src/screens/`: `opening`, `landing`, `signup`, `home`, `menu`, `item`, `order`, `settings`, `store-picker`.
- `src/i18n/`: `LocaleProvider`, `useLocale()`, `useCopy()` y `en.ts`.
- `src/styles/`: `tokens.css`, `base.css` (marco de teléfono en tableta, lienzo ancho en escritorio, keyframes `drift`/`burst` para los SVG), `glass.css`.
- `public/`: favicon, iconos del manifest y fotos de la carta.

Rutas: `/` (tueste), `/welcome`, `/signup`, `/home`, `/menu`, `/item/:id`, `/table`, `/settings`. `/home` exige cuenta; lo demás se puede mirar sin registrarse.

## Parámetros de URL

| Parámetro | Ejemplo | Qué hace |
| --- | --- | --- |
| `sede` y `mesa` | `/?sede=zona-g&mesa=4` | Es lo que imprime el QR de una mesa. La landing muestra la casa y la mesa; la visita se guarda en `sessionStorage` (`libertario-visit`) mientras dure la sesión. |
| `ciudad` | `/?ciudad=cartagena` | Elige el catálogo: `bogota`, `medellin` o `cartagena`. |
| `pais` | `/?pais=CL` | Elige el mercado: `CO` o `CL`. |
| `lang` | `/?lang=en` | Elige el idioma: `es` o `en`. |

Casas: `zona-g`, `calle-93`, `calle-85`, `usaquen`.

## Mercado, idioma y ciudad

Los tres siguen el mismo orden: parámetro de URL, luego lo que se eligió antes, luego una señal del teléfono, luego el valor por defecto. Lo que llega por URL se recuerda.

- Mercado (`core/market.ts`): `?pais`, `localStorage` (`libertario-market-v1`), región de `navigator.language` o zona horaria (`America/Santiago` y `America/Punta_Arenas` dan `CL`), y por defecto `CO`. Un mercado define país, moneda, `locale`, prefijo y patrón de teléfono, patrón de documento y ley de datos. Chile está configurado pero `live: false`: su carta y sus casas llegan con la compañía chilena.
- Idioma: `?lang`, `localStorage` (`libertario-lang-v1`), `navigator.language` que empiece por `en`, y por defecto `es`. El español de la raíz es la base; `en.ts` es un override parcial y el español llena lo que falte.
- Ciudad (`state/catalog.tsx` + `core/geo.ts`): la fuente con más rango gana. Orden: elección del usuario en Ajustes o `?ciudad` del QR → GPS (cuando el invitado activa la ubicación, el centro de ciudad más cercano dentro de 60 km) → IP resuelta en el borde (`GET /api/where`, sin pedir permiso y en cualquier navegador; la implementa `functions/api/where.ts` como Cloudflare Pages Function leyendo `request.cf.city`; en Vercel serían las cabeceras `x-vercel-ip-*`) → por defecto `bogota`. En desarrollo, Vite responde `/api/where` con lo que diga `VITE_DEV_CITY` (por ejemplo `VITE_DEV_CITY=Cartagena npm run dev`). Se guarda en `localStorage` (`libertario-city-v1`) junto con su fuente. Bogotá y Medellín comparten la carta base; Cartagena es la base con precios, ocultos y platos propios (`core/cities.ts`), sacados del PDF `menu_ctg_2026.pdf`.

Los tres se cambian en Ajustes (`/settings`). `useLocale()` entrega `copy`, `market`, `money()` y `date()`.

## Promo de llegada

`PresenceProvider` (`state/presence.tsx`) junta geolocalización, promo y simulación.

- Al tocar "permitir" se abre `navigator.geolocation.watchPosition` (baja precisión, `maximumAge` 20 s) y, si el navegador lo permite, se pide permiso de `Notification`. La decisión se recuerda en `libertario-presence-v1` y el watch se reanuda solo en la siguiente visita.
- `core/stores.ts` tiene las coordenadas de las cuatro casas y la distancia haversine. `nearestStore()` devuelve la más cercana y si se está dentro del radio: `PROMO_RADIUS_METERS = 150`.
- Al entrar en el radio con cuenta, `startPromo()` crea la promo con id `storeId:YYYY-MM-DD`: una promo por casa por día, aunque se salga y se vuelva. Dura `PROMO_MINUTES = 10`; la cuenta regresiva baja cada segundo en la tarjeta de Home. El tipo depende de la hora: `filterCroissant` antes de las 12, `doubleCup` de 12 a 14, `afternoon` desde las 14. Los puntos de cada una están en `PROMO_POINTS`.
- Entrar también mueve el libro a esa casa (`chooseStore`). Activar la promo despacha `claimPromo` al reducer; descartarla la cierra sin puntos. Se persiste en `libertario-promo-v1`.
- Si la pestaña está en segundo plano y el permiso fue concedido, se dispara una notificación local. No hay push.
- Para probar sin salir de la oficina: desde Home se abre la lista de casas (`store-picker.tsx`) y se toca "Simular que llego a …". `simulate(storeId)` reemplaza la posición real por la de la casa; "Dejar de simular" la devuelve.
- Calle 85 fue auditada contra Google (Carrera 13 #85-13). Zona G, Calle 93 y Usaquén están a nivel de manzana (`approximate: true`).

## Google sign-in

1. Copiar `.env.example` a `.env.local` y poner `VITE_GOOGLE_CLIENT_ID` con un cliente OAuth de tipo "Web application" del proyecto Google Cloud de Libertario.
2. En "Authorized JavaScript origins" del cliente: `http://localhost:5173` y el origen final de la app.
3. Sin la variable el botón no se muestra y el registro sigue por correo.

El script de Google Identity Services se carga bajo demanda (`core/google.ts`). El ID token se decodifica en el teléfono solo para prellenar nombre, correo y foto. No se verifica la firma: cuando exista backend, él debe validar el token antes de confiar en el perfil.

## Qué es simulado

- Pedidos: `postOrder` genera un código `P-XXXX` en el teléfono, cierra la compra y suma puntos y tazas en el reducer local. Nada llega a un POS.
- Pago: el pedido se paga en caja, como dice `docs/loyalty-proposal.md`. El saldo prepago (`/wallet`, `screens/wallet.tsx`) tiene una recarga por PSE **simulada**: no llama a ningún banco ni cobra; el flujo real va por un proveedor PSE (Wompi o PayU) desde un backend. El código de mesa no es un pago.
- Odoo: no se llama nunca. Saldo, tazas, código de mostrador y libro viven en `localStorage` bajo `libertario-home-v1`, la misma clave y forma base que la app Expo.
- Guard de producción: `productionBlocked()` lee `process.env.EXPO_PUBLIC_ODOO_URL`, que Vite inyecta con `define` desde el entorno de build. Si contiene `libertariocoffee.odoo.com`, la app muestra el aviso y no arranca.

## PWA y offline

- `vite-plugin-pwa` con `registerType: "autoUpdate"`; `main.tsx` llama `registerSW({ immediate: true })`.
- Manifest: `standalone`, `portrait`, iconos 192, 512 y maskable. `index.html` trae las metas de Apple para pantalla completa.
- Workbox precachea `js`, `css`, `html`, `png`, `jpg` y `woff2`, con `navigateFallback: /index.html`, así que las rutas internas abren sin red.
- En `npm run dev` el service worker está apagado (`devOptions.enabled: false`). Para probarlo: `npm run build && npm run preview`.
- Sin red el invitado ve su cuenta, el código, el libro y la carta con las fotos ya cacheadas. Google sign-in y la geolocalización necesitan red y permisos.

## Camino a React Native

- `core/` e `i18n/` no dependen de plataforma. Las excepciones son los adaptadores: `storage.ts` define `KeyValueStore` (en web, `localStorage`; en nativo, `AsyncStorage` con la misma forma) y `market.ts` lee `window.location` y `localStorage` (en nativo, `Linking` y `AsyncStorage`). `google.ts` es el adaptador web de GIS; en nativo se cambia por `expo-auth-session`.
- `state/` son providers de React y se portan casi tal cual. `presence.tsx` usa `navigator.geolocation` y `Notification`; en nativo, `expo-location` y `expo-notifications`.
- `ui/` y `motion/` son la capa web: DOM, CSS, SVG animado con `motion`. Se reescriben con React Native y Reanimated o Skia. `book/` usa pointer events y CSS 3D; en nativo, gesture-handler y Reanimated.
- La clave de almacenamiento es la misma que la de la app Expo, así que un teléfono que instale el binario nativo encuentra su cuenta.

## Fotos vivas, video y marca

- `web/public/brand/`: logotipo blanco y azul, isotipo. `web/public/products/`: bolsas de café en PNG transparente bajadas de la tienda Shopify (`/products.json`). `web/public/menu/`: fotos reales de la carta. `web/public/video/`: clips cortos del sitio (`beans` = granos tostándose, `cherries` = cerezas), en mp4 + webm con su póster.
- `motion/living-photo.tsx` dibuja una foto "viva": la cámara deriva, el marco se inclina con el giroscopio y encima van capas según la foto (`core/photos.ts`): vapor real (`steam`), condensación (`sweat`), burbujas (`fizz`) y líquido que cae (`pours`, con `motion/stream.tsx`: refracción del fondo, gotas, salpicadura, anillos y mancha húmeda que gira sobre el lecho). Las coordenadas se dan en porcentaje de la fotografía, no del marco, así que caen en el mismo sitio en una tarjeta o a pantalla completa. Si la foto ya muestra el chorro, `body: false` deja solo lo que pasa donde cae.
- Un `PhotoSpec` con `video` reproduce el clip en bucle (silencioso) sobre la foto, que queda de póster y de respaldo. Para usar el clip del V60 vertiendo del sitio: guardarlo como `web/public/video/v60.mp4` (y `.webm`), añadir `CLIPS.v60` en `core/photos.ts` y ponerlo en la portada del libro (`book/pages.tsx`).
- `motion/product.tsx`: la bolsa flota en 3D, se inclina con el dedo o el teléfono y un brillo cruza el empaque.
- La carta recuerda la página del libro, el filtro y el scroll de la lista al volver de un producto (`state/menu-memory.ts`). La primera vez, la esquina de la página se levanta sola cada pocos segundos y una flecha semitransparente sugiere el gesto; desaparece al pasar la primera página.
- El índice del libro son tarjetas por categoría con su foto; arriba del libro hay botones para volver a la portada y al índice.

## Modos y ramas

La app lee `VITE_APP_MODE` de `web/.env` (`core/mode.ts`):

- `menu`: solo la carta. El QR o el enlace abren el libro en `/` (con `?sede=`, `?mesa=`, `?ciudad=`, `?lang=`), la ficha de cada producto se abre y se vuelve; no hay barra inferior, cuenta, pedido ni saldo. Es lo que se lanza primero.
- `full`: todo: arranque, registro, Casa, promo de llegada, pedido, saldo y ajustes.

Las ramas solo se diferencian en ese archivo: `main` lleva `VITE_APP_MODE=menu` y `loyalty` lleva `VITE_APP_MODE=full`. El código es el mismo, así que para liberar el resto basta con hacer merge de `loyalty` en `main` y cambiar el valor (o dejar `full`). Para probar el otro modo sin tocar el archivo: `VITE_APP_MODE=menu npm run dev`.

## Carta en inglés

Con el idioma en inglés (`?lang=en`, el selector ES/EN o Ajustes) toda la carta cambia: categorías, nombres, descripciones y maridajes salen de `web/src/i18n/menu-en.ts` (tomados de las cartas impresas bilingües donde existen). Lo que no tenga traducción queda en español.

## Ciudad y QR

El catálogo se elige así, de mayor a menor prioridad: el QR o el enlace (`?ciudad=cartagena` o `?sede=getsemani`; las sedes se mapean a ciudad en `state/catalog.tsx`), lo que el invitado eligió en Ajustes, el GPS si lo activó, la ciudad por IP que resuelve Cloudflare en `/api/where`, y por defecto Bogotá. La IP acierta la ciudad casi siempre en WiFi y a veces falla en datos móviles (los operadores suelen salir por Bogotá), por eso el QR de cada sede lleva su ciudad. Los códigos están en `docs/qr/` (PNG y SVG): `carta` (detecta sola), `carta-bogota`, `carta-medellin`, `carta-cartagena`.

## Despliegue (Cloudflare Pages)

Proyecto `libertario-carta` en la cuenta de Cloudflare de lidertransformacion@libertariocoffee.com, URL `https://libertario-carta.pages.dev`. Se publica lo que hay en `main` (modo `menu`):

```bash
git checkout main
cd web && npm ci && npm run build
npx wrangler pages deploy dist --project-name libertario-carta --branch main
```

`public/_redirects` manda toda ruta al `index.html` (SPA) y `functions/api/where.ts` se despliega como Pages Function. Wrangler está instalado como dependencia de desarrollo y usa la sesión de `wrangler login` del equipo.

## Safari e iOS

- El ajuste "Reducir movimiento" del sistema **no** apaga los clips, los efectos ni el paso de página (`motion/prefs.ts`, `MOTION_ALWAYS = true`); solo desactiva la inclinación por giroscopio. Antes sí lo apagaba todo y en iPhone con ese ajuste la carta se veía estática.
- El clip de la portada va silenciado a nivel del elemento (`muted` como atributo, no solo como propiedad de React), con `playsinline`; si iOS lo bloquea por bajo consumo, arranca al primer toque.
- iOS 13+ solo comparte el giroscopio tras un toque: `requestTiltPermission()` se pide en el primer `pointerdown`.
- La refracción del cristal (`backdrop-filter: url(#…)`) es solo Chromium; Safari muestra el desenfoque y el borde.
- Se prueba con WebKit real: `npx playwright install webkit` y los scripts de recorrido con `webkit.launch()`; con `reducedMotion: "reduce"` en el contexto se emula el ajuste del iPhone.

## Pruebas

```bash
npm test          # Vitest sobre src/core (reducer, promo, catálogo por ciudad, geo)
npm run typecheck
```

## Pendientes

- Publicar en Cloudflare Pages (o Vercel) para que `/api/where` resuelva la ciudad por IP; en local siempre devuelve lo de `VITE_DEV_CITY`.

- Backend contra la base de prueba de Odoo: saldo en `loyalty.card`, acumulación y canje en el pedido POS.
- Cliente de Google real en `.env.local` y verificación del ID token en el servidor.
- Push notifications. Hoy solo hay `Notification` local con la pestaña en segundo plano.
- Carta y casas de Chile.
- Confirmar con operaciones las coordenadas de Zona G, Calle 93 y Usaquén.
