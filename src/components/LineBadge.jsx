import { cn } from "@/lib/utils";
import { isNightLine } from "@/lib/lineUtils";

const SIZES = {
  sm: "min-w-[22px] px-1 py-0.5 text-[9.5px]",
  md: "min-w-[28px] px-1.5 py-1 text-[11px]",
  lg: "min-w-[34px] px-2 py-1 text-[13px]",
};

export default function LineBadge({ line, number, night, size = "md", className }) {
  const value = number ?? line?.number ?? "—";
  const isNight = night ?? isNightLine(line);

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-[3px] border border-black font-mono font-bold leading-none tracking-tight",
        isNight ? "bg-black text-white" : "bg-white text-black",
        SIZES[size] || SIZES.md,
        className
      )}
    >
      {value}
    </span>
  );
}
