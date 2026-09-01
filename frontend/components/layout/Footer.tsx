'use client';
import LogoImage from './logo';
import { useApp } from '@/app/store';

export default function Footer() {
  const { navigate } = useApp();

  return (
    <footer className="bg-plaster-dark py-10 border-t border-soot/8 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-eucalyptus flex items-center justify-center">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="2" width="5" height="5" rx="1" fill="#2D3536" />
              <rect x="9" y="2" width="5" height="5" rx="1" fill="#2D3536" opacity="0.5" />
              <rect x="2" y="9" width="5" height="5" rx="1" fill="#2D3536" opacity="0.5" />
              <rect x="9" y="9" width="5" height="5" rx="1" fill="#2D3536" />
            </svg>
          </div>
          <button onClick={() => navigate('landing')} className="flex items-center gap-2">
            <LogoImage className="w-6 h-6 rounded-md" />
            <span className="font-semibold text-soot text-sm">
              Coworking Pass
            </span>
          </button>
        </div>
        <p className="text-moss text-sm">© 2025 Coworking Pass. All rights reserved.</p>
        <div className="flex gap-4 text-sm text-moss">
          <button className="hover:text-soot transition-colors">Privacy</button>
          <button className="hover:text-soot transition-colors">Terms</button>
          <button onClick={() => navigate('contact')} className="hover:text-soot transition-colors">Contact</button>
        </div>
      </div>
    </footer>
  );
}
