import { Suspense } from 'react';
import { PaymentResult } from '../../components/PaymentResult';

export default function CancelPage() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <PaymentResult type="cancel" />
    </Suspense>
  );
}
