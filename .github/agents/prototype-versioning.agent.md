---
name: Prototype versioning
description: Creates a new independent prototype version while preserving and archiving existing versions.
---

# Create and archive prototype versions

Create new, independent versions of the affected prototype parts while preserving existing versions as archived snapshots.

## Archiving existing versions

- Treat existing versions as archived snapshots. Keep them available at their existing URLs and do not move them into a separate archive directory.
- When creating a version, change only the new version and the shared files required to register and select it. Do not change an archived version's files or behaviour unless explicitly requested.

## Version structure

- Discover the existing `app/part{n}/v{n}` directories instead of assuming fixed version numbers. Calculate the next version separately for each affected prototype part.
- Keep root `app/views` and `app/assets` files limited to the prototype selector.
- Give every journey version its own `assets`, `data`, `helpers`, `routes`, and `views` beneath `app/part{n}/v{n}`.
- Create a version by copying the latest version's complete directory. Do not import journey code, data, views, or assets from another part or version.
- Keep sample documents and reference files inside the version that uses them. Do not introduce shared root-level journey data.

## Creating a version

1. Identify the latest version of each affected prototype part.
2. Copy each latest version's complete directory to its next version number.
3. Update the copied version's base path, version-local session key, route mounting, asset serving, and view resolution.
4. Register each new router in `app/routes.js`.
5. Add each new version to the root selector, with the newest version first and identified as work in progress where appropriate.
6. Check the copied files for hard-coded paths or version identifiers and update only those that should point to the new version.
7. Validate the new and archived versions using the checklist below.

## Version-local state and navigation

- Mount each version's router at its own base path, such as `/part1/v3`, and expose that path to templates as `basePath`.
- Keep all links, form actions, redirects, pagination URLs, document URLs, client-side navigation, templates, session data, and assets inside the version's namespace.
- Treat each `part{n}-v{n}` session store as the only source of state for that version. Persist current `req.body` values into it before validating or redirecting; do not validate against stale shared-session values.
- Use the standard `/manage-prototype/clear-data` flow and dynamically clear session keys matching the version naming pattern. Never hard-code the available versions.
- Reset version-local journey data at entry boundaries, not during normal navigation within an active journey.

## Verification checklist

- Confirm the new version's pages and assets load from its own namespace.
- Confirm links, form submissions, redirects, pagination, document navigation, and client-side navigation remain inside the new version.
- Confirm journey data persists within the new version and does not leak into or from archived versions.
- Confirm Clear data resets all dynamically discovered version stores.
- Confirm sample documents and reference files resolve from the new version's local directories.
- Confirm every archived version remains available at its existing URL and retains its existing behaviour.
- Confirm the root selector lists the newest version before older versions and links to the correct versioned routes.
- Run the existing targeted tests for the affected journeys and manually check equivalent behaviour in every affected version.
