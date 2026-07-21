# DEFRA Fish Import Notification Prototype

This is a GOV.UK Prototype Kit service for notifying fish and fish product imports into Great Britain.

## What this prototype covers

The prototype allows users to:

1. Enter importer details
2. Enter transport and arrival details
3. Add one or more fish species/product lines
4. Upload one or more Catch Certificates
5. Confirm whether a Processing Statement is required, then upload one or more if needed
6. Confirm whether a Non-Manipulation Declaration (NMD) is required, then upload one or more if needed
7. Review details on a Check your answers page
8. Submit and receive a confirmation reference

## Service journey (current routes)

- `/` Start page (also clears session data)
- `/importer-details`
- `/transport-details`
- `/arrival-details`
- `/species-details`
- `/species-list`
- `/catch-certificates`
- `/processing-statement-required`
- `/processing-statement` (if required)
- `/non-manipulation-declaration-required`
- `/non-manipulation-declaration` (if required)
- `/check-answers`
- `/confirmation`

## Design notes

- Uses GOV.UK styling/components (including Beta phase banner and back link pattern)
- Supports multiple uploads for:
  - Catch Certificates
  - Processing Statements
  - Non-Manipulation Declarations
- Processing Statement and NMD flows use separate Yes/No decision pages before upload pages
- Session data is reset when a user returns to the start page (`/`)

## Running locally

From the project root:

```bash
npm install
npm run dev
```

Then open:

- `http://localhost:3000`

## Tech stack

- [GOV.UK Prototype Kit](https://prototype-kit.service.gov.uk/docs/)
- Node.js / Nunjucks templates
- Route logic in `app/routes.js`

## Important prototype limitations

- File upload is currently simulated in session data (no real file persistence)
- Validation is intentionally lightweight
- Content and logic are designed for prototyping, not production use

