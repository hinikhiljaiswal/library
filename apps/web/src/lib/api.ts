function getApiUrl() {
  const value = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4001';

  if (process.env.RENDER === 'true' && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(value)) {
    throw new Error('NEXT_PUBLIC_API_URL must be the public API URL in production.');
  }

  return value;
}

export const apiUrl = getApiUrl();

export type SeatStatus = 'available' | 'pending' | 'booked';

export type Seat = {
  id: string;
  row: number;
  column: number;
  block: string;
  price: number;
  status: SeatStatus;
};

export type BookingPayload = {
  seatId: string;
  studentName: string;
  email: string;
  phone: string;
  date: string;
  shift: 'morning' | 'afternoon' | 'full-day';
};

export type BookingStatus = 'pending' | 'paid' | 'expired' | 'cancelled';

export type AdminBooking = BookingPayload & {
  _id?: string;
  id?: string;
  amount: number;
  status: BookingStatus;
  source: 'online' | 'admin';
  notes?: string;
  stripeSessionId?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminStats = {
  total: number;
  pending: number;
  paid: number;
  cancelled: number;
  expired: number;
  revenue: number;
};

export type AdminBookingInput = BookingPayload & {
  status: BookingStatus;
  notes?: string;
};

export type AdminFilters = {
  status?: string;
  date?: string;
  shift?: string;
  seatId?: string;
  search?: string;
};

export async function getSeats(date?: string, shift?: BookingPayload['shift']): Promise<Seat[]> {
  const params = new URLSearchParams();
  if (date) {
    params.set('date', date);
  }
  if (shift) {
    params.set('shift', shift);
  }

  const query = params.toString();
  const response = await fetch(`${apiUrl}/seats${query ? `?${query}` : ''}`, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('Unable to load seats');
  }

  return response.json();
}

export async function createCheckout(payload: BookingPayload): Promise<{ checkoutUrl: string }> {
  const response = await fetch(`${apiUrl}/payments/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();
    let message = body;

    try {
      const parsed = JSON.parse(body) as { message?: string | string[] };
      message = Array.isArray(parsed.message) ? parsed.message.join(' ') : parsed.message ?? body;
    } catch {
      message = body;
    }

    throw new Error(message || 'Unable to start payment');
  }

  return response.json();
}

export async function confirmPayment(sessionId: string) {
  await fetch(`${apiUrl}/payments/success/${sessionId}`, { method: 'POST' });
}

export async function cancelPayment(sessionId: string) {
  await fetch(`${apiUrl}/payments/cancel/${sessionId}`, { method: 'POST' });
}

function adminHeaders(pin: string) {
  return {
    'Content-Type': 'application/json',
    'x-admin-pin': pin,
  };
}

async function parseJsonResponse<T>(response: Response, fallback: string): Promise<T> {
  const body = await response.text();

  if (!response.ok) {
    let message = body;
    try {
      const parsed = JSON.parse(body) as { message?: string | string[] };
      message = Array.isArray(parsed.message) ? parsed.message.join(' ') : parsed.message ?? body;
    } catch {
      message = body;
    }

    throw new Error(message || fallback);
  }

  return body ? JSON.parse(body) as T : ({} as T);
}

export async function getAdminBookings(pin: string, filters: AdminFilters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  const response = await fetch(`${apiUrl}/admin/bookings?${params.toString()}`, {
    headers: { 'x-admin-pin': pin },
    cache: 'no-store',
  });

  return parseJsonResponse<{ bookings: AdminBooking[]; stats: AdminStats }>(response, 'Unable to load admin bookings');
}

export async function createAdminBooking(pin: string, payload: AdminBookingInput) {
  const response = await fetch(`${apiUrl}/admin/bookings`, {
    method: 'POST',
    headers: adminHeaders(pin),
    body: JSON.stringify(payload),
  });

  return parseJsonResponse<AdminBooking>(response, 'Unable to create booking');
}

export async function updateAdminBooking(pin: string, bookingId: string, payload: Partial<AdminBookingInput>) {
  const response = await fetch(`${apiUrl}/admin/bookings/${bookingId}`, {
    method: 'PATCH',
    headers: adminHeaders(pin),
    body: JSON.stringify(payload),
  });

  return parseJsonResponse<AdminBooking>(response, 'Unable to update booking');
}

export async function deleteAdminBooking(pin: string, bookingId: string) {
  const response = await fetch(`${apiUrl}/admin/bookings/${bookingId}`, {
    method: 'DELETE',
    headers: { 'x-admin-pin': pin },
  });

  return parseJsonResponse<{ deleted: boolean }>(response, 'Unable to delete booking');
}

export async function expirePendingBookings(pin: string) {
  const response = await fetch(`${apiUrl}/admin/bookings/expire-pending`, {
    method: 'POST',
    headers: { 'x-admin-pin': pin },
  });

  return parseJsonResponse<{ updated: number }>(response, 'Unable to expire pending bookings');
}

export async function getAdminSeats(pin: string) {
  const response = await fetch(`${apiUrl}/admin/seats`, {
    headers: { 'x-admin-pin': pin },
    cache: 'no-store',
  });

  return parseJsonResponse<Seat[]>(response, 'Unable to load seat prices');
}

export async function updateAdminSeatPrice(pin: string, seatId: string, price: number) {
  const response = await fetch(`${apiUrl}/admin/seats/${seatId}`, {
    method: 'PATCH',
    headers: adminHeaders(pin),
    body: JSON.stringify({ price }),
  });

  return parseJsonResponse<{ seatId: string; price: number }>(response, 'Unable to update seat price');
}

export async function resetAdminSeatPrice(pin: string, seatId: string) {
  const response = await fetch(`${apiUrl}/admin/seats/${seatId}`, {
    method: 'DELETE',
    headers: { 'x-admin-pin': pin },
  });

  return parseJsonResponse<Seat>(response, 'Unable to reset seat price');
}

export async function resetAllAdminSeatPrices(pin: string) {
  const response = await fetch(`${apiUrl}/admin/seats/reset`, {
    method: 'POST',
    headers: { 'x-admin-pin': pin },
  });

  return parseJsonResponse<{ reset: number }>(response, 'Unable to reset prices');
}
