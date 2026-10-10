import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { useMoneyPlan } from "@/contexts/MoneyPlanProvider";
import ItemRow from "@/components/money/ItemRow";
import PaycheckSheet, { paydayLabel, type PaycheckSheetTarget } from "@/components/money/PaycheckSheet";
import PageScaffold from "@/components/layout/PageScaffold";
import SettingsBackButton from "@/components/settings/SettingsBackButton";
import { Card, CardTitle } from "@/components/ui";
import { formatCurrency } from "@/lib/money/format";
import { monthKeyFromIsoDate, monthLabel, type MonthKey } from "@/lib/money/plan";
import type { Paycheck } from "@thinktwice/shared-types";

// Every logged paycheck, newest first, grouped by month with each
// month's take-home total. Tap a check to edit or delete it.
export default function Paychecks() {
  const { paychecks } = useMoneyPlan();
  const [paycheckTarget, setPaycheckTarget] = useState<PaycheckSheetTarget | null>(null);

  const months = useMemo(() => {
    const byMonth = new Map<MonthKey, Paycheck[]>();
    const newestFirst = [...paychecks].sort((a, b) => (a.paidOn < b.paidOn ? 1 : a.paidOn > b.paidOn ? -1 : 0));

    for (const check of newestFirst) {
      const month = monthKeyFromIsoDate(check.paidOn);
      byMonth.set(month, [...(byMonth.get(month) ?? []), check]);
    }

    return [...byMonth.entries()].map(([month, checks]) => ({
      month,
      checks,
      totalTakeHome: checks.reduce((sum, check) => sum + Math.round(check.takeHome * 100), 0) / 100,
    }));
  }, [paychecks]);

  return (
    <PageScaffold
      title="Paychecks"
      subtitle="Every check you've logged, by month."
      headerLeft={<SettingsBackButton onPress={() => router.back()} />}
    >
      <Card>
        <Pressable
          onPress={() => setPaycheckTarget({ paycheck: null })}
          className="items-center rounded-md bg-accent py-3 active:opacity-80"
        >
          <Text className="text-body font-bold text-accentDeep">Log a paycheck</Text>
        </Pressable>
      </Card>

      {months.length === 0 ? (
        <Card>
          <Text className="text-sm text-textMuted">No paychecks logged yet.</Text>
        </Card>
      ) : (
        months.map(({ month, checks, totalTakeHome }) => (
          <Card key={month}>
            <View className="flex-row items-baseline justify-between">
              <CardTitle>{monthLabel(month, true)}</CardTitle>
              <Text className="text-caption font-semibold text-textMuted">
                {checks.length} check{checks.length === 1 ? "" : "s"} · {formatCurrency(totalTakeHome)}
              </Text>
            </View>
            <View>
              {checks.map((check) => (
                <ItemRow
                  key={check.id}
                  title={paydayLabel(check.paidOn)}
                  subtitle={check.gross !== null ? `${formatCurrency(check.gross)} gross` : undefined}
                  value={formatCurrency(check.takeHome)}
                  onPress={() => setPaycheckTarget({ paycheck: check })}
                />
              ))}
            </View>
          </Card>
        ))
      )}

      <PaycheckSheet target={paycheckTarget} onClose={() => setPaycheckTarget(null)} />
    </PageScaffold>
  );
}
