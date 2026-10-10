import type { MoneyItem, Paycheck, PayProfile } from "@thinktwice/shared-types";

import {
  addMonths,
  assetValueInMonth,
  checksInMonth,
  debtFreeMonth,
  debtSchedule,
  monthLabel,
  monthlyPay,
  monthsBetween,
  payForMonth,
  summarizeMonth,
  WEEKS_PER_MONTH,
} from "./plan";

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
    growthPercent: null,
    balanceAfterPayment: false,
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
    // DTI counts the 401K loan too: 100 from the bank + 150 from the
    // paycheck. Take-home share adds the 150 back to take-home, since
    // take-home already has it taken out.
    expect(summary.grossDti).toBeCloseTo(250 / (20 * 40 * 52 / 12), 10);
    expect(summary.takeHomeDebtShare).toBeCloseTo(250 / (2600 + 150), 10);
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

function check(paidOn: string, takeHome: number, gross: number | null = null): Paycheck {
  nextId += 1;
  return { id: `check-${nextId}`, paidOn, takeHome, gross };
}

describe("checksInMonth", () => {
  it("uses the average until a payday pins down the cycle", () => {
    expect(checksInMonth("biweekly", "2026-10", null)).toBeCloseTo(26 / 12, 10);
    expect(checksInMonth("weekly", "2026-10", null)).toBeCloseTo(52 / 12, 10);
  });

  it("counts the real paydays from any known one, earlier or later", () => {
    // Fridays: Oct 2, 16, 30 / Nov 13, 27.
    expect(checksInMonth("biweekly", "2026-10", "2026-10-02")).toBe(3);
    expect(checksInMonth("biweekly", "2026-11", "2026-10-02")).toBe(2);
    expect(checksInMonth("biweekly", "2026-10", "2026-12-25")).toBe(3);
    expect(checksInMonth("weekly", "2026-10", "2026-10-02")).toBe(5);
    expect(checksInMonth("weekly", "2027-02", "2026-10-02")).toBe(4);
  });

  it("is a fixed count for semimonthly and monthly pay", () => {
    expect(checksInMonth("semimonthly", "2026-10", "2026-10-15")).toBe(2);
    expect(checksInMonth("monthly", "2026-10", "2026-10-01")).toBe(1);
  });
});

describe("payForMonth", () => {
  // $20/hr x 40 hrs weekly = $800 gross and $600 take-home per check.
  it("uses logged checks as paid and estimates only the paydays left", () => {
    // October 2026 has five Friday paydays; one logged short week.
    const pay = payForMonth(weeklyPay, [check("2026-10-02", 450)], "2026-10");

    expect(pay.loggedChecks).toBe(1);
    expect(pay.estimatedChecks).toBe(4);
    expect(pay.takeHome).toBe(450 + 4 * 600);
    // No gross on the stub: scaled from take-home (450 x 800/600 = 600).
    expect(pay.gross).toBeCloseTo(600 + 4 * 800, 10);
  });

  it("uses a logged gross as entered", () => {
    const pay = payForMonth(weeklyPay, [check("2026-10-02", 450, 610.25)], "2026-10");

    expect(pay.gross).toBeCloseTo(610.25 + 4 * 800, 10);
  });

  it("never estimates below zero when extra checks are logged", () => {
    const checks = ["2026-10-02", "2026-10-09", "2026-10-16", "2026-10-23", "2026-10-30", "2026-10-31"].map((day) =>
      check(day, 500),
    );
    const pay = payForMonth(weeklyPay, checks, "2026-10");

    expect(pay.estimatedChecks).toBe(0);
    expect(pay.takeHome).toBe(3000);
  });

  it("counts logged checks with no pay profile, and ignores other months", () => {
    const pay = payForMonth(null, [check("2026-10-02", 700.1), check("2026-09-25", 999)], "2026-10");

    expect(pay.takeHome).toBe(700.1);
    expect(pay.gross).toBe(700.1);
    expect(pay.estimatedChecks).toBe(0);
  });
});

describe("summarizeMonth net worth over time", () => {
  // Weekly pay averages $2,600/month take-home with no logged checks.
  const rent = item({ kind: "bill", name: "Rent", monthlyAmount: 3000 });
  const savings = item({ kind: "asset", name: "Savings", balance: 5000, balanceAsOf: "2026-10-03" });
  const card = item({ kind: "card", name: "Card", balance: 1000, monthlyAmount: 100, balanceAsOf: "2026-10-03" });

  it("is assets minus what's owed for the current month", () => {
    const october = summarizeMonth(weeklyPay, [rent, savings, card], "2026-10", 0, { currentMonth: "2026-10" });

    expect(october.projectedSavings).toBe(0);
    expect(october.netWorth).toBe(4000);
  });

  it("carries each month's shortfall forward instead of only counting debt paydown", () => {
    // Each month: 2600 in, 3000 rent + 100 card out = 500 short. The
    // card balance drops by 100 a month, but the cash to pay it (and
    // the rent) came out of savings too.
    const december = summarizeMonth(weeklyPay, [rent, savings, card], "2026-12", 0, { currentMonth: "2026-10" });

    expect(december.totalOwed).toBe(800);
    expect(december.projectedSavings).toBeCloseTo(-1000, 10);
    expect(december.netWorth).toBeCloseTo(5000 - 1000 - 800, 10);
  });

  it("uses logged paychecks for the months they fall in", () => {
    const checks = [check("2026-10-02", 650), check("2026-10-09", 650)];
    const november = summarizeMonth(weeklyPay, [savings], "2026-11", 0, { paychecks: checks, currentMonth: "2026-10" });

    // October: 2 logged at 650 + 3 estimated at 600 = 3100, no bills.
    expect(november.projectedSavings).toBe(3100);
    // November has 4 Friday paydays once the cycle is known.
    expect(november.estimatedChecks).toBe(4);
    expect(november.takeHome).toBe(2400);
  });
});

describe("balanceAfterPayment", () => {
  const card = { kind: "card" as const, name: "Card", balance: 300, monthlyAmount: 100, balanceAsOf: "2026-10-15" };

  it("skips the payment in the month the balance was entered", () => {
    const schedule = debtSchedule(item({ ...card, balanceAfterPayment: true }));

    expect(schedule.months[0]).toEqual({ month: "2026-10", balanceCents: 30000, paymentCents: 0 });
    expect(schedule.months[1]).toEqual({ month: "2026-11", balanceCents: 30000, paymentCents: 10000 });
    expect(schedule.paidOffMonth).toBe("2027-01");
  });

  it("pays off one month later than the same balance entered before paying", () => {
    expect(debtSchedule(item(card)).paidOffMonth).toBe("2026-12");
  });

  it("shows no payment and all payments still left in the entered month", () => {
    const october = summarizeMonth(null, [item({ ...card, balanceAfterPayment: true })], "2026-10", 0);

    expect(october.debtPayments).toBe(0);
    expect(october.debts[0]?.balance).toBe(300);
    expect(october.debts[0]?.paymentsLeft).toBe(3);
  });
});

describe("asset growth", () => {
  it("counts months between month keys, across years and backwards", () => {
    expect(monthsBetween("2026-10", "2027-01")).toBe(3);
    expect(monthsBetween("2026-10", "2026-10")).toBe(0);
    expect(monthsBetween("2027-01", "2026-10")).toBe(-3);
  });

  it("stays flat without a growth rate, and before the value was entered", () => {
    const savings = item({ kind: "asset", name: "Savings", balance: 1000, balanceAsOf: "2026-10-03" });
    const growing = item({ ...savings, growthPercent: 12 });

    expect(assetValueInMonth(savings, "2027-10")).toBe(1000);
    expect(assetValueInMonth(growing, "2026-10")).toBe(1000);
    expect(assetValueInMonth(growing, "2026-08")).toBe(1000);
  });

  it("compounds monthly, rounded to the cent", () => {
    const savings = item({ kind: "asset", name: "Savings", balance: 1000, balanceAsOf: "2026-10-03", growthPercent: 12 });

    expect(assetValueInMonth(savings, "2026-11")).toBe(1010);
    expect(assetValueInMonth(savings, "2026-12")).toBe(1020.1);
    // 12 months at 1%/month = 1000 x 1.01^12 = 1126.825...
    expect(assetValueInMonth(savings, "2027-10")).toBe(1126.83);
  });

  it("depreciates with a negative rate", () => {
    const car = item({ kind: "asset", name: "Car", balance: 12000, balanceAsOf: "2026-10-03", growthPercent: -15 });

    expect(assetValueInMonth(car, "2027-10")).toBe(Math.round(1200000 * (1 - 0.15 / 12) ** 12) / 100);
  });

  it("feeds each asset's value for the month into net worth", () => {
    const car = item({ kind: "asset", name: "Car", balance: 12000, balanceAsOf: "2026-10-03", growthPercent: -12 });
    const november = summarizeMonth(null, [car], "2026-11", 0);

    expect(november.assetValues).toEqual([{ item: car, value: 11880 }]);
    expect(november.assets).toBe(11880);
    expect(november.netWorth).toBe(11880);
  });
});

describe("keepLeftOver", () => {
  const savings = item({ kind: "asset", name: "Savings", balance: 5000, balanceAsOf: "2026-10-03" });
  const rent = item({ kind: "bill", name: "Rent", monthlyAmount: 2000 });

  it("leaves left-over money out of future net worth when it gets spent", () => {
    // 2600 take-home - 2000 rent = 600 left over each month.
    const kept = summarizeMonth(weeklyPay, [savings, rent], "2026-12", 0, { currentMonth: "2026-10" });
    const spent = summarizeMonth(weeklyPay, [savings, rent], "2026-12", 0, { currentMonth: "2026-10", keepLeftOver: false });

    expect(kept.projectedSavings).toBeCloseTo(1200, 10);
    expect(spent.projectedSavings).toBe(0);
    expect(spent.netWorth).toBe(5000);
  });

  it("still counts a shortfall, since it has to come out of savings", () => {
    const bigRent = item({ kind: "bill", name: "Rent", monthlyAmount: 3000 });
    const spent = summarizeMonth(weeklyPay, [savings, bigRent], "2026-12", 0, { currentMonth: "2026-10", keepLeftOver: false });

    expect(spent.projectedSavings).toBeCloseTo(-800, 10);
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
