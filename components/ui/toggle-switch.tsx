"use client";

type ToggleSwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
};

export function ToggleSwitch({
  checked,
  onChange,
  label,
  disabled = false,
  className = "",
}: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`group inline-flex items-center gap-3 ${disabled ? "cursor-not-allowed opacity-55" : ""} ${className}`}
    >
      {label ? <span className="text-sm text-[var(--text-muted)]">{label}</span> : null}

      <span
        className={`relative inline-flex h-6 w-11 items-center rounded-full border transition-all duration-300 ease-out ${
          checked
            ? "border-[var(--olive)] bg-[var(--olive)] shadow-[0_0_0_1px_rgb(107_125_94_/_0.2),0_4px_10px_rgb(107_125_94_/_0.28)]"
            : "border-[var(--border-soft)] bg-[#E5E0D8]"
        } ${disabled ? "" : "group-hover:brightness-[1.03] group-active:scale-[0.98]"} group-focus-visible:outline-none group-focus-visible:ring-2 group-focus-visible:ring-[rgb(107_125_94_/_0.35)] group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-[var(--panel)]`}
      >
        <span
          className={`absolute left-0.5 h-5 w-5 rounded-full bg-white shadow-[0_2px_6px_rgb(46_46_46_/_0.2)] transition-transform duration-300 ease-out ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </span>
    </button>
  );
}
