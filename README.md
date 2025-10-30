# Flows - Cloud-Native Industrial CAD Platform

A professional-grade, cloud-native parametric CAD platform that blends the modeling depth of SolidWorks and Fusion 360 with modern collaboration, governance, and deployment practices.

## Architecture Overview

```
flows/
├── apps/
│   ├── web/              # React/TypeScript web client
│   ├── desktop/          # Electron desktop application
│   └── docs/             # Documentation site
├── services/
│   ├── geometry/         # Go-based geometry/kernel service
│   ├── collaboration/    # Node.js collaboration & CRDT service
│   ├── file-asset/       # File storage and asset management
│   ├── export/           # Rust export/conversion workers
│   ├── auth/             # Authentication service
│   └── api-gateway/      # API gateway & routing
├── packages/
│   ├── ui/               # Shared UI component library
│   ├── cad-kernel/       # CAD kernel abstractions
│   ├── collaboration-client/ # CRDT client library
│   ├── geometry-types/   # Shared geometry type definitions
│   └── config/           # Shared configuration
├── infrastructure/
│   ├── terraform/        # Infrastructure as Code
│   ├── kubernetes/       # K8s manifests & Helm charts
│   └── docker/           # Dockerfiles for services
└── tools/
    ├── cli/              # Development CLI tools
    └── scripts/          # Build and deployment scripts
```

## Technology Stack

### Frontend
- **Framework**: React 18+ with TypeScript
- **3D Rendering**: Three.js with custom CAD-optimized renderer
- **State Management**: Zustand for application state
- **UI Components**: Custom design system built on Radix UI
- **Styling**: TailwindCSS with design tokens
- **Build Tool**: Vite for fast development

### Backend Services
- **Geometry Service**: Go with Parasolid/ACIS kernel integration
- **Collaboration**: Node.js with Yjs (CRDT), Redis, Kafka
- **Export Workers**: Rust for high-performance conversions
- **API Gateway**: Node.js with Express or Fastify
- **Authentication**: OAuth 2.0/OIDC with SAML 2.0 support

### Infrastructure
- **Container Orchestration**: Kubernetes (AWS EKS/Azure AKS)
- **Service Mesh**: Istio for traffic management & mTLS
- **Observability**: OpenTelemetry, Prometheus, Grafana, Loki
- **Storage**: PostgreSQL, Redis, S3-compatible object storage
- **Message Queue**: Apache Kafka for event streaming

### Desktop
- **Shell**: Electron with native OS integration
- **Offline Cache**: Encrypted local storage with sync queue
- **Auto-Update**: Differential update system

## Getting Started

### Prerequisites
- Node.js 20+ with pnpm 8+
- Go 1.21+
- Rust 1.75+ (for export workers)
- Docker & Docker Compose
- Kubernetes cluster (for full deployment)

### Quick Start

```bash
# Install dependencies
pnpm install

# Start development environment
pnpm dev

# Build all packages
pnpm build

# Run tests
pnpm test

# Start specific service
pnpm --filter @flows/web dev
pnpm --filter @flows/geometry dev
```

## Development Workflow

### Monorepo Commands
```bash
# Install dependencies for all workspaces
pnpm install

# Add dependency to specific workspace
pnpm --filter @flows/web add three

# Run command in all workspaces
pnpm -r build

# Run parallel development servers
pnpm dev
```

### Testing Strategy
- **Unit Tests**: Vitest for TS/JS, Go standard testing
- **Integration Tests**: Playwright for E2E workflows
- **Visual Regression**: Snapshot testing for UI components
- **Performance**: Lighthouse CI for web vitals

### Code Quality
- **Linting**: ESLint + Prettier for TS/JS, golangci-lint for Go
- **Type Checking**: TypeScript strict mode enabled
- **Git Hooks**: Husky for pre-commit validation
- **CI/CD**: GitHub Actions with quality gates

## Project Structure

### Apps
- **web**: Browser-based CAD application with full feature set
- **desktop**: Electron wrapper with offline capabilities
- **docs**: Product documentation and developer guides

### Services
- **geometry**: Core CAD kernel operations, constraint solving, feature evaluation
- **collaboration**: Real-time editing, presence, CRDT synchronization
- **file-asset**: Version storage, deduplication, pre-signed URLs
- **export**: STEP, IGES, STL, DXF, PDF generation workers
- **auth**: User authentication, SSO, RBAC
- **api-gateway**: Request routing, rate limiting, API composition

### Packages
- **ui**: Design system components (buttons, panels, inspectors)
- **cad-kernel**: Abstraction layer over geometry kernels
- **collaboration-client**: Client-side CRDT implementation
- **geometry-types**: Shared types for geometry data structures
- **config**: Shared ESLint, TypeScript, Prettier configurations

## Core Workspaces

### Model Workspace
Parametric part design with sketching, features, and history timeline.

### Assembly Workspace
Component positioning, mates, interference detection, motion studies.

### Document Workspace
Engineering drawings with GD&T, title blocks, and associative views.

### Review Workspace
Collaborative review sessions, commenting, approval workflows.

### Manage Workspace
Branch management, lifecycle states, user administration.

## Key Features

- ✅ **Parametric Modeling**: Constraint-driven sketching with full feature history
- ✅ **Real-Time Collaboration**: Concurrent editing with CRDT synchronization
- ✅ **Git-like Branching**: Parallel exploration with visual diff and merge
- ✅ **Engineering Drawings**: Associative documentation with GD&T support
- ✅ **Assembly Management**: Hierarchical assemblies with mates and motion
- ✅ **Cloud-Native**: Elastic scaling, multi-region deployment
- ✅ **Desktop Parity**: Full feature set in Electron application
- ✅ **Enterprise Ready**: SSO, RBAC, audit logs, compliance tooling

## Roadmap

See [Product Blueprint](./docs/cloud-native-industrial-cad-plan.md) for detailed roadmap.

### Phase 1: Foundation (Months 0-3) ✓ In Progress
- Core modeling MVP with sketching and basic features
- Authentication and project management
- Foundational CI/CD and observability

### Phase 2: Collaboration (Months 4-6)
- Real-time editing infrastructure
- Assembly workspace foundations
- Desktop client alpha

### Phase 3: Documentation (Months 7-9)
- Drawing workspace with GD&T
- Review and commenting system
- Enhanced modeling features

### Phase 4: Enterprise (Months 10-12)
- BOM generation and lifecycle management
- SSO and enterprise integrations
- Performance optimization and scale testing

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines.

## License

Proprietary - All rights reserved.
