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

  web: {
    install: "Instalar en el teléfono",
    installHint: "Queda en la pantalla de inicio, como una app.",
    offline: "Sin red. Lo que ves está guardado en este teléfono.",
    close: "Cerrar",
    showAtCounter: "Mostrar en caja",
    counterTitle: "Código del mostrador",
    counterLead: "Sube el brillo y acércalo al lector.",
    brightness: "Pantalla al máximo para el lector.",
    memberSince: (date: string) => `En la casa desde el ${date}`,
    member: "Miembro de la casa",
  },

  presence: {
    title: "Avisos al llegar",
    ask: "Activa la ubicación. Cuando entres a una casa Libertario te avisamos de la promo del momento. La ubicación no sale del teléfono.",
    allow: "Activar ubicación",
    later: "Ahora no",
    denied: "La ubicación está apagada. Se activa en los ajustes del navegador.",
    unsupported: "Este navegador no comparte la ubicación.",
    locating: "Buscando la casa más cerca…",
    atStore: (store: string) => `Estás en ${store}.`,
    distance: (meters: string, store: string) => `A ${meters} de ${store}.`,
    simulate: (store: string) => `Simular que llego a ${store}`,
    simulating: (store: string) => `Simulando la llegada a ${store}.`,
    stopSimulating: "Dejar de simular",
    demoNote: "Para probar la promo sin salir: simula la llegada desde la lista de casas.",
  },

  promo: {
    kicker: "Promo de llegada",
    minutesLeft: (time: string) => `Te quedan ${time}`,
    expired: "La promo venció. La próxima vez que entres hay otra.",
    activate: "Activar en caja",
    activated: (title: string, points: number) =>
      `${title} quedó activa. Se sumaron ${formatPoints(points)} puntos por venir.`,
    ledger: (store: string) => `Promo de llegada · ${store}`,
    codeNote: "Muéstralo en el mostrador antes de pagar.",
    onlyToday: "Una por casa, cada día.",
    catalog: {
      filterCroissant: {
        title: "Croissant con tu filtrado",
        detail: "Pide un filtrado de 12 oz y el croissant sencillo va por la casa.",
      },
      doubleCup: {
        title: "Doble taza",
        detail: "La taza de hoy marca dos en las ocho.",
      },
      afternoon: {
        title: "Tarde de espresso",
        detail: "El segundo espresso a mitad de precio, hasta las seis.",
      },
    },
  },

  book: {
    zoom: "Ampliar la página",
    start: "Iniciar",
    cover: "La carta",
    open: "Abrir la carta",
    index: "Índice",
    turnHint: "Desliza para pasar la página",
    page: (n: number, total: number) => `${n} de ${total}`,
    continues: "Sigue en la otra página",
    pairing: "Maridaje",
    brewing: "Así se filtra",
    extracting: "Así se extrae",
    tilt: "Inclina el teléfono. El café se mueve.",
    toList: "Ver como lista",
    toBook: "Ver como libro",
    chapter: (n: number) => `Capítulo ${n}`,
    toCover: "Portada",
    toIndex: "Índice",
    items: (n: number) => (n === 1 ? "1 pieza" : `${n} piezas`),
  },

  cups: {
    pour: "Una taza más.",
    full: "Las ocho. El filtrado va por la casa.",
    left: (n: number) => (n === 1 ? "Falta una taza." : `Faltan ${n} tazas.`),
  },

  landing: {
    kicker: "Bienvenido a la casa",
    lead: "Puntos por cada taza, la carta viva y el pedido desde el teléfono.",
    google: "Continuar con Google",
    email: "Crear cuenta con correo",
    viewMenu: "Ver la carta",
    scanned: (store: string, table: string) => `Mesa ${table} · ${store}`,
    atStore: (store: string) => `Estás en ${store}`,
    noGoogle: "Google entra cuando exista el cliente OAuth de Libertario. Por ahora, con correo.",
    googleFailed: "Google no respondió. Prueba con correo.",
  },

  legal: {
    identity: "Quién eres",
    contact: "Cómo te ubicamos",
    consent: "Lo que aceptas",
    step: (n: number, total: number) => `Paso ${n} de ${total}`,
    next: "Seguir",
    back: "Atrás",
    birthday: "Fecha de nacimiento",
    birthdayHint: "Para el regalo de cumpleaños. Hay que ser mayor de 18.",
    birthdayError: "Hace falta una fecha válida.",
    underage: "El programa es para mayores de 18 años.",
    adult: "Soy mayor de 18 años.",
    data: (law: string) =>
      `Autorizo el tratamiento de mis datos personales según la ${law} y la política de datos de Libertario.`,
    terms: "Acepto los términos del programa de puntos de la casa.",
    marketing: "Quiero recibir novedades de la casa por correo. Opcional.",
    policy: "Leer la política de datos",
    required: "Hace falta aceptar esto para entrar.",
    fromGoogle: "Nombre y correo vienen de Google. Puedes corregirlos.",
    picture: "Foto de Google",
    idFor: (country: string) => `Documento de identidad en ${country}`,
    rut: "RUT",
    rutError: "RUT con dígito verificador, por ejemplo 12345678-9.",
    phoneFor: (prefix: string) => `Celular (${prefix})`,
  },

  order: {
    kicker: "El pedido",
    title: "Tu pedido",
    empty: "Todavía no has sumado nada. La carta está a un toque.",
    goToMenu: "Abrir la carta",
    how: "Cómo lo quieres",
    pickup: "Recoger en caja",
    pickupHint: "Lo preparamos y te llamamos por tu nombre.",
    table: "En la mesa",
    tableHint: (table: string) => `Lo llevamos a la mesa ${table}.`,
    tableMissing: "Escribe el número de la mesa.",
    tableNumber: "Número de mesa",
    send: "Enviar el pedido",
    sending: "Enviando a la casa…",
    sentTitle: "Pedido recibido",
    sentPickup: (name: string) => `Cuando esté, te llamamos: ${name}.`,
    sentTable: (table: string) => `Va a la mesa ${table}.`,
    code: "Código",
    payAtCounter: "Se paga en caja. La app no cobra.",
    subtotal: "Subtotal",
    earns: (points: number) => `Suma ${formatPoints(points)} puntos al cobrar`,
    add: "Sumar",
    added: (name: string) => `${name} está en tu pedido.`,
    remove: "Quitar",
    units: (n: number) => (n === 1 ? "1 unidad" : `${n} unidades`),
    needAccount: "Para pedir hace falta la cuenta. Es un minuto y trae 1.000 puntos.",
    createAccount: "Crear cuenta",
    again: "Pedir otra cosa",
    done: "Listo",
    callFloor: "Avisar en sala",
    floorCalled: (table: string) => `Quedó el aviso de la mesa ${table}. Ya van.`,
    timeline: ["Recibido", "En barra", "Listo"],
    preparing: "La barra ya lo tiene.",
  },

  market: {
    colombia: "Libertario Colombia",
    chile: "Libertario Chile",
    country: "País",
    language: "Idioma",
    spanish: "Español",
    english: "English",
    soon: "Chile está en camino. Por ahora la carta y las casas son las de Bogotá.",
    detected: (name: string) => `Estás en ${name}.`,
  },

  settings: {
    title: "Ajustes",
    account: "La cuenta",
    forget: "Olvidar este teléfono",
    forgetHint: "Borra la cuenta de este teléfono. Los puntos quedan en la casa.",
    version: "Demo web. No cobra, no habla con producción.",
  },

  greeting: {
    morning: "Buenos días",
    afternoon: "Buenas tardes",
    evening: "Buenas noches",
  },

  casa: {
    expiring: "vencen este mes",
    available: "puntos disponibles",
    ratio: "$100 = 1 punto",
    level: "Casa",
    levelNote: "Tu nivel. Suma visitas y sube.",
    startOrder: "Inicia tu pedido",
    pickup: "Recoger en caja",
    pickupNote: "Pides desde aquí y lo recoges sin fila.",
    counterTab: "Caja",
    scanTitle: "Escanea para sumar puntos",
    scanLead: "Muéstralo antes de pagar. Cada $100 suman un punto.",
    bright: "Brillo para el lector",
    settings: "Ajustes",
    promos: "Promos de la casa",
    seeAll: "Ver todo",
    today: "Para hoy",
    todayMorning: "Para empezar el día",
    todayAfternoon: "Para la tarde",
    todayEvening: "Para la noche",
    roasting: "Lo que se tuesta",
    roastingNote: "Las bolsas de la casa. Toca una para verla.",
    tapToShow: "Toca para mostrar en caja",
    memberCard: "Tarjeta de la casa",
    openMenu: "Toda la carta",
    add: "Sumar",
    inOrder: (n: number) => `${n} en tu pedido`,
  },

  wallet: {
    kicker: "El saldo",
    title: "Saldo",
    available: "Saldo disponible",
    empty: "Sin saldo todavía. Se recarga con PSE y se paga desde el teléfono.",
    homeNote: "Saldo de la casa",
    homeEmpty: "Recarga con PSE",
    topUp: "Recargar",
    topUpTitle: "Recargar saldo",
    pickAmount: "Cuánto",
    custom: "Otro valor",
    customPlaceholder: "0",
    minimum: (amount: string) => `Desde ${amount}.`,
    bank: "Banco",
    chooseBank: "Elige tu banco",
    bankTitle: "Tu banco",
    bankNote:
      "PSE te lleva al banco para aprobar la transferencia. Esta lista es de muestra.",
    viaPse: "Transferencia por PSE",
    selected: "Este",
    banks: ["Bancolombia", "Davivienda", "Nequi", "Banco de Bogotá", "BBVA"],
    pay: "Pagar con PSE",
    flowKicker: "PSE",
    steps: ["Redirigiendo", "Banco aprueba", "Aprobado"],
    stepTitles: ["Redirigiendo a PSE", "Tu banco está aprobando", "Aprobado en la simulación"],
    receiptKicker: "Comprobante de prueba",
    receiptTitle: "Recarga simulada",
    reference: "Referencia",
    amount: "Valor",
    date: "Fecha",
    done: "Listo",
    movementsTitle: "Movimientos",
    noMovements: "Todavía no hay movimientos.",
    ledger: {
      topUp: (bank: string) => `Recarga PSE · ${bank}`,
    },
    notes: {
      toppedUp: (amount: number) =>
        `Se sumaron $${formatPoints(amount)} al saldo. Es una simulación: no se cobró nada.`,
      insufficient: (missing: number) => `Faltan $${formatPoints(missing)} de saldo.`,
      paid: (label: string, amount: number) => `${label} · $${formatPoints(amount)} del saldo.`,
    },
    demoNote:
      "Demo: no se cobra ni se llama a ningún banco. El flujo real va por un proveedor PSE (Wompi o PayU) desde el backend.",
  },

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

export function formatMeters(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toLocaleString("es-CO", { maximumFractionDigits: 1 })} km`;
}
