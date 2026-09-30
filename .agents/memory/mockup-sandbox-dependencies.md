---
name: Mockup sandbox dependencies
description: Diagnose component preview failures caused by missing artifact-local packages.
---

Before changing Vite or Tailwind configuration for a component-preview error, check whether the artifact's own dependencies are installed. An artifact can have a complete package manifest but no local `node_modules`, even when the root app has related dependencies. Install from the artifact directory and restart its existing preview workflow.

**Why:** The sandbox preview reported a missing Tailwind module despite the package being declared. Installing within the artifact fixed it without changing the main app's dependencies.

**How to apply:** For preview-only package resolution failures, inspect artifact-local dependencies and install them there before changing configuration.

The built-in screenshot browser for this workspace may not provide a WebGL context; WebGL components then render their own fallback rather than the animated scene.

**Why:** The screenshot preview reported that it could not create a WebGL context even though the development server loaded the Three.js bundle successfully.

**How to apply:** Use screenshots to verify layout and fallback behavior, but do not treat them as verification of WebGL animation. Confirm that animation in a WebGL-capable browser when visual confirmation is required.