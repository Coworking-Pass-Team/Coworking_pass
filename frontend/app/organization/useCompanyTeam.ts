'use client';

import { useMemo } from 'react';
import { useApp } from '@/app/store';
import type { Employee } from '@/types/types';

/**
 * The company team as stored on the server (users whose companyId is the company), for the HR admin.
 * Department labels kept in the HR admin's browser are merged in; browser-only entries that never joined
 * on the server are not counted as members.
 */
export function useCompanyTeam() {
  const { currentUser, companyData } = useApp();

  return useMemo(() => {
    const serverMembers: Array<{ id: string; name?: string; email?: string }> = Array.isArray(companyData?.employees)
      ? companyData.employees
      : [];
    const loaded = Array.isArray(companyData?.employees);
    const adminId = companyData?.hrAdminId || currentUser?.id;
    const adminEmail = (currentUser?.email || '').toLowerCase();
    const labels = new Map((currentUser?.employees || []).map((e: Employee) => [(e.email || '').toLowerCase(), e]));

    const employees: Employee[] = serverMembers
      .filter((m) => m.id !== adminId && (m.email || '').toLowerCase() !== adminEmail)
      .map((m) => {
        const label = labels.get((m.email || '').toLowerCase());
        return { id: m.id, name: m.name || m.email || '', email: m.email || '', department: label?.department || '' };
      });

    // Until the server list arrives, fall back to the HR admin's own list so the screen is not empty
    const fallback = loaded ? employees : (currentUser?.employees || []);
    return {
      employees: fallback,
      /** Everyone in the team, the HR admin included (matches the team page) */
      totalMembers: fallback.length + 1,
      loaded,
    };
  }, [companyData, currentUser]);
}
