'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Search,
  Plus,
  Shield,
  ShieldOff,
  ChevronDown,
  AlertCircle,
  Check,
  Users as UsersIcon,
  UserCheck,
  UserX,
  Building2,
  X,
  Phone,
  Calendar,
  Eye,
  Pencil,
} from 'lucide-react';
import { useApp } from '@/app/store';
import { User, UserRole } from '@/types/types';
import Badge from '@/components/ui/Badge';

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'individual', label: 'Individual Member' },
  { value: 'organization', label: 'Organization (B2B)' },
  { value: 'provider', label: 'Space Partner' },
];

export default function UsersAdmin() {
  const { users, blockUser, unblockUser, changeUserRole, showToast } = useApp();
  const [query, setQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  // Dropdown States for Filters
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const roleDropdownRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  // Table Row Role Dropdowns
  const [activeRowRoleDropdown, setActiveRowRoleDropdown] = useState<string | null>(null);

  // Modals
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [blockModal, setBlockModal] = useState(false);
  const [detailsModal, setDetailsModal] = useState(false);
  const [addEditModal, setAddEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Add/Edit Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('individual');
  const [orgName, setOrgName] = useState('');
  const [orgSize, setOrgSize] = useState('10');
  const [industry, setIndustry] = useState('');
  const [modalRoleDropdownOpen, setModalRoleDropdownOpen] = useState(false);
  const modalRoleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target as Node)) {
        setRoleDropdownOpen(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setStatusDropdownOpen(false);
      }
      if (modalRoleRef.current && !modalRoleRef.current.contains(event.target as Node)) {
        setModalRoleDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const nonAdmins = users.filter((u) => u.role !== 'admin');

  const filtered = nonAdmins.filter((u) => {
    const displayName = u.role === 'organization' ? u.orgName || u.name : u.name;
    const q = query.trim().toLowerCase();
    if (q && !displayName.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
    if (filterRole && u.role !== filterRole) return false;
    if (filterStatus === 'active' && u.isBlocked) return false;
    if (filterStatus === 'blocked' && !u.isBlocked) return false;
    return true;
  });

  const openAddModal = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
    setPhone('+966 50 123 4567');
    setRole('individual');
    setOrgName('');
    setOrgSize('10');
    setIndustry('Technology');
    setAddEditModal(true);
  };

  const openEditModal = (e: React.MouseEvent, user: User) => {
    e.stopPropagation();
    setEditingUser(user);
    setName(user.name);
    setEmail(user.email);
    setPhone(user.phone || '+966 50 123 4567');
    setRole(user.role);
    setOrgName(user.orgName || '');
    setOrgSize(String(user.orgSize || 10));
    setIndustry(user.industry || '');
    setAddEditModal(true);
  };

  const handleSaveUser = () => {
    if (!name.trim() || !email.trim()) {
      showToast('Please provide a name and email address', 'error');
      return;
    }

    if (editingUser) {
      if (editingUser.role !== role) {
        changeUserRole(editingUser.id, role);
      }
      editingUser.name = name;
      editingUser.email = email;
      editingUser.phone = phone;
      if (role === 'organization') {
        editingUser.orgName = orgName;
        editingUser.orgSize = parseInt(orgSize) || 10;
        editingUser.industry = industry;
      }
      showToast('User profile updated successfully!', 'success');
    } else {
      const newUser: User = {
        id: `user-${Date.now()}`,
        name,
        email,
        password: 'password123',
        role,
        phone,
        avatar: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 1000)}?w=100&h=100&fit=crop&auto=format`,
        isBlocked: false,
        joinDate: new Date().toISOString().split('T')[0],
        ...(role === 'organization' ? { orgName, orgSize: parseInt(orgSize) || 10, industry } : {}),
      };
      users.unshift(newUser);
      showToast('New user account created!', 'success');
    }

    setAddEditModal(false);
  };

  const handleBlockAction = () => {
    if (!selectedUser) return;
    if (selectedUser.isBlocked) {
      unblockUser(selectedUser.id);
      showToast(`${selectedUser.name} unblocked successfully`);
    } else {
      blockUser(selectedUser.id);
      showToast(`${selectedUser.name} account blocked`, 'info');
    }
    setBlockModal(false);
    setSelectedUser(null);
  };

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    changeUserRole(userId, newRole);
    setActiveRowRoleDropdown(null);
    showToast('User role updated');
  };

  const activeCount = nonAdmins.filter((u) => !u.isBlocked).length;
  const blockedCount = nonAdmins.filter((u) => u.isBlocked).length;
  const orgCount = nonAdmins.filter((u) => u.role === 'organization').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <span className="text-xs font-semibold tracking-wider uppercase text-moss block mb-1">
            User Management & Directory
          </span>
          <h1 className="text-3xl sm:text-4xl text-soot font-normal font-serif-display">
            Manage Users
          </h1>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="btn-primary"
        >
          <Plus size={17} className="text-[#FAF8F5]/80" />
          <span>Add User</span>
        </button>
      </div>

      {/* Premium Elevated Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Users',
            count: nonAdmins.length,
            badge: 'bg-soot/10 text-soot border border-soot/15',
            icon: UsersIcon,
            iconBg: 'bg-soot text-plaster border-soot/20',
          },
          {
            label: 'Active Members',
            count: activeCount,
            badge: 'bg-emerald-500/15 text-emerald-800 border border-emerald-500/30',
            icon: UserCheck,
            iconBg: 'bg-emerald-500/15 text-emerald-800 border-emerald-500/30',
          },
          {
            label: 'Blocked Accounts',
            count: blockedCount,
            badge: 'bg-red-500/15 text-red-700 border border-red-500/30',
            icon: UserX,
            iconBg: 'bg-red-500/15 text-red-700 border-red-500/30',
          },
          {
            label: 'Organizations (B2B)',
            count: orgCount,
            badge: 'bg-eucalyptus/25 text-soot border border-eucalyptus/35',
            icon: Building2,
            iconBg: 'bg-eucalyptus/25 text-soot border-eucalyptus/35',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-plaster-surface rounded-3xl border border-soot/12 p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-between group"
          >
            <div className="flex items-center gap-3.5">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs ${stat.iconBg}`}>
                <stat.icon size={20} />
              </div>
              <div>
                <div className="text-3xl font-normal text-soot tracking-tight font-serif-display">{stat.count}</div>
                <div className="text-xs font-medium text-moss mt-0.5">{stat.label}</div>
              </div>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-bold shadow-2xs ${stat.badge}`}>
              {Math.round((stat.count / (nonAdmins.length || 1)) * 100)}%
            </span>
          </div>
        ))}
      </div>

      {/* Search & Custom Styled Dropdowns */}
      <div className="flex flex-col sm:flex-row gap-3 bg-plaster-surface p-3 rounded-2xl border border-soot/10 shadow-2xs relative z-30">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-moss" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users by name, company, or email..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-soot/12 bg-plaster-dark/30 text-soot text-sm placeholder:text-moss/70 outline-none focus:border-eucalyptus focus:bg-plaster-surface transition-all"
          />
        </div>

        {/* Custom Role Dropdown */}
        <div className="relative min-w-44" ref={roleDropdownRef}>
          <button
            type="button"
            onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
            className="w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-plaster-dark/30 hover:bg-plaster-dark/50 border border-soot/12 transition-all duration-200 text-left cursor-pointer focus:outline-none"
          >
            <span className="text-sm font-medium text-soot truncate">
              {filterRole ? (filterRole === 'individual' ? 'Individual' : filterRole === 'organization' ? 'Organization' : 'Provider') : 'All Roles'}
            </span>
            <ChevronDown
              size={15}
              className={`text-moss transition-transform duration-200 shrink-0 ${
                roleDropdownOpen ? 'rotate-180 text-soot' : ''
              }`}
            />
          </button>

          {roleDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1.5 p-1.5 bg-plaster-surface border border-soot/15 rounded-2xl shadow-xl z-50 animate-in fade-in-50 zoom-in-95 duration-100">
              <div className="space-y-0.5">
                {[
                  { value: '', label: 'All Roles' },
                  { value: 'individual', label: 'Individual Member' },
                  { value: 'organization', label: 'Organization (B2B)' },
                  { value: 'provider', label: 'Space Partner' },
                ].map((item) => {
                  const isSelected = filterRole === item.value;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        setFilterRole(item.value);
                        setRoleDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors text-left cursor-pointer ${
                        isSelected
                          ? 'bg-soot text-plaster font-semibold'
                          : 'text-soot hover:bg-plaster-dark/60'
                      }`}
                    >
                      <span>{item.label}</span>
                      {isSelected && <Check size={14} className="text-eucalyptus" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Custom Status Dropdown */}
        <div className="relative min-w-40" ref={statusDropdownRef}>
          <button
            type="button"
            onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
            className="w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-plaster-dark/30 hover:bg-plaster-dark/50 border border-soot/12 transition-all duration-200 text-left cursor-pointer focus:outline-none"
          >
            <span className="text-sm font-medium text-soot truncate">
              {filterStatus ? (filterStatus === 'active' ? 'Active' : 'Blocked') : 'All Status'}
            </span>
            <ChevronDown
              size={15}
              className={`text-moss transition-transform duration-200 shrink-0 ${
                statusDropdownOpen ? 'rotate-180 text-soot' : ''
              }`}
            />
          </button>

          {statusDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1.5 p-1.5 bg-plaster-surface border border-soot/15 rounded-2xl shadow-xl z-50 animate-in fade-in-50 zoom-in-95 duration-100">
              <div className="space-y-0.5">
                {[
                  { value: '', label: 'All Status' },
                  { value: 'active', label: 'Active' },
                  { value: 'blocked', label: 'Blocked' },
                ].map((item) => {
                  const isSelected = filterStatus === item.value;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        setFilterStatus(item.value);
                        setStatusDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors text-left cursor-pointer ${
                        isSelected
                          ? 'bg-soot text-plaster font-semibold'
                          : 'text-soot hover:bg-plaster-dark/60'
                      }`}
                    >
                      <span>{item.label}</span>
                      {isSelected && <Check size={14} className="text-eucalyptus" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Clean Table Layout Matching SpacesAdmin */}
      <div className="bg-plaster-surface rounded-3xl border border-soot/10 overflow-hidden shadow-2xs relative z-10">
        <div className="hidden md:grid grid-cols-12 gap-6 px-6 py-4 border-b border-soot/10 text-xs font-semibold uppercase tracking-wider text-moss bg-plaster-dark/40 items-center">
          <div className="col-span-5">User Details</div>
          <div className="col-span-2">Account Role</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Joined Date</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        <div className="divide-y divide-soot/8">
          {filtered.map((u) => {
            const displayName = u.role === 'organization' ? u.orgName || u.name : u.name;
            const isDropdownActive = activeRowRoleDropdown === u.id;

            return (
              <div
                key={u.id}
                onClick={() => {
                  setSelectedUser(u);
                  setDetailsModal(true);
                }}
                className="px-6 py-4 hover:bg-plaster-dark/30 transition-colors flex flex-col md:grid md:grid-cols-12 md:gap-6 md:items-center cursor-pointer group"
              >
                {/* User Info & Avatar */}
                <div className="col-span-5 flex items-center gap-3.5 min-w-0">
                  <img
                    src={u.avatar}
                    alt={displayName}
                    className="w-11 h-11 rounded-full object-cover border border-soot/10 shrink-0 shadow-2xs group-hover:scale-105 transition-transform"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-soot group-hover:text-emerald-900 transition-colors truncate">
                        {displayName}
                      </span>
                    </div>
                    <div className="text-xs text-moss truncate mt-0.5 font-medium">{u.email}</div>
                  </div>
                </div>

                {/* Role Custom Dropdown Pill */}
                <div className="col-span-2 mt-2 md:mt-0 relative" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => setActiveRowRoleDropdown(isDropdownActive ? null : u.id)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-plaster-dark/40 hover:bg-plaster-dark/70 border border-soot/12 text-xs font-semibold text-soot transition-all cursor-pointer"
                  >
                    <span className="capitalize">{u.role}</span>
                    <ChevronDown size={13} className={`text-moss transition-transform ${isDropdownActive ? 'rotate-180' : ''}`} />
                  </button>

                  {isDropdownActive && (
                    <div className="absolute top-full left-0 mt-1 w-44 p-1 bg-plaster-surface border border-soot/15 rounded-xl shadow-xl z-50 animate-in fade-in-50 zoom-in-95 duration-100">
                      {ROLES.map((r) => (
                        <button
                          key={r.value}
                          type="button"
                          onClick={() => handleRoleChange(u.id, r.value)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer ${
                            u.role === r.value ? 'bg-soot text-plaster font-semibold' : 'text-soot hover:bg-plaster-dark/60'
                          }`}
                        >
                          <span>{r.label}</span>
                          {u.role === r.value && <Check size={12} className="text-eucalyptus" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Status Badge */}
                <div className="col-span-2 mt-2 md:mt-0">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-xl font-semibold ${
                      u.isBlocked
                        ? 'bg-red-500/10 text-red-700 border border-red-500/20'
                        : 'bg-emerald-500/10 text-emerald-800 border border-emerald-500/20'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${u.isBlocked ? 'bg-red-500' : 'bg-emerald-500'}`} />
                    <span>{u.isBlocked ? 'Blocked' : 'Active'}</span>
                  </span>
                </div>

                {/* Joined Date */}
                <div className="col-span-2 mt-2 md:mt-0 text-xs font-medium text-moss">
                  {u.joinDate}
                </div>

                {/* Actions */}
                <div className="col-span-1 mt-4 md:mt-0 flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={(e) => openEditModal(e, u)}
                    className="p-2 rounded-xl text-moss hover:text-soot hover:bg-plaster-surface border border-transparent hover:border-soot/10 transition-all cursor-pointer"
                    title="Edit User Details"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUser(u);
                      setDetailsModal(true);
                    }}
                    className="p-2 rounded-xl text-moss hover:text-soot hover:bg-plaster-surface border border-transparent hover:border-soot/10 transition-all cursor-pointer"
                    title="View Full Profile Details"
                  >
                    <Eye size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUser(u);
                      setBlockModal(true);
                    }}
                    className={`p-2 rounded-xl transition-all cursor-pointer border border-transparent ${
                      u.isBlocked
                        ? 'text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200'
                        : 'text-moss hover:text-red-600 hover:bg-red-50 hover:border-red-100'
                    }`}
                    title={u.isBlocked ? 'Unblock User' : 'Block User'}
                  >
                    {u.isBlocked ? <Shield size={15} /> : <ShieldOff size={15} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="py-20 text-center text-moss">
            <UsersIcon size={40} className="mx-auto mb-3 text-moss/50" />
            <div className="text-base font-medium text-soot">No matching users found</div>
            <p className="text-xs text-moss mt-1">Try updating your search query or filter options.</p>
          </div>
        )}
      </div>

      {/* Modern Add / Edit User Modal with Correct Internal Scroll */}
      {addEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-soot/70 backdrop-blur-sm transition-opacity"
            onClick={() => setAddEditModal(false)}
          />

          <div className="relative w-full max-w-lg bg-plaster-surface rounded-3xl shadow-2xl border border-soot/15 z-10 flex flex-col max-h-[90vh]">
            {/* Modal Header (Fixed) */}
            <div className="px-6 sm:px-8 py-5 border-b border-soot/10 flex items-center justify-between bg-plaster-dark/30 shrink-0 rounded-t-3xl">
              <div>
                <h3 className="text-xl font-serif-display font-medium text-soot">
                  {editingUser ? 'Edit User Profile' : 'Add New User'}
                </h3>
                <p className="text-xs text-moss mt-0.5">Manage user credentials, role permissions, and contact details.</p>
              </div>
              <button
                type="button"
                onClick={() => setAddEditModal(false)}
                className="p-2 rounded-full text-moss hover:text-soot hover:bg-soot/8 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body (Scrollable container so form fields & organization details don't cut off buttons) */}
            <div className="p-6 sm:px-8 overflow-y-auto space-y-4 flex-1">
              <div>
                <label className="block text-xs font-semibold text-soot mb-1.5">Full Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Faisal Al-Otaibi"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-soot/15 bg-white text-soot text-sm placeholder:text-moss/60 outline-none focus:border-soot transition-all shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-soot mb-1.5">Email Address *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.sa"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-soot/15 bg-white text-soot text-sm placeholder:text-moss/60 outline-none focus:border-soot transition-all shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-soot mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+966 50 123 4567"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-soot/15 bg-white text-soot text-sm placeholder:text-moss/60 outline-none focus:border-soot transition-all shadow-2xs"
                />
              </div>

              {/* Custom Role Selector Dropdown List */}
              <div className="relative">
                <label className="block text-xs font-semibold text-soot mb-1.5">Account Role *</label>
                <button
                  type="button"
                  onClick={() => setModalRoleDropdownOpen(!modalRoleDropdownOpen)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-soot/15 bg-white hover:bg-plaster-dark/30 text-soot text-sm text-left transition-all cursor-pointer focus:outline-none shadow-2xs"
                >
                  <span className="font-medium truncate">
                    {ROLES.find((r) => r.value === role)?.label || 'Select Role'}
                  </span>
                  <ChevronDown size={15} className={`text-moss transition-transform duration-200 ${modalRoleDropdownOpen ? 'rotate-180 text-soot' : ''}`} />
                </button>

                {modalRoleDropdownOpen && (
                  <div className="mt-1.5 p-1.5 bg-white border border-soot/15 rounded-xl shadow-lg space-y-0.5 animate-in fade-in-50 zoom-in-95 duration-100">
                    {ROLES.map((r) => {
                      const isSelected = role === r.value;
                      return (
                        <button
                          key={r.value}
                          type="button"
                          onClick={() => {
                            setRole(r.value);
                            setModalRoleDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium text-left transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-soot text-plaster font-semibold'
                              : 'text-soot hover:bg-plaster-dark/50'
                          }`}
                        >
                          <span>{r.label}</span>
                          {isSelected && <Check size={14} className="text-eucalyptus" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {role === 'organization' && (
                <div className="p-4 rounded-2xl bg-plaster-dark/30 border border-soot/12 space-y-3.5 mt-3">
                  <span className="text-[11px] font-bold text-soot uppercase tracking-wider block">
                    Organization Details (B2B)
                  </span>
                  <div>
                    <label className="block text-xs font-semibold text-soot mb-1">Company Name</label>
                    <input
                      type="text"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="Saudi Tech Systems LLC"
                      className="w-full px-3 py-2 rounded-xl border border-soot/15 bg-white text-soot text-sm shadow-2xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-soot mb-1">Team Size</label>
                      <input
                        type="number"
                        value={orgSize}
                        onChange={(e) => setOrgSize(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-soot/15 bg-white text-soot text-sm shadow-2xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-soot mb-1">Industry</label>
                      <input
                        type="text"
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value)}
                        placeholder="Technology"
                        className="w-full px-3 py-2 rounded-xl border border-soot/15 bg-white text-soot text-sm shadow-2xs"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer (Fixed at bottom) */}
            <div className="px-6 sm:px-8 py-4 border-t border-soot/10 bg-plaster-dark/30 flex items-center justify-end gap-3 shrink-0 rounded-b-3xl">
              <button
                type="button"
                onClick={() => setAddEditModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveUser}
                className="btn-primary"
              >
                {editingUser ? 'Save Changes' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full User Details Modal */}
      {detailsModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150">
          <div
            className="fixed inset-0 bg-soot/70 backdrop-blur-sm"
            onClick={() => {
              setDetailsModal(false);
              setSelectedUser(null);
            }}
          />

          <div className="relative w-full max-w-lg bg-plaster-surface rounded-3xl shadow-2xl border border-soot/15 overflow-hidden z-10">
            <div className="px-6 sm:px-8 py-5 border-b border-soot/10 flex items-center justify-between bg-plaster-dark/30">
              <div>
                <h3 className="text-xl font-serif-display font-medium text-soot">
                  User Overview
                </h3>
                <p className="text-xs text-moss mt-0.5">Account status and profile details.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDetailsModal(false);
                  setSelectedUser(null);
                }}
                className="p-2 rounded-full text-moss hover:text-soot hover:bg-soot/8 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-4 pb-5 border-b border-soot/10">
                <img
                  src={selectedUser.avatar}
                  alt={selectedUser.name}
                  className="w-16 h-16 rounded-full object-cover border border-soot/10 shadow-sm"
                />
                <div>
                  <h4 className="font-semibold text-soot text-lg leading-tight">
                    {selectedUser.role === 'organization' ? selectedUser.orgName || selectedUser.name : selectedUser.name}
                  </h4>
                  <div className="text-xs text-moss mt-0.5">{selectedUser.email}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="soot" className="capitalize text-[10px] px-2.5 py-0.5">
                      {selectedUser.role}
                    </Badge>
                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold ${
                        selectedUser.isBlocked ? 'bg-red-500/10 text-red-700' : 'bg-emerald-500/10 text-emerald-800'
                      }`}
                    >
                      {selectedUser.isBlocked ? 'Blocked' : 'Active Account'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                {[
                  { label: 'Phone Number', value: selectedUser.phone || 'N/A', icon: Phone },
                  { label: 'Member Since', value: selectedUser.joinDate, icon: Calendar },
                  ...(selectedUser.role === 'organization'
                    ? [
                        { label: 'Company Name', value: selectedUser.orgName || 'N/A', icon: Building2 },
                        { label: 'Team Members', value: String(selectedUser.orgSize || '10'), icon: UsersIcon },
                        { label: 'Industry', value: selectedUser.industry || 'Technology', icon: Building2 },
                      ]
                    : []),
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between py-1.5 border-b border-soot/6 last:border-0">
                    <span className="text-moss text-xs flex items-center gap-2">
                      <row.icon size={14} className="text-moss/70" />
                      <span>{row.label}</span>
                    </span>
                    <span className="text-soot font-semibold text-xs sm:text-sm">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-6 sm:px-8 py-4 border-t border-soot/10 bg-plaster-dark/30 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setDetailsModal(false);
                  setSelectedUser(null);
                }}
                className="px-5 py-2.5 rounded-xl border border-soot/20 text-soot text-sm font-semibold hover:bg-soot/8 transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setDetailsModal(false);
                  setBlockModal(true);
                }}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold shadow-xs transition-all cursor-pointer ${
                  selectedUser.isBlocked
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {selectedUser.isBlocked ? 'Unblock Account' : 'Block Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete / Block Confirmation Modal */}
      {blockModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="fixed inset-0 bg-soot/70 backdrop-blur-sm" onClick={() => setBlockModal(false)} />
          <div className="relative w-full max-w-md bg-plaster-surface rounded-3xl shadow-2xl border border-soot/15 p-6 z-10">
            <div className="flex items-start gap-4 mb-6">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                  selectedUser.isBlocked
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-800'
                    : 'bg-red-500/10 border-red-500/20 text-red-600'
                }`}
              >
                <AlertCircle size={20} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-soot mb-1 font-serif-display">
                  {selectedUser.isBlocked ? 'Unblock User Account?' : 'Block User Account?'}
                </h3>
                <p className="text-xs text-moss leading-relaxed">
                  {selectedUser.isBlocked
                    ? `Are you sure you want to unblock ${selectedUser.name}? They will regain full access to their Coworking Pass account.`
                    : `Are you sure you want to block ${selectedUser.name}? Their access to the platform will be restricted immediately.`}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setBlockModal(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBlockAction}
                className={`flex-1 ${selectedUser.isBlocked ? 'btn-primary' : 'btn-danger'}`}
              >
                {selectedUser.isBlocked ? 'Yes, Unblock' : 'Yes, Block'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
