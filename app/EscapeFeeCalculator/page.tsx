'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ContentReliabilityNotice } from '@/components/ContentReliabilityNotice';

const RATE_CATEGORIES = [
  {
    id: 'own-national',
    label: 'Own Solicitor (National)',
    attendance: 54.57,
    travelWaiting: 30.22,
  },
  {
    id: 'own-london',
    label: 'Own Solicitor (London)',
    attendance: 58.97,
    travelWaiting: 30.22,
  },
  {
    id: 'duty-national',
    label: 'Duty Solicitor (National)',
    attendance: 54.57,
    travelWaiting: 54.57,
  },
  {
    id: 'duty-london',
    label: 'Duty Solicitor (London)',
    attendance: 58.97,
    travelWaiting: 58.97,
  },
  {
    id: 'duty-unsocial',
    label: 'Duty Solicitor (Unsocial Hours)',
    attendance: 72.46,
    travelWaiting: 72.46,
  },
  {
    id: 'duty-serious-national',
    label: 'Duty Solicitor — Serious Offence (National)',
    attendance: 62.96,
    travelWaiting: 54.57,
  },
  {
    id: 'duty-serious-london',
    label: 'Duty Solicitor — Serious Offence (London)',
    attendance: 68.21,
    travelWaiting: 58.97,
  },
  {
    id: 'duty-serious-unsocial',
    label: 'Duty Solicitor — Serious Offence (Unsocial)',
    attendance: 83.95,
    travelWaiting: 83.95,
  },
];

const FIXED_FEE = 320.0;
const ESCAPE_THRESHOLD = 650.0;

const RATE_TABLE = [
  {
    category: 'Attendance Rates',
    rows: [
      { label: 'Own or Duty Solicitor', london: '£58.97', national: '£54.57' },
      { label: 'Duty Solicitor (Unsocial Hours)', london: '£72.46', national: '£72.46' },
      { label: 'Duty Solicitor — Serious Offence', london: '£68.21', national: '£62.96' },
      { label: 'Duty Solicitor — Serious Offence (Unsocial)', london: '£83.95', national: '£83.95' },
    ],
  },
  {
    category: 'Travel & Waiting Rates',
    rows: [
      { label: 'Own Solicitor', london: '£30.22', national: '£30.22' },
      { label: 'Duty Solicitor', london: '£58.97', national: '£54.57' },
      { label: 'Duty Solicitor (Unsocial Hours)', london: '£72.46', national: '£72.46' },
    ],
  },
];

interface CalcResult {
  attendanceCost: number;
  travelCost: number;
  waitingCost: number;
  totalCost: number;
  escapes: boolean;
  claimAmount: number;
}

export default function EscapeFeeCalculatorPage() {
  const [rateCategory, setRateCategory] = useState(RATE_CATEGORIES[0].id);
  const [attendanceHours, setAttendanceHours] = useState('');
  const [travelHours, setTravelHours] = useState('');
  const [waitingHours, setWaitingHours] = useState('');
  const [result, setResult] = useState<CalcResult | null>(null);

  const selectedRate = RATE_CATEGORIES.find((r) => r.id === rateCategory)!;

  function calculate() {
    const att = parseFloat(attendanceHours) || 0;
    const trv = parseFloat(travelHours) || 0;
    const wt = parseFloat(waitingHours) || 0;

    const attendanceCost = att * selectedRate.attendance;
    const travelCost = trv * selectedRate.travelWaiting;
    const waitingCost = wt * selectedRate.travelWaiting;
    const totalCost = attendanceCost + travelCost + waitingCost;
    const escapes = totalCost > ESCAPE_THRESHOLD;
    const claimAmount = escapes ? totalCost : FIXED_FEE;

    setResult({ attendanceCost, travelCost, waitingCost, totalCost, escapes, claimAmount });
  }

  function reset() {
    setAttendanceHours('');
    setTravelHours('');
    setWaitingHours('');
    setResult(null);
    setRateCategory(RATE_CATEGORIES[0].id);
  }

  return (
    <div className="page-container">
      <div className="mx-auto max-w-4xl">
        <nav className="mb-6 text-sm text-[var(--muted)]">
          <Link href="/" className="text-[var(--gold-link)] no-underline hover:underline">
            Home
          </Link>
          <span className="mx-2">›</span>
          <span>Escape Fee Calculator</span>
        </nav>

        <header className="mb-8">
          <h1 className="text-h1 text-[var(--navy)]">Escape Fee Calculator</h1>
          <p className="mt-3 text-lg text-[var(--muted)]">
            Calculate whether your police station attendance qualifies for escape fees
            under the harmonised fee structure (from 22 December 2025).
          </p>
        </header>

        <ContentReliabilityNotice className="mb-8" />

        <div className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)] sm:p-8">
          <p className="mb-6 text-sm leading-relaxed text-[var(--muted)]">
            The fixed fee for police station attendance is{' '}
            <strong className="text-[var(--foreground)]">£{FIXED_FEE.toFixed(2)}</strong> (all
            schemes). If your calculated profit costs at hourly rates exceed the{' '}
            <strong className="text-[var(--foreground)]">£{ESCAPE_THRESHOLD.toFixed(2)}</strong>{' '}
            escape threshold, you claim the full hourly amount instead. Rates are from Schedule 4 of
            the Criminal Legal Aid (Remuneration) Regulations 2013, as amended by SI 2025/1251.
          </p>

          <h2 className="text-lg font-semibold text-[var(--foreground)]">Case Details</h2>

          <div className="mt-4 space-y-5">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)]" htmlFor="rate-category">
                Rate Category
              </label>
              <select
                id="rate-category"
                value={rateCategory}
                onChange={(e) => setRateCategory(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-base text-[var(--foreground)] sm:text-sm"
              >
                {RATE_CATEGORIES.map((rate) => (
                  <option key={rate.id} value={rate.id}>
                    {rate.label} — £{rate.attendance.toFixed(2)}/hr
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Attendance: £{selectedRate.attendance.toFixed(2)}/hr · Travel/Waiting: £
                {selectedRate.travelWaiting.toFixed(2)}/hr
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--foreground)]" htmlFor="attendance-time">
                Attendance Time (hours)
              </label>
              <input
                id="attendance-time"
                type="number"
                step="0.25"
                min="0"
                placeholder="e.g. 3.5"
                value={attendanceHours}
                onChange={(e) => setAttendanceHours(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-base text-[var(--foreground)] sm:text-sm"
              />
              <p className="mt-1 text-xs text-[var(--muted)]">
                Total time at the station (consultation, interview, waiting for decisions etc.)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--foreground)]" htmlFor="travel-time">
                Travel Time (hours)
              </label>
              <input
                id="travel-time"
                type="number"
                step="0.25"
                min="0"
                placeholder="e.g. 1.0"
                value={travelHours}
                onChange={(e) => setTravelHours(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-base text-[var(--foreground)] sm:text-sm"
              />
              <p className="mt-1 text-xs text-[var(--muted)]">
                Total travel time to and from the station
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--foreground)]" htmlFor="waiting-time">
                Waiting Time (hours)
              </label>
              <input
                id="waiting-time"
                type="number"
                step="0.25"
                min="0"
                placeholder="e.g. 0.5"
                value={waitingHours}
                onChange={(e) => setWaitingHours(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-base text-[var(--foreground)] sm:text-sm"
              />
              <p className="mt-1 text-xs text-[var(--muted)]">
                Waiting time at the station (if recorded separately from attendance)
              </p>
            </div>

            <div className="flex gap-3">
              <button onClick={calculate} className="btn-gold">
                Calculate
              </button>
              <button onClick={reset} className="btn-outline">
                Reset
              </button>
            </div>
          </div>

          {result ? (
            <div
              className={`mt-6 rounded-[var(--radius)] border p-5 ${
                result.escapes
                  ? 'border-emerald-200 bg-emerald-50'
                  : 'border-yellow-200 bg-yellow-50'
              }`}
            >
              <h3 className="text-lg font-semibold text-[var(--foreground)]">
                {result.escapes ? '✅ Case ESCAPES the fixed fee' : '⚠️ Case does NOT escape'}
              </h3>
              <div className="mt-3 space-y-1 text-sm">
                <p>
                  Attendance costs:{' '}
                  <strong>£{result.attendanceCost.toFixed(2)}</strong>
                </p>
                <p>
                  Travel costs: <strong>£{result.travelCost.toFixed(2)}</strong>
                </p>
                <p>
                  Waiting costs:{' '}
                  <strong>£{result.waitingCost.toFixed(2)}</strong>
                </p>
                <p className="border-t border-[var(--border)] pt-2 text-base font-semibold">
                  Total profit costs:{' '}
                  <strong>£{result.totalCost.toFixed(2)}</strong>
                </p>
                <p className="text-base">
                  Escape threshold:{' '}
                  <strong>£{ESCAPE_THRESHOLD.toFixed(2)}</strong>
                </p>
                <p className="mt-2 text-base font-bold text-[var(--foreground)]">
                  You should claim:{' '}
                  <span className={result.escapes ? 'text-emerald-700' : 'text-yellow-700'}>
                    £{result.claimAmount.toFixed(2)}
                  </span>
                  {result.escapes ? ' (hourly rate)' : ' (fixed fee)'}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-6 text-sm text-[var(--muted)]">
              Enter your time and click Calculate to see whether the case escapes.
            </p>
          )}
        </div>

        {/* Rate reference table */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">
            Hourly Rate Reference (from 22 December 2025)
          </h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="py-3 pr-4 text-left font-semibold text-[var(--foreground)]">
                    Category
                  </th>
                  <th className="py-3 px-4 text-right font-semibold text-[var(--foreground)]">
                    London
                  </th>
                  <th className="py-3 pl-4 text-right font-semibold text-[var(--foreground)]">
                    National
                  </th>
                </tr>
              </thead>
              {RATE_TABLE.map((group) => (
                <tbody key={group.category}>
                  <tr>
                    <td
                      colSpan={3}
                      className="pt-5 pb-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]"
                    >
                      {group.category}
                    </td>
                  </tr>
                  {group.rows.map((row) => (
                    <tr key={row.label} className="border-b border-[var(--border)]/50">
                      <td className="py-2.5 pr-4 text-[var(--foreground)]">{row.label}</td>
                      <td className="py-2.5 px-4 text-right text-[var(--foreground)]">
                        {row.london}
                      </td>
                      <td className="py-2.5 pl-4 text-right text-[var(--foreground)]">
                        {row.national}
                      </td>
                    </tr>
                  ))}
                </tbody>
              ))}
            </table>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-[var(--muted)]">
            Source: Schedule 4, paragraph 2(3) of the Criminal Legal Aid (Remuneration) Regulations
            2013, as amended by SI 2025/1251. Fixed Fee: £320.00 (all schemes). Escape Threshold:
            £650.00 (all schemes). Mileage (45p/25p per mile) is a separate disbursement and is not
            included in the escape fee calculation.
          </p>
        </section>

        {/* Important notes */}
        <section className="mt-10 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)]">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Important Notes</h2>
          <ul className="mt-4 space-y-3 text-sm text-[var(--muted)]">
            <li className="flex gap-2">
              <span className="shrink-0 text-emerald-600">✅</span>
              <span>
                <strong className="text-[var(--foreground)]">Record time meticulously:</strong> The
                escape fee calculation depends entirely on accurate, contemporaneous time recording
              </span>
            </li>
            <li className="flex gap-2">
              <span className="shrink-0 text-emerald-600">✅</span>
              <span>
                <strong className="text-[var(--foreground)]">Fixed fee OR hourly — never both:</strong>{' '}
                If costs exceed £650, you claim the full hourly amount. If not, you claim the £320
                fixed fee
              </span>
            </li>
            <li className="flex gap-2">
              <span className="shrink-0 text-emerald-600">✅</span>
              <span>
                <strong className="text-[var(--foreground)]">Mileage is separate:</strong> Mileage at
                45p/mile (first 10,000) or 25p/mile (thereafter) is claimed as a disbursement, not
                part of profit costs
              </span>
            </li>
            <li className="flex gap-2">
              <span className="shrink-0 text-emerald-600">✅</span>
              <span>
                <strong className="text-[var(--foreground)]">UFN date matters:</strong> These rates
                apply to cases with a UFN on or after 22 December 2025. Earlier cases use the old
                scheme-specific rates
              </span>
            </li>
            <li className="flex gap-2">
              <span className="shrink-0 text-emerald-600">✅</span>
              <span>
                <strong className="text-[var(--foreground)]">VAT:</strong> VAT-registered providers add
                20% VAT to the claim. Non-VAT-registered providers claim the net amount only
              </span>
            </li>
          </ul>
        </section>

        {/* Related links */}
        <section className="mt-10 grid gap-4 sm:grid-cols-3">
          <Link
            href="/PoliceStationRates"
            className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)] no-underline transition-all hover:shadow-[var(--card-shadow-hover)] hover:border-[var(--accent)]/30"
          >
            <h3 className="font-semibold text-[var(--foreground)]">Police Station Rates</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">Complete rate guide 2025/26</p>
          </Link>
          <Link
            href="/FormsLibrary"
            className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)] no-underline transition-all hover:shadow-[var(--card-shadow-hover)] hover:border-[var(--accent)]/30"
          >
            <h3 className="font-semibold text-[var(--foreground)]">Forms Library</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">CRM forms &amp; documents</p>
          </Link>
          <Link
            href="/Wiki"
            className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)] no-underline transition-all hover:shadow-[var(--card-shadow-hover)] hover:border-[var(--accent)]/30"
          >
            <h3 className="font-semibold text-[var(--foreground)]">Claiming &amp; Billing Guide</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">Detailed wiki articles</p>
          </Link>
        </section>

        <p className="mt-8 text-xs leading-relaxed text-[var(--muted)]">
          Disclaimer: This calculator provides estimates for guidance only. Always refer to the
          current Criminal Legal Aid (Remuneration) Regulations 2013 (as amended) and LAA guidance
          for definitive rates. Rates shown are from SI 2025/1251 for cases with UFN on or after 22
          December 2025. Consult your supervisor or contract manager for complex claims.
        </p>
      </div>
    </div>
  );
}
