---
name: DailyAmount visual constraints
description: Data accuracy, reference composition, and PIN-safe visual QA constraints for DailyAmount.
---

DailyAmount chart visuals may use decorative static curves when they make no historical claim. The balance donut must use current cash, bank, and AEPS totals and percentages, with a clear zero-total state. Never invent historical data.

**Why:** The user wants the target chart appearance without adding historical logic, while all displayed financial values and donut proportions remain tied to current saved data.

**How to apply:** Treat KPI waves and the orange overview curve as decoration, not trends. Derive donut slices and percentages from the existing totals; render a neutral zero state when their sum is zero.

## PIN-safe visual QA

Never request or reuse the user's real PIN to inspect the dashboard. Use an isolated browser profile with a deliberately invalid test value or mocked responses, and do not issue write requests during visual checks.

**Why:** The dashboard is PIN-protected, and layout verification should not expose credentials or alter financial records.

**How to apply:** When capturing `/dailyamount` without an authorized demo fixture, keep the test browser isolated and confirm protected API calls remain rejected.

## Reference composition

At desktop widths, span the header across the full viewport above a compact sidebar, keep transactions in the upper-right column, and place reconciliation beside the balance overview on the bottom row. Use the top header as the single date control and preserve mobile stacking.

**Why:** The supplied reference uses a full-width header and this panel split; a repeated transaction date control wastes filter-row space, and leaving reconciliation nested in the transaction column shortens the transaction feed.

**How to apply:** Treat the visible grid as intentional even if component wrappers group panels differently. Keep visual placement in CSS and avoid changing data or interaction logic.