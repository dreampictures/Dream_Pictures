---
name: Fly local image builds
description: Workspace-specific fallback when Fly's remote Depot builder stalls.
---

**Rule:** When Fly's default remote builder stays at “Waiting for depot builder...” in this Replit workspace, use the local Docker daemon with `flyctl deploy --local-only`.

**Why:** A remote Depot build timed out here, while the local Docker build completed and deployed successfully.

**How to apply:** Verify Docker is available, check whether a release was created, and stop the stalled remote deploy before retrying locally. Do not change Fly secrets or database settings to work around a builder stall.