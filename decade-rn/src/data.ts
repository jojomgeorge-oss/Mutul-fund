export type BankKey = 'sur' | 'jana' | 'shri' | 'shiv' | 'unity';

export const LOGOS: Record<string, any> = {
  sur: require('../assets/img/suryoday.png'),
  jana: require('../assets/img/jana.png'),
  shri: require('../assets/img/shriram.png'),
  shiv: require('../assets/img/shivalik.png'),
  unity: require('../assets/img/unity.png'),
  hdfc: require('../assets/img/hdfc.png'),
  gpay: require('../assets/img/gpay.png'),
  phonepe: require('../assets/img/phonepe.png'),
};
// logos that fill their tile edge to edge
export const FULL_LOGO = new Set(['jana', 'shri', 'unity']);

export const BANKS: Record<BankKey, { name: string; long: string; sub: string; tag: string }> = {
  sur: { name: 'Suryoday SF Bank', long: 'Suryoday Small Finance Bank', sub: 'Since 2008 • Public bank', tag: 'DICGC insured' },
  jana: { name: 'Jana SF Bank', long: 'Jana Small Finance Bank', sub: 'Small finance bank', tag: 'DICGC insured' },
  shri: { name: 'Shriram Finance', long: 'Shriram Finance', sub: 'NBFC • RBI regulated', tag: 'RBI regulated' },
  shiv: { name: 'Shivalik SF Bank', long: 'Shivalik Small Finance Bank', sub: 'Small finance bank', tag: 'DICGC insured' },
  unity: { name: 'Unity SF Bank', long: 'Unity Small Finance Bank', sub: 'Small finance bank', tag: 'KYC done' },
};

export type Sel = { bank: BankKey; ten: string; yrs: number; rate: number };

export const REC: Sel[] = [
  { bank: 'sur', ten: '5Y 3M 16D', yrs: 5.29, rate: 8.31 },
  { bank: 'jana', ten: '1Y 6M 12D', yrs: 1.53, rate: 8.25 },
  { bank: 'shiv', ten: '1Y 6M 12D', yrs: 1.53, rate: 8.25 },
];

export const LIST_BANKS: BankKey[] = ['jana', 'shri', 'sur', 'shiv', 'unity'];
export const AMT_BANKS: BankKey[] = ['jana', 'sur', 'shiv', 'shri'];

export const CALC_T: [string, number, string][] = [
  ['6M', 0.5, '6 months'], ['1Y', 1, '1 year'], ['2Y', 2, '2 years'], ['3Y', 3, '3 years'], ['5Y', 5, '5 years'],
];

export const PLANS: { title: string; color: string; items: [string, number, number][] }[] = [
  { title: 'More than 1 year', color: '#c43960', items: [['5 years', 5, 8.25], ['3 years', 3, 4.0], ['1 year', 1, 4.0]] },
  { title: 'Up to 1 year', color: '#8d6197', items: [['6 months', 0.5, 4.0], ['9 months', 0.75, 4.0], ['1 year', 1, 4.0]] },
  { title: 'Up to 3 months', color: '#febd12', items: [['14 days', 14 / 365, 4.0], ['45 days', 45 / 365, 4.25], ['90 days', 90 / 365, 4.5]] },
];

export const LIST_TITLES: Record<string, string> = {
  high: 'High return FD’s', monthly: 'Monthly payout FD’s', instant: 'Instant withdraw FD’s', nopen: 'No penalty withdraw FD’s', all: 'All FD’s',
};

export const inr = (n: number) => {
  const x = String(Math.round(n));
  if (x.length <= 3) return '₹' + x;
  const last = x.slice(-3), rest = x.slice(0, -3);
  return '₹' + rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last;
};
export const maturity = (amt: number, rate: number, yrs: number) => amt * Math.pow(1 + rate / 100, yrs);
export const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
