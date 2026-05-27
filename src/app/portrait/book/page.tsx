'use client';
import React, { Suspense } from 'react';
import PortraitFunnel from '@/components/PortraitFunnel/PortraitFunnel';

export default function PortraitBookingPage() {
  return (
    <main>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50 font-inter">Loading Booking Funnel...</div>}>
        <PortraitFunnel />
      </Suspense>
    </main>
  );
}
