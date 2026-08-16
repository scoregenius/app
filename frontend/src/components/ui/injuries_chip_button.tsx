// frontend/src/components/ui/injuries_chip_button.tsx

import React from "react";
import { Bandage } from "lucide-react";

/**
 * Extends the button attributes so callers can pass through the things the
 * card relies on — notably `data-action`, which game_card's click handler
 * looks for to tell a chip press apart from a press on the card itself.
 * Previously only `onClick` was accepted, so `data-action` was dropped
 * before it reached the DOM and tapping this chip on mobile opened the
 * modal and toggled the card at the same time.
 */
export interface InjuriesChipButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

const InjuriesChipButton: React.FC<InjuriesChipButtonProps> = ({
  onClick,
  className = "",
  ...rest
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`gc-chip ${className}`}
      {...rest}
    >
      <Bandage size={13} strokeWidth={1.8} aria-hidden="true" />
      Injuries
    </button>
  );
};

export default InjuriesChipButton;
