import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateAepsTotalPaise,
  calculateBankTotalPaise,
  calculateCashTotalPaise,
  calculateExpectedBalancePaise,
  dateKeyInTimeZone,
  getDailyEntryValidationError,
  getDailyTransactionValidationError,
  isValidDateKey,
  sumAmountsPaise,
} from "./dailyamount";

const emptyEntry = {
  openingBalance: 0,
  notes10: 0,
  notes20: 0,
  notes50: 0,
  notes100: 0,
  notes200: 0,
  notes500: 0,
  coins: 0,
  bobSaving: 0,
  bobCurrent: 0,
  hdfc: 0,
  kotak: 0,
  au: 0,
  sbi: 0,
  aepsBob: 0,
  aepsFino: 0,
  aepsPayworld: 0,
  aepsDigipay: 0,
};

test("totals add rupees in exact paise", () => {
  const entry = {
    ...emptyEntry,
    notes500: 1,
    notes200: 2,
    coins: 0.5,
    bobSaving: 0.1,
    bobCurrent: 0.2,
    aepsFino: 1000,
  };

  const cash = calculateCashTotalPaise(entry);
  const bank = calculateBankTotalPaise(entry);
  const aeps = calculateAepsTotalPaise(entry);
  const system = cash + bank + aeps;
  const income = sumAmountsPaise([10.1, 0.2]);
  const openingBalance = (system - income + 5_000) / 100;
  const expected = calculateExpectedBalancePaise(openingBalance, income, 5_000);

  assert.equal(cash, 90_050);
  assert.equal(bank, 30);
  assert.equal(aeps, 100_000);
  assert.equal(system, 190_080);
  assert.equal(income, 1_030);
  assert.equal(expected, system);
});

test("entry validation rejects fractional or negative note counts and excess precision", () => {
  assert.equal(getDailyEntryValidationError(emptyEntry), null);
  assert.match(getDailyEntryValidationError({ ...emptyEntry, notes500: 0.5 }) ?? "", /whole numbers/);
  assert.match(getDailyEntryValidationError({ ...emptyEntry, notes10: -1 }) ?? "", /whole numbers/);
  assert.match(getDailyEntryValidationError({ ...emptyEntry, coins: 1.239 }) ?? "", /two decimal places/);
  assert.match(getDailyEntryValidationError({ ...emptyEntry, openingBalance: -1 }) ?? "", /two decimal places/);
});

test("transaction validation checks date, type, and positive paise amounts", () => {
  assert.equal(isValidDateKey("2024-02-29"), true);
  assert.equal(isValidDateKey("2025-02-29"), false);
  assert.equal(getDailyTransactionValidationError({
    date: "2026-10-03",
    type: "income",
    amount: 12.34,
    note: "Test",
  }), null);
  assert.match(getDailyTransactionValidationError({
    date: "2026-02-30",
    type: "income",
    amount: 12,
  }) ?? "", /calendar date/);
  assert.match(getDailyTransactionValidationError({
    date: "2026-10-03",
    type: "refund",
    amount: 12,
  }) ?? "", /type/);
  assert.match(getDailyTransactionValidationError({
    date: "2026-10-03",
    type: "expense",
    amount: 0,
  }) ?? "", /positive/);
});

test("the business date follows India time just after local midnight", () => {
  assert.equal(
    dateKeyInTimeZone(new Date("2026-09-30T18:31:00.000Z")),
    "2026-10-01",
  );
});