'use client';
import { useApp } from '@/app/store';
import ProfileSettings from '@/app/individual/ProfileSettings';
import OrgProfile from '@/app/organization/OrgProfile';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function ProfilePage() {
  const { currentUser, navigate } = useApp();

  if (!currentUser) {
    return (
      <div className="min-h-screen flex flex-col bg-plaster">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <h1 className="text-2xl font-bold text-soot mb-2">Please sign in</h1>
          <p className="text-sm text-moss mb-4">You must be logged in to view your profile.</p>
          <button
            onClick={() => navigate('login')}
            className="px-6 py-2.5 rounded-xl bg-soot text-plaster font-semibold text-sm"
          >
            Sign In
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  if (currentUser.role === 'organization') {
    return <OrgProfile />;
  }

  return <ProfileSettings mode="profile" />;
}
