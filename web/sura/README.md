# Carta de Sura con pedido

La carta de Colombia (mismo diseño) con los productos de Sura, donde el invitado además envía su pedido: toca «Agregar», abre «Ver mi pedido», elige su área, escribe su cédula y toca «Enviar pedido». El pedido llega a un Google Sheet que la barra lee como comandas.

- Rama `sura`, worktree `../customerLoyalty-sura`. Se corre con `npx vite --port 5175 --host` desde `web/`; `web/.env` ya trae `VITE_CORNER=sura`.
- Lo que se sirve: `SURA_COMBOS` en `src/core/sura.ts`. Todo es un combo a un solo precio (tres Refrigerios, uno por acompañamiento, con la bebida a elegir; Desayuno ejecutivo con y sin granola, Desayuno con huevos, Desayuno con sándwich de croissant); un combo puede tener `choices` (bebida, acompañamiento, cómo van los huevos) y entonces la carta pregunta antes de agregarlo. Para sumar un combo o una opción se edita esa lista y, con el mismo id, la hoja «productos» del Sheet. El invitado no ve precios (`showPrices`); el precio viaja con el pedido. Fotos: todas las de la carta salen de la carpeta de Drive «Menú Sura» (combos, bebidas y portadas `*-1x1`), publicadas con `scripts/sura-studio.py` en `public/menu/su/`. El script lleva el fondo a blanco puro y, para las portadas de capítulo, saca una versión con el blanco transparente (slug con `+`).
- Áreas: `SURA_AREAS` en el mismo archivo (cinco servicios en dos sedes: Calle 100 y Usaquén) y la hoja oculta «areas» del Sheet, que además guarda la compañía que asume el consumo, su NIT y los responsables. El nombre del área debe decir lo mismo en los dos sitios; el Sheet solo acepta pedidos de un área que esté en esa hoja.
- Un QR puede traer el área puesta: `/?area=c100-muestras` (`c100-ejecutivos`, `c100-ensayos`, `c100-muestras`, `usaquen-arl`, `usaquen-muestras`).
- En desarrollo no se escribe en el Sheet: Vite responde `/api/sura-order`, numera los pedidos y los imprime en la terminal. Para escribir en el Sheet se pone la dirección de la aplicación web en `VITE_SURA_ORDERS_URL`.

## El Sheet

[Pedidos Sura · Libertario](https://docs.google.com/spreadsheets/d/1R36skCHE_MoIxtnoPdTwJytokeKhT_eo8UPZaQuvyZg)

- **Comandas** (la que ve la barra): un tablero de cocina. Cada pedido pendiente es un tiquete (número y hora, área, cédula, lo pedido), cinco por fila, del más viejo al más nuevo; caben 40 a la vez. Se marca la casilla del tiquete al entregar y el tiquete desaparece. El logo del encabezado se lee de la carta publicada de Chile (`/brand/logo-white.png`). Arriba, «Buscar por cédula»: se escribe el número (con o sin puntos) y el tablero deja solo los pedidos de esa persona; al borrarlo vuelven todos.
- **Pedidos** (oculta): lo que lee la automatización de Odoo. Una fila por cada unidad pedida, con las mismas columnas del «Registro de Bebidas» de Mercado Libre: `cedula`, `Productos`, `precio`, `etiqueta`, `fecha`, `nombre`, `categoria`, `referencia_odoo`, `id_odoo`, `punto_venta`, `pos_config_id`, `product_id`, `fecha_dia`, `estado_odoo`, `factura_odoo`. Las filas se escriben al marcar el pedido como entregado, con la fecha y hora de la entrega: lo que nadie recoge no llega a esta hoja. `etiqueta` es «Sura»; `punto_venta` y `pos_config_id` son la sede desde donde se pidió y su id en Odoo (columnas `sede` y `pos_config_id` de la hoja «areas»); `nombre` queda vacío (la carta solo pide la cédula) y `estado_odoo` y `factura_odoo` los llena la automatización.
- **Cola** (oculta): un pedido por fila, con su número, hora, cédula, área, resumen y estado (Pendiente o Entregado). Es lo que lee el tablero.
- **productos** (oculta): de cada producto de la carta (`id_carta`, el id del combo en `SURA_COMBOS`), su nombre, referencia e id en Odoo, su categoría y su precio subsidiado. Lo que falte se llena con el nombre y el precio de la carta, y lo de Odoo queda vacío.
- **config** (oculta): `etiqueta`, `punto_venta` y `pos_config_id` que van en cada fila de «Pedidos».

## Instalar el código del Sheet (una sola vez)

1. Abrir el Sheet → **Extensiones → Apps Script**.
2. Borrar lo que haya, pegar todo `web/sura/Code.gs` y guardar.
3. **Implementar → Nueva implementación → Aplicación web**. «Ejecutar como»: yo. «Quién tiene acceso»: cualquier persona. Implementar y autorizar.
4. Copiar la dirección que termina en `/exec` y ponerla en `web/.env`: `VITE_SURA_ORDERS_URL=https://script.google.com/macros/s/…/exec`. Reiniciar Vite.

Después de cambiar `Code.gs` hay que publicar una versión nueva: **Implementar → Gestionar implementaciones → editar → Versión: nueva**. La dirección no cambia.
