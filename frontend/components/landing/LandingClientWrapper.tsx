'use client';

import React from 'react';
import { useApp } from '@/app/store';
import App, { Toast } from '@/app/app';
import CartDrawer from '@/app/CartDrawer';

export default function LandingClientWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { nav, isCartOpen, closeCart, currentUser } = useApp();

  // If user transitioned away from 'landing' inside the client session, render the SPA Router
  if (nav?.screen && nav.screen !== 'landing') {
    return <App />;
  }

  // Otherwise, display the server-rendered page for optimal SEO and instant initial load
  return (
    <>
      {children}
      <Toast />
      {currentUser && (
        <CartDrawer isOpen={isCartOpen} onClose={closeCart} />
      )}
    </>
  );
}
