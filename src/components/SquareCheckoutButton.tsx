'use client';

import React, { useState } from 'react';
import { PaymentForm, CreditCard } from 'react-square-web-payments-sdk';

interface Props {
  appId: string;
  locationId: string;
  amount: number;
  onSuccess: (paymentToken: string) => Promise<void>;
  onError: (error: Error) => void;
}

export default function SquareCheckoutButton({ appId, locationId, amount, onSuccess, onError }: Props) {
  const [processing, setProcessing] = useState(false);

  return (
    <div style={{ minHeight: '100px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <PaymentForm
        applicationId={appId}
        locationId={locationId}
        cardTokenizeResponseReceived={async (token, buyer) => {
          if (token.status === 'OK' && token.token) {
            setProcessing(true);
            try {
              await onSuccess(token.token);
            } catch (err: any) {
              onError(err);
              setProcessing(false);
            }
          } else if (token.errors && token.errors.length > 0) {
            onError(new Error(token.errors[0].message || 'Tokenization failed'));
          }
        }}
      >
        <CreditCard
          buttonProps={{
            css: {
              backgroundColor: processing ? '#9ca3af' : '#111827',
              fontSize: '15px',
              color: '#fff',
              '&:hover': {
                backgroundColor: processing ? '#9ca3af' : '#1f2937',
              },
              padding: '16px',
              borderRadius: '10px',
              fontWeight: '800',
              width: '100%',
              cursor: processing ? 'not-allowed' : 'pointer'
            },
            isLoading: processing,
          }}
        >
          {processing ? 'Processing...' : `Pay $${amount.toLocaleString()}`}
        </CreditCard>
      </PaymentForm>
    </div>
  );
}
