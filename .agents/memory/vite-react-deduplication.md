---
name: Vite React deduplication
description: Prevent invalid hook calls when Vite resolves React through multiple pnpm symlink paths.
---

In this workspace, Vite optimized React once from the pnpm store and again through the root `node_modules` symlink. `npm ls` showed only one React version, but the distinct module instances caused ReactDOM's hook dispatcher to differ from hooks imported by app components.

**Why:** The DailyAmount route failed at an app-level `useRef` with `dispatcher.useRef` / invalid-hook-call errors despite matching React and ReactDOM versions.

**How to apply:** Keep `resolve.dedupe` set to `["react", "react-dom"]` in the root Vite config. After changing it, restart the main workflow and verify a fresh `/dailyamount` load.