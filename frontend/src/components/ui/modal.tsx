// frontend/src/components/ui/modal.tsx
import React, { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import clsx from "clsx";

export interface ModalProps {
  /** Fires on Escape, on the close control, and on a backdrop press. */
  onClose: () => void;
  /** Sentence case. Names the modal for assistive technology. */
  title: string;
  /** Mono micro-label under the title — context, not a second sentence. */
  subtitle?: string;
  /**
   * Full-bleed band between the header and the body, for content that
   * should not take the body's padding. The snapshot's matchup rows use
   * it.
   */
  banner?: React.ReactNode;
  /** Drops the body's padding, for content that manages its own. */
  bodyFlush?: boolean;
  children: React.ReactNode;
}

/**
 * The shared modal shell. See docs/design_system.md §6.7.
 *
 * There is deliberately no `isOpen` prop: mounted means open, so the
 * caller writes `{open && <Modal …>}`. The three modals it replaces all
 * took `isOpen` and returned null when closed, which meant they were
 * mounted on every card at all times — and, because each was also a
 * `lazy()` import, that React had to fetch all three chunks before it
 * could call them and discover there was nothing to draw. Gating the
 * element instead restores the lazy loading and lets the modal unmount.
 *
 * Owns everything §6.7 asks for: portal, backdrop, panel, 44px close
 * target, Escape, focus trap, focus restoration and the body scroll
 * lock. Before this each of the three implemented a different subset,
 * and none of them trapped focus.
 *
 * There is deliberately no `className` escape hatch either. Component
 * blocks in this stylesheet are emitted after the utilities layer, so at
 * equal specificity a class here beats a utility passed at the call site
 * — the mechanism behind defects 24 and 26. Variants are modifier props,
 * not classes the caller layers on and hopes will win.
 */

/* Body scroll lock. Counted rather than a boolean so two modals open at
 * once cannot have the first one to close unlock the page underneath
 * the second — and so React's StrictMode double-invoked effects balance
 * out instead of leaving the page permanently locked. */
let lockCount = 0;
let savedOverflow = "";
let savedPaddingRight = "";

const lockBodyScroll = (): void => {
  if (lockCount++ > 0) return;
  const { body } = document;
  savedOverflow = body.style.overflow;
  savedPaddingRight = body.style.paddingRight;
  /* Hiding the overflow removes the scrollbar, which widens the page and
   * makes the whole layout jump sideways as the modal opens. Hold the
   * width with padding. */
  const gutter = window.innerWidth - document.documentElement.clientWidth;
  if (gutter > 0) body.style.paddingRight = `${gutter}px`;
  body.style.overflow = "hidden";
};

const unlockBodyScroll = (): void => {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount > 0) return;
  document.body.style.overflow = savedOverflow;
  document.body.style.paddingRight = savedPaddingRight;
};

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "details > summary",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

const Modal: React.FC<ModalProps> = ({
  onClose,
  title,
  subtitle,
  banner,
  bodyFlush,
  children,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  /* Where the press came from. Restored on close so a keyboard user is
   * put back on the chip they opened, not at the top of the document. */
  const openerRef = useRef<Element | null>(null);
  /* Guards the backdrop press: a drag that starts inside the panel and
   * releases on the backdrop is a text selection, not a dismissal. */
  const pressedBackdrop = useRef(false);
  /* Read inside a listener that is bound once, so it must not close over
   * a stale prop. */
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const titleId = useId();

  useEffect(() => {
    openerRef.current = document.activeElement;
    lockBodyScroll();
    /* Focus has to enter the dialog or the trap has nothing to hold and
     * Tab walks the page behind it, which is what all three modals did. */
    closeRef.current?.focus();

    /* Bound to the document rather than the backdrop element. Clicking a
     * non-focusable run of text inside the panel moves focus to <body>,
     * which is outside the backdrop — so a handler on the element stops
     * receiving keys exactly when a reader has been reading. The trap
     * below puts focus back on the next Tab either way. */
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;

      const nodes = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE)
      ).filter(
        (el) => el.offsetParent !== null || el === document.activeElement
      );

      if (nodes.length === 0) {
        e.preventDefault();
        return;
      }

      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;
      const inside = panel.contains(active);

      if (!inside) {
        /* Focus has escaped — to <body> after a click, or to the browser
         * chrome. Pull it back to the appropriate end. */
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);

    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      unlockBodyScroll();
      const opener = openerRef.current;
      if (opener instanceof HTMLElement && document.contains(opener)) {
        opener.focus();
      }
    };
  }, []);

  return createPortal(
    <div
      className="sgm-backdrop"
      onMouseDown={(e) => {
        pressedBackdrop.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && pressedBackdrop.current) onClose();
        pressedBackdrop.current = false;
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="sgm"
      >
        <div className="sgm-head">
          <div className="min-w-0">
            <h2 id={titleId} className="sgm-title">
              {title}
            </h2>
            {subtitle && <p className="sgm-sub">{subtitle}</p>}
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={`Close ${title.toLowerCase()}`}
            className="sgm-x"
          >
            <X size={16} strokeWidth={1.8} aria-hidden="true" />
          </button>
        </div>

        {banner}

        <div className={clsx("sgm-body", bodyFlush && "sgm-body--flush")}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;
