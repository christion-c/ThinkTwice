/**
 * Types shared between the backend API and the frontend client. These
 * describe the wire format (JSON over HTTP) — dates are ISO strings here,
 * not the `Date` objects the backend's repositories use internally, so this
 * intentionally does NOT replace apps/backend's own repository types.
 *
 * Type-only: nothing here has a runtime value, so importing via
 * `import type` is fully erased at compile time and adds no runtime
 * dependency on either service.
 */

export interface UserProfile {
  id: string;
  firebaseUid: string;
  email: string | null;
  displayName: string | null;
  photoUrl: string | null;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Vehicle {
  id: string;
  userId: string;
  nickname: string;
  make: string | null;
  model: string | null;
  modelYear: number | null;
  tankCapacityGallons: number | null;
  combinedMpg: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVehicleInput {
  nickname: string;
  make?: string | null;
  model?: string | null;
  modelYear?: number | null;
  tankCapacityGallons?: number | null;
  combinedMpg?: number | null;
}

export interface UpdateVehicleInput {
  nickname?: string;
  make?: string | null;
  model?: string | null;
  modelYear?: number | null;
  tankCapacityGallons?: number | null;
  combinedMpg?: number | null;
}

export interface BudgetEntry {
  id: string;
  userId: string;
  entryDate: string;
  fuelCost: number | null;
  foodCost: number | null;
  milesDriven: number | null;
  meals: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBudgetEntryInput {
  entryDate: string;
  fuelCost?: number | null;
  foodCost?: number | null;
  milesDriven?: number | null;
  meals?: number | null;
}

export interface FinanceInputs {
  incomeInput: string;
  expenseInput: string;
  monthlyFixedCostsInput: string;
  fuelGallonsInput: string;
  fuelPriceInput: string;
  milesPerWeekInput: string;
  combinedMpgInput: string;
  tankCapacityInput: string;
  currentTankPercentInput: string;
}

export interface FillUpHistoryEntry {
  milesDriven: number;
  fuelPrice: number;
  combinedMpg: number;
  tankCapacity: number;
  gallons: number;
  observedCost: number;
}

export interface DailyDrivingLog {
  id: string;
  logDate: string;
  milesDriven: number;
  vehicleId: string | null;
}

export interface CreateDailyDrivingLogInput {
  logDate: string;
  milesDriven: number;
  vehicleId?: string | null;
}

/**
 * The one shape that's genuinely identical end-to-end with no wire/internal
 * split (ML service -> backend -> frontend all use the same fields, no
 * dates involved).
 */
export interface BudgetPrediction {
  predictedFuelCost: number;
  predictedFoodCost: number;
  predictedTotal: number;
  method: "average" | "linear_regression";
  sampleSize: number;
}

export type PredictionResult =
  | { available: true; prediction: BudgetPrediction }
  | { available: false; message: string };

export type PayFrequency = "weekly" | "biweekly" | "semimonthly" | "monthly";
export type MoneyItemKind = "bill" | "loan" | "card" | "collection" | "asset";
export type DebtKind = "loan" | "card" | "collection";

export interface PayProfile {
  hourlyRate: number;
  hoursPerWeek: number;
  payFrequency: PayFrequency;
  takeHomePerCheck: number;
}

export interface MoneyItem {
  id: string;
  kind: MoneyItemKind;
  name: string;
  /** A bill's monthly cost or a debt's monthly payment; 0 for assets. */
  monthlyAmount: number;
  /** A debt's balance owed or an asset's value; null for bills. */
  balance: number | null;
  /** YYYY-MM-DD the balance was entered; payment schedules run from this month. */
  balanceAsOf: string | null;
  aprPercent: number | null;
  /** YYYY-MM-01 of a deferred debt's first payment month, else null. */
  startsOn: string | null;
  /** Deducted from the paycheck (already reflected in take-home). */
  fromPaycheck: boolean;
}

export type MoneyItemInput =
  | { kind: "bill"; name: string; monthlyAmount: number }
  | {
      kind: DebtKind;
      name: string;
      monthlyAmount: number;
      balance: number;
      balanceAsOf: string;
      aprPercent?: number | null;
      startsOn?: string | null;
      fromPaycheck?: boolean;
    }
  | { kind: "asset"; name: string; balance: number; balanceAsOf: string };

export interface MoneyPlan {
  pay: PayProfile | null;
  items: MoneyItem[];
}
