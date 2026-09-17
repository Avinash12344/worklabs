'use client';

import { SearchBox } from '@mapbox/search-js-react';

export type LocationValue = {
  location: string;
  latitude: number;
  longitude: number;
};

type Props = {
  value: string;
  onChange: (value: LocationValue | null) => void;
  placeholder?: string;
};

export default function LocationPickerInner({ value, onChange, placeholder }: Props) {
  return (
    <SearchBox
      accessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''}
      value={value}
      placeholder={placeholder ?? 'Start typing an address…'}
      onRetrieve={(res) => {
        const feature = res.features?.[0];
        if (!feature) {
          onChange(null);
          return;
        }
        const [lng, lat] = feature.geometry.coordinates;
        const name = feature.properties.name ?? feature.properties.full_address;
        onChange({ location: name, latitude: lat, longitude: lng });
      }}
      options={{
        country: 'in',
        language: 'en',
        proximity: 'ip',
      }}
    />
  );
}