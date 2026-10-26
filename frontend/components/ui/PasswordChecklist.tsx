'use client';

import { Check, X } from 'lucide-react';
import { useI18n } from '@/i18n';
import { PASSWORD_RULES, passwordRuleStatus } from '@/lib/passwordPolicy';

/** Live list of password rules: each starts red and turns green as the password meets it. */
export default function PasswordChecklist({ password }: { password: string }) {
  const { t } = useI18n();
  const status = passwordRuleStatus(password);
  return (
    <ul className="mt-2 space-y-1" aria-label={t('auth.pwRulesTitle')} data-testid="password-checklist">
      {PASSWORD_RULES.map((rule) => {
        const ok = status[rule];
        return (
          <li key={rule} data-rule={rule} data-met={ok} className={`flex items-center gap-1.5 text-xs font-medium ${ok ? 'text-green-600' : 'text-red-500'}`}>
            {ok ? <Check size={13} aria-hidden /> : <X size={13} aria-hidden />}
            <span>{t(`auth.pwRule_${rule}`)}</span>
          </li>
        );
      })}
    </ul>
  );
}
