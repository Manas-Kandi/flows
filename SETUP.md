# Quick Setup Guide

Get Flows running locally in under 10 minutes.

## Prerequisites

Ensure you have installed:
- **Node.js** 20+ ([download](https://nodejs.org/))
- **pnpm** 8+ (`npm install -g pnpm`)
- **Docker Desktop** ([download](https://www.docker.com/products/docker-desktop))
- **Git** ([download](https://git-scm.com/))

Optional for full development:
- **Go** 1.21+ ([download](https://go.dev/dl/))
- **Rust** 1.75+ ([download](https://rustup.rs/))

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/flows-dev/flows.git
cd flows
pnpm install
```

### 2. Start Infrastructure

```bash
# Start Redis, PostgreSQL, and Kafka
docker-compose up -d redis postgres kafka zookeeper
```

### 3. Start Development Servers

```bash
# Start all services in development mode
pnpm dev
```

This starts:
- **Web Client**: http://localhost:3000
- **Collaboration Service**: http://localhost:8081
- **Geometry Service**: http://localhost:8082

### 4. Open Application

Navigate to **http://localhost:3000** in your browser.

## Verify Installation

Check service health:

```bash
# Web client should be accessible
curl http://localhost:3000

# Collaboration service
curl http://localhost:8081/health

# Geometry service  
curl http://localhost:8082/health
```

Expected responses: `200 OK` with JSON health status.

## Common Commands

```bash
# Install dependencies
pnpm install

# Start all services
pnpm dev

# Run tests
pnpm test

# Build production bundles
pnpm build

# Lint code
pnpm lint

# Type check
pnpm type-check

# Clean build artifacts
pnpm clean
```

## Individual Service Commands

```bash
# Web client only
pnpm --filter @flows/web dev

# Collaboration service only
pnpm --filter @flows/collaboration dev

# Run specific tests
pnpm --filter @flows/web test
```

## Docker Commands

```bash
# Start all infrastructure
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f collaboration

# Restart a service
docker-compose restart redis

# Remove volumes (clean slate)
docker-compose down -v
```

## Troubleshooting

### Port Conflicts

If ports are already in use:

```bash
# Check what's using a port
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Module Not Found Errors

```bash
# Clean install
rm -rf node_modules
pnpm install --frozen-lockfile
```

### Docker Issues

```bash
# Reset Docker
docker-compose down -v
docker system prune -a
docker-compose up -d
```

### TypeScript Errors

```bash
# Rebuild TypeScript projects
pnpm build
```

## Environment Variables

Create `.env.local` files in service directories:

**apps/web/.env.local**
```env
VITE_API_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8081
VITE_GEOMETRY_URL=http://localhost:8082
```

**services/collaboration/.env.local**
```env
PORT=8081
NODE_ENV=development
REDIS_HOST=localhost
REDIS_PORT=6379
KAFKA_BROKERS=localhost:9092
LOG_LEVEL=debug
```

## Next Steps

- Read [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed development guide
- Check [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines
- Review [Product Blueprint](./docs/cloud-native-industrial-cad-plan.md)
- Join our community discussions

## Getting Help

- **Issues**: https://github.com/flows-dev/flows/issues
- **Discussions**: https://github.com/flows-dev/flows/discussions
- **Documentation**: https://docs.flows.dev

## What's Running?

After successful setup, you should have:

✅ Web client at http://localhost:3000
✅ Collaboration service at http://localhost:8081
✅ Geometry service at http://localhost:8082
✅ Redis at localhost:6379
✅ PostgreSQL at localhost:5432
✅ Kafka at localhost:9092

Check the browser console and service logs for any errors.

## Performance Tips

For optimal development experience:
- Use Chrome/Edge for best WebGL performance
- Allocate at least 4GB RAM to Docker
- Use SSD for faster file operations
- Close unnecessary applications
- Enable hardware acceleration in browser

Happy coding! 🚀
