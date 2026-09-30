---
name: DailyAmount PIN screen
description: The intended background and decorative flare behavior for DailyAmount's PIN gate.
---

Use the user's uploaded background image as the PIN screen's full-viewport background. Keep the golden light as a soft, directional sweep across the lock and glass form. Replay it once on each PIN-gate visit, refresh, and back-forward-cache restore, then leave a subtle settled glow. Reduced-motion users get a static treatment. Do not replace the supplied image or alter PIN/authentication behavior for visual changes.

**Why:** The user clarified that the uploaded background should appear in the preview, overriding the earlier plain-navy-only direction. They rejected the orbit and underline as artificial and asked the one-shot flare to replay on page visits and refreshes, without changing authentication.

**How to apply:** Keep changes visual-only. Let normal mounts and refreshes start the animation; on back-forward-cache restoration, restart only the decorative layers so form state is preserved. Verify the uploaded backdrop in the isolated preview rather than the protected live app.