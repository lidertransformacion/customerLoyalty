/**
 * Pedidos Sura · Libertario — el código del Google Sheet de comandas.
 * https://docs.google.com/spreadsheets/d/1R36skCHE_MoIxtnoPdTwJytokeKhT_eo8UPZaQuvyZg
 *
 * Hace tres cosas:
 *   1. doPost: recibe el pedido que envía la carta de Sura y lo escribe en la hoja «Cola»,
 *      que es la lista de todos los pedidos.
 *   2. onEdit: cuando alguien marca la casilla de un tiquete en el tablero de su sede, pone el pedido como
 *      Entregado en «Cola» y escribe en la hoja oculta «Pedidos» una fila por cada producto, con las
 *      columnas del «Registro de Bebidas» de Mercado Libre, que es lo que lee la automatización de Odoo.
 *      Solo lo entregado llega a «Pedidos». El tiquete desaparece porque «Comandas» solo muestra pendientes.
 *   3. doPost con «action»: atiende la página de comandas de la barra (/comandas en la carta): entrar con usuario y
 *      contraseña de la hoja «usuarios», leer los pedidos, entregar, devolver, eliminar y anotar que la comanda se imprimió.
 *
 * Cómo se instala (una sola vez): ver web/sura/README.md.
 */

/** Qué versión es esta. La dirección de la aplicación web la devuelve, así se sabe desde fuera cuál quedó publicada. */
var VERSION = "2026-11-25.6";

var ORDERS = "Cola";
var LINES = "Pedidos";
var PRODUCTS = "productos";
var CONFIG = "config";
var BOARD = "Comandas";

/** Columnas de «Cola» (la primera es 1). */
var COL = { number: 1, date: 2, time: 3, cedula: 4, area: 5, firstProduct: 6, total: 14, status: 15, deliveredAt: 16, summary: 17, detail: 18, clientId: 19, name: 20, printedAt: 21 };
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

/** Hoja «usuarios»: quién puede entrar a la página de comandas. Columnas: usuario, clave, nombre, activo. */
var USERS = "usuarios";
/** En «Pedidos»: la columna estado_odoo (la llena la automatización) y la columna «pedido» (el número del pedido en «Cola»). */
var LINE_STATE_COLUMN = 14;
var LINE_ORDER_COLUMN = 18;
/** Cuántos pedidos entregados ve la página en su historial, y cuánto dura una sesión. */
var HISTORY = 400;
var SESSION_DAYS = 30;

/**
 * Cuántos pedidos puede hacer una misma cédula en un día. Se cambia sin tocar el código: en la hoja «config»,
 * una fila con «pedidos_por_cedula_al_dia» y el número (0 = sin límite). Una comanda eliminada no cuenta.
 */
var ORDERS_PER_ID_PER_DAY = 1;

/** Hoja «areas»: de dónde llega un pedido. La columna B («area») es el nombre que envía la carta y que sale en el tiquete. */
var AREAS = "areas";

function doPost(e) {
  var request;
  try {
    request = JSON.parse(e.postData.contents);
  } catch (error) {
    return reply({ ok: false, error: "pedido vacío" });
  }
  // la página de comandas habla por aquí mismo, con «action»
  if (request && typeof request.action === "string") {
    try {
      return reply(board(request));
    } catch (error) {
      return reply({ ok: false, error: String(error) });
    }
  }
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    var order = request;
    var problem = problemWith(order);
    if (problem) return reply({ ok: false, error: problem });
    if (!knownArea(order.area)) return reply({ ok: false, error: "área desconocida" });

    var sheet = ordersSheet(SpreadsheetApp.getActive());
    var last = sheet.getLastRow();

    // el mismo envío dos veces (un segundo toque, una red lenta) no escribe dos pedidos
    if (last > 1) {
      var from = Math.max(2, last - 199);
      var rows = sheet.getRange(from, 1, last - from + 1, COL.clientId).getValues();
      for (var i = rows.length - 1; i >= 0; i--) {
        if (rows[i][COL.clientId - 1] === order.clientId) return reply({ ok: true, number: rows[i][COL.number - 1] });
      }
    }

    var now = new Date();
    // una cédula, un pedido al día: el segundo no se escribe
    if (alreadyOrdered(sheet, last, String(order.cedula), now)) return reply({ ok: false, error: "ya pidió hoy" });

    var number = last > 1 ? Number(sheet.getRange(last, COL.number).getValue()) + 1 : 1;
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
    row[COL.printedAt - 1] = "";

    sheet.getRange(last + 1, 1, 1, row.length).setValues([row]);
    SpreadsheetApp.flush();
    return reply({ ok: true, number: number });
  } catch (error) {
    return reply({ ok: false, error: String(error) });
  } finally {
    lock.releaseLock();
  }
}

/** Si esa cédula ya llegó hoy a su tope de pedidos. Los eliminados (Anulado) no cuentan. */
function alreadyOrdered(sheet, last, cedula, now) {
  var limit = ORDERS_PER_ID_PER_DAY;
  var config = SpreadsheetApp.getActive().getSheetByName(CONFIG);
  if (config && config.getLastRow() > 1) {
    var settings = config.getRange(2, 1, config.getLastRow() - 1, 2).getValues();
    for (var c = 0; c < settings.length; c++) {
      if (String(settings[c][0]).trim() === "pedidos_por_cedula_al_dia" && settings[c][1] !== "" && !isNaN(Number(settings[c][1]))) limit = Number(settings[c][1]);
    }
  }
  if (!(limit > 0) || last < 2) return false;
  var zone = SpreadsheetApp.getActive().getSpreadsheetTimeZone();
  var today = Utilities.formatDate(now, zone, "yyyy-MM-dd");
  var from = Math.max(2, last - 999);
  var rows = sheet.getRange(from, 1, last - from + 1, COL.status).getValues();
  var count = 0;
  for (var i = rows.length - 1; i >= 0; i--) {
    var when = rows[i][COL.date - 1];
    if (!(when instanceof Date)) continue;
    // los pedidos van en orden: al llegar a uno de otro día ya no hay más de hoy
    if (Utilities.formatDate(when, zone, "yyyy-MM-dd") !== today) break;
    if (String(rows[i][COL.cedula - 1]) === cedula && rows[i][COL.status - 1] !== "Anulado") count++;
  }
  return count >= limit;
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
        order.number === undefined ? "" : order.number,
      ]);
    }
  }
  if (rows.length === 0) return;
  var lines = book.getSheetByName(LINES);
  if (lines.getMaxColumns() < rows[0].length) lines.insertColumnsAfter(lines.getMaxColumns(), rows[0].length - lines.getMaxColumns());
  lines.getRange(lines.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
}

/** Abrir la dirección en el navegador dice si quedó publicada. */
function doGet() {
  return reply({ ok: true, service: "Pedidos Sura", version: VERSION, comandas: true });
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
  var orders = ordersSheet(book);
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
    writeLines(book, { number: row[COL.number - 1], cedula: row[COL.cedula - 1], nombre: row[COL.name - 1], area: row[COL.area - 1], items: items }, now);
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
  if (sheet.getName() === USERS) return hidePasswords(sheet);
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

/* ───────────────────────── la página de comandas ───────────────────────── */

/** Una petición de la página: entrar no pide sesión; lo demás sí. Lo que escribe en las hojas va de a uno. */
function board(request) {
  if (request.action === "login") return login(request);
  if (!whoIs(request.token)) return { ok: false, error: "sesion" };
  var book = SpreadsheetApp.getActive();
  if (request.action === "list") return { ok: true, orders: listOrders(book) };

  var number = Number(request.number);
  if (!(number >= 1)) return { ok: false, error: "no existe" };
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    var result;
    if (request.action === "deliver") result = deliver(book, number);
    else if (request.action === "return") result = giveBack(book, number);
    else if (request.action === "cancel") result = cancelOrder(book, number);
    else if (request.action === "printed") result = markPrinted(book, number, request.force === true);
    else if (request.action === "unprinted") result = clearPrinted(book, number);
    else return { ok: false, error: "acción desconocida" };
    SpreadsheetApp.flush();
    if (result === "no existe" || result === "facturado" || result === "sin filas" || result === "entregado ya") return { ok: false, error: result };
    return { ok: true, result: result, claimed: result === "impreso" };
  } finally {
    lock.releaseLock();
  }
}

/** «Cola» con la columna «Impreso»: si la hoja todavía no la tiene, se le agrega. */
function ordersSheet(book) {
  var sheet = book.getSheetByName(ORDERS);
  if (sheet.getMaxColumns() < COL.printedAt) sheet.insertColumnsAfter(sheet.getMaxColumns(), COL.printedAt - sheet.getMaxColumns());
  return sheet;
}

function moment(value) {
  return value instanceof Date ? value.toISOString() : "";
}

/** Los pedidos para la página: todos los pendientes y los últimos entregados. Sin precios: la barra no los necesita. */
function listOrders(book) {
  var sheet = ordersSheet(book);
  var last = sheet.getLastRow();
  if (last < 2) return [];
  var rows = sheet.getRange(2, 1, last - 1, COL.printedAt).getValues();
  var orders = [];
  var delivered = 0;
  for (var i = rows.length - 1; i >= 0; i--) {
    var row = rows[i];
    if (row[COL.number - 1] === "") continue;
    // una comanda eliminada sigue en «Cola» como Anulado, pero la página no la muestra
    if (row[COL.status - 1] === "Anulado") continue;
    var done = row[COL.status - 1] === "Entregado";
    if (done && ++delivered > HISTORY) continue;
    var items = [];
    try {
      var detail = JSON.parse(row[COL.detail - 1]);
      for (var p = 0; p < detail.length; p++) items.push({ name: detail[p].name, detail: detail[p].detail || "", quantity: detail[p].quantity });
    } catch (error) {
      // un pedido que no se puede leer se muestra con lo que diga su resumen
      items = [{ name: String(row[COL.summary - 1] || "Pedido"), detail: "", quantity: 1 }];
    }
    orders.push({
      number: Number(row[COL.number - 1]),
      at: moment(row[COL.time - 1]) || moment(row[COL.date - 1]),
      cedula: String(row[COL.cedula - 1]),
      name: String(row[COL.name - 1] || ""),
      area: String(row[COL.area - 1] || ""),
      items: items,
      delivered: done,
      deliveredAt: moment(row[COL.deliveredAt - 1]),
      printedAt: moment(row[COL.printedAt - 1]),
    });
  }
  return orders;
}

/** La fila de «Cola» de un pedido por su número (la primera es 2), o 0 si no existe. */
function rowOf(sheet, number) {
  var last = sheet.getLastRow();
  if (last < 2) return 0;
  var numbers = sheet.getRange(2, COL.number, last - 1, 1).getValues();
  for (var i = numbers.length - 1; i >= 0; i--) if (String(numbers[i][0]) === String(number)) return i + 2;
  return 0;
}

/**
 * Devuelve un pedido entregado por error: borra sus filas de «Pedidos» y lo deja Pendiente otra vez.
 * Si la automatización de Odoo ya tomó alguna de sus filas (estado_odoo con algo), no se devuelve: "facturado".
 * Un pedido entregado antes de que «Pedidos» guardara el número no se puede devolver desde aquí: "sin filas".
 */
function giveBack(book, number) {
  var orders = ordersSheet(book);
  var at = rowOf(orders, number);
  if (!at) return "no existe";
  if (orders.getRange(at, COL.status).getValue() !== "Entregado") return "ya estaba";
  var lines = book.getSheetByName(LINES);
  var last = lines.getLastRow();
  var mine = [];
  if (last > 1 && lines.getMaxColumns() >= LINE_ORDER_COLUMN) {
    var table = lines.getRange(2, 1, last - 1, LINE_ORDER_COLUMN).getValues();
    for (var i = 0; i < table.length; i++) {
      if (table[i][LINE_ORDER_COLUMN - 1] === "" || String(table[i][LINE_ORDER_COLUMN - 1]) !== String(number)) continue;
      if (String(table[i][LINE_STATE_COLUMN - 1]) !== "" || String(table[i][LINE_STATE_COLUMN]) !== "") return "facturado";
      mine.push(i + 2);
    }
  }
  if (mine.length === 0) return "sin filas";
  for (var r = mine.length - 1; r >= 0; r--) lines.deleteRow(mine[r]);
  orders.getRange(at, COL.status, 1, 2).setValues([["Pendiente", ""]]);
  return "devuelto";
}

/**
 * Elimina una comanda pedida por error: queda en «Cola» como Anulado (no se borra la fila) y sale de la página.
 * Nada llega a «Pedidos». Una ya entregada no se elimina: primero se devuelve. Para recuperarla, se escribe
 * Pendiente otra vez en su columna Estado.
 */
function cancelOrder(book, number) {
  var orders = ordersSheet(book);
  var at = rowOf(orders, number);
  if (!at) return "no existe";
  var status = orders.getRange(at, COL.status).getValue();
  if (status === "Entregado") return "entregado ya";
  if (status !== "Anulado") orders.getRange(at, COL.status).setValue("Anulado");
  return "anulado";
}

/** Anota que la comanda salió por una impresora. Sin «force», solo el primero que llega se la queda: no sale dos veces. */
function markPrinted(book, number, force) {
  var orders = ordersSheet(book);
  var at = rowOf(orders, number);
  if (!at) return "no existe";
  var cell = orders.getRange(at, COL.printedAt);
  if (cell.getValue() !== "" && !force) return "ya impreso";
  cell.setValue(new Date());
  return "impreso";
}

/** La impresora falló: la comanda vuelve a quedar sin imprimir. */
function clearPrinted(book, number) {
  var orders = ordersSheet(book);
  var at = rowOf(orders, number);
  if (!at) return "no existe";
  orders.getRange(at, COL.printedAt).setValue("");
  return "sin imprimir";
}

/* ───────────────────────── usuarios y sesión ───────────────────────── */

function hex(bytes) {
  var out = "";
  for (var i = 0; i < bytes.length; i++) out += ("0" + (bytes[i] & 0xff).toString(16)).slice(-2);
  return out;
}

/** Una clave como queda guardada: «sha256$sal$huella». La clave misma no queda en la hoja. */
function hidden(password, salt) {
  var seed = salt || Utilities.getUuid().replace(/-/g, "").slice(0, 16);
  return "sha256$" + seed + "$" + hex(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, seed + "|" + password, Utilities.Charset.UTF_8));
}

/** Al escribir una clave en la columna B de «usuarios», se guarda su huella en vez de la clave. */
function hidePasswords(sheet) {
  var last = sheet.getLastRow();
  if (last < 2) return;
  var cells = sheet.getRange(2, 2, last - 1, 1);
  var values = cells.getValues();
  var changed = false;
  for (var i = 0; i < values.length; i++) {
    var value = String(values[i][0]);
    if (value !== "" && value.indexOf("sha256$") !== 0) {
      values[i][0] = hidden(value);
      changed = true;
    }
  }
  if (changed) cells.setValues(values);
}

/** Los usuarios activos de la hoja: { usuario: { stored, name } }. */
function users() {
  var sheet = SpreadsheetApp.getActive().getSheetByName(USERS);
  var out = {};
  if (!sheet || sheet.getLastRow() < 2) return out;
  hidePasswords(sheet);
  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 4).getValues();
  for (var i = 0; i < rows.length; i++) {
    var user = String(rows[i][0]).trim().toLowerCase();
    var active = rows[i][3];
    if (!user || !rows[i][1] || active === false || /^(no|false|0)$/i.test(String(active).trim())) continue;
    out[user] = { stored: String(rows[i][1]), name: String(rows[i][2] || user) };
  }
  return out;
}

function secret() {
  var properties = PropertiesService.getScriptProperties();
  var value = properties.getProperty("COMANDAS_SECRET");
  if (!value) {
    value = Utilities.getUuid() + Utilities.getUuid();
    properties.setProperty("COMANDAS_SECRET", value);
  }
  return value;
}

function sign(payload) {
  return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(payload, secret()));
}

/** Entrar: usuario y clave de la hoja «usuarios». Cinco intentos fallidos seguidos cierran la puerta diez minutos. */
function login(request) {
  var user = String(request.user || "").trim().toLowerCase();
  var password = String(request.password || "");
  if (!user || !password || user.length > 60 || password.length > 200) return { ok: false, error: "credenciales" };
  var cache = CacheService.getScriptCache();
  var key = "intentos:" + user;
  var fails = Number(cache.get(key) || 0);
  if (fails >= 5) return { ok: false, error: "bloqueado" };
  var known = users()[user];
  var parts = known ? known.stored.split("$") : [];
  if (!known || parts.length !== 3 || hidden(password, parts[1]) !== known.stored) {
    cache.put(key, String(fails + 1), 600);
    return { ok: false, error: "credenciales" };
  }
  cache.remove(key);
  // la sesión lleva una seña de la clave: al cambiar la clave en la hoja, las sesiones viejas dejan de valer
  var payload = user + "|" + (Date.now() + SESSION_DAYS * 86400000) + "|" + parts[2].slice(0, 12);
  return { ok: true, token: Utilities.base64EncodeWebSafe(payload) + "." + sign(payload), name: known.name };
}

/** De quién es una sesión, o "" si no vale: firma, fecha, y que el usuario siga activo con la misma clave. */
function whoIs(token) {
  if (typeof token !== "string" || token.length > 600) return "";
  var pieces = token.split(".");
  if (pieces.length !== 2) return "";
  var payload;
  try {
    payload = Utilities.newBlob(Utilities.base64DecodeWebSafe(pieces[0])).getDataAsString();
  } catch (error) {
    return "";
  }
  if (sign(payload) !== pieces[1]) return "";
  var fields = payload.split("|");
  if (fields.length !== 3 || !(Number(fields[1]) > Date.now())) return "";
  var known = users()[fields[0]];
  if (!known || known.stored.split("$")[2].slice(0, 12) !== fields[2]) return "";
  return fields[0];
}
