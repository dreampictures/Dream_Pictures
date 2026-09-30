---
name: DailyAmount PIN screen
description: The intended background and decorative flare behavior for DailyAmount's PIN gate.
---

Use the uploaded image as the PIN screen's full-viewport background. Add a lightweight CSS cinematic flare that crosses the background diagonally in one 3.7-second pass: warm halo/core, streaks, lens ring, subtle blue ghost, bokeh, and dust. Keep it above the image and below all login UI, then fade it fully away with no settled glow. Reduced-motion users get only a very subtle static halo. Do not change PIN, authentication, route, API, database, or session behavior.

**Why:** The latest specification supersedes the earlier settled-glow direction. It calls for a full-background pass that disappears completely and keeps all login behavior untouched.

**How to apply:** Keep the main PIN screen and isolated LoginReference preview in sync. Normal mounts and refreshes should start the effect; back-forward-cache restoration should restart only the decorative layer, without storing a played flag or resetting PIN/form state. Verify visuals in the isolated preview, not on the protected live PIN page.