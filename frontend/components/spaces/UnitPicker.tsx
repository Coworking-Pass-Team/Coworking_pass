'use client';

import React, { useEffect, useState } from 'react';
import { DoorOpen } from 'lucide-react';
import { useApp } from '@/app/store';
import { useI18n } from '@/i18n';
import { timeStringToMinutes, type Space, type SpaceUnitAvailability } from '@/types/types';

const hhmmToMinutes = (value: string) => {
  const [h, m] = value.split(':').map((n) => parseInt(n, 10) || 0);
  return h * 60 + m;
};

/** True when the hall already has a booking overlapping the given 12h session (e.g. "09:00 AM" – "11:00 AM"). */
export function isUnitSlotBooked(unit: SpaceUnitAvailability | undefined, start: string, end: string): boolean {
  if (!unit) return false;
  const s = timeStringToMinutes(start);
  const e = timeStringToMinutes(end);
  return unit.booked.some((b) => s < hhmmToMinutes(b.endTime) && e > hhmmToMinutes(b.startTime));
}

/**
 * Loads the halls / theaters of a workspace with the sessions booked on `date` for each one.
 * Falls back to the units stored on the space when the server cannot be reached.
 */
export function useUnitAvailability(space: Space | null | undefined, date: string, enabled: boolean, refreshKey: number = 0) {
  const { fetchUnitAvailability } = useApp();
  const [units, setUnits] = useState<SpaceUnitAvailability[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!space || !enabled) {
      setUnits([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchUnitAvailability(space.id, date).then((result) => {
      if (cancelled) return;
      setUnits(result ?? (space.units || []).map((u) => ({ ...u, booked: [] })));
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [space?.id, date, enabled, refreshKey]);

  return { units, loading };
}

interface UnitPickerProps {
  units: SpaceUnitAvailability[];
  selectedId: string;
  onSelect: (id: string) => void;
}

/** Radio-card selector for the specific hall or theater being booked, showing each one's maximum seats. */
export default function UnitPicker({ units, selectedId, onSelect }: UnitPickerProps) {
  const { t } = useI18n();
  if (units.length === 0) return null;
  return (
    <div className="space-y-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-moss block">
        {t('units.selectRoom')}
      </span>
      <div className="grid grid-cols-1 gap-1.5">
        {units.map((unit) => {
          const selected = unit.id === selectedId;
          return (
            <button
              key={unit.id}
              type="button"
              onClick={() => onSelect(unit.id)}
              aria-pressed={selected}
              className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border text-start transition-all cursor-pointer ${
                selected ? 'bg-soot text-plaster border-soot shadow-2xs' : 'bg-white border-soot/10 text-soot hover:border-soot/30'
              }`}
            >
              <span className="flex items-center gap-2 min-w-0">
                <DoorOpen size={14} className={selected ? 'text-eucalyptus' : 'text-moss'} />
                <span className="text-xs font-semibold truncate">{unit.name}</span>
              </span>
              <span className={`text-[11px] font-medium shrink-0 ${selected ? 'text-plaster/80' : 'text-moss'}`}>
                {t('units.maxSeats', { count: unit.capacity })}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
