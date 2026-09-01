'use client';
import { useState } from 'react';
import { Search, Shield, ShieldOff, ChevronDown, AlertCircle } from 'lucide-react';
import { useApp } from '@/app/store';
import { User, UserRole } from '@/types/types';
import Modal from '@/components/ui/Modal';

const ROLES: UserRole[] = ['individual', 'organization', 'admin'];

export default function UsersAdmin() {
  const { users, blockUser, unblockUser, changeUserRole, showToast } = useApp();
  const [query, setQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [blockModal, setBlockModal] = useState(false);
  const [detailsModal, setDetailsModal] = useState(false);

  const nonAdmins = users.filter(u => u.role !== 'admin');

  const filtered = nonAdmins.filter(u => {
    const name = u.role === 'organization' ? (u.orgName || u.name) : u.name;
    if (query && !name.toLowerCase().includes(query.toLowerCase()) && !u.email.toLowerCase().includes(query.toLowerCase())) return false;
    if (filterRole && u.role !== filterRole) return false;
    if (filterStatus === 'active' && u.isBlocked) return false;
    if (filterStatus === 'blocked' && !u.isBlocked) return false;
    return true;
  });

  const handleBlockAction = () => {
    if (!selectedUser) return;
    if (selectedUser.isBlocked) unblockUser(selectedUser.id);
    else blockUser(selectedUser.id);
    setBlockModal(false);
    setSelectedUser(null);
  };

  const handleRoleChange = (userId: string, role: UserRole) => {
    changeUserRole(userId, role);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-3xl text-soot" style={{ fontFamily: 'DM Serif Display, serif' }}>Manage Users</h1>
        <p className="text-moss text-sm mt-1">{nonAdmins.length} users · {nonAdmins.filter(u => u.isBlocked).length} blocked</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-moss" />
          <input
            value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search users..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-soot/12 bg-white text-soot text-sm outline-none focus:border-eucalyptus"
          />
        </div>
        <div className="relative">
          <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="pl-3 pr-7 py-2.5 rounded-xl border border-soot/12 bg-white text-soot text-sm outline-none appearance-none cursor-pointer">
            <option value="">All roles</option>
            <option value="individual">Individual</option>
            <option value="organization">Organization</option>
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-moss pointer-events-none" />
        </div>
        <div className="relative">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="pl-3 pr-7 py-2.5 rounded-xl border border-soot/12 bg-white text-soot text-sm outline-none appearance-none cursor-pointer">
            <option value="">All status</option>
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-moss pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-soot/8 overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 border-b border-soot/8 text-xs font-medium text-moss uppercase tracking-wide">
          <div className="col-span-4">User</div>
          <div className="col-span-2">Role</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Joined</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        <div className="divide-y divide-soot/5">
          {filtered.map(u => {
            const displayName = u.role === 'organization' ? (u.orgName || u.name) : u.name;
            return (
              <div key={u.id} className="px-5 py-4">
                {/* Mobile */}
                <div className="md:hidden">
                  <div className="flex items-center gap-3 mb-3">
                    <img src={u.avatar} alt={displayName} className="w-10 h-10 rounded-full object-cover" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-soot text-sm truncate">{displayName}</div>
                      <div className="text-xs text-moss truncate">{u.email}</div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${u.isBlocked ? 'bg-red-50 text-red-500' : 'bg-eucalyptus/15 text-moss'}`}>
                      {u.isBlocked ? 'Blocked' : 'Active'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setSelectedUser(u); setDetailsModal(true); }} className="px-3 py-1.5 rounded-lg border border-soot/12 text-xs text-soot">Details</button>
                    <button onClick={() => { setSelectedUser(u); setBlockModal(true); }} className={`px-3 py-1.5 rounded-lg border text-xs ${u.isBlocked ? 'border-eucalyptus/30 text-moss' : 'border-red-100 text-red-500'}`}>
                      {u.isBlocked ? 'Unblock' : 'Block'}
                    </button>
                  </div>
                </div>

                {/* Desktop */}
                <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-4 flex items-center gap-3">
                    <img src={u.avatar} alt={displayName} className="w-9 h-9 rounded-full object-cover shrink-0" />
                    <div className="min-w-0">
                      <div className="font-medium text-soot text-sm truncate">{displayName}</div>
                      <div className="text-xs text-moss truncate">{u.email}</div>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <select
                      value={u.role}
                      onChange={e => handleRoleChange(u.id, e.target.value as UserRole)}
                      className="text-xs border border-soot/12 rounded-lg px-2 py-1 bg-plaster text-soot outline-none appearance-none cursor-pointer"
                    >
                      {ROLES.filter(r => r !== 'admin').map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${u.isBlocked ? 'bg-red-50 text-red-500' : 'bg-eucalyptus/15 text-moss'}`}>
                      {u.isBlocked ? 'Blocked' : 'Active'}
                    </span>
                  </div>
                  <div className="col-span-2 text-sm text-moss">{u.joinDate}</div>
                  <div className="col-span-2 flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => { setSelectedUser(u); setDetailsModal(true); }}
                      className="p-1.5 rounded-lg hover:bg-soot/8 text-moss hover:text-soot transition-colors text-xs"
                      title="View details"
                    >
                      Details
                    </button>
                    <button
                      onClick={() => { setSelectedUser(u); setBlockModal(true); }}
                      className={`p-1.5 rounded-lg transition-colors ${u.isBlocked ? 'hover:bg-eucalyptus/10 text-moss hover:text-moss' : 'hover:bg-red-50 text-moss hover:text-red-500'}`}
                      title={u.isBlocked ? 'Unblock' : 'Block'}
                    >
                      {u.isBlocked ? <Shield size={14} /> : <ShieldOff size={14} />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="py-16 text-center text-moss text-sm">No users found.</div>
        )}
      </div>

      {/* Details modal */}
      <Modal open={detailsModal} onClose={() => { setDetailsModal(false); setSelectedUser(null); }} title="User Details" size="md">
        {selectedUser && (
          <div className="p-6">
            <div className="flex items-center gap-4 mb-5 pb-5 border-b border-soot/8">
              <img src={selectedUser.avatar} alt={selectedUser.name} className="w-14 h-14 rounded-full object-cover" />
              <div>
                <div className="font-semibold text-soot text-lg">
                  {selectedUser.role === 'organization' ? (selectedUser.orgName || selectedUser.name) : selectedUser.name}
                </div>
                <div className="text-sm text-moss">{selectedUser.email}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs capitalize bg-eucalyptus/15 text-moss px-2 py-0.5 rounded-full">{selectedUser.role}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${selectedUser.isBlocked ? 'bg-red-50 text-red-500' : 'bg-eucalyptus/15 text-moss'}`}>
                    {selectedUser.isBlocked ? 'Blocked' : 'Active'}
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-2.5 text-sm">
              {[
                { l: 'Phone', v: selectedUser.phone },
                { l: 'Joined', v: selectedUser.joinDate },
                ...(selectedUser.role === 'organization' ? [
                  { l: 'Organization', v: selectedUser.orgName || '—' },
                  { l: 'Team size', v: String(selectedUser.orgSize || '—') },
                  { l: 'Industry', v: selectedUser.industry || '—' },
                ] : []),
              ].map(r => (
                <div key={r.l} className="flex justify-between">
                  <span className="text-moss">{r.l}</span>
                  <span className="text-soot font-medium">{r.v}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setDetailsModal(false)} className="flex-1 py-2.5 rounded-xl border border-soot/15 text-soot text-sm font-medium">Close</button>
              <button
                onClick={() => { setDetailsModal(false); setBlockModal(true); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold ${selectedUser.isBlocked ? 'bg-eucalyptus text-soot' : 'bg-red-500 text-white'}`}
              >
                {selectedUser.isBlocked ? 'Unblock user' : 'Block user'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Block confirmation */}
      <Modal open={blockModal} onClose={() => setBlockModal(false)} title={selectedUser?.isBlocked ? 'Unblock User' : 'Block User'} size="sm">
        <div className="p-6">
          <div className="flex items-start gap-3 mb-5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${selectedUser?.isBlocked ? 'bg-eucalyptus/20' : 'bg-red-50'}`}>
              <AlertCircle size={18} className={selectedUser?.isBlocked ? 'text-moss' : 'text-red-500'} />
            </div>
            <p className="text-sm text-moss leading-relaxed">
              {selectedUser?.isBlocked
                ? `Unblock ${selectedUser?.name}? They will be able to log in and use the platform again.`
                : `Block ${selectedUser?.name}? They will be prevented from accessing the platform.`
              }
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setBlockModal(false)} className="flex-1 py-2.5 rounded-xl border border-soot/15 text-soot text-sm font-medium">Cancel</button>
            <button onClick={handleBlockAction} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold ${selectedUser?.isBlocked ? 'bg-eucalyptus text-soot' : 'bg-red-500 text-white'}`}>
              {selectedUser?.isBlocked ? 'Yes, unblock' : 'Yes, block'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
