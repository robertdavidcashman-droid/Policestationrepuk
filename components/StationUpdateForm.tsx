'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export interface StationStub {
  id: string;
  name: string;
  address: string;
  postcode: string;
  phone: string;
  custodyPhone: string;
  nonEmergencyPhone: string;
}

interface Props {
  stations: StationStub[];
}

const INPUT_CLS =
  'mt-1 w-full rounded-lg border-2 border-slate-300 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-[var(--navy)] focus:outline-none focus:ring-2 focus:ring-[var(--navy)]/20 sm:text-sm';
const LABEL_CLS = 'block text-sm font-bold text-slate-800';

export function StationUpdateForm({ stations }: Props) {
  const searchParams = useSearchParams();
  /** Last `station` query id applied from the URL — re-applies when the param changes (e.g. A → B). */
  const lastAppliedStationFromUrl = useRef<string | null>(null);

  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [submissionRef, setSubmissionRef] = useState<string | null>(null);
  const [timingBaseline] = useState(() => Date.now());
  const [hp, setHp] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selected, setSelected] = useState<StationStub | null>(null);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [newAddress, setNewAddress] = useState('');
  const [newPostcode, setNewPostcode] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCustodyPhone, setNewCustodyPhone] = useState('');
  const [newNonEmergencyPhone, setNewNonEmergencyPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [submitterName, setSubmitterName] = useState('');
  const [submitterEmail, setSubmitterEmail] = useState('');

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return stations
      .filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.address.toLowerCase().includes(q) ||
          s.postcode.toLowerCase().includes(q),
      )
      .slice(0, 20);
  }, [searchQuery, stations]);

  useEffect(() => {
    setHighlightIdx(-1);
  }, [filtered]);

  const selectStation = useCallback((station: StationStub) => {
    setSelected(station);
    setSearchQuery(station.name);
    setShowDropdown(false);
  }, []);

  useEffect(() => {
    const id = searchParams.get('station');
    if (!id) {
      lastAppliedStationFromUrl.current = null;
      return;
    }
    if (lastAppliedStationFromUrl.current === id) return;
    const stub = stations.find((s) => s.id === id);
    if (!stub) return;
    lastAppliedStationFromUrl.current = id;
    selectStation(stub);

    const reason = searchParams.get('reason');
    const field = searchParams.get('field');
    const number = searchParams.get('number');
    const notesParam = searchParams.get('notes');
    if (notesParam) setNotes(notesParam);
    else if (reason === 'not_custody_desk') {
      setNotes(
        `Reported: this is not the custody desk number${number ? ` (${number})` : ''}. Please replace with the correct custody suite line if known.`,
      );
    } else if (reason === 'wrong_number') {
      setNotes(`Reported: this phone number is wrong or out of date${number ? ` (${number})` : ''}.`);
    }

    // Prefill the field being corrected so reviewers see the reported line.
    if (field === 'custodyPhone' && number) setNewCustodyPhone('');
    if (field === 'phone' && number) setNewPhone('');
    if (field === 'nonEmergencyPhone' && number) setNewNonEmergencyPhone('');
  }, [searchParams, stations, selectStation]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSearchKeyDown(e: React.KeyboardEvent) {
    if (!showDropdown || filtered.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && highlightIdx >= 0) {
      e.preventDefault();
      selectStation(filtered[highlightIdx]);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  }

  function resetForm() {
    setSelected(null);
    setSearchQuery('');
    setNewAddress('');
    setNewPostcode('');
    setNewPhone('');
    setNewCustodyPhone('');
    setNewNonEmergencyPhone('');
    setNotes('');
    setSubmitterName('');
    setSubmitterEmail('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (hp) return;
    if (!selected) return;

    setErrorDetail(null);
    setStatus('sending');

    try {
      const res = await fetch('/api/station-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stationId: selected.id,
          stationName: selected.name,
          currentAddress: selected.address,
          currentPostcode: selected.postcode,
          currentPhone: selected.phone,
          currentCustodyPhone: selected.custodyPhone,
          currentNonEmergencyPhone: selected.nonEmergencyPhone,
          newAddress: newAddress.trim() || undefined,
          newPostcode: newPostcode.trim() || undefined,
          newPhone: newPhone.trim() || undefined,
          newCustodyPhone: newCustodyPhone.trim() || undefined,
          newNonEmergencyPhone: newNonEmergencyPhone.trim() || undefined,
          notes: notes.trim() || undefined,
          submitterName,
          submitterEmail,
          _hp: hp,
          _startedAt: timingBaseline,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        id?: string;
        message?: string;
        error?: string;
      };

      if (res.ok && data.ok && data.id && data.id !== 'noop') {
        setSubmissionRef(data.id);
        setStatus('success');
        resetForm();
      } else if (res.ok && data.id === 'noop') {
        setStatus('idle');
      } else {
        setStatus('error');
        setErrorDetail(data.error || null);
      }
    } catch {
      setStatus('error');
      setErrorDetail(null);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      {status === 'success' && submissionRef && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-lg border border-green-200 bg-green-50 p-5 text-green-900"
        >
          <p className="font-semibold text-green-950">Update suggestion received — thank you</p>
          <p className="mt-2 text-sm leading-relaxed">
            We review all suggestions manually before applying them. This helps keep our data accurate and
            protects against errors.
          </p>
          <p className="mt-3 text-sm">
            <span className="font-medium">Reference:</span>{' '}
            <code className="rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-900">{submissionRef}</code>
          </p>
          <button
            type="button"
            onClick={() => setStatus('idle')}
            className="mt-4 text-sm font-semibold text-green-700 hover:text-green-900"
          >
            Submit another update &rarr;
          </button>
        </div>
      )}

      {status === 'error' && (
        <div role="alert" className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          <p className="font-medium">Could not submit your suggestion</p>
          {errorDetail ? (
            <p className="mt-2 text-sm">{errorDetail}</p>
          ) : (
            <p className="mt-2 text-sm">Please try again or contact us directly.</p>
          )}
        </div>
      )}

      {status !== 'success' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Honeypot */}
          <div aria-hidden="true" className="absolute -left-[9999px] -top-[9999px]">
            <label htmlFor="su-website">Website</label>
            <input
              id="su-website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={hp}
              onChange={(e) => setHp(e.target.value)}
            />
          </div>

          {/* Step 1: Station picker */}
          <fieldset className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <legend className="px-2 text-sm font-bold uppercase tracking-wider text-[var(--navy)]">
              1. Select a station
            </legend>
            <div className="relative mt-2" ref={dropdownRef}>
              <label htmlFor="station-search" className={LABEL_CLS}>
                Search stations
              </label>
              <div className="relative mt-1">
                <svg
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <input
                  ref={inputRef}
                  id="station-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSelected(null);
                    setShowDropdown(true);
                  }}
                  onFocus={() => searchQuery.trim() && setShowDropdown(true)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Type a station name, address, or postcode…"
                  autoComplete="off"
                  className="mt-0 w-full rounded-lg border-2 border-slate-300 bg-white py-3 pl-10 pr-4 text-base text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-[var(--navy)] focus:outline-none focus:ring-2 focus:ring-[var(--navy)]/20 sm:text-sm"
                />
              </div>
              {showDropdown && filtered.length > 0 && (
                <ul className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                  {filtered.map((s, i) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => selectStation(s)}
                        className={`flex w-full flex-col items-start px-4 py-2.5 text-left transition-colors ${
                          i === highlightIdx
                            ? 'bg-[var(--gold-pale)] text-[var(--navy)]'
                            : 'text-[var(--foreground)] hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-sm font-semibold">{s.name}</span>
                        <span className="text-xs text-slate-500">
                          {s.address}{s.postcode ? ` — ${s.postcode}` : ''}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {showDropdown && searchQuery.trim().length >= 2 && filtered.length === 0 && (
                <div className="absolute z-30 mt-1 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-lg">
                  <p className="text-sm text-slate-500">No stations found matching &ldquo;{searchQuery}&rdquo;</p>
                </div>
              )}
            </div>

            {selected && (
              <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50/50 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[var(--navy)]">{selected.name}</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(null);
                      setSearchQuery('');
                      inputRef.current?.focus();
                    }}
                    className="text-xs font-medium text-slate-500 hover:text-red-600"
                  >
                    Change
                  </button>
                </div>
                <p className="mt-1 text-xs text-slate-500">Current information on file:</p>
                <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="font-medium text-slate-600">Address</dt>
                    <dd className="text-slate-500">{selected.address || '(none)'}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-slate-600">Postcode</dt>
                    <dd className="text-slate-500">{selected.postcode || '(none)'}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-slate-600">Phone</dt>
                    <dd className="text-slate-500">{selected.phone || '(none)'}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-slate-600">Custody phone</dt>
                    <dd className="text-slate-500">{selected.custodyPhone || '(none)'}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-slate-600">Non-emergency phone</dt>
                    <dd className="text-slate-500">{selected.nonEmergencyPhone || '(none)'}</dd>
                  </div>
                </dl>
              </div>
            )}
          </fieldset>

          {/* Step 2: Updated information */}
          <fieldset
            className={`rounded-xl border-2 p-5 shadow-sm transition-all ${
              selected
                ? 'border-slate-300 bg-white opacity-100'
                : 'pointer-events-none border-slate-200 bg-slate-50 opacity-50'
            }`}
            disabled={!selected}
          >
            <legend className="px-2 text-sm font-bold uppercase tracking-wider text-[var(--navy)]">
              2. Suggest corrections
            </legend>
            {!selected && (
              <p className="mt-1 text-xs font-medium text-amber-600">Select a station above to unlock this section.</p>
            )}
            <p className="mt-1 text-xs text-slate-600">
              Only fill in the fields you want to update. Leave the rest blank.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="new-address" className={LABEL_CLS}>New address</label>
                <input
                  id="new-address"
                  type="text"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder={selected?.address || 'Full address'}
                  className={INPUT_CLS}
                />
              </div>
              <div>
                <label htmlFor="new-postcode" className={LABEL_CLS}>New postcode</label>
                <input
                  id="new-postcode"
                  type="text"
                  value={newPostcode}
                  onChange={(e) => setNewPostcode(e.target.value)}
                  placeholder={selected?.postcode || 'e.g. ME1 1XG'}
                  className={INPUT_CLS}
                />
              </div>
              <div>
                <label htmlFor="new-phone" className={LABEL_CLS}>New phone</label>
                <input
                  id="new-phone"
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder={selected?.phone || 'Main phone number'}
                  className={INPUT_CLS}
                />
              </div>
              <div>
                <label htmlFor="new-custody-phone" className={LABEL_CLS}>New custody phone</label>
                <input
                  id="new-custody-phone"
                  type="tel"
                  value={newCustodyPhone}
                  onChange={(e) => setNewCustodyPhone(e.target.value)}
                  placeholder={selected?.custodyPhone || 'Custody suite direct line'}
                  className={INPUT_CLS}
                />
              </div>
              <div>
                <label htmlFor="new-non-emergency-phone" className={LABEL_CLS}>New non-emergency phone</label>
                <input
                  id="new-non-emergency-phone"
                  type="tel"
                  value={newNonEmergencyPhone}
                  onChange={(e) => setNewNonEmergencyPhone(e.target.value)}
                  placeholder={selected?.nonEmergencyPhone || 'Non-emergency contact'}
                  className={INPUT_CLS}
                />
              </div>
            </div>
            <div className="mt-4">
              <label htmlFor="notes" className={LABEL_CLS}>
                Notes <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <textarea
                id="notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder='e.g. "Station has relocated to a new building" or "Number is out of service"'
                className={INPUT_CLS}
              />
            </div>
          </fieldset>

          {/* Step 3: Your details */}
          <fieldset
            className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-opacity ${
              selected ? 'opacity-100' : 'pointer-events-none opacity-40'
            }`}
            disabled={!selected}
          >
            <legend className="px-2 text-sm font-bold uppercase tracking-wider text-[var(--navy)]">
              3. Your details
            </legend>
            <p className="mt-1 text-xs text-slate-500">
              Your name and email are kept private and used only to follow up if needed.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="submitter-name" className={LABEL_CLS}>Your name</label>
                <input
                  id="submitter-name"
                  type="text"
                  required
                  value={submitterName}
                  onChange={(e) => setSubmitterName(e.target.value)}
                  autoComplete="name"
                  className={INPUT_CLS}
                />
              </div>
              <div>
                <label htmlFor="submitter-email" className={LABEL_CLS}>Your email</label>
                <input
                  id="submitter-email"
                  type="email"
                  required
                  value={submitterEmail}
                  onChange={(e) => setSubmitterEmail(e.target.value)}
                  autoComplete="email"
                  inputMode="email"
                  className={INPUT_CLS}
                />
              </div>
            </div>
          </fieldset>

          {/* Submit */}
          <div className="flex flex-col items-start gap-3">
            <button
              type="submit"
              disabled={status === 'sending' || !selected}
              aria-disabled={status === 'sending' || !selected}
              className="min-h-[44px] rounded-lg bg-[var(--accent)] px-8 py-3 font-bold text-[var(--navy)] shadow-sm transition-colors hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {status === 'sending' ? 'Submitting…' : 'Submit suggestion'}
            </button>
            <p className="max-w-md text-xs leading-relaxed text-[var(--muted)]">
              We review all suggestions before updating station records. Your details are kept private.
              This form includes basic spam protection.
            </p>
          </div>
        </form>
      )}

      <p className="mt-10 text-sm text-[var(--muted)]">
        <Link href="/StationsDirectory" className="text-[var(--primary)] hover:underline">
          &larr; Back to Station Directory
        </Link>
      </p>
    </div>
  );
}