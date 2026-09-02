'use client';

import { Lock, ArrowRight } from 'lucide-react';
import { useApp } from '@/app/store';
import { DashboardLayout } from '@/app/app';
import ProfileSettings from '@/app/individual/ProfileSettings';
import OrgProfile from '@/app/organization/OrgProfile';
import ProviderProfileSettings from '@/app/provider/ProfileSettings';
import AdminSettings from '@/app/admin/AdminSettings';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function ProfilePage() {
  const { currentUser, navigate } = useApp();

  if (!currentUser) {
    return (
      <div className="min-h-screen flex flex-col bg-plaster text-soot">
        <Navbar />

        <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 my-auto">
          <div className="w-full max-w-md bg-plaster-surface rounded-3xl border border-soot/12 p-8 sm:p-10 shadow-xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-eucalyptus/25 text-soot flex items-center justify-center mx-auto mb-5 shadow-xs">
              <Lock size={22} className="text-soot" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-normal font-serif-display text-soot tracking-tight mb-2">
              Authentication Required
            </h1>
            <p className="text-moss text-xs sm:text-sm leading-relaxed mb-8 max-w-xs mx-auto">
              You must be logged in to view and manage your profile, team settings, and workspace passes.
            </p>

            <button
              type="button"
              onClick={() => navigate('login')}
              className="btn-primary w-full"
            >
              <span>Sign In to Continue</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  return (
    <DashboardLayout>
      {currentUser.role === 'admin' && <AdminSettings />}
      {currentUser.role === 'organization' && <OrgProfile />}
      {currentUser.role === 'provider' && <ProviderProfileSettings />}
      {(currentUser.role === 'individual' || !currentUser.role) && (
        <ProfileSettings mode="profile" />
      )}
    </DashboardLayout>
  );
}
