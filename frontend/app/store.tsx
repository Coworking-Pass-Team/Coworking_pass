'use client';
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, Space, Booking, Screen, NavState, UserRole, BookingPlan, BookingType } from '@/types/types';
import { INITIAL_SPACES, INITIAL_USERS, INITIAL_BOOKINGS } from '@/data/data';

interface AppContextType {
  // Navigation
  nav: NavState;
  navigate: (screen: Screen, params?: Record<string, any>) => void;
  goBack: () => void;

  // Auth
  currentUser: User | null;
  login: (email: string, password: string) => { success: boolean; error?: string };
  signup: (name: string, email: string, password: string, phone: string) => User;
  completeSignup: (role: UserRole, orgData?: { orgName: string; orgSize: number; industry: string }) => void;
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

  // Users (admin)
  users: User[];
  blockUser: (id: string) => void;
  unblockUser: (id: string) => void;
  changeUserRole: (id: string, role: UserRole) => void;

  // Waitlist
  waitlist: Record<string, boolean>;
  autobooking: Record<string, boolean>;
  joinWaitlist: (spaceId: string) => void;
  toggleAutoBooking: (spaceId: string) => void;

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
  const [toast, setToast] = useState<AppContextType['toast']>(null);

  const navigate = (screen: Screen, params: Record<string, any> = {}) => {
    setHistory(prev => [...prev.slice(-9), nav]);
    setNav({ screen, params });
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
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
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (!user) return { success: false, error: 'Invalid email or password. Please try again.' };
    if (user.isBlocked) return { success: false, error: 'Your account has been suspended. Please contact support.' };
    setCurrentUser(user);
    if (user.role === 'admin') navigate('admin-dashboard');
    else if (user.role === 'organization') navigate('org-dashboard');
    else navigate('ind-dashboard');
    return { success: true };
  };

  const signup = (name: string, email: string, password: string, phone: string) => {
    const newUser: User = {
      id: `user-${Date.now()}`,
      name,
      email,
      password,
      role: 'individual',
      phone,
      avatar: `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&auto=format`,
      isBlocked: false,
      joinDate: new Date().toISOString().split('T')[0],
    };
    setUsers(prev => [...prev, newUser]);
    setPendingUser(newUser);
    return newUser;
  };

  const completeSignup = (role: UserRole, orgData?: { orgName: string; orgSize: number; industry: string }) => {
    if (!pendingUser) return;
    const updated: User = {
      ...(pendingUser as User),
      role,
      ...(orgData || {}),
    };
    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
    setCurrentUser(updated);
    setPendingUser(null);
    if (role === 'organization') navigate('org-dashboard');
    else navigate('ind-dashboard');
    showToast('Welcome to Coworking Pass!');
  };

  const updateCurrentUser = (updates: Partial<User>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...updates };
    setCurrentUser(updated);
    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
    showToast('Profile updated.');
  };

  const logout = () => {
    setCurrentUser(null);
    setPendingUser(null);
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
      id: `booking-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setBookings(prev => [...prev, newBooking]);
    // Reduce space capacity
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
    showToast('You have joined the waitlist! We\'ll notify you when a spot opens.');
  };

  const toggleAutoBooking = (spaceId: string) => {
    setAutobooking(prev => {
      const enabled = !prev[spaceId];
      showToast(enabled ? 'Auto-Booking enabled! We\'ll book automatically when a spot opens.' : 'Auto-Booking disabled.', enabled ? 'success' : 'info');
      return { ...prev, [spaceId]: enabled };
    });
  };

  return (
    <AppContext.Provider value={{
      nav, navigate, goBack,
      currentUser, login, signup, logout, setPendingUser, pendingUser,
      spaces, favorites, toggleFavorite, addSpace, updateSpace, toggleSpaceVisibility, deleteSpace,
      bookings, addBooking, cancelBooking, updateBookingStatus,
      users, blockUser, unblockUser, changeUserRole,
      waitlist, autobooking, joinWaitlist, toggleAutoBooking,
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