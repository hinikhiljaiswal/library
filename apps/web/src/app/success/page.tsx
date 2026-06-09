import { Suspense } from 'react';
import { PaymentResult } from '../../components/PaymentResult';

export default function SuccessPage() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <PaymentResult type="success" />
    </Suspense>
  );
}
