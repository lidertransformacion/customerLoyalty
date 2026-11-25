/**
 * Pedidos Sura · Libertario — el código del Google Sheet de comandas.
 * https://docs.google.com/spreadsheets/d/1R36skCHE_MoIxtnoPdTwJytokeKhT_eo8UPZaQuvyZg
 *
 * Hace dos cosas:
 *   1. doPost: recibe el pedido que envía la carta de Sura y lo escribe en la hoja oculta «Cola»,
 *      que es lo que lee el tablero.
 *   2. onEdit: cuando alguien marca la casilla de un tiquete en el tablero de su sede, pone el pedido como
 *      Entregado en «Cola» y escribe en la hoja oculta «Pedidos» una fila por cada producto, con las
 *      columnas del «Registro de Bebidas» de Mercado Libre, que es lo que lee la automatización de Odoo.
 *      Solo lo entregado llega a «Pedidos». El tiquete desaparece porque «Comandas» solo muestra pendientes.
 *
 * Cómo se instala (una sola vez): ver web/sura/README.md.
 */

/** Qué versión es esta. La dirección de la aplicación web la devuelve, así se sabe desde fuera cuál quedó publicada. */
var VERSION = "2026-11-25.3";

var ORDERS = "Cola";
var LINES = "Pedidos";
var PRODUCTS = "productos";
var CONFIG = "config";
var BOARD = "Comandas";

/** Columnas de «Cola» (la primera es 1). */
var COL = { number: 1, date: 2, time: 3, cedula: 4, area: 5, firstProduct: 6, total: 14, status: 15, deliveredAt: 16, summary: 17, detail: 18, clientId: 19, name: 20 };
var PRODUCT_COLUMNS = 8;

/**
 * «Comandas» es el tablero de las dos sedes; el filtro «Punto de venta» (celda K6: Todos, Calle 100, Usaquén)
 * deja solo los pedidos de una. Es una rejilla de tiquetes: cinco por fila desde la fila 8, cada uno de seis filas de alto
 * (la casilla va en la quinta) y tres columnas de ancho (la casilla va en la primera: B, E, H, K, N).
 * El tiquete número k muestra la fila k de la cola de pendientes, que vive oculta desde U8.
 */
var BOARD_FIRST_ROW = 8;
var BOARD_FIRST_COLUMN = 2;
var TICKET_ROWS = 6;
var TICKET_COLUMNS = 3;
var TICKETS_PER_ROW = 5;
var TICKET_CHECK_ROW = 4;
var QUEUE_NUMBER_COLUMN = 21;

/** Hoja «areas»: de dónde llega un pedido. La columna B («area») es el nombre que envía la carta y que sale en el tiquete. */
var AREAS = "areas";

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    var order = JSON.parse(e.postData.contents);
    var problem = problemWith(order);
    if (problem) return reply({ ok: false, error: problem });
    if (!knownArea(order.area)) return reply({ ok: false, error: "área desconocida" });

    var sheet = SpreadsheetApp.getActive().getSheetByName(ORDERS);
    var last = sheet.getLastRow();

    // el mismo envío dos veces (un segundo toque, una red lenta) no escribe dos pedidos
    if (last > 1) {
      var from = Math.max(2, last - 199);
      var rows = sheet.getRange(from, 1, last - from + 1, COL.clientId).getValues();
      for (var i = rows.length - 1; i >= 0; i--) {
        if (rows[i][COL.clientId - 1] === order.clientId) return reply({ ok: true, number: rows[i][COL.number - 1] });
      }
    }

    var number = last > 1 ? Number(sheet.getRange(last, COL.number).getValue()) + 1 : 1;
    var now = new Date();
    var row = [];
    row[COL.number - 1] = number;
    row[COL.date - 1] = now;
    row[COL.time - 1] = now;
    row[COL.cedula - 1] = String(order.cedula);
    row[COL.area - 1] = order.area;
    var total = 0;
    var summary = [];
    for (var p = 0; p < PRODUCT_COLUMNS; p++) {
      var item = order.items[p];
      row[COL.firstProduct - 1 + p] = item ? (item.quantity > 1 ? item.quantity + " × " : "") + fullName(item) : "";
      if (item) {
        total += item.price * item.quantity;
        summary.push(ticketText(item));
      }
    }
    row[COL.total - 1] = total;
    row[COL.status - 1] = "Pendiente";
    row[COL.deliveredAt - 1] = "";
    row[COL.summary - 1] = summary.join("\n");
    row[COL.detail - 1] = JSON.stringify(order.items);
    row[COL.clientId - 1] = order.clientId;
    row[COL.name - 1] = typeof order.nombre === "string" ? order.nombre.replace(/\s+/g, " ").trim().slice(0, 60) : "";

    sheet.getRange(last + 1, 1, 1, row.length).setValues([row]);
    SpreadsheetApp.flush();
    return reply({ ok: true, number: number });
  } catch (error) {
    return reply({ ok: false, error: String(error) });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Un combo en el tiquete, como una lista: el combo y, debajo, cada cosa que lleva.
 *   1 × Refrigerio
 *      • Arepa de queso
 *      • Infusión
 */
function ticketText(item) {
  var text = item.quantity + " × " + item.name;
  var parts = item.detail ? String(item.detail).split(" + ") : [];
  for (var i = 0; i < parts.length; i++) text += "\n     • " + parts[i];
  return text;
}

/** El combo con lo que lleva, en una sola línea: «Refrigerio (Arepa de queso + Infusión)». */
function fullName(item) {
  return item.detail ? item.name + " (" + item.detail + ")" : item.name;
}

/**
 * «Pedidos»: una fila por unidad entregada, con la fecha y hora de la entrega y las columnas cedula, Productos, precio, etiqueta, fecha, nombre,
 * categoria, referencia_odoo, id_odoo, punto_venta, pos_config_id, product_id, fecha_dia, estado_odoo y
 * factura_odoo, y al final razon_social y nit (la compañía que asume el consumo). Lo de Odoo de cada producto sale de la hoja «productos» (por su id en la carta) y lo del
 * punto de venta de «config»; lo que allí falte queda vacío. punto_venta es la sede desde donde se pidió. estado_odoo y factura_odoo los llena la
 * automatización; nombre es el que la persona escribió al pedir.
 */
function writeLines(book, order, now) {
  var products = {};
  var table = book.getSheetByName(PRODUCTS).getDataRange().getValues();
  for (var r = 1; r < table.length; r++) {
    if (table[r][0]) products[String(table[r][0])] = { name: table[r][1], reference: table[r][2], odooId: table[r][3], category: table[r][4], price: table[r][5] };
  }
  var config = {};
  var settings = book.getSheetByName(CONFIG).getDataRange().getValues();
  for (var c = 1; c < settings.length; c++) config[String(settings[c][0])] = settings[c][1];

  // punto_venta: la sede desde donde se pidió («Salud Sura Calle 100», «Salud Sura Usaquen») y su id en Odoo,
  // según las columnas «sede» y «pos_config_id» de la hoja «areas»; si allí faltan, lo que diga «config»
  var store = config.punto_venta || "";
  var storeId = config.pos_config_id === undefined ? "" : String(config.pos_config_id);
  // razon_social: la compañía que asume el consumo del servicio desde donde se pidió (columna «compania» de «areas»)
  var company = "";
  var nit = "";
  var areas = book.getSheetByName(AREAS);
  if (areas && areas.getLastRow() > 1) {
    var places = areas.getRange(2, 1, areas.getLastRow() - 1, 13).getValues();
    for (var a = 0; a < places.length; a++) {
      if (String(places[a][1]) !== String(order.area)) continue;
      if (places[a][3]) company = String(places[a][3]);
      if (places[a][4]) nit = String(places[a][4]);
      if (places[a][5]) store = String(places[a][5]);
      if (places[a][12] !== "") storeId = String(places[a][12]);
    }
  }

  var zone = book.getSpreadsheetTimeZone();
  var stamp = Utilities.formatDate(now, zone, "yyyy-MM-dd HH:mm");
  var day = Utilities.formatDate(now, zone, "yyyy-MM-dd");
  var rows = [];
  for (var i = 0; i < order.items.length; i++) {
    var item = order.items[i];
    var known = products[item.id] || {};
    var price = known.price === "" || known.price === undefined ? item.price : known.price;
    for (var unit = 0; unit < item.quantity; unit++) {
      rows.push([
        String(order.cedula),
        known.name ? known.name + (item.detail ? " (" + item.detail + ")" : "") : fullName(item),
        price,
        config.etiqueta || "Sura",
        stamp,
        order.nombre || "",
        known.category || "",
        known.reference || "",
        known.odooId === undefined ? "" : String(known.odooId),
        store,
        storeId,
        known.odooId === undefined ? "" : String(known.odooId),
        day,
        "",
        "",
        company,
        nit,
      ]);
    }
  }
  if (rows.length === 0) return;
  var lines = book.getSheetByName(LINES);
  lines.getRange(lines.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
}

/** Abrir la dirección en el navegador dice si quedó publicada. */
function doGet() {
  return reply({ ok: true, service: "Pedidos Sura", version: VERSION });
}

function problemWith(order) {
  if (!order || typeof order !== "object") return "pedido vacío";
  if (typeof order.clientId !== "string" || order.clientId.length < 8 || order.clientId.length > 80) return "envío sin identificar";
  if (!/^\d{6,15}$/.test(String(order.cedula))) return "cédula no válida";
  if (order.nombre !== undefined && (typeof order.nombre !== "string" || order.nombre.length > 120)) return "nombre no válido";
  if (typeof order.area !== "string" || order.area.length === 0 || order.area.length > 80) return "área no válida";
  if (!Array.isArray(order.items) || order.items.length === 0 || order.items.length > PRODUCT_COLUMNS) return "productos no válidos";
  for (var i = 0; i < order.items.length; i++) {
    var item = order.items[i];
    if (!item || typeof item.id !== "string" || item.id.length > 80 || typeof item.name !== "string" || item.name.length === 0 || item.name.length > 80) return "producto no válido";
    if (item.detail !== undefined && (typeof item.detail !== "string" || item.detail.length > 200)) return "detalle no válido";
    if (!(item.quantity >= 1 && item.quantity <= 9) || Math.floor(item.quantity) !== item.quantity) return "cantidad no válida";
    if (!(item.price >= 0 && item.price <= 500000)) return "precio no válido";
  }
  return null;
}

/** Un área vale si está en la hoja «areas». Si esa hoja falta o está vacía, vale cualquiera: el pedido no se pierde. */
function knownArea(name) {
  var sheet = SpreadsheetApp.getActive().getSheetByName(AREAS);
  if (!sheet || sheet.getLastRow() < 2) return true;
  var names = sheet.getRange(2, 2, sheet.getLastRow() - 1, 1).getValues();
  for (var i = 0; i < names.length; i++) if (String(names[i][0]) === name) return true;
  return false;
}

function reply(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Entrega un pedido por su número: escribe sus filas en «Pedidos» y lo pone como Entregado en «Cola» y escribe sus filas en «Pedidos».
 * Devuelve "entregado", "ya estaba" (dos toques seguidos: no se escribe dos veces) o "no existe".
 */
function deliver(book, number) {
  var orders = book.getSheetByName(ORDERS);
  var last = orders.getLastRow();
  if (last < 2) return "no existe";
  var numbers = orders.getRange(2, COL.number, last - 1, 1).getValues();
  for (var i = numbers.length - 1; i >= 0; i--) {
    if (String(numbers[i][0]) !== String(number)) continue;
    var row = orders.getRange(i + 2, 1, 1, COL.name).getValues()[0];
    if (row[COL.status - 1] === "Entregado") return "ya estaba";
    // primero se lee lo pedido: si no se puede leer, el pedido no queda marcado a medias
    var items = JSON.parse(row[COL.detail - 1]);
    var now = new Date();
    writeLines(book, { cedula: row[COL.cedula - 1], nombre: row[COL.name - 1], area: row[COL.area - 1], items: items }, now);
    orders.getRange(i + 2, COL.status, 1, 2).setValues([["Entregado", now]]);
    return "entregado";
  }
  return "no existe";
}

/**
 * La casilla de un tiquete: entrega su pedido y se desmarca sola para el tiquete que ocupe ese lugar.
 * Vale en toda hoja cuyo nombre empiece por «Comandas». Si algo falla, lo dice en un aviso en la pantalla
 * en vez de quedarse callada.
 */
function onEdit(e) {
  var range = e.range;
  var sheet = range.getSheet();
  if (sheet.getName().indexOf(BOARD) !== 0 || range.getNumRows() !== 1 || range.getNumColumns() !== 1) return;
  var down = range.getRow() - BOARD_FIRST_ROW;
  var across = range.getColumn() - BOARD_FIRST_COLUMN;
  if (down < 0 || across < 0 || across >= TICKETS_PER_ROW * TICKET_COLUMNS) return;
  if (down % TICKET_ROWS !== TICKET_CHECK_ROW || across % TICKET_COLUMNS !== 0) return;
  if (range.getValue() !== true) return;

  try {
    var ticket = Math.floor(down / TICKET_ROWS) * TICKETS_PER_ROW + Math.floor(across / TICKET_COLUMNS);
    var number = sheet.getRange(BOARD_FIRST_ROW + ticket, QUEUE_NUMBER_COLUMN).getValue();
    range.setValue(false);
    if (number === "" || number === null) return;
    var result = deliver(e.source, number);
    if (result === "no existe") e.source.toast("No encontré el pedido #" + number + ". Avisa a soporte.", "Pedidos Sura", 15);
  } catch (error) {
    e.source.toast("No se pudo marcar el pedido como entregado. Avisa a soporte. (" + error + ")", "Pedidos Sura", 20);
  }
}
