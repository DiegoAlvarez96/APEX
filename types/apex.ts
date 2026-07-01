export type RoutineSlot = "morning" | "afternoon" | "night";
export type ProgressPhotoZone = "skin" | "beard" | "hair";
export type ThemeMode = "dark" | "light";
export type AlertStatus = "active" | "buy" | "snoozed" | "ignored";
export type AlertSeverity = "info" | "warning" | "critical";
export type ProductGroup = "nutrition" | "personalCare" | "supplement" | "other";
export type ShoppingStatus = "pending" | "bought" | "ignored";
export type DrinkType = "water" | "soda" | "juice" | "isotonic" | "alcohol" | "other";

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
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  estimated: boolean;
  source: "text" | "autocomplete" | "photo";
};

export type NutritionPlanItem = {
  id: string;
  meal: "Desayuno" | "Almuerzo" | "Merienda" | "Cena";
  name: string;
  done: boolean;
};

export type DrinkEntry = {
  id: string;
  type: DrinkType;
  amountMl: number;
  label: string;
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
  createdAt: string;
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
