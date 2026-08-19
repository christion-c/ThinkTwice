import type { ReactNode } from "react";
import { View } from "react-native";
import type { ViewProps } from "react-native";

// The bordered/rounded/padded surface container used by nearly every
// screen in the app (card sections, form panels, status panels, etc.).
interface CardProps extends Pick<ViewProps, "style"> {
  children: ReactNode;
  // Space between this card's own children. "sm" is the more common case;
  // "xs" is used by the smaller status/alert-style cards.
  gap?: "xs" | "sm" | "md";
  // Inner padding. "lg" is the more common case; "md" is used by denser panels.
  padding?: "md" | "lg";
  // Escape hatch for one-off additions (a status border color, active:
  // press feedback, etc.) without needing a new prop for every case.
  className?: string;
}

export default function Card({ children, gap = "sm", padding = "lg", className = "", style }: CardProps) {
  const gapClass = gap === "md" ? "gap-md" : gap === "xs" ? "gap-xs" : "gap-sm";
  const paddingClass = padding === "md" ? "p-md" : "p-lg";
  const baseClass = "rounded-lg border border-border bg-surface";

  return (
    <View style={style} className={`${baseClass} ${gapClass} ${paddingClass} ${className}`}>
      {children}
    </View>
  );
}
