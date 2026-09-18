'use client';

import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useClick,
  useDismiss,
  useRole,
  useInteractions,
  FloatingFocusManager,
} from '@floating-ui/react';
import { useState, ReactNode, isValidElement, cloneElement } from 'react';

export function Dropdown({
  trigger,
  children,
  align = 'end',
}: {
  trigger: ReactNode;
  children: ReactNode;
  align?: 'start' | 'end';
}) {
  const [open, setOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: align === 'end' ? 'bottom-end' : 'bottom-start',
    middleware: [offset(8), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context);
  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
    role,
  ]);

  return (
    <>
      {isValidElement(trigger) &&
        cloneElement(trigger as any, {
          ref: refs.setReference,
          ...getReferenceProps(),
        })}
      {open && (
        <FloatingFocusManager context={context} modal={false}>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className="
              z-50 min-w-[180px]
              bg-white dark:bg-slate-900
              border border-slate-200 dark:border-slate-800
              rounded-card shadow-dropdown
              py-1
            "
          >
            {children}
          </div>
        </FloatingFocusManager>
      )}
    </>
  );
}

export function DropdownItem({
  children,
  onClick,
  icon,
  danger = false,
  disabled = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  icon?: ReactNode;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full flex items-center gap-2 px-3 py-2 text-bodySm text-left
        transition-colors
        ${
          danger
            ? 'text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-700/10'
            : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
        }
        disabled:text-slate-400 disabled:hover:bg-transparent disabled:cursor-not-allowed
      `}
    >
      {icon && <span className="w-4 h-4 flex-shrink-0">{icon}</span>}
      {children}
    </button>
  );
}

export function DropdownDivider() {
  return <div className="my-1 border-t border-slate-200 dark:border-slate-800" />;
}