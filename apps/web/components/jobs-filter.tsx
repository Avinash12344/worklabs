'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LocationPicker, LocationValue } from './location-picker';

export function JobsFilter() {
  const router = useRouter();
  const [locationData, setLocationData] = useState<LocationValue | null>(null);
  const [radiusKm, setRadiusKm] = useState('50');

  function applyFilter() {
    if (!locationData) {
      router.push('/jobs');
      return;
    }
    const params = new URLSearchParams({
      lat: locationData.latitude.toString(),
      lng: locationData.longitude.toString(),
      radius_km: radiusKm,
    });
    router.push(`/jobs?${params.toString()}`);
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border border-slate-200 flex gap-3 items-end">
      <div className="flex-1">
        <label className="block text-xs font-medium text-slate-600 mb-1">
          Near
        </label>
        <LocationPicker
          value={locationData?.location ?? ''}
          onChange={setLocationData}
          placeholder="Filter by location…"
        />
      </div>
      <div className="w-24">
        <label className="block text-xs font-medium text-slate-600 mb-1">
          Within (km)
        </label>
        <input
          type="number"
          min="1"
          max="500"
          value={radiusKm}
          onChange={(e) => setRadiusKm(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-md"
        />
      </div>
      <button
        onClick={applyFilter}
        className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-700 text-sm"
      >
        Apply
      </button>
    </div>
  );
}