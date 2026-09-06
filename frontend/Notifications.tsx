'use client';

import React, { useState } from 'react';
import {
  Bell,
  CheckCheck,
  CalendarDays,
  Info,
  Clock,
  XCircle,
  CreditCard,
  ShieldAlert,
  Trash2,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '@/app/store';

export default function Notifications() {
  const {
    notifications,
    markAllNotificationsRead,
    markNotificationRead,
    toggleNotificationRead,
    deleteNotification,
    clearAllNotifications,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'bookings' | 'reminders' | 'system'>('all');

  const iconFor = (type: string) => {
    switch (type) {
      case 'booking':
        return <CalendarDays size={18} className="text-emerald-600" />;
      case 'cancelled':
        return <XCircle size={18} className="text-rose-500" />;
      case 'reminder':
        return <Clock size={18} className="text-amber-500" />;
      case 'payment':
        return <CreditCard size={18} className="text-blue-500" />;
      case 'system':
        return <ShieldAlert size={18} className="text-indigo-500" />;
      default:
        return <Info size={18} className="text-teal-600" />;
    }
  };

  const badgeBg = (type: string, read: boolean) => {
    if (read) return 'bg-soot/8 text-moss';
    switch (type) {
      case 'booking':
        return 'bg-emerald-100 text-emerald-800';
      case 'cancelled':
        return 'bg-rose-100 text-rose-800';
      case 'reminder':
        return 'bg-amber-100 text-amber-800';
      case 'payment':
        return 'bg-blue-100 text-blue-800';
      case 'system':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-teal-100 text-teal-800';
    }
  };

  // Filtered notifications logic
  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'unread') return !n.read;
    if (activeTab === 'bookings') return n.type === 'booking' || n.type === 'cancelled';
    if (activeTab === 'reminders') return n.type === 'reminder' || n.type === 'payment';
    if (activeTab === 'system') return n.type === 'system' || n.type === 'info';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl text-soot font-semibold" style={{ fontFamily: 'DM Serif Display, serif' }}>
              Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-eucalyptus/20 text-soot border border-eucalyptus/30">
                {unreadCount} new
              </span>
            )}
          </div>
          <p className="text-sm text-moss mt-1">All your account updates, booking status changes, and alerts.</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllNotificationsRead}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-soot/12 bg-white text-xs font-medium text-soot hover:bg-soot/5 transition-colors shadow-2xs cursor-pointer"
            >
              <CheckCheck size={14} /> Mark all read
            </button>
          )}

          {notifications.length > 0 && (
            <button
              type="button"
              onClick={clearAllNotifications}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50/50 text-xs font-medium text-rose-700 hover:bg-rose-100/70 transition-colors cursor-pointer"
              title="Clear all notifications"
            >
              <Trash2 size={14} /> Clear all
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 border-b border-soot/10 pb-2 overflow-x-auto scrollbar-none">
        {[
          { id: 'all', label: 'All', count: notifications.length },
          { id: 'unread', label: 'Unread', count: unreadCount },
          { id: 'bookings', label: 'Bookings', count: notifications.filter(n => n.type === 'booking' || n.type === 'cancelled').length },
          { id: 'reminders', label: 'Reminders & Payments', count: notifications.filter(n => n.type === 'reminder' || n.type === 'payment').length },
          { id: 'system', label: 'System & Info', count: notifications.filter(n => n.type === 'system' || n.type === 'info').length },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-soot text-white shadow-xs'
                : 'text-moss hover:text-soot hover:bg-soot/5'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`px-1.5 py-0.5 text-[10px] rounded-full ${
              activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-soot/8 text-soot'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Notifications List Container */}
      <div className="bg-white rounded-2xl border border-soot/8 shadow-xs overflow-hidden">
        {filteredNotifications.length === 0 ? (
          <div className="py-20 text-center px-4">
            <Bell size={36} className="mx-auto text-moss/40 mb-3" />
            <h3 className="text-base font-semibold text-soot">No notifications found</h3>
            <p className="text-sm text-moss max-w-sm mx-auto mt-1">
              {activeTab === 'unread'
                ? 'You are all caught up on your notifications!'
                : 'You have no notification entries in this section.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-soot/5">
            {filteredNotifications.map(notification => (
              <div
                key={notification.id}
                className={`group flex items-start gap-3.5 p-4 sm:p-5 transition-all ${
                  notification.read ? 'bg-white hover:bg-soot/2' : 'bg-[#EAF1F5]/60 hover:bg-[#EAF1F5]'
                }`}
              >
                {/* Icon Badge */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${badgeBg(notification.type, notification.read)}`}>
                  {iconFor(notification.type)}
                </div>

                {/* Notification Content */}
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => markNotificationRead(notification.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h2 className={`text-sm ${notification.read ? 'font-medium text-soot' : 'font-bold text-soot'}`}>
                      {notification.title}
                    </h2>
                    {!notification.read && (
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 mt-1 shadow-xs" title="Unread" />
                    )}
                  </div>
                  <p className="text-sm text-moss mt-1 leading-relaxed">{notification.message}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-moss/70 font-medium">
                    <span>{notification.createdAt}</span>
                    <span className="capitalize px-2 py-0.5 rounded-md bg-soot/5 text-soot/70 text-[10px]">
                      {notification.type}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleNotificationRead(notification.id)}
                    className="p-2 rounded-lg text-moss hover:text-soot hover:bg-soot/10 transition-colors cursor-pointer"
                    title={notification.read ? 'Mark as Unread' : 'Mark as Read'}
                  >
                    {notification.read ? <RotateCcw size={15} /> : <CheckCircle2 size={15} className="text-emerald-600" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteNotification(notification.id)}
                    className="p-2 rounded-lg text-moss hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Delete Notification"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}