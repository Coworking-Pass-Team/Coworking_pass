'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

/** Row selection for a bookings list. `ids` are the ids currently shown; selections that disappear from the list are dropped. */
export function useBookingSelection(ids: string[]) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const idsKey = ids.join('|');

  useEffect(() => {
    setSelected((prev) => {
      const visible = new Set(idsKey ? idsKey.split('|') : []);
      const next = new Set(Array.from(prev).filter((id) => visible.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [idsKey]);

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const allSelected = ids.length > 0 && ids.every((id) => selected.has(id));
  const someSelected = selected.size > 0 && !allSelected;

  const toggleAll = useCallback(() => {
    setSelected(allSelected ? new Set() : new Set(ids));
  }, [allSelected, idsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const clear = useCallback(() => setSelected(new Set()), []);

  return useMemo(
    () => ({ selected, ids: Array.from(selected), count: selected.size, toggle, toggleAll, clear, allSelected, someSelected, isSelected: (id: string) => selected.has(id) }),
    [selected, toggle, toggleAll, clear, allSelected, someSelected]
  );
}
