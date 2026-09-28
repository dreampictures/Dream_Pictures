---
name: DailyAmount visual constraints
description: Data accuracy and PIN-safe visual QA constraints for DailyAmount.
---

DailyAmount dashboard visuals must stay backed by stored entries and existing calculations. Do not invent daily deltas or trend points; charts should use saved history and show an empty state when history is unavailable.

**Why:** The user wants the existing database-backed amounts and calculations preserved and explicitly does not want fabricated values.

**How to apply:** When changing dashboard metrics or charts, use the authenticated API and saved entries. Limit historical views to the selected date and keep missing-history states explicit.

## PIN-safe visual QA

Never request or reuse the user's real PIN to inspect the dashboard. Use an isolated browser profile with a deliberately invalid test value or mocked responses, and do not issue write requests during visual checks.

**Why:** The dashboard is PIN-protected, and layout verification should not expose credentials or alter financial records.

**How to apply:** When capturing `/dailyamount` without an authorized demo fixture, keep the test browser isolated and confirm protected API calls remain rejected.