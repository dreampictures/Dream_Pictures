---
name: DailyAmount PIN screen
description: The intended background and decorative flare behavior for DailyAmount's PIN gate.
---

Use the uploaded image as the PIN screen's static full-viewport background. Drive the one-shot diagonal flare with an elapsed-time `requestAnimationFrame` timeline lasting about 4.4 seconds, using a smooth easing curve, warm-white core, thin anamorphic streak, local bloom, five subtle optical ghosts, and three soft rings. Keep it above the image and below all login UI, then fade it fully away with no settled glow. Reduced-motion users get only a very subtle static golden halo. Do not change PIN, authentication, route, API, database, or session behavior.

**Why:** The latest specification rejects keyframed step-like movement and requires a smooth, frame-independent optical pass that disappears completely while leaving login behavior untouched.

**How to apply:** Keep the main PIN screen and isolated LoginReference preview in sync. Normal mounts, refreshes, and route revisits should start the effect; back-forward-cache restoration should restart only the decorative layer, without storing a played flag or resetting PIN/form state. Verify visuals in the isolated preview, not on the protected live PIN page.