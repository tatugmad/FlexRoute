type LabelChipProps = {
  name: string;
  color: string;
};

export function LabelChip({ name, color }: LabelChipProps) {
  return (
    <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full">
      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
      {name}
    </span>
  );
}
