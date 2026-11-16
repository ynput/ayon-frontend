# AYON Frontend

A modern React application for the AYON project management system. Built with Vite, TypeScript, and the AYON React Components library.

## Prerequisites

- Node.js 16+ 
- Yarn or npm package manager
- A running AYON server instance

## Getting Started

### 1. Install Dependencies

```bash
yarn install
```

This one install also covers `shared/`. Don't run `yarn install` inside `shared/`: a second `node_modules` there gives shared code its own copies of packages such as React and dnd-kit.

### 2. Environment Setup

Create a `.env.local` file in the root directory with the necessary configuration:

```
SERVER_URL=http://localhost:5000
```

Replace `http://localhost:5000` with your actual AYON server URL.

### 3. Start Development Server

```bash
yarn dev
```

The application will be available at `http://localhost:3000`

### Building

```bash
# Build for production
yarn build

# Preview the production build locally
yarn preview
```

### Releasing npm packages

```bash
yarn release:start
```

The guided CLI reviews changes since each package's last npm release, creates a release branch
from `origin/develop`, suggests version bumps (including export/API signals), updates dependency
pins, and commits and pushes the bumps. It then creates a PR using the repository template and
asks before merging, building the merged checkout, and publishing to npm, then shows the final
release status. Type `y` or press Enter to accept a suggestion or continue; type `n` at a
confirmation to stop.

Start with a clean working tree, installed root dependencies, and an authenticated GitHub CLI
(`gh auth login`). GitHub checks, reviews and branch protections still apply; the CLI uses a merge
commit and never bypasses them. If a merge is blocked, resolve its requirements and retry at the
prompt. npm login is started in the terminal if needed.

After GitHub confirms the merge, the CLI automatically switches to `develop`, fast-forwards to
`origin/develop`, and deletes the merged release branch locally and on origin. It refuses to delete
a branch whose tip changed after review. Building and publishing still require confirmation.
The final summary uses successful npm publish acknowledgements for versions released in that run;
other registry lookups refresh npm metadata to avoid stale cached versions.

Rerun `yarn release:start` on the generated release branch to continue an interrupted PR stage.
If the bumped versions are already on `origin/develop` but not npm, it goes straight to the
build/publish stage without bumping again. Failed or declined publishing can be retried this way;
versions already published are skipped. The checkout must match `origin/develop` before publishing,
and failed builds or checkout changes stop publication rather than publishing an unreviewed version.

The individual `release:status`, `release:changes`, `release:bump`, `release:check`,
`release:build` and `release:publish` commands remain available. Interactive `release:changes`
offers to continue into the guided workflow; `--json` and piped output never prompt.
Use `--verbose` for supporting details or `--repo <dir>` for another checkout.
Use the standalone `release:publish --dry-run` for an npm dry run; `release:start` intentionally
does not accept `--yes`, `--force` or `--dry-run`.

### Code Quality

```bash
# Run ESLint
yarn lint

# Fix ESLint issues
yarn lint:fix

# Format code with Prettier
yarn format
```

### API Code Generation

```bash
# Generate REST API types from OpenAPI schema
yarn generate-rest

# Download OpenAPI schema and generate types
yarn generate-rest-all

# Generate GraphQL types from schema
yarn generate-gql
```

### Testing

```bash
# Run Playwright tests
yarn test

# Run tests in UI mode
yarn test-ui

# Run authentication setup tests
yarn test-auth

# View test report
yarn test-report
```

## Project Structure

- `src/` - Main application source code
  - `components/` - Reusable React components
  - `containers/` - Container/smart components
  - `pages/` - Page components
  - `hooks/` - Custom React hooks
  - `context/` - React context providers
  - `services/` - API and external services
  - `types/` - TypeScript type definitions
  - `theme/` - Theme and styling
  - `helpers/` - Utility functions

- `gen/` - Code generation configuration and scripts
- `tests/` - Playwright end-to-end tests
- `shared/` - Shared package for components and utilities

## Environment Variables

The following environment variables should be configured in `.env.local`:

| Variable | Description | Example |
|----------|-------------|---------|
| `SERVER_URL` | AYON server base URL | `http://localhost:5000` |

## Development Tips

- Use `yarn lint:fix` to automatically fix linting issues
- Use `yarn format` to format code according to project standards
- Run `yarn test` before submitting pull requests
- The project uses TypeScript - ensure type safety in your code

## License

See LICENSE file for details.
