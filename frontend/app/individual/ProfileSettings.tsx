'use client';
import { useState } from 'react';
import { User, Settings, Bell, Shield, Camera } from 'lucide-react';
import { useApp } from '@/app/store';

export default function ProfileSettings({ mode }: { mode: 'profile' | 'settings' }) {
  const { currentUser, updateCurrentUser, navigate, nav } = useApp();
  if (!currentUser) return null;

  const [name, setName] = useState(currentUser.name);
  const [phone, setPhone] = useState(currentUser.phone);
  const [saved, setSaved] = useState(false);
  const [notifications, setNotifications] = useState({ bookings: true, promotions: false, updates: true, waitlist: true });
  const [privacy, setPrivacy] = useState({ profileVisible: true, showBookings: false });

  const activeMode = nav.screen === 'ind-settings' ? 'settings' : 'profile';

  const handleSave = () => {
    updateCurrentUser({ name, phone });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-4 mb-8">
        <h1 className="text-3xl text-soot" style={{ fontFamily: 'DM Serif Display, serif' }}>
          {activeMode === 'profile' ? 'Profile' : 'Settings'}
        </h1>
      </div>

      {nav.screen === 'ind-profile' && (
        <div className="space-y-6">
          {/* Avatar section */}
          <div className="bg-white rounded-2xl border border-soot/8 p-6">
            <h2 className="font-semibold text-soot mb-4">Personal information</h2>
            <div className="flex items-center gap-5 mb-6">
              <div className="relative">
                <img src={currentUser.avatar} alt={currentUser.name} className="w-18 h-18 rounded-full object-cover ring-4 ring-eucalyptus/20" style={{ width: 72, height: 72 }} />
                <button className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-eucalyptus flex items-center justify-center">
                  <Camera size={11} className="text-soot" />
                </button>
              </div>
              <div>
                <div className="font-semibold text-soot">{currentUser.name}</div>
                <div className="text-sm text-moss">{currentUser.email}</div>
                <div className="text-xs text-moss mt-0.5 capitalize">{currentUser.role} account</div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-moss mb-1.5">Full name</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-soot/12 bg-plaster text-soot text-sm outline-none focus:border-eucalyptus"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-moss mb-1.5">Email address</label>
                <input
                  value={currentUser.email}
                  disabled
                  className="w-full px-4 py-2.5 rounded-xl border border-soot/8 bg-soot/5 text-moss text-sm cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-moss mb-1.5">Phone number</label>
                <input
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-soot/12 bg-plaster text-soot text-sm outline-none focus:border-eucalyptus"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-moss mb-1.5">Member since</label>
                <div className="w-full px-4 py-2.5 rounded-xl border border-soot/8 bg-soot/5 text-moss text-sm">
                  {currentUser.joinDate}
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-3">
              <button
                onClick={handleSave}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${saved ? 'bg-eucalyptus text-soot' : 'bg-soot text-plaster hover:bg-soot-light'}`}
              >
                {saved ? '✓ Saved' : 'Save changes'}
              </button>
            </div>
          </div>

          {/* Account info */}
          <div className="bg-white rounded-2xl border border-soot/8 p-6">
            <h2 className="font-semibold text-soot mb-4">Account details</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-soot/5">
                <span className="text-sm text-moss">Account type</span>
                <span className="text-sm font-medium text-soot capitalize">{currentUser.role}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-soot/5">
                <span className="text-sm text-moss">Account status</span>
                <span className="text-sm font-medium text-moss bg-eucalyptus/15 px-2 py-0.5 rounded-full">Active</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-moss">Member since</span>
                <span className="text-sm font-medium text-soot">{currentUser.joinDate}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {nav.screen === 'ind-settings' && (
        <div className="space-y-6">
          {/* Notifications */}
          <div className="bg-white rounded-2xl border border-soot/8 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Bell size={16} className="text-moss" />
              <h2 className="font-semibold text-soot">Notifications</h2>
            </div>
            <div className="space-y-4">
              {[
                { key: 'bookings' as const, label: 'Booking confirmations', desc: 'Get notified about your bookings' },
                { key: 'waitlist' as const, label: 'Waitlist updates', desc: 'When a spot opens for spaces you\'re waiting for' },
                { key: 'updates' as const, label: 'Platform updates', desc: 'New features and improvements' },
                { key: 'promotions' as const, label: 'Promotions', desc: 'Special offers and discounts' },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-soot">{item.label}</div>
                    <div className="text-xs text-moss">{item.desc}</div>
                  </div>
                  <button
                    onClick={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                    className={`w-10 h-5.5 rounded-full transition-colors relative ${notifications[item.key] ? 'bg-eucalyptus' : 'bg-soot/15'}`}
                    style={{ width: 40, height: 22 }}
                  >
                    <div className={`absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-transform ${notifications[item.key] ? 'translate-x-5' : 'translate-x-0.5'}`}
                      style={{ width: 18, height: 18, top: 2, left: notifications[item.key] ? 20 : 2, position: 'absolute', transition: 'left 0.2s' }}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Privacy */}
          <div className="bg-white rounded-2xl border border-soot/8 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield size={16} className="text-moss" />
              <h2 className="font-semibold text-soot">Privacy</h2>
            </div>
            <div className="space-y-4">
              {[
                { key: 'profileVisible' as const, label: 'Profile visibility', desc: 'Make your profile visible to others' },
                { key: 'showBookings' as const, label: 'Show bookings', desc: 'Allow others to see your booked spaces' },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-soot">{item.label}</div>
                    <div className="text-xs text-moss">{item.desc}</div>
                  </div>
                  <button
                    onClick={() => setPrivacy(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                    style={{ width: 40, height: 22, borderRadius: 11, position: 'relative', transition: 'background 0.2s', background: privacy[item.key] ? '#98AA9D' : 'rgba(45,53,54,0.15)' }}
                  >
                    <div
                      style={{ width: 18, height: 18, top: 2, left: privacy[item.key] ? 20 : 2, position: 'absolute', background: 'white', borderRadius: 9, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Danger zone */}
          <div className="bg-white rounded-2xl border border-red-100 p-6">
            <h2 className="font-semibold text-red-600 mb-3">Danger zone</h2>
            <p className="text-sm text-moss mb-4">Once you delete your account, all your data will be permanently removed. This cannot be undone.</p>
            <button className="px-4 py-2 rounded-xl border border-red-200 text-red-500 text-sm font-medium hover:bg-red-50 transition-colors">
              Delete account
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
