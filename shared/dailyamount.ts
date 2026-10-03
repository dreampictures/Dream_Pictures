export const DAILY_AMOUNT_TIME_ZONE = "Asia/Kolkata";
export const MAX_DAILY_AMOUNT_RUPEES = Number.MAX_SAFE_INTEGER / 2_000;

export function dateKeyInTimeZone(date: Date, timeZone = DAILY_AMOUNT_TIME_ZONE): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export type DailyAmountEntryValues = {
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

export const DAILY_AMOUNT_NOTE_FIELDS = [
  { key: "notes10", denomination: 10 },
  { key: "notes20", denomination: 20 },
  { key: "notes50", denomination: 50 },
  { key: "notes100", denomination: 100 },
  { key: "notes200", denomination: 200 },
  { key: "notes500", denomination: 500 },
] as const;

const MONEY_FIELDS = [
  "openingBalance",
  "coins",
  "bobSaving",
  "bobCurrent",
  "hdfc",
  "kotak",
  "au",
  "sbi",
  "aepsBob",
  "aepsFino",
  "aepsPayworld",
  "aepsDigipay",
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function toPaise(value: number): number {
  return Math.round(value * 100);
}

export function fromPaise(value: number): number {
  return value / 100;
}

export function isValidMoneyAmount(value: unknown): value is number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > MAX_DAILY_AMOUNT_RUPEES) {
    return false;
  }
  const paise = value * 100;
  return Number.isSafeInteger(Math.round(paise)) && Math.abs(paise - Math.round(paise)) < 1e-7;
}

export function isValidDateKey(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const timestamp = Date.parse(`${value}T00:00:00.000Z`);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === value;
}

export function getDailyEntryValidationError(value: unknown): string | null {
  if (!isRecord(value)) return "Entry data is missing or invalid.";

  for (const { key, denomination } of DAILY_AMOUNT_NOTE_FIELDS) {
    const count = value[key];
    const maxCount = Math.floor(MAX_DAILY_AMOUNT_RUPEES / denomination);
    if (typeof count !== "number" || !Number.isSafeInteger(count) || count < 0 || count > maxCount) {
      return "Cash note counts must be non-negative whole numbers.";
    }
  }

  for (const key of MONEY_FIELDS) {
    if (!isValidMoneyAmount(value[key])) {
      return "Balances and coins must be non-negative amounts with no more than two decimal places.";
    }
  }

  return null;
}

export function getDailyTransactionValidationError(value: unknown): string | null {
  if (!isRecord(value)) return "Transaction data is missing or invalid.";
  if (!isValidDateKey(value.date)) return "Transaction date must be a valid calendar date.";
  if (value.type !== "income" && value.type !== "expense") return "Transaction type must be income or expense.";
  if (!isValidMoneyAmount(value.amount) || value.amount <= 0) {
    return "Transaction amount must be positive and have no more than two decimal places.";
  }
  if (value.note !== undefined && (typeof value.note !== "string" || value.note.length > 500)) {
    return "Transaction note must be text up to 500 characters.";
  }
  return null;
}

export function calculateCashTotalPaise(
  values: Pick<DailyAmountEntryValues, "notes10" | "notes20" | "notes50" | "notes100" | "notes200" | "notes500" | "coins">,
): number {
  return DAILY_AMOUNT_NOTE_FIELDS.reduce(
    (total, { key, denomination }) => total + values[key] * denomination * 100,
    toPaise(values.coins),
  );
}

export function calculateBankTotalPaise(
  values: Pick<DailyAmountEntryValues, "bobSaving" | "bobCurrent" | "hdfc" | "kotak" | "au" | "sbi">,
): number {
  return [values.bobSaving, values.bobCurrent, values.hdfc, values.kotak, values.au, values.sbi]
    .reduce((total, amount) => total + toPaise(amount), 0);
}

export function calculateAepsTotalPaise(
  values: Pick<DailyAmountEntryValues, "aepsBob" | "aepsFino" | "aepsPayworld" | "aepsDigipay">,
): number {
  return [values.aepsBob, values.aepsFino, values.aepsPayworld, values.aepsDigipay]
    .reduce((total, amount) => total + toPaise(amount), 0);
}

export function calculateExpectedBalancePaise(
  openingBalance: number,
  incomePaise: number,
  expensePaise: number,
): number {
  return toPaise(openingBalance) + incomePaise - expensePaise;
}

export function sumAmountsPaise(amounts: readonly number[]): number {
  return amounts.reduce((total, amount) => total + toPaise(amount), 0);
}