import { addDays, dateFromKey, dateKey, formatDateKey } from "@/lib/date";
import type { FinanceCategoryRule, FinanceCurrency, FinancePaymentMethod, FinanceRangeMode, FinanceSettings, FinanceTransaction, FinanceTransactionType } from "@/types/apex";

export const financeCurrencies: FinanceCurrency[] = ["ARS", "USD", "EUR", "BRL", "CLP", "UYU", "MXN", "COP", "PEN", "GBP"];

export const financeCategories = [
  "Delivery",
  "Alimentos",
  "Combustible",
  "Transporte",
  "Entretenimiento",
  "Suscripciones",
  "Servicios",
  "Hogar",
  "Higiene",
  "Salud",
  "Mascotas",
  "Ropa",
  "Educacion",
  "Trabajo",
  "Tecnologia",
  "Regalos",
  "Viajes",
  "Ingresos",
  "Otros"
];

export const financeCategoryColors: Record<string, string> = {
  Delivery: "#fb7185",
  Alimentos: "#84cc16",
  Combustible: "#f97316",
  Transporte: "#38bdf8",
  Entretenimiento: "#a78bfa",
  Suscripciones: "#f472b6",
  Servicios: "#facc15",
  Hogar: "#2dd4bf",
  Higiene: "#60a5fa",
  Salud: "#34d399",
  Mascotas: "#c084fc",
  Ropa: "#fb923c",
  Educacion: "#818cf8",
  Trabajo: "#94a3b8",
  Tecnologia: "#22d3ee",
  Regalos: "#fda4af",
  Viajes: "#4ade80",
  Ingresos: "#bef264",
  Otros: "#9ca3af"
};

const categoryKeywords: Record<string, string[]> = {
  Delivery: [
    "pedidos ya", "pedidosya", "rappi", "uber eats", "ubereats", "mcdonald", "mc donald", "burger king", "mostaza", "subway", "kfc", "sushiclub",
    "sushi club", "sushi", "pizza", "pizzeria", "empanadas", "helado", "heladeria", "take away", "delivery", "comida rapida", "hamburguesa",
    "hamburguesas", "lomito", "milanesa", "panchos", "kebab", "shawarma", "taco", "burrito", "comida china", "wok", "rotiseria", "sandwich",
    "sandwicheria", "pollo frito", "papas fritas", "donas", "donuts", "brunch", "merienda", "cafeteria", "starbucks", "havanna", "bonafide",
    "tienda de cafe", "cafe martinez", "barista", "panera", "grido", "freddo", "rapanui", "lucciano", "guapaletas", "burger", "fast food",
    "parrilla delivery", "napolitana", "fugazzeta", "calzone", "tarta", "ensalada delivery", "poke", "poke bowl", "arepas", "tequeños"
  ],
  Alimentos: [
    "carrefour", "disco", "jumbo", "vea", "coto", "dia", "changomas", "chango mas", "supermercado", "mercado", "almacen", "verduleria",
    "carniceria", "fiambreria", "panaderia", "dietetic", "dietetrica", "pan", "leche", "huevos", "frutas", "verduras", "yogur", "yogurt",
    "queso", "avena", "proteina", "creatina", "galletitas", "alfajor", "chocolate", "snacks", "cereal", "agua", "gaseosa", "harina",
    "aceite", "arroz", "fideos", "atun", "pollo", "carne", "pescado", "salmon", "merluza", "cerdo", "lentejas", "garbanzos", "porotos",
    "manteca", "mermelada", "cafe", "te", "yerba", "mate", "azucar", "edulcorante", "sal", "condimentos", "salsa", "tomate", "banana",
    "manzana", "naranja", "palta", "lechuga", "papa", "batata", "cebolla", "morron", "zanahoria", "brocoli", "espinaca", "hummus",
    "granola", "frutos secos", "nueces", "almendras", "mani", "pasas", "barrita", "whey", "caseina", "pre entreno", "suplemento",
    "minimercado", "kiosco", "maxikiosco", "open 25", "farmacity alimento", "super", "super chino", "mila", "milanesa", "milanesas",
    "matambre", "asado", "vacio", "entraña", "choripan", "chori", "morcilla", "provoleta", "humita", "locro", "tamal", "pastelitos",
    "facturas", "medialunas", "bizcochitos", "tortitas negras"
  ],
  Combustible: [
    "ypf", "shell", "axion", "puma", "nafta", "gasoil", "diesel", "gnc", "lubricante", "lubricantes", "estacion de servicio", "serviclub",
    "combustible", "infinia", "v power", "quantium", "aceite motor", "lavadero auto", "car wash"
  ],
  Transporte: [
    "uber", "cabify", "taxi", "didi", "subte", "colectivo", "bondi", "tren", "peaje", "estacionamiento", "parking", "garage", "sube",
    "recarga sube", "metrobus", "remis", "beat", "ecobici", "bicicleta", "monopatin", "aerobus", "bus", "micro", "terminal", "boleto",
    "pasaje", "grua", "telepase", "ausol", "autopista", "acarreo", "parquimetro"
  ],
  Entretenimiento: [
    "cine", "cinemark", "hoyts", "village", "teatro", "recital", "concierto", "netflix party", "escape room", "bowling", "arcade",
    "streaming", "eventos", "bar", "boliche", "club", "pub", "show", "festival", "entrada", "ticketek", "tu entrada", "livepass",
    "allaccess", "museo", "exposicion", "stand up", "comedia", "juego", "playstation", "xbox", "steam", "nintendo", "game pass",
    "casino", "pool", "billar", "karting", "paintball", "fernet", "fernet cola", "gancia", "campari", "aperol", "cinzano", "vermut",
    "vermouth", "cynar", "birra", "cerveza", "quilmes", "stella", "andes", "patagonia", "imperial", "vino", "malbec", "tinto",
    "blanco", "champagne", "sidra", "gin tonic", "gin", "vodka", "whisky", "ron", "mojito", "caipirinha", "daikiri", "daiquiri",
    "destornillador", "cuba libre", "negroni", "old fashioned", "americano", "chopp", "tragos", "bar de tragos"
  ],
  Suscripciones: [
    "netflix", "spotify", "youtube premium", "disney", "prime video", "amazon prime", "hbo", "max", "apple music", "icloud", "openai",
    "chatgpt", "claude", "perplexity", "notion", "github", "canva", "figma", "adobe", "cursor", "codex", "copilot", "midjourney",
    "dropbox", "google one", "google drive", "microsoft 365", "office 365", "x premium", "twitter blue", "twitch", "patreon", "duolingo",
    "kindle", "audible", "paramount", "crunchyroll", "deezer", "tidal", "strava", "myfitnesspal", "headspace", "calm", "evernote",
    "todoist", "ticktick", "1password", "lastpass", "nordvpn", "expressvpn", "surfshark"
  ],
  Servicios: [
    "luz", "edenor", "edesur", "agua", "aysa", "gas", "metrogas", "naturgy", "internet", "fibra", "personal", "claro", "movistar",
    "telecom", "flow", "abl", "expensas", "impuestos", "monotributo", "afip", "arca", "rentas", "municipal", "patente", "seguro",
    "seguro auto", "seguro hogar", "obra social", "prepaga", "osde", "swiss medical", "galeno", "medicus", "sancor salud", "telefono",
    "celular", "electricidad", "servicio", "mantenimiento", "plomero", "electricista", "gasista", "cerrajero"
  ],
  Hogar: [
    "mesa", "silla", "sillon", "sofa", "heladera", "microondas", "televisor", "funda", "almohada", "colchon", "cortinas", "decoracion",
    "utensilios", "electrodomesticos", "vajilla", "vaso", "plato", "cubiertos", "olla", "sarten", "cuchillo", "tupper", "organizador",
    "mueble", "biblioteca", "escritorio", "lampara", "foco", "bombilla", "sabana", "acolchado", "toalla", "percha", "limpieza hogar",
    "detergente", "lavandina", "desinfectante", "trapo", "escoba", "secador", "balde", "aromatizante", "easy", "sodimac", "ikea",
    "falabella hogar", "fravega", "garbarino", "cetrogar", "musimundo"
  ],
  Higiene: [
    "papel higienico", "dentifrico", "pasta dental", "cepillo de dientes", "shampoo", "acondicionador", "jabon", "desodorante",
    "maquina de afeitar", "toallas", "perfume", "cremas", "protector solar", "skincare", "limpiador facial", "serum", "retinol",
    "minoxidil", "bloqueador", "gel", "cera pelo", "hisopos", "algodon", "enjuague bucal", "hilo dental", "afeitadora", "prestobarba",
    "crema dental", "crema corporal", "body splash", "farmacity higiene", "jabon liquido", "talco", "pañuelos", "pañales"
  ],
  Salud: [
    "farmacia", "medicamentos", "ibuprofeno", "paracetamol", "vitaminas", "medico", "dentista", "psicologo", "nutricionista",
    "kinesiologo", "analisis clinicos", "laboratorio", "guardia", "hospital", "clinica", "oftalmologo", "dermatologo", "cardiologo",
    "traumatologo", "psiquiatra", "terapia", "consulta", "receta", "antibiotico", "vacuna", "suero", "curitas", "alcohol en gel",
    "barbijo", "lentes", "optica", "radiografia", "ecografia", "resonancia", "tomografia"
  ],
  Mascotas: [
    "veterinaria", "alimento perro", "alimento gato", "arena", "juguetes mascota", "correa", "vacunas mascota", "peluqueria canina",
    "perro", "gato", "mascota", "balanceado", "royal canin", "excellent", "pro plan", "old prince", "cucha", "rascador", "antipulgas",
    "pipeta", "collar mascota", "transportadora", "piedras sanitarias"
  ],
  Ropa: [
    "zapatillas", "remera", "pantalon", "campera", "buzo", "medias", "ropa interior", "nike", "adidas", "puma", "levis", "levi",
    "zara", "h&m", "ropa", "short", "jean", "camisa", "chomba", "sweater", "abrigo", "bufanda", "gorra", "gorro", "traje", "vestido",
    "pollera", "calzado", "zapatos", "botas", "ojotas", "crocs", "under armour", "topper", "fila", "reebok", "lacoste", "kevingston",
    "equus", "moov", "dexter", "grid", "stock center"
  ],
  Educacion: [
    "curso", "udemy", "platzi", "libros", "universidad", "facultad", "capacitacion", "workshop", "clase", "colegio", "instituto",
    "coderhouse", "coursera", "edx", "domestika", "skillshare", "libro", "ebook", "manual", "certificacion", "examen", "matricula",
    "cuota colegio", "apunte", "fotocopia", "notebook educacion"
  ],
  Trabajo: [
    "cowork", "coworking", "oficina", "papeleria", "libreria", "impresion", "resma", "birome", "cuaderno", "agenda", "software trabajo",
    "hosting", "dominio", "server", "aws", "vercel", "railway", "supabase", "digital ocean", "zoom", "slack", "linear", "jira",
    "linkedin", "meet", "workana", "fiverr"
  ],
  Tecnologia: [
    "apple", "iphone", "ipad", "macbook", "samsung", "xiaomi", "motorola", "auriculares", "cargador", "cable", "teclado", "mouse",
    "monitor", "ssd", "ram", "placa", "notebook", "pc", "tablet", "smartwatch", "garmin", "fitbit", "airpods", "mercado libre",
    "mercadolibre", "tienda mia", "amazon", "aliexpress", "electronica", "gadget", "router", "adaptador"
  ],
  Regalos: [
    "regalo", "cumpleaños", "cumple", "aniversario", "flores", "floreria", "juguete", "perfumeria regalo", "gift", "presente",
    "tarjeta regalo", "gift card", "chocolates regalo"
  ],
  Viajes: [
    "hotel", "hostel", "airbnb", "booking", "despegar", "almundo", "vuelo", "aerolineas", "latam", "jetsmart", "flybondi", "equipaje",
    "valija", "pasaporte", "visa", "excursion", "tour", "traslado", "rental car", "alquiler auto", "cabana", "reserva viaje"
  ],
  Ingresos: [
    "sueldo", "salario", "honorarios", "factura", "cobro", "venta", "transferencia recibida", "ingreso", "aguinaldo", "bonus",
    "bono", "comision", "devolucion", "reintegro", "cashback", "intereses", "rendimiento", "dividendo"
  ]
};

export type FinanceDraft = {
  type: FinanceTransactionType;
  description: string;
  amount: number | "";
  currency: FinanceCurrency;
  category: string;
  dateKey: string;
  confidence: "learned" | "keyword" | "fallback";
};

export function parseFinanceText(text: string, rules: FinanceCategoryRule[], fallbackDateKey: string): FinanceDraft {
  const trimmed = text.trim();
  const amount = extractAmount(trimmed);
  const description = amount ? trimmed.replace(amount.raw, "").replace(/\s+/g, " ").trim() : trimmed;
  const inferredType = looksLikeIncome(trimmed) ? "income" : "expense";
  const categoryResult = classifyFinanceText(description || trimmed, rules, inferredType);

  return {
    type: inferredType,
    description: description || trimmed,
    amount: amount?.value ?? "",
    currency: extractCurrency(trimmed) ?? "ARS",
    category: categoryResult.category,
    dateKey: fallbackDateKey,
    confidence: categoryResult.confidence
  };
}

export function classifyFinanceText(text: string, rules: FinanceCategoryRule[], type: FinanceTransactionType = "expense") {
  if (type === "income") return { category: "Ingresos", confidence: "keyword" as const };
  const normalized = normalizeFinanceKey(text);
  const learned = rules
    .filter((rule) => normalized.includes(rule.key) || rule.key.includes(normalized))
    .sort((a, b) => b.key.length - a.key.length)[0];
  if (learned) return { category: learned.category, confidence: "learned" as const };

  for (const category of financeCategories) {
    const keywords = categoryKeywords[category] ?? [];
    if (keywords.some((keyword) => normalized.includes(normalizeFinanceKey(keyword)))) {
      return { category, confidence: "keyword" as const };
    }
  }

  return { category: "Otros", confidence: "fallback" as const };
}

export function buildFinanceRuleKey(description: string) {
  return normalizeFinanceKey(description)
    .split(" ")
    .filter((part) => part.length > 2 && !/^\d+$/.test(part))
    .slice(0, 4)
    .join(" ");
}

export function financeSummary(transactions: FinanceTransaction[]) {
  const income = transactions.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amount, 0);
  const expenses = transactions.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0);
  const byCategory = financeCategories
    .map((category) => ({
      category,
      total: transactions.filter((item) => item.type === "expense" && item.category === category).reduce((sum, item) => sum + item.amount, 0)
    }))
    .filter((item) => item.total > 0)
    .sort((a, b) => b.total - a.total);

  return { income, expenses, balance: income - expenses, byCategory };
}

export function formatMoney(value: number, currency: FinanceCurrency = "ARS") {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "ARS" ? 0 : 2
  }).format(value);
}

export function buildFinanceRange(mode: FinanceRangeMode, anchorDateKey: string, settings: FinanceSettings, custom?: { from: string; to: string }) {
  if (mode === "custom" && custom) return { from: custom.from, to: custom.to, label: "Personalizado" };
  if (mode === "day") return { from: anchorDateKey, to: anchorDateKey, label: formatDateKey(anchorDateKey) };

  const anchor = dateFromKey(anchorDateKey);
  if (mode === "week") {
    const day = anchor.getUTCDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const fromDate = addDays(anchor, mondayOffset);
    const toDate = addDays(fromDate, 6);
    const from = dateKey(fromDate);
    const to = dateKey(toDate);
    return { from, to, label: `${formatDateKey(from)} - ${formatDateKey(to)}` };
  }

  const year = anchor.getUTCFullYear();
  const month = anchor.getUTCMonth();
  const monthEnd = new Date(Date.UTC(year, month + 1, 0, 12)).getUTCDate();
  const startDay = clamp(settings.monthRangeStartDay || 1, 1, monthEnd);
  const endSetting = settings.monthRangeEndDay || 0;
  const endDay = endSetting <= 0 ? monthEnd : clamp(endSetting, 1, monthEnd);
  const crossesMonth = startDay > endDay;
  const from = dateKey(new Date(Date.UTC(year, month, startDay, 12)));
  const to = dateKey(new Date(Date.UTC(year, month + (crossesMonth ? 1 : 0), endDay, 12)));
  return { from, to, label: `${formatDateKey(from)} - ${formatDateKey(to)}` };
}

export function shiftFinanceRangeAnchor(mode: FinanceRangeMode, anchorDateKey: string, direction: -1 | 1) {
  const anchor = dateFromKey(anchorDateKey);
  if (mode === "day") return dateKey(addDays(anchor, direction));
  if (mode === "week") return dateKey(addDays(anchor, direction * 7));
  return dateKey(new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() + direction, anchor.getUTCDate(), 12)));
}

export function estimateCardDates(dateKeyValue: string, method?: FinancePaymentMethod) {
  if (!method || method.kind !== "credit") return null;
  const date = dateFromKey(dateKeyValue);
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const closing = cardClosingDate(year, month, method);
  const nextClosing = cardClosingDate(year, month + 1, method);
  const statementMonth = date > closing ? month + 1 : month;
  const statementDate = date > closing ? nextClosing : closing;
  const paymentDate = cardPaymentDate(year, statementMonth, method);
  return { statementDateKey: dateKey(statementDate), paymentDateKey: dateKey(paymentDate) };
}

export function buildInstallmentPreview(input: {
  amount: number | "";
  count: number;
  dateKey: string;
  paymentMethod?: FinancePaymentMethod;
  firstDueDateKey?: string;
}) {
  if (!input.amount || input.count <= 1) return null;
  const cardDates = estimateCardDates(input.dateKey, input.paymentMethod);
  const firstDueDateKey = cardDates?.paymentDateKey ?? input.firstDueDateKey ?? input.dateKey;
  const amountPerInstallment = roundMoney(input.amount / input.count);
  return {
    count: input.count,
    firstDueDateKey,
    amountPerInstallment,
    label: `Primera cuota: ${formatDateKey(firstDueDateKey)} - ${formatMoney(amountPerInstallment)} x ${input.count}`
  };
}

export function calculateReimbursement(amount: number | "", mode: "amount" | "percent", value: number) {
  const base = amount || 0;
  const discountAmount = mode === "percent" ? roundMoney((base * value) / 100) : roundMoney(value);
  return {
    discountAmount,
    netAmount: roundMoney(Math.max(0, base - discountAmount))
  };
}

function extractAmount(text: string) {
  const match = text.match(/(?:\$|ars|usd|eur|brl|clp|uyu|mxn|cop|pen|gbp)?\s*(\d[\d.,\s]*\d|\d)/i);
  if (!match) return null;
  const raw = match[0];
  const numeric = normalizeAmount(match[1]);
  const value = Number(numeric);
  return Number.isFinite(value) ? { raw, value } : null;
}

function normalizeAmount(value: string) {
  const compact = value.replace(/\s/g, "");
  const lastComma = compact.lastIndexOf(",");
  const lastDot = compact.lastIndexOf(".");
  const decimalSeparator = lastComma > lastDot ? "," : lastDot > lastComma ? "." : "";
  if (!decimalSeparator) return compact.replace(/[.,]/g, "");
  const separatorIndex = decimalSeparator === "," ? lastComma : lastDot;
  const decimals = compact.slice(separatorIndex + 1);
  const integer = compact.slice(0, separatorIndex);
  if (decimals.length === 3 && /^[.,\d]+$/.test(integer)) return compact.replace(/[.,]/g, "");
  return `${integer.replace(/[.,]/g, "")}.${decimals.replace(/[.,]/g, "")}`;
}

function extractCurrency(text: string): FinanceCurrency | null {
  const upper = text.toUpperCase();
  return financeCurrencies.find((currency) => upper.includes(currency)) ?? null;
}

function looksLikeIncome(text: string) {
  return /\b(sueldo|salario|cobro|honorarios|ingreso|venta|reintegro|devolucion|cashback|bonus|bono|comision)\b/i.test(normalizeFinanceKey(text));
}

function normalizeFinanceKey(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cardClosingDate(year: number, month: number, method: FinancePaymentMethod) {
  const last = new Date(Date.UTC(year, month + 1, 0, 12));
  if (method.closingBusinessDaysBeforeMonthEnd) return subtractBusinessDays(last, method.closingBusinessDaysBeforeMonthEnd);
  const day = clamp(method.closingDay ?? 25, 1, last.getUTCDate());
  return new Date(Date.UTC(year, month, day, 12));
}

function cardPaymentDate(year: number, month: number, method: FinancePaymentMethod) {
  if (method.paymentBusinessDayFromMonthStart) return addBusinessDays(new Date(Date.UTC(year, month + 1, 1, 12)), method.paymentBusinessDayFromMonthStart - 1);
  const last = new Date(Date.UTC(year, month + 2, 0, 12));
  const day = clamp(method.paymentDay ?? 10, 1, last.getUTCDate());
  return nextBusinessDay(new Date(Date.UTC(year, month + 1, day, 12)));
}

function addBusinessDays(date: Date, days: number) {
  let cursor = date;
  let remaining = days;
  while (remaining > 0) {
    cursor = addDays(cursor, 1);
    if (isBusinessDay(cursor)) remaining--;
  }
  return cursor;
}

function subtractBusinessDays(date: Date, days: number) {
  let cursor = date;
  let remaining = days;
  while (remaining > 0) {
    cursor = addDays(cursor, -1);
    if (isBusinessDay(cursor)) remaining--;
  }
  return cursor;
}

function nextBusinessDay(date: Date) {
  let cursor = date;
  while (!isBusinessDay(cursor)) cursor = addDays(cursor, 1);
  return cursor;
}

function isBusinessDay(date: Date) {
  const day = date.getUTCDay();
  return day !== 0 && day !== 6;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}
