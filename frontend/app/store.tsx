'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Space, Booking, Screen, NavState, UserRole, BookingType, PaymentCard, Notification, CartItem } from '@/types/types';
import { INITIAL_SPACES, INITIAL_USERS, INITIAL_BOOKINGS, INITIAL_NOTIFICATIONS } from '@/data/data';

interface AppContextType {
  // Navigation
  nav: NavState;
  navigate: (screen: Screen, params?: Record<string, any>) => void;
  goBack: () => void;

  // Auth
  currentUser: User | null;
  login: (email: string, password: string) => { success: boolean; error?: string };
  signup: (name: string, email: string, password: string, phone: string) => User;
  completeSignup: (role: UserRole, extraData?: Partial<User>) => void;
  logout: () => void;
  setPendingUser: (user: Partial<User>) => void;
  pendingUser: Partial<User> | null;
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
  cancelBooking: (id: string) => void;
  updateBookingStatus: (id: string, status: Booking['status']) => void;

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
  enableAutoBooking: (spaceId: string, cardId: string) => void;
  disableAutoBooking: (spaceId: string) => void;

  // Payment cards
  addPaymentCard: (card: Omit<PaymentCard, 'id'>) => PaymentCard;

  // Shopping Cart (نفس كودك الأصلي تماماً)
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'id'>) => void;
  removeFromCart: (cartItemId: string) => void;
  updateCartItemSeats: (cartItemId: string, seats: number) => void;
  clearCart: () => void;
  checkoutCart: () => Booking[];

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

  const login = (email: string, password: string) => {
    let user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (!user) {
      user = INITIAL_USERS.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    }
    if (!user) return { success: false, error: 'Invalid email or password. Please try again.' };
    if (user.isBlocked) return { success: false, error: 'Your account has been suspended. Please contact support.' };
    setCurrentUser(user);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cp_currentUser', JSON.stringify(user));
    }
    if (user.role === 'admin') navigate('admin-dashboard');
    else if (user.role === 'organization') navigate('org-dashboard');
    else if (user.role === 'provider') navigate('provider-dashboard');
    else navigate('ind-dashboard');
    return { success: true };
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

  const cancelBooking = (id: string) => {
    const booking = bookings.find(b => b.id === id);
    if (booking) {
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b));
      setSpaces(prev => prev.map(s =>
        s.id === booking.spaceId
          ? { ...s, availableCapacity: Math.min(s.totalCapacity, s.availableCapacity + booking.seats) }
          : s
      ));
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
    setWaitlist(prev => ({ ...prev, [spaceId]: true }));
    const space = spaces.find(s => s.id === spaceId);
    addNotification({
      userId: currentUser?.id || 'user-1',
      title: 'Joined Waitlist',
      message: `You joined the waitlist for ${space?.name || 'the workspace'}. We'll notify you as soon as a spot opens!`,
      type: 'info',
    });
    showToast('You have joined the waitlist! We\'ll notify you when a spot opens.');
  };

  const enableAutoBooking = (spaceId: string, cardId: string) => {
    setAutobooking(prev => ({ ...prev, [spaceId]: true }));
    setAutobookingCard(prev => ({ ...prev, [spaceId]: cardId }));
    const space = spaces.find(s => s.id === spaceId);
    addNotification({
      userId: currentUser?.id || 'user-1',
      title: 'Auto-Booking Activated',
      message: `Auto-Booking enabled for ${space?.name || 'workspace'}. We'll automatically book and notify you when a desk opens.`,
      type: 'info',
    });
    showToast('Auto-Booking enabled! We\'ll charge your selected card and book automatically when a spot opens.', 'success');
  };

  const disableAutoBooking = (spaceId: string) => {
    setAutobooking(prev => ({ ...prev, [spaceId]: false }));
    setAutobookingCard(prev => {
      const next = { ...prev };
      delete next[spaceId];
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
    const updated = cart.map((i) => {
      if (i.id === cartItemId) {
        const itemTotal = i.pricePerSeat * seats;
        return { ...i, seats, itemTotal };
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
    const discount = (safePoints / 100) * 5; // كل 100 نقطة = 5 ريالات
    return { discount, safePoints };
  };

  // دالة الدفع مع إبقاء التوقيع نفسه، وتحديث النقاط المكتسبة تلقائياً
  const checkoutCart = (): Booking[] => {
    if (!currentUser || cart.length === 0) return [];

    const newBookings: Booking[] = [];
    cart.forEach((item) => {
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
        totalPrice: item.itemTotal,
        status: 'active',
        notes: item.notes,
      });
      newBookings.push(b);
    });

    // احتساب نقاط الولاء المكتسبة بناءً على كودهم
    const earned = cart.reduce((sum, item) => {
      const space = spaces.find(s => s.id === item.spaceId);
      const multiplier = space?.loyaltyPointsMultiplier || 1;
      return sum + Math.floor(item.itemTotal / 100) * 10 * multiplier;
    }, 0);

    const currentPoints = currentUser.loyaltyPoints || 0;
    const updatedUser = { ...currentUser, loyaltyPoints: currentPoints + earned };
    setCurrentUser(updatedUser);
    const updatedUsers = users.map(u => u.id === updatedUser.id ? updatedUser : u);
    setUsers(updatedUsers);

    if (typeof window !== 'undefined') {
      localStorage.setItem('cp_currentUser', JSON.stringify(updatedUser));
      localStorage.setItem('cp_users', JSON.stringify(updatedUsers));
    }

    clearCart();

    addNotification({
      userId: currentUser.id,
      title: 'Batch Checkout Successful',
      message: `Payment confirmed for ${newBookings.length} workspace pass${newBookings.length > 1 ? 'es' : ''}. Earned ${earned} loyalty points!`,
      type: 'payment',
    });

    showToast(`Payment processed! ${newBookings.length} pass${newBookings.length > 1 ? 'es' : ''} confirmed (+${earned} points).`, 'success');

    return newBookings;
  };

  return (
    <AppContext.Provider value={{
      nav, navigate, goBack,
      currentUser, login, signup, logout, setPendingUser, pendingUser,
      spaces, favorites, toggleFavorite, addSpace, updateSpace, toggleSpaceVisibility, deleteSpace,
      bookings, addBooking, cancelBooking, updateBookingStatus,
      notifications: userNotifications,
      unreadNotificationsCount: userNotifications.filter(n => !n.read).length,
      markNotificationRead, toggleNotificationRead, markAllNotificationsRead, deleteNotification, clearAllNotifications, addNotification, generateFakeNotification,
      users, blockUser, unblockUser, changeUserRole,
      waitlist, autobooking, autobookingCard, joinWaitlist, enableAutoBooking, disableAutoBooking,
      addPaymentCard,
      cart, addToCart, removeFromCart, updateCartItemSeats, clearCart, checkoutCart,
      applyLoyaltyDiscount,
      toast, showToast, updateCurrentUser, completeSignup,
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
