export type RoutineSlot = "morning" | "afternoon" | "night";
export type ProgressPhotoZone = "skin" | "beard" | "hair";
export type ThemeMode = "dark" | "light";
export type AlertStatus = "active" | "buy" | "snoozed" | "ignored";
export type AlertSeverity = "info" | "warning" | "critical";
export type ProductGroup = "nutrition" | "personalCare" | "supplement" | "other";
export type ShoppingStatus = "pending" | "bought" | "ignored";
export type DrinkType = "water" | "soda" | "juice" | "isotonic" | "alcohol" | "other";
export type FinanceTransactionType = "expense" | "income";
export type FinanceCurrency = "ARS" | "USD" | "EUR" | "BRL" | "CLP" | "UYU" | "MXN" | "COP" | "PEN" | "GBP";
export type FinancePaymentKind = "cash" | "transfer" | "debit" | "credit" | "wallet" | "app";
export type FinanceRangeMode = "day" | "week" | "month" | "custom";

export type RoutineTask = {
  id: string;
  label: string;
  slot: RoutineSlot;
  category: "skincare" | "beard" | "hair" | "medication" | "gym" | "habit";
  note?: string;
};

export type RoutineDay = {
  weekday: number;
  label: string;
  tasks: RoutineTask[];
};

export type TaskCompletion = {
  id?: number;
  dateKey: string;
  taskId: string;
  done: boolean;
  updatedAt: string;
};

export type Product = {
  id?: number;
  name: string;
  commercialName?: string;
  brand?: string;
  brandLogo?: string;
  image?: string;
  category: string;
  group?: ProductGroup;
  quantity: number;
  initialStock?: number;
  size?: number;
  unit: string;
  purchaseDate: string;
  cost: number;
  lowAt: number;
  recommendedConsumption?: number;
  dailyConsumptionEstimate?: number;
  createdAt: string;
};

export type ProductConsumption = {
  id?: number;
  productId: number;
  amount: number;
  dateKey: string;
  note?: string;
  createdAt: string;
};

export type ProductStockSummary = {
  product: Product;
  consumed: number;
  currentStock: number;
  percent: number;
  dailyAverage: number;
  weeklyConsumption: number;
  monthlyConsumption: number;
  estimatedDaysLeft: number | null;
  estimatedRestockDate: string | null;
  status: "ok" | "low" | "warning" | "critical";
};

export type ApexAlert = {
  id?: number;
  title: string;
  detail?: string;
  severity: AlertSeverity;
  status: AlertStatus;
  source: "stock" | "nutrition" | "training" | "habit" | "system";
  productId?: number;
  dueDateKey?: string;
  createdAt: string;
  updatedAt: string;
};

export type NutritionLog = {
  id?: number;
  dateKey: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  waterMl: number;
  weightKg?: number;
  meals?: FoodEntry[];
  planItems?: NutritionPlanItem[];
  drinks?: DrinkEntry[];
  createdAt: string;
  updatedAt: string;
};

export type FoodEntry = {
  id: string;
  name: string;
  amountLabel?: string;
  inputText?: string;
  amount?: number;
  unit?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  estimated: boolean;
  source: "text" | "autocomplete" | "photo" | "default_manual_confirmed";
  calculationMethod?: "openai" | "database" | "manual" | "fallback" | "photo";
  createdAt?: string;
};

export type NutritionPlanItem = {
  id: string;
  meal: "Desayuno" | "Colacion manana" | "Almuerzo" | "Merienda" | "Colacion tarde" | "Cena";
  name: string;
  amountLabel?: string;
  components?: NutritionPlanComponent[];
  done: boolean;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  notes?: string;
};

export type NutritionPlanComponent = {
  name: string;
  amountLabel: string;
};

export type DrinkEntry = {
  id: string;
  type: DrinkType;
  amountMl: number;
  label: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
};

export type FoodCacheItem = {
  id?: number;
  key: string;
  entry: FoodEntry;
  createdAt: string;
};

export type WorkoutSet = {
  reps: number;
  weight?: number;
  rir?: number;
  restSeconds?: number;
  completed?: boolean;
};

export type WorkoutExercise = {
  id: string;
  name: string;
  sets: WorkoutSet[];
  notes?: string;
  completed?: boolean;
};

export type Workout = {
  id?: number;
  dateKey: string;
  title: string;
  focus: string;
  intensity: 1 | 2 | 3 | 4 | 5;
  durationMinutes?: number;
  exercises: WorkoutExercise[];
  notes?: string;
  completed?: boolean;
  createdAt: string;
  updatedAt?: string;
};

export type WorkoutTemplate = {
  id?: number;
  name: string;
  group: string;
  focus: string;
  intensity: 1 | 2 | 3 | 4 | 5;
  exercises: WorkoutExercise[];
  notes?: string;
  source: "default" | "user" | "ai";
  createdAt: string;
  updatedAt: string;
};

export type BodyMeasurement = {
  id?: number;
  dateKey: string;
  weightKg: number;
  heightCm?: number;
  age?: number;
  goal: string;
  bodyFatPercent?: number;
  chestCm?: number;
  waistCm?: number;
  armsCm?: number;
  legsCm?: number;
  neckCm?: number;
  photo?: string;
  notes?: string;
  createdAt: string;
};

export type ShoppingItem = {
  id?: number;
  title: string;
  category: ProductGroup;
  status: ShoppingStatus;
  source: "stock" | "ai" | "manual";
  productId?: number;
  createdAt: string;
  updatedAt: string;
};

export type ChatMessage = {
  id?: number;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export type AgendaNote = {
  id?: number;
  dateKey: string;
  note: string;
  updatedAt: string;
};

export type SleepLog = {
  id?: number;
  dateKey: string;
  sleepTime: string;
  wakeTime: string;
  durationMinutes: number;
  createdAt: string;
  updatedAt: string;
};

export type FinanceTransaction = {
  id?: number;
  type: FinanceTransactionType;
  description: string;
  amount: number;
  currency: FinanceCurrency;
  category: string;
  incomeSource?: string;
  dateKey: string;
  occurredAt: string;
  paymentMethodId?: number;
  paymentMethodLabel?: string;
  paymentKind?: FinancePaymentKind;
  installments?: {
    count: number;
    firstDueDateKey: string;
    amountPerInstallment: number;
  };
  reimbursement?: {
    mode: "amount" | "percent";
    value: number;
    discountAmount: number;
    netAmount: number;
  };
  extraInfo?: string;
  cardStatementDateKey?: string;
  cardPaymentDateKey?: string;
  source: "quick" | "manual" | "import" | "ai";
  createdAt: string;
  updatedAt: string;
};

export type FinanceCategoryRule = {
  id?: number;
  key: string;
  category: string;
  createdAt: string;
  updatedAt: string;
};

export type FinancePaymentMethod = {
  id?: number;
  label: string;
  kind: FinancePaymentKind;
  issuer?: string;
  network?: string;
  closingDay?: number;
  closingBusinessDaysBeforeMonthEnd?: number;
  paymentDay?: number;
  paymentBusinessDayFromMonthStart?: number;
  createdAt: string;
  updatedAt: string;
};

export type FinanceScheduledPayment = {
  id?: number;
  transactionId?: number;
  title: string;
  amount: number;
  currency: FinanceCurrency;
  dueDateKey: string;
  extraInfo?: string;
  createdAt: string;
  updatedAt: string;
};

export type FinanceSettings = {
  id: "finance";
  defaultPaymentMethodId?: number;
  monthRangeStartDay: number;
  monthRangeEndDay: number;
  incomeSources: string[];
  createdAt: string;
  updatedAt: string;
};

export type TimelineEvent = {
  id: string;
  dateKey: string;
  title: string;
  detail?: string;
  type: "routine" | "stock" | "nutrition" | "training" | "photo" | "system";
};

export type ProgressPhoto = {
  id?: number;
  zone: ProgressPhotoZone;
  image: string;
  note?: string;
  createdAt: string;
};

export type FoodVisionOption = {
  label: string;
  confidence?: number;
};

export type FoodVisionResult =
  | FoodEntry[]
  | {
      status: "confirm";
      message?: string;
      options: FoodVisionOption[];
      foods?: FoodEntry[];
    };

export type AppSettings = {
  id: "settings";
  theme: ThemeMode;
  morningReminder: string;
  nightReminder: string;
  dermarollerReminder: boolean;
  notificationsEnabled: boolean;
  nutritionGoal?: string;
  trainingGoal?: string;
};

export type SkincareProduct = {
  id: string;
  name: string;
  order: number;
  waitMinutes: number;
  active: boolean;
};
