"use client";

import { useEffect, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";

/** The cart's own ceiling — `merge` clamps to the same number. */
const MAX = 999;

const SIZES = {
  md: { button: "w-[32px] h-[32px]", field: "w-[40px] text-[14px]", icon: 14 },
  sm: { button: "w-[28px] h-[28px]", field: "w-[34px] text-[13px]", icon: 12 },
} as const;

/**
 * Quantity, as a stepper you can also type into.
 *
 * The typed value is held as a draft rather than written straight through:
 * clearing the box to type "12" passes through an empty string, and handing
 * that to `setQty` would delete the line out from under whoever is typing.
 * Nothing reaches the cart until the field is committed — blur, or Enter.
 */
export function QtyStepper({
  qty,
  onChange,
  label,
  size = "md",
  max = MAX,
}: {
  qty: number;
  /** Below 1 removes the line, matching what the minus button does at 1. */
  onChange: (qty: number) => void;
  /** The product name, for the controls' accessible labels. */
  label: string;
  size?: keyof typeof SIZES;
  /**
   * Units available. Plus stops here and a typed number is clamped to it, so
   * the cart cannot ask for stock the shop does not have. Left at the cart's
   * own ceiling for products the shop does not count.
   */
  max?: number;
}) {
  const [draft, setDraft] = useState(String(qty));
  const editing = useRef(false);
  const { button, field, icon } = SIZES[size];
  // A line already over its stock still steps down; it just cannot step up.
  const ceiling = Math.max(0, Math.min(max, MAX));

  // Follow the cart when the change came from anywhere else — the buttons, the
  // other view of the same cart, another tab — but never overwrite live typing.
  useEffect(() => {
    if (!editing.current) setDraft(String(qty));
  }, [qty]);

  function commit() {
    editing.current = false;
    const next = Number.parseInt(draft, 10);

    // An empty or unreadable box is a change of mind, not a request to remove
    // the line — put back what is actually in the cart. Typing 0 is a request,
    // and goes through.
    if (!Number.isFinite(next)) {
      setDraft(String(qty));
      return;
    }

    const clamped = Math.min(Math.max(next, 0), Math.max(ceiling, 0));
    setDraft(String(clamped));
    if (clamped !== qty) onChange(clamped);
  }

  return (
    <div className="flex flex-row justify-start items-center gap-0 border border-dashed border-beige rounded-none w-fit">
      <button
        type="button"
        onClick={() => onChange(qty - 1)}
        aria-label={`Decrease quantity of ${label}`}
        className={`flex items-center justify-center ${button} rounded-none bg-transparent border-none cursor-pointer text-brown`}
      >
        <Minus size={icon} strokeWidth={1.5} />
      </button>

      {/* `text` with a numeric inputMode rather than `number`: it brings up the
          same keypad on a phone, without the spinner arrows or the scroll-wheel
          increments a number field adds inside a scrolling drawer. */}
      <input
        type="text"
        inputMode="numeric"
        value={draft}
        aria-label={`Quantity of ${label}`}
        maxLength={3}
        onFocus={(e) => {
          editing.current = true;
          e.currentTarget.select();
        }}
        onChange={(e) => {
          editing.current = true;
          setDraft(e.target.value.replace(/\D/g, ""));
        }}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            e.currentTarget.blur();
          } else if (e.key === "Escape") {
            editing.current = false;
            setDraft(String(qty));
            e.currentTarget.blur();
          }
        }}
        className={`${field} font-clash font-medium text-black text-center bg-transparent border-none outline-none p-0 rounded-none`}
      />

      <button
        type="button"
        onClick={() => onChange(qty + 1)}
        disabled={qty >= ceiling}
        aria-label={`Increase quantity of ${label}`}
        className={`flex items-center justify-center ${button} rounded-none bg-transparent border-none text-brown enabled:cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed`}
      >
        <Plus size={icon} strokeWidth={1.5} />
      </button>
    </div>
  );
}
