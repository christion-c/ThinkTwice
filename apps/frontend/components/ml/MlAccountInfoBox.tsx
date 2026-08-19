import { Text, View } from "react-native";

interface MlAccountInfoBoxProps {
  label: string;
  userId: string;
  historyCount: number;
}

// Shows which account a preview's data belongs to, and its history size.
export default function MlAccountInfoBox({ label, userId, historyCount }: MlAccountInfoBoxProps) {
  return (
    <View className="gap-1 rounded-md border border-border bg-background p-sm">
      <Text className="text-xs uppercase tracking-[0.4px] text-textMuted">{label}</Text>
      <Text className="text-sm font-semibold text-text">{userId}</Text>
      <Text className="text-[13px] text-textMuted">History: {historyCount} entries</Text>
    </View>
  );
}
