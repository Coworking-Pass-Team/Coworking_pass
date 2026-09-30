'use client';

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useI18n } from '@/i18n';
import type { SpaceUnit } from '@/types/types';

interface UnitsEditorProps {
  units: SpaceUnit[];
  kind: 'hall' | 'theater';
  onChange: (units: SpaceUnit[]) => void;
}

/**
 * Editor for the individual halls / theaters of a workspace: how many there are and the seating capacity of each.
 * Used by the provider and admin space forms; the list is persisted as WorkspaceSections.
 */
export default function UnitsEditor({ units, kind, onChange }: UnitsEditorProps) {
  const { t } = useI18n();
  const label = kind === 'theater' ? t('units.theater') : t('units.hall');
  const total = units.reduce((sum, u) => sum + (Number(u.capacity) || 0), 0);

  const setCount = (count: number) => {
    const next = Math.min(50, Math.max(1, count || 1));
    if (next === units.length) return;
    if (next < units.length) {
      onChange(units.slice(0, next));
      return;
    }
    const extra: SpaceUnit[] = Array.from({ length: next - units.length }, (_, i) => ({
      id: `new-${Date.now()}-${i}`,
      name: `${label} ${units.length + i + 1}`,
      capacity: units[units.length - 1]?.capacity || 20,
    }));
    onChange([...units, ...extra]);
  };

  const update = (index: number, patch: Partial<SpaceUnit>) =>
    onChange(units.map((u, i) => (i === index ? { ...u, ...patch } : u)));

  return (
    <div className="space-y-3 rounded-2xl border border-soot/12 bg-plaster-dark/20 p-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-moss block">
            {kind === 'theater' ? t('units.theatersTitle') : t('units.hallsTitle')}
          </span>
          <span className="text-[11px] text-moss">{t('units.help')}</span>
        </div>
        <label className="flex items-center gap-2 text-xs font-semibold text-soot">
          <span>{kind === 'theater' ? t('units.countTheaters') : t('units.countHalls')}</span>
          <input
            type="number"
            min={1}
            max={50}
            value={units.length}
            onChange={(e) => setCount(parseInt(e.target.value, 10))}
            className="w-20 px-2.5 py-1.5 rounded-lg border border-soot/12 bg-white text-soot text-sm outline-none focus:border-eucalyptus"
          />
        </label>
      </div>

      <div className="space-y-2">
        {units.map((unit, index) => (
          <div key={unit.id} className="grid grid-cols-[1fr_120px_auto] gap-2 items-end">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-moss mb-1">{t('units.name')}</label>
              <input
                type="text"
                value={unit.name}
                onChange={(e) => update(index, { name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-soot/12 bg-white text-soot text-sm outline-none focus:border-eucalyptus"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-moss mb-1">{t('units.seats')}</label>
              <input
                type="number"
                min={1}
                value={unit.capacity}
                onChange={(e) => update(index, { capacity: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-3 py-2 rounded-xl border border-soot/12 bg-white text-soot text-sm outline-none focus:border-eucalyptus"
              />
            </div>
            <button
              type="button"
              disabled={units.length <= 1}
              onClick={() => onChange(units.filter((_, i) => i !== index))}
              title={t('units.remove')}
              className="p-2.5 rounded-xl text-rose-600 hover:bg-rose-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={() => setCount(units.length + 1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-soot hover:text-emerald-800 cursor-pointer"
        >
          <Plus size={14} />
          <span>{kind === 'theater' ? t('units.addTheater') : t('units.addHall')}</span>
        </button>
        <span className="text-xs font-semibold text-moss">{t('units.totalSeats', { count: total })}</span>
      </div>
    </div>
  );
}
