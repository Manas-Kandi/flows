# Contributing to Flows

Thank you for your interest in contributing to Flows! This document provides guidelines and instructions for contributing.

## Development Setup

### Prerequisites
- Node.js 20+ with pnpm 8+
- Go 1.21+
- Docker & Docker Compose
- Git

### Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/flows-dev/flows.git
   cd flows
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Start development environment**
   ```bash
   docker-compose up -d redis postgres kafka
   pnpm dev
   ```

4. **Access the application**
   - Web client: http://localhost:3000
   - Collaboration service: http://localhost:8081
   - Geometry service: http://localhost:8082

## Project Structure

- `apps/` - Client applications (web, desktop)
- `services/` - Backend microservices
- `packages/` - Shared libraries and utilities
- `infrastructure/` - Deployment and infrastructure code

## Development Workflow

### Branch Naming
- `feature/` - New features
- `fix/` - Bug fixes
- `chore/` - Maintenance tasks
- `docs/` - Documentation updates

### Commit Messages
Follow conventional commits:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Formatting
- `refactor:` - Code restructuring
- `test:` - Tests
- `chore:` - Maintenance

### Pull Requests

1. Create a feature branch from `develop`
2. Make your changes
3. Write/update tests
4. Ensure all tests pass: `pnpm test`
5. Lint your code: `pnpm lint`
6. Create a pull request to `develop`

### Code Style

- TypeScript: Follow ESLint rules
- Go: Follow `gofmt` and `golint` standards
- Use meaningful variable names
- Write comments for complex logic
- Keep functions small and focused

## Testing

### Running Tests
```bash
# All tests
pnpm test

# Specific workspace
pnpm --filter @flows/web test

# Watch mode
pnpm test:watch
```

### Writing Tests
- Unit tests for business logic
- Integration tests for API endpoints
- E2E tests for critical user flows
- Aim for >80% code coverage

## Documentation

- Update README.md for significant changes
- Add JSDoc comments for public APIs
- Update type definitions
- Include examples in documentation

## Review Process

1. All PRs require at least one approval
2. CI must pass (lint, test, build)
3. Security scans must pass
4. No merge conflicts with target branch

## Getting Help

- GitHub Discussions for questions
- GitHub Issues for bugs
- Slack workspace for team communication

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.
