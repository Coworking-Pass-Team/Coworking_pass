'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  HelpCircle,
  AlertCircle,
  RotateCcw,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  MessageSquare,
  Paperclip,
  Eye,
  Send,
  User as UserIcon,
  Mail,
  ChevronDown,
  Check,
  ShieldAlert,
  FileText,
  X
} from 'lucide-react';
import { useApp } from '@/app/store';
import { SupportTicket, TicketCategory, TicketStatus, TicketPriority } from '@/types/types';
import Modal from '@/components/ui/Modal';

export default function SupportAdmin() {
  const { supportTickets, updateTicketStatus, replyToTicket } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | TicketCategory>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | TicketStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | TicketPriority>('all');

  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [priorityDropdownOpen, setPriorityDropdownOpen] = useState(false);

  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const priorityDropdownRef = useRef<HTMLDivElement>(null);

  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [adminReplyText, setAdminReplyText] = useState('');
  const [adminNotesText, setAdminNotesText] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Close custom dropdown popovers on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setStatusDropdownOpen(false);
      }
      if (priorityDropdownRef.current && !priorityDropdownRef.current.contains(event.target as Node)) {
        setPriorityDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered tickets logic
  const filteredTickets = supportTickets.filter((ticket) => {
    const matchesSearch =
      ticket.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.message.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || ticket.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;

    return matchesSearch && matchesCategory && matchesStatus && matchesPriority;
  });

  // KPI Calculations
  const totalCount = supportTickets.length;
  const complaintCount = supportTickets.filter((t) => t.category === 'complaint' && t.status !== 'resolved').length;
  const refundCount = supportTickets.filter((t) => t.category === 'refund' && t.status !== 'resolved').length;
  const resolvedCount = supportTickets.filter((t) => t.status === 'resolved' || t.status === 'closed').length;

  const handleOpenTicket = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setAdminReplyText(ticket.adminReply || '');
    setAdminNotesText(ticket.adminNotes || '');
  };

  const handleSendReply = () => {
    if (!selectedTicket || !adminReplyText.trim()) return;
    replyToTicket(selectedTicket.id, adminReplyText.trim(), 'resolved');
    setSelectedTicket(null);
  };

  const handleSaveNotesAndStatus = (status: TicketStatus) => {
    if (!selectedTicket) return;
    updateTicketStatus(selectedTicket.id, status, adminNotesText.trim());
    setSelectedTicket(null);
  };

  // Web Theme Aesthetic - Clean Neutral Palette (Soot, Moss, Plaster, Eucalyptus)
  const categoryBadges: Record<TicketCategory, { label: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = {
    complaint: { label: 'Complaint', icon: AlertCircle },
    refund: { label: 'Refund Request', icon: RotateCcw },
    general: { label: 'General Inquiry', icon: HelpCircle }
  };

  // Single-line Status Badges with Subtle Dot Indicators
  const statusBadges: Record<TicketStatus, { label: string; bg: string; dot: string }> = {
    open: { label: 'Open', bg: 'bg-soot text-plaster border border-soot shadow-2xs whitespace-nowrap', dot: 'bg-rose-500' },
    'in-progress': { label: 'In Progress', bg: 'bg-soot/8 text-soot border border-soot/12 whitespace-nowrap', dot: 'bg-amber-500' },
    resolved: { label: 'Resolved', bg: 'bg-eucalyptus/25 text-soot border border-eucalyptus/40 whitespace-nowrap', dot: 'bg-emerald-700' },
    closed: { label: 'Closed', bg: 'bg-soot/5 text-moss border border-soot/10 whitespace-nowrap', dot: 'bg-moss/50' }
  };

  // Single-line Priority Badges
  const priorityBadges: Record<TicketPriority, { label: string; bg: string }> = {
    urgent: { label: 'Urgent', bg: 'bg-soot text-plaster font-bold border border-soot whitespace-nowrap' },
    high: { label: 'High', bg: 'bg-soot/12 text-soot font-semibold border border-soot/15 whitespace-nowrap' },
    medium: { label: 'Medium', bg: 'bg-soot/8 text-soot font-medium border border-soot/10 whitespace-nowrap' },
    low: { label: 'Low', bg: 'bg-soot/5 text-moss font-normal border border-soot/8 whitespace-nowrap' }
  };

  const statusOptions: { value: 'all' | TicketStatus; label: string }[] = [
    { value: 'all', label: 'All Statuses' },
    { value: 'open', label: 'Open' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' }
  ];

  const priorityOptions: { value: 'all' | TicketPriority; label: string }[] = [
    { value: 'all', label: 'All Priorities' },
    { value: 'urgent', label: 'Urgent' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Page Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-soot/5 border border-soot/10 text-moss text-xs font-semibold mb-2">
            <ShieldAlert size={14} className="text-soot" />
            <span>Admin Control Desk</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-normal font-serif-display text-soot tracking-tight">
            Support &amp; Complaints Desk
          </h1>
          <p className="text-moss text-xs sm:text-sm mt-1">
            Review member complaints, process pass refund requests, and answer platform inquiries.
          </p>
        </div>
      </div>

      {/* Website Theme Neutral KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Tickets',
            count: totalCount,
            badge: 'bg-soot/10 text-soot border border-soot/15',
            pct: `${totalCount} logged`,
            icon: MessageSquare,
            iconBg: 'bg-soot text-plaster border-soot/20',
          },
          {
            label: 'Active Complaints',
            count: complaintCount,
            badge: 'bg-soot/10 text-soot border border-soot/15',
            pct: `${complaintCount} active`,
            icon: AlertCircle,
            iconBg: 'bg-soot/10 text-soot border-soot/20',
          },
          {
            label: 'Refund Requests',
            count: refundCount,
            badge: 'bg-soot/10 text-soot border border-soot/15',
            pct: `${refundCount} pending`,
            icon: RotateCcw,
            iconBg: 'bg-soot/10 text-soot border-soot/20',
          },
          {
            label: 'Resolved Tickets',
            count: resolvedCount,
            badge: 'bg-eucalyptus/25 text-soot border border-eucalyptus/35',
            pct: `${Math.round((resolvedCount / (totalCount || 1)) * 100)}%`,
            icon: CheckCircle2,
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
              {stat.pct}
            </span>
          </div>
        ))}
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-plaster-surface rounded-3xl border border-soot/10 p-5 shadow-2xs space-y-4">
        {/* Row 1: Search Input Bar & Filter Dropdowns Inline */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 relative z-30">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-moss" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search ticket #, name, or subject..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-soot/12 bg-plaster-dark/30 text-soot text-xs sm:text-sm placeholder:text-moss/70 outline-none focus:border-eucalyptus focus:bg-plaster-surface transition-all"
            />
          </div>

          {/* Custom Filter Dropdowns Inline */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-semibold text-soot uppercase text-xs tracking-wider flex items-center gap-1.5">
              <Filter size={13} /> Filter By:
            </span>

            {/* Custom Status Dropdown Menu */}
            <div className="relative min-w-40" ref={statusDropdownRef}>
              <button
                type="button"
                onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-plaster-dark/30 hover:bg-plaster-dark/50 border border-soot/12 transition-all duration-200 text-left cursor-pointer focus:outline-none"
              >
                <span className="text-xs sm:text-sm font-semibold text-soot truncate">
                  {statusOptions.find(o => o.value === statusFilter)?.label || 'All Statuses'}
                </span>
                <ChevronDown
                  size={15}
                  className={`text-moss transition-transform duration-200 shrink-0 ${
                    statusDropdownOpen ? 'rotate-180 text-soot' : ''
                  }`}
                />
              </button>

              {statusDropdownOpen && (
                <div className="absolute top-full right-0 mt-1.5 w-44 p-1.5 bg-plaster-surface border border-soot/15 rounded-2xl shadow-xl z-50 animate-in fade-in-50 zoom-in-95 duration-100">
                  <div className="space-y-0.5">
                    {statusOptions.map((item) => {
                      const isSelected = statusFilter === item.value;
                      return (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => {
                            setStatusFilter(item.value);
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

            {/* Custom Priority Dropdown Menu */}
            <div className="relative min-w-40" ref={priorityDropdownRef}>
              <button
                type="button"
                onClick={() => setPriorityDropdownOpen(!priorityDropdownOpen)}
                className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-plaster-dark/30 hover:bg-plaster-dark/50 border border-soot/12 transition-all duration-200 text-left cursor-pointer focus:outline-none"
              >
                <span className="text-xs sm:text-sm font-semibold text-soot truncate">
                  {priorityOptions.find(o => o.value === priorityFilter)?.label || 'All Priorities'}
                </span>
                <ChevronDown
                  size={15}
                  className={`text-moss transition-transform duration-200 shrink-0 ${
                    priorityDropdownOpen ? 'rotate-180 text-soot' : ''
                  }`}
                />
              </button>

              {priorityDropdownOpen && (
                <div className="absolute top-full right-0 mt-1.5 w-44 p-1.5 bg-plaster-surface border border-soot/15 rounded-2xl shadow-xl z-50 animate-in fade-in-50 zoom-in-95 duration-100">
                  <div className="space-y-0.5">
                    {priorityOptions.map((item) => {
                      const isSelected = priorityFilter === item.value;
                      return (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => {
                            setPriorityFilter(item.value);
                            setPriorityDropdownOpen(false);
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

            {(categoryFilter !== 'all' || statusFilter !== 'all' || priorityFilter !== 'all' || searchTerm) && (
              <button
                type="button"
                onClick={() => {
                  setCategoryFilter('all');
                  setStatusFilter('all');
                  setPriorityFilter('all');
                  setSearchTerm('');
                }}
                className="text-xs sm:text-sm text-moss font-semibold hover:text-soot hover:underline cursor-pointer px-2"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Category Topics Tabs Bar Underneath */}
        <div className="pt-3 border-t border-soot/8">
          <div className="inline-flex flex-wrap sm:flex-nowrap items-center gap-1.5 bg-plaster-dark/40 p-1.5 rounded-2xl border border-soot/8 max-w-full overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                categoryFilter === 'all'
                  ? 'bg-soot text-plaster shadow-2xs'
                  : 'text-moss hover:text-soot'
              }`}
            >
              All Topics ({supportTickets.length})
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('complaint')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                categoryFilter === 'complaint'
                  ? 'bg-soot text-plaster shadow-2xs'
                  : 'text-moss hover:text-soot'
              }`}
            >
              <AlertCircle size={14} />
              <span>Complaints ({supportTickets.filter(t => t.category === 'complaint').length})</span>
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('refund')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                categoryFilter === 'refund'
                  ? 'bg-soot text-plaster shadow-2xs'
                  : 'text-moss hover:text-soot'
              }`}
            >
              <RotateCcw size={14} />
              <span>Refund Requests ({supportTickets.filter(t => t.category === 'refund').length})</span>
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('general')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                categoryFilter === 'general'
                  ? 'bg-soot text-plaster shadow-2xs'
                  : 'text-moss hover:text-soot'
              }`}
            >
              <HelpCircle size={14} />
              <span>General Inquiries ({supportTickets.filter(t => t.category === 'general').length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tickets List Table - Full Readable Text, No Truncation */}
      <div className="bg-plaster-surface rounded-3xl border border-soot/10 overflow-hidden shadow-2xs relative z-10">
        {filteredTickets.length === 0 ? (
          <div className="py-16 text-center text-moss space-y-3">
            <HelpCircle size={38} className="mx-auto opacity-30 text-moss" />
            <p className="text-sm sm:text-base font-semibold text-soot">No tickets match your filters</p>
            <p className="text-xs sm:text-sm max-w-sm mx-auto text-moss">
              Try adjusting your search term or topic filter to view customer inquiries.
            </p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px] lg:min-w-0">
              <thead>
                <tr className="bg-plaster-dark/40 text-moss border-b border-soot/10 font-semibold uppercase text-xs tracking-wider">
                  <th className="px-4 py-4 min-w-[130px]">Ticket</th>
                  <th className="px-4 py-4 min-w-[180px]">Customer</th>
                  <th className="px-4 py-4 min-w-[280px]">Topic &amp; Subject</th>
                  <th className="px-4 py-4 min-w-[110px]">Proof</th>
                  <th className="px-4 py-4 min-w-[100px]">Priority</th>
                  <th className="px-4 py-4 min-w-[120px]">Status</th>
                  <th className="px-4 py-4 min-w-[130px]">Submitted</th>
                  <th className="px-4 py-4 text-right min-w-[110px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-soot/8">
                {filteredTickets.map((ticket) => {
                  const CategoryIcon = categoryBadges[ticket.category].icon;
                  const firstInitial = ticket.userName ? ticket.userName.charAt(0).toUpperCase() : 'U';

                  return (
                    <tr
                      key={ticket.id}
                      className="hover:bg-plaster-dark/30 transition-colors group cursor-pointer"
                      onClick={() => handleOpenTicket(ticket)}
                    >
                      {/* Ticket Number & Category Tag */}
                      <td className="px-4 py-4 align-top whitespace-nowrap">
                        <div className="font-mono font-bold text-soot text-sm tracking-wide">
                          {ticket.ticketNumber}
                        </div>
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border border-soot/12 bg-soot/6 text-soot mt-1.5 whitespace-nowrap">
                          <CategoryIcon size={12} className="text-moss shrink-0" />
                          <span>{categoryBadges[ticket.category].label}</span>
                        </span>
                      </td>

                      {/* Customer Info - Full Name & Full Email */}
                      <td className="px-4 py-4 align-top">
                        <div className="flex items-start gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-soot/8 text-soot text-xs font-bold flex items-center justify-center shrink-0 border border-soot/10 mt-0.5">
                            {firstInitial}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-soot text-sm group-hover:text-emerald-950 transition-colors leading-snug">
                              {ticket.userName}
                            </div>
                            <div className="text-moss text-xs font-mono break-all mt-0.5 leading-snug">
                              {ticket.userEmail}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Topic & Subject Only */}
                      <td className="px-4 py-4 align-middle">
                        <div className="font-semibold text-soot text-sm leading-snug">
                          {ticket.subject}
                        </div>
                      </td>

                      {/* Attached Proof */}
                      <td className="px-4 py-4 align-top whitespace-nowrap">
                        {ticket.attachedImage ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewImage(ticket.attachedImage || null);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-plaster-dark/60 hover:bg-soot hover:text-plaster text-soot border border-soot/12 text-xs font-medium transition-all shadow-2xs cursor-pointer whitespace-nowrap"
                          >
                            <Paperclip size={13} className="text-moss group-hover:text-plaster shrink-0" />
                            <span>Attached</span>
                          </button>
                        ) : (
                          <span className="text-moss/40 text-xs font-mono whitespace-nowrap">None</span>
                        )}
                      </td>

                      {/* Priority */}
                      <td className="px-4 py-4 align-top whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-xl font-semibold capitalize whitespace-nowrap ${priorityBadges[ticket.priority].bg}`}>
                          <span>{priorityBadges[ticket.priority].label}</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4 align-top whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-xl font-semibold capitalize whitespace-nowrap ${statusBadges[ticket.status].bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusBadges[ticket.status].dot}`} />
                          <span>{statusBadges[ticket.status].label}</span>
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-4 align-top text-moss text-xs font-mono whitespace-nowrap">
                        {ticket.createdAt}
                      </td>

                      {/* Action */}
                      <td className="px-4 py-4 align-top text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenTicket(ticket);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-soot text-plaster hover:bg-soot/85 text-xs font-semibold transition-all shadow-2xs cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap"
                        >
                          <Eye size={13} />
                          <span>Review</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ticket Review & Response Modal */}
      {selectedTicket && (
        <Modal
          open={!!selectedTicket}
          onClose={() => setSelectedTicket(null)}
          title={`Review Ticket #${selectedTicket.ticketNumber}`}
        >
          <div className="space-y-6 pt-1">
            {/* Ticket Summary Header Card */}
            <div className="p-5 rounded-2xl bg-plaster-surface border border-soot/12 space-y-3 shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-lg border border-soot/12 bg-soot/8 text-soot">
                  {categoryBadges[selectedTicket.category].label}
                </span>
                <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-xl font-semibold capitalize ${statusBadges[selectedTicket.status].bg}`}>
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusBadges[selectedTicket.status].dot}`} />
                  <span>{statusBadges[selectedTicket.status].label}</span>
                </span>
              </div>

              <div>
                <h3 className="text-lg font-serif-display font-medium text-soot leading-snug">
                  {selectedTicket.subject}
                </h3>
                <p className="text-xs text-moss mt-1 font-mono">
                  Submitted on {selectedTicket.createdAt}
                </p>
              </div>
            </div>

            {/* Member Contact Info Card - Clean Grid, No Email Overflow */}
            <div className="p-4 rounded-2xl bg-plaster-dark/30 border border-soot/10 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <UserIcon size={15} className="text-moss shrink-0" />
                <span className="font-medium text-moss shrink-0">Member:</span>
                <span className="font-semibold text-soot truncate">{selectedTicket.userName}</span>
              </div>
              <div className="flex items-center gap-2.5 min-w-0">
                <Mail size={15} className="text-moss shrink-0" />
                <span className="font-medium text-moss shrink-0">Email:</span>
                <span className="font-mono text-soot break-all truncate">{selectedTicket.userEmail}</span>
              </div>
            </div>

            {/* Original Complaint / Question Message */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-soot uppercase tracking-wider block">
                Member Message
              </label>
              <div className="p-4 rounded-2xl bg-plaster-surface border border-soot/12 text-xs sm:text-sm text-soot leading-relaxed whitespace-pre-wrap">
                {selectedTicket.message}
              </div>
            </div>

            {/* Proof Attachment Image */}
            {selectedTicket.attachedImage && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-soot uppercase tracking-wider block flex items-center gap-1.5">
                  <Paperclip size={13} className="text-moss" />
                  Attached Proof Document
                </label>
                <div
                  onClick={() => setPreviewImage(selectedTicket.attachedImage || null)}
                  className="group relative rounded-2xl border border-soot/15 overflow-hidden max-h-52 cursor-pointer bg-plaster-dark/40 flex items-center justify-center p-3"
                >
                  <img
                    src={selectedTicket.attachedImage}
                    alt="Proof Attachment"
                    className="max-h-48 object-contain rounded-xl group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-soot/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1.5">
                    <Eye size={16} /> Click to expand full document
                  </div>
                </div>
              </div>
            )}

            {/* Admin Response Input */}
            <div className="space-y-2 pt-2 border-t border-soot/10">
              <label className="text-xs font-semibold text-soot uppercase tracking-wider block flex items-center gap-1.5">
                <MessageSquare size={13} className="text-moss" />
                Send Response to Member
              </label>
              <textarea
                rows={3}
                value={adminReplyText}
                onChange={(e) => setAdminReplyText(e.target.value)}
                placeholder="Type your official resolution or response to send to the member..."
                className="w-full p-3.5 rounded-2xl border border-soot/12 bg-plaster-surface text-soot text-xs sm:text-sm placeholder:text-moss/60 focus:outline-none focus:ring-2 focus:ring-eucalyptus/40 transition-all"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSendReply}
                  disabled={!adminReplyText.trim()}
                  className="px-4 py-2.5 rounded-xl bg-soot text-plaster hover:bg-soot/85 text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2 shadow-2xs"
                >
                  <Send size={14} />
                  <span>Send Response &amp; Mark Resolved</span>
                </button>
              </div>
            </div>

            {/* Internal Admin Notes */}
            <div className="space-y-2 pt-2 border-t border-soot/10">
              <label className="text-xs font-semibold text-soot uppercase tracking-wider block flex items-center gap-1.5">
                <FileText size={13} className="text-moss" />
                Internal Admin Notes (Staff only)
              </label>
              <textarea
                rows={2}
                value={adminNotesText}
                onChange={(e) => setAdminNotesText(e.target.value)}
                placeholder="Add internal notes for venue managers or admin staff..."
                className="w-full p-3.5 rounded-2xl border border-soot/12 bg-plaster-surface text-soot text-xs sm:text-sm placeholder:text-moss/60 focus:outline-none focus:ring-2 focus:ring-eucalyptus/40 transition-all"
              />
            </div>

            {/* Quick Status Update Buttons - Matching Bookings Admin */}
            <div className="space-y-2 pt-3 border-t border-soot/10">
              <span className="text-xs font-semibold text-soot block uppercase tracking-wider">
                Update Ticket Status
              </span>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { status: 'in-progress' as TicketStatus, label: 'In Progress' },
                  { status: 'resolved' as TicketStatus, label: 'Resolved' },
                  { status: 'closed' as TicketStatus, label: 'Close Ticket' }
                ].map((item) => {
                  const isSelected = selectedTicket.status === item.status;
                  return (
                    <button
                      key={item.status}
                      type="button"
                      onClick={() => handleSaveNotesAndStatus(item.status)}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-center ${
                        isSelected
                          ? 'bg-soot border-soot text-plaster shadow-xs'
                          : 'bg-plaster-surface border-soot/15 text-soot hover:bg-plaster-dark/40 hover:border-soot/30'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Proof Image Fullscreen Modal */}
      {previewImage && (
        <Modal
          open={!!previewImage}
          onClose={() => setPreviewImage(null)}
          title="Attached Proof Document"
        >
          <div className="space-y-4 pt-2">
            <div className="bg-plaster-dark/30 rounded-2xl p-2 border border-soot/10 flex items-center justify-center min-h-[300px]">
              <img
                src={previewImage}
                alt="Proof Preview Full"
                className="max-h-[70vh] w-auto object-contain rounded-xl shadow-md"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="px-4 py-2 rounded-xl bg-soot text-plaster text-xs font-semibold hover:bg-soot/85 transition-colors cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
