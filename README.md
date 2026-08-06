# imports-iuu-prototype

`Node.js` prototype template, using the [GOV.UK Prototype Kit](https://github.com/alphagov/govuk-prototype-kit) and
the [GOV.UK Frontend](https://github.com/alphagov/govuk-frontend).

> Basically the `GOV.UK Prototype Kit` and `GOV.UK Frontend` wrapped up and provided on the Core Delivery Platform

- [imports-iuu-prototype](#imports-iuu-prototype)
  - [Service-specific prototype journey](#service-specific-prototype-journey)
    - [What this prototype covers](#what-this-prototype-covers)
    - [Service journey (current routes)](#service-journey-current-routes)
    - [Additional Alpha journey: inspection recording](#additional-alpha-journey-inspection-recording)
    - [Design notes](#design-notes)
    - [Important prototype limitations](#important-prototype-limitations)
  - [Requirements](#requirements)
    - [Node.js](#nodejs)
  - [GOV.UK Prototype Kit and GOV.UK Frontend](#govuk-prototype-kit-and-govuk-frontend)
  - [Using the refreshed GOV.UK brand](#using-the-refreshed-govuk-brand)
  - [Setting a password](#setting-a-password)
  - [Setting multiple passwords](#setting-multiple-passwords)
  - [Removing the need for a password](#removing-the-need-for-a-password)
  - [Npm scripts](#npm-scripts)
  - [Updating dependencies](#updating-dependencies)
  - [Environment Variables and Secrets](#environment-variables-and-secrets)
    - [Local development](#local-development)
    - [Environment Variables on CDP](#environment-variables-on-cdp)
    - [Environment Variables in the GOV.UK Prototype Kit](#environment-variables-in-the-govuk-prototype-kit)
    - [Secrets](#secrets)
  - [Creating a secret](#creating-a-secret)
  - [Docker](#docker)
    - [Development image](#development-image)
    - [Production image](#production-image)
    - [Debug docker](#debug-docker)
  - [Licence](#licence)
    - [About the licence](#about-the-licence)

## Service-specific prototype journey

This service prototype covers fish and fish product import notifications into Great Britain.

### What this prototype covers

1. Enter importer details
2. Enter transport and arrival details
3. Add one or more fish species/product lines
4. Upload one or more Catch Certificates
5. Confirm whether a Processing Statement is required, then upload one or more if needed
6. Confirm whether a Non-Manipulation Declaration (NMD) is required, then upload one or more if needed
7. Review details on a Check your answers page
8. Submit and receive a confirmation reference

### Service journey (current routes)

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

### Additional Alpha journey: inspection recording

The prototype also includes a separate inspection journey for Port Health Authority officers.

- Entry points:
  - `/` Prototype selector
  - `/inspections` Inspection work queue
- Functional inspection case:
  - `GB-IUU-2026-10482` at `/inspection/GB-IUU-2026-10482`
- Inspection journey routes:
  - `/inspection/GB-IUU-2026-10482/confirm-details`
  - `/inspection/GB-IUU-2026-10482/check-documents`
  - `/inspection/GB-IUU-2026-10482/identity-checks`
  - `/inspection/GB-IUU-2026-10482/physical-checks`
  - `/inspection/GB-IUU-2026-10482/findings`
  - `/inspection/GB-IUU-2026-10482/outcome`
  - `/inspection/GB-IUU-2026-10482/check-record`
  - `/inspection/GB-IUU-2026-10482/confirmation`
- Supporting research pages:
  - `/inspection/GB-IUU-2026-10482/documents`
  - `/inspection-assumptions`

### Design notes

- Uses GOV.UK styling/components (including Beta phase banner and back link pattern)
- Supports multiple uploads for:
  - Catch Certificates
  - Processing Statements
  - Non-Manipulation Declarations
- Processing Statement and NMD flows use separate Yes/No decision pages before upload pages
- Session data is reset when a user returns to the start page (`/`)

### Important prototype limitations

- File upload is currently simulated in session data (no real file persistence)
- Validation is intentionally lightweight
- Content and logic are designed for prototyping, not production use

## Requirements

### Node.js

Install [Node.js](http://nodejs.org/) `>= v22` and [npm](https://nodejs.org/) `>= v11`. You will find it easier to use
the Node Version Manager [nvm](https://github.com/creationix/nvm)

To use the correct version of Node.js for this application, via nvm:

```bash
cd imports-iuu-prototype
nvm use
```

## GOV.UK Prototype Kit and GOV.UK Frontend

The [GOV.UK Prototype Kit](https://github.com/alphagov/govuk-prototype-kit) is a tool for building interactive
prototypes that look like pages on GOV.UK, it provides components and styles from the
[GOV.UK Frontend](https://github.com/alphagov/govuk-frontend). Both are provided by the
[Government Digital Service (GDS)](https://www.gov.uk/government/organisations/government-digital-service), this
template provides both tools in a wrapper that runs on the Core Delivery Platform at Defra.

> [!NOTE]
> The `GOV.UK Prototype Kit` is built with [express.js](https://expressjs.com/). The `Node.js`
> applications [cdp-node-frontend-template](https://github.com/DEFRA/cdp-node-frontend-template)
> and [cdp-node-backend-template](https://github.com/DEFRA/cdp-node-backend-template) at Defra are built with
> [Hapi.js](https://hapi.dev/)

- For information on the `GOV.UK Prototype Kit` see https://prototype-kit.service.gov.uk/docs/
- For tutorials on how to use the `GOV.UK Prototype Kit`
  see https://prototype-kit.service.gov.uk/docs/tutorials-and-guides
- For help with the underlying `GOV.UK Frontend` see:
  - https://design-system.service.gov.uk/
  - https://github.com/alphagov/govuk-frontend

> [!WARNING]
> The `imports-iuu-prototype` is not a production ready application, it is a tool for prototyping. It is not
> designed to be used in production or to be resilient, secure or performant, nor should it be. It is designed to be
> used for prototyping ideas and testing them with users. It's a great tool for prototyping GOV web applications.

## Using the refreshed GOV.UK brand

The refreshed GOV.UK brand is available and turned on by default in the `imports-iuu-prototype`. To turn it
off simply go to [app/config.json](./app/config.json) and set the `"rebrand"` property to `false`. This will turn off
the refreshed brand and use the legacy brand instead.

```json
{
  "plugins": {
    "govuk-frontend": {
      "rebrand": true
    }
  }
}
```

## Setting a password

> [!CAUTION]
> Do not commit the `.env` file to GitHub, it is in the `.gitignore` file by default. Sensitive information such as a
> password can be provided to a prototype via the Secrets page of your prototype in the CDP Portal Frontend

Basic authentication is on by default in CDP environments for prototypes. This means you will need to set a password
for your prototype. You can do this via your prototypes secrets tab in the Portal Frontend. For information on how to do
this, follow these steps:

1. Read the **Setting a password** section on https://prototype-kit.service.gov.uk/docs/publishing
1. Go to the CDP Portal Frontend
1. Log in
1. Navigate to your prototype on the services list page
1. Navigate to your prototypes `Secrets` tab
1. Add a secret with a name `PASSWORD` and a `value` of your choosing
1. Re-deploy your prototype for the new secrets to be made available to it

## Setting multiple passwords

The `GOV.UK Prototype Kit` has the ability to set up multiple passwords via secrets. For more information on how to do
this read the **If you want to create additional passwords** section on
https://prototype-kit.service.gov.uk/docs/publishing. To add a secret to an environment your prototype is running in
see [Creating a secret](#creating-a-secret)

## Removing the need for a password

By default, the `GOV.UK Prototype Kit` requires a password has been set on your prototype when it has been deployed to
an environment. If you would like to turn off this requirement you can do so by setting the following environment
variable:

```dotenv
ENV USE_AUTH=false
```

This can be set in `cdp-app-config` for instructions on how to do so
read [Environment Variables on CDP](#environment-variables-on-cdp).

## Npm scripts

All available Npm scripts can be seen in [package.json](./package.json)
To view them in your command line run:

```bash
npm run
```

## Updating dependencies

To update dependencies use [npm-check-updates](https://github.com/raineorshine/npm-check-updates):

> The following script is a good start. Check out all the options on
> the [npm-check-updates](https://github.com/raineorshine/npm-check-updates)

```bash
ncu --interactive --format group
```

## Environment Variables and Secrets

Environment variables and Secrets are used to configure your prototype. Where you set them can be seen in the table
below.

| Type                                                      | Environment | Where to set them                                   |
| --------------------------------------------------------- | ----------- | --------------------------------------------------- |
| Sensitive secrets and Non-sensitive environment variables | local       | `.env` file                                         |
| Sensitive secrets                                         | CDP         | CDP Portal Frontend services secrets page           |
| Non-sensitive environment variables                       | CDP         | CDP App Config repository by raising a pull request |

### Local development

> [!CAUTION]
> Do not store passwords in GitHub. Sensitive information such as a password can be provided to a prototype via the
> secrets page in the CDP Portal Frontend. The `.env` file is for local development only.

To set environment variables and secrets locally copy the [.env.template](./.env.template) file to `.env` and add any
environment variables or secrets your local environment needs.

### Environment Variables on CDP

When your prototype is running on a CDP environment, E.g. `dev` or `ext-test`. You can set environment variables via a
GitHub pull request.

To add environment variables read - https://github.com/DEFRA/cdp-documentation/blob/main/how-to/config.md. This will
guide you to add non-sensitive environment variables to the https://github.com/DEFRA/cdp-app-config repository via a
pull request.

### Environment Variables in the GOV.UK Prototype Kit

The following environment variables are available in the `GOV.UK Prototype Kit`. For more information see
their https://prototype-kit.service.gov.uk/docs/ or https://github.com/alphagov/govuk-prototype-kit.

| Name            | Value    | Description                                              |
| --------------- | -------- | -------------------------------------------------------- |
| `PASSWORD`      | `string` | Password for basic authentication                        |
| `PASSWORD_KEYS` | `string` | Comma-separated list of keys for password authentication |

### Secrets

To add sensitive environment variables know as secrets to your prototype. Add them via your prototypes secrets page on
the CDP Portal.

## Creating a secret

1. Go to the CDP Portal Frontend
1. Log in
1. Navigate to your prototype on the services list page
1. Navigate to your prototypes `Secrets` tab
1. Add a secret on your chosen environment with a `name` and `value` of your choosing
1. Re-deploy your prototype for the new secrets to be made available to it

## Docker

For the most part you will not need to be concerned with `docker` when running this prototype. Everything is set up and
your `docker` will automatically be built, published and pushed when you deploy a new version of your prototype via the
UI in the CDP Portal.

### Development image

Build:

```bash
docker build --target development --no-cache --tag imports-iuu-prototype:development .
```

Run:

```bash
docker run -e PORT=3000 -p 3000:3000 imports-iuu-prototype:development
```

### Production image

Build:

```bash
docker build --no-cache --tag imports-iuu-prototype .
```

Run:

> Update the password field to your password

```bash
docker run -e ****** -e PORT=3000 -p 3000:3000 imports-iuu-prototype
```

### Debug docker

To debug issues in docker and to have a look at the built docker container in the same way as when it runs on CDP. You
can run an interactive shell:

Build:

```bash
docker build --no-cache --tag imports-iuu-prototype .
```

Run:

```bash
docker run -it --entrypoint /bin/ash imports-iuu-prototype
```

## Licence

THIS INFORMATION IS LICENSED UNDER THE CONDITIONS OF THE OPEN GOVERNMENT LICENCE found at:

<http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3>

The following attribution statement MUST be cited in your products and applications when using this information.

> Contains public sector information licensed under the Open Government license v3

### About the licence

The Open Government Licence (OGL) was developed by the Controller of Her Majesty's Stationery Office (HMSO) to enable
information providers in the public sector to license the use and re-use of their information under a common open
licence.

It is designed to encourage use and re-use of information freely and flexibly, with only a few conditions.
