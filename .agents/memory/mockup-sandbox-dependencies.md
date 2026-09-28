---
name: Mockup sandbox dependencies
description: Diagnose component preview failures caused by missing artifact-local packages.
---

Before changing Vite or Tailwind configuration for a component-preview error, check whether the artifact's own dependencies are installed. An artifact can have a complete package manifest but no local `node_modules`, even when the root app has related dependencies. Install from the artifact directory and restart its existing preview workflow.

**Why:** The sandbox preview reported a missing Tailwind module despite the package being declared. Installing within the artifact fixed it without changing the main app's dependencies.

**How to apply:** For preview-only package resolution failures, inspect artifact-local dependencies and install them there before changing configuration.