'use client';

import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useHover,
  useFocus,
  useDismiss,
  useRole,
  useInteractions,
  FloatingPortal,
  safePolygon,
} from '@floating-ui/react';
import { useState, ReactNode, isValidElement, cloneElement } from 'react';

export function Tooltip({
  children,
  content,
  side = 'top',
}: {
  children: ReactNode;
  content: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
}) {
  const [open, setOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: side,
    middleware: [offset(6), flip(), shift({ padding: 4 })],
    whileElementsMounted: autoUpdate,
  });

  const hover = useHover(context, { move: false, handleClose: safePolygon() });
  const focus = useFocus(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'tooltip' });
  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    dismiss,
    role,
  ]);

  return (
    <>
      {isValidElement(children) &&
        cloneElement(children as any, {
          ref: refs.setReference,
          ...getReferenceProps(),
        })}
      {open && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className="
              z-50 px-2 py-1 rounded-md
              bg-slate-900 dark:bg-slate-700
              text-white text-caption
              shadow-dropdown
              pointer-events-none
            "
          >
            {content}
          </div>
        </FloatingPortal>
      )}
    </>
  );
}