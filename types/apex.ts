export type RoutineSlot = "morning" | "afternoon" | "night";
export type ProgressPhotoZone = "skin" | "beard" | "hair";
export type ThemeMode = "dark" | "light";

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
  category: string;
  quantity: number;
  unit: string;
  purchaseDate: string;
  cost: number;
  lowAt: number;
  createdAt: string;
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
};

export type SkincareProduct = {
  id: string;
  name: string;
  order: number;
  waitMinutes: number;
  active: boolean;
};
