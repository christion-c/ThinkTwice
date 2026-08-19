import type { ReactNode } from "react";
import { Text } from "react-native";

// The muted 15px body-copy style used inside cards for descriptive lines
// (account details, budget line items, forecast summaries, etc.).
interface CardTextProps {
  children: ReactNode;
  // Some screens (finance.tsx, nutrition.tsx) use a slightly tighter
  // 21px line height instead of the more common 22px - both predate this
  // component, so this preserves the split rather than forcing one value.
  tight?: boolean;
  className?: string;
}

export default function CardText({ children, tight = false, className = "" }: CardTextProps) {
  // Pick the line-height variant for this instance.
  const leadingClass = tight ? "leading-[21px]" : "leading-[22px]";

  return <Text className={`text-[15px] text-textMuted ${leadingClass} ${className}`}>{children}</Text>;
}
