'use client';
import React, { Suspense } from 'react';
import PortraitFunnel from '@/components/PortraitFunnel/PortraitFunnel';

export default function PortraitBookingPage() {
  return (
    <main>
      <Suspense fallback={<div className="login-wrapper">Loading Booking Funnel...</div>}>
        <PortraitFunnel />
      </Suspense>
    </main>
  );
}
