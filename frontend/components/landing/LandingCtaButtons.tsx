'use client';

import Link from 'next/link';
import { useApp } from '@/app/store';

export default function LandingCtaButtons() {
  const { navigate } = useApp();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 relative z-20">
      <Link
        href="/Auth"
        onClick={() => {
          if (typeof navigate === 'function') navigate('signup');
        }}
        className="btn-primary w-full sm:w-auto px-8 py-3.5 text-center inline-flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-eucalyptus"
      >
        Get started free
      </Link>
      <Link
        href="/spaces"
        onClick={() => {
          if (typeof navigate === 'function') navigate('browse');
        }}
        className="btn-secondary !bg-plaster !text-soot hover:!bg-plaster w-full sm:w-auto px-8 py-3.5 inline-flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-eucalyptus"
      >
        Browse spaces
      </Link>
    </div>
  );
}
