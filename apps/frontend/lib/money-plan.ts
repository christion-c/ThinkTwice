// Pure math behind the Finance tab's money plan: monthly pay, bills,
// debt payment schedules, debt-to-income, and net worth. Kept free of
// React so every number the app shows can be unit tested.
//
// Accuracy rules:
// - A month is 52/12 (about 4.33) weeks of pay, not 4.
// - All money math runs in whole cents (integers), so totals never
//   drift by fractions of a cent; interest is rounded to the cent each
//   month, the way lenders post it.
// - Each debt's schedule runs month by month from the month its
//   balance was entered, so a balance typed in October is still right
//   when viewed in January, last payments are partial, and deferred
//   debts start on time.

import type { DebtKind, MoneyItem, PayFrequency, PayProfile } from "@thinktwice/shared-types";

export const WEEKS_PER_MONTH = 52 / 12;

// How many paychecks land in an average month for each pay frequency.
export const CHECKS_PER_MONTH: Record<PayFrequency, number> = {
  weekly: 52 / 12,
  biweekly: 26 / 12,
  semimonthly: 2,
  monthly: 1,
};

// Schedules stop here (50 years) - anything longer is reported as
// never paying off rather than simulated forever.
const MAX_SCHEDULE_MONTHS = 600;

export const DEBT_KINDS: DebtKind[] = ["loan", "card", "collection"];

export function isDebt(item: MoneyItem): boolean {
  return item.kind === "loan" || item.kind === "card" || item.kind === "collection";
}

export function toCents(dollars: number): number {
  return Math.round(dollars * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}

// ---- Months -------------------------------------------------------
// A month is a "YYYY-MM" string; these sort and compare correctly as
// plain strings.

export type MonthKey = string;

export function monthKeyOf(date: Date): MonthKey {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

// "2026-10-02" or "2026-10-01" -> "2026-10".
export function monthKeyFromIsoDate(isoDate: string): MonthKey {
  return isoDate.slice(0, 7);
}

export function addMonths(month: MonthKey, count: number): MonthKey {
  const [year, monthNumber] = month.split("-").map(Number);
  const index = year * 12 + (monthNumber - 1) + count;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, "0")}`;
}

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "Jan" or, with withYear, "Jan 2027".
export function monthLabel(month: MonthKey, withYear = false): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const name = monthNames[monthNumber - 1];
  return withYear ? `${name} ${year}` : name;
}

// ---- Pay ----------------------------------------------------------

export interface MonthlyPay {
  // Gross pay for an average month: hourly rate x hours x 52/12.
  gross: number;
  // Take-home for an average month: per-check take-home x checks/month.
  takeHome: number;
}

export function monthlyPay(pay: PayProfile): MonthlyPay {
  return {
    gross: pay.hourlyRate * pay.hoursPerWeek * WEEKS_PER_MONTH,
    takeHome: pay.takeHomePerCheck * CHECKS_PER_MONTH[pay.payFrequency],
  };
}

// ---- Debt schedules -----------------------------------------------

export interface DebtScheduleMonth {
  month: MonthKey;
  // Balance at the start of the month, after this month's interest and
  // before this month's payment (all in cents).
  balanceCents: number;
  paymentCents: number;
}

export interface DebtSchedule {
  months: DebtScheduleMonth[];
  // Month of the final payment, or null if it never pays off.
  paidOffMonth: MonthKey | null;
  // True when there's no payment set, or the payment doesn't cover the
  // interest, so the balance would never reach zero.
  neverPaysOff: boolean;
}

// Simulates one debt month by month from the month its balance was
// entered. The entered balance is taken as "before this month's
// payment" (no interest added that first month); after that, each
// month adds interest (APR/12, rounded to the cent) then pays the
// smaller of the monthly payment and what's left.
export function debtSchedule(item: MoneyItem): DebtSchedule {
  const asOf = monthKeyFromIsoDate(item.balanceAsOf ?? "1970-01-01");
  const startsOn = item.startsOn ? monthKeyFromIsoDate(item.startsOn) : asOf;
  const firstPaymentMonth = startsOn > asOf ? startsOn : asOf;
  const monthlyRate = (item.aprPercent ?? 0) / 100 / 12;
  const paymentCents = toCents(item.monthlyAmount);

  let balanceCents = toCents(item.balance ?? 0);
  const months: DebtScheduleMonth[] = [];

  if (balanceCents <= 0) {
    return { months, paidOffMonth: null, neverPaysOff: false };
  }

  for (let offset = 0; offset < MAX_SCHEDULE_MONTHS; offset += 1) {
    const month = addMonths(asOf, offset);
    const interestCents = offset === 0 ? 0 : Math.round(balanceCents * monthlyRate);
    balanceCents += interestCents;

    const paying = month >= firstPaymentMonth;
    const payment = paying ? Math.min(paymentCents, balanceCents) : 0;
    months.push({ month, balanceCents, paymentCents: payment });
    balanceCents -= payment;

    if (balanceCents <= 0) {
      return { months, paidOffMonth: month, neverPaysOff: false };
    }

    // Once payments have started, a payment that can't beat the
    // interest (or no payment at all) never gets the balance to zero.
    if (paying && paymentCents <= Math.round(balanceCents * monthlyRate)) {
      return { months, paidOffMonth: null, neverPaysOff: true };
    }
  }

  return { months, paidOffMonth: null, neverPaysOff: true };
}

// ---- One month's summary ------------------------------------------

export interface DebtInMonth {
  item: MoneyItem;
  // Balance at the start of the month (before its payment).
  balance: number;
  payment: number;
  // Payments from this month on, including this one; null if it never
  // pays off.
  paymentsLeft: number | null;
  paidOffMonth: MonthKey | null;
  neverPaysOff: boolean;
  // Payments haven't started yet (a deferred debt before its first month).
  notStarted: boolean;
}

export interface MonthSummary {
  month: MonthKey;
  gross: number;
  takeHome: number;
  // Debt payments that come out of the bank account (not the paycheck).
  debtPayments: number;
  // Debt payments deducted from the paycheck - already in take-home.
  paycheckDebtPayments: number;
  bills: number;
  fuel: number;
  totalOut: number;
  leftOver: number;
  // Left over spread over the month's 52/12 weeks.
  perWeek: number;
  // Debt payments / gross pay - the ratio lenders use. Null without pay.
  grossDti: number | null;
  // Debt payments / take-home - how much of each paycheck goes to debt.
  takeHomeDebtShare: number | null;
  debts: DebtInMonth[];
  owedByKind: Record<DebtKind, number>;
  totalOwed: number;
  assets: number;
  netWorth: number;
}

// Looks up one debt's position in a given month from its schedule.
function debtInMonth(item: MoneyItem, schedule: DebtSchedule, month: MonthKey): DebtInMonth {
  const asOf = monthKeyFromIsoDate(item.balanceAsOf ?? "1970-01-01");
  const index = schedule.months.findIndex((entry) => entry.month === month);
  const entry = index >= 0 ? schedule.months[index] : undefined;

  // Before the balance was entered, the entered balance is the best
  // known figure; after the schedule ends, the debt is paid off.
  const balanceCents = entry
    ? entry.balanceCents
    : month < asOf
      ? toCents(item.balance ?? 0)
      : schedule.neverPaysOff && schedule.months.length > 0
        ? schedule.months[schedule.months.length - 1].balanceCents
        : 0;

  const remaining = index >= 0 ? schedule.months.slice(index) : month < asOf ? schedule.months : [];
  const paymentsLeft = schedule.neverPaysOff ? null : remaining.filter((m) => m.paymentCents > 0).length;
  const startsOn = item.startsOn ? monthKeyFromIsoDate(item.startsOn) : null;

  return {
    item,
    balance: fromCents(balanceCents),
    payment: fromCents(entry?.paymentCents ?? 0),
    paymentsLeft,
    paidOffMonth: schedule.paidOffMonth,
    neverPaysOff: schedule.neverPaysOff,
    notStarted: startsOn !== null && month < startsOn,
  };
}

// Everything the Finance tab shows for one month. `fuel` is the Fuel
// tab's monthly fuel budget, counted as a bill so gas isn't missed.
export function summarizeMonth(
  pay: PayProfile | null,
  items: MoneyItem[],
  month: MonthKey,
  fuel: number,
): MonthSummary {
  const { gross, takeHome } = pay ? monthlyPay(pay) : { gross: 0, takeHome: 0 };

  const debts = items.filter(isDebt).map((item) => debtInMonth(item, debtSchedule(item), month));

  let debtCents = 0;
  let paycheckDebtCents = 0;
  const owedCents: Record<DebtKind, number> = { loan: 0, card: 0, collection: 0 };

  for (const debt of debts) {
    if (debt.item.fromPaycheck) {
      paycheckDebtCents += toCents(debt.payment);
    } else {
      debtCents += toCents(debt.payment);
    }
    owedCents[debt.item.kind as DebtKind] += toCents(debt.balance);
  }

  const billCents = items
    .filter((item) => item.kind === "bill")
    .reduce((sum, item) => sum + toCents(item.monthlyAmount), 0);
  const assetCents = items
    .filter((item) => item.kind === "asset")
    .reduce((sum, item) => sum + toCents(item.balance ?? 0), 0);

  const fuelCents = toCents(Math.max(fuel, 0));
  const totalOutCents = debtCents + billCents + fuelCents;
  const totalOwedCents = owedCents.loan + owedCents.card + owedCents.collection;
  const debtPayments = fromCents(debtCents);
  const leftOver = takeHome - fromCents(totalOutCents);

  return {
    month,
    gross,
    takeHome,
    debtPayments,
    paycheckDebtPayments: fromCents(paycheckDebtCents),
    bills: fromCents(billCents),
    fuel: fromCents(fuelCents),
    totalOut: fromCents(totalOutCents),
    leftOver,
    perWeek: leftOver / WEEKS_PER_MONTH,
    grossDti: gross > 0 ? debtPayments / gross : null,
    takeHomeDebtShare: takeHome > 0 ? debtPayments / takeHome : null,
    debts,
    owedByKind: {
      loan: fromCents(owedCents.loan),
      card: fromCents(owedCents.card),
      collection: fromCents(owedCents.collection),
    },
    totalOwed: fromCents(totalOwedCents),
    assets: fromCents(assetCents),
    netWorth: fromCents(assetCents - totalOwedCents),
  };
}

// The latest month any debt is still being paid - when you'd be debt
// free if every payment is made on schedule. Null with no debts, or if
// some debt never pays off.
export function debtFreeMonth(items: MoneyItem[]): MonthKey | null {
  let latest: MonthKey | null = null;

  for (const item of items.filter(isDebt)) {
    const schedule = debtSchedule(item);
    if (schedule.neverPaysOff) {
      return null;
    }
    if (schedule.paidOffMonth && (latest === null || schedule.paidOffMonth > latest)) {
      latest = schedule.paidOffMonth;
    }
  }

  return latest;
}
