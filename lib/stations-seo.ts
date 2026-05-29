/** Shared SEO copy and FAQs for the police stations directory and correction form. */

export const STATIONS_DIRECTORY_FAQS = [
  {
    q: 'Where can I find UK police station phone numbers?',
    a: 'Use the PoliceStationRepUK Stations Directory to search by station name, police force, or county. Listings show custody suite numbers, switchboard lines, and addresses where we hold them.',
  },
  {
    q: 'How do I report an incorrect police station telephone number?',
    a: 'Open Suggest a Station Update, select the station, and enter the correct phone number (custody suite, main line, or non-emergency). We review every submission before updating the public directory.',
  },
  {
    q: 'Who can suggest corrections to station addresses or phone numbers?',
    a: 'Accredited reps, criminal defence solicitors, firm staff, and anyone who uses custody suites regularly. You do not need an account — provide the station and the number or address that should be shown.',
  },
  {
    q: 'How quickly are station phone number corrections published?',
    a: 'Corrections are reviewed by an administrator before going live. This keeps the directory accurate and protects against spam or malicious changes.',
  },
] as const;

export const UPDATE_STATION_FAQS = [
  {
    q: 'What should I include when reporting a wrong police station phone number?',
    a: 'Select the station, enter the correct custody suite or main line number, and add a short note (e.g. “new custody desk number from signage” or “verified by calling today”).',
  },
  {
    q: 'Can I update a police station address as well as the telephone number?',
    a: 'Yes. The same form accepts address, postcode, custody phone, main line, and non-emergency number corrections.',
  },
  {
    q: 'Will my suggestion appear immediately on the website?',
    a: 'No. All suggestions are reviewed first. Once approved, the updated number appears on the station page and in the directory search results.',
  },
] as const;
