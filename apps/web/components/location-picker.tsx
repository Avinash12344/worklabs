'use client';

import dynamic from 'next/dynamic';
import type { LocationValue } from './location-picker-inner';

export type { LocationValue };

const LocationPickerInner = dynamic(
  () => import('./location-picker-inner'),
  {
    ssr: false,
    loading: () => (
      <input
        type="text"
        placeholder="Loading map…"
        disabled
        className="w-full px-3 py-2 border border-slate-300 rounded-md bg-slate-50"
      />
    ),
  }
);

type Props = {
  value: string;
  onChange: (value: LocationValue | null) => void;
  placeholder?: string;
};

export function LocationPicker(props: Props) {
  return <LocationPickerInner {...props} />;
}