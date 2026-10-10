import { Pressable, Text, View } from "react-native";

// One row in a Finance card's list (a bill, debt, asset, or paycheck):
// title with an optional tag and subtitle, and the amount on the right.
// Tappable when onPress is given.
export default function ItemRow({
  title,
  subtitle,
  value,
  tag,
  bold = false,
  onPress,
}: {
  title: string;
  subtitle?: string;
  value: string;
  tag?: string;
  bold?: boolean;
  onPress?: () => void;
}) {
  const content = (
    <View className="flex-row items-center gap-sm border-b border-border py-2.5">
      <View className="flex-1 gap-0.5">
        <View className="flex-row items-center gap-xs">
          <Text numberOfLines={1} className={`shrink text-body text-text ${bold ? "font-bold" : "font-semibold"}`}>
            {title}
          </Text>
          {tag ? (
            <View className="rounded-round bg-surfaceSoft px-2 py-0.5">
              <Text className="text-[10px] font-bold uppercase tracking-[0.4px] text-textMuted">{tag}</Text>
            </View>
          ) : null}
        </View>
        {subtitle ? <Text className="text-xs text-textMuted">{subtitle}</Text> : null}
      </View>
      <Text className={`text-body text-text ${bold ? "font-bold" : "font-semibold"}`}>{value}</Text>
    </View>
  );

  return onPress ? (
    <Pressable onPress={onPress} className="active:opacity-60">
      {content}
    </Pressable>
  ) : (
    content
  );
}
