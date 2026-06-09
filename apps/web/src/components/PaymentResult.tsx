'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cancelPayment, confirmPayment } from '../lib/api';

type PaymentResultProps = {
  type: 'success' | 'cancel';
};

export function PaymentResult({ type }: PaymentResultProps) {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState('Updating your booking...');

  useEffect(() => {
    if (!sessionId) {
      setStatus('No payment session was found.');
      return;
    }

    const action = type === 'success' ? confirmPayment : cancelPayment;
    action(sessionId)
      .then(() => setStatus(type === 'success' ? 'Your seat is booked.' : 'Your pending seat hold was released.'))
      .catch(() => setStatus('We could not update the booking status. Please check the API logs.'));
  }, [sessionId, type]);

  return (
    <main className="message-page">
      <section className="message-panel">
        <h1>{type === 'success' ? 'Payment Complete' : 'Payment Cancelled'}</h1>
        <p>{status}</p>
        <Link href="/">Back to seat map</Link>
      </section>
    </main>
  );
}
