# Environment Comparator

Small Expo web app for comparing exported environment records and generating text outputs for review.

## Start

```sh
npm install
npm run web
```

The app opens in Expo Web. The compare flow is preloaded with sample source and target data so the first run works immediately.

## How It Works

1. Review or edit the source and target environment inputs.
2. Run the comparison.
3. Inspect the three generated result panels:
   - main environment export
   - new environment export
   - black listed file
4. Use `Extract info` on any panel to generate a `.txt` document from the visible content.

## Export Behavior

- Each extract action creates a text file from the selected result panel.
- Filenames are sanitized and timestamped.
- The blacklist panel exports as `Black listed file_YYYY-MM-DD_HH-mm-ss.txt`.
- Web download is the supported export path.

## Tests

```sh
npm test
npm run test:e2e
```

Notes:

- E2E tests target stable `testID` hooks on the React Native Web controls.
- If installing new Expo packages fails because of the existing peer dependency conflict in the test toolchain, install with `npm install --legacy-peer-deps`.