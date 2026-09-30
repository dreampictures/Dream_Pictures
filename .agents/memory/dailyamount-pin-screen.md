---
name: DailyAmount PIN screen
description: Preserve the supplied PIN background and use the approved one-shot 3D lock reveal.
---

Use the supplied image as the PIN screen's static full-viewport background. The decorative reveal is a one-shot, metallic 3D lock turn-in confined to the lock area, with a lighting sweep and glint. Reduced-motion users get a static lock. Keep the main PIN screen and isolated LoginReference preview in sync. Do not change PIN controls, authentication, routes, APIs, database, or session behavior.

**Why:** The user selected a real 3D lock reveal instead of the previous CSS lens flare and requires the supplied background and PIN flow to remain untouched.

**How to apply:** Keep the decorative animation independent from PIN/form state; back-forward-cache restoration may replay only the lock reveal. Verify visuals in the isolated preview, not on the protected live PIN page, and never request or reuse the real PIN.