'use client';

import Link from 'next/link';
import { CalendarClock, CheckCircle2, CircleDollarSign, Plus, RefreshCw, Search, Trash2, XCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  AdminBooking,
  AdminBookingInput,
  AdminFilters,
  AdminStats,
  BookingPayload,
  BookingStatus,
  createAdminBooking,
  deleteAdminBooking,
  expirePendingBookings,
  getAdminBookings,
  updateAdminBooking,
} from '../lib/api';

const today = new Date().toISOString().slice(0, 10);
const shifts: BookingPayload['shift'][] = ['morning', 'afternoon', 'full-day'];
const statuses: BookingStatus[] = ['pending', 'paid', 'expired', 'cancelled'];

const emptyBooking: AdminBookingInput = {
  seatId: 'A1',
  studentName: '',
  email: '',
  phone: '',
  date: today,
  shift: 'morning',
  status: 'paid',
  notes: '',
};

export function AdminPanel() {
  const [pin, setPin] = useState('');
  const [activePin, setActivePin] = useState('');
  const [filters, setFilters] = useState<AdminFilters>({});
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [stats, setStats] = useState<AdminStats>({ total: 0, pending: 0, paid: 0, cancelled: 0, expired: 0, revenue: 0 });
  const [draft, setDraft] = useState<AdminBookingInput>(emptyBooking);
  const [editingId, setEditingId] = useState('');
  const [editDraft, setEditDraft] = useState<AdminBookingInput>(emptyBooking);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const isLoggedIn = Boolean(activePin);

  const activeBookings = useMemo(
    () => bookings.filter((booking) => booking.status === 'pending' || booking.status === 'paid').length,
    [bookings],
  );

  useEffect(() => {
    if (activePin) {
      loadBookings(activePin, filters);
    }
  }, [activePin, filters]);

  async function loadBookings(nextPin = activePin, nextFilters = filters) {
    setLoading(true);
    setError('');
    try {
      const result = await getAdminBookings(nextPin, nextFilters);
      setBookings(result.bookings);
      setStats(result.stats);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load bookings');
    } finally {
      setLoading(false);
    }
  }

  function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActivePin(pin);
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setNotice('');

    try {
      await createAdminBooking(activePin, draft);
      setDraft(emptyBooking);
      setNotice('Booking created.');
      await loadBookings();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Could not create booking');
    }
  }

  function startEditing(booking: AdminBooking) {
    setEditingId(getBookingId(booking));
    setEditDraft({
      seatId: booking.seatId,
      studentName: booking.studentName,
      email: booking.email,
      phone: booking.phone,
      date: booking.date,
      shift: booking.shift,
      status: booking.status,
      notes: booking.notes ?? '',
    });
  }

  async function saveEditing(bookingId: string) {
    setError('');
    setNotice('');

    try {
      await updateAdminBooking(activePin, bookingId, editDraft);
      setEditingId('');
      setNotice('Booking updated.');
      await loadBookings();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Could not update booking');
    }
  }

  async function quickStatus(booking: AdminBooking, status: BookingStatus) {
    const bookingId = getBookingId(booking);
    setError('');
    setNotice('');

    try {
      await updateAdminBooking(activePin, bookingId, { status });
      setNotice(`Booking marked ${status}.`);
      await loadBookings();
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : 'Could not update status');
    }
  }

  async function removeBooking(booking: AdminBooking) {
    const bookingId = getBookingId(booking);
    setError('');
    setNotice('');

    try {
      await deleteAdminBooking(activePin, bookingId);
      setNotice('Booking deleted.');
      await loadBookings();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Could not delete booking');
    }
  }

  async function expirePending() {
    setError('');
    setNotice('');

    try {
      const result = await expirePendingBookings(activePin);
      setNotice(`${result.updated} pending booking${result.updated === 1 ? '' : 's'} expired.`);
      await loadBookings();
    } catch (expireError) {
      setError(expireError instanceof Error ? expireError.message : 'Could not expire pending bookings');
    }
  }

  if (!isLoggedIn) {
    return (
      <main className="message-page">
        <form className="message-panel form" onSubmit={handleLogin}>
          <h1>Admin Panel</h1>
          <label>
            Admin PIN
            <input value={pin} onChange={(event) => setPin(event.target.value)} placeholder="123456" type="password" />
          </label>
          <button className="pay-button" type="submit">Open admin</button>
          <Link href="/">Back to seat map</Link>
        </form>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">
            <CalendarClock size={22} />
          </span>
          <span>Admin Panel</span>
        </div>
        <nav className="top-actions" aria-label="Admin navigation">
          <Link href="/admin/seats">Seat pricing</Link>
          <Link href="/">Seat map</Link>
          <button className="icon-button" type="button" onClick={() => loadBookings()} title="Refresh bookings">
            <RefreshCw size={17} />
          </button>
        </nav>
      </header>

      <div className="admin-shell">
        <section className="admin-summary" aria-label="Booking summary">
          <StatCard label="Revenue" value={`Rs ${stats.revenue}`} icon={<CircleDollarSign size={18} />} />
          <StatCard label="Total" value={stats.total} icon={<CalendarClock size={18} />} />
          <StatCard label="Active" value={activeBookings} icon={<CheckCircle2 size={18} />} />
          <StatCard label="Pending" value={stats.pending} icon={<RefreshCw size={18} />} />
          <StatCard label="Cancelled" value={stats.cancelled + stats.expired} icon={<XCircle size={18} />} />
        </section>

        <section className="admin-grid">
          <form className="admin-panel form" onSubmit={handleCreate}>
            <div className="panel-header">
              <h2>Create Booking</h2>
              <Plus size={18} />
            </div>
            <BookingFields value={draft} onChange={setDraft} />
            <button className="pay-button" type="submit">Save booking</button>
          </form>

          <section className="admin-panel">
            <div className="panel-header">
              <h2>Bookings</h2>
              <button className="light-button" type="button" onClick={expirePending}>Expire pending</button>
            </div>

            <div className="filters">
              <label>
                <span className="filter-icon"><Search size={15} /></span>
                <input
                  value={filters.search ?? ''}
                  onChange={(event) => setFilters({ ...filters, search: event.target.value })}
                  placeholder="Search student, email, phone, seat"
                />
              </label>
              <select value={filters.status ?? ''} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
                <option value="">All statuses</option>
                {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
              <input value={filters.date ?? ''} onChange={(event) => setFilters({ ...filters, date: event.target.value })} type="date" />
              <select value={filters.shift ?? ''} onChange={(event) => setFilters({ ...filters, shift: event.target.value })}>
                <option value="">All shifts</option>
                {shifts.map((shift) => <option key={shift} value={shift}>{shift}</option>)}
              </select>
            </div>

            {error ? <p className="error">{error}</p> : null}
            {notice ? <p className="notice">{notice}</p> : null}
            {loading ? <p>Loading bookings...</p> : null}

            <div className="booking-list">
              {bookings.map((booking) => {
                const bookingId = getBookingId(booking);
                const isEditing = editingId === bookingId;

                return (
                  <article className="booking-row" key={bookingId}>
                    {isEditing ? (
                      <>
                        <BookingFields value={editDraft} onChange={setEditDraft} compact />
                        <div className="row-actions">
                          <button className="pay-button" type="button" onClick={() => saveEditing(bookingId)}>Save</button>
                          <button className="light-button" type="button" onClick={() => setEditingId('')}>Cancel</button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="booking-main">
                          <strong>{booking.seatId}</strong>
                          <span>{booking.studentName}</span>
                          <span>{booking.email}</span>
                          <span>{booking.phone}</span>
                        </div>
                        <div className="booking-meta">
                          <span>{booking.date}</span>
                          <span>{booking.shift}</span>
                          <span className={`status-pill ${booking.status}`}>{booking.status}</span>
                          <span>Rs {booking.amount}</span>
                          <span>{booking.source}</span>
                        </div>
                        {booking.notes ? <p className="booking-notes">{booking.notes}</p> : null}
                        <div className="row-actions">
                          <button className="light-button" type="button" onClick={() => startEditing(booking)}>Edit</button>
                          <button className="light-button" type="button" onClick={() => quickStatus(booking, 'paid')}>Paid</button>
                          <button className="light-button" type="button" onClick={() => quickStatus(booking, 'cancelled')}>Cancel</button>
                          <button className="icon-button danger-button" type="button" onClick={() => removeBooking(booking)} title="Delete booking">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: ReactNode }) {
  return (
    <div className="stat-card">
      <span>{icon}</span>
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  );
}

function BookingFields({
  value,
  onChange,
  compact = false,
}: {
  value: AdminBookingInput;
  onChange: (value: AdminBookingInput) => void;
  compact?: boolean;
}) {
  return (
    <div className={compact ? 'compact-fields' : 'form'}>
      <label>
        Seat
        <input required value={value.seatId} onChange={(event) => onChange({ ...value, seatId: event.target.value.toUpperCase() })} />
      </label>
      <label>
        Student
        <input required value={value.studentName} onChange={(event) => onChange({ ...value, studentName: event.target.value })} />
      </label>
      <label>
        Email
        <input required type="email" value={value.email} onChange={(event) => onChange({ ...value, email: event.target.value })} />
      </label>
      <label>
        Phone
        <input required value={value.phone} onChange={(event) => onChange({ ...value, phone: event.target.value })} />
      </label>
      <label>
        Date
        <input required type="date" value={value.date} onChange={(event) => onChange({ ...value, date: event.target.value })} />
      </label>
      <label>
        Shift
        <select value={value.shift} onChange={(event) => onChange({ ...value, shift: event.target.value as BookingPayload['shift'] })}>
          {shifts.map((shift) => <option key={shift} value={shift}>{shift}</option>)}
        </select>
      </label>
      <label>
        Status
        <select value={value.status} onChange={(event) => onChange({ ...value, status: event.target.value as BookingStatus })}>
          {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
      </label>
      <label>
        Notes
        <input value={value.notes ?? ''} onChange={(event) => onChange({ ...value, notes: event.target.value })} />
      </label>
    </div>
  );
}

function getBookingId(booking: AdminBooking) {
  return booking.id ?? booking._id ?? `${booking.seatId}-${booking.date}-${booking.shift}`;
}
