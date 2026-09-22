'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useApp } from '@/app/store';

export default function LandingViewAllButton({ isMobile = false }: { isMobile?: boolean }) {
  const { navigate } = useApp();

  const handleClick = () => {
    if (typeof navigate === 'function') {
      navigate('browse');
    }
  };

  if (isMobile) {
    return (
      <Link
        href="/spaces"
        onClick={handleClick}
        className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl border border-soot/15 bg-plaster-surface text-soot font-medium text-sm hover:bg-plaster-dark/30 transition-colors"
      >
        View all spaces
      </Link>
    );
  }

  return (
    <Link
      href="/spaces"
      onClick={handleClick}
      className="hidden sm:flex items-center gap-2 text-sm font-medium text-soot hover:text-moss focus-visible:ring-2 focus-visible:ring-eucalyptus rounded-lg px-2 py-1 transition-colors duration-200"
    >
      View all <ArrowRight size={15} />
    </Link>
  );
}
