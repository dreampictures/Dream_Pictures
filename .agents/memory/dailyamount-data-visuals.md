---
name: DailyAmount visual constraints
description: Data accuracy, reference composition, and PIN-safe visual QA constraints for DailyAmount.
---

DailyAmount's overview chart and KPI sparklines must use saved daily-entry records within the selected range, ending no later than the selected date or today. Do not synthesize missing dates or unsaved values. Historical Difference stays empty unless saved difference or transaction totals are present; the donut remains based on current totals.

**Why:** The user approved the existing visual design but requires all historical chart values to come from real records. Transaction totals are stored separately and are absent from the existing history response, so balance-only estimates would be misleading.

**How to apply:** Filter saved records client-side for 7D/30D/90D without filling calendar gaps; do not add unsaved current form values. Leave the Difference sparkline blank unless its historical inputs exist. Derive donut slices and percentages from current totals and retain the zero-total state.

## PIN-safe visual QA

Never request or reuse the user's real PIN to inspect the dashboard. Use an isolated browser profile with a deliberately invalid test value or mocked responses, and do not issue write requests during visual checks.

**Why:** The dashboard is PIN-protected, and layout verification should not expose credentials or alter financial records.

**How to apply:** When capturing `/dailyamount` without an authorized demo fixture, keep the test browser isolated and confirm protected API calls remain rejected.

## Reference composition

At desktop widths, span the header across the full viewport above a compact sidebar, keep transactions in the upper-right column, and place reconciliation beside the balance overview on the bottom row. Use the top header as the single date control and preserve mobile stacking.

**Why:** The supplied reference uses a full-width header and this panel split; a repeated transaction date control wastes filter-row space, and leaving reconciliation nested in the transaction column shortens the transaction feed.

**How to apply:** Treat the visible grid as intentional even if component wrappers group panels differently. Keep visual placement in CSS and avoid changing data or interaction logic.

The Balance Overview donut should be sized in proportion to the card's available content height, with only a small vertical inset; avoid keeping it capped at the former 60–84px size.

**Why:** The user supplied a reference with the donut as a prominent focal element and clarified that the earlier responsive size was still too small.

**How to apply:** When adjusting this panel, enlarge the donut and its center labels together while keeping the historical chart, breakdown, and current-total data behavior intact.