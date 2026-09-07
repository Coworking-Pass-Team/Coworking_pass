'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Space, Booking, Screen, NavState, UserRole, BookingType, PaymentCard, Notification, CartItem, AmenityRequest, AmenityRequestStatus, calculateEndDate, isCancellationRefundEligible, getBookingPrice, OtpSession } from '@/types/types';
import { INITIAL_SPACES, INITIAL_USERS, INITIAL_BOOKINGS, INITIAL_NOTIFICATIONS } from '@/data/data';

interface AppContextType {
  // Navigation
  nav: NavState;
  navigate: (screen: Screen, params?: Record<string, any>) => void;
  goBack: () => void;

  // Auth & 2FA OTP
  currentUser: User | null;
  otpSession: OtpSession | null;
  login: (email: string, password: string) => { success: boolean; error?: string; requireOtp?: boolean };
  signup: (name: string, email: string, password: string, phone: string) => User;
  requestSignupOtp: (newUser: User, role: UserRole, extraData?: Partial<User>) => void;
  requestForgotPasswordOtp: (email: string) => { success: boolean; error?: string };
  resetPassword: (newPassword: string) => { success: boolean; error?: string };
  completeSignup: (role: UserRole, extraData?: Partial<User>) => void;
  verifyOtp: (code: string) => { success: boolean; error?: string };
  resendOtp: () => void;
  cancelOtp: () => void;
  startOtpVerification: (session: OtpSession) => void;
  logout: () => void;
  setPendingUser: (user: Partial<User>) => void;
  pendingUser: Partial<User> | null;
  pendingResetUser: User | null;
  updateCurrentUser: (updates: Partial<User>) => void;

  // Spaces
  spaces: Space[];
  favorites: string[];
  toggleFavorite: (spaceId: string) => void;
  addSpace: (space: Omit<Space, 'id'>) => void;
  updateSpace: (id: string, updates: Partial<Space>) => void;
  toggleSpaceVisibility: (id: string) => void;
  deleteSpace: (id: string) => void;

  // Bookings
  bookings: Booking[];
  addBooking: (booking: Omit<Booking, 'id' | 'createdAt'>) => Booking;
  cancelBooking: (id: string, refundMethod?: 'wallet' | 'card') => void;
  updateBookingStatus: (id: string, status: Booking['status']) => void;

  // Amenity Requests (Provider -> Admin)
  amenityRequests: AmenityRequest[];
  approvedCustomAmenities: string[];
  requestCustomAmenity: (amenityName: string, spaceId?: string, spaceName?: string) => { success: boolean; message: string; request?: AmenityRequest };
  approveAmenityRequest: (requestId: string) => void;
  rejectAmenityRequest: (requestId: string, reason?: string) => void;
  getApprovedAmenities: () => string[];

  // Notifications
  notifications: Notification[];
  unreadNotificationsCount: number;
  markNotificationRead: (id: string) => void;
  toggleNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAllNotifications: () => void;
  addNotification: (notif: Omit<Notification, 'id' | 'createdAt' | 'read'> & { read?: boolean }) => Notification;
  generateFakeNotification: (presetType?: string, customTitle?: string, customMessage?: string) => Notification;

  // Users (admin)
  users: User[];
  blockUser: (id: string) => void;
  unblockUser: (id: string) => void;
  changeUserRole: (id: string, role: UserRole) => void;

  // Waitlist & Auto-booking
  waitlist: Record<string, boolean>;
  autobooking: Record<string, boolean>;
  autobookingCard: Record<string, string>;
  joinWaitlist: (spaceId: string) => void;
  leaveWaitlist: (spaceId: string) => void;
  enableAutoBooking: (spaceId: string, cardId: string) => void;
  disableAutoBooking: (spaceId: string) => void;

  // Payment cards
  addPaymentCard: (card: Omit<PaymentCard, 'id'>) => PaymentCard;

  // Shopping Cart (نفس كودك الأصلي تماماً)
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'id'>) => void;
  removeFromCart: (cartItemId: string) => void;
  updateCartItemSeats: (cartItemId: string, seats: number) => void;
  updateCartItem: (cartItemId: string, updates: Partial<CartItem>) => void;
  clearCart: () => void;
  checkoutCart: (pointsToUse?: number) => Booking[];

  // Loyalty Points (الميزة المضافة من كودهم)
  applyLoyaltyDiscount: (pointsToUse: number) => { discount: number; safePoints: number };

  // Toast
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [nav, setNav] = useState<NavState>({ screen: 'landing', params: {} });
  const [history, setHistory] = useState<NavState[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [pendingUser, setPendingUser] = useState<Partial<User> | null>(null);
  const [pendingResetUser, setPendingResetUser] = useState<User | null>(null);
  const [otpSession, setOtpSession] = useState<OtpSession | null>(null);
  const [spaces, setSpaces] = useState<Space[]>(INITIAL_SPACES);
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [favorites, setFavorites] = useState<string[]>(['space-1', 'space-3']);
  const [waitlist, setWaitlist] = useState<Record<string, boolean>>({});
  const [autobooking, setAutobooking] = useState<Record<string, boolean>>({});
  const [autobookingCard, setAutobookingCard] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<AppContextType['toast']>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [amenityRequests, setAmenityRequests] = useState<AmenityRequest[]>([
    {
      id: 'req-1',
      amenityName: '3D Printing Studio',
      providerId: 'user-p1',
      providerName: 'DeskFlow Workspace Co.',
      spaceId: 'space-1',
      spaceName: 'HubSpot Innovation Center',
      status: 'PENDING_APPROVAL',
      createdAt: '2026-09-06T10:00:00Z',
    },
    {
      id: 'req-2',
      amenityName: 'Podcast Recording Studio',
      providerId: 'user-p1',
      providerName: 'DeskFlow Workspace Co.',
      spaceId: 'space-2',
      spaceName: 'Creative Hive Riyadh',
      status: 'APPROVED',
      createdAt: '2026-09-05T14:30:00Z',
    },
  ]);
  const [approvedCustomAmenities, setApprovedCustomAmenities] = useState<string[]>(['Podcast Recording Studio']);

  const sanitizeBookings = (list: Booking[]): Booking[] => {
    const seen = new Set<string>();
    return list.map((b, idx) => {
      let uniqueId = b.id;
      if (!uniqueId || seen.has(uniqueId)) {
        uniqueId = `${b.id || 'booking'}-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`;
      }
      seen.add(uniqueId);
      return { ...b, id: uniqueId };
    });
  };

  const sanitizeNotifications = (list: Notification[]): Notification[] => {
    const seen = new Set<string>();
    return list.map((n, idx) => {
      let uniqueId = n.id;
      if (!uniqueId || seen.has(uniqueId)) {
        uniqueId = `${n.id || 'notif'}-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`;
      }
      seen.add(uniqueId);
      return { ...n, id: uniqueId };
    });
  };

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('cp_currentUser');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed.avatar && (parsed.avatar.includes('images.unsplash.com') || parsed.avatar.includes('admin-avatar'))) {
          parsed.avatar = '';
          localStorage.setItem('cp_currentUser', JSON.stringify(parsed));
        }
        setCurrentUser(parsed);
      }
      const savedUsers = localStorage.getItem('cp_users');
      let combinedUsers = INITIAL_USERS;
      if (savedUsers) {
        try {
          const parsed = JSON.parse(savedUsers) as User[];
          const mergedMap = new Map<string, User>();
          parsed.forEach(u => mergedMap.set(u.email.toLowerCase(), u));
          INITIAL_USERS.forEach(initU => {
            const existing = mergedMap.get(initU.email.toLowerCase());
            if (!existing) {
              mergedMap.set(initU.email.toLowerCase(), initU);
            } else {
              mergedMap.set(initU.email.toLowerCase(), {
                ...existing,
                membershipTier: initU.membershipTier || existing.membershipTier,
                hasActivePass: initU.hasActivePass !== undefined ? initU.hasActivePass : existing.hasActivePass,
                loyaltyPoints: existing.loyaltyPoints ?? (initU as any).loyaltyPoints ?? 0,
              });
            }
          });
          combinedUsers = Array.from(mergedMap.values());
        } catch (err) {
          console.error('Failed to parse saved users:', err);
        }
      }
      const cleanedUsers = combinedUsers.map(u => {
        if (u.avatar && (u.avatar.includes('images.unsplash.com') || u.avatar.includes('admin-avatar'))) {
          return { ...u, avatar: '' };
        }
        return u;
      });
      setUsers(cleanedUsers);
      localStorage.setItem('cp_users', JSON.stringify(cleanedUsers));

      const savedBookings = localStorage.getItem('cp_bookings');
      if (savedBookings) {
        try {
          const parsed = JSON.parse(savedBookings);
          const sanitized = sanitizeBookings(parsed);
          setBookings(sanitized);
          localStorage.setItem('cp_bookings', JSON.stringify(sanitized));
        } catch (e) {
          setBookings(sanitizeBookings(INITIAL_BOOKINGS));
        }
      } else {
        const sanitized = sanitizeBookings(INITIAL_BOOKINGS);
        setBookings(sanitized);
        localStorage.setItem('cp_bookings', JSON.stringify(sanitized));
      }

      const savedNotifs = localStorage.getItem('cp_notifications');
      if (savedNotifs) {
        try {
          const parsed = JSON.parse(savedNotifs);
          const sanitized = sanitizeNotifications(parsed);
          setNotifications(sanitized);
          localStorage.setItem('cp_notifications', JSON.stringify(sanitized));
        } catch (e) {
          setNotifications(sanitizeNotifications(INITIAL_NOTIFICATIONS));
        }
      } else {
        const sanitized = sanitizeNotifications(INITIAL_NOTIFICATIONS);
        setNotifications(sanitized);
        localStorage.setItem('cp_notifications', JSON.stringify(INITIAL_NOTIFICATIONS));
      }

      const savedCart = localStorage.getItem('cp_cart');
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }

      const savedAmenityReqs = localStorage.getItem('cp_amenity_requests');
      if (savedAmenityReqs) {
        try {
          setAmenityRequests(JSON.parse(savedAmenityReqs));
        } catch (e) {
          // Keep default state
        }
      }

      const savedApprovedAmenities = localStorage.getItem('cp_approved_amenities');
      if (savedApprovedAmenities) {
        try {
          setApprovedCustomAmenities(JSON.parse(savedApprovedAmenities));
        } catch (e) {
          // Keep default state
        }
      }
    } catch (e) {
      console.error('Failed to load storage state:', e);
    }
  }, []);

  const navigate = (screen: Screen, params: Record<string, any> = {}) => {
    setHistory(prev => [...prev.slice(-9), nav]);
    setNav({ screen, params });
    if (typeof window !== 'undefined') window.scrollTo(0, 0);
  };

  const goBack = () => {
    if (history.length > 0) {
      const prev = history[history.length - 1];
      setHistory(h => h.slice(0, -1));
      setNav(prev);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const startOtpVerification = (session: OtpSession) => {
    setOtpSession(session);
    navigate('otp-verify');
  };

  const login = (email: string, password: string) => {
    let user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (!user) {
      user = INITIAL_USERS.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    }
    if (!user) return { success: false, error: 'Invalid email or password. Please try again.' };
    if (user.isBlocked) return { success: false, error: 'Your account has been suspended. Please contact support.' };

    const session: OtpSession = {
      user,
      targetEmailOrPhone: user.email || email,
      mode: 'login',
      role: user.role,
    };
    setOtpSession(session);
    navigate('otp-verify');
    showToast(`Verification code sent to ${user.email}`, 'info');
    return { success: true, requireOtp: true };
  };

  const signup = (name: string, email: string, password: string, phone: string) => {
    const generatedUsername = name.trim().toLowerCase().replace(/[^a-z0-9_]/g, '') || `user_${Date.now().toString().slice(-4)}`;
    const newUser: User = {
      id: `user-${Date.now()}`,
      name,
      username: generatedUsername,
      email,
      password,
      role: 'individual',
      phone,
      avatar: '',
      isBlocked: false,
      joinDate: new Date().toISOString().split('T')[0],
      university: '',
      bio: '',
      loyaltyPoints: 0,
    };
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    setPendingUser(newUser);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cp_users', JSON.stringify(updatedUsers));
    }
    return newUser;
  };

  const requestSignupOtp = (newUser: User, role: UserRole, extraData?: Partial<User>) => {
    const session: OtpSession = {
      user: newUser,
      targetEmailOrPhone: newUser.email || newUser.phone,
      mode: 'signup',
      role,
      extraData,
    };
    setOtpSession(session);
    navigate('otp-verify');
    showToast(`Verification code sent to ${newUser.email || newUser.phone}`, 'info');
  };

  const requestForgotPasswordOtp = (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    let user = users.find(u => u.email.toLowerCase() === cleanEmail || u.username?.toLowerCase() === cleanEmail);
    if (!user) {
      user = INITIAL_USERS.find(u => u.email.toLowerCase() === cleanEmail || u.username?.toLowerCase() === cleanEmail);
    }
    if (!user) {
      return { success: false, error: 'No account found with this email address. Please check and try again.' };
    }
    if (user.isBlocked) {
      return { success: false, error: 'This account has been suspended. Please contact support.' };
    }

    const session: OtpSession = {
      user,
      targetEmailOrPhone: user.email || email,
      mode: 'forgot-password',
      role: user.role,
    };
    setOtpSession(session);
    navigate('otp-verify');
    showToast(`Verification code sent to ${user.email}`, 'info');
    return { success: true };
  };

  const verifyOtp = (code: string) => {
    if (!otpSession) {
      return { success: false, error: 'No active verification session. Please sign in again.' };
    }
    const cleanCode = code.trim();
    if (cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) {
      return { success: false, error: 'Please enter a valid 6-digit verification code.' };
    }

    if (otpSession.mode === 'login') {
      const user = otpSession.user;
      setCurrentUser(user);
      if (typeof window !== 'undefined') {
        localStorage.setItem('cp_currentUser', JSON.stringify(user));
      }
      setOtpSession(null);
      if (user.role === 'admin') navigate('admin-dashboard');
      else if (user.role === 'organization') navigate('org-dashboard');
      else if (user.role === 'provider') navigate('provider-dashboard');
      else navigate('ind-dashboard');
      showToast(`Welcome back, ${user.name}!`, 'success');
      return { success: true };
    }

    if (otpSession.mode === 'forgot-password') {
      const user = otpSession.user;
      setPendingResetUser(user);
      setOtpSession(null);
      navigate('reset-password');
      showToast('Identity verified. Please set your new password.', 'success');
      return { success: true };
    }

    // signup mode
    const updated: User = {
      ...otpSession.user,
      role: otpSession.role || 'individual',
      avatar: otpSession.user.avatar || '',
      ...(otpSession.extraData || {}),
    };
    const updatedUsers = users.some(u => u.id === updated.id)
      ? users.map(u => u.id === updated.id ? updated : u)
      : [...users, updated];
    setUsers(updatedUsers);
    setCurrentUser(updated);
    setPendingUser(null);
    setOtpSession(null);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cp_currentUser', JSON.stringify(updated));
      localStorage.setItem('cp_users', JSON.stringify(updatedUsers));
    }
    if (updated.role === 'organization') navigate('org-dashboard');
    else if (updated.role === 'provider') navigate('provider-dashboard');
    else navigate('ind-dashboard');
    showToast(`Account verified! Welcome to Coworking Pass, ${updated.name}!`, 'success');
    return { success: true };
  };

  const resetPassword = (newPassword: string) => {
    if (!pendingResetUser) {
      return { success: false, error: 'No active password reset session. Please request a verification code again.' };
    }
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }
    const updatedUser: User = {
      ...pendingResetUser,
      password: newPassword,
    };
    const updatedUsers = users.some(u => u.id === updatedUser.id)
      ? users.map(u => u.id === updatedUser.id ? updatedUser : u)
      : [...users, updatedUser];

    setUsers(updatedUsers);
    setPendingResetUser(null);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cp_users', JSON.stringify(updatedUsers));
    }
    navigate('login');
    showToast('Password updated successfully! Please sign in with your new password.', 'success');
    return { success: true };
  };

  const resendOtp = () => {
    if (!otpSession) return;
    showToast(`New verification code sent to ${otpSession.targetEmailOrPhone}`, 'info');
  };

  const cancelOtp = () => {
    const prevMode = otpSession?.mode || 'login';
    setOtpSession(null);
    if (prevMode === 'signup') navigate('signup');
    else if (prevMode === 'forgot-password') navigate('forgot-password');
    else navigate('login');
  };

  const completeSignup = (role: UserRole, extraData?: Partial<User>) => {
    if (!pendingUser) return;
    const updated: User = {
      ...(pendingUser as User),
      role,
      avatar: pendingUser.avatar || '',
      ...(extraData || {}),
    };
    const updatedUsers = users.map(u => u.id === updated.id ? updated : u);
    setUsers(updatedUsers);
    setCurrentUser(updated);
    setPendingUser(null);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cp_currentUser', JSON.stringify(updated));
      localStorage.setItem('cp_users', JSON.stringify(updatedUsers));
    }
    if (role === 'organization') navigate('org-dashboard');
    else if (role === 'provider') navigate('provider-dashboard');
    else navigate('ind-dashboard');
    showToast('Welcome to Coworking Pass!');
  };

  const updateCurrentUser = (updates: Partial<User>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...updates };
    setCurrentUser(updated);
    const updatedUsers = users.map(u => u.id === updated.id ? updated : u);
    setUsers(updatedUsers);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cp_currentUser', JSON.stringify(updated));
      localStorage.setItem('cp_users', JSON.stringify(updatedUsers));
    }
    showToast('Profile updated successfully.');
  };

  const logout = () => {
    setCurrentUser(null);
    setPendingUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cp_currentUser');
    }
    navigate('landing');
    showToast('You have been logged out.', 'info');
  };

  const toggleFavorite = (spaceId: string) => {
    setFavorites(prev =>
      prev.includes(spaceId) ? prev.filter(id => id !== spaceId) : [...prev, spaceId]
    );
  };

  const addSpace = (space: Omit<Space, 'id'>) => {
    const newSpace: Space = { ...space, id: `space-${Date.now()}` };
    setSpaces(prev => [...prev, newSpace]);
    showToast('Space added successfully.');
  };

  const updateSpace = (id: string, updates: Partial<Space>) => {
    setSpaces(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    showToast('Space updated successfully.');
  };

  const toggleSpaceVisibility = (id: string) => {
    setSpaces(prev => prev.map(s => s.id === id ? { ...s, isVisible: !s.isVisible } : s));
  };

  const deleteSpace = (id: string) => {
    setSpaces(prev => prev.filter(s => s.id !== id));
    showToast('Space deleted.');
  };

  const addBooking = (booking: Omit<Booking, 'id' | 'createdAt'>) => {
    const newBooking: Booking = {
      ...booking,
      id: `booking-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setBookings(prev => [...prev, newBooking]);
    
    // Auto-calculate loyalty points earned
    const space = spaces.find(s => s.id === booking.spaceId);
    const multiplier = space?.loyaltyPointsMultiplier || 1;
    const earnedPoints = Math.floor((booking.totalPrice || 0) / 100) * 10 * multiplier;

    if (currentUser && currentUser.id === booking.userId && earnedPoints > 0) {
      const updatedUser = {
        ...currentUser,
        loyaltyPoints: (currentUser.loyaltyPoints || 0) + earnedPoints,
      };
      setCurrentUser(updatedUser);
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
      if (typeof window !== 'undefined') {
        localStorage.setItem('cp_currentUser', JSON.stringify(updatedUser));
      }
    }

    setNotifications(prev => [{
      id: `notification-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId: booking.userId,
      title: 'Booking confirmed',
      message: `${booking.spaceName} confirmed.${earnedPoints > 0 ? ` Earned ${earnedPoints} loyalty points!` : ''}`,
      type: 'booking',
      read: false,
      createdAt: new Date().toLocaleString(),
    }, ...prev]);

    setSpaces(prev => prev.map(s =>
      s.id === booking.spaceId
        ? { ...s, availableCapacity: Math.max(0, s.availableCapacity - booking.seats) }
        : s
    ));
    return newBooking;
  };

  const cancelBooking = (id: string, refundMethod: 'wallet' | 'card' = 'wallet') => {
    const booking = bookings.find((b) => b.id === id);
    if (!booking) return;

    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: 'cancelled' } : b)));
    setSpaces((prev) =>
      prev.map((s) =>
        s.id === booking.spaceId
          ? { ...s, availableCapacity: Math.min(s.totalCapacity, s.availableCapacity + booking.seats) }
          : s
      )
    );

    const price = getBookingPrice(booking, spaces);
    const userRole = currentUser?.id === booking.userId ? currentUser?.role : 'individual';
    const { eligible, requiredHours } = isCancellationRefundEligible(booking.startDate, booking.startTime, userRole);

    if (currentUser && currentUser.id === booking.userId) {
      let updatedUser = { ...currentUser };
      let msg = '';

      if (eligible) {
        if (refundMethod === 'wallet') {
          const currentWallet = currentUser.walletBalance || 0;
          updatedUser = { ...currentUser, walletBalance: currentWallet + price };
          msg = `Booking cancelled. SAR ${price.toLocaleString()} refunded to your wallet balance.`;
        } else {
          msg = `Booking cancelled. Refund of SAR ${price.toLocaleString()} initiated to original card (5-14 business days).`;
        }
      } else {
        msg = `Booking cancelled. As per Legal Policy, cancellations within ${requiredHours}h of start time are non-refundable.`;
      }

      setCurrentUser(updatedUser);
      const updatedUsers = users.map((u) => (u.id === updatedUser.id ? updatedUser : u));
      setUsers(updatedUsers);
      if (typeof window !== 'undefined') {
        localStorage.setItem('cp_currentUser', JSON.stringify(updatedUser));
        localStorage.setItem('cp_users', JSON.stringify(updatedUsers));
      }

      addNotification({
        userId: currentUser.id,
        title: 'Booking Cancelled',
        message: msg,
        type: 'cancelled',
      });

      showToast(msg, eligible ? 'info' : 'error');
    } else {
      showToast('Booking cancelled successfully.', 'info');
    }
  };

  const updateBookingStatus = (id: string, status: Booking['status']) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    const booking = bookings.find(b => b.id === id);
    if (booking) {
      setNotifications(prev => [{
        id: `notification-${Date.now()}`,
        userId: booking.userId,
        title: `Booking ${status}`,
        message: `${booking.spaceName} booking status was updated to ${status}.`,
        type: status === 'cancelled' ? 'cancelled' : 'booking',
        read: false,
        createdAt: new Date().toLocaleString(),
      }, ...prev]);
    }
  };

  const userNotifications = currentUser ? notifications.filter(n => n.userId === currentUser.id || currentUser.role === 'admin') : [];

  const markNotificationRead = (id: string) => setNotifications(prev => {
    const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
    if (typeof window !== 'undefined') localStorage.setItem('cp_notifications', JSON.stringify(updated));
    return updated;
  });

  const toggleNotificationRead = (id: string) => setNotifications(prev => {
    const updated = prev.map(n => n.id === id ? { ...n, read: !n.read } : n);
    if (typeof window !== 'undefined') localStorage.setItem('cp_notifications', JSON.stringify(updated));
    return updated;
  });

  const markAllNotificationsRead = () => setNotifications(prev => {
    const updated = prev.map(n => userNotifications.some(u => u.id === n.id) ? { ...n, read: true } : n);
    if (typeof window !== 'undefined') localStorage.setItem('cp_notifications', JSON.stringify(updated));
    return updated;
  });

  const deleteNotification = (id: string) => {
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== id);
      if (typeof window !== 'undefined') localStorage.setItem('cp_notifications', JSON.stringify(updated));
      return updated;
    });
    showToast('Notification removed', 'info');
  };

  const clearAllNotifications = () => {
    setNotifications(prev => {
      const userNotifIds = new Set(userNotifications.map(u => u.id));
      const updated = prev.filter(n => !userNotifIds.has(n.id));
      if (typeof window !== 'undefined') localStorage.setItem('cp_notifications', JSON.stringify(updated));
      return updated;
    });
    showToast('All notifications cleared', 'info');
  };

  const addNotification = (notifData: Omit<Notification, 'id' | 'createdAt' | 'read'> & { read?: boolean }): Notification => {
    const newNotif: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      userId: notifData.userId || currentUser?.id || 'user-1',
      title: notifData.title,
      message: notifData.message,
      type: notifData.type || 'info',
      read: notifData.read ?? false,
      createdAt: 'Just now',
    };
    setNotifications(prev => {
      const updated = [newNotif, ...prev];
      if (typeof window !== 'undefined') localStorage.setItem('cp_notifications', JSON.stringify(updated));
      return updated;
    });
    return newNotif;
  };

  const generateFakeNotification = (presetType: string = 'booking', customTitle?: string, customMessage?: string): Notification => {
    const userId = currentUser?.id || 'user-1';
    let title = customTitle || '';
    let message = customMessage || '';
    let type: Notification['type'] = 'booking';

    if (!customTitle || !customMessage) {
      switch (presetType) {
        case 'booking':
          title = 'Booking Confirmed!';
          message = 'Your reservation at The Hub Riyadh has been confirmed for tomorrow at 9:00 AM.';
          type = 'booking';
          break;
        case 'reminder':
          title = 'Pass Expiring Soon';
          message = 'Your All-Access Pass will renew in 3 days. Ensure your billing card is up to date.';
          type = 'reminder';
          break;
        case 'info':
          title = 'Waitlist Spot Available!';
          message = 'A hot desk opened up at WorkBay Jeddah. Click here to confirm your reservation.';
          type = 'info';
          break;
        case 'payment':
          title = 'Payment Received';
          message = 'SAR 150.00 successfully processed for Daily Pass booking #BP-8821.';
          type = 'payment';
          break;
        case 'system':
          title = 'System Maintenance';
          message = 'Coworking Pass platform upgraded with instant auto-booking capabilities.';
          type = 'system';
          break;
        default:
          title = 'Test Notification';
          message = 'This is a mock notification generated for testing user notification flows.';
          type = 'info';
      }
    } else {
      type = (presetType as Notification['type']) || 'info';
    }

    return addNotification({ userId, title, message, type });
  };

  const blockUser = (id: string) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, isBlocked: true } : u));
    showToast('User has been blocked.');
  };

  const unblockUser = (id: string) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, isBlocked: false } : u));
    showToast('User has been unblocked.');
  };

  const changeUserRole = (id: string, role: UserRole) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u));
    showToast('User permissions updated.');
  };

  const joinWaitlist = (spaceId: string) => {
    const userId = currentUser?.id || 'user-1';
    const key = `${userId}_${spaceId}`;
    setWaitlist(prev => ({ ...prev, [key]: true }));
    const space = spaces.find(s => s.id === spaceId);
    addNotification({
      userId,
      title: 'Joined Waitlist',
      message: `You joined the waitlist for ${space?.name || 'the workspace'}. We'll notify you as soon as a spot opens!`,
      type: 'info',
    });
    showToast('You have joined the priority waitlist! We\'ll notify you when a spot opens.');
  };

  const leaveWaitlist = (spaceId: string) => {
    const userId = currentUser?.id || 'user-1';
    const key = `${userId}_${spaceId}`;
    setWaitlist(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    showToast('You have left the priority waitlist.', 'info');
  };

  const enableAutoBooking = (spaceId: string, cardId: string) => {
    const userId = currentUser?.id || 'user-1';
    const key = `${userId}_${spaceId}`;
    setAutobooking(prev => ({ ...prev, [key]: true }));
    setAutobookingCard(prev => ({ ...prev, [key]: cardId }));
    const space = spaces.find(s => s.id === spaceId);
    addNotification({
      userId,
      title: 'Auto-Booking Activated',
      message: `Auto-Booking enabled for ${space?.name || 'workspace'}. We'll automatically book and notify you when a desk opens.`,
      type: 'info',
    });
    showToast('Auto-Booking enabled! We\'ll charge your saved card and reserve automatically when a spot opens.', 'success');
  };

  const disableAutoBooking = (spaceId: string) => {
    const userId = currentUser?.id || 'user-1';
    const key = `${userId}_${spaceId}`;
    setAutobooking(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setAutobookingCard(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    showToast('Auto-Booking disabled.', 'info');
  };

  const addPaymentCard = (card: Omit<PaymentCard, 'id'>) => {
    const newCard: PaymentCard = { ...card, id: `card-${Date.now()}` };
    if (currentUser) {
      const updated = { ...currentUser, savedCards: [...(currentUser.savedCards || []), newCard] };
      setCurrentUser(updated);
      setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
    }
    return newCard;
  };

  // دوال السلة الخاصة بك
  const saveCartToStorage = (newCart: CartItem[]) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('cp_cart', JSON.stringify(newCart));
      } catch (e) {
        console.error('Failed to save cart state:', e);
      }
    }
  };

  const addToCart = (item: Omit<CartItem, 'id'>) => {
    const newItem: CartItem = {
      ...item,
      id: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    const updated = [...cart, newItem];
    setCart(updated);
    saveCartToStorage(updated);
    showToast(`Added ${item.spaceName} to your cart!`, 'success');
  };

  const removeFromCart = (cartItemId: string) => {
    const updated = cart.filter((i) => i.id !== cartItemId);
    setCart(updated);
    saveCartToStorage(updated);
    showToast('Item removed from cart.', 'info');
  };

  const updateCartItemSeats = (cartItemId: string, seats: number) => {
    if (seats < 1) return;
    updateCartItem(cartItemId, { seats });
  };

  const updateCartItem = (cartItemId: string, updates: Partial<CartItem>) => {
    const updated = cart.map((i) => {
      if (i.id === cartItemId) {
        const newItem = { ...i, ...updates };

        // Recalculate end date if start date, plan or durationMonths updated
        if (updates.startDate !== undefined || updates.plan !== undefined || updates.durationMonths !== undefined) {
          const sDate = updates.startDate ?? i.startDate;
          const plan = updates.plan ?? i.plan;
          const durM = updates.durationMonths ?? i.durationMonths ?? 1;
          newItem.endDate = calculateEndDate(sDate, plan, durM);
        }

        // Recalculate end time for hourly plan if startTime or durationHours changed
        if (newItem.plan === 'hourly' && newItem.startTime) {
          const durH = newItem.durationHours || 1;
          const [h, m] = newItem.startTime.split(':').map(Number);
          if (!isNaN(h)) {
            const endH = (h + durH) % 24;
            newItem.endTime = `${endH.toString().padStart(2, '0')}:${(m || 0).toString().padStart(2, '0')}`;
          }
        }

        // Recalculate item total price
        const seats = newItem.seats || 1;
        if (newItem.plan === 'hourly') {
          const hours = newItem.durationHours || 1;
          newItem.itemTotal = newItem.pricePerSeat * hours * seats;
        } else if (newItem.plan === 'monthly') {
          const months = newItem.durationMonths || 1;
          newItem.itemTotal = newItem.pricePerSeat * months * seats;
        } else {
          newItem.itemTotal = newItem.pricePerSeat * seats;
        }

        return newItem;
      }
      return i;
    });

    setCart(updated);
    saveCartToStorage(updated);
  };

  const clearCart = () => {
    setCart([]);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('cp_cart');
      } catch (e) {
        console.error(e);
      }
    }
  };

  // دالة استخدام النقاط كخصم (من كودهم)
  const applyLoyaltyDiscount = (pointsToUse: number) => {
    if (!currentUser) return { discount: 0, safePoints: 0 };
    const availablePoints = currentUser.loyaltyPoints || 0;
    const safePoints = Math.max(0, Math.min(Math.floor(pointsToUse / 100) * 100, availablePoints));
    const discount = (safePoints / 100) * 25; // كل 100 نقطة = 25 ريالاً
    return { discount, safePoints };
  };

  // دالة الدفع مع إبقاء التوقيع نفسه، وتحديث النقاط المكتسبة تلقائياً
  const checkoutCart = (pointsToUse: number = 0): Booking[] => {
    if (!currentUser || cart.length === 0) return [];

    const rawTotal = cart.reduce((sum, item) => sum + item.itemTotal, 0);
    const userPoints = currentUser.loyaltyPoints || 0;
    const usableUserPoints = Math.floor(userPoints / 100) * 100;
    const pointsNeeded = Math.max(100, Math.ceil(rawTotal / 25) * 100);
    const safePointsToUse = Math.max(
      0,
      Math.min(Math.floor(pointsToUse / 100) * 100, usableUserPoints, pointsNeeded)
    );
    const rawDiscount = (safePointsToUse / 100) * 25;
    const pointsDiscount = Math.min(rawTotal, rawDiscount);
    const discountRatio = rawTotal > 0 ? pointsDiscount / rawTotal : 0;

    const newBookings: Booking[] = [];
    cart.forEach((item) => {
      const itemDiscount = item.itemTotal * discountRatio;
      const finalItemPrice = Math.max(0, item.itemTotal - itemDiscount);

      const b = addBooking({
        userId: currentUser.id,
        spaceId: item.spaceId,
        spaceName: item.spaceName,
        spaceCity: item.spaceCity,
        spaceAddress: item.spaceAddress,
        spaceImage: item.spaceImage,
        type: item.type as BookingType,
        plan: item.plan,
        startTime: item.startTime,
        endTime: item.endTime,
        durationHours: item.durationHours,
        startDate: item.startDate,
        endDate: item.endDate,
        seats: item.seats,
        employees: item.employees || [],
        totalPrice: finalItemPrice,
        status: 'active',
        notes: item.notes,
      });
      newBookings.push(b);
    });

    // احتساب نقاط الولاء المكتسبة بناءً على كودهم
    const earned = cart.reduce((sum, item) => {
      const space = spaces.find((s) => s.id === item.spaceId);
      const multiplier = space?.loyaltyPointsMultiplier || 1;
      return sum + Math.floor(item.itemTotal / 100) * 10 * multiplier;
    }, 0);

    const updatedPoints = Math.max(0, userPoints - safePointsToUse) + earned;
    const updatedUser = { ...currentUser, loyaltyPoints: updatedPoints };
    setCurrentUser(updatedUser);
    const updatedUsers = users.map((u) => (u.id === updatedUser.id ? updatedUser : u));
    setUsers(updatedUsers);

    if (typeof window !== 'undefined') {
      localStorage.setItem('cp_currentUser', JSON.stringify(updatedUser));
      localStorage.setItem('cp_users', JSON.stringify(updatedUsers));
    }

    clearCart();

    addNotification({
      userId: currentUser.id,
      title: 'Batch Checkout Successful',
      message: `Payment confirmed for ${newBookings.length} workspace pass${
        newBookings.length > 1 ? 'es' : ''
      }.${safePointsToUse > 0 ? ` Redeemed ${safePointsToUse} points for SAR ${pointsDiscount} off.` : ''} Earned ${earned} loyalty points!`,
      type: 'payment',
    });

    showToast(
      `Payment processed! ${newBookings.length} pass${
        newBookings.length > 1 ? 'es' : ''
      } confirmed (+${earned} points).`,
      'success'
    );

    return newBookings;
  };

  const DEFAULT_PLATFORM_AMENITIES = [
    'High-Speed WiFi',
    'Parking',
    'Coffee & Tea',
    'Printing',
    'Meeting Rooms',
    'Phone Booths',
    'Reception',
    '24/7 Access',
    'Accessibility',
    'Prayer Room',
    'Locker',
    'Gym Access',
    'Rooftop',
    'Event Space',
    '4K Projector',
    'Surround Sound',
    'Stage Lighting',
  ];

  const getApprovedAmenities = (): string[] => {
    const combined = new Set([...DEFAULT_PLATFORM_AMENITIES, ...approvedCustomAmenities]);
    return Array.from(combined);
  };

  const requestCustomAmenity = (amenityName: string, spaceId?: string, spaceName?: string) => {
    const trimmed = amenityName.trim();
    if (!trimmed) {
      return { success: false, message: 'Amenity name cannot be empty.' };
    }

    const allApproved = getApprovedAmenities();
    if (allApproved.some(a => a.toLowerCase() === trimmed.toLowerCase())) {
      return { success: false, message: `"${trimmed}" is already an available amenity.` };
    }

    const existingReq = amenityRequests.find(
      r => r.amenityName.toLowerCase() === trimmed.toLowerCase() && r.status === 'PENDING_APPROVAL'
    );
    if (existingReq) {
      return { success: false, message: `A request for "${trimmed}" is already pending admin approval.` };
    }

    const newReq: AmenityRequest = {
      id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      amenityName: trimmed,
      providerId: currentUser?.id || 'user-p1',
      providerName: currentUser?.name || 'Workspace Provider',
      spaceId,
      spaceName,
      status: 'PENDING_APPROVAL',
      createdAt: new Date().toISOString(),
    };

    const updated = [newReq, ...amenityRequests];
    setAmenityRequests(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cp_amenity_requests', JSON.stringify(updated));
    }

    // Notify Admin
    addNotification({
      userId: 'admin',
      title: 'New Custom Amenity Request',
      message: `${currentUser?.name || 'Provider'} requested custom amenity "${trimmed}"${spaceName ? ` for ${spaceName}` : ''}.`,
      type: 'system',
    });

    showToast(`Amenity request for "${trimmed}" submitted to Admin for approval.`, 'info');
    return { success: true, message: 'Request submitted successfully!', request: newReq };
  };

  const approveAmenityRequest = (requestId: string) => {
    const req = amenityRequests.find(r => r.id === requestId);
    if (!req) return;

    const updatedReqs = amenityRequests.map(r =>
      r.id === requestId ? { ...r, status: 'APPROVED' as AmenityRequestStatus } : r
    );
    setAmenityRequests(updatedReqs);

    const existsInApproved = approvedCustomAmenities.some(
      a => a.toLowerCase() === req.amenityName.toLowerCase()
    );
    const newApproved = existsInApproved ? approvedCustomAmenities : [...approvedCustomAmenities, req.amenityName];
    setApprovedCustomAmenities(newApproved);

    if (req.spaceId) {
      const targetSpace = spaces.find(s => s.id === req.spaceId);
      if (targetSpace && !targetSpace.amenities.includes(req.amenityName)) {
        updateSpace(targetSpace.id, {
          amenities: [...targetSpace.amenities, req.amenityName],
        });
      }
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('cp_amenity_requests', JSON.stringify(updatedReqs));
      localStorage.setItem('cp_approved_amenities', JSON.stringify(newApproved));
    }

    addNotification({
      userId: req.providerId,
      title: 'Amenity Request Approved',
      message: `Your custom amenity request "${req.amenityName}" has been approved by the Admin and added to the platform catalog!`,
      type: 'system',
    });

    showToast(`Approved custom amenity "${req.amenityName}".`, 'success');
  };

  const rejectAmenityRequest = (requestId: string, reason?: string) => {
    const req = amenityRequests.find(r => r.id === requestId);
    if (!req) return;

    const updatedReqs = amenityRequests.map(r =>
      r.id === requestId
        ? { ...r, status: 'REJECTED' as AmenityRequestStatus, rejectionReason: reason || 'Does not meet catalog guidelines.' }
        : r
    );
    setAmenityRequests(updatedReqs);

    if (typeof window !== 'undefined') {
      localStorage.setItem('cp_amenity_requests', JSON.stringify(updatedReqs));
    }

    addNotification({
      userId: req.providerId,
      title: 'Amenity Request Rejected',
      message: `Your custom amenity request "${req.amenityName}" was rejected by the Admin.${reason ? ` Reason: ${reason}` : ''}`,
      type: 'system',
    });

    showToast(`Rejected custom amenity request "${req.amenityName}".`, 'error');
  };

  return (
    <AppContext.Provider value={{
      nav, navigate, goBack,
      currentUser, login, signup, logout, setPendingUser, pendingUser,
      spaces, favorites, toggleFavorite, addSpace, updateSpace, toggleSpaceVisibility, deleteSpace,
      bookings, addBooking, cancelBooking, updateBookingStatus,
      amenityRequests, approvedCustomAmenities, requestCustomAmenity, approveAmenityRequest, rejectAmenityRequest, getApprovedAmenities,
      notifications: userNotifications,
      unreadNotificationsCount: userNotifications.filter(n => !n.read).length,
      markNotificationRead, toggleNotificationRead, markAllNotificationsRead, deleteNotification, clearAllNotifications, addNotification, generateFakeNotification,
      users, blockUser, unblockUser, changeUserRole,
      waitlist, autobooking, autobookingCard, joinWaitlist, leaveWaitlist, enableAutoBooking, disableAutoBooking,
      addPaymentCard,
      cart, addToCart, removeFromCart, updateCartItemSeats, updateCartItem, clearCart, checkoutCart,
      applyLoyaltyDiscount,
      toast, showToast, updateCurrentUser, completeSignup,
      otpSession, startOtpVerification, requestSignupOtp, requestForgotPasswordOtp, resetPassword, pendingResetUser, verifyOtp, resendOtp, cancelOtp,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
