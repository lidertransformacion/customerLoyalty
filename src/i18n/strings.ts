/**
 * Customer-facing copy for Colombian guests. Keys are English.
 * Every Spanish sentence in the interface comes from this file.
 */
export const copy = {
  brand: "Libertario",
  roastLine: "Tostión de la casa",
  roastLabel: "Café en tostión",
  productionBlocked: "Esta demo no habla con la tienda de producción.",
  missingPage: "Esa página no está en la casa.",
  back: "Volver",

  tabs: {
    home: "Casa",
    menu: "Carta",
    table: "Mesa",
  },

  signup: {
    kicker: "Libertario",
    title: "Un momento",
    lead: "Celular, correo, nombre y cédula. Con eso entra el bono de 1.000 puntos.",
    phone: "Celular",
    email: "Correo",
    name: "Nombre",
    idNumber: "Cédula",
    phoneError: "Diez dígitos, empieza por 3.",
    emailError: "Hace falta un correo.",
    nameError: "El nombre queda corto.",
    idError: "Entre 6 y 10 dígitos.",
    submit: "Entrar a la casa",
    footnote:
      "La cédula se guarda en este teléfono, con el resto de la cuenta. No sale a producción.",
    welcomeNote: "El bono de bienvenida ya está: 1.000 puntos.",
  },

  home: {
    kicker: "La casa",
    pointsLabel: "puntos",
    earnRule: "Cada $100 en el mostrador suman un punto.",
    awayFromStore: (storeName: string) =>
      `Estás en ${storeName}. En este demo, la casa más cerca es Zona G. `,
    openNearest: "Ver Zona G",
    nearestStore: "Zona G es la casa más cerca en este demo.",
    nextReward: (rewardName: string, missing: number) =>
      `Para ${rewardName} faltan ${formatPoints(missing)}.`,
    allRewardsInReach: "Los tres están al alcance.",
    thisMonth: "Este mes",
    nothingExpires: "No vence ningún punto de esta cuenta.",
    rewardsUntil: (date: string) => `Los premios se piden hasta el ${date}.`,
    cupsTitle: "Las tazas",
    cupsNote:
      "Ocho tazas. La octava es un filtrado Paz. No es un premio de puntos.",
    counterTitle: "Para la caja",
    counterNote:
      "Se muestra en el mostrador. No paga. Queda guardado en este teléfono, también sin red.",
    counterCodeLabel: "Código del mostrador",
    redeemTitle: "Lo que se cambia por puntos",
    redeemNote:
      "Se cambia entero. No se completa con plata. El canje no suma puntos.",
    canRedeemNow: "Con lo que tienes",
    later: "Más adelante",
    rewardMeta: (points: number, note: string) =>
      `${formatPoints(points)} puntos · ${note}`,
    missingPoints: (missing: number) => `Faltan ${formatPoints(missing)}`,
    redeem: "Canjear",
    historyTitle: "En las sedes",
    forgetPhone: "Olvidar este teléfono",
  },

  rewards: {
    americano: {
      name: "Americano Paz o Libre",
      note: "Taza de Paz o de Libre.",
    },
    cappuccino: {
      name: "Cappuccino Paz o Libre",
      note: "Taza de Paz o de Libre.",
    },
    croissant: {
      name: "Croissant de almendras",
      note: "Del horno de la casa.",
    },
  },

  stores: {
    pickerKicker: "La casa",
    pickerTitle: "Dónde se anota",
    pickerNote:
      "Este demo no usa el GPS. Zona G queda como la casa más cerca. La carta es la misma; cambian el pedido y el historial.",
    selected: "Esta",
    nearby: "Cerca",
    names: {
      "zona-g": "Zona G",
      "calle-93": "Calle 93",
      "calle-85": "Calle 85",
      usaquen: "Usaquén",
    },
    ledger: {
      "zona-g": "Libertario Zona G",
      "calle-93": "Libertario calle 93",
      "calle-85": "Libertario calle 85",
      usaquen: "Libertario Usaquén",
    },
  },

  menu: {
    kicker: "La carta",
    away: (storeName: string) =>
      `Estás mirando ${storeName}. En este demo, la casa más cerca es Zona G. `,
    openNearest: "Ver esa carta",
    searchPlaceholder: "Buscar en la carta",
    searchLabel: "Buscar en la carta",
    allCategories: "Toda",
    priceAll: "Todo",
    priceTo15: "Hasta $15.000",
    priceTo30: "Hasta $30.000",
    plant: "Vegetal",
    noNuts: "Sin nueces",
    openBook: "Pasar la carta",
    empty: "No está en la carta con ese filtro.",
    earns: (points: number) => `Suma ${formatPoints(points)}`,
    moreInList: (count: number) => `Y ${count} más, en la carta corrida.`,
    coverLine: "Lo que se tuesta y lo que se sirve.",
    close: "Cerrar",
    previous: "Anterior",
    turn: "Pasar",
    missingItem: "Esa pieza no está en la carta.",
    earnsAtCounter: (points: number) =>
      `En el mostrador esta pieza suma ${formatPoints(points)}. Cada $100 son un punto.`,
    addToTable: "Sumar a la mesa",
    postAtRegister: "Anotar en caja",
    notCharged: "No se cobra aquí. La caja de la sede es la que factura.",
  },

  table: {
    kicker: "La mesa",
    title: (number: string) => `Mesa ${number}`,
    lead: (storeName: string) =>
      `El pedido se arma aquí, en ${storeName}. Se cobra en el mostrador. La app no paga.`,
    numberLabel: "Número",
    numberA11y: "Número de mesa",
    codeNote: "Código de esta mesa. No es un pago.",
    orderTitle: "La comanda",
    empty: "Todavía no hay nada sobre la mesa.",
    linePoints: (price: string, points: number) =>
      `${price} · suma ${formatPoints(points)} al cobrar`,
    remove: "Quitar",
    callFloor: "Avisar en sala",
    postOrder: "Anotar la comanda en caja",
    footnote:
      "En la tienda, la caja cobra. Aquí solo se anotan los puntos y las tazas.",
  },

  ledger: {
    welcome: "Bono de bienvenida",
    eighthCup: "Octava taza · Filtrado Paz",
    redemption: (name: string) => `Canje · ${name}`,
  },

  notes: {
    postedItem: (name: string) =>
      `${name} quedó anotada en la caja. No se cobró: este demo no cobra.`,
    emptyTable: "La mesa está vacía.",
    orderPosted:
      "La comanda pasó al mostrador. El cobro, en la caja. Aquí solo se anotaron los puntos.",
    floorCall: (table: string, storeName: string) =>
      `Quedó el aviso de la mesa ${table} en ${storeName}. No sale de este teléfono.`,
    cannotRedeem: (missing: number, rewardName: string) =>
      `Faltan ${formatPoints(missing)} puntos para ${rewardName}. Se cambia entero.`,
    redeemed: (rewardName: string, points: number) =>
      `${rewardName} quedó pedido. Se descontaron ${formatPoints(points)} puntos. Se recoge en caja.`,
    eighthCupToast: "La octava taza. Un filtrado Paz.",
  },

  nativeNote:
    "La llegada a la sede, el aviso en el teléfono y la tarjeta de Wallet quedan para la app nativa. Aquí están apagados. Apple y Google siguen pendientes.",

  months: [
    "ene",
    "feb",
    "mar",
    "abr",
    "may",
    "jun",
    "jul",
    "ago",
    "sep",
    "oct",
    "nov",
    "dic",
  ],
} as const;

export function formatPoints(value: number): string {
  return Math.round(value).toLocaleString("es-CO");
}
