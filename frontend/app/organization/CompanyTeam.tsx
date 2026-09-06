'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Trash2,
  Edit2,
  Mail,
  Phone,
  Shield,
  Check,
  ChevronDown,
  UserCheck,
  UserPlus,
  Building,
  MoreVertical,
  Pencil,
} from 'lucide-react';
import { useApp } from '@/app/store';
import { Employee } from '@/types/types';
import Modal from '@/components/ui/Modal';

type CompanyRole = 'Company Owner' | 'Company Manager' | 'Booking Manager' | 'Team Member';

interface TeamMemberExt extends Employee {
  role: CompanyRole;
  status: 'active' | 'invited';
  lastActive: string;
}

const COMPANY_ROLES: CompanyRole[] = ['Company Owner', 'Company Manager', 'Booking Manager', 'Team Member'];

const ROLE_BADGE: Record<CompanyRole, string> = {
  'Company Owner': 'bg-soot text-plaster border border-soot/20',
  'Company Manager': 'bg-emerald-500/15 text-emerald-800 border border-emerald-500/30',
  'Booking Manager': 'bg-blue-500/15 text-blue-800 border border-blue-500/30',
  'Team Member': 'bg-soot/10 text-soot border border-soot/15',
};

export default function CompanyTeam() {
  const { currentUser, updateCurrentUser, showToast } = useApp();
  if (!currentUser) return null;

  const rawEmployees = currentUser.employees || [];

  const [members, setMembers] = useState<TeamMemberExt[]>([
    { id: 'owner', name: currentUser.name, email: currentUser.email, department: 'Leadership', role: 'Company Owner', status: 'active', lastActive: '2026-09-01' },
    ...rawEmployees.map((e: Employee, i: number) => ({
      ...e,
      role: (['Company Manager', 'Booking Manager', 'Team Member', 'Team Member', 'Team Member', 'Team Member'][i] || 'Team Member') as CompanyRole,
      status: 'active' as const,
      lastActive: '2026-08-' + String(20 + i).padStart(2, '0'),
    })),
  ]);

  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const roleDropdownRef = useRef<HTMLDivElement>(null);

  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState<TeamMemberExt | null>(null);
  const [deleteModal, setDeleteModal] = useState<TeamMemberExt | null>(null);
  const [newMember, setNewMember] = useState({ name: '', email: '', department: '', role: 'Team Member' as CompanyRole });

  const [addRoleOpen, setAddRoleOpen] = useState(false);
  const [editRoleOpen, setEditRoleOpen] = useState(false);
  const addRoleRef = useRef<HTMLDivElement>(null);
  const editRoleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target as Node)) {
        setRoleDropdownOpen(false);
      }
      if (addRoleRef.current && !addRoleRef.current.contains(event.target as Node)) {
        setAddRoleOpen(false);
      }
      if (editRoleRef.current && !editRoleRef.current.contains(event.target as Node)) {
        setEditRoleOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = members.filter(m => {
    const q = query.trim().toLowerCase();
    const matchSearch = !q || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || m.department.toLowerCase().includes(q);
    const matchRole = roleFilter === 'All' || m.role === roleFilter;
    return matchSearch && matchRole;
  });

  const handleAdd = () => {
    if (!newMember.name || !newMember.email) { showToast('Name and email are required.', 'error'); return; }
    const member: TeamMemberExt = {
      id: `team-${Date.now()}`,
      name: newMember.name,
      email: newMember.email,
      department: newMember.department,
      role: newMember.role,
      status: 'invited',
      lastActive: '-',
    };
    const updated = [...members, member];
    setMembers(updated);
    const newEmployees = updated.filter(m => m.id !== 'owner').map(m => ({ id: m.id, name: m.name, email: m.email, department: m.department }));
    updateCurrentUser({ employees: newEmployees });
    setNewMember({ name: '', email: '', department: '', role: 'Team Member' });
    setAddModal(false);
    showToast(`${newMember.name} invited to the team.`, 'success');
  };

  const handleDelete = (member: TeamMemberExt) => {
    const updated = members.filter(m => m.id !== member.id);
    setMembers(updated);
    const newEmployees = updated.filter(m => m.id !== 'owner').map(m => ({ id: m.id, name: m.name, email: m.email, department: m.department }));
    updateCurrentUser({ employees: newEmployees });
    setDeleteModal(null);
    showToast(`${member.name} removed from team.`, 'success');
  };

  const handleEditSave = () => {
    if (!editModal) return;
    setMembers(prev => prev.map(m => m.id === editModal.id ? editModal : m));
    setEditModal(null);
    showToast('Team member updated.', 'success');
  };

  const activeCount = members.filter(m => m.status === 'active').length;
  const invitedCount = members.filter(m => m.status === 'invited').length;
  const departmentCount = new Set(members.map(m => m.department).filter(Boolean)).size;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <span className="text-xs font-semibold tracking-wider uppercase text-moss block mb-1">
            Corporate Team & Access Management
          </span>
          <h1 className="text-3xl sm:text-4xl text-soot font-normal font-serif-display">
            Team Members
          </h1>
          <p className="text-moss text-sm mt-1">Manage team roles, pass access, and enterprise employee seats.</p>
        </div>

        <button
          type="button"
          onClick={() => setAddModal(true)}
          className="btn-primary"
        >
          <Plus size={16} />
          <span>Add member</span>
        </button>
      </div>

      {/* Admin-Matching Elevated Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Members',
            count: members.length,
            badge: 'bg-soot/10 text-soot border border-soot/15',
            icon: Users,
            iconBg: 'bg-soot text-plaster border-soot/20',
          },
          {
            label: 'Active Users',
            count: activeCount,
            badge: 'bg-emerald-500/15 text-emerald-800 border border-emerald-500/30',
            icon: UserCheck,
            iconBg: 'bg-emerald-500/15 text-emerald-800 border-emerald-500/30',
          },
          {
            label: 'Pending Invited',
            count: invitedCount,
            badge: 'bg-amber-500/15 text-amber-800 border border-amber-500/30',
            icon: UserPlus,
            iconBg: 'bg-amber-500/15 text-amber-800 border-amber-500/30',
          },
          {
            label: 'Departments',
            count: departmentCount || 1,
            badge: 'bg-blue-500/15 text-blue-800 border border-blue-500/30',
            icon: Building,
            iconBg: 'bg-blue-500/15 text-blue-800 border-blue-500/30',
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
          </div>
        ))}
      </div>

      {/* Admin-Matching Search & Custom Dropdown Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-plaster-surface p-3 rounded-2xl border border-soot/10 shadow-2xs relative z-30">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-moss" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search team member by name, email, or department..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-soot/12 bg-plaster-dark/30 text-soot text-sm placeholder:text-moss/70 outline-none focus:border-eucalyptus focus:bg-plaster-surface transition-all"
          />
        </div>

        {/* Custom Role Dropdown */}
        <div className="relative min-w-48" ref={roleDropdownRef}>
          <button
            type="button"
            onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
            className="w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-plaster-dark/30 hover:bg-plaster-dark/50 border border-soot/12 transition-all duration-200 text-left cursor-pointer focus:outline-none"
          >
            <span className="text-sm font-medium text-soot truncate">
              {roleFilter === 'All' ? 'All Roles' : roleFilter}
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
                {['All', ...COMPANY_ROLES].map((role) => {
                  const isSelected = roleFilter === role;
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => {
                        setRoleFilter(role);
                        setRoleDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors text-left cursor-pointer ${
                        isSelected
                          ? 'bg-soot text-plaster font-semibold'
                          : 'text-soot hover:bg-plaster-dark/60'
                      }`}
                    >
                      <span>{role === 'All' ? 'All Roles' : role}</span>
                      {isSelected && <Check size={14} className="text-eucalyptus" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Admin-Matching 12-Column Table Layout */}
      <div className="bg-plaster-surface rounded-3xl border border-soot/10 overflow-hidden shadow-2xs relative z-10">
        <div className="hidden lg:grid grid-cols-12 gap-6 px-6 py-4 border-b border-soot/10 text-xs font-semibold uppercase tracking-wider text-moss bg-plaster-dark/40 items-center">
          <div className="col-span-4">Team Member & Email</div>
          <div className="col-span-3">Department</div>
          <div className="col-span-3">Company Role</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center text-moss">
            <Users size={32} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">No team members match your search criteria.</p>
          </div>
        ) : (
          <div className="divide-y divide-soot/8">
            {filtered.map((m) => (
              <div
                key={m.id}
                className="px-6 py-4 hover:bg-plaster-dark/30 transition-colors flex flex-col lg:grid lg:grid-cols-12 lg:gap-6 lg:items-center group"
              >
                {/* User Avatar & Name */}
                <div className="col-span-4 flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-soot text-plaster font-semibold flex items-center justify-center text-sm shrink-0 shadow-2xs">
                    {m.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-soot truncate">{m.name}</div>
                    <div className="text-xs text-moss truncate">{m.email}</div>
                  </div>
                </div>

                {/* Department */}
                <div className="col-span-3 mt-2 lg:mt-0 text-sm font-medium text-soot truncate">
                  {m.department || 'General Team'}
                </div>

                {/* Role Badge */}
                <div className="col-span-3 mt-2 lg:mt-0">
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${ROLE_BADGE[m.role]}`}>
                    {m.role}
                  </span>
                </div>

                {/* Status */}
                <div className="col-span-1 mt-2 lg:mt-0">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold capitalize ${
                      m.status === 'active'
                        ? 'bg-emerald-500/15 text-emerald-800'
                        : 'bg-amber-500/15 text-amber-800'
                    }`}
                  >
                    {m.status}
                  </span>
                </div>

                {/* Actions */}
                <div className="col-span-1 mt-4 lg:mt-0 flex items-center justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => setEditModal(m)}
                    className="p-2 rounded-xl text-moss hover:text-soot hover:bg-plaster-surface border border-transparent hover:border-soot/10 transition-all cursor-pointer"
                    title="Edit Member"
                  >
                    <Pencil size={15} />
                  </button>
                  {m.id !== 'owner' && (
                    <button
                      type="button"
                      onClick={() => setDeleteModal(m)}
                      className="p-2 rounded-xl text-moss hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all cursor-pointer"
                      title="Remove Member"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Team Member Modal */}
      <Modal
        open={addModal}
        onClose={() => setAddModal(false)}
        title="Add Team Member"
        subtitle="Invite a new colleague to your corporate pass account."
        size="md"
        footer={
          <>
            <button type="button" onClick={() => setAddModal(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="button" onClick={handleAdd} className="btn-primary">
              Send Invite
            </button>
          </>
        }
      >
        <div className="space-y-4 text-sm text-soot">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-moss mb-1">Full Name *</label>
            <input
              value={newMember.name}
              onChange={e => setNewMember(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Tariq Mansoor"
              className="w-full px-3.5 py-2.5 rounded-xl border border-soot/12 bg-white text-soot text-sm outline-none focus:border-eucalyptus"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-moss mb-1">Corporate Email *</label>
            <input
              type="email"
              value={newMember.email}
              onChange={e => setNewMember(p => ({ ...p, email: e.target.value }))}
              placeholder="name@company.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-soot/12 bg-white text-soot text-sm outline-none focus:border-eucalyptus"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-moss mb-1">Department</label>
            <input
              value={newMember.department}
              onChange={e => setNewMember(p => ({ ...p, department: e.target.value }))}
              placeholder="e.g. Engineering, Product, Sales"
              className="w-full px-3.5 py-2.5 rounded-xl border border-soot/12 bg-white text-soot text-sm outline-none focus:border-eucalyptus"
            />
          </div>
          <div className="relative" ref={addRoleRef}>
            <label className="block text-xs font-semibold uppercase tracking-wider text-moss mb-1">Company Access Role</label>
            <button
              type="button"
              onClick={() => setAddRoleOpen(!addRoleOpen)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white border border-soot/12 text-soot text-sm font-medium text-left transition-all duration-200 cursor-pointer focus:outline-none"
            >
              <span className="truncate">{newMember.role}</span>
              <ChevronDown
                size={15}
                className={`text-moss shrink-0 transition-transform duration-200 ${
                  addRoleOpen ? 'rotate-180 text-soot' : ''
                }`}
              />
            </button>

            {addRoleOpen && (
              <div className="absolute top-full left-0 right-0 mt-1.5 p-1.5 bg-plaster-surface border border-soot/15 rounded-2xl shadow-xl z-50 animate-in fade-in-50 zoom-in-95 duration-100 max-h-52 overflow-y-auto">
                <div className="space-y-0.5">
                  {COMPANY_ROLES.map((r) => {
                    const isSelected = newMember.role === r;
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => {
                          setNewMember((p) => ({ ...p, role: r }));
                          setAddRoleOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-sm font-medium transition-colors text-left cursor-pointer ${
                          isSelected
                            ? 'bg-soot text-plaster font-semibold'
                            : 'text-soot hover:bg-plaster-dark/60'
                        }`}
                      >
                        <span>{r}</span>
                        {isSelected && <Check size={14} className="text-eucalyptus" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      {editModal && (
        <Modal
          open={!!editModal}
          onClose={() => setEditModal(null)}
          title="Edit Team Member"
          size="md"
          footer={
            <>
              <button type="button" onClick={() => setEditModal(null)} className="btn-secondary">
                Cancel
              </button>
              <button type="button" onClick={handleEditSave} className="btn-primary">
                Save Changes
              </button>
            </>
          }
        >
          <div className="space-y-4 text-sm text-soot">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-moss mb-1">Full Name</label>
              <input
                value={editModal.name}
                onChange={e => setEditModal(p => p ? { ...p, name: e.target.value } : null)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-soot/12 bg-white text-soot text-sm outline-none focus:border-eucalyptus"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-moss mb-1">Department</label>
              <input
                value={editModal.department}
                onChange={e => setEditModal(p => p ? { ...p, department: e.target.value } : null)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-soot/12 bg-white text-soot text-sm outline-none focus:border-eucalyptus"
              />
            </div>
            <div className="relative" ref={editRoleRef}>
              <label className="block text-xs font-semibold uppercase tracking-wider text-moss mb-1">Company Role</label>
              <button
                type="button"
                onClick={() => setEditRoleOpen(!editRoleOpen)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white border border-soot/12 text-soot text-sm font-medium text-left transition-all duration-200 cursor-pointer focus:outline-none"
              >
                <span className="truncate">{editModal.role}</span>
                <ChevronDown
                  size={15}
                  className={`text-moss shrink-0 transition-transform duration-200 ${
                    editRoleOpen ? 'rotate-180 text-soot' : ''
                  }`}
                />
              </button>

              {editRoleOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 p-1.5 bg-plaster-surface border border-soot/15 rounded-2xl shadow-xl z-50 animate-in fade-in-50 zoom-in-95 duration-100 max-h-52 overflow-y-auto">
                  <div className="space-y-0.5">
                    {COMPANY_ROLES.map((r) => {
                      const isSelected = editModal.role === r;
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => {
                            setEditModal((p) => (p ? { ...p, role: r } : null));
                            setEditRoleOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-sm font-medium transition-colors text-left cursor-pointer ${
                            isSelected
                              ? 'bg-soot text-plaster font-semibold'
                              : 'text-soot hover:bg-plaster-dark/60'
                          }`}
                        >
                          <span>{r}</span>
                          {isSelected && <Check size={14} className="text-eucalyptus" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <Modal
          open={!!deleteModal}
          onClose={() => setDeleteModal(null)}
          title="Remove Team Member"
          size="sm"
          footer={
            <>
              <button type="button" onClick={() => setDeleteModal(null)} className="btn-secondary">
                Cancel
              </button>
              <button type="button" onClick={() => handleDelete(deleteModal)} className="btn-danger">
                Remove Member
              </button>
            </>
          }
        >
          <div className="text-sm text-soot space-y-2 py-2">
            <p>
              Are you sure you want to remove <span className="font-semibold">{deleteModal.name}</span> from your team?
            </p>
            <p className="text-xs text-moss">They will no longer have access to enterprise workspace passes.</p>
          </div>
        </Modal>
      )}
    </div>
  );
}
