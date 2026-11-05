/**
 * Customer-facing copy for Colombian guests. Keys are English.
 * Every Spanish sentence in the interface comes from this file.
 * Brújula never says "aprovecha", never counts down, never offers a percentage.
 */
export const copy = {
  brand: "Libertario",
  program: "Brújula",
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
    kicker: "Brújula",
    title: "Un momento",
    lead: "Nombre y correo. Con eso entra la bienvenida: 100 cerezas y dos sellos en tu Bitácora.",
    phone: "Celular",
    email: "Correo",
    name: "Nombre",
    idNumber: "Cédula",
    idHint: "Opcional. Solo si quieres la factura a tu nombre.",
    phoneError: "Diez dígitos, empieza por 3.",
    emailError: "Hace falta un correo.",
    nameError: "El nombre queda corto.",
    idError: "Entre 6 y 10 dígitos, o déjala vacía.",
    submit: "Entrar a la casa",
    footnote:
      "Te identificas con el celular, el QR de la mesa o tu pase. Nadie te pide la cédula en la barra. Todo queda en este teléfono.",
    welcomeNote: "Bienvenido a Brújula. Tienes 100 cerezas y dos sellos.",
  },

  home: {
    kicker: "La casa",
    pointsLabel: "cerezas",
    earnRule: "Cada COP 1.000 es una cereza. El grano suma el doble.",
    awayFromStore: (storeName: string) =>
      `Estás en ${storeName}. En este demo, la casa más cerca es Zona G. `,
    openNearest: "Ver Zona G",
    nearestStore: "Zona G es la casa más cerca en este demo.",
    nextReward: (rewardName: string, missing: number) =>
      `Para ${rewardName} faltan ${formatPoints(missing)}.`,
    allRewardsInReach: "Los tres están al alcance.",
    thisMonth: "Este mes",
    nothingExpires: "Las cerezas no vencen mientras vengas.",
    noExpiry:
      "Las cerezas no vencen mientras vengas. Solo tras 12 meses sin comprar, y te avisamos 30 días antes.",
    cupsTitle: "Las tazas",
    cupsNote:
      "Ocho tazas. La octava es un filtrado Paz. No es un premio de cerezas.",
    logbookTitle: "La Bitácora",
    logbookNote:
      "Cada primera vez deja un sello: un perfil, un método, una sede, una bolsa, una cata. Los sellos suben de nivel y nunca se borran.",
    counterTitle: "Para la caja",
    counterNote:
      "Se muestra en el mostrador. No paga. Queda guardado en este teléfono, también sin red.",
    counterCodeLabel: "Código del mostrador",
    redeemTitle: "Lo que se cambia por cerezas",
    redeemNote:
      "Se cambia entero. No se completa con plata. El canje no suma cerezas.",
    canRedeemNow: "Con lo que tienes",
    later: "Más adelante",
    rewardMeta: (points: number, note: string) =>
      `${formatPoints(points)} cerezas · ${note}`,
    missingPoints: (missing: number) => `Faltan ${formatPoints(missing)}`,
    redeem: "Canjear",
    historyTitle: "En las sedes",
    forgetPhone: "Olvidar este teléfono",
  },

  rewards: {
    cappuccino: {
      name: "Cappuccino",
      note: "Blend o single origin, en la barra.",
    },
    invite: {
      name: "Invitar un café",
      note: "Un cappuccino para quien quieras. Rinde el doble.",
    },
    bagPaz: {
      name: "Bolsa PAZ 340 g",
      note: "El grano de la casa, para tu cocina.",
    },
  },

  levels: {
    rumbo: { name: "Rumbo", line: "Elegiste una dirección." },
    travesia: { name: "Travesía", line: "Recorres el café con intención." },
    origen: { name: "Origen", line: "Conoces el café desde donde nace." },
  },

  logbook: {
    toNext: (count: number, level: string) =>
      count === 1 ? `Un sello para ${level}` : `${count} sellos para ${level}`,
    atTop: "Origen. Lo más alto.",
    keep: "El nivel se mantiene con una visita cada 90 días. Los sellos nunca se borran.",
    recent: (labels: string) => `Sellos: ${labels}`,
    empty: "Tu primera compra deja los primeros sellos.",
    families: {
      profile: "Perfil",
      method: "Método",
      place: "Lugar",
      home: "Casa",
      learn: "Aprender",
      welcome: "Bienvenida",
    },
    methods: {
      filter: "Filtrado",
      espresso: "Espresso",
      "cold-brew": "Cold brew",
    },
    bag: (profile: string) => `Bolsa ${profile}`,
    welcomeStamp: (n: number) => `Bienvenida ${n}`,
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
      `En el mostrador esta pieza suma ${formatPoints(points)} cerezas. Cada COP 1.000 es una cereza; el grano, el doble.`,
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
      "En la tienda, la caja cobra. Aquí solo se anotan las cerezas y los sellos.",
  },

  ledger: {
    welcome: "Bienvenida a Brújula",
    eighthCup: "Octava taza · Filtrado Paz",
    redemption: (name: string) => `Canje · ${name}`,
    stamp: (label: string) => `Sello · ${label}`,
    invitation: (code: string) => `Invitación · Cappuccino para otra persona · ${code}`,
    migrated: (lealPoints: number, points: number) =>
      `De Leal · ${formatPoints(lealPoints)} puntos = ${formatPoints(points)} cerezas`,
    courtesy: (title: string) => `Cortesía · ${title}`,
  },

  notes: {
    postedItem: (name: string) =>
      `${name} quedó anotada en la caja. No se cobró: este demo no cobra.`,
    emptyTable: "La mesa está vacía.",
    orderPosted:
      "La comanda pasó al mostrador. El cobro, en la caja. Aquí solo se anotaron las cerezas.",
    floorCall: (table: string, storeName: string) =>
      `Quedó el aviso de la mesa ${table} en ${storeName}. No sale de este teléfono.`,
    cannotRedeem: (missing: number, rewardName: string) =>
      `Faltan ${formatPoints(missing)} cerezas para ${rewardName}. Se cambia entero.`,
    redeemed: (rewardName: string, points: number) =>
      `${rewardName} quedó pedido. Se descontaron ${formatPoints(points)} cerezas. Se recoge en caja.`,
    invited: (code: string) =>
      `Va por ti: un cappuccino para quien quieras. Código ${code}. Se muestra en caja.`,
    eighthCupToast: "La octava taza. Un filtrado Paz.",
    levelUp: (level: string) => `Llegaste a ${level}.`,
    migrated: (lealPoints: number, points: number) =>
      `Tus ${formatPoints(lealPoints)} puntos de Leal son ${formatPoints(points)} cerezas. No vencen en un año.`,
    alreadyMigrated: "Tu saldo de Leal ya pasó a cerezas.",
    permissionSaved: "Guardamos tu cambio.",
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
    ask: "Activa la ubicación. Cuando entres a una casa Libertario te avisamos si hay algo para ti. La ubicación no sale del teléfono.",
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
    demoNote: "Para ver la cortesía sin salir: simula la llegada desde la lista de casas.",
  },

  courtesy: {
    kicker: "Para ti",
    activate: "Activar en caja",
    activated: (title: string) => `${title} quedó en tu Brújula. Muéstralo en caja cuando quieras.`,
    catalog: {
      firstVisit: {
        title: (store: string) => `Primera vez en ${store}`,
        detail: "Este espresso va por nosotros.",
      },
      secondVisit: {
        title: () => "Tu segunda visita",
        detail: "Hoy tu BariRockStar elige tu café. Va por nosotros.",
      },
      birthday: {
        title: () => "Feliz cumpleaños",
        detail: "Una bebida de la carta va por nosotros. Tienes quince días.",
      },
    },
  },

  book: {
    cover: "La carta",
    open: "Abrir la carta",
    start: "Iniciar",
    index: "Índice",
    options: (n: number) => (n === 1 ? "1 opción" : `${n} opciones`),
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
    lead: "Cerezas por cada café, un sello por cada primera vez, y el pedido desde el teléfono.",
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
    terms: "Acepto los términos de Brújula, el programa de la casa.",
    marketing: "Novedades de la casa por correo. Opcional.",
    whatsapp: "Invitaciones por WhatsApp. Máximo dos al mes, nunca de noche ni en domingo. Opcional.",
    sms: "Avisos por SMS. Opcional.",
    permissionsNote: "Cada permiso es aparte y se cambia cuando quieras. Guardamos la fecha de cada cambio.",
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
    payHow: "Cómo pagas",
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
    earns: (points: number) => `Suma ${formatPoints(points)} cerezas al cobrar`,
    add: "Sumar",
    added: (name: string) => `${name} está en tu pedido.`,
    remove: "Quitar",
    units: (n: number) => (n === 1 ? "1 unidad" : `${n} unidades`),
    needAccount: "Para pedir hace falta la cuenta. Es un minuto y trae 100 cerezas y dos sellos.",
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
    forgetHint: "Borra la cuenta de este teléfono. Las cerezas quedan en la casa.",
    download: "Descargar mis datos",
    downloadHint: "Un archivo con tu cuenta, tus cerezas y tus sellos.",
    permissions: "Tus permisos",
    savedAt: (date: string) => `Guardado el ${date}`,
    off: "Sin activar",
    fromLeal: "¿Vienes de Leal?",
    lealLead: "Nadie pierde lo que tiene. 910 puntos de Leal son 300 cerezas: el mismo cappuccino, desde el día uno.",
    lealPoints: "Tus puntos de Leal",
    migrate: "Pasar a cerezas",
    version: "Demo web. No cobra, no habla con producción.",
  },

  greeting: {
    morning: "Buenos días",
    afternoon: "Buenas tardes",
    evening: "Buenas noches",
  },

  casa: {
    expiring: "vencen este mes",
    available: "cerezas disponibles",
    ratio: "COP 1.000 = 1 cereza",
    level: "Rumbo",
    levelNote: "Tu nivel. Sube explorando, no gastando.",
    startOrder: "Inicia tu pedido",
    pickup: "Recoger en caja",
    pickupNote: "Pides desde aquí y lo recoges sin fila.",
    counterTab: "Caja",
    scanTitle: "Escanea para sumar cerezas",
    scanLead: "Muéstralo antes de pagar. Cada COP 1.000 es una cereza.",
    bright: "Brillo para el lector",
    settings: "Ajustes",
    promos: "Para ti",
    seeAll: "Ver todo",
    today: "Para hoy",
    todayMorning: "Para empezar el día",
    todayAfternoon: "Para la tarde",
    todayEvening: "Para la noche",
    roasting: "Lo que se tuesta",
    roastingNote: "Las bolsas de la casa suman el doble. Toca una para verla.",
    tapToShow: "Toca para mostrar en caja",
    memberCard: "Tu Brújula",
    openMenu: "Toda la carta",
    add: "Sumar",
    inOrder: (n: number) => `${n} en tu pedido`,
  },

  wallet: {
    kicker: "El saldo",
    title: "Saldo",
    available: "Saldo disponible",
    empty: "Sin saldo todavía. Se recarga en caja o desde el teléfono, y pagar con él suma el doble de cerezas.",
    homeNote: "Pagar con él suma el doble",
    homeEmpty: "Recarga en caja o aquí",
    earnsDouble: "Pagar con el saldo suma el doble de cerezas. Recargar no suma: suma cuando lo gastas.",
    method: "Cómo recargas",
    digital: "Desde el teléfono",
    digitalHint: "PSE, con tu banco.",
    atRegister: "En caja",
    atRegisterHint: "Pagas en el mostrador y el saldo entra al momento.",
    registerTitle: "Recarga en caja",
    registerLead: (amount: string) =>
      `Muestra este código en caja y paga ${amount}. El saldo entra cuando la caja confirma.`,
    registerConfirm: "La caja confirmó (demo)",
    registerReceipt: "Recarga en caja",
    payWithBalance: "Pagar con mi saldo",
    payWithBalanceHint: (balance: string) => `Tienes ${balance}. Suma el doble.`,
    payAtRegister: "Pagar en caja",
    payAtRegisterHint: "Como siempre. Suma una cereza por cada COP 1.000.",
    paidWithBalance: "Pagado con tu saldo. Sumó el doble.",
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
      topUpAtRegister: (store: string) => `Recarga en caja · ${store}`,
      order: (code: string) => `Pedido ${code}`,
    },
    notes: {
      toppedUp: (amount: number) =>
        `Se sumaron $${formatPoints(amount)} al saldo. Es una simulación: no se cobró nada.`,
      paidOrder: (amount: number) =>
        `Pagado con tu saldo: $${formatPoints(amount)}. Sumó el doble de cerezas.`,
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
