'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Armchair, CreditCard, DoorOpen, Library, RefreshCw } from 'lucide-react';
import { CSSProperties, FormEvent, useEffect, useMemo, useState } from 'react';
import { BookingPayload, Seat, createCheckout, getSeats } from '../lib/api';

const today = new Date().toISOString().slice(0, 10);

function getSeatVisualRow(seat: Seat) {
  if (seat.block === 'Connected') {
    return 9 - seat.column;
  }

  if (seat.column >= 7) {
    return seat.column - 6;
  }

  return seat.column + 3;
}

export function BookingApp() {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeatId, setSelectedSeatId] = useState<string>('');
  const [form, setForm] = useState<Omit<BookingPayload, 'seatId'>>({
    studentName: '',
    email: '',
    phone: '',
    date: today,
    shift: 'morning',
  });
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    getSeats(form.date, form.shift)
      .then(setSeats)
      .catch(() => setError('Could not load seats. Please make sure the API and MongoDB are running.'))
      .finally(() => setLoading(false));
  }, [form.date, form.shift]);

  const selectedSeat = useMemo(
    () => seats.find((seat) => seat.id === selectedSeatId),
    [seats, selectedSeatId],
  );

  useEffect(() => {
    if (selectedSeat && selectedSeat.status !== 'available') {
      setSelectedSeatId('');
    }
  }, [selectedSeat]);

  const finalPrice = useMemo(() => {
    if (!selectedSeat) {
      return 0;
    }

    const multiplier = form.shift === 'full-day' ? 1.8 : 1;
    return Math.round(selectedSeat.price * multiplier);
  }, [form.shift, selectedSeat]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedSeat) {
      setError('Please choose an available seat.');
      return;
    }

    setPaying(true);
    setError('');

    try {
      const { checkoutUrl } = await createCheckout({ seatId: selectedSeat.id, ...form });
      window.location.href = checkoutUrl;
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : 'Payment could not be started.');
      setPaying(false);
    }
  }

  return (
    <main className="page">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">
            <Library size={22} />
          </span>
          <span>Focus Library</span>
        </div>
        <nav className="top-actions" aria-label="Main navigation">
          <Link href="/admin">Admin panel</Link>
          <p>Book your preferred self-study seat and pay online.</p>
        </nav>
      </header>

      <div className="shell">
        <section className="workspace">
          <div className="floor-header">
            <div>
              <h1>Choose a Study Seat</h1>
            </div>
            <div className="legend" aria-label="Seat legend">
              <span><i className="dot" /> Available</span>
              <span><i className="dot pending" /> Held</span>
              <span><i className="dot booked" /> Booked</span>
            </div>
          </div>

          {loading ? (
            <p>Loading seats...</p>
          ) : (
            <div className="floor" aria-label="Library floor plan">
              <div className="reception" aria-label="Reception desk">
                <Library size={34} />
              </div>
              <div className="entry" aria-label="Entry gate">
                <DoorOpen size={28} />
              </div>
              <div className="connected-row-track" aria-hidden="true" />
              {seats.map((seat) => (
                <button
                  key={seat.id}
                  className={`seat ${seat.status} ${seat.block === 'Connected' ? 'connected-row' : ''} ${
                    selectedSeatId === seat.id ? 'selected' : ''
                  }`}
                  style={{
                    '--seat-column': `${seat.row + 2}`,
                    '--seat-row': `${getSeatVisualRow(seat)}`,
                  } as CSSProperties}
                  type="button"
                  disabled={seat.status !== 'available'}
                  onClick={() => setSelectedSeatId(seat.id)}
                  title={`Seat ${seat.id}, Rs ${seat.price}`}
                >
                  <span>
                    <span className="seat-id">{seat.id}</span>
                    <br />
                    <span className="seat-price">Rs {seat.price}</span>
                  </span>
                  <span className="chair" aria-hidden="true">
                    <Armchair size={16} />
                  </span>
                </button>
              ))}
            </div>
          )}

          <div className="reference">
            Original layout reference
            <Image src="/layout-reference.webp" alt="Study center layout reference" width={280} height={216} />
          </div>
        </section>

        <aside className="booking-panel" aria-label="Booking details">
          <div className="panel-header">
            <h2>Booking Details</h2>
            <button className="pay-button" type="button" onClick={() => window.location.reload()} title="Refresh seats">
              <RefreshCw size={16} />
            </button>
          </div>

          <div className="selected-seat">
            <span>
              <small>Selected seat</small>
              <br />
              <strong>{selectedSeat?.id ?? '--'}</strong>
            </span>
            <span>Rs {finalPrice}</span>
          </div>

          <form className="form" onSubmit={handleSubmit}>
            <label>
              Student name
              <input
                required
                value={form.studentName}
                onChange={(event) => setForm({ ...form, studentName: event.target.value })}
                placeholder="Aarav Sharma"
              />
            </label>
            <label>
              Email
              <input
                required
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                placeholder="student@example.com"
              />
            </label>
            <label>
              Phone
              <input
                required
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
                placeholder="+91 98765 43210"
              />
            </label>
            <label>
              Date
              <input
                required
                min={today}
                type="date"
                value={form.date}
                onChange={(event) => setForm({ ...form, date: event.target.value })}
              />
            </label>
            <label>
              Shift
              <select
                value={form.shift}
                onChange={(event) => setForm({ ...form, shift: event.target.value as BookingPayload['shift'] })}
              >
                <option value="morning">Morning</option>
                <option value="afternoon">Afternoon</option>
                <option value="full-day">Full day</option>
              </select>
            </label>

            {error ? <p className="error">{error}</p> : null}

            <button className="pay-button" type="submit" disabled={paying || !selectedSeat}>
              <CreditCard size={18} />
              {paying ? 'Opening Stripe...' : 'Pay with Stripe'}
            </button>
          </form>
        </aside>
      </div>
    </main>
  );
}
