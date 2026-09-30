export type PreviewEntry = {
  id: number;
  date: string;
  updatedAt: string;
  openingBalance: number;
  notes10: number;
  notes20: number;
  notes50: number;
  notes100: number;
  notes200: number;
  notes500: number;
  coins: number;
  bobSaving: number;
  bobCurrent: number;
  hdfc: number;
  kotak: number;
  au: number;
  sbi: number;
  aepsBob: number;
  aepsFino: number;
  aepsPayworld: number;
  aepsDigipay: number;
};

function dateOffset(daysAgo: number) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

function updatedAtOffset(daysAgo: number, recordIndex: number) {
  return new Date(Date.now() - daysAgo * 86_400_000 - recordIndex * 13 * 60_000).toISOString();
}

// These fixtures are confined to the isolated visual sandbox. The app uses its protected history API.
export const previewHistory: PreviewEntry[] = [0, 1, 2, 3, 5, 8, 12].map((daysAgo, index) => ({
  id: index + 1,
  date: dateOffset(daysAgo),
  updatedAt: updatedAtOffset(daysAgo, index),
  openingBalance: 162_400 + index * 8_750,
  notes10: 12 + index,
  notes20: 8 + (index % 3),
  notes50: 14 + (index % 4),
  notes100: 18 + index,
  notes200: 11 + (index % 5),
  notes500: 21 + (index % 4),
  coins: 380 + index * 25,
  bobSaving: 18_420 + index * 1_250,
  bobCurrent: 9_600 + index * 840,
  hdfc: 13_700 + index * 460,
  kotak: 6_250 + index * 330,
  au: 4_900 + index * 275,
  sbi: 11_300 + index * 520,
  aepsBob: 5_500 + index * 475,
  aepsFino: 3_240 + index * 290,
  aepsPayworld: 4_150 + index * 180,
  aepsDigipay: 2_880 + index * 220,
}));

export const previewTransactions = [
  { id: 1, date: previewHistory[0].date, type: "income", amount: 2_450, note: "Counter collection" },
  { id: 2, date: previewHistory[0].date, type: "expense", amount: 680, note: "Office supplies" },
  { id: 3, date: previewHistory[1].date, type: "income", amount: 1_850, note: "Wallet settlement" },
];

export function calcSystemBalance(entry: PreviewEntry) {
  const cash = entry.notes10 * 10 + entry.notes20 * 20 + entry.notes50 * 50 +
    entry.notes100 * 100 + entry.notes200 * 200 + entry.notes500 * 500 + entry.coins;
  const bank = entry.bobSaving + entry.bobCurrent + entry.hdfc + entry.kotak + entry.au + entry.sbi;
  const aeps = entry.aepsBob + entry.aepsFino + entry.aepsPayworld + entry.aepsDigipay;
  return { cash, bank, aeps, total: cash + bank + aeps };
}

export function fmt(value: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(value || 0);
}

export function formatDate(dateStr: string) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}