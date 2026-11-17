# Solid Health App

A Solid application for viewing personal steps, calories, sleep, heart rate and weight. Metrics are read from the user's Pod. The app runs independently or as an embedded application in Solid Dataspace Manager, with German/English UI and a shared standalone appearance.

## Run within Solid Dataspace

For local development, use the [central setup guide](https://github.com/hoelk-f/solid-dataspace/blob/main/LOCAL_DEVELOPMENT.md). It develops Health App, City Tours and the Data Connection Sync Worker while using published images for the other services. It also configures login, routes and the embedded Health App. No GitHub package token is required for that mode.

The routes are `/solid-health-app/` for standalone and `/web/solid-health-app` inside the Manager.

## Standalone development

Use Node 22 or 24 and npm:

```sh
npm ci
npm start
```

Open `http://localhost:3000/solid-health-app/`. Sign in through a Solid provider with an account/Pod you are authorized to use. The UI supports an issuer choice; a Pod account is not created by starting the application.

Build and run the standalone container from this repository:

```sh
docker build -t solid-health-app:local .
docker run --rm -p 127.0.0.1:3000:3000 solid-health-app:local
```

The image serves the app at `/solid-health-app/`. The repository's old `docker-compose.yml` is a machine-specific service fragment, not a complete standalone Compose project; use the commands above or the central local setup.

## Data and synchronization

The app stores selected metrics under the Pod's `health/` folder:

| Metric | Resource |
| --- | --- |
| Steps | `health/steps.ttl` |
| Calories | `health/calories.ttl` |
| Sleep duration | `health/sleep.ttl` |
| Heart rate | `health/heartRates.ttl` |
| Weight | `health/weight.ttl` |

Reads/writes use the signed-in Solid session and the Pod's existing access rules. The Google connection flow lets the user choose which supported metrics to import. It is separate from Solid login. The browser's `syncGoogleToPod` implementation retrieves selected Google Fit data and writes the corresponding Turtle resources. Provider availability, enabled APIs/scopes and Google consent configuration determine whether that import succeeds; a running Dataspace alone does not configure Google access.

The standalone Google OAuth client ID is currently configured in `src/index.tsx`; the embedded component accepts `googleClientId`. The bundled client ID is a public identifier, not a reusable client secret or a guarantee that a new deployment origin is authorized. Configure a client for the intended browser origin when hosting your own build. Never include a Google client secret in frontend code.

The Data Connection Sync Worker is a separate service for configured connections/imports. Starting that worker does not automatically install a Google Fit synchronization job for this app. Existing Pod health files can be viewed without connecting Google.

## Embedded application

The package exports `@hoelk-f/solid-health-app/embed` and `@hoelk-f/solid-health-app/embed.css`. `SolidHealthAppEmbed` accepts `webId`, `language` and `googleClientId`. The host provides the supported shared Solid-session integration; do not start an unrelated second login for the embedded view. An iframe integration can use the existing same-origin Dataspace auth bridge.

```sh
npm run build:lib
```

This creates the embed package through Rollup. The central release workflow keeps the Manager's package version aligned. Direct private-package publishing needs the appropriate GitHub Packages permissions; running the app from source does not require publishing it.

## Checks

```sh
CI=true npm test -- --watchAll=false
npm run build
```

`build` creates both the standalone bundle and embedded package. Test fixtures should contain synthetic data. Do not commit personal health records, Pod credentials or OAuth tokens.

## License and citation

The package declares `Apache-2.0` in [package.json](package.json). This repository is maintained as part of the TMDT Solid Dataspace application family; project citation metadata is available in the [orchestration repository](https://github.com/hoelk-f/solid-dataspace/blob/main/CITATION.cff).
