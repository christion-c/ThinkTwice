import type { ReactNode } from "react";
import { Text } from "react-native";

// The bold section-heading style used at the top of nearly every Card
// across the app (e.g. "Forecast", "Vehicle", "Budget Snapshot").
interface CardTitleProps {
  children: ReactNode;
  // Escape hatch for the rare case a title needs extra spacing/margin.
  className?: string;
}

export default function CardTitle({ children, className = "" }: CardTitleProps) {
  // text-xl font-bold text-text is the exact style every card title used
  // before this component existed - kept identical on purpose.
  return <Text className={`text-xl font-bold text-text ${className}`}>{children}</Text>;
}
