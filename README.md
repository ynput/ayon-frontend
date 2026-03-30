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
| `SERVER_URL` | AYON server base URL | `http://localhost:8000` |

## Development Tips

- Use `yarn lint:fix` to automatically fix linting issues
- Use `yarn format` to format code according to project standards
- Run `yarn test` before submitting pull requests
- The project uses TypeScript - ensure type safety in your code

## License

See LICENSE file for details.

