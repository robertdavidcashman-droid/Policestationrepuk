import { SITE_URL } from "@/config/site";
import { PHONE_DISPLAY, SMS_DISPLAY } from "@/config/contact";

/** A4 print-ready HTML — full colour, 2 pages (front + back). Police station focus only. */
export function buildBrochureHtml(): string {
  const stations = [
    "Medway",
    "Maidstone",
    "Canterbury",
    "Margate",
    "Folkestone",
    "Tonbridge",
    "Sevenoaks",
    "North Kent (Gravesend)",
    "Sittingbourne",
    "Swanley",
    "Dover",
    "Bluewater",
  ];

  const stationCount = stations.length;
  const stationPills = stations.map((s) => `<span class="station-pill">${s}</span>`).join("");
  const coverageLine = `${stations.slice(0, 4).join(" · ")} · and every Kent custody suite`;

  return `<!DOCTYPE html>
<html lang="en-GB">
<head>
  <meta charset="utf-8" />
  <title>Police Station Agent — Kent Police Station Cover</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet" />
  <style>
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      font-family: "DM Sans", system-ui, sans-serif;
      font-size: 10pt;
      color: #0f172a;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page {
      width: 210mm;
      height: 297mm;
      position: relative;
      overflow: hidden;
      page-break-after: always;
    }
    .page:last-child { page-break-after: auto; }

    .hero {
      background: linear-gradient(145deg, #071525 0%, #0f2744 30%, #1e40af 65%, #2563eb 100%);
      color: #fff;
      padding: 12mm 16mm 10mm;
      position: relative;
    }
    .hero::before {
      content: "";
      position: absolute;
      left: 0; top: 0; right: 0; bottom: 0;
      background: repeating-linear-gradient(
        -45deg,
        transparent,
        transparent 8mm,
        rgba(255,255,255,0.02) 8mm,
        rgba(255,255,255,0.02) 9mm
      );
      pointer-events: none;
    }
    .hero::after {
      content: "";
      position: absolute;
      right: -15mm;
      top: -10mm;
      width: 80mm;
      height: 80mm;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(251,191,36,0.4) 0%, transparent 68%);
    }
    .hero-inner { position: relative; z-index: 1; }
    .badge {
      display: inline-block;
      background: linear-gradient(90deg, #fbbf24, #f59e0b);
      color: #0c1929;
      font-size: 7pt;
      font-weight: 800;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      padding: 2mm 4mm;
      border-radius: 2mm;
      margin-bottom: 4mm;
    }
    .hero h1 {
      font-family: "Instrument Serif", Georgia, serif;
      font-size: 36pt;
      font-weight: 400;
      line-height: 1.02;
      max-width: 150mm;
      margin-bottom: 3mm;
    }
    .hero h1 em { font-style: italic; color: #fde68a; }
    .hero-sub {
      font-size: 11.5pt;
      line-height: 1.45;
      color: #bfdbfe;
      max-width: 138mm;
      margin-bottom: 6mm;
    }
    .hero-stats {
      display: flex;
      gap: 4mm;
      flex-wrap: wrap;
    }
    .stat {
      background: rgba(255,255,255,0.14);
      border: 1px solid rgba(255,255,255,0.25);
      border-radius: 3mm;
      padding: 2.5mm 4.5mm;
    }
    .stat-num {
      font-size: 15pt;
      font-weight: 800;
      color: #fde68a;
      line-height: 1;
    }
    .stat-label {
      font-size: 7pt;
      color: #e0e7ff;
      margin-top: 1mm;
      text-transform: uppercase;
      letter-spacing: 0.07em;
    }

    .coverage-band {
      background: linear-gradient(90deg, #0f172a, #1e293b);
      color: #fff;
      padding: 5mm 16mm 6mm;
    }
    .coverage-band h2 {
      font-size: 8pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: #fbbf24;
      margin-bottom: 3mm;
      padding-bottom: 2mm;
      border-bottom: 2px solid rgba(251,191,36,0.35);
    }
    .coverage-band .tagline {
      font-size: 9pt;
      color: #cbd5e1;
      margin-bottom: 3mm;
      line-height: 1.4;
    }
    .station-pill {
      display: inline-block;
      background: rgba(59,130,246,0.25);
      color: #e0f2fe;
      font-size: 7.5pt;
      font-weight: 600;
      padding: 1.5mm 3mm;
      border-radius: 999px;
      margin: 0 1.5mm 1.5mm 0;
      border: 1px solid rgba(147,197,253,0.45);
    }
    .coverage-band .station-pill {
      background: rgba(255,255,255,0.1);
      border-color: rgba(255,255,255,0.2);
    }

    .body-p1 {
      padding: 7mm 16mm 5mm;
      background: #f8fafc;
    }
    .section-title {
      font-size: 9pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #1e40af;
      margin-bottom: 3mm;
      padding-bottom: 2mm;
      border-bottom: 3px solid #fbbf24;
      display: inline-block;
    }
    .intro {
      font-size: 10pt;
      line-height: 1.55;
      color: #334155;
      margin-bottom: 5mm;
    }
    .intro strong { color: #1e40af; }

    .services-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 3.5mm;
    }
    .service-card {
      background: #fff;
      border-radius: 3mm;
      padding: 4mm 4.5mm;
      border-left: 4px solid;
      box-shadow: 0 3px 10px rgba(15,23,42,0.08);
    }
    .service-card.legal-aid { border-color: #16a34a; }
    .service-card.private { border-color: #d97706; }
    .service-card h3 {
      font-size: 9.5pt;
      font-weight: 800;
      margin-bottom: 2mm;
    }
    .service-card.legal-aid h3 { color: #15803d; }
    .service-card.private h3 { color: #b45309; }
    .service-card ul {
      list-style: none;
      font-size: 8pt;
      line-height: 1.42;
      color: #475569;
    }
    .service-card li {
      padding-left: 4mm;
      position: relative;
      margin-bottom: 1.2mm;
    }
    .service-card li::before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #16a34a;
      font-weight: 700;
    }

    .cta-strip {
      margin: 0 16mm 8mm;
      background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #1d4ed8 100%);
      border-radius: 4mm;
      padding: 5mm 7mm;
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: #fff;
      box-shadow: 0 6px 20px rgba(30,64,175,0.35);
    }
    .cta-strip p {
      font-size: 10.5pt;
      font-weight: 600;
      max-width: 92mm;
      line-height: 1.35;
    }
    .cta-strip .cta-sub {
      font-size: 8.5pt;
      font-weight: 500;
      opacity: 0.9;
      margin-top: 2mm;
    }
    .cta-phone { text-align: right; }
    .cta-phone .label {
      font-size: 7pt;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      opacity: 0.85;
    }
    .cta-phone .number {
      font-size: 17pt;
      font-weight: 800;
      color: #fde68a;
      letter-spacing: 0.02em;
    }
    .cta-phone .number-secondary {
      font-size: 12pt;
      font-weight: 700;
      color: #fff;
      margin-top: 1.5mm;
    }
    .cta-phone .number-secondary span {
      font-size: 7.5pt;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      opacity: 0.9;
      display: block;
      margin-bottom: 0.5mm;
    }

    .page2-header {
      background: linear-gradient(135deg, #0f172a, #1e3a8a);
      color: #fff;
      padding: 9mm 16mm 7mm;
    }
    .page2-header h2 {
      font-family: "Instrument Serif", Georgia, serif;
      font-size: 24pt;
      font-weight: 400;
      margin-bottom: 2mm;
    }
    .page2-header p {
      font-size: 9.5pt;
      color: #94a3b8;
      line-height: 1.45;
    }

    .coverage-block {
      padding: 6mm 16mm;
      background: #fff;
    }
    .coverage-block h3 {
      font-size: 9pt;
      font-weight: 800;
      color: #1e40af;
      margin-bottom: 3mm;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      padding-bottom: 2mm;
      border-bottom: 3px solid #fbbf24;
      display: inline-block;
    }
    .coverage-block .station-pill {
      background: linear-gradient(180deg, #eff6ff, #dbeafe);
      color: #1e40af;
      border: 1px solid #93c5fd;
    }

    .why-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 3.5mm;
      padding: 0 16mm 6mm;
      background: #fff;
    }
    .why-card {
      background: linear-gradient(180deg, #f8fafc, #f1f5f9);
      border-radius: 3mm;
      padding: 4mm 3mm;
      text-align: center;
      border: 1px solid #e2e8f0;
    }
    .why-icon {
      font-size: 18pt;
      margin-bottom: 2mm;
    }
    .why-card h4 {
      font-size: 8.5pt;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 1.5mm;
    }
    .why-card p {
      font-size: 7.5pt;
      line-height: 1.4;
      color: #64748b;
    }

    .bio-block {
      margin: 0 16mm 6mm;
      background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 40%, #fff 100%);
      border: 2px solid #3b82f6;
      border-radius: 4mm;
      padding: 5mm 6mm;
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 5mm;
      align-items: center;
    }
    .bio-photo {
      width: 26mm;
      height: 26mm;
      border-radius: 50%;
      background: linear-gradient(145deg, #1e40af, #2563eb);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 20pt;
      font-weight: 800;
      font-family: "Instrument Serif", serif;
      box-shadow: 0 4px 14px rgba(30,64,175,0.4);
      flex-shrink: 0;
    }
    .bio-block h3 {
      font-size: 10.5pt;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 2mm;
    }
    .bio-block p {
      font-size: 8.5pt;
      line-height: 1.5;
      color: #475569;
    }

    .contact-footer {
      background: #0f172a;
      color: #e2e8f0;
      padding: 7mm 16mm 9mm;
      margin-top: auto;
    }
    .contact-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 5mm;
    }
    .contact-block h4 {
      font-size: 7.5pt;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #94a3b8;
      margin-bottom: 2mm;
    }
    .contact-block a, .contact-block span {
      display: block;
      font-size: 9.5pt;
      font-weight: 600;
      color: #fff;
      text-decoration: none;
    }
    .contact-block .gold { color: #fbbf24; font-size: 11.5pt; }
    .contact-block .sub {
      font-size: 8pt;
      font-weight: 500;
      color: #94a3b8;
      margin-top: 1.5mm;
    }

    .legal-footer {
      border-top: 1px solid #334155;
      padding-top: 4mm;
      font-size: 6.5pt;
      line-height: 1.5;
      color: #64748b;
    }
    .legal-footer strong { color: #94a3b8; }

    .page2-inner {
      display: flex;
      flex-direction: column;
      min-height: 297mm;
    }
  </style>
</head>
<body>
  <!-- PAGE 1 -->
  <section class="page">
    <div class="hero">
      <div class="hero-inner">
        <span class="badge">Police station agency only</span>
        <h1>Kent police station cover when your firm needs a <em>rep</em></h1>
        <p class="hero-sub">Professional agency attendance at Kent custody suites — in-custody interviews, voluntary interviews, and detailed attendance notes. Evenings, weekends, and bank holidays.</p>
        <div class="hero-stats">
          <div class="stat">
            <div class="stat-num">25+</div>
            <div class="stat-label">Years at station</div>
          </div>
          <div class="stat">
            <div class="stat-num">24/7</div>
            <div class="stat-label">Extended hours</div>
          </div>
          <div class="stat">
            <div class="stat-num">${stationCount}</div>
            <div class="stat-label">Kent suites</div>
          </div>
        </div>
      </div>
    </div>

    <div class="coverage-band">
      <h2>Kent police station coverage</h2>
      <p class="tagline">${coverageLine}</p>
      ${stationPills}
    </div>

    <div class="body-p1">
      <p class="section-title">Agency cover for criminal firms</p>
      <p class="intro">
        <strong>Police Station Agent</strong> provides police station agency cover when your duty rota, distance, or workload needs attendance at short notice. Led by duty-accredited police station solicitor <strong>Robert Cashman</strong> — freelance representation for criminal defence firms across Kent custody suites.
      </p>
      <div class="services-grid">
        <div class="service-card legal-aid">
          <h3>Legal Aid custody cover</h3>
          <ul>
            <li>In-custody suspect interviews</li>
            <li>Voluntary interviews at police stations</li>
            <li>Voluntary interviews at home</li>
            <li>Prison suspect interviews</li>
            <li>Detailed attendance notes for your file</li>
            <li>Competitive fixed agency rates</li>
          </ul>
        </div>
        <div class="service-card private">
          <h3>Private client custody cover</h3>
          <ul>
            <li>Senior attendance at custody suites</li>
            <li>Complex or sensitive station interviews</li>
            <li>Enhanced attendance notes and advice</li>
            <li>Out-of-hours and weekend cover</li>
            <li>Clear fixed-fee agency structure</li>
            <li>Subject to availability &amp; conflicts</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="cta-strip">
      <div>
        <p>Instruct agent cover for your client at any Kent police station.</p>
        <p class="cta-sub">Medway · Maidstone · Canterbury · Gravesend · and all Kent custody suites</p>
      </div>
      <div class="cta-phone">
        <div class="label">Instruct agent cover</div>
        <div class="number">${PHONE_DISPLAY}</div>
        <div class="number-secondary">
          <span>Call or text</span>
          ${SMS_DISPLAY}
        </div>
      </div>
    </div>
  </section>

  <!-- PAGE 2 -->
  <section class="page page2-inner">
    <div class="page2-header">
      <h2>Every Kent custody suite covered</h2>
      <p>Extended hours attendance — evenings, weekends, and bank holidays when your panel needs a police station rep.</p>
    </div>

    <div class="coverage-block">
      <h3>Police stations we attend</h3>
      ${stationPills}
    </div>

    <div class="why-grid">
      <div class="why-card">
        <div class="why-icon">🚔</div>
        <h4>Fast attendance</h4>
        <p>Prompt attendance at Kent custody suites when your rota cannot cover.</p>
      </div>
      <div class="why-card">
        <div class="why-icon">📋</div>
        <h4>PACE-compliant notes</h4>
        <p>Detailed attendance notes — disclosure, advice, and interview outcome.</p>
      </div>
      <div class="why-card">
        <div class="why-icon">🌙</div>
        <h4>Out-of-hours cover</h4>
        <p>Evenings, weekends, and bank holidays when arrests happen most.</p>
      </div>
    </div>

    <div class="bio-block">
      <div class="bio-photo">RC</div>
      <div>
        <h3>Robert Cashman — police station specialist</h3>
        <p>Over 25 years in police station and custody work across Kent. Duty-accredited for police station attendance. Experienced freelance agent cover for criminal defence firms — from minor matters to serious allegations at every Kent custody suite.</p>
      </div>
    </div>

    <div class="contact-footer">
      <div class="contact-row">
        <div class="contact-block">
          <h4>Telephone</h4>
          <span class="gold">${PHONE_DISPLAY}</span>
          <span class="sub">Call or text ${SMS_DISPLAY}</span>
        </div>
        <div class="contact-block">
          <h4>Website</h4>
          <a href="${SITE_URL}/for-solicitors">${SITE_URL.replace("https://", "")}/for-solicitors</a>
        </div>
        <div class="contact-block">
          <h4>Contact</h4>
          <a href="${SITE_URL}/contact">policestationagent.com/contact</a>
        </div>
      </div>
      <div class="legal-footer">
        <strong>Defence Legal Services Limited</strong> T/A Police Station Agent · Company No. 09900871 · ICO ZA198500<br />
        Registered Office: Greenacre, London Road, West Kingsdown, Sevenoaks, Kent TN15 6ER<br />
        Police station agency cover only — we do not attend hearings or provide representation outside the police station stage.
      </div>
    </div>
  </section>
</body>
</html>`;
}
