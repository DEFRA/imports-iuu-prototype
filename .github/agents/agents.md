# Known patterns

## Independent prototype parts and versions

- Keep the root `app/views` and `app/assets` limited to the prototype selector.
- Put each journey version in `app/part{n}/v{n}` with its own `assets`, `data`, `helpers`, `routes`, and `views`.
- Mount each version's router at its own base path, such as `/part1/v2`, and expose that base path to templates as `basePath`.
- Keep links, form actions, redirects, client-side navigation, templates, session data, and assets inside the version's namespace.
- Duplicate a previous version's complete folder to start a new version. Do not import journey code, data, views, or assets from another part or version.
- Add each new version to the root selector and `app/routes.js`.
