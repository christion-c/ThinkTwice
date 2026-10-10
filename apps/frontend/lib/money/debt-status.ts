import { formatCurrency } from "./format";
import { type DebtInMonth, monthLabel } from "./plan";

// One line under a debt on the Finance tab: what's owed and when it's done.
export function debtStatus(debt: DebtInMonth): string {
  if (debt.balance <= 0) {
    return "Paid off";
  }
  const owed = `Owe ${formatCurrency(debt.balance)}`;
  if (debt.neverPaysOff) {
    return debt.item.monthlyAmount > 0 ? `${owed} · Payment doesn't cover interest` : `${owed} · No payment set`;
  }
  if (debt.notStarted && debt.item.startsOn) {
    return `${owed} · Starts ${monthLabel(debt.item.startsOn.slice(0, 7), true)}`;
  }
  return debt.paidOffMonth ? `${owed} · ${debt.paymentsLeft} left · Done ${monthLabel(debt.paidOffMonth, true)}` : owed;
}
