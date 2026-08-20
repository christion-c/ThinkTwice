import StatTile from "../ui/StatTile";

interface MlMetricBoxProps {
  label: string;
  value: string;
}

// One label/value tile in a metric grid (e.g. "Projected fuel cost" / "$64.20").
export default function MlMetricBox({ label, value }: MlMetricBoxProps) {
  return (
    <StatTile
      label={label}
      value={value}
      className="flex-1 gap-1 rounded-md border border-border p-sm"
      labelClassName="text-xs uppercase tracking-[0.4px] text-textMuted"
      valueClassName="text-base font-bold text-text"
    />
  );
}
