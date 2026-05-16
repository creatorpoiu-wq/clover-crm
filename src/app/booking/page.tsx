'use client';
import React, { Suspense } from 'react';
import BookingFunnel from '@/components/BookingFunnel/BookingFunnel';

export default function BookingPage() {
  return (
    <main>
      <Suspense fallback={<div style={{ textAlign: 'center', padding: 60, color: '#6b7280' }}>Loading Proposal...</div>}>
        <BookingFunnel />
      </Suspense>
    </main>
  );
}
