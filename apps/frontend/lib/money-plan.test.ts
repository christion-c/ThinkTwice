import type { MoneyItem, PayProfile } from "@thinktwice/shared-types";

import {
  addMonths,
  debtFreeMonth,
  debtSchedule,
  monthLabel,
  monthlyPay,
  summarizeMonth,
  WEEKS_PER_MONTH,
} from "./money-plan";

let nextId = 0;
function item(fields: Partial<MoneyItem> & Pick<MoneyItem, "kind" | "name">): MoneyItem {
  nextId += 1;
  return {
    id: `item-${nextId}`,
    monthlyAmount: 0,
    balance: null,
    balanceAsOf: null,
    aprPercent: null,
    startsOn: null,
    fromPaycheck: false,
    ...fields,
  };
}

const weeklyPay: PayProfile = {
  hourlyRate: 20,
  hoursPerWeek: 40,
  payFrequency: "weekly",
  takeHomePerCheck: 600,
};

describe("months", () => {
  it("adds months across year boundaries", () => {
    expect(addMonths("2026-11", 2)).toBe("2027-01");
    expect(addMonths("2027-01", -1)).toBe("2026-12");
    expect(addMonths("2026-10", 15)).toBe("2028-01");
  });

  it("labels months with and without the year", () => {
    expect(monthLabel("2027-01")).toBe("Jan");
    expect(monthLabel("2027-01", true)).toBe("Jan 2027");
  });
});

describe("monthlyPay", () => {
  it("uses 52/12 weeks per month, not 4", () => {
    const { gross, takeHome } = monthlyPay(weeklyPay);

    expect(WEEKS_PER_MONTH).toBeCloseTo(4.3333, 4);
    expect(gross).toBeCloseTo(20 * 40 * 52 / 12, 10); // $3,466.67
    expect(takeHome).toBeCloseTo(600 * 52 / 12, 10); // $2,600.00
  });

  it("converts each pay frequency to checks per month", () => {
    const base = { ...weeklyPay, takeHomePerCheck: 1200 };

    expect(monthlyPay({ ...base, payFrequency: "biweekly" }).takeHome).toBeCloseTo(2600, 10);
    expect(monthlyPay({ ...base, payFrequency: "semimonthly" }).takeHome).toBe(2400);
    expect(monthlyPay({ ...base, payFrequency: "monthly" }).takeHome).toBe(1200);
  });
});

describe("debtSchedule", () => {
  it("makes a partial final payment instead of overpaying", () => {
    const schedule = debtSchedule(
      item({ kind: "collection", name: "C", balance: 250.5, monthlyAmount: 100, balanceAsOf: "2026-10-15" }),
    );

    expect(schedule.months.map((m) => m.paymentCents)).toEqual([10000, 10000, 5050]);
    expect(schedule.paidOffMonth).toBe("2026-12");
    expect(schedule.neverPaysOff).toBe(false);
  });

  it("holds a deferred debt at its balance until payments start", () => {
    const schedule = debtSchedule(
      item({
        kind: "loan",
        name: "L",
        balance: 600,
        monthlyAmount: 300,
        balanceAsOf: "2026-10-02",
        startsOn: "2027-01-01",
      }),
    );

    expect(schedule.months.map((m) => [m.month, m.paymentCents])).toEqual([
      ["2026-10", 0],
      ["2026-11", 0],
      ["2026-12", 0],
      ["2027-01", 30000],
      ["2027-02", 30000],
    ]);
    expect(schedule.paidOffMonth).toBe("2027-02");
  });

  it("adds monthly interest rounded to the cent", () => {
    // 12% APR = 1% a month. Month 1: no interest (balance as entered).
    const schedule = debtSchedule(
      item({ kind: "card", name: "Card", balance: 1000, monthlyAmount: 500, aprPercent: 12, balanceAsOf: "2026-10-01" }),
    );

    // 1000 - 500 = 500; +5.00 interest = 505 - 500 = 5; +0.05 = 5.05 paid.
    expect(schedule.months.map((m) => [m.balanceCents, m.paymentCents])).toEqual([
      [100000, 50000],
      [50500, 50000],
      [505, 505],
    ]);
  });

  it("reports a debt that never pays off", () => {
    const noPayment = debtSchedule(
      item({ kind: "collection", name: "C", balance: 500, monthlyAmount: 0, balanceAsOf: "2026-10-01" }),
    );
    const underwater = debtSchedule(
      item({ kind: "card", name: "Card", balance: 10000, monthlyAmount: 50, aprPercent: 24, balanceAsOf: "2026-10-01" }),
    );

    expect(noPayment.neverPaysOff).toBe(true);
    expect(noPayment.paidOffMonth).toBeNull();
    expect(underwater.neverPaysOff).toBe(true);
  });
});

describe("summarizeMonth", () => {
  const items = [
    item({ kind: "bill", name: "Phone", monthlyAmount: 45.5 }),
    item({ kind: "bill", name: "Insurance", monthlyAmount: 120.25 }),
    item({ kind: "collection", name: "Old bill", balance: 250.5, monthlyAmount: 100, balanceAsOf: "2026-10-03" }),
    item({
      kind: "loan",
      name: "School",
      balance: 5000,
      monthlyAmount: 200,
      balanceAsOf: "2026-10-03",
      startsOn: "2027-01-01",
    }),
    item({ kind: "loan", name: "401K loan", balance: 900, monthlyAmount: 150, balanceAsOf: "2026-10-03", fromPaycheck: true }),
    item({ kind: "asset", name: "Savings", balance: 3000, balanceAsOf: "2026-10-03" }),
  ];

  it("totals this month's money in and out to the cent", () => {
    const summary = summarizeMonth(weeklyPay, items, "2026-10", 80);

    expect(summary.debtPayments).toBe(100); // 401K loan excluded: it's in take-home already
    expect(summary.paycheckDebtPayments).toBe(150);
    expect(summary.bills).toBe(165.75);
    expect(summary.fuel).toBe(80);
    expect(summary.totalOut).toBe(345.75);
    expect(summary.leftOver).toBeCloseTo(2600 - 345.75, 10);
    expect(summary.perWeek).toBeCloseTo((2600 - 345.75) / (52 / 12), 10);
    expect(summary.grossDti).toBeCloseTo(100 / (20 * 40 * 52 / 12), 10);
    expect(summary.takeHomeDebtShare).toBeCloseTo(100 / 2600, 10);
  });

  it("tracks balances, net worth, and payoff", () => {
    const summary = summarizeMonth(weeklyPay, items, "2026-10", 0);

    expect(summary.owedByKind).toEqual({ loan: 5900, card: 0, collection: 250.5 });
    expect(summary.totalOwed).toBe(6150.5);
    expect(summary.assets).toBe(3000);
    expect(summary.netWorth).toBe(-3150.5);

    const oldBill = summary.debts.find((debt) => debt.item.name === "Old bill");
    expect(oldBill?.paymentsLeft).toBe(3);
    expect(oldBill?.paidOffMonth).toBe("2026-12");
  });

  it("projects a later month: payoffs drop out, deferred debts start", () => {
    const january = summarizeMonth(weeklyPay, items, "2027-01", 0);
    const school = january.debts.find((debt) => debt.item.name === "School");
    const oldBill = january.debts.find((debt) => debt.item.name === "Old bill");

    expect(january.debtPayments).toBe(200); // old bill paid off in Dec; school starts
    expect(oldBill?.balance).toBe(0);
    expect(oldBill?.paymentsLeft).toBe(0);
    expect(school?.payment).toBe(200);
    expect(school?.notStarted).toBe(false);

    const november = summarizeMonth(weeklyPay, items, "2026-11", 0);
    expect(november.debts.find((debt) => debt.item.name === "School")?.notStarted).toBe(true);
    // 401K loan: 150 x 6 = 900, so by January only 3 payments (450) remain.
    expect(january.debts.find((debt) => debt.item.name === "401K loan")?.balance).toBe(450);
  });

  it("works with no pay profile yet", () => {
    const summary = summarizeMonth(null, items, "2026-10", 0);

    expect(summary.takeHome).toBe(0);
    expect(summary.grossDti).toBeNull();
    expect(summary.takeHomeDebtShare).toBeNull();
  });
});

describe("debtFreeMonth", () => {
  it("is the last payoff month across debts", () => {
    expect(
      debtFreeMonth([
        item({ kind: "card", name: "A", balance: 200, monthlyAmount: 100, balanceAsOf: "2026-10-01" }),
        item({ kind: "loan", name: "B", balance: 500, monthlyAmount: 100, balanceAsOf: "2026-10-01" }),
      ]),
    ).toBe("2027-02");
  });

  it("is null when any debt never pays off", () => {
    expect(
      debtFreeMonth([item({ kind: "collection", name: "C", balance: 100, monthlyAmount: 0, balanceAsOf: "2026-10-01" })]),
    ).toBeNull();
  });
});
