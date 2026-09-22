'use client';

import Link from 'next/link';
import { ArrowRight, Building2, Presentation, Clapperboard } from 'lucide-react';
import { useApp } from '@/app/store';
import { SpaceCategory } from '@/types/types';

interface LandingCategoryCardProps {
  category: SpaceCategory;
  title: string;
  count: number;
  description: string;
}

export default function LandingCategoryCard({
  category,
  title,
  count,
  description,
}: LandingCategoryCardProps) {
  const { navigate } = useApp();

  const handleClick = () => {
    if (typeof navigate === 'function') {
      navigate('browse', { category });
    }
  };

  const getIcon = () => {
    switch (category) {
      case 'office':
        return (
          <div className="w-12 h-12 rounded-2xl bg-soot text-plaster flex items-center justify-center mb-5 shadow-xs group-hover:bg-moss transition-colors">
            <Building2 size={24} />
          </div>
        );
      case 'hall':
        return (
          <div className="w-12 h-12 rounded-2xl bg-[#E5ECE9] text-soot border border-eucalyptus/40 flex items-center justify-center mb-5 shadow-xs group-hover:bg-eucalyptus transition-colors">
            <Presentation size={24} className="text-moss" />
          </div>
        );
      case 'theater':
        return (
          <div className="w-12 h-12 rounded-2xl bg-soot/10 text-soot flex items-center justify-center mb-5 shadow-xs group-hover:bg-soot group-hover:text-plaster transition-colors">
            <Clapperboard size={24} />
          </div>
        );
    }
  };

  return (
    <Link
      href={`/spaces?category=${category}`}
      onClick={handleClick}
      className="p-6 rounded-3xl bg-plaster-surface border border-soot/12 shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-eucalyptus"
      aria-label={`Browse ${title} (${count} available)`}
    >
      <div>
        {getIcon()}
        <div className="flex items-center justify-between mb-1.5">
          <h3 className="text-xl font-semibold text-soot font-serif-display">{title}</h3>
          <span className="text-xs font-bold text-moss bg-plaster-dark/60 px-2.5 py-0.5 rounded-full">
            {count} Available
          </span>
        </div>
        <p className="text-xs text-moss leading-relaxed mb-4">
          {description}
        </p>
      </div>
      <div className="flex items-center gap-1.5 text-xs font-semibold text-soot group-hover:text-emerald-900 transition-colors pt-3 border-t border-soot/8">
        <span>Browse {title}</span>
        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  );
}
