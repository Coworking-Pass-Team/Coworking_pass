'use client';

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useI18n } from '@/i18n';
import { isHourlyAllowed, type SpaceUnit } from '@/types/types';

interface UnitsEditorProps {
  units: SpaceUnit[];
  /** Kind preselected for a newly added room (follows the hub's main type) */
  defaultSubType: string;
  onChange: (units: SpaceUnit[]) => void;
}

const ROOM_KINDS = ['meeting-room', 'training-hall', 'event-hall', 'theater', 'shared-desk', 'private-office', 'hot-desk'] as const;

const dbTypeFor = (kind: string): SpaceUnit['type'] =>
  kind.includes('theater') ? 'THEATER' : kind.includes('hall') || kind.startsWith('meeting') ? 'MEETING_ROOM' : 'DESK';

const numOrNull = (value: string) => {
  const n = parseFloat(value);
  return value === '' || !Number.isFinite(n) || n < 0 ? null : n;
};

/**
 * "Facilities & Sections": the rooms of a workspace hub. Each room has its own name, kind, seating capacity and rates
 * (hourly for halls / theaters, daily / monthly / yearly for desks and offices). Persisted as WorkspaceSections.
 */
export default function UnitsEditor({ units, defaultSubType, onChange }: UnitsEditorProps) {
  const { t } = useI18n();
  const total = units.reduce((sum, u) => sum + (Number(u.capacity) || 0), 0);

  const addRoom = () => {
    const kind = (ROOM_KINDS as readonly string[]).includes(defaultSubType) ? defaultSubType : 'meeting-room';
    onChange([
      ...units,
      {
        id: 'new-' + Date.now() + '-' + units.length,
        name: t(('spaceTypes.' + kind) as never) + ' ' + (units.length + 1),
        type: dbTypeFor(kind),
        subType: kind,
        capacity: units[units.length - 1]?.capacity || 20,
        hourlyRate: null,
        dailyRate: null,
        monthlyRate: null,
        yearlyRate: null,
      },
    ]);
  };

  const update = (index: number, patch: Partial<SpaceUnit>) =>
    onChange(units.map((u, i) => (i === index ? { ...u, ...patch } : u)));

  const input = 'w-full px-3 py-2 rounded-xl border border-soot/12 bg-white text-soot text-sm outline-none focus:border-eucalyptus';
  const label = 'block text-[10px] font-semibold uppercase tracking-wider text-moss mb-1';

  return (
    <div className="space-y-3 rounded-2xl border border-soot/12 bg-plaster-dark/20 p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-moss block">{t('units.title')}</span>
          <span className="text-[11px] text-moss">{t('units.helpRooms')}</span>
        </div>
        <button
          type="button"
          onClick={addRoom}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-soot text-plaster text-xs font-semibold hover:bg-soot/85 cursor-pointer"
        >
          <Plus size={14} />
          <span>{t('units.addRoom')}</span>
        </button>
      </div>

      {units.length === 0 && <p className="text-xs text-moss">{t('units.empty')}</p>}

      <div className="space-y-3">
        {units.map((unit, index) => {
          const kind = unit.subType || (unit.type === 'THEATER' ? 'theater' : unit.type === 'MEETING_ROOM' ? 'meeting-room' : 'shared-desk');
          const hourly = isHourlyAllowed(kind);
          const fields: readonly (readonly [keyof SpaceUnit, string])[] = hourly
            ? [['hourlyRate', 'units.hourlyRate'], ['dailyRate', 'units.dailyRate']]
            : [['dailyRate', 'units.dailyRate'], ['monthlyRate', 'units.monthlyRate'], ['yearlyRate', 'units.yearlyRate']];
          return (
            <div key={unit.id} className="rounded-xl border border-soot/10 bg-white/70 p-3 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_170px_100px_auto] gap-2 items-end">
                <div>
                  <label className={label}>{t('units.name')}</label>
                  <input type="text" value={unit.name} onChange={(e) => update(index, { name: e.target.value })} className={input} />
                </div>
                <div>
                  <label className={label}>{t('units.kind')}</label>
                  <select
                    value={kind}
                    onChange={(e) => update(index, { subType: e.target.value, type: dbTypeFor(e.target.value) })}
                    className={input}
                  >
                    {ROOM_KINDS.map((k) => (
                      <option key={k} value={k}>{t(('spaceTypes.' + k) as never)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={label}>{t('units.seats')}</label>
                  <input
                    type="number"
                    min={1}
                    value={unit.capacity}
                    onChange={(e) => update(index, { capacity: parseInt(e.target.value, 10) || 0 })}
                    className={input}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => onChange(units.filter((_, i) => i !== index))}
                  title={t('units.remove')}
                  className="p-2.5 rounded-xl text-rose-600 hover:bg-rose-50 cursor-pointer justify-self-end"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <div className={'grid gap-2 ' + (hourly ? 'grid-cols-2' : 'grid-cols-3')}>
                {fields.map(([field, key]) => (
                  <div key={field}>
                    <label className={label}>{t(key as never)}</label>
                    <input
                      type="number"
                      min={0}
                      value={(unit[field] as number | null | undefined) ?? ''}
                      placeholder={t('units.hubRate')}
                      onChange={(e) => update(index, { [field]: numOrNull(e.target.value) } as Partial<SpaceUnit>)}
                      className={input}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {units.length > 0 && <div className="text-end text-xs font-semibold text-moss">{t('units.totalSeats', { count: total })}</div>}
    </div>
  );
}
