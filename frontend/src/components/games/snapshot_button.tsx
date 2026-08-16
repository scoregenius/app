// frontend/src/components/games/snapshot_button.tsx
import React from "react";
import { BarChart3 } from "lucide-react";
import clsx from "clsx";

export interface SnapshotButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isDisabled?: boolean;
  tooltipText?: string;
  label?: string;
}

const SnapshotButton: React.FC<SnapshotButtonProps> = ({
  onClick,
  isDisabled = false,
  tooltipText = "View Snapshot",
  className = "",
  label = "H2H Stats",
  ...rest
}) => {
  /* Stops the press reaching the card, which would toggle it as well as
   * opening the modal. Belt and braces with the card's data-action check. */
  const handleMouseDown: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    e.stopPropagation();
  };

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    onClick?.(e);
  };

  return (
    <button
      type="button"
      {...rest}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      disabled={isDisabled}
      data-tour="snapshot-button"
      title={tooltipText}
      aria-label={tooltipText}
      className={clsx(
        "gc-chip",
        isDisabled && "opacity-50 cursor-not-allowed pointer-events-none",
        className
      )}
    >
      <BarChart3 size={13} strokeWidth={1.8} aria-hidden="true" />
      {label}
    </button>
  );
};

export default SnapshotButton;
