---
name: DailyAmount data visuals
description: Data accuracy constraints for DailyAmount summaries, calculations, and trends.
---

DailyAmount dashboard visuals must stay backed by stored entries and existing calculations. Do not invent daily deltas or trend points; charts should use saved history and show an empty state when history is unavailable.

**Why:** The user wants the existing database-backed amounts and calculations preserved and explicitly does not want fabricated values.

**How to apply:** When changing dashboard metrics or charts, use the authenticated API and saved entries. Limit historical views to the selected date and keep missing-history states explicit.