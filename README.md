# Environment Comparator

Expo Web app for comparing exported records from two environments and generating ready-to-share text outputs.

## Overview

This project helps compare source and target environment exports by record ID and last modified date. It produces three review panels:

- main environment export
- new environment export
- black listed file with mismatched records

Each panel can be exported as a timestamped `.txt` document directly from the UI.

## Screenshots

### Comparison Results

![Comparison results](docs/images/comparison-results.png)

### Input Modal

![Input modal](docs/images/input-modal.png)

## Quick Start

```sh
npm install
npm run web
```

The app opens in Expo Web. The initial compare flow is preloaded with sample data so the first run works immediately.

## Main Workflow

1. Open the input modal with `Edit inputs` if you need to adjust the seeded environment data.
2. Run the comparison.
3. Review the generated outputs for both environments and the blacklist section.
4. Click `Extract info` on any result panel to export its visible content as a text file.

## Export Behavior

- Each extract action creates a text file from the selected panel.
- Filenames are sanitized and timestamped.
- Example blacklist export: `Black listed file_YYYY-MM-DD_HH-mm-ss.txt`.
- Web download is the supported export path.

## Tech Stack

- Expo SDK 56
- React Native Web
- Jest for unit tests
- Playwright for end-to-end tests

## Testing

```sh
npm test
npm run test:e2e
```

Notes:

- E2E tests use stable `testID` hooks on React Native Web controls.
- If adding new Expo packages hits the current peer dependency conflict in the test toolchain, use `npm install --legacy-peer-deps`.

## Repository Note

Suggested GitHub repository description:

`Expo web app for comparing environment record exports and generating text-based mismatch reports.`