'use client';

import Link from 'next/link';
import { Armchair, IndianRupee, RefreshCw, Save } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  Seat,
  getAdminSeats,
  resetAdminSeatPrice,
  resetAllAdminSeatPrices,
  updateAdminSeatPrice,
} from '../lib/api';

export function AdminSeatPricing() {
  const [pin, setPin] = useState('');
  const [activePin, setActivePin] = useState('');
  const [seats, setSeats] = useState<Seat[]>([]);
  const [draftPrices, setDraftPrices] = useState<Record<string, string>>({});
  const [savingSeatId, setSavingSeatId] = useState('');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const groupedSeats = useMemo(() => {
    return seats.reduce<Record<string, Seat[]>>((groups, seat) => {
      groups[seat.block] = [...(groups[seat.block] ?? []), seat];
      return groups;
    }, {});
  }, [seats]);

  useEffect(() => {
    if (activePin) {
      loadSeats(activePin);
    }
  }, [activePin]);

  async function loadSeats(nextPin = activePin) {
    setLoading(true);
    setError('');
    try {
      const result = await getAdminSeats(nextPin);
      setSeats(result);
      setDraftPrices(Object.fromEntries(result.map((seat) => [seat.id, String(seat.price)])));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load seat prices');
    } finally {
      setLoading(false);
    }
  }

  function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActivePin(pin);
  }

  async function saveSeat(seatId: string) {
    const price = Number(draftPrices[seatId]);
    if (!Number.isInteger(price) || price < 1) {
      setError('Enter a valid whole number price.');
      return;
    }

    setSavingSeatId(seatId);
    setError('');
    setNotice('');

    try {
      await updateAdminSeatPrice(activePin, seatId, price);
      setNotice(`${seatId} price updated to Rs ${price}.`);
      await loadSeats();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not update price');
    } finally {
      setSavingSeatId('');
    }
  }

  async function resetSeat(seatId: string) {
    setSavingSeatId(seatId);
    setError('');
    setNotice('');

    try {
      const seat = await resetAdminSeatPrice(activePin, seatId);
      setNotice(`${seatId} reset to Rs ${seat.price}.`);
      await loadSeats();
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : 'Could not reset price');
    } finally {
      setSavingSeatId('');
    }
  }

  async function resetAll() {
    setLoading(true);
    setError('');
    setNotice('');

    try {
      const result = await resetAllAdminSeatPrices(activePin);
      setNotice(`${result.reset} custom price${result.reset === 1 ? '' : 's'} reset.`);
      await loadSeats();
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : 'Could not reset prices');
    } finally {
      setLoading(false);
    }
  }

  if (!activePin) {
    return (
      <main className="message-page">
        <form className="message-panel form" onSubmit={handleLogin}>
          <h1>Seat Pricing</h1>
          <label>
            Admin PIN
            <input value={pin} onChange={(event) => setPin(event.target.value)} placeholder="123456" type="password" />
          </label>
          <button className="pay-button" type="submit">Open pricing</button>
          <Link href="/admin">Back to admin</Link>
        </form>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">
            <IndianRupee size={22} />
          </span>
          <span>Seat Pricing</span>
        </div>
        <nav className="top-actions" aria-label="Pricing navigation">
          <Link href="/admin">Bookings</Link>
          <Link href="/">Seat map</Link>
          <button className="icon-button" type="button" onClick={() => loadSeats()} title="Refresh prices">
            <RefreshCw size={17} />
          </button>
        </nav>
      </header>

      <div className="admin-shell">
        <section className="admin-panel">
          <div className="panel-header">
            <div>
              <h1>Modify Seat Rates</h1>
              <p className="subtle">New bookings use these prices. Existing booking amounts remain unchanged.</p>
            </div>
            <button className="light-button" type="button" onClick={resetAll} disabled={loading}>
              Reset all
            </button>
          </div>

          {error ? <p className="error">{error}</p> : null}
          {notice ? <p className="notice">{notice}</p> : null}
          {loading ? <p>Loading prices...</p> : null}

          <div className="pricing-grid">
            {Object.entries(groupedSeats).map(([block, blockSeats]) => (
              <section className="pricing-block" key={block}>
                <h2>Block {block}</h2>
                <div className="pricing-list">
                  {blockSeats.map((seat) => (
                    <article className="pricing-row" key={seat.id}>
                      <div className="pricing-seat">
                        <span className="chair" aria-hidden="true">
                          <Armchair size={16} />
                        </span>
                        <strong>{seat.id}</strong>
                      </div>
                      <label>
                        Rate
                        <input
                          min={1}
                          step={1}
                          type="number"
                          value={draftPrices[seat.id] ?? String(seat.price)}
                          onChange={(event) => setDraftPrices({ ...draftPrices, [seat.id]: event.target.value })}
                        />
                      </label>
                      <div className="row-actions">
                        <button
                          className="pay-button"
                          type="button"
                          disabled={savingSeatId === seat.id}
                          onClick={() => saveSeat(seat.id)}
                        >
                          <Save size={16} />
                          Save
                        </button>
                        <button className="light-button" type="button" onClick={() => resetSeat(seat.id)}>
                          Reset
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
